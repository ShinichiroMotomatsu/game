(function exposeSave(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_SAVE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
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

  return { PAST_SAVE_KEYS, consumePastRestart };
});
