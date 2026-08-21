(function exposePastCampaign(root, factory) {
  const sideQuestApi = typeof module === 'object' && module.exports
    ? require('./v2-past-sidequests.js')
    : root?.V2_PAST_SIDEQUESTS;
  const api = factory(sideQuestApi);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.V2_PAST_CAMPAIGN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, sideQuestApi => {
  if (!sideQuestApi) throw new Error('Past sidequest data is required.');
  const {
    SIDE_QUESTS,
    completeSideQuest,
    createSideQuestProgress,
    grantSideQuestKeyItem,
    sideQuestForEncounter
  } = sideQuestApi;
  const CAMPAIGN_SCHEMA_VERSION = 7;
  const STARTER_DECK = Object.freeze(['slash', 'focus', 'guard']);
  const DISCOVERABLE_CARDS = Object.freeze({
    spark: Object.freeze({ id: 'spark', name: '火花の札', unlockAfter: 'first-victory', description: 'MP2で炎属性の一撃を放つ最初の魔法カード' }),
    frost: Object.freeze({ id: 'frost', name: '霜結の札', unlockAfter: 'watchtower-boss', description: 'MP3で氷属性の一撃を放つカード' }),
    mend: Object.freeze({ id: 'mend', name: '癒光の札', unlockAfter: 'watchtower-boss', description: 'MP3でHPを14回復するカード' })
  });
  const INN_DEFINITIONS = Object.freeze({
    'castle-town': Object.freeze({ price: 0, message: '宿屋の好意で無料で休み、HPとMPが全回復した。' }),
    'crossroads-town': Object.freeze({ price: 25, message: '一晩ゆっくり休み、HPとMPが全回復した。' }),
    'mist-citadel': Object.freeze({ price: 50, message: '霧除けの香を焚いた部屋で休み、HPとMPが全回復した。' })
  });
  const INN_PRICE = INN_DEFINITIONS['castle-town'].price;
  const WATCHTOWER_SEALS = 4;
  const FIRST_QUEST_LOADOUT = Object.freeze(['bronze-sword', 'leather-armor', 'herb', 'herb']);
  const QUEST_REWARDS = Object.freeze({
    'crossroads-blade': Object.freeze({ id: 'crossroads-blade', type: 'weapon', name: '交差路の剣', price: 560, attack: 7, description: '四方へ伸びる刃紋を刻んだ剣。攻撃力＋7' }),
    'bellsteel-sword': Object.freeze({ id: 'bellsteel-sword', type: 'weapon', name: '鐘鋼の剣', price: 980, attack: 10, description: '霧鐘の青銅を鍛え直した剣。攻撃力＋10' }),
    'lampkeeper-cloak': Object.freeze({ id: 'lampkeeper-cloak', type: 'armor', name: '灯守の外套', price: 1350, defense: 11, description: '消えない灯のぬくもりを宿す外套。守備力＋11' }),
    'twin-star-sword': Object.freeze({ id: 'twin-star-sword', type: 'weapon', name: '双星の剣', price: 2400, attack: 15, description: '二つの星が同じ道を指す剣。攻撃力＋15' })
  });
  const DUNGEON_TREASURES = Object.freeze([
    Object.freeze({ id: 'armory-coffer', name: '武具庫の宝箱', weaponId: 'crossroads-blade' }),
    Object.freeze({ id: 'merchant-cache', name: '商人の備蓄箱', items: Object.freeze({ herb: 3, 'magic-water': 2 }) }),
    Object.freeze({ id: 'rune-coffer', name: '方位石の宝箱', cardId: 'cross-slash' }),
    Object.freeze({ id: 'bell-armory', name: '鐘楼武具庫の宝箱', weaponId: 'bellsteel-sword' }),
    Object.freeze({ id: 'fog-cache', name: '霧見張りの備蓄箱', items: Object.freeze({ 'strong-herb': 2, 'sage-dew': 2 }) })
  ]);

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
      Object.freeze({ id: 'iron-sword', type: 'weapon', name: '鉄の剣', price: 280, attack: 5, description: '王都の鍛冶師が打った剣。攻撃力＋5' }),
      Object.freeze({ id: 'steel-sword', type: 'weapon', name: '鋼の剣', price: 420, attack: 6, description: 'クアドラの炉で鍛えた剣。攻撃力＋6' }),
      Object.freeze({ id: 'silver-saber', type: 'weapon', name: '銀のサーベル', price: 720, attack: 9, description: '霧の魔力を払う細身の剣。攻撃力＋9' })
    ]),
    armor: Object.freeze([
      Object.freeze({ id: 'traveler-clothes', type: 'armor', name: '旅人の服', price: 50, defense: 1, description: '厚手で動きやすい服。守備力＋1' }),
      Object.freeze({ id: 'leather-armor', type: 'armor', name: '皮の鎧', price: 130, defense: 3, description: 'なめし革を重ねた鎧。守備力＋3' }),
      Object.freeze({ id: 'chain-mail', type: 'armor', name: '鎖かたびら', price: 280, defense: 5, description: '細い鎖で編まれた鎧。守備力＋5' }),
      Object.freeze({ id: 'scale-armor', type: 'armor', name: 'うろこの鎧', price: 460, defense: 7, description: '水竜の鱗を重ねた鎧。守備力＋7' }),
      Object.freeze({ id: 'fog-mail', type: 'armor', name: '霧除けの鎧', price: 760, defense: 9, description: '銀糸で霧の侵入を防ぐ鎧。守備力＋9' })
    ]),
    item: Object.freeze([
      Object.freeze({ id: 'herb', type: 'item', name: 'やくそう', price: 15, heal: 20, maxQuantity: 9, description: '戦闘の外でHPを20回復する' }),
      Object.freeze({ id: 'magic-water', type: 'item', name: 'まほうの雫', price: 25, restoreMp: 6, maxQuantity: 9, description: '戦闘の外でMPを6回復する' }),
      Object.freeze({ id: 'strong-herb', type: 'item', name: '上やくそう', price: 45, heal: 45, maxQuantity: 9, description: '戦闘の外でHPを45回復する' }),
      Object.freeze({ id: 'sage-dew', type: 'item', name: '賢者の雫', price: 60, restoreMp: 12, maxQuantity: 9, description: '戦闘の外でMPを12回復する' })
    ]),
    card: Object.freeze([
      Object.freeze({ id: 'cleave', type: 'card', name: '薙ぎ払いの札', price: 60, description: '二連斬りへつながる剣カードをデッキに加える' }),
      Object.freeze({ id: 'parry', type: 'card', name: '受け流しの札', price: 70, description: '守りながら反撃する防御カードを加える' }),
      Object.freeze({ id: 'feint', type: 'card', name: '陽動の札', price: 80, description: '敵の攻撃を弱める技カードを加える' }),
      Object.freeze({ id: 'flame-edge', type: 'card', name: '炎刃の札', price: 120, description: '炎属性の強力な斬撃カードをデッキに加える' }),
      Object.freeze({ id: 'fortress', type: 'card', name: '城壁の札', price: 120, description: '大きく身を守る防御カードをデッキに加える' })
    ])
  });

  const TOWN_SHOP_INVENTORY = Object.freeze({
    'castle-town': Object.freeze({
      weapon: Object.freeze(['wooden-sword', 'bronze-sword', 'iron-sword']),
      armor: Object.freeze(['traveler-clothes', 'leather-armor', 'chain-mail']),
      item: Object.freeze(['herb', 'magic-water']),
      card: Object.freeze(['cleave', 'parry', 'feint'])
    }),
    'crossroads-town': Object.freeze({
      weapon: Object.freeze(['iron-sword', 'steel-sword']),
      armor: Object.freeze(['chain-mail', 'scale-armor']),
      item: Object.freeze(['strong-herb', 'sage-dew']),
      card: Object.freeze(['flame-edge', 'fortress'])
    }),
    'mist-citadel': Object.freeze({
      weapon: Object.freeze(['steel-sword', 'silver-saber']),
      armor: Object.freeze(['scale-armor', 'fog-mail']),
      item: Object.freeze(['strong-herb', 'sage-dew']),
      card: Object.freeze(['flame-edge', 'fortress', 'feint'])
    })
  });

  const PRODUCTS = new Map([
    ...Object.values(SHOP_CATALOG).flat().map(product => [product.id, product]),
    ...Object.values(QUEST_REWARDS).map(product => [product.id, product])
  ]);
  const UNLOCKABLE_CARD_IDS = new Set([
    ...Object.keys(DISCOVERABLE_CARDS),
    ...SHOP_CATALOG.card.map(card => card.id),
    'cross-slash',
    'purify',
    'sunfire',
    'starflare'
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
    const migratedSealFragments = savedSchemaVersion >= 4
      ? sanitizeIds(saved.sealFragments, value => typeof value === 'string' && value.startsWith('road-'))
      : defeatedRoadEnemies;
    const bossDefeated = Boolean(saved.bossDefeated);
    const watchtowerReached = Boolean(saved.watchtowerReached || bossDefeated || migratedSealFragments.length);
    const normalizedEquipment = {
      weapon: PRODUCTS.get(equipment.weapon)?.type === 'weapon' ? equipment.weapon : null,
      armor: PRODUCTS.get(equipment.armor)?.type === 'armor' ? equipment.armor : null
    };
    const ownedEquipment = sanitizeIds(saved.ownedEquipment, value => {
      const product = PRODUCTS.get(value);
      return product?.type === 'weapon' || product?.type === 'armor';
    });
    for (const equippedId of Object.values(normalizedEquipment)) {
      if (equippedId && !ownedEquipment.includes(equippedId)) ownedEquipment.push(equippedId);
    }
    return {
      schemaVersion: CAMPAIGN_SCHEMA_VERSION,
      level,
      exp,
      currentHp,
      currentMp,
      equipment: normalizedEquipment,
      ownedEquipment,
      inventory: itemInventory,
      ownedCards: legacyCards,
      defeatedRoadEnemies,
      roadVictories: defeatedRoadEnemies.length,
      watchtowerReached,
      sealFragments: migratedSealFragments,
      bossDefeated,
      openedDungeonChests: sanitizeIds(saved.openedDungeonChests, value => DUNGEON_TREASURES.some(treasure => treasure.id === value)),
      crossroadsBossDefeated: Boolean(saved.crossroadsBossDefeated),
      mistBossDefeated: Boolean(saved.mistBossDefeated),
      sideQuests: createSideQuestProgress(saved.sideQuests)
    };
  }

  function restartCampaignKeepingGrowth(state) {
    return createPastCampaign({
      schemaVersion: CAMPAIGN_SCHEMA_VERSION,
      level: state.level,
      exp: state.exp,
      equipment: { ...state.equipment },
      ownedEquipment: [...state.ownedEquipment],
      inventory: { ...state.inventory },
      ownedCards: [...state.ownedCards],
      sideQuests: createSideQuestProgress()
    });
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
    if ((product.type === 'weapon' || product.type === 'armor') && state.ownedEquipment.includes(product.id)) {
      return { ok: false, state, gold, message: 'その装備はすでに持っている。' };
    }
    if (product.type === 'item' && state.inventory[product.id] >= product.maxQuantity) {
      return { ok: false, state, gold, message: 'これ以上持てない。' };
    }

    let next = state;
    if (product.type === 'weapon' || product.type === 'armor') {
      next = {
        ...state,
        equipment: { ...state.equipment, [product.type]: product.id },
        ownedEquipment: [...state.ownedEquipment, product.id]
      };
    } else if (product.type === 'card') {
      next = { ...state, ownedCards: [...state.ownedCards, product.id] };
    } else {
      next = { ...state, inventory: { ...state.inventory, [product.id]: state.inventory[product.id] + 1 } };
    }
    return { ok: true, state: next, gold: gold - product.price, product, message: `${product.name}を手に入れた。` };
  }

  function productsForShop(areaId, shopType) {
    const inventory = TOWN_SHOP_INVENTORY[areaId] || TOWN_SHOP_INVENTORY['castle-town'];
    return (inventory[shopType] || []).map(productId => PRODUCTS.get(productId)).filter(Boolean);
  }

  function productsOwnedForSale(state) {
    const equipment = state.ownedEquipment
      .map(productId => PRODUCTS.get(productId))
      .filter(product => product?.type === 'weapon' || product?.type === 'armor');
    const items = SHOP_CATALOG.item.filter(product => (state.inventory[product.id] || 0) > 0);
    return [...equipment, ...items];
  }

  function equipProduct(state, productId) {
    const product = PRODUCTS.get(productId);
    if (!product || !['weapon', 'armor'].includes(product.type)) {
      return { ok: false, state, product: null, message: 'その品は装備できない。' };
    }
    if (!state.ownedEquipment.includes(productId)) {
      return { ok: false, state, product, message: 'その装備は持っていない。' };
    }
    if (state.equipment[product.type] === productId) {
      return { ok: false, state, product, message: `${product.name}はすでに装備している。` };
    }
    return {
      ok: true,
      state: { ...state, equipment: { ...state.equipment, [product.type]: productId } },
      product,
      message: `${product.name}を装備した。`
    };
  }

  function salePrice(productId) {
    const product = PRODUCTS.get(productId);
    return product?.type === 'card' ? 0 : Math.floor((product?.price || 0) / 2);
  }

  function sellProduct(state, gold, productId) {
    const product = PRODUCTS.get(productId);
    if (!product || product.type === 'card') {
      return { ok: false, state, gold, message: 'その品は買い取れない。' };
    }
    const price = salePrice(productId);
    if (product.type === 'item') {
      if (!state.inventory[productId]) return { ok: false, state, gold, message: 'その品は持っていない。' };
      return {
        ok: true,
        state: { ...state, inventory: { ...state.inventory, [productId]: state.inventory[productId] - 1 } },
        gold: gold + price,
        product,
        message: `${product.name}を${price}Gで売った。`
      };
    }
    if (!state.ownedEquipment.includes(productId)) {
      return { ok: false, state, gold, message: 'その装備は持っていない。' };
    }
    const ownedEquipment = state.ownedEquipment.filter(id => id !== productId);
    const replacement = ownedEquipment
      .map(id => PRODUCTS.get(id))
      .filter(candidate => candidate?.type === product.type)
      .sort((left, right) => (right.attack || right.defense || 0) - (left.attack || left.defense || 0))[0];
    const equipment = state.equipment[product.type] === productId
      ? { ...state.equipment, [product.type]: replacement?.id || null }
      : state.equipment;
    return {
      ok: true,
      state: {
        ...state,
        equipment,
        ownedEquipment
      },
      gold: gold + price,
      product,
      message: `${product.name}を${price}Gで売った。`
    };
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

  function openDungeonTreasure(state, treasureId) {
    const treasure = DUNGEON_TREASURES.find(candidate => candidate.id === treasureId);
    if (!treasure) return { ok: false, state, message: '空の石箱だ。' };
    if (state.openedDungeonChests.includes(treasureId)) {
      return { ok: false, state, treasure, message: `${treasure.name}はすでに開けている。` };
    }
    const inventory = { ...state.inventory };
    const itemRewards = [];
    for (const [itemId, amount] of Object.entries(treasure.items || {})) {
      const product = PRODUCTS.get(itemId);
      const before = inventory[itemId] || 0;
      inventory[itemId] = Math.min(product.maxQuantity, before + amount);
      const gained = inventory[itemId] - before;
      itemRewards.push(gained > 0 ? `${product.name}×${gained}` : `${product.name}は持ちきれなかった`);
    }
    const gainsWeapon = Boolean(treasure.weaponId && !state.ownedEquipment.includes(treasure.weaponId));
    const gainsCard = Boolean(treasure.cardId && !state.ownedCards.includes(treasure.cardId));
    const equipment = gainsWeapon
      ? { ...state.equipment, weapon: treasure.weaponId }
      : state.equipment;
    const ownedEquipment = gainsWeapon
      ? [...state.ownedEquipment, treasure.weaponId]
      : state.ownedEquipment;
    const ownedCards = gainsCard
      ? [...state.ownedCards, treasure.cardId]
      : state.ownedCards;
    const rewards = [
      treasure.weaponId ? `${PRODUCTS.get(treasure.weaponId).name}${gainsWeapon ? '' : 'はすでに持っている'}` : '',
      treasure.cardId ? `${treasure.cardId === 'cross-slash' ? '十字斬りの札' : treasure.cardId}${gainsCard ? '' : 'はすでに持っている'}` : '',
      ...itemRewards
    ].filter(Boolean).join('、');
    return {
      ok: true,
      state: {
        ...state,
        equipment,
        ownedEquipment,
        inventory,
        ownedCards,
        openedDungeonChests: [...state.openedDungeonChests, treasureId]
      },
      treasure,
      message: `${treasure.name}から${rewards}を手に入れた。`
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

  function restAtInn(state, gold, areaId = 'castle-town') {
    const inn = INN_DEFINITIONS[areaId] || INN_DEFINITIONS['castle-town'];
    if (gold < inn.price) return { ok: false, state, gold, message: '宿代が足りない。' };
    const definition = levelDefinition(state.level);
    return {
      ok: true,
      state: { ...state, currentHp: definition.maxHp, currentMp: definition.maxMp },
      gold: gold - inn.price,
      message: inn.message
    };
  }

  function reachWatchtower(state) {
    if (state.watchtowerReached) return state;
    return { ...state, watchtowerReached: true };
  }

  function applySideQuestBattleVictory(state, encounterId) {
    if (encounterId === 'sidequest-fire-rat-chief') {
      const sideQuests = grantSideQuestKeyItem(state.sideQuests, 'fire-rat-boots');
      if (sideQuests === state.sideQuests) return { state, completedQuestId: null, message: '火鼠の長はすでに退けている。' };
      return {
        state: { ...state, sideQuests },
        completedQuestId: null,
        message: '火鼠の長が守っていた「火鼠の長靴」を手に入れた。熔岩の上を歩けるようになった。'
      };
    }

    const quest = sideQuestForEncounter(encounterId);
    if (!quest || state.sideQuests.completedQuestIds.includes(quest.id)) {
      return { state, completedQuestId: null, message: '' };
    }
    let sideQuests = completeSideQuest(state.sideQuests, quest.id);
    if (quest.rewardKeyItemId) sideQuests = grantSideQuestKeyItem(sideQuests, quest.rewardKeyItemId);
    const ownedCards = quest.rewardCardId && !state.ownedCards.includes(quest.rewardCardId)
      ? [...state.ownedCards, quest.rewardCardId]
      : state.ownedCards;
    const ownedEquipment = quest.rewardEquipmentId && !state.ownedEquipment.includes(quest.rewardEquipmentId)
      ? [...state.ownedEquipment, quest.rewardEquipmentId]
      : state.ownedEquipment;
    const rewards = [
      quest.rewardCardId ? `新しい札「${quest.rewardCardId === 'purify' ? '浄光' : quest.rewardCardId === 'sunfire' ? '陽炎' : '星焔'}」` : '',
      quest.rewardEquipmentId ? QUEST_REWARDS[quest.rewardEquipmentId]?.name : '',
      quest.rewardKeyItemId ? '沼守りの護符' : ''
    ].filter(Boolean).join('と');
    return {
      state: { ...state, sideQuests, ownedCards, ownedEquipment },
      completedQuestId: quest.id,
      message: `${quest.title}を鎮め、父の旅日誌・第${quest.journalOrder}片と${rewards}を手に入れた。`
    };
  }

  function setSideQuestDebugCompletion(state, questId, completed) {
    const quest = SIDE_QUESTS.find(candidate => candidate.id === questId);
    if (!quest) return state;
    if (completed) {
      return applySideQuestBattleVictory(state, quest.bossEncounterId).state;
    }
    const completedQuestIds = state.sideQuests.completedQuestIds.filter(id => id !== questId);
    const removedKeyItems = new Set([quest.rewardKeyItemId]);
    if (questId === 'molten-crown') removedKeyItems.add('fire-rat-boots');
    return {
      ...state,
      sideQuests: createSideQuestProgress({
        ...state.sideQuests,
        acceptedQuestIds: [...new Set([...state.sideQuests.acceptedQuestIds, questId])],
        completedQuestIds,
        keyItems: state.sideQuests.keyItems.filter(id => !removedKeyItems.has(id)),
        cooledSluiceIds: questId === 'molten-crown' ? [] : state.sideQuests.cooledSluiceIds,
        twinStarVowSeen: false
      })
    };
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
      bossDefeated: state.bossDefeated || encounterId === 'watchtower-boss',
      crossroadsBossDefeated: state.crossroadsBossDefeated || encounterId === 'crossroads-boss',
      mistBossDefeated: state.mistBossDefeated || encounterId === 'mist-bell-boss'
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
    DUNGEON_TREASURES,
    MAIN_STORY_PACING,
    INN_DEFINITIONS,
    INN_PRICE,
    DISCOVERABLE_CARDS,
    FIRST_QUEST_LOADOUT,
    LEVEL_TABLE,
    QUEST_REWARDS,
    SHOP_CATALOG,
    TOWN_SHOP_INVENTORY,
    WATCHTOWER_SEALS,
    applyBattleVictory,
    applySideQuestBattleVictory,
    battleProfile,
    buyProduct,
    campaignObjective,
    canChallengeWatchtower,
    canDiscoverCard,
    canLearnFirstMagic,
    createPastCampaign,
    discoverCard,
    equipProduct,
    experienceToNextLevel,
    learnFirstMagic,
    openDungeonTreasure,
    productsOwnedForSale,
    productsForShop,
    reachWatchtower,
    restartCampaignKeepingGrowth,
    resolveDefeat,
    restAtInn,
    salePrice,
    sellProduct,
    setSideQuestDebugCompletion,
    useItem
  };
});
