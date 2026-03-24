// timing.js — frame timing shared across GameLoop (writes) and consumers (reads)
export let deltaTime = 0;

export function updateDeltaTime(dt) {
    deltaTime = dt;
}
