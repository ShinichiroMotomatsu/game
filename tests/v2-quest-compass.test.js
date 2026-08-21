const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mainQuestCompassTarget,
  questCompassBearing
} = require('../v2-quest-compass.js');

function campaign(overrides = {}) {
  return {
    watchtowerReached: false,
    roadVictories: 0,
    ownedCards: ['slash', 'focus', 'guard'],
    sealFragments: [],
    bossDefeated: false,
    ...overrides
  };
}

function targetId(story, progress = campaign()) {
  return mainQuestCompassTarget(story, progress)?.interactionId || null;
}

test('the compass guides the opening from the harbor through the capital to the king', () => {
  const route = [
    targetId({ phase: 'arrival', area: 'overworld' }),
    targetId({ phase: 'seek-king', area: 'castle-town' }),
    targetId({ phase: 'seek-king', area: 'castle' })
  ];

  assert.deepEqual(route, ['capital-gate', 'castle-door', 'king']);
});

test('the first mission compass follows the watchtower magic and seal-fragment sequence', () => {
  const route = [
    targetId({ phase: 'first-mission', area: 'castle' }),
    targetId({ phase: 'first-mission', area: 'castle-town' }),
    targetId({ phase: 'first-mission', area: 'overworld' }),
    targetId(
      { phase: 'first-mission', area: 'overworld' },
      campaign({ watchtowerReached: true, roadVictories: 1 })
    ),
    targetId(
      { phase: 'first-mission', area: 'overworld' },
      campaign({ watchtowerReached: true, roadVictories: 2, ownedCards: ['slash', 'focus', 'guard', 'spark'], sealFragments: ['a'] })
    ),
    targetId(
      { phase: 'first-mission', area: 'overworld' },
      campaign({ watchtowerReached: true, roadVictories: 4, ownedCards: ['slash', 'focus', 'guard', 'spark'], sealFragments: ['a', 'b', 'c', 'd'] })
    )
  ];

  assert.deepEqual(route, ['castle-exit', 'capital-exit', 'old-watchtower', 'road-mage', 'west-road-search', 'old-watchtower']);
});

test('the second mission compass points to two witnesses then the waterway altar', () => {
  const route = [
    targetId({ phase: 'second-mission', area: 'overworld', crossroadsClues: [] }),
    targetId({ phase: 'second-mission', area: 'crossroads-town', crossroadsClues: [] }),
    targetId({ phase: 'second-mission', area: 'crossroads-town', crossroadsClues: ['merchant-timing'] }),
    targetId({ phase: 'second-mission', area: 'crossroads-town', crossroadsClues: ['merchant-timing', 'reverse-gates'] }),
    targetId({ phase: 'second-mission', area: 'crossroads-dungeon', crossroadsClues: ['merchant-timing', 'reverse-gates'] }),
    targetId({ phase: 'second-mission-report', area: 'crossroads-dungeon', crossroadsClues: [] }),
    targetId({ phase: 'second-mission-report', area: 'crossroads-town', crossroadsClues: [] }),
    targetId({ phase: 'second-mission-report', area: 'overworld', crossroadsClues: [] }),
    targetId({ phase: 'second-mission-report', area: 'castle', crossroadsClues: [] })
  ];

  assert.deepEqual(route, [
    'crossroads-gate',
    'crossroads-merchant',
    'crossroads-guide',
    'crossroads-dungeon-door',
    'crossroads-boss-altar',
    'crossroads-dungeon-exit',
    'crossroads-town-exit',
    'capital-gate',
    'king'
  ]);
});

test('the third mission compass guides the fog investigation and return report', () => {
  const route = [
    targetId({ phase: 'third-mission', area: 'overworld', mistClues: [] }),
    targetId({ phase: 'third-mission', area: 'mist-citadel', mistClues: [] }),
    targetId({ phase: 'third-mission', area: 'mist-citadel', mistClues: ['lost-patrol'] }),
    targetId({ phase: 'third-mission', area: 'mist-citadel', mistClues: ['lost-patrol', 'night-bell'] }),
    targetId({ phase: 'third-mission', area: 'mist-bell-tower', mistClues: ['lost-patrol', 'night-bell'] }),
    targetId({ phase: 'third-mission-report', area: 'mist-bell-tower', mistClues: [] }),
    targetId({ phase: 'third-mission-report', area: 'mist-citadel', mistClues: [] }),
    targetId({ phase: 'third-mission-report', area: 'castle-town', mistClues: [] }),
    targetId({ phase: 'third-mission-report', area: 'castle', mistClues: [] }),
    targetId({ phase: 'third-mission-complete', area: 'overworld', mistClues: [] })
  ];

  assert.deepEqual(route, [
    'mist-citadel-gate',
    'mist-patrol-captain',
    'mist-bell-keeper',
    'mist-bell-tower-door',
    'mist-bell-altar',
    'mist-tower-exit',
    'mist-citadel-exit',
    'castle-door',
    'king',
    null
  ]);
});

test('an optional dungeon redirects the main-quest compass toward its field exit', () => {
  const target = mainQuestCompassTarget({ phase: 'third-mission', area: 'ice-lantern-cavern', mistClues: [] }, campaign());

  assert.deepEqual(
    { interactionId: target.interactionId, area: target.area, label: target.label },
    { interactionId: 'ice-lantern-exit', area: 'ice-lantern-cavern', label: '地上への出口' }
  );
});

test('compass bearing uses north as zero and respects overworld scale', () => {
  const bearings = [
    questCompassBearing({ x: 0, y: 0 }, [0, -10]),
    questCompassBearing({ x: 0, y: 0 }, [10, 0]),
    questCompassBearing({ x: 0, y: 0 }, [0, 10]),
    questCompassBearing({ x: 0, y: 0 }, [-10, 0]),
    questCompassBearing({ x: 0, y: 0 }, [10, 0], 4)
  ];

  assert.deepEqual(
    bearings.map(reading => ({ bearing: Math.round(reading.bearing), distance: Math.round(reading.distance) })),
    [
      { bearing: 0, distance: 10 },
      { bearing: 90, distance: 10 },
      { bearing: 180, distance: 10 },
      { bearing: 270, distance: 10 },
      { bearing: 90, distance: 40 }
    ]
  );
});

test('compass bearing rejects missing or non-finite coordinates', () => {
  assert.equal(questCompassBearing({ x: 0, y: 0 }, [Number.NaN, 10]), null);
});
