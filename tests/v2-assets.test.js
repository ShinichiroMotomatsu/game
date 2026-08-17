const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createLazyImageLoader,
  directionalTileCoordinate,
  tileCoordinateForPoint,
  visibleTileCoordinates
} = require('../v2-assets.js');

class FakeImage {
  constructor() {
    this.listeners = new Map();
    this.assignedSources = [];
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  set src(value) {
    this.assignedSources.push(value);
  }

  get src() {
    return this.assignedSources.at(-1) || '';
  }

  dispatch(type) {
    this.listeners.get(type)?.({ target: this });
  }
}

test('an image stays idle until its asset is explicitly requested', async () => {
  const images = [];
  const loader = createLazyImageLoader({ createImage: () => {
    const image = new FakeImage();
    images.push(image);
    return image;
  } });

  const image = loader.register('modern:tile:0:0', 'map-0-0.png');
  assert.equal(image.src, '');

  const loading = loader.load('modern:tile:0:0');
  assert.equal(image.src, 'map-0-0.png');
  image.dispatch('load');
  await loading;

  assert.equal(loader.isLoaded('modern:tile:0:0'), true);
  assert.equal(images.length, 1);
});

test('repeated requests and aliases sharing a URL cause one image download', async () => {
  const loader = createLazyImageLoader({ createImage: () => new FakeImage() });
  const first = loader.register('enemy:rune-wolf', 'rune-wolf.png');
  const alias = loader.register('enemy:mist-watcher', 'rune-wolf.png');

  const firstRequest = loader.load('enemy:rune-wolf');
  const aliasRequest = loader.load('enemy:mist-watcher');
  assert.equal(first, alias);
  assert.equal(first.assignedSources.length, 1);

  first.dispatch('load');
  await Promise.all([firstRequest, aliasRequest]);
  assert.equal(loader.isLoaded('enemy:mist-watcher'), true);
});

test('a failed required image rejects without marking it loaded', async () => {
  const loader = createLazyImageLoader({ createImage: () => new FakeImage() });
  const image = loader.register('tile', 'missing.png');
  const loading = loader.load('tile');
  image.dispatch('error');

  await assert.rejects(loading, /missing\.png/);
  assert.equal(loader.isLoaded('tile'), false);
});

test('the initial field tile is selected from the player position and clamped to the map', () => {
  assert.deepEqual(tileCoordinateForPoint(3200, 300, 3010, 2090, 2, 2), { col: 1, row: 0 });
  assert.deepEqual(tileCoordinateForPoint(-20, 9000, 3010, 2090, 2, 2), { col: 0, row: 1 });
});

test('only tiles intersecting the viewport are selected for background loading', () => {
  assert.deepEqual(
    visibleTileCoordinates({ x: 2850, y: 1800, width: 500, height: 500 }, 3010, 2090, 2, 2),
    [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 1 }]
  );
});

test('movement prefetch chooses one neighboring tile on the dominant axis', () => {
  assert.deepEqual(directionalTileCoordinate({ col: 0, row: 0 }, 0.8, 0.2, 2, 2), { col: 1, row: 0 });
  assert.deepEqual(directionalTileCoordinate({ col: 1, row: 0 }, 0.9, 0, 2, 2), null);
  assert.deepEqual(directionalTileCoordinate({ col: 1, row: 1 }, 0, -1, 2, 2), { col: 1, row: 0 });
});
