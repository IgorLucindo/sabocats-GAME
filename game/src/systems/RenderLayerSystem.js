// RenderLayerSystem - Dynamic render layer ordering and management

class RenderLayerSystem {
  constructor({ gameConfig }) {
    this.gameConfig = gameConfig;
    this.layers = [];
    this.layerMap = {};
  }

  initialize() {
    // Layers will be added during setup
  }

  update() {
    // Render layers don't need updates, just rendering
  }

  shutdown() {
    this.layers = [];
    this.layerMap = {};
  }

  /**
   * Add a render layer to the system
   * @param {string} name - Unique layer name
   * @param {number} depth - Layer depth (lower = renders first/behind)
   * @param {Function} renderFunction - Function to call during render
   * @param {boolean} active - Whether layer starts active
   */
  addLayer(name, depth, renderFunction, active = true) {
    const layer = { name, depth, render: renderFunction, active };
    this.layers.push(layer);
    this.layerMap[name] = layer;

    // Keep layers sorted by depth
    this.layers.sort((a, b) => a.depth - b.depth);
  }

  /**
   * Remove a layer by name
   * @param {string} name - Layer name
   */
  removeLayer(name) {
    const index = this.layers.findIndex(l => l.name === name);
    if (index > -1) {
      this.layers.splice(index, 1);
      delete this.layerMap[name];
    }
  }

  /**
   * Set layer active/inactive
   * @param {string} name - Layer name
   * @param {boolean} active - Whether to activate or deactivate
   */
  setLayerActive(name, active) {
    const layer = this.layerMap[name];
    if (layer) {
      layer.active = active;
    }
  }

  /**
   * Check if a layer is active
   * @param {string} name - Layer name
   * @returns {boolean}
   */
  isLayerActive(name) {
    const layer = this.layerMap[name];
    return layer ? layer.active : false;
  }

  /**
   * Render all active layers in order
   */
  render() {
    for (let layer of this.layers) {
      if (layer.active && layer.render) {
        layer.render();
      }
    }
  }

  /**
   * Render specific layer by name
   * @param {string} name - Layer name
   */
  renderLayer(name) {
    const layer = this.layerMap[name];
    if (layer && layer.render) {
      layer.render();
    }
  }

  /**
   * Get all layers
   * @returns {Array} - Array of layer objects
   */
  getLayers() {
    return [...this.layers];
  }

  /**
   * Get layer count
   * @returns {number}
   */
  getLayerCount() {
    return this.layers.length;
  }

  /**
   * Reorder layers by new depth values
   * Useful if render order needs to change dynamically
   */
  reorderLayers() {
    this.layers.sort((a, b) => a.depth - b.depth);
  }

  /**
   * Update layer depth
   * @param {string} name - Layer name
   * @param {number} newDepth - New depth value
   */
  setLayerDepth(name, newDepth) {
    const layer = this.layerMap[name];
    if (layer) {
      layer.depth = newDepth;
      this.reorderLayers();
    }
  }

  query(question) {
    switch (question) {
      case 'layerCount':
        return this.getLayerCount();
      case 'activeLayerCount':
        return this.layers.filter(l => l.active).length;
      default:
        return null;
    }
  }
}
