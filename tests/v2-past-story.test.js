const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  CASTLE_NPCS,
  CASTLE_COLLISION_RECTS,
  CROSSROADS_NPCS,
  PAST_AREAS,
  PAST_INTERACTIONS,
  PAST_START,
  STORY_DIALOGUES,
  TOWN_BUILDINGS,
  TOWN_NPCS,
  TOWN_WALLS,
  activatePastInteraction,
  addStoryGold,
  canStandInPastArea,
  completeStoryEvent,
  createPastStory,
  nearestWalkablePoint,
  nearbyPastInteraction,
  storyAllowsEncounters,
  storyUnlocksInteraction,
  storyObjective
} = require('../v2-past-story.js');

function reachableTownInteractions(interactions, step = 8) {
  const start = PAST_AREAS['castle-town'].spawn;
  const queue = [start];
  const visited = new Set([`${start[0]},${start[1]}`]);
  const reached = new Set();
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index];
    for (const interaction of interactions) {
      if (Math.hypot(x - interaction.point[0], y - interaction.point[1]) <= interaction.radius) {
        reached.add(interaction.id);
      }
    }
    for (const [dx, dy] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const next = [x + dx, y + dy];
      const key = `${next[0]},${next[1]}`;
      if (visited.has(key) || !canStandInPastArea('castle-town', next[0], next[1], 6)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return reached;
}

test('Past Evening starts at the western harbor beside Roppongi Hills', () => {
  assert.equal(PAST_START.area, 'overworld');
  assert.ok(PAST_START.point[0] < 100);
  assert.ok(PAST_START.point[1] > 500 && PAST_START.point[1] < 600);
  assert.ok(PAST_START.capitalGatePoint[0] > PAST_START.point[0]);
});

test('the castle town contains a castle and all five requested shops', () => {
  assert.deepEqual(
    new Set(TOWN_BUILDINGS.map(building => building.type)),
    new Set(['castle', 'weapon', 'armor', 'item', 'inn', 'card'])
  );
  assert.ok(TOWN_BUILDINGS.every(building => building.label && building.rect.length === 4));
});

test('the castle contains a king and multiple soldiers', () => {
  assert.equal(CASTLE_NPCS.filter(npc => npc.role === 'king').length, 1);
  assert.ok(CASTLE_NPCS.filter(npc => npc.role === 'soldier').length >= 2);
});

test('the castle town has walking residents with individual conversations', () => {
  assert.ok(TOWN_NPCS.length >= 4);
  assert.ok(TOWN_NPCS.every(npc => npc.sprite && npc.dialogueId && npc.patrol));
  for (const npc of TOWN_NPCS) {
    const interaction = PAST_INTERACTIONS.find(candidate => candidate.id === npc.id);
    assert.equal(interaction?.area, 'castle-town');
    assert.equal(interaction?.dialogueId, npc.dialogueId);
  }
});

test('capital and castle entrances form a reversible area route', () => {
  let story = createPastStory();
  let result = activatePastInteraction(story, 'capital-gate');
  assert.equal(result.state.area, 'castle-town');
  assert.deepEqual(result.spawn, PAST_AREAS['castle-town'].spawn);

  result = activatePastInteraction(result.state, 'castle-door');
  assert.equal(result.state.area, 'castle');
  assert.deepEqual(result.spawn, PAST_AREAS.castle.spawn);

  result = activatePastInteraction(result.state, 'castle-exit');
  assert.equal(result.state.area, 'castle-town');
  assert.equal(canStandInPastArea('castle-town', result.spawn[0], result.spawn[1], 6), true);

  result = activatePastInteraction(result.state, 'capital-exit');
  assert.equal(result.state.area, 'overworld');
});

test('the first royal audience grants preparation gold exactly once', () => {
  const before = createPastStory({ phase: 'seek-king', gold: 20 });
  const rewarded = completeStoryEvent(before, 'king-audience-complete');
  const repeated = completeStoryEvent(rewarded, 'king-audience-complete');

  assert.equal(rewarded.gold, 320);
  assert.equal(rewarded.phase, 'first-mission');
  assert.equal(repeated.gold, 320);
});

test('battle rewards add to the same story gold purse', () => {
  const story = addStoryGold(createPastStory({ gold: 300 }), 18);
  assert.equal(story.gold, 318);
});

test('the arrival route stays safe until the king assigns the first mission', () => {
  const arrival = createPastStory();
  const audience = completeStoryEvent(arrival, 'arrival-complete');
  const mission = completeStoryEvent(audience, 'king-audience-complete');
  assert.equal(storyAllowsEncounters(arrival), false);
  assert.equal(storyAllowsEncounters(audience), false);
  assert.equal(storyAllowsEncounters(mission), true);
});

test('the king explains the anomaly and assigns the first investigation', () => {
  const speech = STORY_DIALOGUES['king-audience'].lines.map(line => line.text).join('');
  assert.match(speech, /父|地図師|羅針盤/);
  assert.match(speech, /異変/);
  assert.match(speech, /西の港街道/);
  assert.match(speech, /300G/);
});

test('the objective advances from arrival to the king and then the first mission', () => {
  const arrival = createPastStory();
  const audience = completeStoryEvent(arrival, 'arrival-complete');
  const mission = completeStoryEvent(audience, 'king-audience-complete');

  assert.match(storyObjective(arrival), /王都/);
  assert.match(storyObjective(audience), /王に謁見/);
  assert.match(storyObjective(mission), /西の港街道/);
});

test('defeating the watchtower boss completes the first investigation', () => {
  const mission = createPastStory({ phase: 'first-mission', royalRewardClaimed: true });
  const report = completeStoryEvent(mission, 'watchtower-boss-defeated');
  const complete = completeStoryEvent(report, 'first-mission-report-complete');
  assert.equal(report.phase, 'first-mission-report');
  assert.match(storyObjective(report), /王に報告/);
  assert.equal(complete.phase, 'first-mission-complete');
  assert.match(storyObjective(complete), /父の足跡/);
  assert.equal(storyAllowsEncounters(complete), true);
});

test('the next royal audience opens the crossroads chapter without modern place names', () => {
  const completedFirstQuest = createPastStory({
    phase: 'first-mission-complete', royalRewardClaimed: true
  });
  const audience = activatePastInteraction({ ...completedFirstQuest, area: 'castle' }, 'king');
  assert.equal(audience.dialogue.id, 'king-crossroads-mission');
  const chapterTwo = completeStoryEvent(completedFirstQuest, 'crossroads-mission-start');
  assert.equal(chapterTwo.phase, 'second-mission');
  assert.match(storyObjective(chapterTwo), /交差路の街/);
});

test('past-edition dialogue and labels never reveal present-day place names', () => {
  const visiblePastText = JSON.stringify({ STORY_DIALOGUES, PAST_INTERACTIONS, PAST_AREAS });
  assert.doesNotMatch(visiblePastText, /六本木|東京|麻布|外苑|飯倉|赤坂|国道|都道|県道/);
});

test('overworld card chests reward a detour near the northwestern harbor', () => {
  const chests = PAST_INTERACTIONS.filter(interaction => interaction.area === 'overworld' && interaction.actionId?.startsWith('discover-card:'));
  assert.equal(chests.length, 2);
  assert.ok(chests.every(chest => chest.point[0] < 150 && chest.point[1] < 360));
});

test('the traffic-hub town and dungeon form a reversible route', () => {
  const chapterTwo = createPastStory({ area: 'overworld', phase: 'second-mission', royalRewardClaimed: true });
  const town = activatePastInteraction(chapterTwo, 'crossroads-gate');
  assert.equal(town.state.area, 'crossroads-town');
  const dungeon = activatePastInteraction(town.state, 'crossroads-dungeon-door');
  assert.equal(dungeon.state.area, 'crossroads-dungeon');
  const returnToTown = activatePastInteraction(dungeon.state, 'crossroads-dungeon-exit');
  assert.equal(returnToTown.state.area, 'crossroads-town');
  assert.ok(CROSSROADS_NPCS.length >= 3);
});

test('Roppongi Crossing is represented as a four-road trade hub', () => {
  const dialogue = STORY_DIALOGUES['crossroads-arrival'].lines.map(line => line.text).join('');
  assert.match(dialogue, /四つの街道|交通|交易/);
  const gate = PAST_INTERACTIONS.find(interaction => interaction.id === 'crossroads-gate');
  assert.deepEqual(gate.point, [416, 354]);
  assert.equal(gate.unlockAfter, 'first-mission-complete');
});

test('the dungeon exposes three treasure chests and a final boss altar', () => {
  const dungeonInteractions = PAST_INTERACTIONS.filter(interaction => interaction.area === 'crossroads-dungeon');
  assert.equal(dungeonInteractions.filter(interaction => interaction.actionId?.startsWith('dungeon-treasure:')).length, 3);
  assert.equal(dungeonInteractions.some(interaction => interaction.actionId === 'crossroads-boss'), true);
  assert.equal(canStandInPastArea('crossroads-dungeon', 600, 450, 10), true);
  assert.equal(canStandInPastArea('crossroads-dungeon', 50, 450, 10), false);
});

test('town collision keeps the player outside buildings while leaving streets walkable', () => {
  const weaponShop = TOWN_BUILDINGS.find(building => building.type === 'weapon');
  assert.equal(canStandInPastArea('castle-town', weaponShop.rect[0] + 20, weaponShop.rect[1] + 20, 12), false);
  assert.equal(canStandInPastArea('castle-town', 700, 620, 12), true);
});

test('shop interactions are anchored on the visible front stairs', () => {
  const expectedEntrances = new Map([
    ['castle-door', [700, 515]],
    ['weapon-shop', [230, 385]],
    ['armor-shop', [1240, 390]],
    ['item-shop', [215, 680]],
    ['inn', [1180, 725]],
    ['card-shop', [195, 950]]
  ]);
  for (const [id, point] of expectedEntrances) {
    const interaction = PAST_INTERACTIONS.find(candidate => candidate.id === id);
    assert.deepEqual(interaction?.point, point, `${id} should align with its painted stairs`);
  }
});

test('castle collision follows walls, throne dais, pillars, and the open center aisle', () => {
  assert.ok(CASTLE_COLLISION_RECTS.length >= 7);
  assert.equal(canStandInPastArea('castle', 500, 400, 10), true, 'center carpet should be walkable');
  assert.equal(canStandInPastArea('castle', 65, 400, 10), false, 'west wall should block movement');
  assert.equal(canStandInPastArea('castle', 500, 150, 10), false, 'throne dais should block movement');
  assert.equal(canStandInPastArea('castle', 165, 310, 10), false, 'painted pillar should block movement');
  assert.equal(canStandInPastArea('castle', 250, 710, 10), false, 'lower railing should block movement');
  assert.equal(canStandInPastArea('castle', 500, 710, 10), true, 'center exit stairs should remain open');
});

test('town walls block their visible perimeter while leaving the south gate open', () => {
  assert.ok(TOWN_WALLS.length >= 4);
  assert.equal(canStandInPastArea('castle-town', 70, 500, 6), false);
  assert.equal(canStandInPastArea('castle-town', 700, 950, 6), true);
});

test('every shop counter and town gate has a reachable approach from the south entrance', () => {
  const destinations = PAST_INTERACTIONS.filter(interaction =>
    interaction.area === 'castle-town'
    && (interaction.serviceId || ['castle-door', 'capital-exit'].includes(interaction.id))
  );
  const reached = reachableTownInteractions(destinations);
  assert.deepEqual([...reached].sort(), destinations.map(destination => destination.id).sort());
});

test('overworld interactions scale with the high-resolution world', () => {
  const interaction = nearbyPastInteraction('overworld', {
    x: PAST_START.capitalGatePoint[0] * 4,
    y: PAST_START.capitalGatePoint[1] * 4
  }, 4);
  assert.equal(interaction.id, 'capital-gate');
});

test('an area transition can recover from a spawn point on the edge of the road mask', () => {
  const point = nearestWalkablePoint([0, 0], (x, y) => x === 16 && y === 0, 32, 8);
  assert.deepEqual(point, [16, 0]);
});

test('the shared page exposes touch dialogue and interaction controls', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /id="v2-dialogue"/);
  assert.match(html, /<button id="v2-interaction-prompt"/);
  assert.doesNotMatch(html, /id="v2-interact"/);
  assert.match(html, /v2-past-story\.js/);
  assert.match(html, /v2-past-campaign\.js/);
  assert.match(html, /id="v2-shop"/);
  assert.match(html, /id="v2-open-bag"/);
  assert.match(runtime, /drawCastleTown/);
  assert.match(runtime, /drawCastleInterior/);
  assert.match(runtime, /activatePastInteraction/);
});

test('all town businesses open their implemented service instead of a placeholder dialogue', () => {
  const businessIds = ['weapon-shop', 'armor-shop', 'item-shop', 'inn', 'card-shop'];
  const interactions = businessIds.map(id => activatePastInteraction(
    createPastStory({ area: 'castle-town', phase: 'first-mission' }), id
  ));
  assert.deepEqual(interactions.map(result => result.serviceId), ['weapon', 'armor', 'item', 'inn', 'card']);
  assert.ok(interactions.every(result => result.dialogue === null));
});

test('the old watchtower quest is unlocked only after the royal audience', () => {
  const interaction = PAST_INTERACTIONS.find(item => item.id === 'old-watchtower');
  const beforeAudience = createPastStory({ area: 'overworld', phase: 'seek-king' });
  const afterAudience = createPastStory({ area: 'overworld', phase: 'first-mission' });
  assert.equal(interaction.unlockAfter, 'king-audience');
  assert.equal(storyUnlocksInteraction(beforeAudience, interaction), false);
  assert.equal(storyUnlocksInteraction(afterAudience, interaction), true);
  assert.equal(activatePastInteraction(beforeAudience, 'old-watchtower').actionId, null);
  assert.equal(activatePastInteraction(afterAudience, 'old-watchtower').actionId, 'watchtower');
});

test('watchtower drawing and minimap visibility use the same first-mission gate', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const towerRenderer = runtime.slice(runtime.indexOf('function drawPastWatchtower'), runtime.indexOf('function drawPastCardDiscoveries'));
  const minimapRenderer = runtime.slice(runtime.indexOf('function drawMap()'), runtime.indexOf('function render()'));
  assert.match(towerRenderer, /storyAllowsEncounters\(storyState\)/);
  assert.doesNotMatch(towerRenderer, /royalRewardClaimed/);
  assert.match(minimapRenderer, /storyAllowsEncounters\(storyState\)/);
});

test('the western road contains two visible card discoveries', () => {
  const discoveries = PAST_INTERACTIONS.filter(interaction => interaction.actionId?.startsWith('discover-card:'));
  assert.deepEqual(discoveries.map(interaction => interaction.actionId), [
    'discover-card:frost',
    'discover-card:mend'
  ]);
  assert.ok(discoveries.every(interaction => interaction.area === 'overworld'));
  assert.ok(discoveries.every(interaction => interaction.unlockAfter === 'watchtower-boss'));
  assert.equal(PAST_INTERACTIONS.some(interaction => interaction.actionId === 'learn-first-magic'), true);
});

test('the traveling mage remains visible and talkable before and after teaching magic', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const tutorRenderer = runtime.slice(runtime.indexOf('function drawPastMagicTutor'), runtime.indexOf('function roundedRectanglePath'));
  const availability = runtime.slice(runtime.indexOf('function pastInteractionAvailable'), runtime.indexOf('function transitionStoryArea'));
  const overworldRenderer = runtime.slice(runtime.indexOf('function render()'), runtime.indexOf('function renderBattle'));
  const tutor = PAST_INTERACTIONS.find(interaction => interaction.actionId === 'learn-first-magic');

  assert.doesNotMatch(tutorRenderer, /canLearnFirstMagic/);
  assert.match(tutorRenderer, /pastEventImages/);
  assert.match(tutorRenderer, /drawImage/);
  assert.match(availability, /learn-first-magic[^\n]+return true/);
  assert.match(runtime, /first-magic-after/);
  assert.ok(tutor.point[0] < 222, 'the mage should stand west of the castle artwork');
  assert.ok(overworldRenderer.indexOf('drawPastMagicTutor()') > overworldRenderer.indexOf('drawDepthSortedEntities()'), 'the mage should render above landmark art');
});

test('overworld people and event structures except the capital gate are rendered from raster assets', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  for (const [start, end] of [
    ['function drawPastWatchtower', 'function drawPastCardDiscoveries'],
    ['function drawPastCardDiscoveries', 'function drawPastMagicTutor'],
    ['function drawPastMagicTutor', 'function roundedRectanglePath']
  ]) {
    const renderer = runtime.slice(runtime.indexOf(start), runtime.indexOf(end));
    assert.match(renderer, /pastEventImages/);
    assert.match(renderer, /drawImage/);
  }
});

test('the capital gate uses the original vector marker', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const renderer = runtime.slice(runtime.indexOf('function drawPastCapitalGate'), runtime.indexOf('function drawPastCrossroadsGate'));
  assert.match(renderer, /ctx\.arc/);
  assert.doesNotMatch(renderer, /drawImage|pastEventImages/);
});

test('the capital marker stays visible while enemies wait for the royal mission', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const gateRenderer = runtime.slice(runtime.indexOf('function drawPastCapitalGate'), runtime.indexOf('function drawPastWatchtower'));
  const enemyRenderer = runtime.slice(runtime.indexOf('function drawPastEnemies'), runtime.indexOf('function drawDepthSortedEntities'));
  assert.doesNotMatch(gateRenderer, /storyAllowsEncounters/);
  assert.doesNotMatch(enemyRenderer, /storyAllowsEncounters/);
});

test('defeated route enemies stay clear long enough to reach the watchtower', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(runtime, /defeatedRoadEnemies\.includes\(enemy\.id\)/);
  assert.match(runtime, /respawnAt: now \+ 300000/);
});
