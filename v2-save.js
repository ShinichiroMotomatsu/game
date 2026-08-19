(function exposeSave(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_SAVE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const CLOUD_SAVE_SCHEMA_VERSION = 1;
  const MAX_CLOUD_SAVE_BYTES = 1024 * 1024;
  const PAST_SAVE_KEYS = Object.freeze([
    'roppongi-past-story',
    'roppongi-past-campaign',
    'roppongi-past-memory-stage',
    'roppongi-past-story-panel'
  ]);

  function consumePastRestart(search, storage) {
    const params = new URLSearchParams(search || '');
    const restarted = params.get('newGame') === 'past';
    if (restarted) {
      for (const key of PAST_SAVE_KEYS) storage.removeItem(key);
      params.delete('newGame');
      params.set('edition', 'past');
    }
    const serialized = params.toString();
    return {
      restarted,
      edition: params.get('edition'),
      search: serialized ? `?${serialized}` : ''
    };
  }

  function buildCloudSaveEnvelope(storage, savedAt = new Date().toISOString()) {
    const values = {};
    for (const key of PAST_SAVE_KEYS) {
      const value = storage.getItem(key);
      if (typeof value === 'string') values[key] = value;
    }
    return { schemaVersion: CLOUD_SAVE_SCHEMA_VERSION, savedAt, values };
  }

  function validCloudSaveEnvelope(envelope) {
    try {
      if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return false;
      if (envelope.schemaVersion !== CLOUD_SAVE_SCHEMA_VERSION) return false;
      if (!envelope.values || typeof envelope.values !== 'object' || Array.isArray(envelope.values)) return false;
      const serialized = JSON.stringify(envelope);
      if (!serialized || serialized.length > MAX_CLOUD_SAVE_BYTES) return false;
      return Object.values(envelope.values).every(value => typeof value === 'string');
    } catch {
      return false;
    }
  }

  function restoreCloudSaveEnvelope(envelope, storage) {
    if (!validCloudSaveEnvelope(envelope)) return false;
    for (const key of PAST_SAVE_KEYS) {
      const value = envelope.values[key];
      if (typeof value === 'string') storage.setItem(key, value);
      else storage.removeItem(key);
    }
    return true;
  }

  function chooseNewestSave(localSavedAt, remoteSavedAt) {
    const localTime = Date.parse(localSavedAt);
    const remoteTime = Date.parse(remoteSavedAt);
    const localValid = Number.isFinite(localTime);
    const remoteValid = Number.isFinite(remoteTime);
    if (!localValid && !remoteValid) return 'equal';
    if (!localValid) return 'remote';
    if (!remoteValid) return 'local';
    if (localTime === remoteTime) return 'equal';
    return localTime > remoteTime ? 'local' : 'remote';
  }

  return {
    CLOUD_SAVE_SCHEMA_VERSION,
    MAX_CLOUD_SAVE_BYTES,
    PAST_SAVE_KEYS,
    buildCloudSaveEnvelope,
    chooseNewestSave,
    consumePastRestart,
    restoreCloudSaveEnvelope,
    validCloudSaveEnvelope
  };
});
