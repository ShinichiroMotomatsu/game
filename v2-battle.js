(function exposeBattleSystem(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_BATTLE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const CARD_LIBRARY = Object.freeze({
    slash: Object.freeze({ id: 'slash', name: '斬る', discipline: 'sword', icon: '剣', cost: 1, damage: 7, description: '剣で素早く斬りつける' }),
    cleave: Object.freeze({ id: 'cleave', name: '薙ぐ', discipline: 'sword', icon: '刃', cost: 1, damage: 6, description: '大きく踏み込み薙ぎ払う' }),
    spark: Object.freeze({ id: 'spark', name: '火花', discipline: 'magic', element: 'fire', icon: '炎', cost: 1, mpCost: 2, damage: 6, description: 'MP2・小さな炎を放つ' }),
    frost: Object.freeze({ id: 'frost', name: '霜結', discipline: 'magic', element: 'ice', icon: '氷', cost: 1, mpCost: 3, damage: 7, description: 'MP3・冷気で敵を貫く' }),
    guard: Object.freeze({ id: 'guard', name: '防ぐ', discipline: 'guard', icon: '盾', cost: 1, block: 7, description: '盾を構えて身を守る' }),
    parry: Object.freeze({ id: 'parry', name: '受流', discipline: 'guard', icon: '受', cost: 1, block: 5, damage: 2, description: '受け流しながら反撃する' }),
    focus: Object.freeze({ id: 'focus', name: '集中', discipline: 'technique', icon: '眼', cost: 1, draw: 1, mpRestore: 2, description: '予兆を見抜きMPを2回復' }),
    feint: Object.freeze({ id: 'feint', name: '陽動', discipline: 'technique', icon: '技', cost: 1, damage: 3, weaken: 2, description: '敵を惑わせ攻撃を弱める' }),
    'flame-edge': Object.freeze({ id: 'flame-edge', name: '炎刃', discipline: 'sword', element: 'fire', icon: '焔', cost: 1, damage: 9, description: '炎をまとわせて斬りつける' }),
    fortress: Object.freeze({ id: 'fortress', name: '城壁', discipline: 'guard', icon: '城', cost: 1, block: 10, description: '堅牢な壁で身を守る' }),
    mend: Object.freeze({ id: 'mend', name: '癒光', discipline: 'magic', icon: '癒', cost: 1, mpCost: 3, heal: 14, description: 'MP3・HPを14回復する' })
  });

  const ENEMY_LIBRARY = Object.freeze({
    'mist-slime': Object.freeze({ id: 'mist-slime', name: '宵霧のスライム', maxHp: 26, attack: 9, gold: 8, xp: 12, intent: '体当たり', weakness: 'fire' }),
    'gutter-goblin': Object.freeze({ id: 'gutter-goblin', name: '石路のゴブリン', maxHp: 34, attack: 11, gold: 12, xp: 18, intent: '錆びた短剣', weakness: 'ice' }),
    'rune-wolf': Object.freeze({ id: 'rune-wolf', name: '刻印の魔狼', maxHp: 40, attack: 13, gold: 18, xp: 24, intent: '飛びかかる', weakness: 'ice' }),
    'mist-watcher': Object.freeze({
      id: 'mist-watcher', name: '紫霧の番人', maxHp: 70, attack: 8, gold: 120, xp: 80,
      intent: '紫霧の爪', weakness: 'fire', boss: true,
      intentPattern: Object.freeze(['ward', 'grand-spell', 'assault', 'renew'])
    })
  });

  const ELEMENT_LABELS = Object.freeze({ fire: '炎', ice: '氷' });
  const WEAKNESS_MULTIPLIER = 1.5;

  const ENEMY_INTENTS = Object.freeze({
    assault: Object.freeze({
      id: 'assault', name: '猛攻', icon: '⚔', counteredBy: 'guard', counterLabel: '防御',
      description: '強力な一撃を放つ', attackBonus: 3, cancelAttackOnCounter: true
    }),
    ward: Object.freeze({
      id: 'ward', name: '結界', icon: '◇', counteredBy: 'magic', counterLabel: '魔法',
      description: '障壁で攻撃を防ぐ', block: 8, attackScale: 0.5
    }),
    'grand-spell': Object.freeze({
      id: 'grand-spell', name: '大詠唱', icon: '✦', counteredBy: 'technique', counterLabel: '技',
      description: '大魔法を詠唱する', attackBonus: 7, cancelAttackOnCounter: true
    }),
    renew: Object.freeze({
      id: 'renew', name: '再生', icon: '❈', counteredBy: 'sword', counterLabel: '剣',
      description: '傷を癒やす力を集める', heal: 7, attackScale: 0.5
    })
  });

  const INTENT_PATTERN = Object.freeze(['assault', 'ward', 'grand-spell', 'renew']);

  const COMBINATIONS = Object.freeze({
    'sword+sword': Object.freeze({ name: '二連斬り', bonusDamage: 5 }),
    'guard+sword': Object.freeze({ name: '反撃の構え', bonusDamage: 3, bonusBlock: 3 }),
    'magic+sword': Object.freeze({ name: '魔法剣', bonusDamage: 6 }),
    'magic+magic': Object.freeze({ name: '連環魔法', bonusDamage: 7 }),
    'guard+magic': Object.freeze({ name: '魔法障壁', bonusBlock: 6 }),
    'sword+technique': Object.freeze({ name: '弱点看破', bonusDamage: 4 }),
    'magic+technique': Object.freeze({ name: '速詠唱', bonusDamage: 3, draw: 1 }),
    'guard+technique': Object.freeze({ name: '残心', bonusBlock: 3, draw: 1 }),
    'technique+technique': Object.freeze({ name: '先読み', draw: 2 })
  });

  function defaultDeck() {
    return ['slash', 'focus', 'guard'];
  }

  function shuffled(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function drawCards(deck, discard, count, random) {
    let drawPile = [...deck];
    let discardPile = [...discard];
    const cards = [];
    while (cards.length < count && (drawPile.length || discardPile.length)) {
      if (!drawPile.length) {
        drawPile = shuffled(discardPile, random);
        discardPile = [];
      }
      cards.push(drawPile.shift());
    }
    return { cards, deck: drawPile, discard: discardPile };
  }

  function createBattle(enemyId, random = Math.random, profile = {}) {
    const enemyDefinition = ENEMY_LIBRARY[enemyId] || ENEMY_LIBRARY['mist-slime'];
    const configuredDeck = Array.isArray(profile.deck)
      ? profile.deck.filter(cardId => CARD_LIBRARY[cardId])
      : defaultDeck();
    const battleDeck = configuredDeck.length ? configuredDeck : defaultDeck();
    const opening = drawCards(shuffled(battleDeck, random), [], 5, random);
    const maxHp = Math.max(1, Math.floor(Number(profile.maxHp) || 42));
    const hp = Math.max(1, Math.min(maxHp, Math.floor(Number(profile.hp) || maxHp)));
    const energy = Math.max(1, Math.min(4, Math.floor(Number(profile.energy) || 1)));
    const maxMp = Math.max(0, Math.floor(Number(profile.maxMp) || 6));
    const parsedMp = Number(profile.mp);
    const mp = Number.isFinite(parsedMp) ? Math.max(0, Math.min(maxMp, Math.floor(parsedMp))) : maxMp;
    const intentPattern = enemyDefinition.intentPattern || INTENT_PATTERN;
    return {
      status: 'active',
      turn: 1,
      energy,
      player: {
        hp,
        maxHp,
        mp,
        maxMp,
        block: 0,
        attackBonus: Math.max(0, Math.floor(Number(profile.attackBonus) || 0)),
        defenseBonus: Math.max(0, Math.floor(Number(profile.defenseBonus) || 0))
      },
      enemy: {
        ...enemyDefinition,
        hp: enemyDefinition.maxHp,
        block: 0,
        intentIndex: 0,
        intentPattern,
        intentId: intentPattern[0]
      },
      deck: opening.deck,
      discard: opening.discard,
      hand: opening.cards,
      selected: [],
      selectedCost: 0,
      selectedMp: 0,
      readyToResolve: false,
      intentRevealed: false,
      effects: [],
      log: [`${enemyDefinition.name}が現れた。`],
      reward: { gold: 0, xp: 0 }
    };
  }

  function totalCost(selected) {
    return selected.reduce((sum, cardId) => sum + (CARD_LIBRARY[cardId]?.cost || 0), 0);
  }

  function totalMpCost(selected) {
    return selected.reduce((sum, cardId) => sum + (CARD_LIBRARY[cardId]?.mpCost || 0), 0);
  }

  function toggleCard(battle, cardId) {
    if (battle.status !== 'active' || !battle.hand.includes(cardId)) return battle;
    if (battle.selected.includes(cardId)) {
      const index = battle.selected.indexOf(cardId);
      const selected = battle.selected.filter((_, cardIndex) => cardIndex !== index);
      const selectedCost = totalCost(selected);
      const selectedMp = totalMpCost(selected);
      return { ...battle, selected, selectedCost, selectedMp, readyToResolve: selectedCost === battle.energy };
    }
    const selected = [...battle.selected, cardId];
    const selectedCost = totalCost(selected);
    const selectedMp = totalMpCost(selected);
    if (battle.selected.length >= 4 || selectedCost > battle.energy || selectedMp > battle.player.mp) return battle;
    return { ...battle, selected, selectedCost, selectedMp, readyToResolve: selectedCost === battle.energy };
  }

  function combinationFor(selected) {
    if (selected.length < 2) return null;
    const disciplines = selected.slice(0, 2).map(cardId => CARD_LIBRARY[cardId].discipline).sort();
    return COMBINATIONS[disciplines.join('+')] || null;
  }

  function previewAction(selected) {
    const cards = selected.map(cardId => CARD_LIBRARY[cardId]).filter(Boolean);
    if (!cards.length) return {
      name: 'カードを選択', damage: 0, block: 0, heal: 0, weaken: 0, draw: 0,
      mpCost: 0, mpRestore: 0, elements: [], disciplines: [], revealIntent: false
    };
    const combo = combinationFor(selected);
    return {
      name: combo?.name || cards.map(card => card.name).join(' → '),
      damage: cards.reduce((sum, card) => sum + (card.damage || 0), 0) + (combo?.bonusDamage || 0),
      block: cards.reduce((sum, card) => sum + (card.block || 0), 0) + (combo?.bonusBlock || 0),
      heal: cards.reduce((sum, card) => sum + (card.heal || 0), 0),
      weaken: cards.reduce((sum, card) => sum + (card.weaken || 0), 0),
      draw: cards.reduce((sum, card) => sum + (card.draw || 0), 0) + (combo?.draw || 0),
      mpCost: cards.reduce((sum, card) => sum + (card.mpCost || 0), 0),
      mpRestore: cards.reduce((sum, card) => sum + (card.mpRestore || 0), 0),
      elements: [...new Set(cards.map(card => card.element).filter(Boolean))],
      disciplines: [...new Set(cards.map(card => card.discipline))],
      revealIntent: cards.some(card => card.id === 'focus')
    };
  }

  function removeSelectedFromHand(hand, selected) {
    const remaining = [...hand];
    for (const cardId of selected) {
      const index = remaining.indexOf(cardId);
      if (index >= 0) remaining.splice(index, 1);
    }
    return remaining;
  }

  function resolveTurn(battle, random = Math.random) {
    if (battle.status !== 'active' || !battle.selected.length) return battle;
    const action = previewAction(battle.selected);
    if (action.mpCost > battle.player.mp) return battle;
    const intent = ENEMY_INTENTS[battle.enemy.intentId] || ENEMY_INTENTS.assault;
    const countered = battle.intentRevealed && action.disciplines.includes(intent.counteredBy);
    const weaknessElement = action.elements.find(element => element === battle.enemy.weakness);
    const weaknessHit = Boolean(weaknessElement && action.damage > 0);
    const amplifiedDamage = weaknessHit ? Math.round(action.damage * WEAKNESS_MULTIPLIER) : action.damage;
    const intentBlock = countered ? 0 : (intent.block || 0);
    const attackBonus = action.damage > 0 ? (battle.player.attackBonus || 0) : 0;
    const damage = Math.max(0, amplifiedDamage + attackBonus - (battle.enemy.block || 0) - intentBlock);
    const enemyHp = Math.max(0, battle.enemy.hp - damage);
    const spent = [...battle.selected];
    const effects = [];
    const mpAfterCost = battle.player.mp - action.mpCost;
    const playerMp = Math.min(battle.player.maxMp, mpAfterCost + action.mpRestore);
    const restoredMp = playerMp - mpAfterCost;
    const healedPlayerHp = Math.min(battle.player.maxHp, battle.player.hp + action.heal);
    const healedPlayerAmount = healedPlayerHp - battle.player.hp;
    if (healedPlayerAmount > 0) effects.push({ type: 'heal', target: 'player', amount: healedPlayerAmount });
    if (restoredMp > 0) effects.push({ type: 'mp', target: 'player', amount: restoredMp });
    if (countered) {
      effects.push({
        type: 'counter',
        target: 'enemy',
        discipline: intent.counteredBy,
        label: intent.counterLabel,
        intentId: intent.id
      });
    }
    if (weaknessHit) {
      effects.push({
        type: 'weakness',
        target: 'enemy',
        element: weaknessElement,
        label: ELEMENT_LABELS[weaknessElement],
        multiplier: WEAKNESS_MULTIPLIER
      });
    }
    if (damage > 0) effects.push({ type: 'damage', target: 'enemy', amount: damage });
    const recoveryLog = `${healedPlayerAmount ? ` HPが${healedPlayerAmount}回復。` : ''}${restoredMp ? ` MPが${restoredMp}回復。` : ''}`;
    const log = [
      `${action.name}！ ${countered ? `看破成功！ ${intent.name}を崩した。 ` : ''}${weaknessHit ? '弱点を突いた！ ' : ''}${damage}のダメージ。${recoveryLog}`
    ];
    if (enemyHp === 0) {
      return {
        ...battle,
        status: 'victory',
        player: { ...battle.player, hp: healedPlayerHp, mp: playerMp },
        enemy: { ...battle.enemy, hp: 0 },
        selected: [],
        selectedCost: 0,
        selectedMp: 0,
        readyToResolve: false,
        effects,
        log: [...battle.log, ...log, `${battle.enemy.name}を倒した。`],
        reward: { gold: battle.enemy.gold, xp: battle.enemy.xp || 0 }
      };
    }

    const scaledAttack = Math.round(battle.enemy.attack * (intent.attackScale ?? 1)) + (intent.attackBonus || 0);
    const intentAttack = countered && intent.cancelAttackOnCounter ? 0 : scaledAttack;
    const enemyDamage = Math.max(0, intentAttack - action.weaken - action.block - (battle.player.defenseBonus || 0));
    const playerHp = Math.max(0, healedPlayerHp - enemyDamage);
    if (enemyDamage > 0) effects.push({ type: 'damage', target: 'player', amount: enemyDamage });
    log.push(`${countered && intent.cancelAttackOnCounter ? `${intent.name}を阻止した。` : intent.name} ${enemyDamage}のダメージ。`);
    if (playerHp === 0) {
      return {
        ...battle,
        status: 'defeat',
        player: { ...battle.player, hp: 0, mp: playerMp },
        enemy: { ...battle.enemy, hp: enemyHp },
        selected: [],
        selectedCost: 0,
        selectedMp: 0,
        readyToResolve: false,
        effects,
        log: [...battle.log, ...log, '力尽きた……。'],
        reward: { gold: 0 }
      };
    }

    const recoveredHp = countered || !intent.heal
      ? enemyHp
      : Math.min(battle.enemy.maxHp, enemyHp + intent.heal);
    if (recoveredHp > enemyHp) effects.push({ type: 'heal', target: 'enemy', amount: recoveredHp - enemyHp });
    const remainingHand = removeSelectedFromHand(battle.hand, spent);
    const needed = Math.max(0, 5 + action.draw - remainingHand.length);
    const nextDraw = drawCards(battle.deck, [...battle.discard, ...spent], needed, random);
    const intentPattern = battle.enemy.intentPattern || INTENT_PATTERN;
    return {
      ...battle,
      turn: battle.turn + 1,
      player: { ...battle.player, hp: playerHp, mp: playerMp, block: 0 },
      enemy: {
        ...battle.enemy,
        hp: recoveredHp,
        block: 0,
        intentIndex: (battle.enemy.intentIndex + 1) % intentPattern.length,
        intentId: intentPattern[(battle.enemy.intentIndex + 1) % intentPattern.length]
      },
      deck: nextDraw.deck,
      discard: nextDraw.discard,
      hand: [...remainingHand, ...nextDraw.cards].slice(0, 7),
      selected: [],
      selectedCost: 0,
      selectedMp: 0,
      readyToResolve: false,
      intentRevealed: action.revealIntent,
      effects,
      log: [...battle.log, ...log].slice(-6)
    };
  }

  return {
    CARD_LIBRARY,
    ENEMY_LIBRARY,
    ENEMY_INTENTS,
    createBattle,
    defaultDeck,
    previewAction,
    resolveTurn,
    toggleCard
  };
});
