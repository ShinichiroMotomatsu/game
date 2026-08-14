(function exposeLandmarkGeometry(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_LANDMARK_GEOMETRY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function renderOrderForLandmark(player, landmark) {
    return player.y < landmark.depthY
      ? ['player', 'landmark']
      : ['landmark', 'player'];
  }

  function shadowVectorFromLight(lightX, lightY, distance) {
    const length = Math.hypot(lightX, lightY);
    if (length === 0) return { x: 0, y: 0 };
    return {
      x: -lightX / length * distance,
      y: -lightY / length * distance
    };
  }

  function renderSequenceForLandmarks(player, landmarks) {
    const entities = landmarks.map((landmark, index) => ({
      label: `landmark:${landmark.id}`,
      depthY: landmark.depthY,
      priority: 0,
      index
    }));
    entities.push({ label: 'player', depthY: player.y, priority: 1, index: landmarks.length });
    entities.sort((left, right) =>
      left.depthY - right.depthY
      || left.priority - right.priority
      || left.index - right.index
    );
    return entities.map(entity => entity.label);
  }

  return {
    renderOrderForLandmark,
    renderSequenceForLandmarks,
    shadowVectorFromLight
  };
});
