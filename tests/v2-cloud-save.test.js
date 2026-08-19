const test = require('node:test');
const assert = require('node:assert/strict');

const { createCloudSaveService } = require('../v2-cloud-save.js');

function queryResult(result) {
  const query = {
    eq() { return query; },
    select() { return query; },
    maybeSingle: async () => result,
    single: async () => result
  };
  return query;
}

test('cloud load reads only the authenticated user-visible slot', async () => {
  const calls = [];
  const client = {
    from(table) {
      calls.push(table);
      return { select: () => queryResult({ data: { slot_number: 1, save_data: { schemaVersion: 1 } }, error: null }) };
    }
  };
  const result = await createCloudSaveService(client).load(1);
  assert.equal(result.ok, true);
  assert.equal(result.save.schemaVersion, 1);
  assert.deepEqual(calls, ['save_slots']);
});

test('cloud save gets the verified user id and upserts one owned slot', async () => {
  let written;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'user-123' } }, error: null }) },
    from() {
      return {
        upsert(row, options) {
          written = { row, options };
          return queryResult({ data: row, error: null });
        }
      };
    }
  };
  const envelope = { schemaVersion: 1, savedAt: '2026-08-18T10:00:00.000Z', values: {} };
  const result = await createCloudSaveService(client).save(1, envelope);
  assert.equal(result.ok, true);
  assert.equal(written.row.user_id, 'user-123');
  assert.equal(written.options.onConflict, 'user_id,slot_number');
});

test('cloud save refuses unauthenticated writes and invalid slots', async () => {
  const client = { auth: { getUser: async () => ({ data: { user: null }, error: null }) }, from() {} };
  const service = createCloudSaveService(client);
  assert.equal((await service.save(1, { schemaVersion: 1, savedAt: '2026-08-18T10:00:00.000Z', values: {} })).reason, 'unauthenticated');
  assert.equal((await service.load(0)).reason, 'invalid-slot');
  assert.equal((await service.load(4)).reason, 'invalid-slot');
});

test('cloud save rejects malformed payloads before a remote write', async () => {
  let wrote = false;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'user-123' } }, error: null }) },
    from() { wrote = true; }
  };
  const result = await createCloudSaveService(client).save(1, { schemaVersion: 1, values: [] });
  assert.equal(result.reason, 'invalid-save');
  assert.equal(wrote, false);
});

test('cloud save fails closed for circular or non-string local values', async () => {
  const client = { auth: {}, from() {} };
  const service = createCloudSaveService(client);
  const circular = { schemaVersion: 1, values: {} };
  circular.self = circular;
  assert.equal((await service.save(1, circular)).reason, 'invalid-save');
  assert.equal((await service.save(1, { schemaVersion: 1, values: { key: { nested: true } } })).reason, 'invalid-save');
});

test('cloud failures return a safe result instead of exposing provider errors', async () => {
  const client = { from: () => ({ select: () => queryResult({ data: null, error: new Error('database detail') }) }) };
  const result = await createCloudSaveService(client).load(1);
  assert.deepEqual(result, { ok: false, reason: 'remote-error' });
});
