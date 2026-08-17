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
    })
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

  return { NPC_PATROL_SPEED_SCALE, NPC_SPRITE_ASSETS, PAST_SCENE_ASSETS, npcPoseAt };
});
