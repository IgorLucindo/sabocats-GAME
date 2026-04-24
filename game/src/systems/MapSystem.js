// MapSystem — builds maps from data descriptors and manages map-related runtime logic.

import { data } from '../core/DataLoader.js';
import { Background } from '../entities/Background.js';
import { gameState } from '../core/GameState.js';
import { gameServices } from '../core/GameServices.js';
import { syncedRandom } from '../helpers.js';
import { ObjectCrate } from '../entities/objects/ObjectCrate.js';
import { ObjectiveArea } from './InteractionSystem.js';

export class MapSystem {
    constructor(dependencies) {
        this.gameConfig = dependencies.gameConfig;

        this.collisionSystem = dependencies.collisionSystem;
        this.interactionSystem = dependencies.interactionSystem;

        // Current map state (also mirrored to gameState)
        this.background = null;
        this.spawnArea = null;

        // Map descriptor registry — populated in initialize()
        this._maps = {};
    }

    // ===== System interface =====

    initialize() {
        const choseMaps = gameState.get('choseMaps');
        for (const [name, mapData] of Object.entries(data.maps)) {
            this._maps[name] = mapData;
            if (name !== 'lobby') choseMaps[name] = { map: name, number: 0, previousNumber: 0 };
        }
    }

    // Called each frame from logicLoop (replaces updateVoteUI + checkMapChange calls)
    update() {
        if (gameServices.matchStateMachine.getState() === 'lobby') {
            this._updateVoteUI();
        }
        this._checkMapChange();
    }

    shutdown() {}

    // ===== Map loading =====

    // Build and activate a named map from its descriptor.
    // Updates instance properties and gameState.
    loadMap(mapName, mapCtx) {
        const descriptor = this._maps[mapName];
        if (!descriptor) throw new Error(`MapSystem: unknown map "${mapName}"`);

        this.collisionSystem.shutdown();
        this.interactionSystem.shutdown();

        // Build background
        const bg = new Background({
            width: descriptor.background.width,
            height: descriptor.background.height,
            images: descriptor.background.images,
            sky: descriptor.background.sky
        });

        // Formula resolution context
        const fctx = { bg, tileSize: mapCtx.properties.tileSize, pixelScale: mapCtx.properties.pixelScale };

        // Collision blocks
        if (descriptor.collisionBlocks) {
            for (const block of this._resolveFormulas(descriptor.collisionBlocks, fctx)) {
                this.collisionSystem.createBlock(block);
            }
        }

        // Damage blocks
        if (descriptor.damageBlocks) {
            for (const block of this._resolveFormulas(descriptor.damageBlocks, fctx)) {
                this.collisionSystem.createDamageBlock(block);
            }
        }

        // Interactable areas
        if (descriptor.interactableAreas) {
            for (const entry of descriptor.interactableAreas) {
                const factory = data.interactableAreas[entry.id];
                const areaData = factory(mapCtx, bg);
                const position = this._resolveFormulas(entry.position, fctx);
                this.interactionSystem.createArea({ ...areaData, position });
            }
        }

        // Spawn area
        const spawnEntry = descriptor.spawnArea;
        const spawnArea = spawnEntry ? new ObjectiveArea({
            ...data.objectiveAreas[spawnEntry.id](mapCtx, bg),
            position: this._resolveFormulas(spawnEntry.position, fctx)
        }) : null;
        if (spawnArea) this.interactionSystem.areas.push(spawnArea);

        // Finish area
        const finishEntry = descriptor.finishArea;
        const finishArea = finishEntry ? new ObjectiveArea({
            ...data.objectiveAreas[finishEntry.id](mapCtx, bg),
            position: this._resolveFormulas(finishEntry.position, fctx)
        }) : null;
        if (finishArea) this.interactionSystem.areas.push(finishArea);

        // Store on instance
        this.background  = bg;
        this.spawnArea   = spawnArea;
        this.finishArea  = finishArea;

        // Update gameServices properties for live access
        gameServices.background  = bg;
        gameServices.spawnArea   = spawnArea;
        gameServices.finishArea  = finishArea;
    }

    // ===== Voting =====

    // Record a map vote (called by local UI and by incoming network events)
    vote(chooseMap) {
        const choseMaps = gameState.get('choseMaps');
        choseMaps[chooseMap.current].number++;
        if (chooseMap.previous) {
            choseMaps[chooseMap.previous].number--;
        } else {
            gameState.set('time.mapVotes', gameState.get('time.mapVotes') + 1);
        }
    }

    // ===== Match reset =====

    // Reset all map-dependent state when transitioning into a match
    resetProperties() {
        // collision blocks already cleared by loadMap() → collisionSystem.shutdown()
        gameServices.matchObjects = [];
        gameServices.objectCrate = new ObjectCrate({ totalObjects: gameServices.gameConfig.room.maxPlayers });
        gameServices.cameraSystem.setPosition({ key: "middle" });
        gameServices.cursorSystem.resetProperties();

        const characterOptions = gameState.get('characterOptions');
        for (const i in characterOptions) { characterOptions[i].selected = true; }

        const choseMaps = gameState.get('choseMaps');
        for (const i in choseMaps) { choseMaps[i].number = 0; }

        const user = gameServices.user;
        user.chooseMap.current   = undefined;
        user.chooseMap.previous  = undefined;

        gameServices.menuSystem.clearVoteUI();
    }

    // ===== Private =====

    // Deep-walk data and evaluate any string starting with '$' as a JS expression.
    // Available variables: bg, tileSize, pixelScale.
    _resolveFormulas(data, ctx) {
        if (typeof data === 'string' && data.startsWith('$')) {
            const expr = data.slice(1);
            // eslint-disable-next-line no-new-func
            return new Function('bg', 'tileSize', 'pixelScale', `return ${expr}`)(
                ctx.bg, ctx.tileSize, ctx.pixelScale
            );
        }
        if (Array.isArray(data)) return data.map(item => this._resolveFormulas(item, ctx));
        if (data !== null && typeof data === 'object') {
            return Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, this._resolveFormulas(v, ctx)])
            );
        }
        return data;
    }

    // Refresh vote count display when any count has changed
    _updateVoteUI() {
        const choseMaps = gameState.get('choseMaps');
        for (const i in choseMaps) {
            const choseMap = choseMaps[i];
            if (choseMap.previousNumber !== choseMap.number) { gameServices.menuSystem.updateVoteUI(choseMap); }
            choseMap.previousNumber = choseMap.number;
        }
    }

    // Drive the map-change countdown/transition; called every frame
    _checkMapChange() {
        const users = gameServices.users;
        const numberOfPlayers = Object.keys(users).length;
        const mapVotes = gameState.get('time.mapVotes');
        const closeMapTime = this.gameConfig.mapTransition.closeTime;
        const openMapTime = this.gameConfig.mapTransition.openTime;
        const totalDuration = closeMapTime + openMapTime;
        if (mapVotes !== numberOfPlayers || numberOfPlayers === 0) return;

        const matchStateMachine = gameServices.matchStateMachine;
        if (!matchStateMachine.isTimerActive("mapChange") && !matchStateMachine.isTimerComplete("mapChange")) {
            matchStateMachine.startTimer("mapChange", totalDuration);
            this._transitionSoundPlayed = false;
            this._fadeInTriggered = false;
            gameServices.cameraSystem.fade(closeMapTime, 0);
        }

        const timer = matchStateMachine.updateTimer("mapChange");
        if (!timer) return;

        const elapsed = timer.elapsed;

        // Play transition sound at 5% through the total duration
        if (!this._transitionSoundPlayed && elapsed >= totalDuration * 0.05) {
            gameServices.soundSystem.play('transition');
            this._transitionSoundPlayed = true;
        }

        // Phase 2: swap map + fade in
        if (!this._fadeInTriggered && elapsed >= closeMapTime) {
            this._changeMap();
            gameServices.cameraSystem.fade(openMapTime, 1);
            this._fadeInTriggered = true;
        }

        // Complete
        if (elapsed >= totalDuration) {
            matchStateMachine.resetTimer("mapChange");
            gameState.set('time.mapVotes', 0);
        }
    }

    // Tally votes, pick winner (seeded tiebreak so all clients pick same map), load the winning map
    _changeMap() {
        const choseMaps = gameState.get('choseMaps');
        let topVotes = 0;
        let winners  = [];

        for (const i in choseMaps) {
            if (choseMaps[i].number > topVotes) {
                topVotes = choseMaps[i].number;
                winners  = [choseMaps[i].map];
            } else if (choseMaps[i].number === topVotes) {
                winners.push(choseMaps[i].map);
            }
        }

        // Use seeded random for tiebreak so all clients pick the same map
        const seed = gameState.get('match.seed');
        const rng = syncedRandom(seed + 50000);
        const winnerIndex = Math.floor(rng * winners.length);
        const selectedMap = winners[winnerIndex];

        const mapCtx = {
            properties: this.gameConfig.rendering,
            get menuSystem()     { return gameServices.menuSystem; },
            get player()         { return gameServices.player; },
            get particleSystem() { return gameServices.particleSystem; },
            get soundSystem()    { return gameServices.soundSystem; },
            get cameraSystem()   { return gameServices.cameraSystem; },
            sendFinishedPlayerToServer: () => gameServices.socketHandler.sendUpdatePlayer(),
        };
        this.loadMap(selectedMap, mapCtx);
        gameServices.joinMatch();
    }
}
