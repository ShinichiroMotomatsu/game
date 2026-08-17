const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  NPC_PATROL_SPEED_SCALE,
  NPC_SPRITE_ASSETS,
  PAST_SCENE_ASSETS,
  npcPoseAt
} = require('../v2-past-scenes.js');
const {
  CASTLE_NPCS,
  TOWN_NPCS,
  nearbyPastInteraction
} = require('../v2-past-story.js');

test('the royal capital is rendered as ground, building, and character raster layers', () => {
  assert.deepEqual(Object.keys(PAST_SCENE_ASSETS).sort(), [
    'castle-interior',
    'castle-town-buildings',
    'castle-town-ground'
  ]);
  for (const asset of Object.values(PAST_SCENE_ASSETS)) {
    assert.match(asset.path, /^assets\/v2\/past-scenes\/.+\.png$/);
    assert.equal(fs.existsSync(asset.path), true, `${asset.path} is missing`);
  }
});

test('townsfolk, soldiers, and the king use dedicated raster sprites', () => {
  assert.deepEqual(new Set(Object.keys(NPC_SPRITE_ASSETS)), new Set([
    'villager-man', 'villager-woman', 'soldier', 'king'
  ]));
  for (const path of Object.values(NPC_SPRITE_ASSETS)) {
    assert.equal(fs.existsSync(path), true, `${path} is missing`);
  }
  assert.ok(TOWN_NPCS.length >= 4);
  assert.ok(CASTLE_NPCS.some(npc => npc.role === 'king'));
  assert.ok(CASTLE_NPCS.filter(npc => npc.role === 'soldier').length >= 3);
});

test('walking NPCs patrol around their interaction anchors and report a facing', () => {
  const npc = TOWN_NPCS.find(candidate => candidate.patrol);
  const start = npcPoseAt(npc, 0);
  const later = npcPoseAt(npc, npc.patrol.periodMs / 4);
  assert.notDeepEqual([later.x, later.y], [start.x, start.y]);
  assert.ok(['up', 'down', 'left', 'right'].includes(later.facing));
  assert.ok(Math.hypot(later.x - npc.point[0], later.y - npc.point[1]) <= npc.patrol.distance + 1);
});

test('townsfolk and soldiers patrol at half of their original movement speed', () => {
  const npc = { point: [100, 100], patrol: { axis: 'x', distance: 40, periodMs: 4000, phase: 0 } };
  const start = npcPoseAt(npc, 0);
  const afterOneHundredMs = npcPoseAt(npc, 100);

  assert.equal(NPC_PATROL_SPEED_SCALE, 0.5);
  assert.ok(Math.abs((afterOneHundredMs.x - start.x) - 2) < 0.0001);
});

test('conversation proximity follows a walking townsperson instead of a stale point', () => {
  const npc = TOWN_NPCS.find(candidate => candidate.patrol);
  const pose = npcPoseAt(npc, npc.patrol.periodMs / 3);
  const dynamicPoints = new Map([[npc.id, [pose.x, pose.y]]]);
  const interaction = nearbyPastInteraction(
    'castle-town',
    { x: pose.x, y: pose.y },
    1,
    () => true,
    dynamicPoints
  );
  assert.equal(interaction.id, npc.id);
});

test('the browser runtime loads the three scene images before leaving MAP LOADING', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /v2-past-scenes\.js/);
  assert.match(runtime, /PAST_SCENE_ASSETS/);
  assert.match(runtime, /pastSceneImages/);
  assert.match(runtime, /npcPoseAt/);
});
