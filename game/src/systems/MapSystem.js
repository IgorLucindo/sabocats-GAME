// MapSystem — builds maps from data descriptors and manages map-related runtime logic.

import { LOBBY_MAP_DATA } from '../../data/maps/lobby.js';
import { FOREST_MAP_DATA } from '../../data/maps/forest.js';
import { Background } from '../entities/Background.js';
import { Sprite } from '../entities/Sprite.js';
import { gameState } from '../core/GameState.js';
import { deltaTime } from '../core/timing.js';
import { gameServices } from '../core/GameServices.js';
import { ObjectCrate } from '../entities/objects/ObjectCrate.js';

export class MapSystem {
    constructor(dependencies) {
        this.gameConfig = dependencies.gameConfig;

        this.collisionSystem   = dependencies.collisionSystem;
        this.interactionSystem = dependencies.interactionSystem;

        // Current map state (also mirrored to gameState)
        this.background       = null;
        this.staticBackground = null;
        this.grid             = null;
        this.startArea        = null;

        // Map descriptor registry — populated in initialize()
        this._maps = {};
    }

    // ===== System interface =====

    initialize() {
        this._maps = {
            lobby:  LOBBY_MAP_DATA,
            forest: FOREST_MAP_DATA
        };
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

        // Determine scale: descriptor may override, otherwise use mapCtx.properties.pixelScale
        const scale = (descriptor.background.scale !== undefined)
            ? descriptor.background.scale
            : (mapCtx ? mapCtx.properties.pixelScale : 1);

        // Build background
        const bg = new Background({
            width:   descriptor.background.width,
            height:  descriptor.background.height,
            images:  descriptor.background.images,
            objects: descriptor.background.objects,
            scale:   scale
        });

        // Build static background (sprite behind the layered bg, e.g. sky)
        const staticBg = descriptor.staticBackground
            ? new Sprite({ position: descriptor.staticBackground.position, texture: descriptor.staticBackground.texture })
            : null;

        // Grid origin (plain object, no entity)
        const grid = descriptor.grid ? { ...descriptor.grid } : null;

        // Collision blocks
        if (descriptor.collisionBlocks) {
            for (const block of descriptor.collisionBlocks(bg, mapCtx)) {
                this.collisionSystem.createBlock(block);
            }
        }

        // Interactable areas
        if (descriptor.interactableAreas) {
            for (const area of descriptor.interactableAreas(bg, grid, mapCtx)) {
                this.interactionSystem.createArea(area);
            }
        }

        // Start area (may be null or a factory function)
        const startArea = typeof descriptor.startArea === 'function'
            ? descriptor.startArea(grid, mapCtx)
            : (descriptor.startArea ?? null);

        // Store on instance
        this.background       = bg;
        this.staticBackground = staticBg;
        this.grid             = grid;
        this.startArea        = startArea;

        gameState.set('map.startArea', startArea);

        // Update gameServices properties for live access
        gameServices.background       = bg;
        gameServices.staticBackground = staticBg;
        gameServices.grid             = grid;
        gameServices.startArea        = startArea;
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
        gameServices.objectCrate = new ObjectCrate({ totalObjects: 4, background: this.background });
        gameServices.cameraSystem.setPosition({ key: "middle" });
        gameServices.cursorSystem.resetProperties();

        const characterOptions = gameState.get('objects.characterOptions');
        for (const i in characterOptions) { characterOptions[i].selected = true; }

        const choseMaps = gameState.get('choseMaps');
        for (const i in choseMaps) { choseMaps[i].number = 0; }

        const user = gameServices.user;
        user.chooseMap.current   = undefined;
        user.chooseMap.previous  = undefined;
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
        }

        const timer = matchStateMachine.updateTimer("mapChange");
        if (!timer) return;

        const elapsed = timer.elapsed;

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
            get menuSystem() { return gameServices.menuSystem; },
            get player() { return gameServices.player; },
            sendFinishedPlayerToServer: () => gameServices.socketHandler.sendUpdatePlayer(),
        };
        this.loadMap(winners[0], mapCtx);
        gameServices.joinMatch();
    }
}
