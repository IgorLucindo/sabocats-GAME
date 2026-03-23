// MapSystem — builds maps from data descriptors and manages map-related runtime logic.

class MapSystem {
    constructor(dependencies) {
        this.gameConfig = dependencies.gameConfig;

        this.collisionSystem   = dependencies.collisionSystem;
        this.interactionSystem = dependencies.interactionSystem;

        // Current map state (also mirrored to window globals)
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
        this._checkMapChange({ closeMapTimer: 1, openMapTimer: 1 });
    }

    shutdown() {}

    // ===== Map loading =====

    // Build and activate a named map from its descriptor.
    // Updates instance properties, window globals, and gameState.
    loadMap(mapName) {
        const data = this._maps[mapName];
        if (!data) throw new Error(`MapSystem: unknown map "${mapName}"`);

        this.collisionSystem.shutdown();
        this.interactionSystem.shutdown();

        // Build background
        const bg = new Background({
            width:  data.background.width,
            height: data.background.height,
            images: data.background.images,
            objects: data.background.objects,
            ...(data.background.scale !== undefined ? { scale: data.background.scale } : {})
        });

        // Build static background (sprite behind the layered bg, e.g. sky)
        const staticBg = data.staticBackground
            ? new Sprite({ position: data.staticBackground.position, texture: data.staticBackground.texture })
            : null;

        // Grid origin (plain object, no entity)
        const grid = data.grid ? { ...data.grid } : null;

        // Collision blocks
        if (data.collisionBlocks) {
            for (const block of data.collisionBlocks(bg)) {
                this.collisionSystem.createBlock(block);
            }
        }

        // Interactable areas
        if (data.interactableAreas) {
            for (const area of data.interactableAreas(bg, grid)) {
                this.interactionSystem.createArea(area);
            }
        }

        // Start area (may be null or a factory function)
        const startArea = typeof data.startArea === 'function'
            ? data.startArea(grid)
            : (data.startArea ?? null);

        // Store on instance
        this.background       = bg;
        this.staticBackground = staticBg;
        this.grid             = grid;
        this.startArea        = startArea;

        // Mirror to window globals (relied on by rendering, entities, and loop code)
        window.background       = bg;
        window.staticBackground = staticBg;
        window.grid             = grid;
        window.startArea        = startArea;

        // Keep gameState in sync
        gameState.set('map.background',       bg);
        gameState.set('map.staticBackground', staticBg);
        gameState.set('map.grid',             grid);
        gameState.set('map.startArea',        startArea);
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

        player = entityFactory.createPlayer({
            id: player.characterOption.id,
            position: { x: 0, y: 0 }
        });
        objectCrate = new ObjectCrate({ totalObjects: 4 });
        cameraSystem.setPosition({ key: "middle" });
        cursorSystem.resetProperties();

        const characterOptions = gameState.get('objects.characterOptions');
        for (const i in characterOptions) { characterOptions[i].selected = true; }

        const choseMaps = gameState.get('choseMaps');
        for (const i in choseMaps) { choseMaps[i].number = 0; }

        user.chooseMap.current   = undefined;
        user.chooseMap.previous  = undefined;
    }

    // ===== Private =====

    // Refresh vote count display when any count has changed
    _updateVoteUI() {
        const choseMaps = gameState.get('choseMaps');
        for (const i in choseMaps) {
            const choseMap = choseMaps[i];
            if (choseMap.previousNumber !== choseMap.number) { menuSystem.updateVoteUI(choseMap); }
            choseMap.previousNumber = choseMap.number;
        }
    }

    // Drive the map-change countdown/transition; called every frame
    _checkMapChange({ closeMapTimer, openMapTimer }) {
        const numberOfPlayers = Object.keys(users).length + 1;
        const mapVotes = gameState.get('time.mapVotes');
        if (mapVotes !== numberOfPlayers || numberOfPlayers === 0) return;

        if (!matchStateMachine.isTimerActive("mapChange") && !matchStateMachine.isTimerComplete("mapChange")) {
            matchStateMachine.startTimer("mapChange", closeMapTimer + openMapTimer);
        }

        const timer = matchStateMachine.updateTimer("mapChange");
        if (!timer) return;

        const elapsed = timer.elapsed;

        // Phase 1: fade out
        if (elapsed < closeMapTimer) {
            if (elapsed < deltaTime) { menuSystem.clear(); }
            menuSystem.fadeCanvas(Math.min(elapsed / closeMapTimer, 1));
        }
        // Phase 2: swap map + fade in
        else if (elapsed < closeMapTimer + openMapTimer) {
            if (Math.abs(elapsed - closeMapTimer) < deltaTime) { this._changeMap(); }
            menuSystem.unfadeCanvas(Math.min((elapsed - closeMapTimer) / openMapTimer, 1));
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
        this.loadMap(winners[0]);
        gameServices.joinMatch();
    }
}
