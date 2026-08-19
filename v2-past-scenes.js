(function exposePastScenes(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_SCENES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const NPC_PATROL_SPEED_SCALE = 0.5;

  const PAST_SCENE_ASSETS = Object.freeze({
    'castle-town-ground': Object.freeze({
      path: 'assets/v2/past-scenes/castle-town-ground.png',
      width: 1400,
      height: 1000
    }),
    'castle-town-buildings': Object.freeze({
      path: 'assets/v2/past-scenes/castle-town-buildings.png',
      width: 1400,
      height: 1000
    }),
    'castle-interior': Object.freeze({
      path: 'assets/v2/past-scenes/castle-interior.png',
      width: 1000,
      height: 760
    }),
    'crossroads-town': Object.freeze({
      path: 'assets/v2/past-scenes/crossroads-town.png',
      width: 1200,
      height: 900
    })
  });

  const PAST_EVENT_ASSETS = Object.freeze({
    'capital-gate': Object.freeze({ path: 'assets/v2/past-events/capital-gate.png', width: 210, height: 140 }),
    'old-watchtower': Object.freeze({ path: 'assets/v2/past-events/old-watchtower.png', width: 150, height: 225 }),
    'magic-tutor': Object.freeze({ path: 'assets/v2/past-events/magic-tutor.png', width: 58, height: 72 }),
    'card-chest-frost': Object.freeze({ path: 'assets/v2/past-events/card-chest-frost.png', width: 66, height: 60 }),
    'card-chest-mend': Object.freeze({ path: 'assets/v2/past-events/card-chest-mend.png', width: 64, height: 60 })
  });

  const NPC_SPRITE_ASSETS = Object.freeze({
    'villager-man': 'assets/v2/past-scenes/villager-man.png',
    'villager-woman': 'assets/v2/past-scenes/villager-woman.png',
    soldier: 'assets/v2/past-scenes/soldier.png',
    king: 'assets/v2/past-scenes/king.png'
  });

  function npcPoseAt(npc, elapsedMs = 0) {
    const [baseX, baseY] = npc.point;
    if (!npc.patrol) return { x: baseX, y: baseY, facing: npc.facing || 'down', moving: false };
    const periodMs = Math.max(1000, Number(npc.patrol.periodMs) || 5000) / NPC_PATROL_SPEED_SCALE;
    const phase = Number(npc.patrol.phase) || 0;
    const cycle = ((Number(elapsedMs) / periodMs + phase) % 1 + 1) % 1;
    const triangle = cycle < 0.5 ? cycle * 4 - 1 : 3 - cycle * 4;
    const direction = cycle < 0.5 ? 1 : -1;
    const distance = Math.max(0, Number(npc.patrol.distance) || 0);
    const horizontal = npc.patrol.axis !== 'y';
    const x = baseX + (horizontal ? triangle * distance : 0);
    const y = baseY + (horizontal ? 0 : triangle * distance);
    return {
      x,
      y,
      facing: horizontal ? (direction > 0 ? 'right' : 'left') : (direction > 0 ? 'down' : 'up'),
      moving: distance > 0
    };
  }

  return { NPC_PATROL_SPEED_SCALE, NPC_SPRITE_ASSETS, PAST_EVENT_ASSETS, PAST_SCENE_ASSETS, npcPoseAt };
});
