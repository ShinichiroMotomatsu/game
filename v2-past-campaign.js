(function exposePastCampaign(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_CAMPAIGN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const STARTER_DECK = Object.freeze(['slash', 'cleave', 'spark', 'frost', 'guard', 'parry', 'focus', 'feint']);
  const INN_PRICE = 12;
  const WATCHTOWER_SEALS = 4;

  const LEVEL_TABLE = Object.freeze([
    Object.freeze({ level: 1, exp: 0, maxHp: 42, attack: 0, defense: 0 }),
    Object.freeze({ level: 2, exp: 20, maxHp: 50, attack: 1, defense: 0 }),
    Object.freeze({ level: 3, exp: 55, maxHp: 58, attack: 2, defense: 1 }),
    Object.freeze({ level: 4, exp: 110, maxHp: 68, attack: 3, defense: 2 }),
    Object.freeze({ level: 5, exp: 190, maxHp: 80, attack: 5, defense: 3 })
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
      Object.freeze({ id: 'herb', type: 'item', name: 'やくそう', price: 15, heal: 20, maxQuantity: 9, description: '戦闘の外でHPを20回復する' })
    ]),
    card: Object.freeze([
      Object.freeze({ id: 'flame-edge', type: 'card', name: '炎刃の札', price: 120, description: '炎属性の強力な斬撃カードをデッキに加える' }),
      Object.freeze({ id: 'fortress', type: 'card', name: '城壁の札', price: 120, description: '大きく身を守る防御カードをデッキに加える' })
    ])
  });

  const PRODUCTS = new Map(Object.values(SHOP_CATALOG).flat().map(product => [product.id, product]));

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
    const equipment = saved.equipment || {};
    const inventory = saved.inventory || {};
    const herbCount = Math.max(0, Math.min(9, Math.floor(Number(inventory.herb) || 0)));
    const defeatedRoadEnemies = sanitizeIds(saved.defeatedRoadEnemies, value => typeof value === 'string' && value.startsWith('road-'));
    return {
      level,
      exp,
      currentHp,
      equipment: {
        weapon: PRODUCTS.get(equipment.weapon)?.type === 'weapon' ? equipment.weapon : null,
        armor: PRODUCTS.get(equipment.armor)?.type === 'armor' ? equipment.armor : null
      },
      inventory: { herb: herbCount },
      ownedCards: sanitizeIds(saved.ownedCards, value => PRODUCTS.get(value)?.type === 'card'),
      defeatedRoadEnemies,
      roadVictories: defeatedRoadEnemies.length,
      bossDefeated: Boolean(saved.bossDefeated)
    };
  }

  function battleProfile(state) {
    const definition = levelDefinition(state.level);
    const weapon = PRODUCTS.get(state.equipment.weapon);
    const armor = PRODUCTS.get(state.equipment.armor);
    return {
      level: state.level,
      hp: Math.min(state.currentHp, definition.maxHp),
      maxHp: definition.maxHp,
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

  function useItem(state, itemId) {
    const product = PRODUCTS.get(itemId);
    if (product?.type !== 'item' || !state.inventory[itemId]) {
      return { ok: false, state, message: 'その道具は持っていない。' };
    }
    const maxHp = levelDefinition(state.level).maxHp;
    if (state.currentHp >= maxHp) return { ok: false, state, message: 'HPは満タンだ。' };
    const currentHp = Math.min(maxHp, state.currentHp + product.heal);
    return {
      ok: true,
      state: {
        ...state,
        currentHp,
        inventory: { ...state.inventory, [itemId]: state.inventory[itemId] - 1 }
      },
      message: `${product.name}を使い、HPが${currentHp - state.currentHp}回復した。`
    };
  }

  function restAtInn(state, gold) {
    if (gold < INN_PRICE) return { ok: false, state, gold, message: '宿代が足りない。' };
    const maxHp = levelDefinition(state.level).maxHp;
    return {
      ok: true,
      state: { ...state, currentHp: maxHp },
      gold: gold - INN_PRICE,
      message: 'ぐっすり休み、HPが全回復した。'
    };
  }

  function applyBattleVictory(state, { xp = 0, playerHp = state.currentHp, encounterId = '' } = {}) {
    const gainedXp = Math.max(0, Math.floor(Number(xp) || 0));
    const exp = state.exp + gainedXp;
    const previousLevel = state.level;
    const level = levelForExp(exp).level;
    const leveledUp = level > previousLevel;
    const defeatedRoadEnemies = encounterId.startsWith('road-')
      ? [...new Set([...state.defeatedRoadEnemies, encounterId])]
      : state.defeatedRoadEnemies;
    const maxHp = levelDefinition(level).maxHp;
    const next = {
      ...state,
      level,
      exp,
      currentHp: leveledUp ? maxHp : Math.max(1, Math.min(maxHp, Math.floor(playerHp))),
      defeatedRoadEnemies,
      roadVictories: defeatedRoadEnemies.length,
      bossDefeated: state.bossDefeated || encounterId === 'watchtower-boss'
    };
    return { state: next, leveledUp, levelsGained: level - previousLevel };
  }

  function canChallengeWatchtower(state) {
    return state.roadVictories >= WATCHTOWER_SEALS && !state.bossDefeated;
  }

  function campaignObjective(state) {
    if (state.bossDefeated) return '古い見張り台の異変調査完了・王へ報告する';
    if (state.roadVictories >= WATCHTOWER_SEALS) return '封印が解けた古い見張り台へ向かう';
    return `西の港街道の魔物を倒し、封印片を集める ${state.roadVictories}/${WATCHTOWER_SEALS}`;
  }

  function resolveDefeat(state, gold) {
    const maxHp = levelDefinition(state.level).maxHp;
    return {
      state: { ...state, currentHp: maxHp },
      gold: Math.floor(Math.max(0, gold) / 2),
      message: '王都へ運ばれた。所持金が半分になった。'
    };
  }

  return {
    INN_PRICE,
    LEVEL_TABLE,
    SHOP_CATALOG,
    WATCHTOWER_SEALS,
    applyBattleVictory,
    battleProfile,
    buyProduct,
    campaignObjective,
    canChallengeWatchtower,
    createPastCampaign,
    resolveDefeat,
    restAtInn,
    useItem
  };
});
