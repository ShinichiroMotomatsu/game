const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  PAST_ENCOUNTERS,
  PAST_BIOMES,
  advancePatrol,
  createPastEnemies,
  landmarkMemoryState,
  nextMemoryStage,
  respawnPastEnemies,
  shouldStartEncounter
} = require('../v2-past-world.js');

test('past enemies have visible road patrol routes away from the starting point', () => {
  assert.ok(PAST_ENCOUNTERS.length >= 4);
  assert.ok(PAST_ENCOUNTERS.filter(enemy => enemy.chapter === 'west-road').every(enemy =>
    enemy.patrol.length >= 2
    && enemy.patrol.every(([x, y]) => Math.hypot(x - 416, y - 354) >= 80)
  ));
});

test('the opening encounters form one west-road route between the capital and old watchtower', () => {
  assert.equal(PAST_ENCOUNTERS.filter(enemy => enemy.chapter === 'west-road').length, 4);
  assert.ok(PAST_ENCOUNTERS.filter(enemy => enemy.chapter === 'west-road').every(enemy => enemy.patrol[0][0] < 310));
});

test('the route to the crossroads crosses distinct fantasy biomes with expanded fauna', () => {
  assert.ok(PAST_BIOMES.length >= 5);
  assert.deepEqual(new Set(PAST_BIOMES.map(biome => biome.id)), new Set(['coast', 'poison-swamp', 'mountain-forest', 'cold', 'desert', 'lava']));
  assert.ok(new Set(PAST_ENCOUNTERS.map(enemy => enemy.enemyId)).size >= 9);
  assert.ok(PAST_ENCOUNTERS.every(enemy => PAST_BIOMES.some(biome => biome.id === enemy.biome)));
  assert.ok(PAST_ENCOUNTERS.some(enemy => enemy.chapter === 'crossroads-route'));
});

test('overworld actors and movement are reduced to half scale', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.deepEqual(PAST_ENCOUNTERS.filter(enemy => enemy.chapter === 'west-road').map(enemy => enemy.speed), [15, 16, 18, 20]);
  assert.match(runtime, /footRadius:\s*6/);
  assert.match(runtime, /speed:\s*190/);
  assert.match(runtime, /const displayHeight = 48/);
  assert.match(runtime, /const height = 50/);
  assert.match(runtime, /shouldStartEncounter\(player, enemy, 23 \* maskScale/);
});

test('patrol movement stays on the configured segment', () => {
  const enemy = { ...PAST_ENCOUNTERS[0], x: PAST_ENCOUNTERS[0].patrol[0][0], y: PAST_ENCOUNTERS[0].patrol[0][1], patrolIndex: 1 };
  const moved = advancePatrol(enemy, 0.5);
  const [start, end] = enemy.patrol;
  const crossProduct = (moved.x - start[0]) * (end[1] - start[1])
    - (moved.y - start[1]) * (end[0] - start[0]);
  assert.ok(Math.abs(crossProduct) < 0.001);
});

test('a nearby active enemy starts an encounter but a defeated enemy does not', () => {
  const enemy = { x: 100, y: 100, active: true, respawnAt: 0 };
  assert.equal(shouldStartEncounter({ x: 118, y: 110 }, enemy, 40, 1000), true);
  assert.equal(shouldStartEncounter({ x: 118, y: 110 }, { ...enemy, active: false, respawnAt: 2000 }, 40, 1000), false);
});

test('entering a building restores every field monster at its patrol origin', () => {
  const defeated = createPastEnemies().map((enemy, index) => ({
    ...enemy,
    x: enemy.x + 30,
    y: enemy.y + 20,
    patrolIndex: 2,
    active: index !== 0,
    respawnAt: index === 0 ? 999999 : 0
  }));
  const respawned = respawnPastEnemies(defeated);
  assert.ok(respawned.every(enemy => enemy.active && enemy.respawnAt === 0));
  assert.ok(respawned.every(enemy => enemy.x === enemy.patrol[0][0] && enemy.y === enemy.patrol[0][1]));
  assert.ok(respawned.every(enemy => enemy.patrolIndex === 1));
});

test('the runtime respawns field monsters on every transition into a town or building', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const transition = runtime.slice(runtime.indexOf('function transitionStoryArea'), runtime.indexOf('function performStoryInteraction'));
  assert.match(transition, /storyState\.area !== previousArea/);
  assert.match(transition, /storyState\.area !== 'overworld'/);
  assert.match(transition, /respawnPastEnemies\(pastEnemies\)/);
});

test('Midtown and both Azabudai parts begin hidden by memory fog', () => {
  assert.equal(landmarkMemoryState('tokyo-midtown', 0), 'fog');
  assert.equal(landmarkMemoryState('azabudai-hills', 0), 'fog');
  assert.equal(landmarkMemoryState('azabudai-garden-plaza', 0), 'fog');
});

test('memory regions unlock in Midtown then Azabudai order', () => {
  assert.equal(landmarkMemoryState('tokyo-midtown', 1), 'visible');
  assert.equal(landmarkMemoryState('azabudai-hills', 1), 'fog');
  assert.equal(landmarkMemoryState('azabudai-hills', 2), 'visible');
});

test('older landmarks remain visible at every memory stage', () => {
  assert.equal(landmarkMemoryState('roppongi-hills', 0), 'visible');
});

test('memory events enforce the Midtown then Azabudai unlock order', () => {
  assert.equal(nextMemoryStage(0, 'azabudai-memory-restored'), 0);
  assert.equal(nextMemoryStage(0, 'midtown-memory-restored'), 1);
  assert.equal(nextMemoryStage(1, 'azabudai-memory-restored'), 2);
});
