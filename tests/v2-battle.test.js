const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CARD_LIBRARY,
  ENEMY_LIBRARY,
  ENEMY_INTENTS,
  createBattle,
  defaultDeck,
  previewAction,
  resolveTurn,
  toggleCard
} = require('../v2-battle.js');

test('the starter deck contains eight touch-friendly cards across four disciplines', () => {
  const deck = defaultDeck();
  assert.equal(deck.length, 8);
  assert.deepEqual(new Set(deck.map(id => CARD_LIBRARY[id].discipline)),
    new Set(['sword', 'magic', 'guard', 'technique']));
});

test('three one-energy cards exactly consume the turn energy', () => {
  let battle = createBattle('mist-slime', () => 0);
  const firstFour = battle.hand.slice(0, 4);
  for (const cardId of firstFour.slice(0, 3)) battle = toggleCard(battle, cardId);
  assert.equal(battle.selectedCost, battle.energy);
  assert.equal(battle.readyToResolve, true);
});

test('tapping a selected card removes it from the action', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = toggleCard(battle, battle.hand[0]);
  battle = toggleCard(battle, battle.hand[0]);
  assert.deepEqual(battle.selected, []);
});

test('two sword cards preview the dual-slash combination', () => {
  const action = previewAction(['slash', 'cleave']);
  assert.equal(action.name, '二連斬り');
});

test('each face-up enemy intent has a different discipline counter', () => {
  assert.deepEqual(
    Object.values(ENEMY_INTENTS).map(intent => intent.counteredBy),
    ['guard', 'magic', 'technique', 'sword']
  );
});

test('a new encounter starts with its assault intent hidden', () => {
  const battle = createBattle('mist-slime', () => 0);
  assert.equal(battle.enemy.intentId, 'assault');
  assert.equal(battle.intentRevealed, false);
});

test('matching guard cannot read a hidden assault', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = { ...battle, hand: ['guard', 'slash', 'spark', 'focus', 'frost'], selected: ['guard'] };
  const next = resolveTurn(battle, () => 0);

  assert.equal(next.effects.some(effect => effect.type === 'counter'), false);
  assert.equal(next.player.hp, battle.player.hp - 5);
});

test('matching guard to a revealed assault triggers a read and cancels its damage', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = {
    ...battle,
    intentRevealed: true,
    hand: ['guard', 'slash', 'spark', 'focus', 'frost'],
    selected: ['guard']
  };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.player.hp, battle.player.hp);
  assert.deepEqual(next.effects[0], {
    type: 'counter', target: 'enemy', discipline: 'guard', label: '防御', intentId: 'assault'
  });
  assert.match(next.log.at(-2), /看破成功/);
  assert.equal(next.enemy.intentId, 'ward');
});

test('the eye card reveals the following turn intent only', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = { ...battle, hand: ['focus', 'guard', 'slash', 'spark', 'frost'], selected: ['focus'] };
  const revealed = resolveTurn(battle, () => 0);
  assert.equal(revealed.enemy.intentId, 'ward');
  assert.equal(revealed.intentRevealed, true);

  const afterReveal = resolveTurn({ ...revealed, selected: ['slash'] }, () => 0);
  assert.equal(afterReveal.intentRevealed, false);
});

test('the wrong discipline does not counter an assault', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = { ...battle, hand: ['slash', 'guard', 'spark', 'focus', 'frost'], selected: ['slash'] };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.effects.some(effect => effect.type === 'counter'), false);
  assert.equal(next.player.hp, battle.player.hp - 12);
});

test('magic reads a ward and bypasses its enemy block', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = {
    ...battle,
    intentRevealed: true,
    enemy: { ...battle.enemy, intentId: 'ward', intentIndex: 1 },
    hand: ['spark', 'slash', 'guard', 'focus', 'frost'],
    selected: ['spark']
  };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.enemy.hp, battle.enemy.hp - 9);
  assert.equal(next.effects.some(effect => effect.type === 'counter'), true);
});

test('a ward blocks an ordinary sword card when it is not read', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = {
    ...battle,
    enemy: { ...battle.enemy, intentId: 'ward', intentIndex: 1 },
    hand: ['slash', 'spark', 'guard', 'focus', 'frost'],
    selected: ['slash']
  };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.enemy.hp, battle.enemy.hp);
});

test('selection reports the remaining energy for immediate turn resolution', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = { ...battle, hand: ['slash', 'spark', 'guard', 'focus', 'frost'] };
  battle = toggleCard(battle, 'slash');
  assert.equal(battle.selectedCost, 1);
  battle = toggleCard(battle, 'spark');
  assert.equal(battle.readyToResolve, false);
  battle = toggleCard(battle, 'guard');
  assert.equal(battle.readyToResolve, true);
});

test('guard reduces an uncountered grand spell in the resolved turn', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = {
    ...battle,
    enemy: { ...battle.enemy, intentId: 'grand-spell', intentIndex: 2 },
    hand: ['guard', 'parry', 'slash', 'spark', 'focus'],
    selected: ['guard']
  };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.player.hp, battle.player.hp - 9);
  assert.deepEqual(next.effects.find(effect => effect.target === 'player'), {
    type: 'damage', target: 'player', amount: 9
  });
});

test('a fire card strikes the mist slime weakness for 1.5x damage', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = { ...battle, hand: ['spark', 'guard', 'slash', 'focus', 'frost'], selected: ['spark'] };
  const next = resolveTurn(battle, () => 0);

  assert.equal(CARD_LIBRARY.spark.element, 'fire');
  assert.equal(ENEMY_LIBRARY['mist-slime'].weakness, 'fire');
  assert.equal(next.enemy.hp, battle.enemy.hp - 9);
  assert.deepEqual(next.effects[0], {
    type: 'weakness', target: 'enemy', element: 'fire', label: '炎', multiplier: 1.5
  });
  assert.deepEqual(next.effects[1], { type: 'damage', target: 'enemy', amount: 9 });
  assert.match(next.log.at(-2), /弱点/);
});

test('ordinary attacks still emit enemy and player damage effects', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = { ...battle, hand: ['slash', 'guard', 'spark', 'focus', 'frost'], selected: ['slash'] };
  const next = resolveTurn(battle, () => 0);

  assert.equal(next.enemy.hp, battle.enemy.hp - CARD_LIBRARY.slash.damage);
  assert.deepEqual(next.effects, [
    { type: 'damage', target: 'enemy', amount: 7 },
    { type: 'damage', target: 'player', amount: 12 }
  ]);
});

test('fully blocked attacks do not emit a player damage effect', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = {
    ...battle,
    hand: ['guard', 'parry', 'slash', 'spark', 'focus'],
    selected: ['guard', 'parry']
  };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.player.hp, battle.player.hp);
  assert.equal(next.effects.some(effect => effect.target === 'player'), false);
});

test('a finishing action marks the battle as a victory and grants a reward', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = {
    ...battle,
    enemy: { ...battle.enemy, hp: 5 },
    hand: ['slash', 'cleave', 'spark', 'guard', 'focus'],
    selected: ['slash', 'cleave']
  };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.status, 'victory');
  assert.ok(next.reward.gold > 0);
});

test('a battle cannot resolve without at least one selected card', () => {
  const battle = createBattle('mist-slime', () => 0);
  assert.equal(resolveTurn(battle, () => 0), battle);
});

test('campaign equipment and current HP are applied when battle begins', () => {
  const battle = createBattle('gutter-goblin', () => 0, {
    hp: 31,
    maxHp: 58,
    attackBonus: 5,
    defenseBonus: 4,
    deck: ['slash', 'spark', 'guard', 'focus', 'flame-edge']
  });
  assert.deepEqual(battle.player, { hp: 31, maxHp: 58, block: 0, attackBonus: 5, defenseBonus: 4 });
  assert.equal([...battle.hand, ...battle.deck].includes('flame-edge'), true);
});

test('equipment increases outgoing damage and reduces received damage', () => {
  let battle = createBattle('mist-slime', () => 0, { attackBonus: 3, defenseBonus: 2 });
  battle = { ...battle, hand: ['slash'], selected: ['slash'] };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.enemy.hp, battle.enemy.hp - 10);
  assert.equal(next.player.hp, battle.player.hp - 10);
});

test('the old watchtower guardian is a durable mid-boss with a meaningful reward', () => {
  const battle = createBattle('mist-watcher', () => 0, { attackBonus: 5, defenseBonus: 4, maxHp: 58, hp: 58 });
  assert.ok(battle.enemy.maxHp >= 105 && battle.enemy.maxHp <= 130);
  assert.ok(battle.enemy.xp >= 70);
  assert.equal(battle.enemy.boss, true);
});
