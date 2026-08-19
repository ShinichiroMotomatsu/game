(function exposeCloudSave(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_CLOUD_SAVE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function validSlot(slot) {
    return Number.isInteger(slot) && slot >= 1 && slot <= 3;
  }

  function safeFailure(reason) {
    return { ok: false, reason };
  }

  function validEnvelope(envelope) {
    try {
      return Boolean(
        envelope
        && typeof envelope === 'object'
        && !Array.isArray(envelope)
        && Number.isInteger(envelope.schemaVersion)
        && envelope.schemaVersion > 0
        && envelope.values
        && typeof envelope.values === 'object'
        && !Array.isArray(envelope.values)
        && Object.values(envelope.values).every(value => typeof value === 'string')
        && JSON.stringify(envelope).length <= 1024 * 1024
      );
    } catch {
      return false;
    }
  }

  function createCloudSaveService(client) {
    if (!client?.from) throw new TypeError('A Supabase-compatible client is required');

    async function load(slot = 1) {
      if (!validSlot(slot)) return safeFailure('invalid-slot');
      try {
        const { data, error } = await client
          .from('save_slots')
          .select('slot_number,schema_version,save_data,client_updated_at,updated_at')
          .eq('slot_number', slot)
          .maybeSingle();
        if (error) return safeFailure('remote-error');
        return { ok: true, save: data?.save_data ?? null, metadata: data ?? null };
      } catch {
        return safeFailure('remote-error');
      }
    }

    async function save(slot = 1, envelope) {
      if (!validSlot(slot)) return safeFailure('invalid-slot');
      if (!validEnvelope(envelope)) return safeFailure('invalid-save');
      try {
        const { data: authData, error: authError } = await client.auth.getUser();
        if (authError || !authData?.user?.id) return safeFailure('unauthenticated');
        const row = {
          user_id: authData.user.id,
          slot_number: slot,
          schema_version: envelope?.schemaVersion ?? 1,
          save_data: envelope,
          client_updated_at: envelope?.savedAt ?? new Date().toISOString()
        };
        const { data, error } = await client
          .from('save_slots')
          .upsert(row, { onConflict: 'user_id,slot_number' })
          .select('slot_number,schema_version,save_data,client_updated_at,updated_at')
          .single();
        if (error) return safeFailure('remote-error');
        return { ok: true, record: data };
      } catch {
        return safeFailure('remote-error');
      }
    }

    return Object.freeze({ load, save });
  }

  return { createCloudSaveService, validEnvelope, validSlot };
});
