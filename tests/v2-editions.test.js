const test = require('node:test');
const assert = require('node:assert/strict');

const {
  editionDefinition,
  editionLandmarkImage,
  normalizeEdition
} = require('../v2-editions.js');

test('Modern Day is the default edition', () => {
  assert.equal(normalizeEdition(undefined), 'modern');
});

test('Past Evening is selectable', () => {
  assert.equal(normalizeEdition('past'), 'past');
});

test('an unknown edition falls back to Modern Day', () => {
  assert.equal(normalizeEdition('future'), 'modern');
});

test('both editions use four-tile seamless map directories', () => {
  assert.deepEqual(
    [editionDefinition('modern').tileDirectory, editionDefinition('past').tileDirectory],
    ['day-runtime-tiles', 'past-evening-runtime-tiles']
  );
});

test('Past Evening uses its own medieval landmark art with matching filenames', () => {
  assert.equal(editionLandmarkImage('past', 'tokyo-tower.png'),
    'assets/v2/past-landmarks/tokyo-tower.png');
});

test('Past Evening can override landmark display size without moving its ground anchor', () => {
  assert.deepEqual(editionDefinition('past').landmarkSizeOverrides['tokyo-tower'], {
    widthScale: 0.59,
    heightScale: 0.53
  });
});

test('Modern Day keeps the contemporary landmark art', () => {
  assert.equal(editionLandmarkImage('modern', 'tokyo-tower.png'),
    'assets/v2/landmarks/tokyo-tower.png');
});

test('only Modern Day renders contemporary road labels', () => {
  assert.equal(editionDefinition('modern').showMapLabels, true);
  assert.equal(editionDefinition('past').showMapLabels, false);
});

test('visible roaming encounters are exclusive to Past Evening', () => {
  assert.equal(editionDefinition('modern').hasEncounters, false);
  assert.equal(editionDefinition('past').hasEncounters, true);
});
