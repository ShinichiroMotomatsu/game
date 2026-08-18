(function exposePastCampaign(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_CAMPAIGN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const CAMPAIGN_SCHEMA_VERSION = 3;
  const STARTER_DECK = Object.freeze(['slash', 'focus', 'guard']);
  const DISCOVERABLE_CARDS = Object.freeze({
    spark: Object.freeze({ id: 'spark', name: '火花の札', unlockAfter: 'first-victory', description: 'MP2で炎属性の一撃を放つ最初の魔法カード' }),
    frost: Object.freeze({ id: 'frost', name: '霜結の札', unlockAfter: 'watchtower-boss', description: 'MP3で氷属性の一撃を放つカード' }),
    mend: Object.freeze({ id: 'mend', name: '癒光の札', unlockAfter: 'watchtower-boss', description: 'MP3でHPを14回復するカード' })
  });
  const INN_PRICE = 0;
  const WATCHTOWER_SEALS = 4;
  const FIRST_QUEST_LOADOUT = Object.freeze(['bronze-sword', 'leather-armor', 'herb', 'herb']);

  const LEVEL_TABLE = Object.freeze([
    Object.freeze({ level: 1, exp: 0, maxHp: 42, maxMp: 6, energy: 1, attack: 0, defense: 0 }),
    Object.freeze({ level: 2, exp: 40, maxHp: 47, maxMp: 7, energy: 1, attack: 1, defense: 0 }),
    Object.freeze({ level: 3, exp: 110, maxHp: 52, maxMp: 8, energy: 1, attack: 1, defense: 1 }),
    Object.freeze({ level: 4, exp: 220, maxHp: 58, maxMp: 10, energy: 1, attack: 2, defense: 1 }),
    Object.freeze({ level: 5, exp: 380, maxHp: 64, maxMp: 12, energy: 2, attack: 3, defense: 2 }),
    Object.freeze({ level: 6, exp: 600, maxHp: 71, maxMp: 14, energy: 2, attack: 4, defense: 2 }),
    Object.freeze({ level: 7, exp: 880, maxHp: 79, maxMp: 17, energy: 2, attack: 5, defense: 3 }),
    Object.freeze({ level: 8, exp: 1230, maxHp: 87, maxMp: 20, energy: 2, attack: 6, defense: 4 }),
    Object.freeze({ level: 9, exp: 1650, maxHp: 96, maxMp: 23, energy: 2, attack: 7, defense: 5 }),
    Object.freeze({ level: 10, exp: 2150, maxHp: 106, maxMp: 27, energy: 3, attack: 9, defense: 6 }),
    Object.freeze({ level: 11, exp: 2730, maxHp: 117, maxMp: 31, energy: 3, attack: 10, defense: 7 }),
    Object.freeze({ level: 12, exp: 3390, maxHp: 129, maxMp: 35, energy: 3, attack: 12, defense: 8 }),
    Object.freeze({ level: 13, exp: 4130, maxHp: 142, maxMp: 40, energy: 4, attack: 14, defense: 9 }),
    Object.freeze({ level: 14, exp: 4950, maxHp: 156, maxMp: 45, energy: 4, attack: 16, defense: 10 }),
    Object.freeze({ level: 15, exp: 5850, maxHp: 171, maxMp: 50, energy: 4, attack: 18, defense: 12 })
  ]);

  const MAIN_STORY_PACING = Object.freeze([
    Object.freeze({ id: 'first-quest', normalBattles: 4, normalXp: 66, bossXp: 80 }),
    Object.freeze({ id: 'chapter-2', normalBattles: 10, normalXp: 280, bossXp: 180 }),
    Object.freeze({ id: 'chapter-3', normalBattles: 12, normalXp: 504, bossXp: 300 }),
    Object.freeze({ id: 'chapter-4', normalBattles: 14, normalXp: 812, bossXp: 430 }),
    Object.freeze({ id: 'chapter-5', normalBattles: 14, normalXp: 1008, bossXp: 500 }),
    Object.freeze({ id: 'final-chapter', normalBattles: 16, normalXp: 1312, bossXp: 500 })
  ]);

  const SHOP_CATALOG = Object.freeze({
    weapon: Object.freeze([
      Object.freeze({ id: 'wooden-sword', type: 'weapon', name: '木の剣', price: 60, attack: 1, description: '旅人向けの軽い剣。攻撃力＋1' }),
      Object.freeze({ id: 'bronze-sword', type: 'weapon', name: '銅の剣', price: 140, attack: 3, description: '扱いやすい青銅の剣。攻撃力＋3' }),
      Object.freeze({ id: 'iron-sword', type: 'weapon', name: '鉄の剣', price: 280, attack: 5, description: '王都の鍛冶師が打った剣。攻撃力＋5' })
    ]),
    armor: Object.freeze([
      Object.freeze({ id: 'traveler-clothes', type: 'armor', name: '旅人の服', price: 50, defense: 1, description: '厚手で動きやすい服。守備力＋1' }),
      Object.freeze({ id: 'leather-armor', type: 'armor', name: '皮の鎧', price: 130, defense: 3, description: 'なめし革を重ねた鎧。守備力＋3' }),
      Object.freeze({ id: 'chain-mail', type: 'armor', name: '鎖かたびら', price: 280, defense: 5, description: '細い鎖で編まれた鎧。守備力＋5' })
    ]),
    item: Object.freeze([
      Object.freeze({ id: 'herb', type: 'item', name: 'やくそう', price: 15, heal: 20, maxQuantity: 9, description: '戦闘の外でHPを20回復する' }),
      Object.freeze({ id: 'magic-water', type: 'item', name: 'まほうの雫', price: 25, restoreMp: 6, maxQuantity: 9, description: '戦闘の外でMPを6回復する' })
    ]),
    card: Object.freeze([
      Object.freeze({ id: 'cleave', type: 'card', name: '薙ぎ払いの札', price: 60, description: '二連斬りへつながる剣カードをデッキに加える' }),
      Object.freeze({ id: 'parry', type: 'card', name: '受け流しの札', price: 70, description: '守りながら反撃する防御カードを加える' }),
      Object.freeze({ id: 'feint', type: 'card', name: '陽動の札', price: 80, description: '敵の攻撃を弱める技カードを加える' }),
      Object.freeze({ id: 'flame-edge', type: 'card', name: '炎刃の札', price: 120, description: '炎属性の強力な斬撃カードをデッキに加える' }),
      Object.freeze({ id: 'fortress', type: 'card', name: '城壁の札', price: 120, description: '大きく身を守る防御カードをデッキに加える' })
    ])
  });

  const PRODUCTS = new Map(Object.values(SHOP_CATALOG).flat().map(product => [product.id, product]));
  const UNLOCKABLE_CARD_IDS = new Set([
    ...Object.keys(DISCOVERABLE_CARDS),
    ...SHOP_CATALOG.card.map(card => card.id)
  ]);

  function levelDefinition(level) {
    return LEVEL_TABLE[Math.max(0, Math.min(LEVEL_TABLE.length - 1, level - 1))];
  }

  function levelForExp(exp) {
    let definition = LEVEL_TABLE[0];
    for (const candidate of LEVEL_TABLE) {
      if (exp < candidate.exp) break;
      definition = candidate;
    }
    return definition;
  }

  function sanitizeIds(values, allowed) {
    if (!Array.isArray(values)) return [];
    return [...new Set(values.filter(value => allowed(value)))];
  }

  function createPastCampaign(saved = {}) {
    const parsedExp = Number(saved.exp);
    const exp = Number.isFinite(parsedExp) ? Math.max(0, Math.floor(parsedExp)) : 0;
    const inferred = levelForExp(exp);
    const requestedLevel = Number(saved.level);
    const level = Number.isInteger(requestedLevel) && requestedLevel >= inferred.level
      ? Math.min(LEVEL_TABLE.length, requestedLevel)
      : inferred.level;
    const definition = levelDefinition(level);
    const parsedHp = Number(saved.currentHp);
    const currentHp = Number.isFinite(parsedHp)
      ? Math.max(1, Math.min(definition.maxHp, Math.floor(parsedHp)))
      : definition.maxHp;
    const parsedMp = Number(saved.currentMp);
    const currentMp = Number.isFinite(parsedMp)
      ? Math.max(0, Math.min(definition.maxMp, Math.floor(parsedMp)))
      : definition.maxMp;
    const equipment = saved.equipment || {};
    const inventory = saved.inventory || {};
    const itemInventory = {};
    for (const product of SHOP_CATALOG.item) {
      itemInventory[product.id] = Math.max(0, Math.min(product.maxQuantity, Math.floor(Number(inventory[product.id]) || 0)));
    }
    const defeatedRoadEnemies = sanitizeIds(saved.defeatedRoadEnemies, value => typeof value === 'string' && value.startsWith('road-'));
    const savedCards = sanitizeIds(saved.ownedCards, value => UNLOCKABLE_CARD_IDS.has(value));
    const savedSchemaVersion = Number(saved.schemaVersion);
    const legacyCards = Array.isArray(saved.ownedCards) && (!Number.isFinite(savedSchemaVersion) || savedSchemaVersion < 2) && !savedCards.includes('spark')
      ? [...savedCards, 'spark']
      : savedCards;
    const migratedSealFragments = savedSchemaVersion >= CAMPAIGN_SCHEMA_VERSION
      ? sanitizeIds(saved.sealFragments, value => typeof value === 'string' && value.startsWith('road-'))
      : defeatedRoadEnemies;
    const bossDefeated = Boolean(saved.bossDefeated);
    const watchtowerReached = Boolean(saved.watchtowerReached || bossDefeated || migratedSealFragments.length);
    return {
      schemaVersion: CAMPAIGN_SCHEMA_VERSION,
      level,
      exp,
      currentHp,
      currentMp,
      equipment: {
        weapon: PRODUCTS.get(equipment.weapon)?.type === 'weapon' ? equipment.weapon : null,
        armor: PRODUCTS.get(equipment.armor)?.type === 'armor' ? equipment.armor : null
      },
      inventory: itemInventory,
      ownedCards: legacyCards,
      defeatedRoadEnemies,
      roadVictories: defeatedRoadEnemies.length,
      watchtowerReached,
      sealFragments: migratedSealFragments,
      bossDefeated
    };
  }

  function experienceToNextLevel(state) {
    const nextLevel = LEVEL_TABLE.find(definition => definition.exp > state.exp);
    return nextLevel ? nextLevel.exp - state.exp : null;
  }

  function battleProfile(state) {
    const definition = levelDefinition(state.level);
    const weapon = PRODUCTS.get(state.equipment.weapon);
    const armor = PRODUCTS.get(state.equipment.armor);
    return {
      level: state.level,
      hp: Math.min(state.currentHp, definition.maxHp),
      maxHp: definition.maxHp,
      mp: Math.min(state.currentMp, definition.maxMp),
      maxMp: definition.maxMp,
      energy: definition.energy,
      attackBonus: definition.attack + (weapon?.attack || 0),
      defenseBonus: definition.defense + (armor?.defense || 0),
      deck: [...STARTER_DECK, ...state.ownedCards]
    };
  }

  function buyProduct(state, gold, productId) {
    const product = PRODUCTS.get(productId);
    if (!product) return { ok: false, state, gold, message: 'その品は売っていない。' };
    if (gold < product.price) return { ok: false, state, gold, message: 'ゴールドが足りない。' };
    if (product.type === 'card' && state.ownedCards.includes(product.id)) {
      return { ok: false, state, gold, message: 'そのカードはすでに持っている。' };
    }
    if ((product.type === 'weapon' || product.type === 'armor') && state.equipment[product.type] === product.id) {
      return { ok: false, state, gold, message: 'すでに装備している。' };
    }
    if (product.type === 'item' && state.inventory[product.id] >= product.maxQuantity) {
      return { ok: false, state, gold, message: 'これ以上持てない。' };
    }

    let next = state;
    if (product.type === 'weapon' || product.type === 'armor') {
      next = { ...state, equipment: { ...state.equipment, [product.type]: product.id } };
    } else if (product.type === 'card') {
      next = { ...state, ownedCards: [...state.ownedCards, product.id] };
    } else {
      next = { ...state, inventory: { ...state.inventory, [product.id]: state.inventory[product.id] + 1 } };
    }
    return { ok: true, state: next, gold: gold - product.price, product, message: `${product.name}を手に入れた。` };
  }

  function discoverCard(state, cardId) {
    const card = DISCOVERABLE_CARDS[cardId];
    if (!card) return { ok: false, state, message: 'ここにはカードはない。' };
    if (state.ownedCards.includes(cardId)) return { ok: false, state, card, message: `${card.name}はすでに持っている。` };
    if (!canDiscoverCard(state, cardId)) return { ok: false, state, card, message: '今はまだ、この札の力を引き出せない。' };
    return {
      ok: true,
      state: { ...state, ownedCards: [...state.ownedCards, cardId] },
      card,
      message: `${card.name}を見つけ、デッキに加えた。`
    };
  }

  function canLearnFirstMagic(state) {
    return state.roadVictories >= 1 && !state.ownedCards.includes('spark');
  }

  function canDiscoverCard(state, cardId) {
    const card = DISCOVERABLE_CARDS[cardId];
    if (!card || state.ownedCards.includes(cardId)) return false;
    if (card.unlockAfter === 'first-victory') return canLearnFirstMagic(state);
    if (card.unlockAfter === 'watchtower-boss') return state.bossDefeated;
    return true;
  }

  function learnFirstMagic(state) {
    if (!canLearnFirstMagic(state)) {
      return { ok: false, state, card: DISCOVERABLE_CARDS.spark, message: '火花の札はまだ目覚めていない。' };
    }
    const magicWater = Math.min(9, (state.inventory['magic-water'] || 0) + 1);
    return {
      ok: true,
      state: {
        ...state,
        ownedCards: [...state.ownedCards, 'spark'],
        inventory: { ...state.inventory, 'magic-water': magicWater }
      },
      card: DISCOVERABLE_CARDS.spark,
      message: '火花の札と、まほうの雫を手に入れた。'
    };
  }

  function useItem(state, itemId) {
    const product = PRODUCTS.get(itemId);
    if (product?.type !== 'item' || !state.inventory[itemId]) {
      return { ok: false, state, message: 'その道具は持っていない。' };
    }
    const definition = levelDefinition(state.level);
    const restoresHp = Boolean(product.heal);
    const restoresMp = Boolean(product.restoreMp);
    if (restoresHp && state.currentHp >= definition.maxHp) return { ok: false, state, message: 'HPは満タンだ。' };
    if (restoresMp && state.currentMp >= definition.maxMp) return { ok: false, state, message: 'MPは満タンだ。' };
    const currentHp = restoresHp ? Math.min(definition.maxHp, state.currentHp + product.heal) : state.currentHp;
    const currentMp = restoresMp ? Math.min(definition.maxMp, state.currentMp + product.restoreMp) : state.currentMp;
    const restored = restoresHp ? `HPが${currentHp - state.currentHp}` : `MPが${currentMp - state.currentMp}`;
    return {
      ok: true,
      state: {
        ...state,
        currentHp,
        currentMp,
        inventory: { ...state.inventory, [itemId]: state.inventory[itemId] - 1 }
      },
      message: `${product.name}を使い、${restored}回復した。`
    };
  }

  function restAtInn(state, gold) {
    if (gold < INN_PRICE) return { ok: false, state, gold, message: '宿代が足りない。' };
    const definition = levelDefinition(state.level);
    return {
      ok: true,
      state: { ...state, currentHp: definition.maxHp, currentMp: definition.maxMp },
      gold: gold - INN_PRICE,
      message: '宿屋の好意で無料で休み、HPとMPが全回復した。'
    };
  }

  function reachWatchtower(state) {
    if (state.watchtowerReached) return state;
    return { ...state, watchtowerReached: true };
  }

  function applyBattleVictory(state, {
    xp = 0,
    playerHp = state.currentHp,
    playerMp = state.currentMp,
    encounterId = ''
  } = {}) {
    const gainedXp = Math.max(0, Math.floor(Number(xp) || 0));
    const exp = state.exp + gainedXp;
    const previousLevel = state.level;
    const level = levelForExp(exp).level;
    const leveledUp = level > previousLevel;
    const defeatedRoadEnemies = encounterId.startsWith('road-')
      ? [...new Set([...state.defeatedRoadEnemies, encounterId])]
      : state.defeatedRoadEnemies;
    const sealFragments = encounterId.startsWith('road-') && state.watchtowerReached
      ? [...new Set([...state.sealFragments, encounterId])]
      : state.sealFragments;
    const definition = levelDefinition(level);
    const next = {
      ...state,
      level,
      exp,
      currentHp: leveledUp ? definition.maxHp : Math.max(1, Math.min(definition.maxHp, Math.floor(playerHp))),
      currentMp: leveledUp ? definition.maxMp : Math.max(0, Math.min(definition.maxMp, Math.floor(playerMp))),
      defeatedRoadEnemies,
      roadVictories: defeatedRoadEnemies.length,
      sealFragments,
      bossDefeated: state.bossDefeated || encounterId === 'watchtower-boss'
    };
    return { state: next, leveledUp, levelsGained: level - previousLevel };
  }

  function canChallengeWatchtower(state) {
    return state.watchtowerReached && state.sealFragments.length >= WATCHTOWER_SEALS && state.ownedCards.includes('spark') && !state.bossDefeated;
  }

  function campaignObjective(state) {
    if (state.bossDefeated) return '古い見張り台の異変調査完了・王へ報告する';
    if (canLearnFirstMagic(state)) return '西の港街道に現れた旅の魔導士を訪ねる';
    if (!state.watchtowerReached) return '西の港街道の奥にある古い見張り台を調べる';
    if (state.sealFragments.length >= WATCHTOWER_SEALS) return '封印が解けた古い見張り台へ向かう';
    return `西の港街道の魔物を倒し、封印片を集める ${state.sealFragments.length}/${WATCHTOWER_SEALS}`;
  }

  function resolveDefeat(state, gold) {
    const definition = levelDefinition(state.level);
    return {
      state: { ...state, currentHp: definition.maxHp, currentMp: definition.maxMp },
      gold: Math.floor(Math.max(0, gold) / 2),
      message: '王都へ運ばれた。所持金が半分になった。'
    };
  }

  return {
    MAIN_STORY_PACING,
    INN_PRICE,
    DISCOVERABLE_CARDS,
    FIRST_QUEST_LOADOUT,
    LEVEL_TABLE,
    SHOP_CATALOG,
    WATCHTOWER_SEALS,
    applyBattleVictory,
    battleProfile,
    buyProduct,
    campaignObjective,
    canChallengeWatchtower,
    canDiscoverCard,
    canLearnFirstMagic,
    createPastCampaign,
    discoverCard,
    experienceToNextLevel,
    learnFirstMagic,
    reachWatchtower,
    resolveDefeat,
    restAtInn,
    useItem
  };
});
