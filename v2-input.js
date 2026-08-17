(function exposeInput(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_INPUT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  function dragMovementVector(start, current, deadZone = 10, maxDistance = 72) {
    const values = [start?.x, start?.y, current?.x, current?.y, deadZone, maxDistance].map(Number);
    if (!values.every(Number.isFinite) || deadZone < 0 || maxDistance <= deadZone) {
      return { x: 0, y: 0, strength: 0 };
    }
    const dx = values[2] - values[0];
    const dy = values[3] - values[1];
    const distance = Math.hypot(dx, dy);
    if (distance <= deadZone) return { x: 0, y: 0, strength: 0 };
    return {
      x: dx / distance,
      y: dy / distance,
      strength: Math.min(1, (distance - deadZone) / (maxDistance - deadZone))
    };
  }

  return { dragMovementVector };
});
