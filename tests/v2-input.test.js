const test = require('node:test');
const assert = require('node:assert/strict');

const { dragMovementVector } = require('../v2-input.js');

test('a drag inside the dead zone does not move the player', () => {
  assert.deepEqual(
    dragMovementVector({ x: 20, y: 30 }, { x: 25, y: 34 }),
    { x: 0, y: 0, strength: 0 }
  );
});

test('a horizontal drag produces a normalized rightward movement vector', () => {
  const movement = dragMovementVector({ x: 10, y: 10 }, { x: 82, y: 10 });
  assert.deepEqual(movement, { x: 1, y: 0, strength: 1 });
});

test('a partial diagonal drag preserves direction and analog speed', () => {
  const movement = dragMovementVector({ x: 0, y: 0 }, { x: 30, y: 40 });
  assert.equal(movement.x, 0.6);
  assert.equal(movement.y, 0.8);
  assert.ok(movement.strength > 0 && movement.strength < 1);
});

test('invalid drag coordinates fail closed without movement', () => {
  assert.deepEqual(
    dragMovementVector({ x: Number.NaN, y: 0 }, { x: 40, y: 0 }),
    { x: 0, y: 0, strength: 0 }
  );
});
