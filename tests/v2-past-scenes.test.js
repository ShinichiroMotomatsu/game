const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  NPC_PATROL_SPEED_SCALE,
  NPC_SPRITE_ASSETS,
  PAST_EVENT_ASSETS,
  PAST_SCENE_ASSETS,
  PAST_STORY_VISUALS,
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
    'castle-town-ground',
    'crossroads-town',
    'mist-citadel',
    'voyage-intro',
    'watchtower-discovery'
  ]);
  for (const asset of Object.values(PAST_SCENE_ASSETS)) {
    assert.match(asset.path, /^assets\/v2\/past-scenes\/.+\.png$/);
    assert.equal(fs.existsSync(asset.path), true, `${asset.path} is missing`);
  }
});

test('watergate artwork is square and explicitly safe to rotate into all four directions', () => {
  for (const id of ['watergate-closed', 'watergate-open']) {
    const asset = PAST_EVENT_ASSETS[id];
    assert.equal(asset.width, asset.height);
    assert.equal(asset.rotationSafe, true);
  }
});

test('overworld event people and structures use transparent raster assets', () => {
  assert.deepEqual(Object.keys(PAST_EVENT_ASSETS).sort(), [
    'capital-gate', 'card-chest-frost', 'card-chest-mend',
    'compass-altar-corrupted', 'compass-altar-restored', 'father-compass', 'magic-tutor', 'old-watchtower',
    'star-crest',
    'watergate-closed', 'watergate-open'
  ]);
  for (const asset of Object.values(PAST_EVENT_ASSETS)) {
    assert.match(asset.path, /^assets\/v2\/past-events\/.+\.png$/);
    assert.equal(fs.existsSync(asset.path), true, `${asset.path} is missing`);
  }
});

test('the compass close-up and watchtower discovery reuse one exact star crest layer', () => {
  assert.equal(PAST_STORY_VISUALS.compass.sceneId, 'voyage-intro');
  assert.equal(PAST_STORY_VISUALS.compass.eventId, 'father-compass');
  assert.equal(PAST_STORY_VISUALS.compass.crestId, 'star-crest');
  assert.equal(PAST_STORY_VISUALS['watchtower-crest'].sceneId, 'watchtower-discovery');
  assert.equal(PAST_STORY_VISUALS['watchtower-crest'].crestId, PAST_STORY_VISUALS.compass.crestId);
});

test('waterway props load only when the dungeon is active', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const resolver = runtime.match(/function requiredAssetsForActiveLocation\(\)[\s\S]*?\n  function loadAssetsInBackground/)?.[0] || '';
  const overworld = resolver.slice(resolver.indexOf("activeAreaId() === 'overworld'"), resolver.indexOf("activeAreaId() === 'castle-town'"));
  const dungeon = resolver.slice(resolver.indexOf("activeAreaId() === 'crossroads-dungeon'"));

  assert.doesNotMatch(overworld, /watergate-|compass-altar-/);
  assert.match(dungeon, /watergate-closed/);
  assert.match(dungeon, /watergate-open/);
  assert.match(dungeon, /compass-altar-corrupted/);
  assert.match(dungeon, /compass-altar-restored/);
  assert.match(resolver, /sceneAssetKey\('mist-citadel'\)/);
});

test('the crossroads town stays raster-backed while its dungeon is generated from tiles', () => {
  const town = PAST_SCENE_ASSETS['crossroads-town'];
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.ok(town);
  assert.equal(fs.existsSync(town.path), true, `${town.path} is missing`);
  assert.equal(PAST_SCENE_ASSETS['crossroads-dungeon'], undefined);
  assert.match(runtime, /drawCrossroadsDungeonTiles/);
  assert.match(runtime, /CROSSROADS_DUNGEON_LAYOUT/);
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

test('the browser runtime registers scene images for area-scoped lazy loading', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /v2-past-scenes\.js/);
  assert.match(runtime, /PAST_SCENE_ASSETS/);
  assert.match(runtime, /pastSceneImages/);
  assert.match(runtime, /sceneAssetKey\('castle-town-ground'\)/);
  assert.match(runtime, /sceneAssetKey\('castle-interior'\)/);
  assert.match(runtime, /npcPoseAt/);
});
