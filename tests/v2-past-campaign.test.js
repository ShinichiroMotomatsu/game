const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const {
  MAIN_STORY_PACING,
  FIRST_QUEST_LOADOUT,
  LEVEL_TABLE,
  SHOP_CATALOG,
  applyBattleVictory,
  battleProfile,
  buyProduct,
  canChallengeWatchtower,
  canDiscoverCard,
  canLearnFirstMagic,
  campaignObjective,
  createPastCampaign,
  discoverCard,
  learnFirstMagic,
  resolveDefeat,
  restAtInn,
  useItem
} = require('../v2-past-campaign.js');
const { ENEMY_LIBRARY } = require('../v2-battle.js');
const { createBattle, resolveTurn, toggleCard } = require('../v2-battle.js');
const { PAST_ENCOUNTERS } = require('../v2-past-world.js');

test('the 300G royal grant buys the recommended Dragon Quest-like starter loadout exactly', () => {
  const ids = FIRST_QUEST_LOADOUT;
  const total = ids.reduce((sum, id) => sum + Object.values(SHOP_CATALOG).flat().find(item => item.id === id).price, 0);
  assert.equal(total, 300);
});

test('the recommended first-quest purchases equip attack and defense before leaving town', () => {
  let campaign = createPastCampaign();
  let gold = 300;
  for (const productId of FIRST_QUEST_LOADOUT) {
    const purchase = buyProduct(campaign, gold, productId);
    assert.equal(purchase.ok, true);
    campaign = purchase.state;
    gold = purchase.gold;
  }
  const profile = battleProfile(campaign);
  assert.equal(gold, 0);
  assert.ok(profile.attackBonus >= 3);
  assert.ok(profile.defenseBonus >= 3);
  assert.equal(campaign.inventory.herb, 2);
});

test('a townsperson recommends the exact 300G preparation instead of the shop UI', () => {
  const runtime = fs.readFileSync('v2.js', 'utf8');
  const story = fs.readFileSync('v2-past-story.js', 'utf8');
  assert.match(story, /買い物帰りの女性/);
  assert.match(story, /銅の剣と皮の鎧、それにやくそうを二つ/);
  assert.doesNotMatch(runtime, /支度金300G|序盤おすすめ/);
});

test('buying equipment deducts gold and automatically equips the stronger item', () => {
  const bought = buyProduct(createPastCampaign(), 300, 'bronze-sword');
  assert.equal(bought.ok, true);
  assert.equal(bought.gold, 160);
  assert.equal(bought.state.equipment.weapon, 'bronze-sword');
});

test('a purchase is rejected when gold is insufficient without mutating state', () => {
  const campaign = createPastCampaign();
  const bought = buyProduct(campaign, 10, 'iron-sword');
  assert.equal(bought.ok, false);
  assert.equal(bought.state, campaign);
  assert.equal(bought.gold, 10);
});

test('card purchases are unique and extend the battle deck', () => {
  const first = buyProduct(createPastCampaign(), 300, 'flame-edge');
  const repeated = buyProduct(first.state, first.gold, 'flame-edge');
  assert.equal(first.state.ownedCards.includes('flame-edge'), true);
  assert.equal(battleProfile(first.state).deck.includes('flame-edge'), true);
  assert.equal(repeated.ok, false);
});

test('level progression spans fifteen levels and action points rise at major milestones', () => {
  assert.equal(LEVEL_TABLE.length, 15);
  assert.deepEqual(LEVEL_TABLE.map(level => level.exp), [0, 40, 110, 220, 380, 600, 880, 1230, 1650, 2150, 2730, 3390, 4130, 4950, 5850]);
  assert.deepEqual(LEVEL_TABLE.map(level => level.energy), [1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
  assert.ok(LEVEL_TABLE.every((level, index) => index === 0 || level.maxMp >= LEVEL_TABLE[index - 1].maxMp));
  const levelOne = battleProfile(createPastCampaign());
  assert.equal(levelOne.energy, 1);
  assert.equal(levelOne.maxMp, 6);
  assert.deepEqual(levelOne.deck, ['slash', 'focus', 'guard']);
});

test('seventy normal battles plus bosses reach the level fifteen cap', () => {
  const normalBattles = MAIN_STORY_PACING.reduce((sum, chapter) => sum + chapter.normalBattles, 0);
  const plannedXp = MAIN_STORY_PACING.reduce((sum, chapter) => sum + chapter.normalXp + chapter.bossXp, 0);
  const completed = applyBattleVictory(createPastCampaign(), { xp: plannedXp }).state;
  assert.equal(normalBattles, 70);
  assert.equal(completed.level, 15);
  assert.ok(plannedXp >= LEVEL_TABLE.at(-1).exp);
});

test('the first magic requires one victory and grants spark plus one magic drop exactly once', () => {
  const start = createPastCampaign();
  const afterVictory = applyBattleVictory(start, { xp: 12, encounterId: 'road-first' }).state;
  assert.equal(canLearnFirstMagic(start), false);
  assert.equal(canLearnFirstMagic(afterVictory), true);
  const learned = learnFirstMagic(afterVictory);
  const repeated = learnFirstMagic(learned.state);
  assert.equal(learned.ok, true);
  assert.equal(learned.state.ownedCards.includes('spark'), true);
  assert.equal(learned.state.inventory['magic-water'], 1);
  assert.equal(repeated.ok, false);
  assert.equal(repeated.state.inventory['magic-water'], 1);
});

test('legacy saves retain the formerly built-in spark card while new games do not', () => {
  const legacy = createPastCampaign({ ownedCards: [], exp: 0 });
  const fresh = createPastCampaign();
  assert.equal(legacy.ownedCards.includes('spark'), true);
  assert.equal(fresh.ownedCards.includes('spark'), false);
});

test('later magic discoveries remain hidden until the first boss is defeated', () => {
  const campaign = createPastCampaign();
  assert.equal(canDiscoverCard(campaign, 'frost'), false);
  const found = discoverCard(createPastCampaign({ bossDefeated: true }), 'frost');
  const repeated = discoverCard(found.state, 'frost');
  assert.equal(found.ok, true);
  assert.equal(battleProfile(found.state).deck.includes('frost'), true);
  assert.equal(repeated.ok, false);
});

test('herbs heal outside battle and are consumed', () => {
  const campaign = createPastCampaign({ currentHp: 12, inventory: { herb: 2 } });
  const used = useItem(campaign, 'herb');
  assert.equal(used.ok, true);
  assert.equal(used.state.currentHp, 32);
  assert.equal(used.state.inventory.herb, 1);
});

test('the inn costs 12G and restores all HP and MP', () => {
  const campaign = createPastCampaign({ currentHp: 5, currentMp: 1 });
  const rested = restAtInn(campaign, 50);
  assert.equal(rested.ok, true);
  assert.equal(rested.gold, 38);
  assert.equal(rested.state.currentHp, battleProfile(campaign).maxHp);
  assert.equal(rested.state.currentMp, battleProfile(campaign).maxMp);
});

test('four western-road victories reach level two and the boss reward reaches level three', () => {
  let campaign = createPastCampaign();
  for (const encounter of PAST_ENCOUNTERS) {
    campaign = applyBattleVictory(campaign, {
      xp: ENEMY_LIBRARY[encounter.enemyId].xp,
      playerHp: 30,
      encounterId: encounter.id
    }).state;
  }
  assert.equal(campaign.level, 2);
  assert.equal(campaign.roadVictories, 4);
  campaign = learnFirstMagic(campaign).state;
  campaign = applyBattleVictory(campaign, { xp: ENEMY_LIBRARY['mist-watcher'].xp, encounterId: 'watchtower-boss' }).state;
  assert.equal(campaign.level, 3);
  assert.equal(campaign.exp, 146);
  assert.equal(battleProfile(campaign).energy, 1);
});

test('the mid-boss durability targets roughly eight action-one turns', () => {
  const expectedTurns = Math.ceil(ENEMY_LIBRARY['mist-watcher'].maxHp / 11);
  assert.ok(expectedTurns >= 7 && expectedTurns <= 9);
});

function slashUntilBattleEnds(profile, turnLimit = 20, enemyId = 'mist-watcher') {
  let battle = createBattle(enemyId, () => 0, profile);
  while (battle.status === 'active' && battle.turn <= turnLimit) {
    battle = toggleCard(battle, 'slash');
    battle = resolveTurn(battle, () => 0);
  }
  return battle;
}

test('level-two recommended equipment crosses the first boss survival threshold', () => {
  const equipped = battleProfile(createPastCampaign({
    exp: 66,
    currentHp: 47,
    equipment: { weapon: 'bronze-sword', armor: 'leather-armor' },
    ownedCards: ['spark'],
    schemaVersion: 2
  }));
  const unequipped = battleProfile(createPastCampaign({
    exp: 66,
    currentHp: 47,
    ownedCards: ['spark'],
    schemaVersion: 2
  }));
  const equippedResult = slashUntilBattleEnds(equipped);
  const unequippedResult = slashUntilBattleEnds(unequipped);
  assert.equal(equippedResult.status, 'victory');
  assert.ok(equippedResult.turn >= 8 && equippedResult.turn <= 12);
  assert.ok(equippedResult.player.hp > 0);
  assert.equal(unequippedResult.status, 'defeat');
});

test('the complete recommended first-quest route reaches level three after the mid-boss', () => {
  let campaign = createPastCampaign();
  let gold = 300;
  for (const productId of FIRST_QUEST_LOADOUT) {
    const purchase = buyProduct(campaign, gold, productId);
    campaign = purchase.state;
    gold = purchase.gold;
  }

  for (const [index, encounter] of PAST_ENCOUNTERS.entries()) {
    const result = slashUntilBattleEnds(battleProfile(campaign), 20, encounter.enemyId);
    assert.equal(result.status, 'victory', `${encounter.enemyId} should be beatable with the recommended gear`);
    campaign = applyBattleVictory(campaign, {
      xp: result.reward.xp,
      playerHp: result.player.hp,
      playerMp: result.player.mp,
      encounterId: encounter.id
    }).state;
    gold += result.reward.gold;
    if (index === 0) campaign = learnFirstMagic(campaign).state;
    if (campaign.currentHp < 30) {
      const herb = useItem(campaign, 'herb');
      if (herb.ok) campaign = herb.state;
      else {
        const rest = restAtInn(campaign, gold);
        assert.equal(rest.ok, true);
        campaign = rest.state;
        gold = rest.gold;
      }
    }
  }

  const rest = restAtInn(campaign, gold);
  assert.equal(rest.ok, true);
  campaign = rest.state;
  gold = rest.gold;
  assert.equal(campaign.level, 2);
  assert.equal(campaign.roadVictories, 4);

  const boss = slashUntilBattleEnds(battleProfile(campaign));
  assert.equal(boss.status, 'victory');
  campaign = applyBattleVictory(campaign, {
    xp: boss.reward.xp,
    playerHp: boss.player.hp,
    playerMp: boss.player.mp,
    encounterId: 'watchtower-boss'
  }).state;
  gold += boss.reward.gold;
  assert.equal(campaign.level, 3);
  assert.equal(campaign.bossDefeated, true);
  assert.ok(gold >= 100);
});

test('repeat farming gives experience but does not duplicate watchtower seal progress', () => {
  let campaign = createPastCampaign();
  campaign = applyBattleVictory(campaign, { xp: 12, playerHp: 30, encounterId: 'road-a' }).state;
  campaign = applyBattleVictory(campaign, { xp: 12, playerHp: 25, encounterId: 'road-a' }).state;
  assert.equal(campaign.exp, 24);
  assert.equal(campaign.roadVictories, 1);
});

test('the watchtower opens after four different road enemies are defeated', () => {
  const locked = createPastCampaign({ defeatedRoadEnemies: ['road-a', 'road-b', 'road-c'] });
  const sealed = createPastCampaign({ defeatedRoadEnemies: ['road-a', 'road-b', 'road-c', 'road-d'] });
  const open = learnFirstMagic(sealed).state;
  assert.equal(canChallengeWatchtower(locked), false);
  assert.equal(canChallengeWatchtower(sealed), false);
  assert.equal(canChallengeWatchtower(open), true);
});

test('campaign objectives count seal fragments and then point to the mid-boss', () => {
  assert.match(campaignObjective(createPastCampaign({ defeatedRoadEnemies: ['road-a'] })), /魔導士/);
  const underway = learnFirstMagic(createPastCampaign({ defeatedRoadEnemies: ['road-a', 'road-b'] })).state;
  assert.match(campaignObjective(underway), /2\/4/);
  const ready = learnFirstMagic(createPastCampaign({ defeatedRoadEnemies: ['road-a', 'road-b', 'road-c', 'road-d'] })).state;
  assert.match(campaignObjective(ready), /見張り台/);
  assert.match(campaignObjective(createPastCampaign({ bossDefeated: true })), /調査完了/);
});

test('defeat halves gold and returns the hero fully healed', () => {
  const defeated = resolveDefeat(createPastCampaign({ currentHp: 1, currentMp: 0 }), 301);
  assert.equal(defeated.gold, 150);
  assert.equal(defeated.state.currentHp, battleProfile(defeated.state).maxHp);
  assert.equal(defeated.state.currentMp, battleProfile(defeated.state).maxMp);
});

test('equipment and levels feed attack defense HP and the customized deck into battle', () => {
  const campaign = createPastCampaign({
    level: 3,
    exp: 110,
    currentHp: 49,
    currentMp: 7,
    equipment: { weapon: 'bronze-sword', armor: 'leather-armor' },
    ownedCards: ['flame-edge']
  });
  const profile = battleProfile(campaign);
  assert.equal(profile.maxHp, 52);
  assert.equal(profile.attackBonus, 4);
  assert.equal(profile.defenseBonus, 4);
  assert.equal(profile.hp, 49);
  assert.equal(profile.mp, 7);
  assert.equal(profile.maxMp, 8);
  assert.equal(profile.energy, 1);
  assert.equal(profile.deck.includes('flame-edge'), true);
});

test('battle victory carries remaining MP and level-up refills both resources', () => {
  const levelOne = createPastCampaign({ exp: 0, currentHp: 20, currentMp: 1 });
  const ordinary = applyBattleVictory(levelOne, { xp: 5, playerHp: 17, playerMp: 0 }).state;
  assert.equal(ordinary.currentMp, 0);

  const leveled = applyBattleVictory(ordinary, { xp: 40, playerHp: 5, playerMp: 0 }).state;
  assert.equal(leveled.level, 2);
  assert.equal(leveled.currentHp, LEVEL_TABLE[1].maxHp);
  assert.equal(leveled.currentMp, LEVEL_TABLE[1].maxMp);
});
