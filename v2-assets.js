(function exposeAssetLoader(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_ASSETS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function tileCoordinateForPoint(x, y, tileWidth, tileHeight, columns, rows) {
    return {
      col: clamp(Math.floor(Number(x) / tileWidth), 0, columns - 1),
      row: clamp(Math.floor(Number(y) / tileHeight), 0, rows - 1)
    };
  }

  function visibleTileCoordinates(viewport, tileWidth, tileHeight, columns, rows) {
    const left = clamp(Math.floor(viewport.x / tileWidth), 0, columns - 1);
    const top = clamp(Math.floor(viewport.y / tileHeight), 0, rows - 1);
    const right = clamp(Math.floor((viewport.x + Math.max(0, viewport.width) - 1) / tileWidth), 0, columns - 1);
    const bottom = clamp(Math.floor((viewport.y + Math.max(0, viewport.height) - 1) / tileHeight), 0, rows - 1);
    const coordinates = [];
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) coordinates.push({ col, row });
    }
    return coordinates;
  }

  function directionalTileCoordinate(origin, dx, dy, columns, rows) {
    if (!dx && !dy) return null;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const col = origin.col + (horizontal ? Math.sign(dx) : 0);
    const row = origin.row + (horizontal ? 0 : Math.sign(dy));
    if (col < 0 || row < 0 || col >= columns || row >= rows) return null;
    return { col, row };
  }

  function createLazyImageLoader(options = {}) {
    const createImage = options.createImage || (() => new Image());
    const recordsByKey = new Map();
    const recordsBySource = new Map();

    function register(key, source) {
      const existing = recordsByKey.get(key);
      if (existing) {
        if (existing.source !== source) throw new Error(`Asset key already registered with another source: ${key}`);
        return existing.image;
      }
      let record = recordsBySource.get(source);
      if (!record) {
        record = { image: createImage(), source, state: 'idle', promise: null };
        recordsBySource.set(source, record);
      }
      recordsByKey.set(key, record);
      return record.image;
    }

    function load(key) {
      const record = recordsByKey.get(key);
      if (!record) return Promise.reject(new Error(`Unknown asset: ${key}`));
      if (record.state === 'loaded') return Promise.resolve(record.image);
      if (record.state === 'loading') return record.promise;
      if (record.state === 'error') return Promise.reject(new Error(`Asset failed to load: ${record.source}`));

      record.state = 'loading';
      record.promise = new Promise((resolve, reject) => {
        record.image.addEventListener('load', () => {
          record.state = 'loaded';
          resolve(record.image);
        }, { once: true });
        record.image.addEventListener('error', () => {
          record.state = 'error';
          reject(new Error(`Asset failed to load: ${record.source}`));
        }, { once: true });
        record.image.src = record.source;
      });
      return record.promise;
    }

    function loadMany(keys) {
      return Promise.all([...new Set(keys)].map(load));
    }

    function image(key) {
      return recordsByKey.get(key)?.image || null;
    }

    function isLoaded(key) {
      return recordsByKey.get(key)?.state === 'loaded';
    }

    return { image, isLoaded, load, loadMany, register };
  }

  return {
    createLazyImageLoader,
    directionalTileCoordinate,
    tileCoordinateForPoint,
    visibleTileCoordinates
  };
});
