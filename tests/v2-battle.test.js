const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CARD_ATTRIBUTE_LABELS,
  CARD_LIBRARY,
  DISCIPLINE_LABELS,
  ENEMY_LIBRARY,
  ENEMY_INTENTS,
  createBattle,
  defaultDeck,
  hpCondition,
  previewAction,
  redrawOpeningCards,
  resolveTurn,
  toggleCard
} = require('../v2-battle.js');

test('HP condition changes from normal to orange and red at Dragon Quest-like thresholds', () => {
  assert.equal(hpCondition(42, 42), 'normal');
  assert.equal(hpCondition(21, 42), 'warning');
  assert.equal(hpCondition(10, 42), 'danger');
  assert.equal(hpCondition(0, 42), 'danger');
});

test('the starter deck begins with only sword technique and guard cards', () => {
  const deck = defaultDeck();
  assert.equal(deck.length, 3);
  assert.equal(new Set(deck).size, 3);
  assert.deepEqual(new Set(deck.map(id => CARD_LIBRARY[id].discipline)),
    new Set(['sword', 'guard', 'technique']));
  assert.equal(deck.some(id => CARD_LIBRARY[id].discipline === 'magic'), false);
});

test('a level-one profile starts with one action point and resolves after one card', () => {
  let battle = createBattle('mist-slime', () => 0, { energy: 1 });
  assert.equal(battle.energy, 1);
  battle = toggleCard(battle, battle.hand[0]);
  assert.equal(battle.selectedCost, battle.energy);
  assert.equal(battle.readyToResolve, true);
});

test('any chosen opening cards can be discarded and replaced together exactly once', () => {
  const battle = {
    ...createBattle('mist-slime', () => 0, { deck: ['slash', 'guard', 'focus', 'spark', 'frost'] }),
    hand: ['slash', 'guard', 'focus', 'spark', 'frost'],
    deck: ['parry', 'cleave', 'feint', 'flame-edge', 'fortress'],
    discard: []
  };
  const redrawn = redrawOpeningCards(battle, [0, 2, 4], () => 0);

  assert.equal(redrawn.openingRedrawAvailable, false);
  assert.deepEqual(redrawn.hand, ['parry', 'guard', 'cleave', 'spark', 'feint']);
  assert.deepEqual(redrawn.discard, ['slash', 'focus', 'frost']);
  assert.equal(redrawn.hand.length, battle.hand.length);
  assert.equal(redrawOpeningCards(redrawn, [1], () => 0), redrawn);

  const generatedBattle = createBattle('mist-slime', () => 0, { deck: ['slash', 'guard', 'focus'] });
  const fullRedraw = redrawOpeningCards(generatedBattle, [0, 1, 2, 3, 4], () => 0);
  assert.equal(fullRedraw.hand.length, 5);
  assert.equal(fullRedraw.discard.length, 5);
  assert.equal(fullRedraw.openingRedrawAvailable, false);
});

test('opening redraw is unavailable after selecting an action or after turn one', () => {
  const battle = createBattle('mist-slime', () => 0, {
    deck: ['slash', 'guard', 'focus', 'spark']
  });
  const selected = toggleCard(battle, battle.hand[0], 0);

  assert.equal(redrawOpeningCards(selected, [1], () => 0), selected);
  assert.equal(redrawOpeningCards({ ...battle, turn: 2 }, [1], () => 0).turn, 2);
  assert.equal(redrawOpeningCards(battle, [], () => 0), battle);
});

test('every card has explicit type and attribute labels independent of its artwork glyph', () => {
  for (const card of Object.values(CARD_LIBRARY)) {
    assert.ok(DISCIPLINE_LABELS[card.discipline], `${card.id} has no type label`);
    assert.ok(CARD_ATTRIBUTE_LABELS[card.attribute], `${card.id} has no attribute label`);
  }
  assert.equal(CARD_LIBRARY['cross-slash'].icon, '十');
  assert.equal(DISCIPLINE_LABELS[CARD_LIBRARY['cross-slash'].discipline], '剣');
  assert.equal(CARD_ATTRIBUTE_LABELS[CARD_LIBRARY['cross-slash'].attribute], '無');
});

test('a later profile can spend three action points on three cards', () => {
  let battle = createBattle('mist-slime', () => 0, { energy: 3 });
  const firstFour = battle.hand.slice(0, 4);
  for (const cardId of firstFour.slice(0, 3)) battle = toggleCard(battle, cardId);
  assert.equal(battle.selectedCost, battle.energy);
  assert.equal(battle.readyToResolve, true);
});

test('duplicate copies in the hand can be selected independently', () => {
  let battle = createBattle('mist-slime', () => 0, { energy: 2, deck: ['slash'] });
  battle = toggleCard(battle, 'slash', 0);
  battle = toggleCard(battle, 'slash', 1);

  assert.deepEqual(battle.selected, ['slash', 'slash']);
  assert.deepEqual(battle.selectedIndices, [0, 1]);
  assert.equal(battle.readyToResolve, true);
});

test('a level-thirteen profile can spend the four-point maximum', () => {
  let battle = createBattle('mist-slime', () => 0, {
    energy: 4,
    mp: 12,
    maxMp: 12,
    deck: ['slash', 'spark', 'guard', 'focus']
  });
  for (const cardId of battle.hand.slice(0, 4)) battle = toggleCard(battle, cardId);
  assert.equal(battle.energy, 4);
  assert.equal(battle.selectedCost, 4);
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

test('the eye card reveals enemy intents for the following three turns', () => {
  let battle = createBattle('mist-slime', () => 0);
  battle = { ...battle, hand: ['focus', 'guard', 'slash', 'spark', 'frost'], selected: ['focus'] };
  const revealed = resolveTurn(battle, () => 0);
  assert.equal(revealed.enemy.intentId, 'ward');
  assert.equal(revealed.intentRevealed, true);
  assert.equal(revealed.intentRevealTurns, 3);

  const first = resolveTurn({ ...revealed, selected: ['guard'] }, () => 0);
  assert.equal(first.intentRevealTurns, 2);
  assert.equal(first.intentRevealed, true);
  const second = resolveTurn({ ...first, selected: ['guard'] }, () => 0);
  assert.equal(second.intentRevealTurns, 1);
  assert.equal(second.intentRevealed, true);
  const third = resolveTurn({ ...second, selected: ['guard'] }, () => 0);
  assert.equal(third.intentRevealTurns, 0);
  assert.equal(third.intentRevealed, false);
});

test('using the eye again refreshes its reveal duration to three turns', () => {
  const battle = {
    ...createBattle('mist-slime', () => 0),
    intentRevealed: true,
    intentRevealTurns: 1,
    hand: ['focus', 'guard', 'slash', 'spark', 'frost'],
    selected: ['focus']
  };
  const refreshed = resolveTurn(battle, () => 0);
  assert.equal(refreshed.intentRevealTurns, 3);
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
  let battle = createBattle('mist-slime', () => 0, { energy: 3, mp: 12, maxMp: 12 });
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
  let battle = createBattle('mist-slime', () => 0, { energy: 2 });
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
    mp: 7,
    maxMp: 11,
    energy: 2,
    attackBonus: 5,
    defenseBonus: 4,
    deck: ['slash', 'spark', 'guard', 'focus', 'flame-edge']
  });
  assert.deepEqual(battle.player, {
    hp: 31, maxHp: 58, mp: 7, maxMp: 11, block: 0, attackBonus: 5, defenseBonus: 4
  });
  assert.equal(battle.energy, 2);
  assert.equal([...battle.hand, ...battle.deck].includes('flame-edge'), true);
});

test('magic cards cannot be selected without enough MP', () => {
  let battle = createBattle('mist-slime', () => 0, {
    energy: 2,
    mp: 1,
    maxMp: 6,
    deck: ['spark', 'slash', 'guard', 'focus']
  });
  battle = { ...battle, hand: ['spark', 'slash', 'guard', 'focus'] };
  const unchanged = toggleCard(battle, 'spark');
  assert.equal(CARD_LIBRARY.spark.mpCost, 2);
  assert.equal(unchanged, battle);
});

test('casting magic spends MP and focus restores it', () => {
  let battle = createBattle('mist-slime', () => 0, { energy: 1, mp: 4, maxMp: 6 });
  battle = { ...battle, hand: ['spark', 'slash', 'guard', 'focus'], selected: ['spark'] };
  const cast = resolveTurn(battle, () => 0);
  assert.equal(cast.player.mp, 2);

  const focused = resolveTurn({ ...cast, hand: ['focus'], selected: ['focus'] }, () => 0);
  assert.equal(focused.player.mp, 4);
});

test('a healing card restores HP before the enemy acts', () => {
  let battle = createBattle('mist-slime', () => 0, {
    energy: 1,
    hp: 18,
    maxHp: 42,
    mp: 6,
    maxMp: 6,
    deck: ['mend']
  });
  battle = { ...battle, hand: ['mend'], selected: ['mend'] };
  const next = resolveTurn(battle, () => 0);
  assert.equal(CARD_LIBRARY.mend.heal, 14);
  assert.equal(next.player.hp, 20);
  assert.equal(next.player.mp, 3);
  assert.deepEqual(next.effects.find(effect => effect.type === 'heal' && effect.target === 'player'), {
    type: 'heal', target: 'player', amount: 14
  });
});

test('a defeat still records MP spent on the final action', () => {
  let battle = createBattle('gutter-goblin', () => 0, {
    energy: 1,
    hp: 1,
    maxHp: 42,
    mp: 6,
    maxMp: 6,
    deck: ['spark']
  });
  battle = { ...battle, hand: ['spark'], selected: ['spark'] };
  const defeated = resolveTurn(battle, () => 0);
  assert.equal(defeated.status, 'defeat');
  assert.equal(defeated.player.mp, 4);
});

test('equipment increases outgoing damage and reduces received damage', () => {
  let battle = createBattle('mist-slime', () => 0, { attackBonus: 3, defenseBonus: 2 });
  battle = { ...battle, hand: ['slash'], selected: ['slash'] };
  const next = resolveTurn(battle, () => 0);
  assert.equal(next.enemy.hp, battle.enemy.hp - 10);
  assert.equal(next.player.hp, battle.player.hp - 10);
});

test('the old watchtower guardian is balanced for an action-one first quest', () => {
  const battle = createBattle('mist-watcher', () => 0, { attackBonus: 5, defenseBonus: 4, maxHp: 58, hp: 58 });
  assert.ok(battle.enemy.maxHp >= 68 && battle.enemy.maxHp <= 72);
  assert.ok(battle.enemy.attack >= 8 && battle.enemy.attack <= 9);
  assert.ok(battle.enemy.xp >= 70);
  assert.equal(battle.enemy.boss, true);
});

test('the dungeon weapon card is valid and the crossroads boss can enter battle', () => {
  assert.equal(CARD_LIBRARY['cross-slash'].discipline, 'sword');
  const battle = createBattle('crossroads-sentinel', () => 0, {
    level: 3, maxHp: 52, hp: 52, maxMp: 8, mp: 8, energy: 1,
    deck: ['slash', 'guard', 'focus', 'cross-slash']
  });
  assert.equal(battle.enemy.id, 'crossroads-sentinel');
  assert.equal(battle.enemy.boss, true);
});

test('the fog-city bell warden is a chapter-three boss with a meaningful reward', () => {
  const boss = ENEMY_LIBRARY['mist-bell-warden'];
  assert.ok(boss.maxHp >= 140);
  assert.equal(boss.xp, 300);
  assert.ok(boss.intentPattern.length >= 4);
});
