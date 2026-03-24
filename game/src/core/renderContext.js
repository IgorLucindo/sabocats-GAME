// Shared render context — populated once by GameServices.setupCanvas(), read by all draw code
export let ctx = null;
export let canvas = null;
export let debugMode = false;
export const scaledCanvas = { width: 0, height: 0 };

export function setRenderContext(cvs, context, dm) {
    canvas = cvs;
    ctx    = context;
    debugMode = dm;
}
