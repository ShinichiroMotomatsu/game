const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RETURN_PORTAL_NODES,
  atlasNodeAtCanvasPoint,
  createReturnPortalAtlas,
  nearbyReturnPortal,
  returnPortalRoute
} = require('../v2-return-portals.js');

function story(overrides = {}) {
  return {
    phase: 'arrival',
    area: 'overworld',
    capitalArrivalSeen: false,
    ...overrides
  };
}

function campaign(overrides = {}) {
  return {
    watchtowerReached: false,
    bossDefeated: false,
    crossroadsBossDefeated: false,
    mistBossDefeated: false,
    ...overrides
  };
}

test('the implemented atlas contains only the three chapter-one-to-three return portals', () => {
  assert.deepEqual(RETURN_PORTAL_NODES.map(node => node.id), ['capital', 'quadra', 'veil']);
  assert.ok(RETURN_PORTAL_NODES.every(node => Array.isArray(node.overworldPoint)));
  assert.ok(RETURN_PORTAL_NODES.every(node => Array.isArray(node.localPoint)));
});

test('Eld map shows hypotheses without exposing late-game identities or destinations', () => {
  const atlas = createReturnPortalAtlas(story(), campaign());
  const serialized = JSON.stringify(atlas);

  assert.deepEqual(atlas.nodes.map(node => node.status), ['offline', 'unknown', 'unknown']);
  assert.deepEqual(atlas.links.map(link => link.status), ['hypothesis', 'hypothesis']);
  assert.doesNotMatch(serialized, /魔王|ラスボス|封印地|現代編|六本木/);
});

test('clearing the four-gate waterway restores travel between the capital and Quadra only', () => {
  const atlas = createReturnPortalAtlas(
    story({ phase: 'second-mission-report', area: 'crossroads-town', capitalArrivalSeen: true }),
    campaign({ watchtowerReached: true, bossDefeated: true, crossroadsBossDefeated: true })
  );

  assert.deepEqual(atlas.nodes.map(node => node.status), ['restored', 'restored', 'unknown']);
  assert.deepEqual(returnPortalRoute(atlas, 'capital', 'quadra'), ['capital', 'quadra']);
  assert.equal(returnPortalRoute(atlas, 'capital', 'veil'), null);
});

test('the watchtower Blue Star marker appears only after seeing the crest beyond its guardian', () => {
  const reached = createReturnPortalAtlas(
    story({ phase: 'first-mission' }),
    campaign({ watchtowerReached: true })
  );
  const cleared = createReturnPortalAtlas(
    story({ phase: 'first-mission-report' }),
    campaign({ watchtowerReached: true, bossDefeated: true })
  );

  assert.equal(reached.markers.some(marker => marker.id === 'watchtower-blue-star'), false);
  assert.equal(cleared.markers.some(marker => marker.id === 'watchtower-blue-star'), true);
});

test('clearing the silent bell tower adds Veil and permits travel across restored links', () => {
  const atlas = createReturnPortalAtlas(
    story({ phase: 'third-mission-report', area: 'mist-citadel', capitalArrivalSeen: true }),
    campaign({ watchtowerReached: true, bossDefeated: true, crossroadsBossDefeated: true, mistBossDefeated: true })
  );

  assert.deepEqual(atlas.nodes.map(node => node.status), ['restored', 'restored', 'restored']);
  assert.deepEqual(returnPortalRoute(atlas, 'capital', 'veil'), ['capital', 'quadra', 'veil']);
  assert.equal(returnPortalRoute(atlas, 'capital', 'capital'), null);
  assert.equal(returnPortalRoute(atlas, 'missing', 'capital'), null);
});

test('travel begins only while standing at a restored local portal', () => {
  const atlas = createReturnPortalAtlas(
    story({ phase: 'second-mission-complete', area: 'castle-town', capitalArrivalSeen: true }),
    campaign({ crossroadsBossDefeated: true })
  );
  const capital = RETURN_PORTAL_NODES.find(node => node.id === 'capital');

  assert.equal(nearbyReturnPortal(atlas, 'castle-town', capital.localPoint)?.id, 'capital');
  assert.equal(nearbyReturnPortal(atlas, 'castle-town', [capital.localPoint[0] + 200, capital.localPoint[1]]), null);
  assert.equal(nearbyReturnPortal(atlas, 'overworld', capital.overworldPoint), null);
});

test('touch hit-testing selects a visible atlas node after projection', () => {
  const atlas = createReturnPortalAtlas(
    story({ phase: 'third-mission', capitalArrivalSeen: true }),
    campaign({ crossroadsBossDefeated: true })
  );
  const quadra = atlas.nodes.find(node => node.id === 'quadra');
  const canvas = { width: 900, height: 625 };
  const world = { width: 1505, height: 1045 };
  const screenPoint = [
    quadra.overworldPoint[0] / world.width * canvas.width,
    quadra.overworldPoint[1] / world.height * canvas.height
  ];

  assert.equal(atlasNodeAtCanvasPoint(atlas, screenPoint, canvas, world)?.id, 'quadra');
  assert.equal(atlasNodeAtCanvasPoint(atlas, [899, 624], canvas, world), null);
});
