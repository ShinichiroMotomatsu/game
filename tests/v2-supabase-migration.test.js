const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync('supabase/migrations/202608180001_create_save_slots.sql', 'utf8');

test('save migration enables RLS and scopes every operation to auth.uid', () => {
  assert.match(migration, /alter table public\.save_slots enable row level security/i);
  for (const operation of ['select', 'insert', 'update', 'delete']) assert.match(migration, new RegExp(`for ${operation}`, 'i'));
  assert.ok((migration.match(/auth\.uid\(\)/g) || []).length >= 4);
  assert.doesNotMatch(migration, /service_role|sb_secret|password/i);
});

test('save slots are bounded and unique per user', () => {
  assert.match(migration, /check \(slot_number between 1 and 3\)/i);
  assert.match(migration, /unique \(user_id, slot_number\)/i);
  assert.match(migration, /jsonb_typeof\(save_data\) = 'object'/i);
  assert.match(migration, /octet_length\(save_data::text\) <= 1048576/i);
});
