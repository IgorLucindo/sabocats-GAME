// MapSystem — builds maps from data descriptors and manages map-related runtime logic.

import { LOBBY_MAP_DATA } from '../../data/maps/lobby.js';
import { data } from '../core/DataLoader.js';
import { Background } from '../entities/Background.js';
import { gameState } from '../core/GameState.js';
import { deltaTime } from '../core/timing.js';
import { gameServices } from '../core/GameServices.js';
import { ObjectCrate } from '../entities/objects/ObjectCrate.js';
import { ObjectiveArea } from './InteractionSystem.js';

export class MapSystem {
    constructor(dependencies) {
        this.gameConfig = dependencies.gameConfig;

        this.collisionSystem = dependencies.collisionSystem;
        this.interactionSystem = dependencies.interactionSystem;

        // Current map state (also mirrored to gameState)
        this.background = null;
        this.grid = null;
        this.spawnArea = null;

        // Map descriptor registry — populated in initialize()
        this._maps = {};
    }

    // ===== System interface =====

    initialize() {
        this._maps = { lobby: LOBBY_MAP_DATA };
        const choseMaps = gameState.get('choseMaps');
        for (const [name, mapData] of Object.entries(data.maps)) {
            this._maps[name] = mapData;
            choseMaps[name] = { map: name, number: 0, previousNumber: 0 };
        }
    }

    // Called each frame from logicLoop (replaces updateVoteUI + checkMapChange calls)
    update() {
        if (gameState.get('game.inLobby')) {
            this._updateVoteUI();
        }
        this._checkMapChange({ closeMapTimer: this.gameConfig.mapTransition.closeTime, openMapTimer: this.gameConfig.mapTransition.openTime });
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
            objects: descriptor.background.objects,
            sky: descriptor.background.sky
        });

        // Grid origin (plain object, no entity)
        const grid = descriptor.grid ? { ...descriptor.grid } : null;

        // Collision blocks
        if (descriptor.collisionBlocks) {
            for (const block of descriptor.collisionBlocks(bg, grid, mapCtx)) {
                this.collisionSystem.createBlock(block);
            }
        }

        // Damage blocks
        if (descriptor.damageBlocks) {
            for (const block of descriptor.damageBlocks(bg, grid, mapCtx)) {
                this.collisionSystem.createDamageBlock(block);
            }
        }

        // Interactable areas from map descriptor
        if (descriptor.interactableAreas) {
            for (const area of descriptor.interactableAreas(bg, grid, mapCtx)) {
                this.interactionSystem.createArea(area);
            }
        }

        // Spawn area
        const spawnAreaData = typeof descriptor.spawnArea === 'function'
            ? descriptor.spawnArea(grid, mapCtx)
            : (descriptor.spawnArea ?? null);
        const spawnArea = spawnAreaData ? new ObjectiveArea({
            ...spawnAreaData,
            onEnter: () => { gameServices.player.invulnerable = true; },
            onLeave: () => { gameServices.player.invulnerable = false; }
        }) : null;
        if (spawnArea) this.interactionSystem.areas.push(spawnArea);

        // Finish area
        const finishAreaData = typeof descriptor.finishArea === 'function'
            ? descriptor.finishArea(grid, mapCtx)
            : (descriptor.finishArea ?? null);
        const finishArea = finishAreaData ? new ObjectiveArea({
            ...finishAreaData,
            onEnter: () => {
                const player = mapCtx.player;
                if (!player.finished) {
                    player.finished = true;
                    gameServices.soundSystem.play('objective');
                    mapCtx.sendFinishedPlayerToServer();
                }
            }
        }) : null;
        if (finishArea) this.interactionSystem.areas.push(finishArea);

        // Store on instance
        this.background  = bg;
        this.grid        = grid;
        this.spawnArea   = spawnArea;
        this.finishArea  = finishArea;

        // Update gameServices properties for live access
        gameServices.background  = bg;
        gameServices.grid        = grid;
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
        gameState.set('game.inLobby', false);

        // collision blocks already cleared by loadMap() → collisionSystem.shutdown()
        gameServices.matchObjects = [];
        const crateSeed = gameState.get('match.crateSeed');
        gameServices.objectCrate = new ObjectCrate({ totalObjects: gameServices.gameConfig.room.maxPlayers, seed: crateSeed });
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
    _checkMapChange({ closeMapTimer, openMapTimer }) {
        const users = gameServices.users;
        const numberOfPlayers = Object.keys(users).length;
        const mapVotes = gameState.get('time.mapVotes');
        if (mapVotes !== numberOfPlayers || numberOfPlayers === 0) return;

        const matchStateMachine = gameServices.matchStateMachine;
        if (!matchStateMachine.isTimerActive("mapChange") && !matchStateMachine.isTimerComplete("mapChange")) {
            matchStateMachine.startTimer("mapChange", closeMapTimer + openMapTimer);
            this._transitionSoundPlayed = false;
        }

        const timer = matchStateMachine.updateTimer("mapChange");
        if (!timer) return;

        const elapsed = timer.elapsed;
        const totalDuration = closeMapTimer + openMapTimer;

        // Play transition sound at 30% through the total duration
        if (!this._transitionSoundPlayed && elapsed >= totalDuration * 0.05) {
            gameServices.soundSystem.play('transition');
            this._transitionSoundPlayed = true;
        }

        // Phase 1: fade out
        if (elapsed < closeMapTimer) {
            gameServices.menuSystem.fadeCanvas(Math.min(elapsed / closeMapTimer, 1));
        }
        // Phase 2: swap map + fade in
        else if (elapsed < closeMapTimer + openMapTimer) {
            if (Math.abs(elapsed - closeMapTimer) < deltaTime) { this._changeMap(); }
            gameServices.menuSystem.unfadeCanvas(Math.min((elapsed - closeMapTimer) / openMapTimer, 1));
        }
        // Complete
        else {
            matchStateMachine.resetTimer("mapChange");
            gameState.set('time.mapVotes', 0);
        }
    }

    // Tally votes, pick winner (random tiebreak), load the winning map
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

        winners.sort(() => Math.random() - 0.5);

        const mapCtx = {
            properties: this.gameConfig.rendering,
            get menuSystem()     { return gameServices.menuSystem; },
            get player()         { return gameServices.player; },
            get particleSystem() { return gameServices.particleSystem; },
            get soundSystem()    { return gameServices.soundSystem; },
            get cameraSystem()   { return gameServices.cameraSystem; },
            sendFinishedPlayerToServer: () => gameServices.socketHandler.sendUpdatePlayer(),
        };
        this.loadMap(winners[0], mapCtx);
        gameServices.joinMatch();
    }
}
