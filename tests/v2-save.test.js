const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CLOUD_SAVE_SCHEMA_VERSION,
  PAST_SAVE_KEYS,
  buildCloudSaveEnvelope,
  chooseNewestSave,
  consumePastRestart,
  restoreCloudSaveEnvelope
} = require('../v2-save.js');

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

test('cloud save envelope contains only allowlisted game keys', () => {
  const storage = memoryStorage({
    'roppongi-past-story': '{"phase":"arrival"}',
    'roppongi-past-campaign': '{"gold":300}',
    unrelated: 'private'
  });
  const envelope = buildCloudSaveEnvelope(storage, '2026-08-18T10:00:00.000Z');
  assert.equal(envelope.schemaVersion, CLOUD_SAVE_SCHEMA_VERSION);
  assert.deepEqual(envelope.values, {
    'roppongi-past-story': '{"phase":"arrival"}',
    'roppongi-past-campaign': '{"gold":300}'
  });
});

test('valid cloud save restores allowlisted values without touching unrelated storage', () => {
  const storage = memoryStorage({ unrelated: 'keep' });
  storage.setItem = (key, value) => storage.values.set(key, value);
  const restored = restoreCloudSaveEnvelope({
    schemaVersion: CLOUD_SAVE_SCHEMA_VERSION,
    savedAt: '2026-08-18T10:00:00.000Z',
    values: { 'roppongi-past-story': '{"phase":"second-mission"}', injected: 'reject' }
  }, storage);
  assert.equal(restored, true);
  assert.equal(storage.getItem('roppongi-past-story'), '{"phase":"second-mission"}');
  assert.equal(storage.getItem('injected'), null);
  assert.equal(storage.getItem('unrelated'), 'keep');
});

test('malformed or future cloud saves fail closed', () => {
  const storage = memoryStorage();
  storage.setItem = (key, value) => storage.values.set(key, value);
  assert.equal(restoreCloudSaveEnvelope(null, storage), false);
  assert.equal(restoreCloudSaveEnvelope({ schemaVersion: 999, values: {} }, storage), false);
  assert.equal(restoreCloudSaveEnvelope({ schemaVersion: CLOUD_SAVE_SCHEMA_VERSION, values: [] }, storage), false);
  const circular = { schemaVersion: CLOUD_SAVE_SCHEMA_VERSION, values: {} };
  circular.self = circular;
  assert.equal(restoreCloudSaveEnvelope(circular, storage), false);
});

test('newest-save selection detects ties and invalid dates safely', () => {
  assert.equal(chooseNewestSave('2026-08-18T10:00:00Z', '2026-08-18T09:00:00Z'), 'local');
  assert.equal(chooseNewestSave('2026-08-18T09:00:00Z', '2026-08-18T10:00:00Z'), 'remote');
  assert.equal(chooseNewestSave('2026-08-18T10:00:00Z', '2026-08-18T10:00:00Z'), 'equal');
  assert.equal(chooseNewestSave('invalid', '2026-08-18T10:00:00Z'), 'remote');
});
