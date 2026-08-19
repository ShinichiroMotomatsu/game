(function exposePastWorld(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_WORLD = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const FIELD_ENCOUNTER_GRACE_MS = 4000;
  const FIELD_ENCOUNTER_RADIUS = 12;
  const FIELD_EXIT_SAFE_RADIUS = 55;
  const PAST_BIOMES = Object.freeze([
    Object.freeze({ id: 'coast', name: '潮風の海岸', center: Object.freeze([85, 530]) }),
    Object.freeze({ id: 'poison-swamp', name: '紫泥の沼', center: Object.freeze([150, 485]) }),
    Object.freeze({ id: 'mountain-forest', name: '古樹の山林', center: Object.freeze([225, 450]) }),
    Object.freeze({ id: 'cold', name: '霜降りの谷', center: Object.freeze([285, 410]) }),
    Object.freeze({ id: 'desert', name: '黄砂の荒野', center: Object.freeze([345, 385]) }),
    Object.freeze({ id: 'lava', name: '熔火の裂谷', center: Object.freeze([400, 360]) })
  ]);
  const PAST_ENCOUNTERS = Object.freeze([
    Object.freeze({
      id: 'road-mist-east', chapter: 'west-road', biome: 'coast', enemyId: 'mist-slime', sprite: 'mist-slime.png', speed: 15,
      patrol: Object.freeze([[230, 480], [220, 483], [210, 487]])
    }),
    Object.freeze({
      id: 'road-mist-west', chapter: 'west-road', biome: 'poison-swamp', enemyId: 'mist-slime', sprite: 'mist-slime.png', speed: 16,
      patrol: Object.freeze([[200, 493], [190, 497], [180, 500]])
    }),
    Object.freeze({
      id: 'road-goblin', chapter: 'west-road', biome: 'mountain-forest', enemyId: 'gutter-goblin', sprite: 'gutter-goblin.png', speed: 18,
      patrol: Object.freeze([[170, 496], [160, 501], [150, 506]])
    }),
    Object.freeze({
      id: 'road-wolf', chapter: 'west-road', biome: 'mountain-forest', enemyId: 'rune-wolf', sprite: 'rune-wolf.png', speed: 20,
      patrol: Object.freeze([[140, 506], [130, 511], [120, 515]])
    }),
    Object.freeze({ id: 'route-bog-mandrake', chapter: 'crossroads-route', biome: 'poison-swamp', enemyId: 'bog-mandrake', sprite: 'bog-mandrake.png', speed: 14, patrol: Object.freeze([[95, 465], [110, 455]]) }),
    Object.freeze({ id: 'route-crag-harpy', chapter: 'crossroads-route', biome: 'mountain-forest', enemyId: 'crag-harpy', sprite: 'crag-harpy.png', speed: 21, patrol: Object.freeze([[200, 410], [210, 405], [220, 410]]) }),
    Object.freeze({ id: 'route-frost-wisp', chapter: 'crossroads-route', biome: 'cold', enemyId: 'frost-wisp', sprite: 'frost-wisp.png', speed: 17, patrol: Object.freeze([[276, 420], [290, 411], [303, 407]]) }),
    Object.freeze({ id: 'route-dune-scorpion', chapter: 'crossroads-route', biome: 'desert', enemyId: 'dune-scorpion', sprite: 'dune-scorpion.png', speed: 16, patrol: Object.freeze([[324, 398], [340, 391], [354, 386]]) }),
    Object.freeze({ id: 'route-ember-lizard', chapter: 'crossroads-route', biome: 'lava', enemyId: 'ember-lizard', sprite: 'ember-lizard.png', speed: 19, patrol: Object.freeze([[365, 382], [379, 375], [391, 369]]) }),
    Object.freeze({ id: 'route-ash-golem', chapter: 'crossroads-route', biome: 'lava', enemyId: 'ash-golem', sprite: 'ash-golem.png', speed: 12, patrol: Object.freeze([[393, 344], [405, 338], [416, 344]]) })
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
    PAST_BIOMES,
    PAST_ENCOUNTERS,
    FIELD_ENCOUNTER_GRACE_MS,
    FIELD_ENCOUNTER_RADIUS,
    FIELD_EXIT_SAFE_RADIUS,
    advancePatrol,
    createPastEnemies,
    landmarkMemoryState,
    nextMemoryStage,
    respawnPastEnemies,
    shouldStartEncounter
  };
});
