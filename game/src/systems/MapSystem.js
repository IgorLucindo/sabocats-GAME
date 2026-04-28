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
        this.finishArea = null;
        this.mapChooserArea = null;

        // Map descriptor registry — populated in initialize()
        this._maps = {};
    }

    // ===== System interface =====

    initialize() {
        for (const [name, mapData] of Object.entries(data.maps)) {
            this._maps[name] = mapData;
        }
    }

    // Called each frame from logicLoop - only runs when map transition timer is active
    update() {
        const matchStateMachine = gameServices.matchStateMachine;
        if (matchStateMachine.isTimerActive("mapChange") || matchStateMachine.isTimerComplete("mapChange")) {
            this._checkMapChange();
        }
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
        this.mapChooserArea = null;
        if (descriptor.interactableAreas) {
            for (const entry of descriptor.interactableAreas) {
                const factory = data.interactableAreas[entry.id];
                const areaData = factory(mapCtx, bg);
                const position = this._resolveFormulas(entry.position, fctx);
                const area = this.interactionSystem.createArea({ ...areaData, position });
                if (entry.id === 'mapChooser') this.mapChooserArea = area;
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
    vote(userId, mapName) {
        const users = gameServices.users;
        if (!users[userId]) return;

        users[userId].vote = mapName;
        gameServices.soundSystem.play('globeSpin');
        this.mapChooserArea.switchSprite('choose');
        this.mapChooserArea.playInterrupt('spin');
        this._updateVoteUI();
        this._checkMapChange(); // Start transition timer if all players voted
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

        const users = gameServices.users;
        for (const id in users) { users[id].vote = null; }

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

    // Refresh vote count display (event-driven, called from vote())
    _updateVoteUI() {
        const users = gameServices.users;
        const voteCounts = {};

        // Count votes for each map
        for (const id in users) {
            const vote = users[id].vote;
            if (vote) {
                voteCounts[vote] = (voteCounts[vote] || 0) + 1;
            }
        }

        // Update UI for maps with votes
        for (const map in voteCounts) {
            gameServices.menuSystem.updateVoteUI({ map, number: voteCounts[map] });
        }

        // Clear UI for maps with no votes (check all known maps)
        for (const map in this._maps) {
            if (map !== 'lobby' && !voteCounts[map]) {
                gameServices.menuSystem.updateVoteUI({ map, number: 0 });
            }
        }
    }

    // Drive the map-change countdown/transition; called from vote() and update()
    _checkMapChange() {
        const users = gameServices.users;
        const numberOfPlayers = Object.keys(users).length;
        if (numberOfPlayers === 0) return;

        // Check if all players have voted
        const allVoted = Object.values(users).every(u => u.vote !== null);
        if (!allVoted) return;

        const closeMapTime = this.gameConfig.mapTransition.closeTime;
        const openMapTime = this.gameConfig.mapTransition.openTime;
        const totalDuration = closeMapTime + openMapTime;

        const matchStateMachine = gameServices.matchStateMachine;
        if (!matchStateMachine.isTimerActive("mapChange") && !matchStateMachine.isTimerComplete("mapChange")) {
            matchStateMachine.startTimer("mapChange", totalDuration);
            this._transitionSoundPlayed = false;
            this._fadeInTriggered = false;
            gameServices.menuSystem.closeMapMenu();
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
        }
    }

    // Tally votes, pick winner (seeded tiebreak so all clients pick same map), load the winning map
    _changeMap() {
        const users = gameServices.users;
        const voteCounts = {};

        // Count votes
        for (const id in users) {
            const vote = users[id].vote;
            if (vote) {
                voteCounts[vote] = (voteCounts[vote] || 0) + 1;
            }
        }

        // Find winner(s)
        let topVotes = 0;
        let winners  = [];

        for (const map in voteCounts) {
            if (voteCounts[map] > topVotes) {
                topVotes = voteCounts[map];
                winners  = [map];
            } else if (voteCounts[map] === topVotes) {
                winners.push(map);
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
