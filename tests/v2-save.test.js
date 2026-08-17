const test = require('node:test');
const assert = require('node:assert/strict');

const { PAST_SAVE_KEYS, consumePastRestart } = require('../v2-save.js');

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: key => values.get(key) ?? null,
    removeItem: key => values.delete(key),
    values
  };
}

test('ordinary Past Evening entry preserves the existing save', () => {
  const storage = memoryStorage({ 'roppongi-past-story': 'saved' });
  const result = consumePastRestart('?edition=past', storage);
  assert.equal(result.restarted, false);
  assert.equal(storage.getItem('roppongi-past-story'), 'saved');
});

test('restart entry clears every Past Evening progress key and consumes the URL flag', () => {
  const storage = memoryStorage(Object.fromEntries(PAST_SAVE_KEYS.map(key => [key, 'saved'])));
  const result = consumePastRestart('?edition=past&newGame=past', storage);
  assert.equal(result.restarted, true);
  assert.equal(result.edition, 'past');
  assert.equal(result.search, '?edition=past');
  assert.ok(PAST_SAVE_KEYS.every(key => storage.getItem(key) === null));
});
