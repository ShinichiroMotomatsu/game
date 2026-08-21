const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const {
  SIDE_QUESTS,
  SIDE_DUNGEONS,
  SIDE_DUNGEON_ENCOUNTERS,
  SIDE_QUEST_KEY_ITEMS,
  activateCooledSluice,
  acceptAvailableSideQuests,
  cooledSluiceDestination,
  completeSideQuest,
  createSideDungeonEnemies,
  createSideQuestProgress,
  isNearActiveSideQuestEntrance,
  isSideQuestArea,
  resolveDungeonStep,
  sideQuestDungeonPointIsWalkable,
  sideQuestObjective,
  sideQuestStatus
} = require('../v2-past-sidequests.js');

const {
  LEVEL_TABLE,
  applySideQuestBattleVictory,
  battleProfile,
  createPastCampaign,
  restartCampaignKeepingGrowth,
  setSideQuestDebugCompletion
} = require('../v2-past-campaign.js');

const { CARD_LIBRARY, ENEMY_LIBRARY } = require('../v2-battle.js');
const { PAST_AREAS, PAST_INTERACTIONS, STORY_DIALOGUES } = require('../v2-past-story.js');

function pastRoadPointIsWalkable(x, y, radius = 6) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync('assets/v2/road-collision-past-data.js', 'utf8'), sandbox);
  const collision = sandbox.window.V2_ROAD_COLLISION_PAST;
  const diagonal = radius * Math.SQRT1_2;
  return [
    [0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius],
    [diagonal, diagonal], [diagonal, -diagonal], [-diagonal, diagonal], [-diagonal, -diagonal]
  ].every(([offsetX, offsetY]) => {
    const maskX = Math.round(x + offsetX);
    const maskY = Math.round(y + offsetY);
    return collision.runs[maskY]?.some(([start, end]) => maskX >= start && maskX < end);
  });
}

function reachableDungeonTiles(dungeonId, keyItems = []) {
  const dungeon = SIDE_DUNGEONS[dungeonId];
  const start = dungeon.spawn.map(value => Math.floor(value / dungeon.tileSize));
  const queue = [start];
  const reached = new Set([start.join(',')]);
  for (let index = 0; index < queue.length; index += 1) {
    const [column, row] = queue[index];
    for (const [nextColumn, nextRow] of [[column + 1, row], [column - 1, row], [column, row + 1], [column, row - 1]]) {
      const key = `${nextColumn},${nextRow}`;
      const x = (nextColumn + 0.5) * dungeon.tileSize;
      const y = (nextRow + 0.5) * dungeon.tileSize;
      if (reached.has(key) || !sideQuestDungeonPointIsWalkable(dungeonId, x, y, 8, keyItems)) continue;
      reached.add(key);
      queue.push([nextColumn, nextRow]);
    }
  }
  return reached;
}

test('the three optional quests unlock together after the Four-Gate Waterway with distinct difficulty', () => {
  assert.deepEqual(SIDE_QUESTS.map(quest => quest.id), ['sunken-shrine', 'ice-lantern', 'molten-crown']);
  assert.deepEqual(SIDE_QUESTS.map(quest => quest.recommendedLevel), [6, 9, 14]);
  assert.ok(SIDE_QUESTS.every(quest => quest.unlockAfter === 'crossroads-boss'));

  const locked = createSideQuestProgress();
  assert.equal(sideQuestStatus(locked, 'sunken-shrine', false), 'locked');
  assert.equal(sideQuestStatus(locked, 'sunken-shrine', true), 'available');
  const accepted = acceptAvailableSideQuests(locked, true);
  assert.deepEqual(accepted.acceptedQuestIds, SIDE_QUESTS.map(quest => quest.id));
  assert.equal(sideQuestStatus(accepted, 'molten-crown', true), 'active');
});

test('each side dungeon spans multiple screens and has terrain, three regular monsters, and a boss', () => {
  for (const quest of SIDE_QUESTS) {
    const dungeon = SIDE_DUNGEONS[quest.dungeonId];
    assert.ok(dungeon.width >= 2400, `${quest.id} width`);
    assert.ok(dungeon.height >= 1600, `${quest.id} height`);
    assert.equal(dungeon.rows.length * dungeon.tileSize, dungeon.height);
    assert.ok(dungeon.rows.every(row => row.length * dungeon.tileSize === dungeon.width));
    assert.ok(dungeon.rows.some(row => [...row].some(tile => dungeon.hazardTiles.includes(tile))));
    const encounters = SIDE_DUNGEON_ENCOUNTERS.filter(encounter => encounter.dungeonId === quest.dungeonId);
    assert.ok(encounters.filter(encounter => !encounter.boss && !encounter.midboss).length >= 3, `${quest.id} regular encounters`);
    assert.equal(encounters.filter(encounter => encounter.boss).length, 1, `${quest.id} boss`);
  }
});

test('side dungeon enemies roam visibly and respawn from their authored patrols', () => {
  const enemies = createSideDungeonEnemies('poison-sanctum');
  assert.ok(enemies.length >= 3);
  assert.ok(enemies.every(enemy => enemy.active && enemy.patrol.length >= 2));
  assert.ok(enemies.every(enemy => Number.isFinite(enemy.x) && Number.isFinite(enemy.y)));
  assert.ok(enemies.every(enemy => !enemy.boss));
  for (const encounter of SIDE_DUNGEON_ENCOUNTERS.filter(candidate => !candidate.boss && !candidate.midboss)) {
    for (const point of encounter.patrol) {
      assert.equal(sideQuestDungeonPointIsWalkable(encounter.dungeonId, ...point, 0, ['fire-rat-boots']), true, `${encounter.id} patrol`);
    }
  }
});

test('both cooling sluices create a traversable shortcut across the caldera', () => {
  let progress = createSideQuestProgress({ keyItems: ['fire-rat-boots'] });
  progress = activateCooledSluice(progress, 'west');
  assert.equal(cooledSluiceDestination(progress, 'west'), null);
  progress = activateCooledSluice(progress, 'east');
  assert.deepEqual(cooledSluiceDestination(progress, 'west'), [2070, 930]);
  assert.deepEqual(cooledSluiceDestination(progress, 'east'), [630, 930]);
});

test('every side dungeon has a completable route and lava remains gated by its midboss reward', () => {
  const altarKey = '22,2';
  assert.equal(reachableDungeonTiles('poison-sanctum').has(altarKey), true);
  assert.equal(reachableDungeonTiles('ice-lantern-cavern').has(altarKey), true);

  const beforeBoots = reachableDungeonTiles('molten-crown-caldera');
  assert.equal(beforeBoots.has('22,17'), true, 'the fire-rat chief must be reachable without fireproof boots');
  assert.equal(beforeBoots.has(altarKey), false, 'the crown altar must remain beyond mandatory lava');
  assert.equal(reachableDungeonTiles('molten-crown-caldera', ['fire-rat-boots']).has(altarKey), true);
});

test('an accepted sidequest entrance is a safe interaction zone on the overworld', () => {
  const progress = acceptAvailableSideQuests(createSideQuestProgress(), true);
  const [x, y] = SIDE_QUESTS[0].overworldPoint;
  assert.equal(isNearActiveSideQuestEntrance(progress, true, x * 4, y * 4, 4), true);
  assert.equal(isNearActiveSideQuestEntrance(progress, true, (x + 80) * 4, y * 4, 4), false);
  assert.equal(isNearActiveSideQuestEntrance(createSideQuestProgress(), true, x * 4, y * 4, 4), false);
});

test('all three sidequest entrances sit fully inside the authored overworld road mask', () => {
  for (const quest of SIDE_QUESTS) {
    assert.equal(pastRoadPointIsWalkable(...quest.overworldPoint), true, `${quest.id} road access`);
  }
});

test('poison, cold, braziers, and lava resolve as readable terrain rules', () => {
  const poisoned = resolveDungeonStep({ dungeonId: 'poison-sanctum', tile: 'P', hp: 10, warmth: 8, keyItems: [] });
  assert.equal(poisoned.hp, 8);
  assert.equal(poisoned.damage, 2);
  assert.equal(resolveDungeonStep({ dungeonId: 'poison-sanctum', tile: 'P', hp: 1, warmth: 8, keyItems: [] }).hp, 1);
  assert.equal(resolveDungeonStep({ dungeonId: 'poison-sanctum', tile: 'P', hp: 10, warmth: 8, keyItems: ['swamp-ward-charm'] }).damage, 0);

  const chilled = resolveDungeonStep({ dungeonId: 'ice-lantern-cavern', tile: 'I', hp: 10, warmth: 1, keyItems: [] });
  assert.equal(chilled.warmth, 0);
  assert.equal(chilled.damage, 2);
  assert.equal(resolveDungeonStep({ dungeonId: 'ice-lantern-cavern', tile: 'B', hp: 8, warmth: 0, keyItems: [] }).warmth, 8);

  const lavaPoint = SIDE_DUNGEONS['molten-crown-caldera'].samples.lava;
  assert.equal(sideQuestDungeonPointIsWalkable('molten-crown-caldera', ...lavaPoint, 0, []), false);
  assert.equal(sideQuestDungeonPointIsWalkable('molten-crown-caldera', ...lavaPoint, 0, ['fire-rat-boots']), true);
});

test('the optional arc records the parents meeting, trust, and vow without modern place names', () => {
  const allDialogue = SIDE_QUESTS.flatMap(quest => quest.journalLines).join('');
  assert.match(allDialogue, /地図師エルド/);
  assert.match(allDialogue, /灯守の薬師/);
  assert.match(allDialogue, /二つの小さな灯/);
  assert.match(allDialogue, /誓い|結ば/);
  assert.doesNotMatch(allDialogue, /六本木|麻布台|東京|グランドタワー|レジデンス/);
});

test('completed altars let the player reread every recovered page of the parents story', () => {
  for (const quest of SIDE_QUESTS) {
    const stableText = STORY_DIALOGUES[`${quest.id}-boss-stable`].lines.map(line => line.text).join('');
    for (const journalLine of quest.journalLines) assert.match(stableText, new RegExp(journalLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('sidequest key items have readable names and effects for the inventory screen', () => {
  for (const keyItemId of ['swamp-ward-charm', 'fire-rat-boots']) {
    assert.ok(SIDE_QUEST_KEY_ITEMS[keyItemId]?.name);
    assert.ok(SIDE_QUEST_KEY_ITEMS[keyItemId]?.description);
  }
});

test('quest completion and journal fragments are idempotent and culminate in the twin-star vow', () => {
  let progress = acceptAvailableSideQuests(createSideQuestProgress(), true);
  for (const quest of SIDE_QUESTS) progress = completeSideQuest(progress, quest.id);
  const repeated = completeSideQuest(progress, SIDE_QUESTS[0].id);

  assert.deepEqual(progress.completedQuestIds, SIDE_QUESTS.map(quest => quest.id));
  assert.deepEqual(progress.journalFragments, [1, 2, 3]);
  assert.equal(progress.twinStarVowUnlocked, true);
  assert.deepEqual(repeated, progress);
});

test('campaign rewards side bosses once and inherited restart keeps growth but resets their story', () => {
  let campaign = createPastCampaign({
    level: 14,
    exp: LEVEL_TABLE[13].exp,
    sideQuests: { acceptedQuestIds: SIDE_QUESTS.map(quest => quest.id) }
  });
  const poison = applySideQuestBattleVictory(campaign, 'sidequest-sunken-shrine-boss');
  campaign = poison.state;
  const duplicate = applySideQuestBattleVictory(campaign, 'sidequest-sunken-shrine-boss');
  const volcanoMidboss = applySideQuestBattleVictory(campaign, 'sidequest-fire-rat-chief');

  assert.equal(poison.completedQuestId, 'sunken-shrine');
  assert.ok(campaign.ownedCards.includes('purify'));
  assert.ok(campaign.sideQuests.keyItems.includes('swamp-ward-charm'));
  assert.deepEqual(duplicate.state, campaign);
  assert.ok(volcanoMidboss.state.sideQuests.keyItems.includes('fire-rat-boots'));

  const restarted = restartCampaignKeepingGrowth(volcanoMidboss.state);
  assert.equal(restarted.level, 14);
  assert.ok(battleProfile(restarted).deck.includes('purify'));
  assert.deepEqual(restarted.sideQuests.completedQuestIds, []);
  assert.deepEqual(restarted.sideQuests.journalFragments, []);
  assert.deepEqual(restarted.sideQuests.keyItems, []);
});

test('debugging the caldera back to incomplete resets its dungeon switches but keeps earned growth', () => {
  const campaign = createPastCampaign({
    level: 14,
    exp: LEVEL_TABLE[13].exp,
    ownedCards: ['starflare'],
    ownedEquipment: ['twin-star-sword'],
    sideQuests: {
      acceptedQuestIds: ['molten-crown'],
      completedQuestIds: ['molten-crown'],
      keyItems: ['fire-rat-boots'],
      cooledSluiceIds: ['west', 'east']
    }
  });
  const reopened = setSideQuestDebugCompletion(campaign, 'molten-crown', false);

  assert.deepEqual(reopened.sideQuests.completedQuestIds, []);
  assert.deepEqual(reopened.sideQuests.cooledSluiceIds, []);
  assert.equal(reopened.sideQuests.keyItems.includes('fire-rat-boots'), false);
  assert.ok(reopened.ownedCards.includes('starflare'));
  assert.ok(reopened.ownedEquipment.includes('twin-star-sword'));
});

test('sidequest combat definitions include readable rewards and balanced biome enemies', () => {
  for (const id of ['miasma-slime', 'marsh-leech', 'spore-mandrake', 'miasma-root', 'ice-wisp', 'snow-wolf', 'frost-beetle', 'glacier-beast', 'lava-lizard', 'ash-bat', 'obsidian-golem', 'fire-rat-chief', 'crown-drake']) {
    assert.ok(ENEMY_LIBRARY[id], id);
    assert.ok(ENEMY_LIBRARY[id].xp > 0, `${id} xp`);
  }
  for (const cardId of ['purify', 'sunfire', 'starflare']) {
    assert.ok(CARD_LIBRARY[cardId], cardId);
    assert.ok(CARD_LIBRARY[cardId].discipline, `${cardId} discipline`);
    assert.ok(CARD_LIBRARY[cardId].attribute, `${cardId} attribute`);
  }
});

test('the quest board and three entrances are integrated into the explorable story map', () => {
  assert.ok(PAST_INTERACTIONS.some(interaction => interaction.id === 'quadra-sidequest-board'));
  for (const quest of SIDE_QUESTS) {
    assert.ok(PAST_AREAS[quest.dungeonId], quest.dungeonId);
    assert.ok(PAST_INTERACTIONS.some(interaction => interaction.id === quest.entranceInteractionId));
    assert.ok(PAST_INTERACTIONS.some(interaction => interaction.id === `${quest.id}-boss-altar`));
    assert.ok(STORY_DIALOGUES[`${quest.id}-boss-awakening`]);
    assert.ok(STORY_DIALOGUES[`${quest.id}-cleared`]);
  }
  assert.match(sideQuestObjective(createSideQuestProgress(), 'poison-sanctum'), /四門水路|依頼板/);
  assert.equal(isSideQuestArea('poison-sanctum'), true);
  assert.equal(isSideQuestArea('castle-town'), false);
});

test('the browser runtime loads and handles sidequest exploration rather than exposing data only', () => {
  const html = fs.readFileSync('v2.html', 'utf8');
  const runtime = fs.readFileSync('v2.js', 'utf8');
  assert.match(html, /v2-past-sidequests\.js\?edition=/);
  assert.match(runtime, /window\.V2_PAST_SIDEQUESTS/);
  assert.match(runtime, /drawSideQuestDungeon/);
  assert.match(runtime, /updateSideDungeonEnemies/);
  assert.match(runtime, /resolveDungeonStep/);
  assert.match(runtime, /applySideQuestBattleVictory/);
  assert.match(runtime, /sideDungeonMinis/);
  assert.match(runtime, /mctx\.drawImage\(sideDungeonMinis\.get\(areaId\)/);
  assert.match(runtime, /SIDE_QUEST_KEY_ITEMS\[keyItemId\]/);
});
