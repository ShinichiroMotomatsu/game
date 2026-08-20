const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  CASTLE_NPCS,
  CASTLE_COLLISION_RECTS,
  CROSSROADS_BUILDINGS,
  CROSSROADS_DUNGEON_LAYOUT,
  CROSSROADS_NPCS,
  CROSSROADS_CLUE_IDS,
  CROSSROADS_WATERGATES,
  MIST_CITADEL_NPCS,
  MIST_CLUE_IDS,
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
  dungeonPointIsWalkable,
  nearestWalkablePoint,
  nearbyPastInteraction,
  mistInvestigationResult,
  storyAllowsEncounters,
  storyEncounterMode,
  setDebugQuestCompletion,
  storyUnlocksInteraction,
  storyObjective
} = require('../v2-past-story.js');

test('chapter one is driven by the hero mystery and answers one question while opening another', () => {
  const arrival = STORY_DIALOGUES['capital-rescue'].lines.map(line => line.text).join('');
  const audience = STORY_DIALOGUES['king-audience'].lines.map(line => line.text).join('');
  const cleared = STORY_DIALOGUES['watchtower-cleared'].lines.map(line => line.text).join('');

  assert.match(arrival, /初めて|一度も見たこと/);
  assert.match(audience, /父|羅針盤/);
  assert.match(cleared, /外から|目覚め/);
});

test('a new game opens aboard ship, shows the father compass, and later reveals the matching crest', () => {
  const openingVisuals = STORY_DIALOGUES.arrival.lines.map(line => line.visualId);
  const clearedVisuals = STORY_DIALOGUES['watchtower-cleared'].lines.map(line => line.visualId).filter(Boolean);
  const sealRelease = STORY_DIALOGUES['watchtower-seal-release'];

  assert.deepEqual(openingVisuals, ['voyage', 'compass', 'voyage']);
  assert.match(STORY_DIALOGUES.arrival.lines.map(line => line.text).join(''), /船|新大陸|羅針盤/);
  assert.ok(clearedVisuals.includes('watchtower-crest'));
  assert.equal(sealRelease.onComplete, 'watchtower-seal-release');
  assert.match(sealRelease.lines.map(line => line.text).join(''), /封印|霧|羅針盤/);
});

test('chapter two requires any two of three independent clues before the waterway opens', () => {
  const door = PAST_INTERACTIONS.find(interaction => interaction.id === 'crossroads-dungeon-door');
  let story = createPastStory({ phase: 'second-mission', area: 'crossroads-town' });
  assert.equal(CROSSROADS_CLUE_IDS.length, 3);
  assert.equal(storyUnlocksInteraction(story, door), false);

  story = completeStoryEvent(story, `crossroads-clue:${CROSSROADS_CLUE_IDS[0]}`);
  assert.equal(story.crossroadsClues.length, 1);
  assert.equal(storyUnlocksInteraction(story, door), false);
  story = completeStoryEvent(story, `crossroads-clue:${CROSSROADS_CLUE_IDS[1]}`);
  assert.equal(story.crossroadsClues.length, 2);
  assert.equal(storyUnlocksInteraction(story, door), true);
});

test('the third chapter opens a fog citadel with three leads and any two determine a tactical route', () => {
  let story = createPastStory({ phase: 'second-mission-complete', area: 'castle' });
  story = completeStoryEvent(story, 'mist-mission-start');
  assert.equal(story.phase, 'third-mission');

  const gate = PAST_INTERACTIONS.find(interaction => interaction.id === 'mist-citadel-gate');
  assert.equal(storyUnlocksInteraction(story, gate), true);
  const entered = activatePastInteraction({ ...story, area: 'overworld' }, gate.id);
  assert.equal(entered.state.area, 'mist-citadel');
  assert.equal(MIST_CITADEL_NPCS.filter(npc => MIST_CLUE_IDS.includes(npc.clueId)).length, 3);

  story = completeStoryEvent(story, `mist-clue:${MIST_CLUE_IDS[0]}`);
  story = completeStoryEvent(story, `mist-clue:${MIST_CLUE_IDS[2]}`);
  const result = mistInvestigationResult(story);
  assert.equal(story.mistClues.length, 2);
  assert.ok(result.approach && result.ally && result.bossWeakness);
  const tower = PAST_INTERACTIONS.find(interaction => interaction.id === 'mist-bell-tower-door');
  assert.equal(storyUnlocksInteraction(story, tower), true);
});

test('defeating the bell warden clears the fog and completes chapter three after reporting', () => {
  const active = createPastStory({ phase: 'third-mission', mistClues: MIST_CLUE_IDS.slice(0, 2) });
  const report = completeStoryEvent(active, 'mist-boss-defeated');
  const complete = completeStoryEvent(report, 'mist-report-complete');

  assert.equal(report.phase, 'third-mission-report');
  assert.equal(complete.phase, 'third-mission-complete');
  assert.match(storyObjective(report), /王.*報告/);
});

test('debug quest controls keep story and boss flags consistent in both directions', () => {
  const initialStory = createPastStory({ phase: 'first-mission', area: 'castle-town' });
  const initialCampaign = { bossDefeated: false, crossroadsBossDefeated: false, mistBossDefeated: false, watchtowerReached: false, sealFragments: [] };
  const firstCleared = setDebugQuestCompletion(initialStory, initialCampaign, 'watchtower', true);
  const secondCleared = setDebugQuestCompletion(firstCleared.story, firstCleared.campaign, 'crossroads', true);
  const thirdCleared = setDebugQuestCompletion(secondCleared.story, secondCleared.campaign, 'mist-citadel', true);
  const thirdReopened = setDebugQuestCompletion(thirdCleared.story, thirdCleared.campaign, 'mist-citadel', false);
  const secondReopened = setDebugQuestCompletion(thirdReopened.story, thirdReopened.campaign, 'crossroads', false);
  const firstReopened = setDebugQuestCompletion(secondReopened.story, secondReopened.campaign, 'watchtower', false);

  assert.equal(firstCleared.story.phase, 'first-mission-complete');
  assert.equal(firstCleared.campaign.bossDefeated, true);
  assert.equal(secondCleared.story.phase, 'second-mission-complete');
  assert.equal(secondCleared.campaign.crossroadsBossDefeated, true);
  assert.equal(thirdCleared.story.phase, 'third-mission-complete');
  assert.equal(thirdCleared.campaign.mistBossDefeated, true);
  assert.equal(thirdReopened.story.phase, 'third-mission');
  assert.equal(thirdReopened.campaign.mistBossDefeated, false);
  assert.equal(secondReopened.story.phase, 'second-mission');
  assert.equal(secondReopened.campaign.crossroadsBossDefeated, false);
  assert.equal(firstReopened.story.phase, 'first-mission');
  assert.equal(firstReopened.campaign.bossDefeated, false);
  assert.equal(firstReopened.campaign.crossroadsBossDefeated, false);
});

function reachableAreaInteractions(areaId, interactions, step = 8) {
  const start = PAST_AREAS[areaId].spawn;
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
      if (visited.has(key) || !canStandInPastArea(areaId, next[0], next[1], 6)) continue;
      visited.add(key);
      queue.push(next);
    }
  }
  return reached;
}

const reachableTownInteractions = interactions => reachableAreaInteractions('castle-town', interactions);

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

test('normal encounters stay locked until the king assigns the first mission', () => {
  const arrival = createPastStory();
  const audience = completeStoryEvent(arrival, 'arrival-complete');
  const mission = completeStoryEvent(audience, 'king-audience-complete');
  assert.equal(storyAllowsEncounters(arrival), false);
  assert.equal(storyAllowsEncounters(audience), false);
  assert.equal(storyAllowsEncounters(mission), true);
});

test('only one harmless-looking tutorial encounter can appear before the capital', () => {
  const arrival = createPastStory();
  const roadToCapital = completeStoryEvent(arrival, 'arrival-complete');
  const rescued = completeStoryEvent(roadToCapital, 'arrival-rescue-complete');
  const mission = completeStoryEvent(roadToCapital, 'king-audience-complete');
  const secondMission = createPastStory({ phase: 'second-mission', royalRewardClaimed: true });

  assert.equal(storyEncounterMode(arrival, 'road-mist-east'), 'hidden');
  assert.equal(storyEncounterMode(roadToCapital, 'road-mist-east'), 'tutorial');
  assert.equal(storyEncounterMode(roadToCapital, 'road-wolf'), 'hidden');
  assert.equal(storyEncounterMode(rescued, 'road-mist-east'), 'hidden');
  assert.equal(storyEncounterMode(mission, 'road-wolf'), 'normal');
  assert.equal(storyEncounterMode(mission, 'route-bog-mandrake'), 'hidden');
  assert.equal(storyEncounterMode(secondMission, 'route-bog-mandrake'), 'normal');
});

test('the first capital arrival acknowledges monsters as unknown creatures', () => {
  const beforeTown = createPastStory({ phase: 'seek-king' });
  const entry = activatePastInteraction(beforeTown, 'capital-gate');
  const acknowledged = completeStoryEvent(entry.state, 'capital-arrival-complete');
  const repeatedEntry = activatePastInteraction({ ...acknowledged, area: 'overworld' }, 'capital-gate');
  const arrivalText = [
    ...STORY_DIALOGUES['capital-arrival'].lines,
    ...STORY_DIALOGUES['capital-rescue'].lines
  ].map(line => line.text).join('');

  assert.equal(entry.dialogue.id, 'capital-arrival');
  assert.equal(acknowledged.capitalArrivalSeen, true);
  assert.equal(repeatedEntry.dialogue, null);
  assert.match(arrivalText, /新大陸/);
  assert.match(arrivalText, /見たこと|知らない/);
  assert.match(arrivalText, /異形|魔物/);
});

test('legacy saves already inside the capital migrate past the arrival scene', () => {
  const legacyInsideTown = createPastStory({ phase: 'seek-king', area: 'castle-town' });
  const currentDialoguePending = createPastStory({
    phase: 'seek-king', area: 'castle-town', capitalArrivalSeen: false
  });

  assert.equal(legacyInsideTown.capitalArrivalSeen, true);
  assert.equal(currentDialoguePending.capitalArrivalSeen, false);
});

test('the first magic scene treats magic as a new discovery for the hero', () => {
  const magicText = STORY_DIALOGUES['first-magic'].lines.map(line => line.text).join('');
  assert.match(magicText, /魔法/);
  assert.match(magicText, /初めて|知らなかった|見たこと/);
  assert.match(magicText, /新大陸/);
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

test('the traffic-hub town and dungeon form a reversible route after gathering enough testimony', () => {
  const chapterTwo = createPastStory({
    area: 'overworld',
    phase: 'second-mission',
    royalRewardClaimed: true,
    crossroadsClues: CROSSROADS_CLUE_IDS.slice(0, 2)
  });
  const town = activatePastInteraction(chapterTwo, 'crossroads-gate');
  assert.equal(town.state.area, 'crossroads-town');
  const dungeon = activatePastInteraction(town.state, 'crossroads-dungeon-door');
  assert.equal(dungeon.state.area, 'crossroads-dungeon');
  const returnToTown = activatePastInteraction(dungeon.state, 'crossroads-dungeon-exit');
  assert.equal(returnToTown.state.area, 'crossroads-town');
  assert.ok(CROSSROADS_NPCS.length >= 3);
});

test('the crossroads town offers all five businesses used by the capital', () => {
  const services = PAST_INTERACTIONS
    .filter(interaction => interaction.area === 'crossroads-town' && interaction.serviceId)
    .map(interaction => interaction.serviceId)
    .sort();

  assert.deepEqual(services, ['armor', 'card', 'inn', 'item', 'weapon']);
  assert.deepEqual(new Set(CROSSROADS_BUILDINGS.map(building => building.type)), new Set(services));
  assert.ok(CROSSROADS_BUILDINGS.every(building => building.label && building.labelPoint.length === 2));
});

test('townspeople explain the waterway failure and change their reports after it is restored', () => {
  const investigating = createPastStory({ area: 'crossroads-town', phase: 'second-mission' });
  const restored = createPastStory({ area: 'crossroads-town', phase: 'second-mission-report' });

  for (const npc of CROSSROADS_NPCS) {
    const before = activatePastInteraction(investigating, npc.id).dialogue.lines.map(line => line.text).join('');
    const after = activatePastInteraction(restored, npc.id).dialogue.lines.map(line => line.text).join('');
    assert.match(before, /水路|水門|方位核|祭壇/);
    assert.match(after, /開|戻|正常|静か/);
    assert.notEqual(before, after);
  }
});

test('every crossroads shop can be approached from the south gate', () => {
  const services = PAST_INTERACTIONS.filter(interaction => interaction.area === 'crossroads-town' && interaction.serviceId);
  const reached = reachableAreaInteractions('crossroads-town', services);
  assert.deepEqual([...reached].sort(), services.map(service => service.id).sort());
});

test('every fog-citadel lead, shop, gate, and exit is reachable from the south entrance', () => {
  const destinations = PAST_INTERACTIONS.filter(interaction => interaction.area === 'mist-citadel');
  const reached = reachableAreaInteractions('mist-citadel', destinations);
  assert.deepEqual([...reached].sort(), destinations.map(destination => destination.id).sort());
});

test('both bell-tower treasures, the altar, and the exit are reachable', () => {
  const destinations = PAST_INTERACTIONS.filter(interaction => interaction.area === 'mist-bell-tower');
  const reached = reachableAreaInteractions('mist-bell-tower', destinations);
  assert.deepEqual([...reached].sort(), destinations.map(destination => destination.id).sort());
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

test('the four-gate waterway is a large tile dungeon with water bridges and branching rooms', () => {
  const layout = CROSSROADS_DUNGEON_LAYOUT;
  const tileKinds = new Set(layout.rows.join(''));

  assert.equal(PAST_AREAS['crossroads-dungeon'].width, layout.columns * layout.tileSize);
  assert.equal(PAST_AREAS['crossroads-dungeon'].height, layout.rows.length * layout.tileSize);
  assert.equal(layout.columns, 60);
  assert.equal(layout.rows.length, 45);
  assert.equal(PAST_AREAS['crossroads-dungeon'].width, 3600);
  assert.equal(PAST_AREAS['crossroads-dungeon'].height, 2700);
  assert.ok(layout.rows.every(row => row.length === layout.columns));
  assert.ok(['#', '.', '~', '=', '>', 'A'].every(tile => tileKinds.has(tile)));
});

test('four named watergates surround the central altar route', () => {
  const directions = CROSSROADS_WATERGATES.map(gate => gate.direction).sort();
  const ids = new Set(CROSSROADS_WATERGATES.map(gate => gate.id));

  assert.equal(CROSSROADS_WATERGATES.length, 4);
  assert.equal(ids.size, 4);
  assert.deepEqual(directions, ['east', 'north', 'south', 'west']);
  assert.deepEqual(CROSSROADS_WATERGATES.map(gate => gate.rotationQuarterTurns).sort(), [0, 1, 2, 3]);
  assert.ok(CROSSROADS_WATERGATES.every(gate => gate.name.includes('水門')));
  assert.ok(CROSSROADS_WATERGATES.every(gate => dungeonPointIsWalkable(gate.point[0], gate.point[1], 8)));
});

test('the altar explains the runaway waterway before awakening the hidden guardian', () => {
  const altar = STORY_DIALOGUES['crossroads-altar-awakening'];
  const text = altar.lines.map(line => line.text).join('');

  assert.equal(altar.onComplete, 'crossroads-altar-awaken');
  assert.match(text, /方位核/);
  assert.match(text, /逆流|水圧|暴れ/);
  assert.match(text, /四つの水門/);
});

test('the restored waterway has separate altar and town dialogue', () => {
  const stable = STORY_DIALOGUES['crossroads-altar-stable'].lines.map(line => line.text).join('');
  const cleared = STORY_DIALOGUES['crossroads-boss-cleared'].lines.map(line => line.text).join('');

  assert.match(stable, /正常|穏やか/);
  assert.match(cleared, /四つの水門/);
});

test('every waterway treasure and the boss altar are reachable from the entrance by walkable tiles', () => {
  const layout = CROSSROADS_DUNGEON_LAYOUT;
  const tileSize = layout.tileSize;
  const start = PAST_AREAS['crossroads-dungeon'].spawn.map(value => Math.floor(value / tileSize));
  const queue = [start];
  const reached = new Set([start.join(',')]);
  while (queue.length) {
    const [column, row] = queue.shift();
    for (const [nextColumn, nextRow] of [[column + 1, row], [column - 1, row], [column, row + 1], [column, row - 1]]) {
      const key = `${nextColumn},${nextRow}`;
      const x = (nextColumn + 0.5) * tileSize;
      const y = (nextRow + 0.5) * tileSize;
      if (reached.has(key) || !dungeonPointIsWalkable(x, y, 8)) continue;
      reached.add(key);
      queue.push([nextColumn, nextRow]);
    }
  }

  const goals = PAST_INTERACTIONS.filter(interaction => interaction.area === 'crossroads-dungeon');
  for (const goal of goals) {
    const key = `${Math.floor(goal.point[0] / tileSize)},${Math.floor(goal.point[1] / tileSize)}`;
    assert.equal(reached.has(key), true, `${goal.id} must be reachable`);
  }
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
  assert.match(runtime, /drawCrossroadsDungeonTiles/);
  assert.match(html, /id="v2-rest-transition"/);
  assert.match(html, /id="v2-shop-buy"/);
  assert.match(html, /id="v2-shop-sell"/);
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

test('the overworld consistently filters enemies and routes the tutorial battle to a soldier rescue', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const updater = runtime.slice(runtime.indexOf('function update(dt)'), runtime.indexOf('function drawMap()'));
  const enemyRenderer = runtime.slice(runtime.indexOf('function drawPastEnemies'), runtime.indexOf('function drawDepthSortedEntities'));
  const minimapRenderer = runtime.slice(runtime.indexOf('function drawMini'), runtime.indexOf('function render()'));
  const battleFlow = runtime.slice(runtime.indexOf('async function openBattle'), runtime.indexOf("battleResolve.addEventListener"));

  assert.match(updater, /storyEncounterMode/);
  assert.match(enemyRenderer, /storyEncounterMode/);
  assert.match(minimapRenderer, /storyEncounterMode/);
  assert.match(battleFlow, /tutorialRescue/);
  assert.match(battleFlow, /capital-rescue/);
  assert.match(battleFlow, /area: 'castle-town'/);
  assert.match(runtime, /!storyState\.capitalArrivalSeen/);
});

test('the tutorial story and runtime scripts use fresh browser cache versions', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  assert.match(html, /v2-past-story\.js\?edition=14/);
  assert.match(html, /v2\.js\?edition=18/);
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
