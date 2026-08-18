(function exposePastWorld(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_WORLD = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const PAST_ENCOUNTERS = Object.freeze([
    Object.freeze({
      id: 'road-mist-east', chapter: 'west-road', enemyId: 'mist-slime', sprite: 'mist-slime.png', speed: 15,
      patrol: Object.freeze([[286, 497], [271, 491], [258, 493]])
    }),
    Object.freeze({
      id: 'road-mist-west', chapter: 'west-road', enemyId: 'mist-slime', sprite: 'mist-slime.png', speed: 16,
      patrol: Object.freeze([[244, 493], [231, 497], [220, 502]])
    }),
    Object.freeze({
      id: 'road-goblin', chapter: 'west-road', enemyId: 'gutter-goblin', sprite: 'gutter-goblin.png', speed: 18,
      patrol: Object.freeze([[205, 504], [194, 509], [184, 512]])
    }),
    Object.freeze({
      id: 'road-wolf', chapter: 'west-road', enemyId: 'rune-wolf', sprite: 'rune-wolf.png', speed: 20,
      patrol: Object.freeze([[173, 509], [164, 513], [155, 516]])
    })
  ]);

  function createPastEnemies(scale = 1) {
    return PAST_ENCOUNTERS.map(definition => ({
      ...definition,
      patrol: definition.patrol.map(([x, y]) => [x * scale, y * scale]),
      speed: definition.speed * scale,
      x: definition.patrol[0][0] * scale,
      y: definition.patrol[0][1] * scale,
      patrolIndex: 1,
      active: true,
      respawnAt: 0
    }));
  }

  function advancePatrol(enemy, seconds) {
    if (!enemy.active || !enemy.patrol?.length) return enemy;
    const target = enemy.patrol[enemy.patrolIndex % enemy.patrol.length];
    const dx = target[0] - enemy.x;
    const dy = target[1] - enemy.y;
    const distance = Math.hypot(dx, dy);
    const travel = Math.max(0, enemy.speed * seconds);
    if (distance <= travel || distance === 0) {
      return {
        ...enemy,
        x: target[0],
        y: target[1],
        patrolIndex: (enemy.patrolIndex + 1) % enemy.patrol.length
      };
    }
    return { ...enemy, x: enemy.x + dx / distance * travel, y: enemy.y + dy / distance * travel };
  }

  function respawnPastEnemies(enemies) {
    return enemies.map(enemy => ({
      ...enemy,
      x: enemy.patrol[0][0],
      y: enemy.patrol[0][1],
      patrolIndex: 1,
      active: true,
      respawnAt: 0
    }));
  }

  function shouldStartEncounter(player, enemy, radius = 46, now = Date.now()) {
    return Boolean(enemy.active && enemy.respawnAt <= now && Math.hypot(player.x - enemy.x, player.y - enemy.y) <= radius);
  }

  function landmarkMemoryState(landmarkId, stage = 0) {
    if (landmarkId === 'tokyo-midtown') return stage >= 1 ? 'visible' : 'fog';
    if (landmarkId === 'azabudai-hills' || landmarkId === 'azabudai-garden-plaza') {
      return stage >= 2 ? 'visible' : 'fog';
    }
    return 'visible';
  }

  function nextMemoryStage(stage = 0, eventId = '') {
    if (eventId === 'midtown-memory-restored' && stage < 1) return 1;
    if (eventId === 'azabudai-memory-restored' && stage >= 1) return 2;
    return stage;
  }

  return {
    PAST_ENCOUNTERS,
    advancePatrol,
    createPastEnemies,
    landmarkMemoryState,
    nextMemoryStage,
    respawnPastEnemies,
    shouldStartEncounter
  };
});
