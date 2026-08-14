const test = require('node:test');
const assert = require('node:assert/strict');

const {
  LEVEL_TABLE,
  SHOP_CATALOG,
  applyBattleVictory,
  battleProfile,
  buyProduct,
  canChallengeWatchtower,
  campaignObjective,
  createPastCampaign,
  discoverCard,
  resolveDefeat,
  restAtInn,
  useItem
} = require('../v2-past-campaign.js');
const { ENEMY_LIBRARY } = require('../v2-battle.js');
const { PAST_ENCOUNTERS } = require('../v2-past-world.js');

test('the 300G royal grant buys the recommended Dragon Quest-like starter loadout exactly', () => {
  const ids = ['bronze-sword', 'leather-armor', 'herb', 'herb'];
  const total = ids.reduce((sum, id) => sum + Object.values(SHOP_CATALOG).flat().find(item => item.id === id).price, 0);
  assert.equal(total, 300);
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

test('level progression starts at one action point and gradually reaches three', () => {
  assert.deepEqual(LEVEL_TABLE.map(level => level.energy), [1, 2, 2, 3, 3]);
  assert.ok(LEVEL_TABLE.every((level, index) => index === 0 || level.maxMp >= LEVEL_TABLE[index - 1].maxMp));
  const levelOne = battleProfile(createPastCampaign());
  assert.equal(levelOne.energy, 1);
  assert.equal(levelOne.maxMp, 6);
  assert.equal(levelOne.deck.length, 4);
});

test('exploration card discoveries are unique and join the battle deck', () => {
  const campaign = createPastCampaign();
  const found = discoverCard(campaign, 'frost');
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

test('four unique western-road victories naturally reach the recommended boss level', () => {
  let campaign = createPastCampaign();
  for (const encounter of PAST_ENCOUNTERS) {
    campaign = applyBattleVictory(campaign, {
      xp: ENEMY_LIBRARY[encounter.enemyId].xp,
      playerHp: 30,
      encounterId: encounter.id
    }).state;
  }
  assert.equal(campaign.level, 3);
  assert.ok(campaign.exp >= LEVEL_TABLE[2].exp);
  assert.equal(campaign.roadVictories, 4);
});

test('the mid-boss durability targets roughly six strong player turns', () => {
  const expectedTurns = Math.ceil(ENEMY_LIBRARY['mist-watcher'].maxHp / 20);
  assert.ok(expectedTurns >= 5 && expectedTurns <= 7);
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
  const open = createPastCampaign({ defeatedRoadEnemies: ['road-a', 'road-b', 'road-c', 'road-d'] });
  assert.equal(canChallengeWatchtower(locked), false);
  assert.equal(canChallengeWatchtower(open), true);
});

test('campaign objectives count seal fragments and then point to the mid-boss', () => {
  assert.match(campaignObjective(createPastCampaign({ defeatedRoadEnemies: ['road-a', 'road-b'] })), /2\/4/);
  assert.match(campaignObjective(createPastCampaign({ defeatedRoadEnemies: ['road-a', 'road-b', 'road-c', 'road-d'] })), /見張り台/);
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
    exp: 55,
    currentHp: 49,
    currentMp: 7,
    equipment: { weapon: 'bronze-sword', armor: 'leather-armor' },
    ownedCards: ['flame-edge']
  });
  const profile = battleProfile(campaign);
  assert.equal(profile.maxHp, 58);
  assert.equal(profile.attackBonus, 5);
  assert.equal(profile.defenseBonus, 4);
  assert.equal(profile.hp, 49);
  assert.equal(profile.mp, 7);
  assert.equal(profile.maxMp, 11);
  assert.equal(profile.energy, 2);
  assert.equal(profile.deck.includes('flame-edge'), true);
});

test('battle victory carries remaining MP and level-up refills both resources', () => {
  const levelOne = createPastCampaign({ exp: 0, currentHp: 20, currentMp: 1 });
  const ordinary = applyBattleVictory(levelOne, { xp: 5, playerHp: 17, playerMp: 0 }).state;
  assert.equal(ordinary.currentMp, 0);

  const leveled = applyBattleVictory(ordinary, { xp: 20, playerHp: 5, playerMp: 0 }).state;
  assert.equal(leveled.level, 2);
  assert.equal(leveled.currentHp, LEVEL_TABLE[1].maxHp);
  assert.equal(leveled.currentMp, LEVEL_TABLE[1].maxMp);
});
