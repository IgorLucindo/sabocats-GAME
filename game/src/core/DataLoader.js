// DataLoader — fetches config + all game data in parallel via manifest (JSON files and JS modules)

export let GameConfig = null;
export let data = null;

export class DataLoader {

    // Categories whose entries are JS modules (hooks, factories) instead of JSON files
    static MODULE_CATEGORIES = ['interactableAreas', 'objectiveAreas', 'placeableObjects', 'objectAttachments'];

    async load() {
        const base = '../data/';

        // Fetch manifest and config in parallel (first round-trip)
        const [manifest, config] = await Promise.all([
            this._fetch(base + 'manifest.json'),
            this._fetch(base + 'config.json')
        ]);

        // Build fetch list from manifest (second round-trip, all files in parallel)
        const fetches = [];
        const keys = [];
        for (const [category, names] of Object.entries(manifest)) {
            if (DataLoader.MODULE_CATEGORIES.includes(category)) continue; // loaded separately below
            for (const name of names) {
                fetches.push(this._fetch(`${base}${category}/${name}.json`));
                keys.push({ category, name });
            }
        }

        const results = await Promise.all(fetches);

        // Use pixelScaleMobile for small screens
        if (Math.max(window.screen.width, window.screen.height) <= 1000) {
            config.rendering.pixelScale = config.rendering.pixelScaleMobile;
        }

        const computedData = {
            maps: {},
            characters: {},
            placeableObjects: {},
            objectAttachments: {},
            particles: {},
            sounds: {},
            interactableAreas: {},
            objectiveAreas: {}
        };

        results.forEach((item, i) => {
            const { category, name } = keys[i];
            // placeableObjects use a numeric id embedded in the file; all others use filename as key
            computedData[category][name] = item;
        });

        // Load JS module categories via dynamic import
        const moduleLoads = DataLoader.MODULE_CATEGORIES.flatMap(category =>
            (manifest[category] || []).map(name =>
                import(`../../data/${category}/${name}.js`).then(m => ({ category, name, value: m.default }))
            )
        );
        for (const { category, name, value } of await Promise.all(moduleLoads)) {
            computedData[category][name] = value;
        }

        // Scale all base-pixel distances to screen pixels using pixelScale
        const ps = config.rendering.pixelScale;
        const scaleVec = v => { v.x *= ps; v.y *= ps; };
        const scaleIfNum = v => (typeof v === 'number' ? v * ps : v);

        // Config distances stored in base pixels — multiply to get screen pixels
        config.rendering.tileSize          *= ps;
        config.camera.lookDownOffset       *= ps;
        config.mouse.cameraboxWidth        *= ps;
        config.mouse.cameraboxHeight       *= ps;
        config.objectCrate.objectAreaWidth   *= ps;
        config.objectCrate.objectAreaHeight  *= ps;
        config.objectCrate.objectAreaOffsetX *= ps;
        config.objectCrate.objectAreaOffsetY *= ps;
        config.ui.keySprite.size    *= ps;
        config.ui.keySprite.offsetY *= ps;
        config.movement.walk.maxVelocity  *= ps;
        config.movement.walk.acceleration *= ps;
        config.movement.run.maxVelocity   *= ps;
        config.movement.run.acceleration  *= ps;
        config.movement.deceleration      *= ps;
        config.jump.jumpVelocity                *= ps;
        config.jump.wallSlideJumpVelocity       *= ps;
        config.jump.wallSlideSprintJumpVelocity *= ps;
        config.jump.wallSlideVelocity           *= ps;
        config.physics.gravity               *= ps;
        config.physics.maxFallSpeed          *= ps;
        config.physics.peakVelocityThreshold *= ps;

        // Particle offsets
        for (const p of Object.values(computedData.particles)) {
            if (p.position) scaleVec(p.position);
            if (p.positionFlipped) scaleVec(p.positionFlipped);
            if (p.rotatedPositions) {
                for (const rp of Object.values(p.rotatedPositions)) scaleVec(rp);
            }
        }

        // Character option positions
        for (const charData of Object.values(computedData.characters)) {
            if (charData.characterOption?.position) scaleVec(charData.characterOption.position);
        }

        // Map collision/damage blocks (literal numbers only — string expressions are resolved later by MapSystem)
        // Interactable area, spawn area, and finish area positions
        const scaleBlock = b => ({
            ...b,
            position: b.position ? { x: scaleIfNum(b.position.x), y: scaleIfNum(b.position.y) } : b.position,
            width:  b.width  !== undefined ? scaleIfNum(b.width)  : b.width,
            height: b.height !== undefined ? scaleIfNum(b.height) : b.height
        });
        for (const mapData of Object.values(computedData.maps)) {
            if (mapData.collisionBlocks) mapData.collisionBlocks = mapData.collisionBlocks.map(scaleBlock);
            if (mapData.damageBlocks)    mapData.damageBlocks    = mapData.damageBlocks.map(scaleBlock);
            if (mapData.interactableAreas) {
                for (const area of mapData.interactableAreas) {
                    if (area.position) { area.position.x = scaleIfNum(area.position.x); area.position.y = scaleIfNum(area.position.y); }
                }
            }
            for (const key of ['spawnArea', 'finishArea']) {
                if (mapData[key]?.position) { mapData[key].position.x = scaleIfNum(mapData[key].position.x); mapData[key].position.y = scaleIfNum(mapData[key].position.y); }
            }
        }

        GameConfig = this._deepFreeze(config);
        data = computedData;

        return { GameConfig, data };
    }

    _fetch(url) {
        return fetch(url).then(r => {
            if (!r.ok) { throw new Error(`DataLoader: failed to fetch ${url} (${r.status})`); }
            return r.json();
        });
    }

    _deepFreeze(obj) {
        Object.keys(obj).forEach(key => {
            if (obj[key] && typeof obj[key] === 'object') { this._deepFreeze(obj[key]); }
        });
        return Object.freeze(obj);
    }
}
