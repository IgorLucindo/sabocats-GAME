// DataLoader — fetches config + all game data JSON in parallel via manifest

export let GameConfig = null;
export let data = null;

export class DataLoader {

    // Named movement functions resolved from movementType keys in JSON
    static MOVEMENT_TYPES = {
        cosineX: (time) => ({ x: 2 * (1 - Math.cos(time / 100)), y: 0 })
    };

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
            for (const name of names) {
                fetches.push(this._fetch(`${base}${category}/${name}.json`));
                keys.push({ category, name });
            }
        }

        const results = await Promise.all(fetches);

        const computedData = { characters: {}, placeableObjects: {}, objectAttachments: {}, particles: {} };

        results.forEach((item, i) => {
            const { category, name } = keys[i];
            // placeableObjects use a numeric id embedded in the file; all others use filename as key
            computedData[category][name] = item;
        });

        // Resolve movement type strings to functions before handing off to consumers
        for (const att of Object.values(computedData.objectAttachments)) {
            if (att.movementType) {
                att.movement = DataLoader.MOVEMENT_TYPES[att.movementType] || (() => ({ x: 0, y: 0 }));
                delete att.movementType;
            }
        }

        // Multiply tileSize by pixelScale to get final tile size
        config.rendering.tileSize *= config.rendering.pixelScale;

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
