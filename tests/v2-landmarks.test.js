const test = require('node:test');
const assert = require('node:assert/strict');

const {
  renderOrderForLandmark,
  renderSequenceForLandmarks,
  shadowVectorFromLight
} = require('../v2-landmarks.js');

const landmark = {
  depthY: 660
};

test('player north of the landmark is rendered behind it', () => {
  assert.deepEqual(renderOrderForLandmark({ x: 300, y: 600 }, landmark), ['player', 'landmark']);
});

test('player south of the landmark is rendered in front of it', () => {
  assert.deepEqual(renderOrderForLandmark({ x: 300, y: 700 }, landmark), ['landmark', 'player']);
});

test('an upper-right light casts the landmark shadow to the left', () => {
  assert.equal(shadowVectorFromLight(1, -1, 180).x < 0, true);
});

test('an upper-right light casts the landmark shadow downward', () => {
  assert.equal(shadowVectorFromLight(1, -1, 180).y > 0, true);
});

test('a zero-length light direction produces a stable zero shadow', () => {
  assert.deepEqual(shadowVectorFromLight(0, 0, 180), { x: 0, y: 0 });
});

test('multiple landmarks are depth-sorted around the player', () => {
  const landmarks = [{ id: 'north', depthY: 500 }, { id: 'south', depthY: 700 }];
  assert.deepEqual(renderSequenceForLandmarks({ y: 600 }, landmarks), [
    'landmark:north', 'player', 'landmark:south'
  ]);
});

test('a landmark at the same depth is drawn before the player', () => {
  const landmarks = [{ id: 'equal', depthY: 600 }];
  assert.deepEqual(renderSequenceForLandmarks({ y: 600 }, landmarks), ['landmark:equal', 'player']);
});

test('an empty landmark collection renders only the player', () => {
  assert.deepEqual(renderSequenceForLandmarks({ y: 600 }, []), ['player']);
});
