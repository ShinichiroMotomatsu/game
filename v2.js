(() => {
  const canvas = document.querySelector('#v2-game');
  const ctx = canvas.getContext('2d');
  const mini = document.querySelector('#v2-mini');
  const mctx = mini.getContext('2d');
  const loading = document.querySelector('#v2-loading');
  const collisionStatus = document.querySelector('#v2-collision-status');
  const collisionToggle = document.querySelector('#v2-toggle-collision');
  const shell = document.querySelector('#v2-shell');
  const settingsPanel = document.querySelector('#v2-settings');
  const settingsToggle = document.querySelector('#v2-settings-toggle');
  const settingsClose = document.querySelector('#v2-settings-close');
  const questDebug = document.querySelector('#v2-quest-debug');
  const questDebugStatus = document.querySelector('#v2-quest-debug-status');
  const infoToggle = document.querySelector('#v2-info-toggle');
  const battleOverlay = document.querySelector('#v2-battle');
  const battleHand = document.querySelector('#v2-battle-hand');
  const battleResolve = document.querySelector('#v2-battle-resolve');
  const battleRedraw = document.querySelector('#v2-battle-redraw');
  const battleRedrawCancel = document.querySelector('#v2-battle-redraw-cancel');
  const battleFlee = document.querySelector('#v2-battle-flee');
  const battlePractice = document.querySelector('#v2-battle-practice');
  const battleEffects = document.querySelector('#v2-battle-effects');
  const battleDamageFlash = document.querySelector('#v2-battle-damage-flash');
  const encounterTransition = document.querySelector('#v2-encounter-transition');
  const storyStatus = document.querySelector('#v2-story-status');
  const storyArea = document.querySelector('#v2-story-area');
  const storyGold = document.querySelector('#v2-story-gold');
  const storyLevel = document.querySelector('#v2-story-level');
  const storyHp = document.querySelector('#v2-story-hp');
  const storyMp = document.querySelector('#v2-story-mp');
  const storyEnergy = document.querySelector('#v2-story-energy');
  const storyExp = document.querySelector('#v2-story-exp');
  const openBagButton = document.querySelector('#v2-open-bag');
  const storyObjectiveLabel = document.querySelector('#v2-story-objective');
  const questCompass = document.querySelector('#v2-quest-compass');
  const questCompassNeedle = document.querySelector('#v2-quest-compass-needle');
  const questCompassTarget = document.querySelector('#v2-quest-compass-target');
  const questCompassDistance = document.querySelector('#v2-quest-compass-distance');
  const interactionPrompt = document.querySelector('#v2-interaction-prompt');
  const dialogueOverlay = document.querySelector('#v2-dialogue');
  const dialogueSpeaker = document.querySelector('#v2-dialogue-speaker');
  const dialogueText = document.querySelector('#v2-dialogue-text');
  const dialogueNext = document.querySelector('#v2-dialogue-next');
  const storyVisual = document.querySelector('#v2-story-visual');
  const storyVisualScene = document.querySelector('#v2-story-visual-scene');
  const storyVisualObject = document.querySelector('#v2-story-visual-object');
  const storyVisualEvent = document.querySelector('#v2-story-visual-event');
  const storyVisualCrest = document.querySelector('#v2-story-visual-crest');
  const watchtowerEffect = document.querySelector('#v2-watchtower-effect');
  const shopOverlay = document.querySelector('#v2-shop');
  const shopTitle = document.querySelector('#v2-shop-title');
  const shopGold = document.querySelector('#v2-shop-gold');
  const shopMessage = document.querySelector('#v2-shop-message');
  const shopList = document.querySelector('#v2-shop-list');
  const shopClose = document.querySelector('#v2-shop-close');
  const shopTabs = document.querySelector('.v2-shop-tabs');
  const shopBuy = document.querySelector('#v2-shop-buy');
  const shopSell = document.querySelector('#v2-shop-sell');
  const shopConfirm = document.querySelector('#v2-shop-confirm');
  const shopConfirmMessage = document.querySelector('#v2-shop-confirm-message');
  const shopConfirmAccept = document.querySelector('#v2-shop-confirm-accept');
  const shopConfirmCancel = document.querySelector('#v2-shop-confirm-cancel');
  const restTransition = document.querySelector('#v2-rest-transition');
  const inheritedRestart = document.querySelector('#v2-inherited-restart');
  const dragGuide = document.querySelector('#v2-drag-guide');
  const dragGuideKnob = dragGuide.querySelector('span');
  const landmarkGeometry = window.V2_LANDMARK_GEOMETRY;
  const editionApi = window.V2_EDITIONS;
  const assetApi = window.V2_ASSETS;
  const battleApi = window.V2_BATTLE;
  const pastWorldApi = window.V2_PAST_WORLD;
  const pastSideQuestApi = window.V2_PAST_SIDEQUESTS;
  const pastCampaignApi = window.V2_PAST_CAMPAIGN;
  const pastSceneApi = window.V2_PAST_SCENES;
  const pastStoryApi = window.V2_PAST_STORY;
  const questCompassApi = window.V2_QUEST_COMPASS;
  const dialogueApi = window.V2_DIALOGUE;
  const saveApi = window.V2_SAVE;
  const inputApi = window.V2_INPUT;
  const mapLayout = window.V2_MAP_LAYOUT;
  if (!landmarkGeometry || !editionApi || !assetApi || !battleApi || !pastWorldApi || !pastSideQuestApi || !pastCampaignApi || !pastSceneApi || !pastStoryApi || !questCompassApi || !dialogueApi || !saveApi || !inputApi || !mapLayout) {
    loading.textContent = 'GAME MODULE ERROR';
    throw new Error('Game geometry, edition, or map layout data is missing.');
  }
  const {
    renderSequenceForLandmarks,
    shadowVectorFromLight
  } = landmarkGeometry;
  const { editionDefinition, editionLandmarkImage, normalizeEdition } = editionApi;
  const {
    createLazyImageLoader,
    directionalTileCoordinate,
    tileCoordinateForPoint,
    visibleTileCoordinates
  } = assetApi;
  const { CARD_ATTRIBUTE_LABELS, CARD_LIBRARY, DISCIPLINE_LABELS, ENEMY_INTENTS, createBattle, hpCondition, previewAction, redrawOpeningCards, resolveTurn, toggleCard } = battleApi;
  const { FIELD_ENCOUNTER_GRACE_MS, FIELD_ENCOUNTER_RADIUS, FIELD_EXIT_SAFE_RADIUS, advancePatrol, createPastEnemies, landmarkMemoryState, nextMemoryStage, respawnPastEnemies, shouldStartEncounter } = pastWorldApi;
  const {
    MAX_WARMTH,
    SIDE_DUNGEONS,
    SIDE_DUNGEON_ENCOUNTERS,
    SIDE_QUEST_KEY_ITEMS,
    SIDE_QUESTS,
    activateCooledSluice,
    acceptAvailableSideQuests,
    cooledSluiceDestination,
    createSideDungeonEnemies,
    dungeonTileAt,
    isNearActiveSideQuestEntrance,
    isSideQuestArea,
    markTwinStarVowSeen,
    resolveDungeonStep,
    sideQuestForArea,
    sideQuestForEncounter,
    sideQuestObjective,
    sideQuestStatus
  } = pastSideQuestApi;
  const { consumePastRestart } = saveApi;
  const { dragMovementVector } = inputApi;
  const { mainQuestCompassTarget, questCompassBearing } = questCompassApi;
  const { NPC_SPRITE_ASSETS, PAST_EVENT_ASSETS, PAST_SCENE_ASSETS, PAST_STORY_VISUALS, npcPoseAt } = pastSceneApi;
  const { createTypewriterLine, revealTypewriterLine, tickTypewriterLine, typewriterText } = dialogueApi;
  const {
    INN_DEFINITIONS,
    QUEST_REWARDS,
    SHOP_CATALOG,
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
  } = pastCampaignApi;
  const {
    BROTHER_NPCS,
    CASTLE_NPCS,
    CROSSROADS_BUILDINGS,
    CROSSROADS_DUNGEON_LAYOUT,
    CROSSROADS_NPCS,
    CROSSROADS_WATERGATES,
    MIST_BUILDINGS,
    MIST_CITADEL_NPCS,
    MIST_TOWER_COLLISION_RECTS,
    PAST_AREAS,
    PAST_START,
    STORY_DIALOGUES,
    TOWN_BUILDINGS,
    TOWN_NPCS,
    activatePastInteraction,
    addStoryGold,
    canStandInPastArea,
    completeStoryEvent,
    createPastStory,
    nearestWalkablePoint,
    nearbyPastInteraction,
    mistInvestigationResult,
    setDebugQuestCompletion,
    storyAllowsEncounters,
    storyEncounterMode,
    storyNpcIsAvailable,
    storyUnlocksInteraction,
    storyObjective
  } = pastStoryApi;
  const campaignProducts = new Map([
    ...Object.values(SHOP_CATALOG).flat().map(product => [product.id, product]),
    ...Object.values(QUEST_REWARDS).map(product => [product.id, product])
  ]);
  const crossroadsDungeonMini = document.createElement('canvas');
  crossroadsDungeonMini.width = 210;
  crossroadsDungeonMini.height = 145;
  const crossroadsDungeonMiniContext = crossroadsDungeonMini.getContext('2d');
  const sideDungeonMinis = new Map();
  const dungeonTileSprites = new Map();
  {
    const { columns, rows } = CROSSROADS_DUNGEON_LAYOUT;
    const miniTileWidth = crossroadsDungeonMini.width / columns;
    const miniTileHeight = crossroadsDungeonMini.height / rows.length;
    crossroadsDungeonMiniContext.fillStyle = '#171620';
    crossroadsDungeonMiniContext.fillRect(0, 0, crossroadsDungeonMini.width, crossroadsDungeonMini.height);
    for (let row = 0; row < rows.length; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tile = rows[row][column];
        if (tile === '#') continue;
        crossroadsDungeonMiniContext.fillStyle = tile === '~' ? '#28566d' : tile === '=' ? '#a7794b' : tile === 'A' ? '#c45f91' : '#8b818c';
        crossroadsDungeonMiniContext.fillRect(column * miniTileWidth, row * miniTileHeight, miniTileWidth + 0.5, miniTileHeight + 0.5);
      }
    }
  }
  for (const dungeon of Object.values(SIDE_DUNGEONS)) {
    const sideMini = document.createElement('canvas');
    sideMini.width = 210;
    sideMini.height = 145;
    const sideMiniContext = sideMini.getContext('2d');
    const miniTileWidth = sideMini.width / dungeon.columns;
    const miniTileHeight = sideMini.height / dungeon.rows.length;
    sideMiniContext.fillStyle = '#151419';
    sideMiniContext.fillRect(0, 0, sideMini.width, sideMini.height);
    for (let row = 0; row < dungeon.rows.length; row += 1) {
      for (let column = 0; column < dungeon.columns; column += 1) {
        const tile = dungeon.rows[row][column];
        if (tile === '#') continue;
        sideMiniContext.fillStyle = tile === 'P'
          ? '#8b4e94'
          : tile === 'I'
            ? '#8ad9ee'
            : tile === 'L'
              ? '#e16b37'
              : tile === 'B'
                ? '#ffd56d'
                : '#77736f';
        sideMiniContext.fillRect(column * miniTileWidth, row * miniTileHeight, miniTileWidth + 0.4, miniTileHeight + 0.4);
      }
    }
    sideDungeonMinis.set(dungeon.id, sideMini);
  }

  // Build-time color extraction stores the collision mask as row runs. Reading
  // prebuilt data avoids getImageData(), which is blocked when HTML is opened via file://.
  const maskScale = 4;
  const world = { w: mapLayout.width * maskScale, h: mapLayout.height * maskScale };
  const tileCols = 2;
  const tileRows = 2;
  const tileW = world.w / tileCols;
  const tileH = world.h / tileRows;
  const assetLoader = createLazyImageLoader({ createImage: () => {
    const image = new Image();
    image.decoding = 'async';
    return image;
  } });
  const editionTiles = new Map();
  const facingNames = ['down', 'left', 'right', 'up'];
  const editionSprites = new Map();
  const editionLandmarkImages = new Map();
  const pastEnemyImages = new Map();
  const pastSceneImages = new Map();
  const pastNpcImages = new Map();
  const pastEventImages = new Map();
  const editionIds = ['modern', 'past'];
  const tileAssetKey = (editionId, col, row) => `${editionId}:tile:${col}:${row}`;
  const spriteAssetKey = (editionId, facing) => `${editionId}:player:${facing}`;
  const landmarkAssetKey = (editionId, landmarkId) => `${editionId}:landmark:${landmarkId}`;
  const enemyAssetKey = enemyId => `past:enemy:${enemyId}`;
  const sceneAssetKey = sceneId => `past:scene:${sceneId}`;
  const npcAssetKey = spriteId => `past:npc:${spriteId}`;
  const eventAssetKey = eventId => `past:event:${eventId}`;

  for (const editionId of editionIds) {
    const definition = editionDefinition(editionId);
    const tiles = [];
    for (let row = 0; row < tileRows; row++) {
      for (let col = 0; col < tileCols; col++) {
        const source = `assets/v2/${definition.tileDirectory}/${col}-${row}.png?edition=${definition.tileVersion}`;
        const key = tileAssetKey(editionId, col, row);
        tiles.push({ row, col, key, image: assetLoader.register(key, source), source });
      }
    }
    editionTiles.set(editionId, tiles);
    const sprites = {};
    for (const facing of facingNames) {
      const directory = editionId === 'past' ? 'past-protagonist' : 'protagonist';
      const key = spriteAssetKey(editionId, facing);
      sprites[facing] = assetLoader.register(key, `assets/v2/${directory}/${facing}.png?edition=1`);
    }
    editionSprites.set(editionId, sprites);
  }

  const collisionData = window.V2_ROAD_COLLISION;
  const pastCollisionData = window.V2_ROAD_COLLISION_PAST;
  if (!collisionData || collisionData.width !== mapLayout.width || collisionData.height !== mapLayout.height) {
    loading.textContent = 'COLLISION DATA ERROR';
    throw new Error('Road collision data is missing or has unexpected dimensions.');
  }
  if (!pastCollisionData || pastCollisionData.width !== mapLayout.width || pastCollisionData.height !== mapLayout.height) {
    loading.textContent = 'PAST COLLISION DATA ERROR';
    throw new Error('Past road collision data is missing or has unexpected dimensions.');
  }
  const collisionRows = collisionData.runs;
  const collisionDebugCanvas = document.createElement('canvas');
  const collisionDebugContext = collisionDebugCanvas.getContext('2d');
  collisionDebugCanvas.width = collisionData.width;
  collisionDebugCanvas.height = collisionData.height;
  collisionDebugContext.fillStyle = '#00e195';
  collisionRows.forEach((runs, y) => {
    for (const [start, end] of runs) collisionDebugContext.fillRect(start, y, end - start, 1);
  });

  const roppongiCrossing = mapLayout.intersections.find(item => item.id === 'roppongi-crossing');
  const player = {
    x: roppongiCrossing.point[0] * maskScale,
    y: roppongiCrossing.point[1] * maskScale,
    footRadius: 6,
    speed: 190,
    step: 0,
    facing: 'down'
  };
  const landmarks = mapLayout.landmarks.map(definition => {
    return {
      id: definition.id,
      name: definition.name,
      imageName: definition.image,
      x: definition.anchor[0] * maskScale,
      y: definition.anchor[1] * maskScale,
      width: definition.sprite.width * maskScale,
      height: definition.sprite.height * maskScale,
      depthY: definition.depthY * maskScale,
      shadowLength: definition.shadow.length * maskScale,
      shadowWidth: definition.shadow.width
    };
  });
  const mapLabels = mapLayout.labels.map(label => ({
    ...label,
    x: label.point[0] * maskScale,
    y: label.point[1] * maskScale
  }));
  const landmarksById = new Map(landmarks.map(landmark => [landmark.id, landmark]));
  const camera = { x: 0, y: 0, zoom: 1 };
  const keys = new Set();
  const mapDrag = { active: false, pointerId: null, start: { x: 0, y: 0 }, movement: { x: 0, y: 0, strength: 0 } };
  const restartRequest = consumePastRestart(location.search, localStorage);
  if (restartRequest.restarted) {
    history.replaceState(null, '', `${location.pathname}${restartRequest.search}${location.hash}`);
  }
  let pastEnemies = createPastEnemies(maskScale);
  let sideDungeonEnemies = [];
  let dungeonWarmth = MAX_WARMTH;
  let lastDungeonTileKey = '';
  let dungeonSlideDirection = null;
  let terrainNotice = '';
  let terrainNoticeUntil = 0;
  let memoryStage = Number.parseInt(localStorage.getItem('roppongi-past-memory-stage') || '0', 10);
  if (!Number.isFinite(memoryStage)) memoryStage = 0;
  let activeBattle = null;
  let activeEncounter = null;
  let battleRedrawSelecting = false;
  let battleRedrawIndices = new Set();
  let battleEffectTimer = 0;
  let watchtowerEffectTimer = 0;
  let watchtowerEffectActive = false;
  let encounterTransitioning = false;
  let encounterGraceUntil = 0;
  let encounterSafeCenter = null;
  let ready = false;
  let currentEdition = normalizeEdition(restartRequest.edition);
  let storyPanelVisible = localStorage.getItem('roppongi-past-story-panel') !== 'hidden';
  let storyState = loadPastStory();
  let campaignState = loadPastCampaign();
  if (restartRequest.inherited) {
    storyState = createPastStory({ gold: storyState.gold });
    campaignState = restartCampaignKeepingGrowth(campaignState);
    savePastStory();
    savePastCampaign();
  }
  if (isSideQuestArea(storyState.area)) {
    sideDungeonEnemies = createSideDungeonEnemies(storyState.area);
  }
  pastEnemies = pastEnemies.map(enemy => campaignState.defeatedRoadEnemies.includes(enemy.id)
    ? { ...enemy, active: false, respawnAt: performance.now() + 300000 }
    : enemy);
  let activeStoryDialogue = null;
  let storyDialogueIndex = 0;
  let activeTypewriterLine = null;
  let dialogueTypeTimer = 0;
  let activeInteraction = null;
  let activeServiceId = null;
  let activeServiceArea = null;
  let activeServiceMode = 'buy';
  let pendingSaleProductId = null;
  let serviceEntryPosition = null;
  let restTransitioning = false;
  let activeLocationKey = 'modern-overworld';
  const locationPositions = new Map([
    ['modern-overworld', [roppongiCrossing.point[0] * maskScale, roppongiCrossing.point[1] * maskScale]],
    ['past-overworld', [PAST_START.point[0] * maskScale, PAST_START.point[1] * maskScale]],
    ['past-castle-town', [...PAST_AREAS['castle-town'].spawn]],
    ['past-castle', [...PAST_AREAS.castle.spawn]],
    ['past-crossroads-town', [...PAST_AREAS['crossroads-town'].spawn]],
    ['past-crossroads-dungeon', [...PAST_AREAS['crossroads-dungeon'].spawn]],
    ['past-mist-citadel', [...PAST_AREAS['mist-citadel'].spawn]],
    ['past-mist-bell-tower', [...PAST_AREAS['mist-bell-tower'].spawn]],
    ...SIDE_QUESTS.map(quest => [`past-${quest.dungeonId}`, [...PAST_AREAS[quest.dungeonId].spawn]])
  ]);
  let showCollision = false;
  let assetLoadGeneration = 0;
  const backgroundAssetRequests = new Set();
  let last = performance.now();

  const enemyAssetDefinitions = [
    ['mist-slime', 'mist-slime.png'],
    ['gutter-goblin', 'gutter-goblin.png'],
    ['rune-wolf', 'rune-wolf.png'],
    ['bog-mandrake', 'bog-mandrake.png'],
    ['crag-harpy', 'crag-harpy.png'],
    ['frost-wisp', 'frost-wisp.png'],
    ['dune-scorpion', 'dune-scorpion.png'],
    ['ember-lizard', 'ember-lizard.png'],
    ['ash-golem', 'ash-golem.png'],
    ['mist-watcher', 'rune-wolf.png'],
    ['crossroads-sentinel', 'crossroads-sentinel.png'],
    ['veil-moth', 'frost-wisp.png'],
    ['fog-knight', 'gutter-goblin.png'],
    ['bell-wraith', 'mist-slime.png'],
    ['mist-bell-warden', 'crossroads-sentinel.png'],
    ['miasma-slime', 'mist-slime.png'],
    ['marsh-leech', 'bog-mandrake.png'],
    ['spore-mandrake', 'bog-mandrake.png'],
    ['miasma-root', 'bog-mandrake.png'],
    ['ice-wisp', 'frost-wisp.png'],
    ['snow-wolf', 'rune-wolf.png'],
    ['frost-beetle', 'ash-golem.png'],
    ['glacier-beast', 'rune-wolf.png'],
    ['lava-lizard', 'ember-lizard.png'],
    ['ash-bat', 'crag-harpy.png'],
    ['obsidian-golem', 'ash-golem.png'],
    ['fire-rat-chief', 'gutter-goblin.png'],
    ['crown-drake', 'ember-lizard.png']
  ];
  const overworldEventAssetIds = Object.freeze([
    'capital-gate', 'old-watchtower', 'magic-tutor', 'card-chest-frost', 'card-chest-mend'
  ]);
  for (const editionId of editionIds) {
    const images = new Map();
    for (const landmark of landmarks) {
      const key = landmarkAssetKey(editionId, landmark.id);
      const image = assetLoader.register(key, `${editionLandmarkImage(editionId, landmark.imageName)}?edition=1`);
      images.set(landmark.id, image);
    }
    editionLandmarkImages.set(editionId, images);
  }
  for (const [enemyId, filename] of enemyAssetDefinitions) {
    const image = assetLoader.register(enemyAssetKey(enemyId), `assets/v2/past-enemies/${filename}?battle=1`);
    pastEnemyImages.set(enemyId, image);
  }
  for (const [assetId, definition] of Object.entries(PAST_SCENE_ASSETS)) {
    const image = assetLoader.register(sceneAssetKey(assetId), `${definition.path}?scene=1`);
    pastSceneImages.set(assetId, image);
  }
  for (const [spriteId, path] of Object.entries(NPC_SPRITE_ASSETS)) {
    const image = assetLoader.register(npcAssetKey(spriteId), `${path}?scene=1`);
    pastNpcImages.set(spriteId, image);
  }
  for (const [eventId, definition] of Object.entries(PAST_EVENT_ASSETS)) {
    const image = assetLoader.register(eventAssetKey(eventId), `${definition.path}?event=2`);
    pastEventImages.set(eventId, image);
  }

  function imageIsLoaded(image) {
    return Boolean(image?.complete && image.naturalWidth);
  }

  function requiredAssetsForActiveLocation() {
    const playerAssets = facingNames.map(facing => spriteAssetKey(currentEdition, facing));
    if (currentEdition !== 'past') {
      const tile = tileCoordinateForPoint(player.x, player.y, tileW, tileH, tileCols, tileRows);
      return [tileAssetKey(currentEdition, tile.col, tile.row), ...playerAssets];
    }
    if (activeAreaId() === 'overworld') {
      const tile = tileCoordinateForPoint(player.x, player.y, tileW, tileH, tileCols, tileRows);
      return [
        tileAssetKey(currentEdition, tile.col, tile.row),
        ...playerAssets,
        ...overworldEventAssetIds.map(eventAssetKey)
      ];
    }
    if (activeAreaId() === 'castle-town') {
      return [
        ...playerAssets,
        sceneAssetKey('castle-town-ground'),
        sceneAssetKey('castle-town-buildings'),
        ...new Set([...TOWN_NPCS, ...BROTHER_NPCS.filter(npc => npc.area === 'castle-town' && storyNpcIsAvailable(storyState, npc))].map(npc => npcAssetKey(npc.sprite)))
      ];
    }
    if (activeAreaId() === 'crossroads-town') {
      return [
        ...playerAssets,
        sceneAssetKey('crossroads-town'),
        ...new Set([...CROSSROADS_NPCS, ...BROTHER_NPCS.filter(npc => npc.area === 'crossroads-town' && storyNpcIsAvailable(storyState, npc))].map(npc => npcAssetKey(npc.sprite)))
      ];
    }
    if (activeAreaId() === 'crossroads-dungeon') {
      return [
        ...playerAssets,
        eventAssetKey('card-chest-frost'),
        eventAssetKey('card-chest-mend'),
        eventAssetKey('watergate-closed'),
        eventAssetKey('watergate-open'),
        eventAssetKey('compass-altar-corrupted'),
        eventAssetKey('compass-altar-restored')
      ];
    }
    if (activeAreaId() === 'mist-citadel') {
      return [
        ...playerAssets,
        sceneAssetKey('mist-citadel'),
        ...new Set([...MIST_CITADEL_NPCS, ...BROTHER_NPCS.filter(npc => npc.area === 'mist-citadel' && storyNpcIsAvailable(storyState, npc))].map(npc => npcAssetKey(npc.sprite)))
      ];
    }
    if (activeAreaId() === 'mist-bell-tower') {
      return [
        ...playerAssets,
        ...(!storyState.brotherRescueSeen ? [npcAssetKey('younger-brother')] : []),
        eventAssetKey('card-chest-frost'),
        eventAssetKey('card-chest-mend')
      ];
    }
    if (isSideQuestArea(activeAreaId())) {
      const enemyKeys = SIDE_DUNGEON_ENCOUNTERS
        .filter(encounter => encounter.dungeonId === activeAreaId())
        .map(encounter => enemyAssetKey(encounter.enemyId));
      return [...playerAssets, ...new Set(enemyKeys)];
    }
    return [
      ...playerAssets,
      sceneAssetKey('castle-interior'),
      ...new Set(CASTLE_NPCS.map(npc => npcAssetKey(npc.sprite)))
    ];
  }

  function loadAssetsInBackground(keys) {
    const pendingKeys = [...new Set(keys)].filter(key => !backgroundAssetRequests.has(key));
    if (!pendingKeys.length) return;
    pendingKeys.forEach(key => backgroundAssetRequests.add(key));
    assetLoader.loadMany(pendingKeys).catch(error => console.error(error));
  }

  async function prepareActiveLocation() {
    const generation = ++assetLoadGeneration;
    ready = false;
    loading.textContent = activeAreaId() === 'overworld' ? 'MAP LOADING…' : 'AREA LOADING…';
    loading.classList.remove('hidden');
    try {
      await assetLoader.loadMany(requiredAssetsForActiveLocation());
      if (generation !== assetLoadGeneration) return;
      ready = true;
      loading.classList.add('hidden');
      ensureOverworldAssets();
      if (currentEdition === 'past' && !storyState.arrivalSeen) {
        openStoryDialogue(STORY_DIALOGUES.arrival);
      } else if (currentEdition === 'past'
        && storyState.area === 'castle-town'
        && !storyState.capitalArrivalSeen
        && !activeStoryDialogue) {
        openStoryDialogue(STORY_DIALOGUES[storyState.tutorialRescueSeen ? 'capital-rescue' : 'capital-arrival']);
      }
    } catch (error) {
      if (generation !== assetLoadGeneration) return;
      console.error(error);
      loading.textContent = 'ASSET LOAD ERROR';
    }
  }

  function setEdition(value, updateUrl = true) {
    locationPositions.set(activeLocationKey, [player.x, player.y]);
    currentEdition = normalizeEdition(value);
    activeLocationKey = locationKey(currentEdition, storyState.area);
    const savedPosition = locationPositions.get(activeLocationKey) || locationSpawn(currentEdition, storyState.area);
    player.x = savedPosition[0];
    player.y = savedPosition[1];
    centerCameraOnPlayer();
    const definition = editionDefinition(currentEdition);
    shell.dataset.theme = definition.uiTheme;
    if (currentEdition !== 'past' && activeBattle) closeBattle('fled');
    if (currentEdition !== 'past') closeStoryDialogue(false);
    if (currentEdition !== 'past') closeService();
    updateMemoryLabels();
    updateStoryStatus();
    setStoryPanelVisible(storyPanelVisible, false);
    updateInteractionPrompt(null);
    document.querySelectorAll('[data-edition]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.edition === currentEdition));
    });
    if (updateUrl) history.replaceState(null, '', `?edition=${currentEdition}`);
    prepareActiveLocation();
  }

  function setSettingsOpen(value) {
    const open = Boolean(value);
    settingsPanel.setAttribute('aria-hidden', String(!open));
    settingsToggle.setAttribute('aria-expanded', String(open));
    settingsToggle.setAttribute('aria-label', open ? '設定を閉じる' : '設定を開く');
    if (open) resetMapDrag();
  }

  function setStoryPanelVisible(value, persist = true) {
    storyPanelVisible = Boolean(value);
    if (persist) {
      localStorage.setItem('roppongi-past-story-panel', storyPanelVisible ? 'visible' : 'hidden');
    }
    const visible = currentEdition === 'past' && storyPanelVisible;
    storyStatus.classList.toggle('is-collapsed', !visible);
    storyStatus.setAttribute('aria-hidden', String(!visible));
    infoToggle.hidden = currentEdition !== 'past';
    infoToggle.setAttribute('aria-expanded', String(visible));
    infoToggle.setAttribute('aria-label', visible ? '情報パネルを隠す' : '情報パネルを表示');
  }

  function loadPastStory() {
    try {
      const saved = JSON.parse(localStorage.getItem('roppongi-past-story') || '{}');
      return createPastStory(saved);
    } catch {
      return createPastStory();
    }
  }

  function savePastStory() {
    localStorage.setItem('roppongi-past-story', JSON.stringify(storyState));
  }

  function loadPastCampaign() {
    try {
      const saved = JSON.parse(localStorage.getItem('roppongi-past-campaign') || '{}');
      return createPastCampaign(saved);
    } catch {
      return createPastCampaign();
    }
  }

  function savePastCampaign() {
    localStorage.setItem('roppongi-past-campaign', JSON.stringify(campaignState));
  }

  function locationKey(edition, area) {
    return edition === 'past' ? `past-${area}` : 'modern-overworld';
  }

  function locationSpawn(edition, area) {
    if (edition !== 'past') return [roppongiCrossing.point[0] * maskScale, roppongiCrossing.point[1] * maskScale];
    const spawn = PAST_AREAS[area]?.spawn || PAST_START.point;
    return area === 'overworld' ? [spawn[0] * maskScale, spawn[1] * maskScale] : [...spawn];
  }

  function activeAreaId() {
    return currentEdition === 'past' ? storyState.area : 'overworld';
  }

  function updateQuestCompass() {
    const target = currentEdition === 'past'
      ? mainQuestCompassTarget(storyState, campaignState)
      : null;
    if (!target || target.area !== activeAreaId()) {
      questCompass.hidden = true;
      questCompass.removeAttribute('data-proximity');
      return;
    }

    const coordinateScale = activeAreaId() === 'overworld' ? maskScale : 1;
    const reading = questCompassBearing(player, target.point, coordinateScale);
    if (!reading) {
      questCompass.hidden = true;
      return;
    }

    const mapDistance = reading.distance / coordinateScale;
    const arrivalRadius = Math.max(48, Number(target.radius) || 0);
    const proximity = mapDistance <= arrivalRadius
      ? { id: 'near', label: '目的地付近' }
      : mapDistance < 180
        ? { id: 'soon', label: 'もうすぐ' }
        : mapDistance < 420
          ? { id: 'ahead', label: 'この先' }
          : { id: 'far', label: '遠方' };

    questCompass.hidden = false;
    questCompass.dataset.proximity = proximity.id;
    questCompass.dataset.bearing = String(Math.round(reading.bearing));
    questCompassNeedle.style.transform = `rotate(${reading.bearing.toFixed(2)}deg)`;
    if (questCompassTarget.textContent !== target.label) questCompassTarget.textContent = target.label;
    if (questCompassDistance.textContent !== proximity.label) questCompassDistance.textContent = proximity.label;
    const accessibleLabel = `メインクエストの羅針盤。${target.label}は${proximity.label}。`;
    if (questCompass.getAttribute('aria-label') !== accessibleLabel) questCompass.setAttribute('aria-label', accessibleLabel);
  }

  function activeWorldSize() {
    const area = PAST_AREAS[activeAreaId()];
    return activeAreaId() === 'overworld' ? world : { w: area.width, h: area.height };
  }

  function centerCameraOnPlayer() {
    const activeWorld = activeWorldSize();
    const viewW = innerWidth / camera.zoom;
    const viewH = innerHeight / camera.zoom;
    camera.x = Math.max(0, Math.min(Math.max(0, activeWorld.w - viewW), player.x - viewW / 2));
    camera.y = Math.max(0, Math.min(Math.max(0, activeWorld.h - viewH), player.y - viewH / 2));
  }

  function updateStoryStatus() {
    const area = PAST_AREAS[storyState.area] || PAST_AREAS.overworld;
    const profile = battleProfile(campaignState);
    storyArea.textContent = area.name;
    storyGold.textContent = `${storyState.gold.toLocaleString('ja-JP')} G`;
    storyLevel.textContent = `Lv ${campaignState.level}`;
    storyHp.textContent = `HP ${campaignState.currentHp} / ${profile.maxHp}`;
    storyMp.textContent = `MP ${campaignState.currentMp} / ${profile.maxMp}`;
    storyEnergy.textContent = `AP ${profile.energy}`;
    const remainingExp = experienceToNextLevel(campaignState);
    storyExp.textContent = remainingExp === null
      ? `EXP ${campaignState.exp} / MAX`
      : `EXP ${campaignState.exp} / 次まで ${remainingExp}`;
    const sideQuest = sideQuestForArea(storyState.area);
    const baseObjective = sideQuest
      ? sideQuestObjective(campaignState.sideQuests, storyState.area)
      : storyState.phase === 'first-mission'
        ? campaignObjective(campaignState)
        : storyObjective(storyState);
    const warmth = storyState.area === 'ice-lantern-cavern' ? `　ぬくもり ${dungeonWarmth}/${MAX_WARMTH}` : '';
    const notice = terrainNotice && performance.now() < terrainNoticeUntil ? `${terrainNotice}　` : '';
    storyObjectiveLabel.textContent = `${notice}${baseObjective}${warmth}`;
    storyStatus.dataset.phase = storyState.phase;
    storyStatus.dataset.level = String(campaignState.level);
    storyStatus.dataset.energy = String(profile.energy);
    storyStatus.dataset.roadVictories = String(campaignState.roadVictories);
    storyStatus.dataset.bossDefeated = String(campaignState.bossDefeated);
    updateQuestDebugControls();
  }

  function updateQuestDebugControls() {
    questDebug.hidden = currentEdition !== 'past';
    document.querySelectorAll('[data-debug-quest]').forEach(button => {
      const completionFlags = {
        watchtower: campaignState.bossDefeated,
        crossroads: campaignState.crossroadsBossDefeated,
        'mist-citadel': campaignState.mistBossDefeated,
        ...Object.fromEntries(SIDE_QUESTS.map(quest => [quest.id, campaignState.sideQuests.completedQuestIds.includes(quest.id)]))
      };
      const completed = Boolean(completionFlags[button.dataset.debugQuest]);
      button.setAttribute('aria-pressed', String(completed));
      button.textContent = completed ? 'クリア済み' : '未クリア';
    });
  }

  function toggleDebugQuest(questId) {
    const completionFlags = {
      watchtower: campaignState.bossDefeated,
      crossroads: campaignState.crossroadsBossDefeated,
      'mist-citadel': campaignState.mistBossDefeated,
      ...Object.fromEntries(SIDE_QUESTS.map(quest => [quest.id, campaignState.sideQuests.completedQuestIds.includes(quest.id)]))
    };
    const completed = Boolean(completionFlags[questId]);
    if (SIDE_QUESTS.some(quest => quest.id === questId)) {
      campaignState = createPastCampaign(setSideQuestDebugCompletion(campaignState, questId, !completed));
    } else {
      const result = setDebugQuestCompletion(storyState, campaignState, questId, !completed);
      storyState = createPastStory(result.story);
      campaignState = createPastCampaign(result.campaign);
    }
    pastEnemies = respawnPastEnemies(pastEnemies);
    savePastStory();
    savePastCampaign();
    updateStoryStatus();
    updateInteractionPrompt(null);
    prepareActiveLocation();
    const questNames = {
      watchtower: '古い見張り台', crossroads: '四門水路', 'mist-citadel': '霧の城塞都市',
      ...Object.fromEntries(SIDE_QUESTS.map(quest => [quest.id, quest.title]))
    };
    const questName = questNames[questId] || questId;
    questDebugStatus.textContent = `${questName}を${!completed ? 'クリア済み' : '未クリア'}へ変更しました。`;
  }

  function updateMemoryLabels() {
    const sites = {
      midtown: {
        unlocked: memoryStage >= 1,
        title: '蒼月の魔導学院',
        detail: '星読みの塔 / 月光書庫'
      },
      azabudai: {
        unlocked: memoryStage >= 2,
        title: '麻布の魔導宮殿',
        detail: '王宮尖塔 / 精霊庭園'
      }
    };
    for (const [siteId, site] of Object.entries(sites)) {
      const item = document.querySelector(`[data-memory-site="${siteId}"]`);
      if (!item) continue;
      item.classList.toggle('unlocked', site.unlocked);
      item.querySelector('[data-site-title]').textContent = site.unlocked ? site.title : '霧に閉ざされた地';
      item.querySelector('[data-site-detail]').textContent = site.unlocked ? site.detail : '強い魔力に阻まれている';
    }
  }

  function completeMemoryEvent(eventId) {
    const nextStage = nextMemoryStage(memoryStage, eventId);
    if (nextStage === memoryStage) return false;
    memoryStage = nextStage;
    localStorage.setItem('roppongi-past-memory-stage', String(memoryStage));
    updateMemoryLabels();
    return true;
  }

  function commitStoryEvent(eventId) {
    const nextState = completeStoryEvent(storyState, eventId);
    if (nextState === storyState) return false;
    storyState = nextState;
    savePastStory();
    updateStoryStatus();
    return true;
  }

  function renderStoryVisual(visualId) {
    const visual = PAST_STORY_VISUALS[visualId];
    storyVisual.hidden = !visual;
    storyVisual.dataset.visual = visualId || '';
    storyVisual.classList.toggle('is-crest-discovery', visualId === 'watchtower-crest');
    if (!visual) {
      storyVisualScene.removeAttribute('src');
      storyVisualEvent.removeAttribute('src');
      storyVisualCrest.removeAttribute('src');
      storyVisualObject.hidden = true;
      storyVisualCrest.hidden = true;
      return;
    }
    const scene = PAST_SCENE_ASSETS[visual.sceneId];
    storyVisualScene.src = `${scene.path}?story=1`;
    storyVisualObject.hidden = !visual.eventId;
    if (visual.eventId) storyVisualEvent.src = `${PAST_EVENT_ASSETS[visual.eventId].path}?story=1`;
    else storyVisualEvent.removeAttribute('src');
    storyVisualCrest.hidden = !visual.crestId;
    if (visual.crestId) storyVisualCrest.src = `${PAST_EVENT_ASSETS[visual.crestId].path}?story=1`;
    else storyVisualCrest.removeAttribute('src');
    if (visual.npcId) {
      storyVisualObject.hidden = false;
      storyVisualEvent.src = `${NPC_SPRITE_ASSETS[visual.npcId]}?story=1`;
    }
  }

  function playWatchtowerEffect(kind) {
    if (watchtowerEffectActive) return Promise.resolve();
    watchtowerEffectActive = true;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? 20 : kind === 'mist-clearing' ? 1200 : 900;
    watchtowerEffect.className = `v2-watchtower-effect is-${kind}`;
    watchtowerEffect.querySelector('strong').textContent = kind === 'mist-clearing'
      ? '紫の霧が晴れていく'
      : '見張り台の封印が解ける';
    watchtowerEffect.setAttribute('aria-hidden', 'false');
    void watchtowerEffect.offsetWidth;
    watchtowerEffect.classList.add('is-active');
    return new Promise(resolve => {
      watchtowerEffectTimer = window.setTimeout(() => {
        watchtowerEffect.className = 'v2-watchtower-effect';
        watchtowerEffect.setAttribute('aria-hidden', 'true');
        watchtowerEffectTimer = 0;
        watchtowerEffectActive = false;
        resolve();
      }, duration);
    });
  }

  function openStoryDialogue(dialogue) {
    if (!dialogue || currentEdition !== 'past') return;
    activeStoryDialogue = dialogue;
    storyDialogueIndex = 0;
    keys.clear();
    resetMapDrag();
    updateInteractionPrompt(null);
    dialogueOverlay.setAttribute('aria-hidden', 'false');
    renderStoryDialogue();
  }

  function stopDialogueTyping() {
    if (dialogueTypeTimer) window.clearTimeout(dialogueTypeTimer);
    dialogueTypeTimer = 0;
  }

  function paintTypewriterLine() {
    dialogueText.textContent = activeTypewriterLine ? typewriterText(activeTypewriterLine) : '';
    const finalLine = storyDialogueIndex === activeStoryDialogue.lines.length - 1;
    dialogueNext.textContent = activeTypewriterLine?.complete ? (finalLine ? '閉じる' : '次へ') : '一行表示';
  }

  function scheduleDialogueCharacter() {
    stopDialogueTyping();
    if (!activeStoryDialogue || activeTypewriterLine?.complete) return;
    dialogueTypeTimer = window.setTimeout(() => {
      activeTypewriterLine = tickTypewriterLine(activeTypewriterLine);
      paintTypewriterLine();
      scheduleDialogueCharacter();
    }, 34);
  }

  function renderStoryDialogue() {
    if (!activeStoryDialogue) return;
    const line = activeStoryDialogue.lines[storyDialogueIndex];
    renderStoryVisual(line.visualId);
    dialogueSpeaker.textContent = line.speaker;
    activeTypewriterLine = createTypewriterLine(line.text);
    paintTypewriterLine();
    scheduleDialogueCharacter();
  }

  function advanceStoryDialogue() {
    if (!activeStoryDialogue) return;
    if (!activeTypewriterLine.complete) {
      stopDialogueTyping();
      activeTypewriterLine = revealTypewriterLine(activeTypewriterLine);
      paintTypewriterLine();
      return;
    }
    if (storyDialogueIndex < activeStoryDialogue.lines.length - 1) {
      storyDialogueIndex++;
      renderStoryDialogue();
      return;
    }
    closeStoryDialogue(true);
  }

  function closeStoryDialogue(complete = true) {
    if (!activeStoryDialogue) return;
    stopDialogueTyping();
    const eventId = activeStoryDialogue.onComplete;
    activeStoryDialogue = null;
    activeTypewriterLine = null;
    storyDialogueIndex = 0;
    dialogueOverlay.setAttribute('aria-hidden', 'true');
    renderStoryVisual(null);
    if (complete && eventId?.startsWith('sidequest-boss-awaken:')) {
      const questId = eventId.split(':')[1];
      const quest = SIDE_QUESTS.find(candidate => candidate.id === questId);
      if (quest) openBattle({ id: quest.bossEncounterId, enemyId: quest.bossEnemyId, boss: true, altarAwakening: true, sideQuestId: quest.id });
    } else if (complete && eventId === 'sidequest-midboss-awaken:fire-rat-chief') {
      openBattle({ id: 'sidequest-fire-rat-chief', enemyId: 'fire-rat-chief', boss: true, altarAwakening: true, sideQuestId: 'molten-crown' });
    } else if (complete && eventId === 'crossroads-altar-awaken') {
      openBattle({ id: 'crossroads-boss', enemyId: 'crossroads-sentinel', boss: true, altarAwakening: true });
    } else if (complete && eventId === 'mist-bell-awaken') {
      openBattle({ id: 'mist-bell-boss', enemyId: 'mist-bell-warden', boss: true, altarAwakening: true });
    } else if (complete && eventId === 'watchtower-seal-release') {
      playWatchtowerEffect('seal-release').then(() => {
        openBattle({ id: 'watchtower-boss', enemyId: 'mist-watcher', boss: true });
      });
    } else if (complete && eventId === 'mist-boss-defeated') {
      commitStoryEvent(eventId);
      completeMemoryEvent('midtown-memory-restored');
    } else if (complete && eventId === 'watchtower-return-to-king') {
      transitionStoryArea({ state: { ...storyState, area: 'castle' }, spawn: [500, 430] });
    } else if (complete && eventId) commitStoryEvent(eventId);
  }

  function serviceTitle(serviceId) {
    if (serviceId === 'bag') return 'もちもの・装備';
    const buildings = activeServiceArea === 'crossroads-town'
      ? CROSSROADS_BUILDINGS
      : activeServiceArea === 'mist-citadel'
        ? MIST_BUILDINGS
        : TOWN_BUILDINGS;
    return buildings.find(building => building.type === serviceId)?.label || '街の店';
  }

  function itemOwnedLabel(product) {
    if (product.type === 'weapon' && campaignState.equipment.weapon === product.id) return '装備中';
    if (product.type === 'armor' && campaignState.equipment.armor === product.id) return '装備中';
    if ((product.type === 'weapon' || product.type === 'armor') && campaignState.ownedEquipment.includes(product.id)) return '所持済み';
    if (product.type === 'card' && campaignState.ownedCards.includes(product.id)) return '所持済み';
    if (product.type === 'item') return `所持 ${campaignState.inventory[product.id] || 0}`;
    return '';
  }

  function createServiceButton({ name, detail, price = null, badge = '', equipped = false, disabled = false, onClick }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v2-shop-item';
    button.classList.toggle('is-equipped', equipped);
    button.disabled = disabled;
    const title = document.createElement('strong');
    title.textContent = name;
    if (badge) {
      const marker = document.createElement('em');
      marker.textContent = badge;
      title.append(marker);
    }
    const cost = document.createElement('b');
    cost.textContent = price === null ? '' : `${price} G`;
    const description = document.createElement('small');
    description.textContent = detail;
    button.append(title, cost, description);
    if (onClick) button.addEventListener('click', onClick);
    return button;
  }

  function closeSaleConfirmation() {
    pendingSaleProductId = null;
    shopConfirm.hidden = true;
  }

  function requestSaleConfirmation(product) {
    const equipped = campaignState.equipment[product.type] === product.id;
    pendingSaleProductId = product.id;
    shopConfirmMessage.textContent = equipped
      ? `${product.name}は装備中です。${salePrice(product.id)}Gで売りますか？ 売却後は手持ちの装備へ自動で持ち替えます。`
      : `${product.name}を${salePrice(product.id)}Gで売りますか？`;
    shopConfirm.hidden = false;
    shopConfirmCancel.focus();
  }

  function confirmPendingSale() {
    if (!pendingSaleProductId) return;
    const result = sellProduct(campaignState, storyState.gold, pendingSaleProductId);
    campaignState = result.state;
    storyState = { ...storyState, gold: result.gold };
    if (result.ok) {
      savePastCampaign();
      savePastStory();
    }
    closeSaleConfirmation();
    shopMessage.textContent = result.message;
    updateStoryStatus();
    renderService();
  }

  function renderService() {
    if (!activeServiceId) return;
    shopTitle.textContent = serviceTitle(activeServiceId);
    shopGold.textContent = `${storyState.gold.toLocaleString('ja-JP')} G`;
    const supportsTrading = ['weapon', 'armor', 'item', 'card'].includes(activeServiceId);
    shopTabs.hidden = !supportsTrading;
    shopBuy.setAttribute('aria-selected', String(activeServiceMode === 'buy'));
    shopSell.setAttribute('aria-selected', String(activeServiceMode === 'sell'));
    shopSell.disabled = false;
    const entries = [];
    if (activeServiceId === 'bag') {
      const weapon = campaignProducts.get(campaignState.equipment.weapon)?.name || 'なし';
      const armor = campaignProducts.get(campaignState.equipment.armor)?.name || 'なし';
      const profile = battleProfile(campaignState);
      entries.push(createServiceButton({
        name: `装備　${weapon} / ${armor}`,
        detail: `攻撃＋${profile.attackBonus}　守備＋${profile.defenseBonus}　行動力${profile.energy}`,
        disabled: true
      }));
      const equipmentProducts = campaignState.ownedEquipment
        .map(productId => campaignProducts.get(productId))
        .filter(product => ['weapon', 'armor'].includes(product?.type));
      for (const product of equipmentProducts) {
        const equipped = campaignState.equipment[product.type] === product.id;
        entries.push(createServiceButton({
          name: `${product.type === 'weapon' ? '武器' : '防具'}　${product.name}`,
          detail: `${product.description}　${equipped ? '現在装備中' : 'タップして装備する'}`,
          badge: equipped ? '装備中' : '装備する',
          equipped,
          disabled: equipped,
          onClick: () => {
            const result = equipProduct(campaignState, product.id);
            campaignState = result.state;
            if (result.ok) savePastCampaign();
            shopMessage.textContent = result.message;
            updateStoryStatus();
            renderService();
          }
        }));
      }
      for (const keyItemId of campaignState.sideQuests.keyItems) {
        const keyItem = SIDE_QUEST_KEY_ITEMS[keyItemId];
        if (!keyItem) continue;
        entries.push(createServiceButton({
          name: `重要品　${keyItem.name}`,
          detail: keyItem.description,
          badge: '売れない',
          disabled: true
        }));
      }
      const deckNames = profile.deck.map(cardId => CARD_LIBRARY[cardId]?.name).filter(Boolean);
      entries.push(createServiceButton({
        name: `カード　${deckNames.length}枚 / ${new Set(profile.deck).size}種類`,
        detail: deckNames.join('・'),
        disabled: true
      }));
      for (const item of SHOP_CATALOG.item) {
        const full = item.heal
          ? campaignState.currentHp >= profile.maxHp
          : campaignState.currentMp >= profile.maxMp;
        entries.push(createServiceButton({
          name: item.name,
          detail: `${item.description}　所持 ${campaignState.inventory[item.id]}`,
          badge: full ? `${item.heal ? 'HP' : 'MP'}満タン` : '',
          disabled: campaignState.inventory[item.id] <= 0,
          onClick: () => {
            const result = useItem(campaignState, item.id);
            campaignState = result.state;
            if (result.ok) savePastCampaign();
            shopMessage.textContent = result.message;
            updateStoryStatus();
            renderService();
          }
        }));
      }
    } else if (activeServiceId === 'inn') {
      const profile = battleProfile(campaignState);
      const inn = INN_DEFINITIONS[activeServiceArea] || INN_DEFINITIONS['castle-town'];
      entries.push(createServiceButton({
        name: inn.price ? `${inn.price}Gで一晩泊まる` : '無料で一晩泊まる',
        detail: `HPとMPを全回復　HP ${campaignState.currentHp}/${profile.maxHp}・MP ${campaignState.currentMp}/${profile.maxMp}`,
        disabled: storyState.gold < inn.price || restTransitioning,
        onClick: async () => {
          if (restTransitioning) return;
          const result = restAtInn(campaignState, storyState.gold, activeServiceArea);
          campaignState = result.state;
          storyState = { ...storyState, gold: result.gold };
          if (result.ok) {
            savePastCampaign();
            savePastStory();
          }
          shopMessage.textContent = result.message;
          updateStoryStatus();
          if (result.ok) await playInnRestTransition();
          else renderService();
        }
      }));
    } else if (activeServiceMode === 'sell') {
      const products = productsOwnedForSale(campaignState);
      if (!products.length) {
        entries.push(createServiceButton({ name: '売れる品を持っていない', detail: 'どの店でも、武器・防具・道具を買値の半額で一つずつ買い取ります。', disabled: true }));
      }
      for (const product of products) {
        const equipped = campaignState.equipment[product.type] === product.id;
        entries.push(createServiceButton({
          name: product.name,
          detail: `${product.description}　${itemOwnedLabel(product)}`,
          price: salePrice(product.id),
          badge: equipped ? '装備中' : '',
          equipped,
          onClick: () => requestSaleConfirmation(product)
        }));
      }
    } else {
      for (const product of productsForShop(activeServiceArea, activeServiceId)) {
        const badge = itemOwnedLabel(product);
        const uniqueOwned = ['weapon', 'armor', 'card'].includes(product.type) && Boolean(badge);
        entries.push(createServiceButton({
          name: product.name,
          detail: product.description,
          price: product.price,
          badge,
          disabled: uniqueOwned,
          onClick: () => {
            const result = buyProduct(campaignState, storyState.gold, product.id);
            campaignState = result.state;
            storyState = { ...storyState, gold: result.gold };
            if (result.ok) {
              savePastCampaign();
              savePastStory();
            }
            shopMessage.textContent = result.message;
            updateStoryStatus();
            renderService();
          }
        }));
      }
    }
    shopList.replaceChildren(...entries);
  }

  function openService(serviceId) {
    if (currentEdition !== 'past' || activeBattle || activeStoryDialogue) return;
    closeSaleConfirmation();
    activeServiceId = serviceId;
    activeServiceArea = activeAreaId();
    activeServiceMode = 'buy';
    serviceEntryPosition = [player.x, player.y];
    keys.clear();
    resetMapDrag();
    updateInteractionPrompt(null);
    shopMessage.textContent = serviceId === 'bag' ? '道具を使うか、装備を確認できます。' : '何を買いますか？';
    if (serviceId === 'inn') {
      const price = INN_DEFINITIONS[activeServiceArea]?.price || 0;
      shopMessage.textContent = price ? `一泊${price}Gです。旅の疲れをすっかり癒やします。` : '新大陸へ来た旅人は無料です。旅の疲れをすっかり癒やします。';
    }
    renderService();
    shopOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeService() {
    closeSaleConfirmation();
    activeServiceId = null;
    activeServiceArea = null;
    serviceEntryPosition = null;
    activeServiceMode = 'buy';
    shopOverlay.setAttribute('aria-hidden', 'true');
  }

  function waitForTransition(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
  }

  async function playInnRestTransition() {
    if (restTransitioning) return;
    restTransitioning = true;
    const returnPosition = serviceEntryPosition ? [...serviceEntryPosition] : [player.x, player.y];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fadeInMs = reducedMotion ? 20 : 520;
    const nightMs = reducedMotion ? 20 : 340;
    const fadeOutMs = reducedMotion ? 20 : 500;
    restTransition.setAttribute('aria-hidden', 'false');
    void restTransition.offsetWidth;
    restTransition.classList.add('is-active');
    await waitForTransition(fadeInMs);
    closeService();
    player.x = returnPosition[0];
    player.y = returnPosition[1];
    player.facing = 'down';
    locationPositions.set(activeLocationKey, [player.x, player.y]);
    centerCameraOnPlayer();
    await waitForTransition(nightMs);
    restTransition.classList.remove('is-active');
    await waitForTransition(fadeOutMs);
    restTransition.setAttribute('aria-hidden', 'true');
    restTransitioning = false;
  }

  function updateInteractionPrompt(interaction) {
    activeInteraction = interaction;
    const coordinateScale = activeAreaId() === 'overworld' ? maskScale : 1;
    shell.dataset.area = activeAreaId();
    storyStatus.dataset.area = activeAreaId();
    storyStatus.dataset.playerX = (player.x / coordinateScale).toFixed(1);
    storyStatus.dataset.playerY = (player.y / coordinateScale).toFixed(1);
    const visible = currentEdition === 'past' && Boolean(interaction) && !activeStoryDialogue && !activeBattle && !activeServiceId;
    const touchLayout = window.matchMedia('(pointer: coarse), (max-width: 700px)').matches;
    interactionPrompt.textContent = visible ? `${touchLayout ? '' : 'E / Enter　'}${interaction.label}` : '';
    interactionPrompt.setAttribute('aria-hidden', String(!visible));
    interactionPrompt.disabled = !visible;
    interactionPrompt.tabIndex = visible ? 0 : -1;
  }

  function pastInteractionAvailable(interaction) {
    if (!storyUnlocksInteraction(storyState, interaction)) return false;
    if (interaction.actionId === 'sidequest-board') return campaignState.crossroadsBossDefeated;
    if (interaction.sideQuestId && interaction.id === SIDE_QUESTS.find(quest => quest.id === interaction.sideQuestId)?.entranceInteractionId) {
      return ['active', 'completed'].includes(sideQuestStatus(campaignState.sideQuests, interaction.sideQuestId, campaignState.crossroadsBossDefeated));
    }
    if (interaction.actionId?.startsWith('sidequest-boss:')) {
      return ['active', 'completed'].includes(sideQuestStatus(campaignState.sideQuests, interaction.sideQuestId, campaignState.crossroadsBossDefeated));
    }
    if (interaction.actionId === 'sidequest-midboss:fire-rat-chief') {
      return !campaignState.sideQuests.keyItems.includes('fire-rat-boots');
    }
    if (interaction.actionId?.startsWith('sidequest-sluice:')) {
      return campaignState.sideQuests.keyItems.includes('fire-rat-boots');
    }
    if (interaction.actionId === 'learn-first-magic') return true;
    if (interaction.cardId) return canDiscoverCard(campaignState, interaction.cardId);
    if (interaction.actionId?.startsWith('dungeon-treasure:')) {
      return !campaignState.openedDungeonChests.includes(interaction.actionId.split(':')[1]);
    }
    if (interaction.actionId === 'crossroads-boss') return true;
    return true;
  }

  function transitionStoryArea(result) {
    const previousArea = storyState.area;
    const enteringField = previousArea !== 'overworld' && result.state.area === 'overworld';
    locationPositions.set(activeLocationKey, [player.x, player.y]);
    storyState = result.state;
    if (enteringField) {
      encounterGraceUntil = performance.now() + FIELD_ENCOUNTER_GRACE_MS;
    }
    if (storyState.area !== previousArea && storyState.area !== 'overworld') {
      pastEnemies = respawnPastEnemies(pastEnemies);
    }
    if (isSideQuestArea(storyState.area)) {
      sideDungeonEnemies = createSideDungeonEnemies(storyState.area);
      dungeonWarmth = MAX_WARMTH;
      lastDungeonTileKey = '';
      dungeonSlideDirection = null;
      terrainNotice = '';
      encounterGraceUntil = performance.now() + FIELD_ENCOUNTER_GRACE_MS;
    } else if (isSideQuestArea(previousArea)) {
      sideDungeonEnemies = [];
      dungeonSlideDirection = null;
    }
    savePastStory();
    activeLocationKey = locationKey('past', storyState.area);
    const spawn = result.spawn || PAST_AREAS[storyState.area].spawn;
    const scale = storyState.area === 'overworld' ? maskScale : 1;
    const intendedSpawn = [spawn[0] * scale, spawn[1] * scale];
    const safeSpawn = storyState.area === 'overworld'
      ? nearestWalkablePoint(intendedSpawn, (x, y) => canStandAt(x, y))
      : intendedSpawn;
    encounterSafeCenter = enteringField ? [...safeSpawn] : null;
    if (isSideQuestArea(storyState.area)) encounterSafeCenter = [...safeSpawn];
    player.x = safeSpawn[0];
    player.y = safeSpawn[1];
    player.facing = storyState.area === 'castle' ? 'up' : 'down';
    locationPositions.set(activeLocationKey, [player.x, player.y]);
    centerCameraOnPlayer();
    keys.clear();
    updateStoryStatus();
    updateInteractionPrompt(null);
    prepareActiveLocation();
  }

  function performStoryInteraction() {
    if (currentEdition !== 'past' || !activeInteraction || activeStoryDialogue || activeBattle || activeServiceId || watchtowerEffectActive) return;
    const result = activatePastInteraction(storyState, activeInteraction.id);
    if (activeInteraction.id === 'mist-bell-tower-door' && result.dialogue) {
      const investigation = mistInvestigationResult(storyState);
      result.dialogue = {
        ...result.dialogue,
        lines: result.dialogue.id === 'mist-tower-entry' ? [
          result.dialogue.lines[0],
          {
            speaker: '地の文',
            text: `${investigation.approach}。${investigation.ally}が霧の外から道を示す。番人には${investigation.bossWeakness}の力が有効だろう。`
          },
          ...result.dialogue.lines.slice(1)
        ] : result.dialogue.lines
      };
    }
    if (result.state.area !== storyState.area) transitionStoryArea(result);
    if (result.dialogue) openStoryDialogue(result.dialogue);
    if (result.serviceId) openService(result.serviceId);
    if (result.actionId === 'watchtower') {
      campaignState = reachWatchtower(campaignState);
      savePastCampaign();
      updateStoryStatus();
      if (campaignState.bossDefeated) {
        openStoryDialogue(STORY_DIALOGUES['watchtower-cleared']);
      } else if (canChallengeWatchtower(campaignState)) {
        openStoryDialogue(STORY_DIALOGUES['watchtower-seal-release']);
      } else {
        openStoryDialogue(STORY_DIALOGUES['watchtower-locked']);
      }
    }
    if (result.actionId === 'learn-first-magic') {
      if (campaignState.ownedCards.includes('spark')) {
        openStoryDialogue(STORY_DIALOGUES['first-magic-after']);
        return;
      }
      const learned = learnFirstMagic(campaignState);
      campaignState = learned.state;
      if (learned.ok) savePastCampaign();
      updateStoryStatus();
      updateInteractionPrompt(null);
      openStoryDialogue(learned.ok ? STORY_DIALOGUES['first-magic'] : STORY_DIALOGUES['first-magic-before']);
    }
    if (result.actionId?.startsWith('discover-card:')) {
      const cardId = result.actionId.split(':')[1];
      const discovery = discoverCard(campaignState, cardId);
      campaignState = discovery.state;
      if (discovery.ok) savePastCampaign();
      updateStoryStatus();
      updateInteractionPrompt(null);
      openStoryDialogue({
        id: `card-discovery-${cardId}`,
        lines: [{
          speaker: '地の文',
          text: discovery.ok
            ? `${discovery.message} ${discovery.card.description}。`
            : discovery.message
        }]
      });
    }
    if (result.actionId?.startsWith('dungeon-treasure:')) {
      const treasureId = result.actionId.split(':')[1];
      const opened = openDungeonTreasure(campaignState, treasureId);
      campaignState = opened.state;
      if (opened.ok) savePastCampaign();
      updateStoryStatus();
      updateInteractionPrompt(null);
      openStoryDialogue({ id: `dungeon-treasure-${treasureId}`, lines: [{ speaker: '地の文', text: opened.message }] });
    }
    if (result.actionId === 'crossroads-boss') {
      openStoryDialogue(campaignState.crossroadsBossDefeated
        ? STORY_DIALOGUES['crossroads-altar-stable']
        : STORY_DIALOGUES['crossroads-altar-awakening']);
    }
    if (result.actionId === 'mist-bell-boss') {
      openStoryDialogue(campaignState.mistBossDefeated
        ? STORY_DIALOGUES['mist-boss-cleared']
        : STORY_DIALOGUES['mist-bell-awakening']);
    }
    if (result.actionId === 'sidequest-board') {
      const before = campaignState.sideQuests;
      const accepted = acceptAvailableSideQuests(before, campaignState.crossroadsBossDefeated);
      if (accepted !== before) {
        campaignState = { ...campaignState, sideQuests: accepted };
        savePastCampaign();
        updateStoryStatus();
        openStoryDialogue(STORY_DIALOGUES['sidequest-board-open']);
      } else if (accepted.twinStarVowUnlocked && !accepted.twinStarVowSeen) {
        campaignState = { ...campaignState, sideQuests: markTwinStarVowSeen(accepted) };
        savePastCampaign();
        openStoryDialogue(STORY_DIALOGUES['twin-star-vow']);
      } else {
        openStoryDialogue(STORY_DIALOGUES[accepted.twinStarVowUnlocked ? 'sidequest-board-complete' : 'sidequest-board-active']);
      }
    }
    if (result.actionId?.startsWith('sidequest-boss:')) {
      const questId = result.actionId.split(':')[1];
      const completed = campaignState.sideQuests.completedQuestIds.includes(questId);
      openStoryDialogue(STORY_DIALOGUES[`${questId}-${completed ? 'boss-stable' : 'boss-awakening'}`]);
    }
    if (result.actionId === 'sidequest-midboss:fire-rat-chief') {
      openStoryDialogue(STORY_DIALOGUES['fire-rat-chief-awakening']);
    }
    if (result.actionId?.startsWith('sidequest-sluice:')) {
      const sluiceId = result.actionId.split(':')[1];
      const destination = cooledSluiceDestination(campaignState.sideQuests, sluiceId);
      if (destination) {
        player.x = destination[0] + (sluiceId === 'west' ? -85 : 85);
        player.y = destination[1];
        lastDungeonTileKey = '';
        centerCameraOnPlayer();
        openStoryDialogue({
          id: `cooled-sluice-shortcut-${sluiceId}`,
          lines: [{ speaker: '地の文', text: '冷え固まった導水路を抜け、反対側の水門へ移動した。二つの水門が最奥への近道を結んでいる。' }]
        });
      } else {
        const nextSideQuests = activateCooledSluice(campaignState.sideQuests, sluiceId);
        const changed = nextSideQuests !== campaignState.sideQuests;
        campaignState = { ...campaignState, sideQuests: nextSideQuests };
        if (changed) savePastCampaign();
        const linked = nextSideQuests.cooledSluiceIds.length === 2;
        openStoryDialogue({
          id: `cooled-sluice-${sluiceId}`,
          lines: [{
            speaker: '地の文',
            text: linked
              ? '二つの冷却水門がつながり、熔岩の下に冷え固まった導水路が現れた。東西を結ぶ近道として使える。'
              : changed
                ? '冷却水門を開くと、熔岩の一部が黒曜石へ変わった。反対側の水門も動かせば近道がつながりそうだ。'
                : 'この冷却水門は動いている。反対側の水門が開けば近道になる。'
          }]
        });
      }
    }
  }

  window.V2_GAME_EVENTS = Object.freeze({
    completeMemoryEvent,
    getMemoryStage: () => memoryStage,
    getPastStory: () => ({ ...storyState }),
    getPastCampaign: () => JSON.parse(JSON.stringify(campaignState)),
    getPlayerLocation: () => ({
      edition: currentEdition,
      area: activeAreaId(),
      x: player.x / (activeAreaId() === 'overworld' ? maskScale : 1),
      y: player.y / (activeAreaId() === 'overworld' ? maskScale : 1),
      interactionId: activeInteraction?.id || null
    })
  });

  document.querySelectorAll('[data-edition]').forEach(button => {
    button.addEventListener('click', () => {
      setEdition(button.dataset.edition);
      setSettingsOpen(false);
    });
  });

  function resize() {
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * density;
    canvas.height = innerHeight * density;
    ctx.setTransform(density, 0, 0, density, 0, 0);
    camera.zoom = Math.max(0.76, Math.min(1.08, innerWidth / 1550));
  }

  function setCollisionDisplay(value) {
    showCollision = value;
    collisionStatus.textContent = showCollision ? '表示中' : '非表示';
    collisionStatus.classList.toggle('active', showCollision);
    collisionToggle.textContent = showCollision ? '道路判定を隠す' : '道路判定を表示';
    collisionToggle.setAttribute('aria-pressed', String(showCollision));
  }

  addEventListener('resize', resize);
  resize();
  addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
    const key = event.key.toLowerCase();
    if (key === 'escape' && settingsPanel.getAttribute('aria-hidden') === 'false') {
      setSettingsOpen(false);
      event.preventDefault();
      return;
    }
    if (activeServiceId) {
      if (key === 'escape') closeService();
      event.preventDefault();
      return;
    }
    if (activeStoryDialogue && ['e', 'enter', ' '].includes(key) && !event.repeat) {
      event.preventDefault();
      advanceStoryDialogue();
      return;
    }
    if (['e', 'enter', ' '].includes(key) && !event.repeat) {
      event.preventDefault();
      performStoryInteraction();
      return;
    }
    if (key === 'm' && !event.repeat) setCollisionDisplay(!showCollision);
    keys.add(key);
  });
  addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  settingsToggle.addEventListener('click', () => {
    setSettingsOpen(settingsPanel.getAttribute('aria-hidden') === 'true');
  });
  settingsClose.addEventListener('click', () => setSettingsOpen(false));
  infoToggle.addEventListener('click', () => setStoryPanelVisible(!storyPanelVisible));
  collisionToggle.addEventListener('click', () => setCollisionDisplay(!showCollision));
  inheritedRestart.addEventListener('click', () => {
    const confirmed = window.confirm('レベル・経験値・装備・カードを引き継ぎ、物語と宝箱を最初から始めますか？');
    if (!confirmed) return;
    location.href = 'v2.html?edition=past&newGame=inherit';
  });
  document.querySelectorAll('[data-debug-quest]').forEach(button => {
    button.addEventListener('click', () => toggleDebugQuest(button.dataset.debugQuest));
  });
  interactionPrompt.addEventListener('click', performStoryInteraction);
  dialogueOverlay.addEventListener('click', advanceStoryDialogue);
  openBagButton.addEventListener('click', () => openService('bag'));
  shopClose.addEventListener('click', closeService);
  shopConfirmAccept.addEventListener('click', confirmPendingSale);
  shopConfirmCancel.addEventListener('click', closeSaleConfirmation);
  shopBuy.addEventListener('click', () => {
    if (!activeServiceId) return;
    closeSaleConfirmation();
    activeServiceMode = 'buy';
    shopMessage.textContent = '何を買いますか？';
    renderService();
  });
  shopSell.addEventListener('click', () => {
    if (!activeServiceId) return;
    closeSaleConfirmation();
    activeServiceMode = 'sell';
    shopMessage.textContent = '買値の半額で買い取ります。';
    renderService();
  });

  document.querySelectorAll('[data-dir]').forEach(button => {
    const key = {
      up: 'arrowup',
      down: 'arrowdown',
      left: 'arrowleft',
      right: 'arrowright'
    }[button.dataset.dir];
    const press = event => {
      event.preventDefault();
      keys.add(key);
    };
    const release = event => {
      event.preventDefault();
      keys.delete(key);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('pointerleave', release);
  });

  function resetMapDrag(pointerId = null) {
    if (pointerId !== null && mapDrag.pointerId !== pointerId) return;
    const capturedPointer = mapDrag.pointerId;
    mapDrag.active = false;
    mapDrag.pointerId = null;
    mapDrag.movement = { x: 0, y: 0, strength: 0 };
    dragGuide.classList.remove('is-active');
    dragGuideKnob.style.transform = '';
    if (capturedPointer !== null && shell.hasPointerCapture?.(capturedPointer)) {
      shell.releasePointerCapture(capturedPointer);
    }
  }

  const mapDragBlockedSelector = '.v2-floating-controls, .v2-settings, .v2-help, .v2-map, .v2-landmark-info, .v2-story-status, .v2-interaction-prompt, .v2-dialogue, .v2-shop, .v2-battle, .v2-rest-transition, .v2-controls, .v2-attribution, #v2-loading, button, a, input, select, textarea';

  function isMapDragOrigin(event) {
    return event.target instanceof Element && !event.target.closest(mapDragBlockedSelector);
  }

  shell.addEventListener('pointerdown', event => {
    if (
      event.isPrimary === false || event.button > 0 || !isMapDragOrigin(event) ||
      settingsPanel.getAttribute('aria-hidden') === 'false' || activeBattle || encounterTransitioning ||
      activeStoryDialogue || activeServiceId || restTransitioning || watchtowerEffectActive
    ) return;
    event.preventDefault();
    resetMapDrag();
    mapDrag.active = true;
    mapDrag.pointerId = event.pointerId;
    mapDrag.start = { x: event.clientX, y: event.clientY };
    dragGuide.style.left = `${event.clientX}px`;
    dragGuide.style.top = `${event.clientY}px`;
    dragGuide.classList.add('is-active');
    try {
      shell.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is optional on older iOS WebKit; shell-level listeners still receive the drag.
    }
    canvas.focus();
  }, { passive: false });

  shell.addEventListener('pointermove', event => {
    if (!mapDrag.active || event.pointerId !== mapDrag.pointerId) return;
    event.preventDefault();
    mapDrag.movement = dragMovementVector(mapDrag.start, { x: event.clientX, y: event.clientY });
    const knobDistance = mapDrag.movement.strength * 28;
    dragGuideKnob.style.transform = `translate(${mapDrag.movement.x * knobDistance}px, ${mapDrag.movement.y * knobDistance}px)`;
  }, { passive: false });

  shell.addEventListener('pointerup', event => resetMapDrag(event.pointerId));
  shell.addEventListener('pointercancel', event => resetMapDrag(event.pointerId));
  shell.addEventListener('lostpointercapture', event => resetMapDrag(event.pointerId));

  function maskPointIsWalkable(worldX, worldY) {
    const activeCollisionData = currentEdition === 'past' ? pastCollisionData : collisionData;
    const activeRows = activeCollisionData.runs;
    const maskX = Math.round(worldX / world.w * (activeCollisionData.width - 1));
    const maskY = Math.round(worldY / world.h * (activeCollisionData.height - 1));
    if (maskX < 0 || maskY < 0 || maskX >= activeCollisionData.width || maskY >= activeCollisionData.height) {
      return false;
    }
    for (const [start, end] of activeRows[maskY]) {
      if (maskX < start) return false;
      if (maskX < end) return true;
    }
    return false;
  }

  function canStandAt(x, y) {
    const r = player.footRadius;
    if (currentEdition === 'past' && activeAreaId() !== 'overworld') {
      return canStandInPastArea(activeAreaId(), x, y, r, campaignState.sideQuests.keyItems);
    }
    const diagonal = r * Math.SQRT1_2;
    const onRoad = [
      [0, 0], [r, 0], [-r, 0], [0, r], [0, -r],
      [diagonal, diagonal], [diagonal, -diagonal],
      [-diagonal, diagonal], [-diagonal, -diagonal]
    ].every(([offsetX, offsetY]) => maskPointIsWalkable(x + offsetX, y + offsetY));
    return onRoad;
  }

  function movePlayer(dx, dy, distance) {
    // Short substeps prevent crossing a narrow non-walkable strip during a slow frame.
    const steps = Math.max(1, Math.ceil(distance / 8));
    const stepX = dx * distance / steps;
    const stepY = dy * distance / steps;
    for (let index = 0; index < steps; index++) {
      const nextX = player.x + stepX;
      if (canStandAt(nextX, player.y)) player.x = nextX;
      const nextY = player.y + stepY;
      if (canStandAt(player.x, nextY)) player.y = nextY;
    }
  }

  function ensureOverworldAssets(dx = 0, dy = 0) {
    if (currentEdition === 'past' && activeAreaId() !== 'overworld') return;
    const viewport = {
      x: camera.x,
      y: camera.y,
      width: innerWidth / camera.zoom,
      height: innerHeight / camera.zoom
    };
    const tileCoordinates = visibleTileCoordinates(viewport, tileW, tileH, tileCols, tileRows);
    const playerTile = tileCoordinateForPoint(player.x, player.y, tileW, tileH, tileCols, tileRows);
    const directionalTile = directionalTileCoordinate(playerTile, dx, dy, tileCols, tileRows);
    if (directionalTile) tileCoordinates.push(directionalTile);

    const assetKeys = tileCoordinates.map(tile => tileAssetKey(currentEdition, tile.col, tile.row));
    const landmarkMargin = 220;
    const viewportRight = viewport.x + viewport.width;
    const viewportBottom = viewport.y + viewport.height;
    for (const landmark of landmarks) {
      if (currentEdition === 'past' && landmarkMemoryState(landmark.id, memoryStage) === 'fog') continue;
      const left = landmark.x - landmark.width / 2;
      const right = landmark.x + landmark.width / 2;
      const top = landmark.y - landmark.height;
      const bottom = landmark.y;
      const nearViewport = right >= viewport.x - landmarkMargin
        && left <= viewportRight + landmarkMargin
        && bottom >= viewport.y - landmarkMargin
        && top <= viewportBottom + landmarkMargin;
      if (nearViewport) assetKeys.push(landmarkAssetKey(currentEdition, landmark.id));
    }

    if (currentEdition === 'past') {
      const enemyMargin = 320;
      for (const enemy of pastEnemies) {
        const nearViewport = storyEncounterMode(storyState, enemy.id) !== 'hidden'
          && enemy.active
          && enemy.x >= viewport.x - enemyMargin
          && enemy.x <= viewportRight + enemyMargin
          && enemy.y >= viewport.y - enemyMargin
          && enemy.y <= viewportBottom + enemyMargin;
        if (nearViewport) assetKeys.push(enemyAssetKey(enemy.enemyId));
      }
    }
    loadAssetsInBackground(assetKeys);
  }

  function handleSideDungeonTerrainStep() {
    const areaId = activeAreaId();
    if (!isSideQuestArea(areaId)) return;
    const dungeon = SIDE_DUNGEONS[areaId];
    const column = Math.floor(player.x / dungeon.tileSize);
    const row = Math.floor(player.y / dungeon.tileSize);
    const tileKey = `${areaId}:${column}:${row}`;
    if (tileKey === lastDungeonTileKey) return;
    lastDungeonTileKey = tileKey;
    const step = resolveDungeonStep({
      dungeonId: areaId,
      tile: dungeonTileAt(areaId, player.x, player.y),
      hp: campaignState.currentHp,
      warmth: dungeonWarmth,
      keyItems: campaignState.sideQuests.keyItems
    });
    dungeonWarmth = step.warmth;
    if (step.hp !== campaignState.currentHp) {
      campaignState = { ...campaignState, currentHp: step.hp };
      savePastCampaign();
    }
    if (step.message) {
      terrainNotice = step.message;
      terrainNoticeUntil = performance.now() + 1800;
    }
    updateStoryStatus();
  }

  function updateSideDungeonEnemies(dt) {
    const areaId = activeAreaId();
    if (!isSideQuestArea(areaId)) return;
    const now = performance.now();
    if (encounterSafeCenter && Math.hypot(player.x - encounterSafeCenter[0], player.y - encounterSafeCenter[1]) >= 90) {
      encounterSafeCenter = null;
    }
    sideDungeonEnemies = sideDungeonEnemies.map(enemy => {
      if (!enemy.active && now >= enemy.respawnAt) {
        return { ...enemy, active: true, x: enemy.patrol[0][0], y: enemy.patrol[0][1], patrolIndex: 1 };
      }
      return advancePatrol(enemy, dt);
    });
    const encounter = now >= encounterGraceUntil && !encounterSafeCenter
      ? sideDungeonEnemies.find(enemy => shouldStartEncounter(player, enemy, 18, now))
      : null;
    if (encounter) openBattle({ ...encounter, sideQuestId: sideQuestForArea(areaId)?.id });
  }

  function update(dt) {
    if (!ready || activeBattle || encounterTransitioning || activeStoryDialogue || activeServiceId || restTransitioning || watchtowerEffectActive) return;
    let dx = 0;
    let dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy--;
    if (keys.has('s') || keys.has('arrowdown')) dy++;
    if (keys.has('a') || keys.has('arrowleft')) dx--;
    if (keys.has('d') || keys.has('arrowright')) dx++;
    let movementStrength = 1;
    if (!dx && !dy && mapDrag.active && mapDrag.movement.strength > 0) {
      dx = mapDrag.movement.x;
      dy = mapDrag.movement.y;
      movementStrength = mapDrag.movement.strength;
    }

    const standingTile = isSideQuestArea(activeAreaId()) ? dungeonTileAt(activeAreaId(), player.x, player.y) : '';
    if (activeAreaId() === 'ice-lantern-cavern' && standingTile === 'I') {
      if (dx || dy) {
        const length = Math.hypot(dx, dy);
        dungeonSlideDirection = { x: dx / length, y: dy / length };
      } else if (dungeonSlideDirection) {
        dx = dungeonSlideDirection.x;
        dy = dungeonSlideDirection.y;
        movementStrength = 0.82;
      }
    } else if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dungeonSlideDirection = { x: dx / length, y: dy / length };
    } else {
      dungeonSlideDirection = null;
    }

    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      movePlayer(dx, dy, player.speed * dt * movementStrength);
      player.step += dt * 9;
      player.facing = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      handleSideDungeonTerrainStep();
    }

    if (currentEdition === 'past' && activeAreaId() === 'overworld') {
      const now = performance.now();
      if (encounterSafeCenter && Math.hypot(player.x - encounterSafeCenter[0], player.y - encounterSafeCenter[1]) >= FIELD_EXIT_SAFE_RADIUS * maskScale) {
        encounterSafeCenter = null;
      }
      pastEnemies = pastEnemies.map(enemy => {
        if (storyEncounterMode(storyState, enemy.id) === 'hidden') return enemy;
        if (!enemy.active && now >= enemy.respawnAt) {
          return { ...enemy, active: true, x: enemy.patrol[0][0], y: enemy.patrol[0][1], patrolIndex: 1 };
        }
        return advancePatrol(enemy, dt);
      });
      const sideQuestEntranceSafe = isNearActiveSideQuestEntrance(
        campaignState.sideQuests,
        campaignState.crossroadsBossDefeated,
        player.x,
        player.y,
        maskScale
      );
      const encounter = now >= encounterGraceUntil && pastEnemies.find(enemy => !encounterSafeCenter && !sideQuestEntranceSafe && storyEncounterMode(storyState, enemy.id) !== 'hidden'
        && shouldStartEncounter(player, enemy, FIELD_ENCOUNTER_RADIUS * maskScale, now));
      if (encounter) openBattle(encounter);
    }
    updateSideDungeonEnemies(dt);

    const dynamicNpcPoints = new Map(localNpcs().map(npc => {
      const pose = npcPoseAt(npc, performance.now());
      return [npc.id, [pose.x, pose.y]];
    }));
    const nearbyInteraction = currentEdition === 'past'
      ? nearbyPastInteraction(activeAreaId(), player, maskScale, pastInteractionAvailable, dynamicNpcPoints)
      : null;
    const interaction = nearbyInteraction?.cardId && campaignState.ownedCards.includes(nearbyInteraction.cardId)
      ? null
      : nearbyInteraction;
    updateInteractionPrompt(interaction);

    const activeWorld = activeWorldSize();
    const viewW = innerWidth / camera.zoom;
    const viewH = innerHeight / camera.zoom;
    const targetX = Math.max(0, Math.min(Math.max(0, activeWorld.w - viewW), player.x - viewW / 2));
    const targetY = Math.max(0, Math.min(Math.max(0, activeWorld.h - viewH), player.y - viewH / 2));
    camera.x += (targetX - camera.x) * Math.min(1, dt * 7);
    camera.y += (targetY - camera.y) * Math.min(1, dt * 7);
    ensureOverworldAssets(dx, dy);
  }

  function drawPlayer() {
    const sprite = editionSprites.get(currentEdition)[player.facing];
    if (!sprite.complete || !sprite.naturalWidth) return;
    const displayHeight = 48;
    const displayWidth = displayHeight * sprite.naturalWidth / sprite.naturalHeight;
    const bob = Math.sin(player.step) * 2;
    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y));
    ctx.fillStyle = '#0007';
    ctx.beginPath();
    ctx.ellipse(0, 1, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, -displayWidth / 2, -displayHeight + 3 + bob, displayWidth, displayHeight);
    ctx.restore();
  }

  function drawMap() {
    if (currentEdition === 'past' && activeAreaId() === 'castle-town') {
      drawCastleTown();
      return;
    }
    if (currentEdition === 'past' && activeAreaId() === 'castle') {
      drawCastleInterior();
      return;
    }
    if (currentEdition === 'past' && ['crossroads-town', 'crossroads-dungeon'].includes(activeAreaId())) {
      drawCrossroadsArea();
      return;
    }
    if (currentEdition === 'past' && activeAreaId() === 'mist-citadel') {
      drawMistCitadel();
      return;
    }
    if (currentEdition === 'past' && activeAreaId() === 'mist-bell-tower') {
      drawMistBellTower();
      return;
    }
    if (currentEdition === 'past' && isSideQuestArea(activeAreaId())) {
      drawSideQuestDungeon();
      return;
    }
    for (const tile of editionTiles.get(currentEdition)) {
      if (!imageIsLoaded(tile.image)) continue;
      ctx.drawImage(tile.image, tile.col * tileW, tile.row * tileH, tileW, tileH);
    }
  }

  function drawCastleTown() {
    const area = PAST_AREAS['castle-town'];
    const ground = pastSceneImages.get('castle-town-ground');
    const buildings = pastSceneImages.get('castle-town-buildings');
    if (!imageIsLoaded(ground) || !imageIsLoaded(buildings)) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(ground, 0, 0, area.width, area.height);
    ctx.drawImage(buildings, 0, 0, area.width, area.height);
    for (const building of TOWN_BUILDINGS) drawTownBuildingLabel(building);
  }

  function drawCastleInterior() {
    const area = PAST_AREAS.castle;
    const interior = pastSceneImages.get('castle-interior');
    if (!imageIsLoaded(interior)) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(interior, 0, 0, area.width, area.height);
  }

  function drawCrossroadsArea() {
    const areaId = activeAreaId();
    const area = PAST_AREAS[areaId];
    if (areaId === 'crossroads-dungeon') {
      drawCrossroadsDungeonTiles();
      drawCrossroadsDungeonEvents();
      return;
    }
    const background = pastSceneImages.get(areaId);
    if (!imageIsLoaded(background)) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(background, 0, 0, area.width, area.height);
    for (const building of CROSSROADS_BUILDINGS) drawTownBuildingLabel(building);
    drawQuadraQuestBoard();
  }

  function drawQuadraQuestBoard() {
    if (!campaignState.crossroadsBossDefeated) return;
    const interaction = pastStoryApi.PAST_INTERACTIONS.find(item => item.id === 'quadra-sidequest-board');
    if (!interaction) return;
    const [x, y] = interaction.point;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#34251d';
    ctx.fillRect(-62, -78, 124, 70);
    ctx.strokeStyle = '#d9ab63';
    ctx.lineWidth = 5;
    ctx.strokeRect(-62, -78, 124, 70);
    ctx.fillStyle = '#ead7ad';
    for (let note = 0; note < 3; note += 1) {
      ctx.save();
      ctx.rotate((note - 1) * 0.07);
      ctx.fillRect(-48 + note * 34, -65 + (note % 2) * 5, 30, 42);
      ctx.restore();
    }
    ctx.fillStyle = '#261812';
    ctx.fillRect(-7, -8, 14, 62);
    ctx.fillStyle = '#ffe0a0';
    ctx.font = '700 13px Georgia, "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.fillText('旅人の依頼板', 0, 70);
    ctx.restore();
  }

  function drawMistCitadel() {
    const area = PAST_AREAS['mist-citadel'];
    const background = pastSceneImages.get('mist-citadel');
    if (!imageIsLoaded(background)) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(background, 0, 0, area.width, area.height);
    for (const building of MIST_BUILDINGS) drawTownBuildingLabel(building);
    ctx.save();
    ctx.fillStyle = '#edf5ff';
    ctx.font = '700 15px Georgia, "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#171426';
    ctx.shadowBlur = 5;
    ctx.fillText('無響の鐘楼', 800, 400);
    ctx.restore();
  }

  function drawMistBellTower() {
    const area = PAST_AREAS['mist-bell-tower'];
    const tileSize = 64;
    const firstColumn = Math.max(0, Math.floor(camera.x / tileSize) - 1);
    const lastColumn = Math.min(Math.ceil(area.width / tileSize), Math.ceil((camera.x + innerWidth / camera.zoom) / tileSize) + 1);
    const firstRow = Math.max(0, Math.floor(camera.y / tileSize) - 1);
    const lastRow = Math.min(Math.ceil(area.height / tileSize), Math.ceil((camera.y + innerHeight / camera.zoom) / tileSize) + 1);
    ctx.fillStyle = '#171827';
    ctx.fillRect(0, 0, area.width, area.height);
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const left = column * tileSize;
        const top = row * tileSize;
        ctx.fillStyle = (row + column) % 2 ? '#39384a' : '#424052';
        ctx.fillRect(left, top, tileSize, tileSize);
        ctx.strokeStyle = '#242433';
        ctx.strokeRect(left + 0.5, top + 0.5, tileSize - 1, tileSize - 1);
      }
    }
    ctx.save();
    for (const [left, top, width, height] of MIST_TOWER_COLLISION_RECTS) {
      const gradient = ctx.createLinearGradient(left, top, left, top + height);
      gradient.addColorStop(0, '#282b38');
      gradient.addColorStop(1, '#11131c');
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, width, height);
      ctx.strokeStyle = '#746c82';
      ctx.lineWidth = 4;
      ctx.strokeRect(left + 2, top + 2, width - 4, height - 4);
    }
    ctx.strokeStyle = '#8a72bd88';
    ctx.lineWidth = 8;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.moveTo(900, 1240);
    ctx.lineTo(900, 900);
    ctx.quadraticCurveTo(690, 700, 900, 480);
    ctx.lineTo(900, 220);
    ctx.stroke();
    ctx.restore();

    for (const interaction of pastStoryApi.PAST_INTERACTIONS.filter(item => item.area === 'mist-bell-tower' && item.actionId?.startsWith('dungeon-treasure:'))) {
      const treasureId = interaction.actionId.split(':')[1];
      if (campaignState.openedDungeonChests.includes(treasureId)) continue;
      const assetId = treasureId === 'fog-cache' ? 'card-chest-mend' : 'card-chest-frost';
      const image = pastEventImages.get(assetId);
      const definition = PAST_EVENT_ASSETS[assetId];
      if (imageIsLoaded(image)) ctx.drawImage(image, interaction.point[0] - definition.width / 2, interaction.point[1] - definition.height + 8, definition.width, definition.height);
    }
    const altar = pastStoryApi.PAST_INTERACTIONS.find(interaction => interaction.id === 'mist-bell-altar');
    if (altar) {
      ctx.save();
      const glow = ctx.createRadialGradient(altar.point[0], altar.point[1], 8, altar.point[0], altar.point[1], 95);
      glow.addColorStop(0, campaignState.mistBossDefeated ? '#a9fff2cc' : '#bc8cffcc');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(altar.point[0], altar.point[1], 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = campaignState.mistBossDefeated ? '#bfffee' : '#dcb2ff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(altar.point[0], altar.point[1], 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#f6e9ff';
      ctx.font = '700 14px Georgia, "Yu Mincho", serif';
      ctx.textAlign = 'center';
      ctx.fillText(campaignState.mistBossDefeated ? '澄んだ霧鐘' : '眠る霧鐘', altar.point[0], altar.point[1] + 5);
      ctx.restore();
    }
  }

  function buildSideDungeonTileSprite(dungeon, tile, variant) {
    const key = `side:${dungeon.id}:${tile}:${variant}`;
    if (dungeonTileSprites.has(key)) return dungeonTileSprites.get(key);
    const size = dungeon.tileSize;
    const sprite = document.createElement('canvas');
    sprite.width = size * 2;
    sprite.height = size * 2;
    const paint = sprite.getContext('2d');
    paint.scale(2, 2);
    const palette = dungeon.biome === 'poison'
      ? { floor: '#4d4a46', floor2: '#5d574d', wall: '#292d25', edge: '#78905a' }
      : dungeon.biome === 'ice'
        ? { floor: '#536878', floor2: '#6f8490', wall: '#263746', edge: '#a9d8e7' }
        : { floor: '#4c4540', floor2: '#625149', wall: '#211d1e', edge: '#9d4c35' };
    const gradient = paint.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, variant % 2 ? palette.floor : palette.floor2);
    gradient.addColorStop(1, palette.floor);
    paint.fillStyle = gradient;
    paint.fillRect(0, 0, size, size);
    paint.strokeStyle = `${palette.edge}66`;
    paint.strokeRect(2.5, 2.5, size - 5, size - 5);

    if (tile === '#') {
      paint.fillStyle = palette.wall;
      paint.fillRect(0, 0, size, size);
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const offset = (row * 4 + column + variant) % 4;
          paint.fillStyle = offset % 2 ? `${palette.floor}cc` : `${palette.floor2}aa`;
          paint.fillRect(column * 15 + offset - 2, row * 15 + (offset % 3) - 2, 16, 15);
        }
      }
      paint.strokeStyle = '#1119';
      paint.beginPath();
      paint.moveTo(8 + variant * 4, 4);
      paint.lineTo(20, 23);
      paint.lineTo(15, 41);
      paint.stroke();
    } else if (tile === 'P') {
      const mire = paint.createRadialGradient(24, 22, 2, 30, 30, 42);
      mire.addColorStop(0, '#9b5daf');
      mire.addColorStop(0.55, '#584269');
      mire.addColorStop(1, '#283d32');
      paint.fillStyle = mire;
      paint.fillRect(0, 0, size, size);
      for (let bubble = 0; bubble < 6; bubble += 1) {
        paint.strokeStyle = bubble % 2 ? '#c895d2aa' : '#9bc767aa';
        paint.beginPath();
        paint.arc(8 + ((bubble * 17 + variant * 5) % 48), 9 + ((bubble * 23) % 43), 2 + bubble % 3, 0, Math.PI * 2);
        paint.stroke();
      }
    } else if (tile === 'I') {
      const ice = paint.createLinearGradient(0, 0, size, size);
      ice.addColorStop(0, '#d6f6ff');
      ice.addColorStop(0.45, '#72b9d5');
      ice.addColorStop(1, '#3f769d');
      paint.fillStyle = ice;
      paint.fillRect(0, 0, size, size);
      paint.strokeStyle = '#efffffaa';
      paint.beginPath();
      paint.moveTo(4, 42 - variant * 3);
      paint.lineTo(20, 31);
      paint.lineTo(31, 36);
      paint.lineTo(53, 17);
      paint.stroke();
    } else if (tile === 'L') {
      paint.fillStyle = '#271c1b';
      paint.fillRect(0, 0, size, size);
      paint.strokeStyle = '#ff9b35';
      paint.lineWidth = 6;
      paint.beginPath();
      paint.moveTo(-4, 12 + variant * 5);
      paint.bezierCurveTo(15, 4, 22, 35, 38, 24);
      paint.bezierCurveTo(49, 16, 53, 48, 66, 39);
      paint.stroke();
      paint.strokeStyle = '#ffdf62';
      paint.lineWidth = 2;
      paint.stroke();
    }

    if (tile === 'B') {
      paint.fillStyle = '#30231c';
      paint.fillRect(19, 31, 22, 16);
      paint.fillStyle = '#ffb13d';
      paint.beginPath();
      paint.moveTo(30, 8);
      paint.quadraticCurveTo(43, 24, 30, 35);
      paint.quadraticCurveTo(17, 24, 30, 8);
      paint.fill();
      paint.fillStyle = '#fff0a8';
      paint.beginPath();
      paint.arc(30, 26, 5, 0, Math.PI * 2);
      paint.fill();
    } else if (tile === 'C') {
      paint.strokeStyle = '#e6ffe1';
      paint.lineWidth = 3;
      paint.beginPath();
      paint.arc(30, 30, 18, 0, Math.PI * 2);
      paint.moveTo(30, 8);
      paint.lineTo(30, 52);
      paint.moveTo(8, 30);
      paint.lineTo(52, 30);
      paint.stroke();
    } else if (tile === 'S') {
      paint.fillStyle = '#242d32';
      paint.fillRect(8, 12, 44, 36);
      paint.strokeStyle = '#8ab8c4';
      paint.lineWidth = 4;
      for (let bar = 0; bar < 4; bar += 1) {
        paint.beginPath();
        paint.moveTo(15 + bar * 10, 14);
        paint.lineTo(15 + bar * 10, 46);
        paint.stroke();
      }
    } else if (tile === '>') {
      paint.fillStyle = '#28252a';
      for (let step = 0; step < 6; step += 1) paint.fillRect(8 + step * 3, 7 + step * 8, 44 - step * 6, 6);
    }

    dungeonTileSprites.set(key, sprite);
    return sprite;
  }

  function drawSideQuestDungeon() {
    const dungeon = SIDE_DUNGEONS[activeAreaId()];
    if (!dungeon) return;
    const firstColumn = Math.max(0, Math.floor(camera.x / dungeon.tileSize) - 1);
    const lastColumn = Math.min(dungeon.columns - 1, Math.ceil((camera.x + innerWidth / camera.zoom) / dungeon.tileSize) + 1);
    const firstRow = Math.max(0, Math.floor(camera.y / dungeon.tileSize) - 1);
    const lastRow = Math.min(dungeon.rows.length - 1, Math.ceil((camera.y + innerHeight / camera.zoom) / dungeon.tileSize) + 1);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const tile = dungeon.rows[row][column];
        const sprite = buildSideDungeonTileSprite(dungeon, tile, (row * 7 + column * 11) % 4);
        ctx.drawImage(sprite, column * dungeon.tileSize, row * dungeon.tileSize, dungeon.tileSize + 0.5, dungeon.tileSize + 0.5);
      }
    }
    ctx.restore();
    drawSideQuestDungeonEvents();
  }

  function drawSideQuestDungeonEvents() {
    const quest = sideQuestForArea(activeAreaId());
    if (!quest) return;
    const completed = campaignState.sideQuests.completedQuestIds.includes(quest.id);
    const altar = pastStoryApi.PAST_INTERACTIONS.find(interaction => interaction.id === `${quest.id}-boss-altar`);
    if (altar) {
      const [x, y] = altar.point;
      ctx.save();
      ctx.translate(x, y);
      const glow = ctx.createRadialGradient(0, 0, 10, 0, 0, 95);
      glow.addColorStop(0, completed ? '#9dffe0cc' : '#b36be2bb');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = completed ? '#537b68' : '#493655';
      ctx.beginPath();
      ctx.moveTo(-62, 34);
      ctx.lineTo(-46, -28);
      ctx.lineTo(0, -56);
      ctx.lineTo(46, -28);
      ctx.lineTo(62, 34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = completed ? '#c3ffe5' : '#e3b4ff';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.fillStyle = '#fff3c5';
      ctx.font = '900 32px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(completed ? '✦' : '◆', 0, -3);
      ctx.restore();
    }
    if (quest.id === 'molten-crown' && !campaignState.sideQuests.keyItems.includes('fire-rat-boots')) {
      const midboss = SIDE_DUNGEON_ENCOUNTERS.find(encounter => encounter.id === 'sidequest-fire-rat-chief');
      if (midboss) drawDungeonEnemySprite({ ...midboss, x: midboss.patrol[0][0], y: midboss.patrol[0][1] }, 1.15);
    }
    if (quest.id === 'molten-crown') {
      for (const sluiceId of ['west', 'east']) {
        const active = campaignState.sideQuests.cooledSluiceIds.includes(sluiceId);
        const interaction = pastStoryApi.PAST_INTERACTIONS.find(item => item.id === `molten-sluice-${sluiceId}`);
        if (!interaction) continue;
        const [x, y] = interaction.point;
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = active ? '#8fe9ff' : '#b96a48';
        ctx.fillStyle = active ? '#24586a' : '#3b2926';
        ctx.lineWidth = 5;
        ctx.fillRect(-34, -27, 68, 54);
        ctx.strokeRect(-34, -27, 68, 54);
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff0cc';
        ctx.font = '700 11px Georgia, "Yu Mincho", serif';
        ctx.textAlign = 'center';
        ctx.fillText(active ? '冷却中' : '停止中', 0, 45);
        ctx.restore();
      }
    }
  }

  function dungeonDetail(seed, index, range) {
    let value = Math.imul(seed + index * 977, 2654435761);
    value ^= value >>> 13;
    return Math.abs(value) % range;
  }

  function buildDungeonTileSprite(tile, variant = 0, restored = false) {
    const key = `${tile}:${variant}:${restored ? 'restored' : 'wild'}`;
    if (dungeonTileSprites.has(key)) return dungeonTileSprites.get(key);
    const tileSize = CROSSROADS_DUNGEON_LAYOUT.tileSize;
    const sprite = document.createElement('canvas');
    sprite.width = tileSize * 2;
    sprite.height = tileSize * 2;
    const tileContext = sprite.getContext('2d');
    tileContext.scale(2, 2);
    const seed = variant * 101 + tile.charCodeAt(0) * 17 + (restored ? 409 : 0);

    const paintWater = () => {
      const gradient = tileContext.createLinearGradient(0, 0, tileSize, tileSize);
      gradient.addColorStop(0, restored ? '#17677a' : '#173b59');
      gradient.addColorStop(0.55, restored ? '#21889a' : '#245172');
      gradient.addColorStop(1, restored ? '#134e67' : '#142d4b');
      tileContext.fillStyle = gradient;
      tileContext.fillRect(0, 0, tileSize, tileSize);
      tileContext.strokeStyle = restored ? '#7ad5d8aa' : '#709ab4aa';
      tileContext.lineWidth = 1;
      for (let stripe = 0; stripe < 5; stripe += 1) {
        const y = 7 + stripe * 12 + dungeonDetail(seed, stripe, 5);
        tileContext.beginPath();
        tileContext.moveTo(-4, y);
        for (let x = 4; x <= 64; x += 12) {
          tileContext.quadraticCurveTo(x, y - 3 + (stripe % 2) * 6, x + 6, y);
        }
        tileContext.stroke();
      }
      tileContext.fillStyle = restored ? '#b8f4e866' : '#9cc7df45';
      for (let detail = 0; detail < 11; detail += 1) {
        tileContext.fillRect(dungeonDetail(seed, detail + 20, 57), dungeonDetail(seed, detail + 40, 57), 2, 1);
      }
    };

    if (tile === '#') {
      tileContext.fillStyle = variant % 2 ? '#292a2d' : '#303136';
      tileContext.fillRect(0, 0, tileSize, tileSize);
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const detail = row * 4 + column;
          const left = column * 15 + dungeonDetail(seed, detail, 4) - 2;
          const top = row * 15 + dungeonDetail(seed, detail + 20, 4) - 2;
          const width = 15 + dungeonDetail(seed, detail + 40, 6);
          const height = 14 + dungeonDetail(seed, detail + 60, 6);
          tileContext.fillStyle = ['#48474a', '#555256', '#3e4142'][dungeonDetail(seed, detail + 80, 3)];
          tileContext.fillRect(left, top, width, height);
          tileContext.strokeStyle = '#202225';
          tileContext.lineWidth = 1;
          tileContext.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
          tileContext.fillStyle = '#74706d55';
          tileContext.fillRect(left + 2, top + 2, Math.max(3, width - 5), 1);
        }
      }
      tileContext.strokeStyle = '#17191bbb';
      tileContext.beginPath();
      tileContext.moveTo(9 + variant * 3, 4);
      tileContext.lineTo(18 + variant, 19);
      tileContext.lineTo(13 + variant * 2, 31);
      tileContext.lineTo(25, 40 + variant);
      tileContext.stroke();
      tileContext.fillStyle = '#557b3c';
      for (let moss = 0; moss < 9; moss += 1) {
        if ((moss + variant) % 3 === 0) tileContext.fillRect(dungeonDetail(seed, moss + 120, 58), dungeonDetail(seed, moss + 140, 58), 2, 2);
      }
    } else if (tile === '~') {
      paintWater();
    } else if (tile.startsWith('bridge-')) {
      paintWater();
      const horizontal = tile === 'bridge-horizontal';
      tileContext.fillStyle = '#4a4542';
      if (horizontal) tileContext.fillRect(0, 11, tileSize, 38);
      else tileContext.fillRect(11, 0, 38, tileSize);
      tileContext.fillStyle = '#77706a';
      for (let slab = 0; slab < 5; slab += 1) {
        const offset = slab * 12;
        if (horizontal) tileContext.fillRect(offset + 1, 14 + (slab % 2), 10, 32 - (slab % 2) * 2);
        else tileContext.fillRect(14 + (slab % 2), offset + 1, 32 - (slab % 2) * 2, 10);
      }
      tileContext.strokeStyle = '#272527';
      tileContext.lineWidth = 1;
      if (horizontal) {
        tileContext.beginPath();
        tileContext.moveTo(0, 11);
        tileContext.lineTo(60, 11);
        tileContext.moveTo(0, 49);
        tileContext.lineTo(60, 49);
        tileContext.stroke();
      } else {
        tileContext.beginPath();
        tileContext.moveTo(11, 0);
        tileContext.lineTo(11, 60);
        tileContext.moveTo(49, 0);
        tileContext.lineTo(49, 60);
        tileContext.stroke();
      }
    } else {
      const gradient = tileContext.createLinearGradient(0, 0, 0, tileSize);
      gradient.addColorStop(0, variant % 2 ? '#777471' : '#817d77');
      gradient.addColorStop(1, variant % 2 ? '#5c5b59' : '#65625f');
      tileContext.fillStyle = gradient;
      tileContext.fillRect(0, 0, tileSize, tileSize);
      tileContext.strokeStyle = '#474644aa';
      tileContext.lineWidth = 1;
      tileContext.strokeRect(2.5, 2.5, 55, 55);
      tileContext.fillStyle = '#36373788';
      for (let pebble = 0; pebble < 28; pebble += 1) {
        const size = 1 + dungeonDetail(seed, pebble + 50, 2);
        tileContext.fillRect(dungeonDetail(seed, pebble, 58), dungeonDetail(seed, pebble + 90, 58), size, size);
      }
      tileContext.strokeStyle = '#42414199';
      tileContext.beginPath();
      tileContext.moveTo(7 + variant * 4, 12);
      tileContext.lineTo(19 + variant * 2, 20);
      tileContext.lineTo(15 + variant * 5, 32);
      tileContext.stroke();
      if (tile === '>') {
        tileContext.fillStyle = '#34343a';
        for (let step = 0; step < 6; step += 1) {
          tileContext.fillRect(8 + step * 3, 6 + step * 8, 44 - step * 6, 6);
        }
      } else if (tile === 'A') {
        tileContext.strokeStyle = restored ? '#7fe7dc' : '#d48ce9';
        tileContext.lineWidth = 2;
        tileContext.beginPath();
        tileContext.arc(30, 30, 22, 0, Math.PI * 2);
        tileContext.stroke();
        tileContext.beginPath();
        tileContext.moveTo(30, 5);
        tileContext.lineTo(30, 55);
        tileContext.moveTo(5, 30);
        tileContext.lineTo(55, 30);
        tileContext.stroke();
      }
    }

    dungeonTileSprites.set(key, sprite);
    return sprite;
  }

  function dungeonBridgeKind(rows, row, column) {
    const waterAboveOrBelow = rows[row - 1]?.[column] === '~' || rows[row + 1]?.[column] === '~';
    return waterAboveOrBelow ? 'bridge-horizontal' : 'bridge-vertical';
  }

  function drawCrossroadsDungeonTiles() {
    const { columns, rows, tileSize } = CROSSROADS_DUNGEON_LAYOUT;
    const firstColumn = Math.max(0, Math.floor(camera.x / tileSize) - 1);
    const lastColumn = Math.min(columns - 1, Math.ceil((camera.x + innerWidth / camera.zoom) / tileSize) + 1);
    const firstRow = Math.max(0, Math.floor(camera.y / tileSize) - 1);
    const lastRow = Math.min(rows.length - 1, Math.ceil((camera.y + innerHeight / camera.zoom) / tileSize) + 1);
    const restored = campaignState.crossroadsBossDefeated;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let column = firstColumn; column <= lastColumn; column += 1) {
        const mapTile = rows[row][column];
        const tile = mapTile === '=' ? dungeonBridgeKind(rows, row, column) : mapTile;
        const sprite = buildDungeonTileSprite(tile, (row * 7 + column * 11) % 4, restored);
        ctx.drawImage(sprite, column * tileSize, row * tileSize, tileSize + 0.5, tileSize + 0.5);
      }
    }
    ctx.restore();
  }

  function drawWatergate(gate, open) {
    const [x, y] = gate.point;
    const assetId = `watergate-${open ? 'open' : 'closed'}`;
    const image = pastEventImages.get(`watergate-${open ? 'open' : 'closed'}`);
    const definition = PAST_EVENT_ASSETS[assetId];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(gate.rotationQuarterTurns * Math.PI / 2);
    if (imageIsLoaded(image)) {
      ctx.drawImage(image, -definition.width / 2, -definition.height / 2, definition.width, definition.height);
    }
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#17131ddd';
    roundedRectanglePath(ctx, x - 45, y - 54, 90, 22, 6);
    ctx.fill();
    ctx.fillStyle = open ? '#aef5db' : '#ffd29b';
    ctx.font = '700 11px Georgia, "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${gate.name}・${open ? '開' : '閉'}`, x, y - 43);
    ctx.restore();
  }

  function drawDungeonAltar(point, restored) {
    const [x, y] = point;
    const assetId = `compass-altar-${restored ? 'restored' : 'corrupted'}`;
    const image = pastEventImages.get(`compass-altar-${restored ? 'restored' : 'corrupted'}`);
    const definition = PAST_EVENT_ASSETS[assetId];
    if (imageIsLoaded(image)) {
      ctx.drawImage(image, x - definition.width / 2, y - definition.height + 58, definition.width, definition.height);
    }
    ctx.save();
    ctx.fillStyle = '#ead59e';
    ctx.font = '700 12px Georgia, "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.fillText(restored ? '方位核の祭壇・安定' : '方位核の祭壇', x, y + 76);
    ctx.restore();
  }

  function drawCrossroadsDungeonEvents() {
    const restored = campaignState.crossroadsBossDefeated;
    for (const gate of CROSSROADS_WATERGATES) drawWatergate(gate, restored);
    const altar = pastStoryApi.PAST_INTERACTIONS.find(interaction => interaction.id === 'crossroads-boss-altar');
    if (altar) drawDungeonAltar(altar.point, restored);
    for (const interaction of pastStoryApi.PAST_INTERACTIONS.filter(item => item.area === 'crossroads-dungeon' && item.actionId?.startsWith('dungeon-treasure:'))) {
      const treasureId = interaction.actionId.split(':')[1];
      if (campaignState.openedDungeonChests.includes(treasureId)) continue;
      const assetId = treasureId === 'merchant-cache' ? 'card-chest-mend' : 'card-chest-frost';
      const image = pastEventImages.get(assetId);
      const definition = PAST_EVENT_ASSETS[assetId];
      if (imageIsLoaded(image)) ctx.drawImage(image, interaction.point[0] - definition.width / 2, interaction.point[1] - definition.height + 8, definition.width, definition.height);
    }
  }

  function drawTownBuildingLabel(building) {
    const [x, y] = building.labelPoint;
    const labelWidth = building.type === 'castle' ? 235 : 190;
    ctx.save();
    roundedRectanglePath(ctx, x - labelWidth / 2, y - 18, labelWidth, 36, 8);
    ctx.fillStyle = '#1b1118e8';
    ctx.fill();
    ctx.strokeStyle = '#e0ae5c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffe7b5';
    ctx.font = `700 ${building.type === 'castle' ? 15 : 13}px Georgia, "Yu Mincho", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${building.icon} ${building.label}`, x, y);
    ctx.restore();
  }

  function localNpcs() {
    if (currentEdition !== 'past') return [];
    const brothers = BROTHER_NPCS.filter(npc => npc.area === activeAreaId() && storyNpcIsAvailable(storyState, npc));
    if (activeAreaId() === 'castle-town') return [...TOWN_NPCS, ...brothers];
    if (activeAreaId() === 'castle') return CASTLE_NPCS;
    if (activeAreaId() === 'crossroads-town') return [...CROSSROADS_NPCS, ...brothers];
    if (activeAreaId() === 'mist-citadel') return [...MIST_CITADEL_NPCS, ...brothers];
    return [];
  }

  function drawPastNpc(npc, pose, now) {
    const image = pastNpcImages.get(npc.sprite);
    if (!image?.complete || !image.naturalWidth) return;
    const displayHeight = npc.role === 'king' ? 68 : npc.role === 'soldier' ? 58 : 52;
    const displayWidth = displayHeight * image.naturalWidth / image.naturalHeight;
    const bob = pose.moving ? Math.sin(now / 110 + npc.id.length) * 1.7 : 0;
    const flip = pose.facing === 'left' ? -1 : 1;
    ctx.save();
    ctx.translate(Math.round(pose.x), Math.round(pose.y));
    ctx.fillStyle = '#09060966';
    ctx.beginPath();
    ctx.ellipse(0, 2, displayWidth * 0.3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(flip, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(image, -displayWidth / 2, -displayHeight + 4 + bob, displayWidth, displayHeight);
    ctx.restore();
  }

  function drawDungeonEnemySprite(enemy, scale = 1) {
    const image = pastEnemyImages.get(enemy.enemyId);
    if (!image?.complete || !image.naturalWidth) return;
    const height = 50 * scale;
    const width = height * image.naturalWidth / image.naturalHeight;
    const bob = Math.sin(performance.now() / 280 + enemy.x) * 1.5;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = '#09060999';
    ctx.beginPath();
    ctx.ellipse(0, 2, width * 0.28, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(image, -width / 2, -height + 4 + bob, width, height);
    ctx.restore();
  }

  function drawLocalCharacters() {
    const now = performance.now();
    const characters = [
      ...localNpcs().map(npc => {
        const pose = npcPoseAt(npc, now);
        return { y: pose.y, draw: () => drawPastNpc(npc, pose, now) };
      }),
      ...sideDungeonEnemies.filter(enemy => enemy.active && isSideQuestArea(activeAreaId())).map(enemy => ({
        y: enemy.y,
        draw: () => drawDungeonEnemySprite(enemy)
      })),
      { y: player.y, draw: drawPlayer }
    ].sort((left, right) => left.y - right.y);
    for (const character of characters) character.draw();
  }

  function drawPastCapitalGate() {
    if (currentEdition !== 'past' || activeAreaId() !== 'overworld') return;
    const x = PAST_START.capitalGatePoint[0] * maskScale;
    const y = PAST_START.capitalGatePoint[1] * maskScale;
    const pulse = 1 + Math.sin(performance.now() / 350) * 0.08;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#210f1ddf';
    ctx.strokeStyle = '#ffc15d';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe3a2';
    ctx.font = '34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♜', 0, 1);
    roundedRectanglePath(ctx, -78, 48, 156, 35, 6);
    ctx.fillStyle = '#21131fe8';
    ctx.fill();
    ctx.strokeStyle = '#c88a48';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffe0a0';
    ctx.font = '700 14px Georgia, "Yu Mincho", serif';
    ctx.fillText('王都入口', 0, 66);
    ctx.restore();
  }

  function drawPastCrossroadsGate() {
    if (currentEdition !== 'past' || activeAreaId() !== 'overworld') return;
    const interaction = pastStoryApi.PAST_INTERACTIONS.find(item => item.id === 'crossroads-gate');
    if (!interaction || !storyUnlocksInteraction(storyState, interaction)) return;
    const image = pastEventImages.get('capital-gate');
    if (!imageIsLoaded(image)) return;
    const x = interaction.point[0] * maskScale;
    const y = interaction.point[1] * maskScale;
    ctx.save();
    ctx.translate(x, y);
    ctx.drawImage(image, -72, -82, 144, 96);
    roundedRectanglePath(ctx, -72, 20, 144, 32, 7);
    ctx.fillStyle = '#21131fe8';
    ctx.fill();
    ctx.strokeStyle = '#e0ae5c';
    ctx.stroke();
    ctx.fillStyle = '#ffe7b5';
    ctx.font = '700 13px Georgia, "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.fillText('交差路の街', 0, 41);
    ctx.restore();
  }

  function drawSideQuestEntrances() {
    if (currentEdition !== 'past' || activeAreaId() !== 'overworld') return;
    for (const quest of SIDE_QUESTS) {
      const status = sideQuestStatus(campaignState.sideQuests, quest.id, campaignState.crossroadsBossDefeated);
      if (!['active', 'completed'].includes(status)) continue;
      const x = quest.overworldPoint[0] * maskScale;
      const y = quest.overworldPoint[1] * maskScale;
      const color = quest.id === 'sunken-shrine' ? '#b47ad0' : quest.id === 'ice-lantern' ? '#9de7ff' : '#ff9a55';
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#17131ddd';
      ctx.beginPath();
      ctx.moveTo(-42, 18);
      ctx.lineTo(-34, -42);
      ctx.quadraticCurveTo(0, -70, 34, -42);
      ctx.lineTo(42, 18);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 430) * 0.12;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, -16, 23, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      roundedRectanglePath(ctx, -88, 27, 176, 34, 7);
      ctx.fillStyle = '#21131fe8';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff0cf';
      ctx.font = '700 12px Georgia, "Yu Mincho", serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${quest.title}${status === 'completed' ? '・鎮静' : `・Lv${quest.recommendedLevel}`}`, 0, 49);
      ctx.restore();
    }
  }

  function drawWatchtowerFog(x, y, width, height) {
    const time = performance.now() / 900;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let index = 0; index < 8; index++) {
      const phase = time + index * 1.37;
      const fogX = x + Math.sin(phase * 0.83) * width * 0.38;
      const fogY = y + Math.cos(phase * 0.61) * height * 0.3 + (index - 3.5) * height * 0.055;
      const radiusX = width * (0.28 + (index % 3) * 0.055);
      const radiusY = height * (0.08 + (index % 2) * 0.025);
      const gradient = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, radiusX);
      gradient.addColorStop(0, 'rgba(181, 77, 255, .38)');
      gradient.addColorStop(0.52, 'rgba(105, 45, 178, .24)');
      gradient.addColorStop(1, 'rgba(65, 22, 105, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(fogX, fogY, radiusX, radiusY, Math.sin(phase) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPastWatchtower() {
    if (currentEdition !== 'past' || activeAreaId() !== 'overworld' || !storyAllowsEncounters(storyState)) return;
    const interaction = pastStoryApi.PAST_INTERACTIONS.find(item => item.id === 'old-watchtower');
    const x = interaction.point[0] * maskScale;
    const y = interaction.point[1] * maskScale;
    const open = canChallengeWatchtower(campaignState);
    const cleared = campaignState.bossDefeated;
    const definition = PAST_EVENT_ASSETS['old-watchtower'];
    const image = pastEventImages.get('old-watchtower');
    if (!imageIsLoaded(image)) return;
    const glow = 0.62 + Math.sin(performance.now() / 280) * 0.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = cleared ? 0.82 : 1;
    ctx.drawImage(image, -definition.width / 2, -definition.height + 12, definition.width, definition.height);
    ctx.globalAlpha = 1;
    if (!cleared) drawWatchtowerFog(0, -102, definition.width * 1.25, definition.height);
    roundedRectanglePath(ctx, -92, 28, 184, 45, 7);
    ctx.fillStyle = '#201220ed';
    ctx.fill();
    ctx.strokeStyle = open ? '#ffbd5e' : '#a877d7';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffe7bc';
    ctx.font = '700 14px Georgia, "Yu Mincho", serif';
    ctx.textAlign = 'center';
    const towerLabel = campaignState.watchtowerReached
      ? `古い見張り台　封印 ${campaignState.sealFragments.length}/4`
      : '古い見張り台・異変';
    ctx.fillText(cleared ? '霧の晴れた見張り台' : open ? '古い見張り台・封印解除' : towerLabel, 0, 56);
    ctx.globalAlpha = cleared ? 0.72 : glow;
    ctx.fillStyle = cleared ? '#d0bd8a' : '#ffb555';
    ctx.beginPath();
    ctx.arc(0, -232, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#261522';
    ctx.font = '900 24px Georgia, serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleared ? '✓' : '!', 0, -230);
    ctx.restore();
  }

  function drawPastCardDiscoveries() {
    if (currentEdition !== 'past' || activeAreaId() !== 'overworld') return;
    const discoveries = pastStoryApi.PAST_INTERACTIONS.filter(interaction =>
      interaction.cardId && canDiscoverCard(campaignState, interaction.cardId));
    const pulse = 0.86 + Math.sin(performance.now() / 320) * 0.08;
    for (const discovery of discoveries) {
      const x = discovery.point[0] * maskScale;
      const y = discovery.point[1] * maskScale;
      const healing = discovery.cardId === 'mend';
      const assetId = healing ? 'card-chest-mend' : 'card-chest-frost';
      const definition = PAST_EVENT_ASSETS[assetId];
      const image = pastEventImages.get(assetId);
      if (!imageIsLoaded(image)) continue;
      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = pulse;
      ctx.drawImage(image, -definition.width / 2, -definition.height + 8, definition.width, definition.height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff5cf';
      ctx.font = '700 14px Georgia, "Yu Mincho", serif';
      ctx.textAlign = 'center';
      ctx.fillText(healing ? '癒光の気配' : '氷晶の気配', 0, 34);
      ctx.restore();
    }
  }

  function drawPastMagicTutor() {
    if (currentEdition !== 'past' || activeAreaId() !== 'overworld') return;
    const tutor = pastStoryApi.PAST_INTERACTIONS.find(interaction => interaction.actionId === 'learn-first-magic');
    if (!tutor) return;
    const x = tutor.point[0] * maskScale;
    const y = tutor.point[1] * maskScale;
    const definition = PAST_EVENT_ASSETS['magic-tutor'];
    const image = pastEventImages.get('magic-tutor');
    if (!imageIsLoaded(image)) return;
    const pulse = 0.75 + Math.sin(performance.now() / 360) * 0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.94 + pulse * 0.04;
    ctx.drawImage(image, -definition.width / 2, -definition.height + 4, definition.width, definition.height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff0c7';
    ctx.font = '700 12px Georgia, "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.fillText('旅の魔導士リゼ', 0, 18);
    ctx.restore();
  }

  function roundedRectanglePath(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  function drawMapLabels() {
    const pastEdition = currentEdition === 'past';
    if (!editionDefinition(currentEdition).showMapLabels) return;
    for (const label of mapLabels) {
      if (
        label.x < camera.x - 220 || label.x > camera.x + innerWidth / camera.zoom + 220 ||
        label.y < camera.y - 160 || label.y > camera.y + innerHeight / camera.zoom + 160
      ) continue;

      const intersection = label.kind === 'intersection';
      const fontSize = intersection ? 27 : 23;
      const height = intersection ? 42 : 36;
      ctx.save();
      ctx.translate(label.x, label.y);
      ctx.rotate(label.angle || 0);
      ctx.font = `700 ${fontSize}px ${pastEdition ? 'Georgia, "Yu Mincho", serif' : '"Yu Gothic", "Meiryo", sans-serif'}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const badgeWidth = label.badge ? Math.max(34, ctx.measureText(label.badge).width + 14) : 0;
      const textWidth = ctx.measureText(label.text).width;
      const width = textWidth + badgeWidth + (label.badge ? 24 : 28);
      const left = -width / 2;
      const top = -height / 2;

      roundedRectanglePath(ctx, left, top, width, height, intersection ? 10 : 7);
      ctx.fillStyle = pastEdition
        ? (intersection ? 'rgba(65, 30, 24, .94)' : 'rgba(42, 24, 30, .86)')
        : (intersection ? 'rgba(18, 29, 34, .94)' : 'rgba(7, 18, 25, .82)');
      ctx.fill();
      ctx.strokeStyle = pastEdition
        ? (intersection ? 'rgba(255, 169, 72, .98)' : 'rgba(215, 146, 88, .72)')
        : (intersection ? 'rgba(244, 196, 73, .95)' : 'rgba(206, 220, 217, .62)');
      ctx.lineWidth = intersection ? 3 : 2;
      ctx.stroke();

      let textX = left + 14;
      if (label.badge) {
        roundedRectanglePath(ctx, left + 4, top + 4, badgeWidth, height - 8, 6);
        ctx.fillStyle = pastEdition ? '#84452f' : '#286b9c';
        ctx.fill();
        ctx.fillStyle = '#fffbe9';
        ctx.font = `800 ${fontSize - 4}px ${pastEdition ? 'Georgia, "Yu Mincho", serif' : '"Yu Gothic", "Meiryo", sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.fillText(label.badge, left + 4 + badgeWidth / 2, 1);
        ctx.textAlign = 'left';
        ctx.font = `700 ${fontSize}px ${pastEdition ? 'Georgia, "Yu Mincho", serif' : '"Yu Gothic", "Meiryo", sans-serif'}`;
        textX = left + badgeWidth + 12;
      }
      ctx.fillStyle = pastEdition ? (intersection ? '#ffd18b' : '#f8ddba') : (intersection ? '#ffe7a0' : '#f5f3e8');
      ctx.fillText(label.text, textX, 1);
      ctx.restore();
    }
  }

  function drawLandmarkGround(landmark) {
    if (currentEdition === 'past' && landmarkMemoryState(landmark.id, memoryStage) === 'fog') return;
    if (!imageIsLoaded(editionLandmarkImages.get(currentEdition).get(landmark.id))) return;
    const shadow = shadowVectorFromLight(1, -1, landmark.shadowLength);
    const castCenterX = landmark.x + shadow.x * 0.78;
    const castCenterY = landmark.y + shadow.y * 0.48;
    ctx.save();
    ctx.translate(castCenterX, castCenterY);
    ctx.rotate(-0.58);
    ctx.filter = 'blur(10px)';
    ctx.fillStyle = '#0610162b';
    ctx.beginPath();
    ctx.ellipse(0, 0, landmark.width * landmark.shadowWidth, Math.max(28, landmark.width * 0.1), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(landmark.x - 12, landmark.y - 2);
    ctx.rotate(-0.08);
    ctx.filter = 'blur(4px)';
    ctx.fillStyle = '#03090d45';
    ctx.beginPath();
    ctx.ellipse(0, 0, landmark.width * 0.37, Math.max(20, landmark.width * 0.065), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawLandmark(landmark) {
    if (currentEdition === 'past' && landmarkMemoryState(landmark.id, memoryStage) === 'fog') {
      drawMemoryFog(landmark);
      return;
    }
    const image = editionLandmarkImages.get(currentEdition).get(landmark.id);
    if (!imageIsLoaded(image)) return;
    const sizeOverride = editionDefinition(currentEdition).landmarkSizeOverrides?.[landmark.id];
    const displayWidth = landmark.width * (sizeOverride?.widthScale || 1);
    const displayHeight = landmark.height * (sizeOverride?.heightScale || 1);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      landmark.x - displayWidth / 2,
      landmark.y - displayHeight,
      displayWidth,
      displayHeight
    );
    ctx.restore();
  }

  function drawMemoryFog(landmark) {
    const time = performance.now() / 1000;
    ctx.save();
    ctx.translate(landmark.x, landmark.y - landmark.height * 0.34);
    ctx.fillStyle = '#b9aed0a8';
    ctx.filter = 'blur(12px)';
    for (let index = 0; index < 7; index++) {
      const offsetX = Math.sin(time * 0.35 + index * 1.7) * landmark.width * 0.14;
      const offsetY = Math.cos(time * 0.28 + index) * landmark.height * 0.06;
      ctx.beginPath();
      ctx.ellipse(offsetX, offsetY, landmark.width * (0.22 + index % 3 * 0.04), landmark.height * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';
    ctx.strokeStyle = '#d9c7ff66';
    ctx.lineWidth = 4;
    ctx.rotate(time * 0.08);
    ctx.beginPath();
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3;
      const radius = landmark.width * 0.11;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.45;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawPastEnemies() {
    if (currentEdition !== 'past' || activeAreaId() !== 'overworld') return;
    const now = performance.now() / 1000;
    for (const enemy of pastEnemies) {
      if (!enemy.active || storyEncounterMode(storyState, enemy.id) === 'hidden') continue;
      const image = pastEnemyImages.get(enemy.enemyId);
      if (!image?.complete || !image.naturalWidth) continue;
      const height = 50;
      const bob = Math.sin(now * 3 + enemy.x) * 1.5;
      const width = height * image.naturalWidth / image.naturalHeight;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.fillStyle = '#0008';
      ctx.beginPath();
      ctx.ellipse(0, 2, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(image, -width / 2, -height + 4 + bob, width, height);
      ctx.restore();
    }
  }

  function drawDepthSortedEntities() {
    const order = renderSequenceForLandmarks(player, landmarks);
    for (const entity of order) {
      if (entity === 'player') drawPlayer();
      else drawLandmark(landmarksById.get(entity.slice('landmark:'.length)));
    }
  }

  function drawCollisionDebug() {
    if (!showCollision) return;
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.drawImage(collisionDebugCanvas, 0, 0, world.w, world.h);
    ctx.restore();
  }

  function drawMini() {
    updateQuestCompass();
    mctx.clearRect(0, 0, 210, 145);
    const areaId = activeAreaId();
    if (currentEdition === 'past' && areaId !== 'overworld') {
      const area = PAST_AREAS[areaId];
      if (areaId === 'crossroads-dungeon') {
        mctx.drawImage(crossroadsDungeonMini, 0, 0);
      } else if (areaId === 'mist-bell-tower') {
        mctx.fillStyle = '#28293a';
        mctx.fillRect(0, 0, 210, 145);
        mctx.strokeStyle = '#9a82c4';
        mctx.lineWidth = 3;
        mctx.strokeRect(12, 8, 186, 129);
      } else if (isSideQuestArea(areaId)) {
        mctx.drawImage(sideDungeonMinis.get(areaId), 0, 0);
      } else {
        const baseAssetId = areaId === 'castle' ? 'castle-interior' : areaId === 'castle-town' ? 'castle-town-ground' : areaId;
        const baseImage = pastSceneImages.get(baseAssetId);
        if (imageIsLoaded(baseImage)) mctx.drawImage(baseImage, 0, 0, 210, 145);
        if (areaId === 'castle-town') {
          const buildings = pastSceneImages.get('castle-town-buildings');
          if (imageIsLoaded(buildings)) mctx.drawImage(buildings, 0, 0, 210, 145);
        }
      }
      mctx.save();
      mctx.scale(210 / area.width, 145 / area.height);
      if (areaId === 'crossroads-dungeon') {
        mctx.fillStyle = campaignState.crossroadsBossDefeated ? '#7ee8cb' : '#e4a15f';
        for (const gate of CROSSROADS_WATERGATES) {
          mctx.fillRect(gate.point[0] - 30, gate.point[1] - 30, 60, 60);
        }
        const altar = pastStoryApi.PAST_INTERACTIONS.find(interaction => interaction.id === 'crossroads-boss-altar');
        if (altar) {
          mctx.strokeStyle = campaignState.crossroadsBossDefeated ? '#b9fff0' : '#e8a2ff';
          mctx.lineWidth = 12;
          mctx.beginPath();
          mctx.arc(altar.point[0], altar.point[1], 46, 0, Math.PI * 2);
          mctx.stroke();
        }
      } else if (isSideQuestArea(areaId)) {
        const quest = sideQuestForArea(areaId);
        mctx.strokeStyle = campaignState.sideQuests.completedQuestIds.includes(quest.id) ? '#b9ffe4' : '#e5adff';
        mctx.lineWidth = 12;
        mctx.beginPath();
        mctx.arc(1350, 150, 42, 0, Math.PI * 2);
        mctx.stroke();
        mctx.fillStyle = '#dc6258';
        for (const enemy of sideDungeonEnemies) {
          if (!enemy.active) continue;
          mctx.beginPath();
          mctx.arc(enemy.x, enemy.y, 18, 0, Math.PI * 2);
          mctx.fill();
        }
      }
      mctx.fillStyle = '#fff';
      mctx.beginPath();
      mctx.arc(player.x, player.y, 24, 0, Math.PI * 2);
      mctx.fill();
      mctx.strokeStyle = '#dc5748';
      mctx.lineWidth = 8;
      mctx.stroke();
      mctx.restore();
      return;
    }
    if (ready) {
      for (const tile of editionTiles.get(currentEdition)) {
        if (!imageIsLoaded(tile.image)) continue;
        mctx.drawImage(tile.image, tile.col * 105, tile.row * 72.5, 105, 72.5);
      }
      if (showCollision) {
        mctx.save();
        mctx.globalAlpha = 0.4;
        mctx.drawImage(collisionDebugCanvas, 0, 0, 210, 145);
        mctx.restore();
      }
    }
    mctx.fillStyle = '#fff';
    mctx.beginPath();
    mctx.arc(player.x / world.w * 210, player.y / world.h * 145, 4, 0, Math.PI * 2);
    mctx.fill();
    mctx.strokeStyle = '#dc5748';
    mctx.stroke();
    mctx.fillStyle = '#f0c85c';
    for (const landmark of landmarks) {
      if (currentEdition === 'past' && landmarkMemoryState(landmark.id, memoryStage) === 'fog') continue;
      const markerX = landmark.x / world.w * 210;
      const markerY = landmark.y / world.h * 145;
      mctx.beginPath();
      mctx.moveTo(markerX, markerY - 5);
      mctx.lineTo(markerX + 5, markerY);
      mctx.lineTo(markerX, markerY + 5);
      mctx.lineTo(markerX - 5, markerY);
      mctx.closePath();
      mctx.fill();
    }
    if (currentEdition === 'past') {
      if (storyAllowsEncounters(storyState)) {
        const tower = pastStoryApi.PAST_INTERACTIONS.find(item => item.id === 'old-watchtower');
        mctx.fillStyle = campaignState.bossDefeated ? '#d0bd8a' : canChallengeWatchtower(campaignState) ? '#ffb555' : '#ac69df';
        const towerX = tower.point[0] / mapLayout.width * 210;
        const towerY = tower.point[1] / mapLayout.height * 145;
        mctx.beginPath();
        mctx.arc(towerX, towerY, 5, 0, Math.PI * 2);
        mctx.fill();
        mctx.strokeStyle = '#fff1bd';
        mctx.lineWidth = 1.5;
        mctx.stroke();
      }
      mctx.fillStyle = '#e65f58';
      for (const enemy of pastEnemies) {
        if (!enemy.active || storyEncounterMode(storyState, enemy.id) === 'hidden') continue;
        mctx.beginPath();
        mctx.arc(enemy.x / world.w * 210, enemy.y / world.h * 145, 2.5, 0, Math.PI * 2);
        mctx.fill();
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.save();
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    if (ready) {
      drawMap();
      if (currentEdition === 'past' && activeAreaId() !== 'overworld') {
        drawLocalCharacters();
      } else {
        for (const landmark of landmarks) drawLandmarkGround(landmark);
        drawCollisionDebug();
        drawMapLabels();
        drawPastWatchtower();
        drawPastCardDiscoveries();
        drawDepthSortedEntities();
        drawPastCapitalGate();
        drawPastCrossroadsGate();
        drawSideQuestEntrances();
        drawPastEnemies();
        drawPastMagicTutor();
      }
    }
    ctx.restore();

    const shade = ctx.createRadialGradient(
      innerWidth / 2,
      innerHeight / 2,
      innerHeight * 0.25,
      innerWidth / 2,
      innerHeight / 2,
      innerHeight * 0.85
    );
    shade.addColorStop(0, 'transparent');
    shade.addColorStop(1, 'rgba(0,5,9,.12)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
    drawMini();
  }

  function renderBattle() {
    if (!activeBattle) return;
    const enemy = activeBattle.enemy;
    const tutorialRescue = activeBattle.status === 'rescue';
    battleOverlay.classList.toggle('is-boss', Boolean(enemy.boss));
    const intent = ENEMY_INTENTS[enemy.intentId];
    const intentRevealed = activeBattle.intentRevealed;
    document.querySelector('#v2-battle-enemy-name').textContent = enemy.name;
    const intentCard = document.querySelector('.v2-enemy-intent-card');
    intentCard.dataset.intent = intentRevealed ? intent.id : 'hidden';
    document.querySelector('#v2-battle-intent-icon').textContent = intentRevealed ? intent.icon : '？';
    document.querySelector('#v2-battle-intent').textContent = intentRevealed ? intent.name : '予兆不明';
    document.querySelector('#v2-battle-intent-detail').textContent = intentRevealed ? intent.description : '「眼」で次の3行動を見抜く';
    document.querySelector('#v2-battle-intent-hint').textContent = intentRevealed ? intent.counterLabel : '？？';
    const enemyImage = document.querySelector('#v2-battle-enemy-image');
    const enemyImageAsset = pastEnemyImages.get(enemy.id);
    enemyImage.src = enemyImageAsset?.src || '';
    enemyImage.alt = enemy.name;
    document.querySelector('#v2-battle-enemy-hp').style.width = `${enemy.hp / enemy.maxHp * 100}%`;
    const playerHp = document.querySelector('#v2-battle-player-hp');
    const playerHpVital = playerHp.closest('[data-vital="hp"]');
    playerHp.textContent = `${activeBattle.player.hp} / ${activeBattle.player.maxHp}`;
    playerHpVital.dataset.hpState = hpCondition(activeBattle.player.hp, activeBattle.player.maxHp);
    document.querySelector('#v2-battle-player-mp').textContent = `${activeBattle.player.mp} / ${activeBattle.player.maxMp}`;
    document.querySelector('#v2-battle-player-level').textContent = `Lv ${campaignState.level}`;
    const spentEnergy = activeBattle.selectedCost || 0;
    document.querySelector('#v2-battle-energy').textContent = `${'◆'.repeat(activeBattle.energy - spentEnergy)}${'◇'.repeat(spentEnergy)}`;
    const action = previewAction(activeBattle.selected);
    const actionDetails = [
      action.damage ? `威力${action.damage}` : '',
      action.block ? `防御${action.block}` : '',
      action.heal ? `回復${action.heal}` : '',
      action.mpCost ? `MP-${action.mpCost}` : '',
      action.mpRestore ? `MP+${action.mpRestore}` : ''
    ].filter(Boolean).join(' · ');
    document.querySelector('#v2-battle-preview').textContent = `${action.name}${actionDetails ? ` · ${actionDetails}` : ''}`;
    document.querySelector('#v2-battle-log').textContent = activeBattle.log.slice(-2).join('　');
    battleResolve.disabled = activeBattle.status === 'active' && !activeBattle.selected.length;
    battleResolve.textContent = tutorialRescue
      ? '王都兵が駆けつけた'
      : activeBattle.status === 'victory'
      ? `勝利 · ${activeBattle.reward.gold}G / ${activeBattle.reward.xp}EXP`
      : activeBattle.status === 'defeat' ? '王都で目覚める' : '行動する';
    battleFlee.hidden = tutorialRescue;
    battleFlee.disabled = activeBattle.status !== 'active';
    const redrawWindowOpen = activeBattle.status === 'active' && activeBattle.turn === 1
      && activeBattle.openingRedrawAvailable && !activeBattle.selected.length;
    const canRedraw = redrawWindowOpen && (!battleRedrawSelecting || battleRedrawIndices.size > 0);
    battleRedraw.hidden = tutorialRescue || activeBattle.status !== 'active' || activeBattle.turn !== 1 || !activeBattle.openingRedrawAvailable;
    battleRedraw.disabled = !canRedraw;
    battleRedraw.setAttribute('aria-pressed', String(battleRedrawSelecting));
    battleRedraw.textContent = battleRedrawSelecting
      ? `選んだ${battleRedrawIndices.size}枚を交換`
      : '手札を選んで交換';
    battleRedrawCancel.hidden = !battleRedrawSelecting;
    battleHand.replaceChildren(...activeBattle.hand.map((cardId, index) => {
      const card = CARD_LIBRARY[cardId];
      const selectedCountBefore = activeBattle.hand.slice(0, index).filter(id => id === cardId).length;
      const selectedOccurrence = activeBattle.selectedIndices?.includes(index)
        || (!activeBattle.selectedIndices?.length && activeBattle.selected.filter(id => id === cardId).length > selectedCountBefore);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v2-card';
      button.dataset.card = cardId;
      button.dataset.discipline = card.discipline;
      button.dataset.attribute = card.attribute;
      const redrawSelected = battleRedrawSelecting && battleRedrawIndices.has(index);
      button.classList.toggle('is-redraw-choice', redrawSelected);
      if (card.element) button.dataset.element = card.element;
      button.setAttribute('aria-pressed', String(battleRedrawSelecting ? redrawSelected : selectedOccurrence));
      const remainingMp = activeBattle.player.mp - action.mpCost;
      const remainingEnergy = activeBattle.energy - spentEnergy;
      const canAffordMp = selectedOccurrence || (card.mpCost || 0) <= remainingMp;
      const canAffordEnergy = selectedOccurrence || card.cost <= remainingEnergy;
      button.disabled = activeBattle.status !== 'active' || (!battleRedrawSelecting && (!canAffordMp || !canAffordEnergy));
      const mpCost = card.mpCost
        ? `<span class="v2-card-mp-cost" aria-label="消費MP ${card.mpCost}">MP${card.mpCost}</span>`
        : '';
      button.innerHTML = `
        <span class="v2-card-frame" aria-hidden="true"></span>
        <span class="v2-card-cost" aria-label="消費行動力 ${card.cost}">◆${card.cost}</span>
        ${mpCost}
        <span class="v2-card-kindbar"><b class="v2-card-type"><small>種別</small>${DISCIPLINE_LABELS[card.discipline]}</b><b class="v2-card-attribute" data-attribute="${card.attribute}"><small>属性</small>${CARD_ATTRIBUTE_LABELS[card.attribute]}</b></span>
        <span class="v2-card-art" aria-hidden="true"><i>${card.icon}</i></span>
        <span class="v2-card-copy"><strong>${card.name}</strong><small>${card.description}</small></span>`;
      button.addEventListener('click', () => {
        if (battleRedrawSelecting) {
          if (battleRedrawIndices.has(index)) battleRedrawIndices.delete(index);
          else battleRedrawIndices.add(index);
          renderBattle();
          return;
        }
        activeBattle = toggleCard(activeBattle, cardId, index);
        if (activeBattle.readyToResolve) resolveSelectedAction();
        else renderBattle();
      });
      return button;
    }));
  }

  function resetBattleEffects() {
    const enemyPanel = document.querySelector('.v2-battle-enemy');
    window.clearTimeout(battleEffectTimer);
    battleEffectTimer = 0;
    battleOverlay.classList.remove('is-player-hit');
    enemyPanel.classList.remove('is-hit', 'is-weak', 'is-countered');
    battleDamageFlash.classList.remove('is-active');
    battleEffects.replaceChildren();
    battleEffects.removeAttribute('aria-label');
  }

  function addCombatImpact(target) {
    const impact = document.createElement('i');
    impact.className = `v2-combat-impact v2-combat-impact--${target}`;
    impact.setAttribute('aria-hidden', 'true');
    battleEffects.append(impact);
  }

  function playBattleEffects(effects = []) {
    const enemyPanel = document.querySelector('.v2-battle-enemy');
    const weakness = effects.find(effect => effect.type === 'weakness');
    const counter = effects.find(effect => effect.type === 'counter');
    const enemyDamage = effects.find(effect => effect.type === 'damage' && effect.target === 'enemy');
    const playerDamage = effects.find(effect => effect.type === 'damage' && effect.target === 'player');
    const playerHeal = effects.find(effect => effect.type === 'heal' && effect.target === 'player');
    const playerMp = effects.find(effect => effect.type === 'mp' && effect.target === 'player');
    resetBattleEffects();
    void enemyPanel.offsetWidth;

    const announcements = [];
    if (counter) {
      enemyPanel.classList.add('is-countered');
      const label = document.createElement('strong');
      label.className = 'v2-combat-effect v2-combat-effect--counter';
      label.textContent = `看破成功！ ${counter.label}`;
      battleEffects.append(label);
      announcements.push(label.textContent);
    }
    if (weakness) {
      enemyPanel.classList.add('is-weak');
      const label = document.createElement('strong');
      label.className = `v2-combat-effect v2-combat-effect--weakness v2-combat-effect--${weakness.element}`;
      label.textContent = `弱点！ ${weakness.label}属性 ×${weakness.multiplier}`;
      battleEffects.append(label);
      announcements.push(label.textContent);
    }
    if (enemyDamage) {
      enemyPanel.classList.add('is-hit');
      addCombatImpact('enemy');
      const label = document.createElement('strong');
      label.className = 'v2-combat-effect v2-combat-effect--enemy-damage';
      label.textContent = `-${enemyDamage.amount}`;
      battleEffects.append(label);
      announcements.push(`敵に${enemyDamage.amount}ダメージ`);
    }
    if (playerDamage) {
      battleOverlay.classList.add('is-player-hit');
      battleDamageFlash.classList.add('is-active');
      addCombatImpact('player');
      const label = document.createElement('strong');
      label.className = 'v2-combat-effect v2-combat-effect--player-damage';
      label.textContent = `-${playerDamage.amount} HP`;
      battleEffects.append(label);
      announcements.push(`主人公に${playerDamage.amount}ダメージ`);
    }
    if (playerHeal) {
      const label = document.createElement('strong');
      label.className = 'v2-combat-effect v2-combat-effect--player-heal';
      label.textContent = `+${playerHeal.amount} HP`;
      battleEffects.append(label);
      announcements.push(`HPが${playerHeal.amount}回復`);
    }
    if (playerMp) {
      const label = document.createElement('strong');
      label.className = 'v2-combat-effect v2-combat-effect--player-mp';
      label.textContent = `+${playerMp.amount} MP`;
      battleEffects.append(label);
      announcements.push(`MPが${playerMp.amount}回復`);
    }
    battleEffects.setAttribute('aria-label', announcements.join('。'));
    battleEffectTimer = window.setTimeout(resetBattleEffects, 1050);
  }

  function playEncounterTransition(altarAwakening = false) {
    const transitionTitle = encounterTransition.querySelector('strong');
    encounterTransition.classList.toggle('is-altar-awakening', altarAwakening);
    transitionTitle.textContent = altarAwakening ? '封印が目覚める' : 'ENCOUNTER';
    encounterTransition.setAttribute('aria-hidden', 'false');
    encounterTransition.classList.remove('is-active', 'is-revealing');
    void encounterTransition.offsetWidth;
    encounterTransition.classList.add('is-active');
    return new Promise(resolve => window.setTimeout(resolve, 620));
  }

  function resetEncounterTransition() {
    encounterTransition.classList.remove('is-active', 'is-revealing', 'is-altar-awakening');
    encounterTransition.querySelector('strong').textContent = 'ENCOUNTER';
    encounterTransition.setAttribute('aria-hidden', 'true');
    encounterTransitioning = false;
  }

  function resolveSelectedAction() {
    if (!activeBattle || activeBattle.status !== 'active' || !activeBattle.selected.length) return;
    battleRedrawSelecting = false;
    battleRedrawIndices.clear();
    activeBattle = resolveTurn(activeBattle);
    renderBattle();
    playBattleEffects(activeBattle.effects);
  }

  async function openBattle(encounter) {
    if (activeBattle || encounterTransitioning) return;
    encounterTransitioning = true;
    battleRedrawSelecting = false;
    battleRedrawIndices.clear();
    keys.clear();
    resetMapDrag();
    try {
      await Promise.all([
        playEncounterTransition(Boolean(encounter.altarAwakening)),
        assetLoader.load(enemyAssetKey(encounter.enemyId))
      ]);
    } catch (error) {
      console.error(error);
      resetEncounterTransition();
      return;
    }
    if (currentEdition !== 'past') {
      resetEncounterTransition();
      return;
    }
    const tutorialRescue = storyEncounterMode(storyState, encounter.id) === 'tutorial';
    activeEncounter = tutorialRescue ? { ...encounter, tutorialRescue: true } : encounter;
    activeBattle = createBattle(encounter.enemyId, Math.random, battleProfile(campaignState));
    if (encounter.id === 'mist-bell-boss') {
      const investigation = mistInvestigationResult(storyState);
      const weakness = investigation.bossWeakness === '氷' ? 'ice' : 'fire';
      activeBattle = {
        ...activeBattle,
        player: { ...activeBattle.player, block: 4 },
        enemy: { ...activeBattle.enemy, weakness },
        log: [`弟ノアが帰還路を支え、${investigation.ally}が援護する。${investigation.bossWeakness}属性が霧鐘へ響く！`]
      };
    }
    if (tutorialRescue) {
      activeBattle = {
        ...activeBattle,
        status: 'rescue',
        log: ['見たことのない異形が道を塞いだ。背後から王都兵の声が響く！']
      };
    }
    resetBattleEffects();
    battleOverlay.setAttribute('aria-hidden', 'false');
    renderBattle();
    encounterTransition.classList.add('is-revealing');
    window.setTimeout(resetEncounterTransition, 420);
  }

  function closeBattle(result) {
    if (!activeBattle) return;
    battleRedrawSelecting = false;
    battleRedrawIndices.clear();
    const encounter = activeEncounter;
    const practice = encounter?.id === 'practice';
    const bossVictory = result === 'victory' && encounter?.id === 'watchtower-boss';
    const crossroadsBossVictory = result === 'victory' && encounter?.id === 'crossroads-boss';
    const mistBossVictory = result === 'victory' && encounter?.id === 'mist-bell-boss';
    const completedSideQuest = result === 'victory' ? sideQuestForEncounter(encounter?.id) : null;
    const sideQuestBossVictory = Boolean(completedSideQuest);
    const fireRatVictory = result === 'victory' && encounter?.id === 'sidequest-fire-rat-chief';
    let followUpDialogue = null;
    if (result === 'rescued' && encounter?.tutorialRescue) {
      const rescuedStory = completeStoryEvent(storyState, 'arrival-rescue-complete');
      transitionStoryArea({
        state: { ...rescuedStory, area: 'castle-town' },
        spawn: PAST_AREAS['castle-town'].spawn
      });
      followUpDialogue = STORY_DIALOGUES['capital-rescue'];
    } else if (result === 'victory' && encounter && !practice) {
      storyState = addStoryGold(storyState, activeBattle.reward.gold);
      const outcome = applyBattleVictory(campaignState, {
        xp: activeBattle.reward.xp,
        playerHp: activeBattle.player.hp,
        playerMp: activeBattle.player.mp,
        encounterId: encounter.id
      });
      campaignState = outcome.state;
      const sideQuestOutcome = applySideQuestBattleVictory(campaignState, encounter.id);
      campaignState = sideQuestOutcome.state;
      savePastCampaign();
      savePastStory();
      const now = performance.now();
      pastEnemies = pastEnemies.map(enemy => enemy.id === encounter.id
        ? { ...enemy, active: false, respawnAt: now + 300000 }
        : enemy);
      sideDungeonEnemies = sideDungeonEnemies.map(enemy => enemy.id === encounter.id
        ? { ...enemy, active: false, respawnAt: now + 300000 }
        : enemy);
      if (bossVictory) {
        commitStoryEvent('watchtower-boss-defeated');
        const levelLines = outcome.leveledUp
          ? [{ speaker: '地の文', text: `レベルが${campaignState.level}に上がった！ HPとMPが全回復し、行動力は${battleProfile(campaignState).energy}になった。` }]
          : [];
        followUpDialogue = {
          id: 'watchtower-victory-result',
          onComplete: 'watchtower-return-to-king',
          lines: [...levelLines, ...STORY_DIALOGUES['watchtower-cleared'].lines]
        };
      } else if (crossroadsBossVictory) {
        const levelLines = outcome.leveledUp
          ? [{ speaker: '地の文', text: `レベルが${campaignState.level}に上がった！ HPとMPが全回復した。` }]
          : [];
        followUpDialogue = {
          id: 'crossroads-victory-result',
          onComplete: 'crossroads-boss-defeated',
          lines: [...levelLines, ...STORY_DIALOGUES['crossroads-boss-cleared'].lines]
        };
      } else if (mistBossVictory) {
        const levelLines = outcome.leveledUp
          ? [{ speaker: '地の文', text: `レベルが${campaignState.level}に上がった！ HPとMPが全回復した。` }]
          : [];
        followUpDialogue = {
          id: 'mist-bell-victory-result',
          onComplete: 'mist-boss-defeated',
          lines: [...levelLines, ...STORY_DIALOGUES['mist-boss-cleared'].lines]
        };
      } else if (sideQuestBossVictory) {
        const levelLines = outcome.leveledUp
          ? [{ speaker: '地の文', text: `レベルが${campaignState.level}に上がった！ HPとMPが全回復した。` }]
          : [];
        const vowLines = campaignState.sideQuests.twinStarVowUnlocked && !campaignState.sideQuests.twinStarVowSeen
          ? STORY_DIALOGUES['twin-star-vow'].lines
          : [];
        if (vowLines.length) {
          campaignState = { ...campaignState, sideQuests: markTwinStarVowSeen(campaignState.sideQuests) };
          savePastCampaign();
        }
        followUpDialogue = {
          id: `${completedSideQuest.id}-victory-result`,
          lines: [
            ...levelLines,
            { speaker: '地の文', text: sideQuestOutcome.message },
            ...STORY_DIALOGUES[`${completedSideQuest.id}-cleared`].lines,
            ...vowLines
          ]
        };
      } else if (fireRatVictory) {
        followUpDialogue = {
          id: 'fire-rat-chief-victory-result',
          lines: [
            { speaker: '地の文', text: sideQuestOutcome.message },
            ...STORY_DIALOGUES['fire-rat-chief-cleared'].lines
          ]
        };
      } else if (outcome.leveledUp) {
        followUpDialogue = {
          id: 'level-up',
          lines: [{ speaker: '地の文', text: `レベルが${campaignState.level}に上がった！ HPとMPが全回復し、行動力は${battleProfile(campaignState).energy}になった。` }]
        };
      }
    } else if (result === 'defeat' && !practice) {
      const defeated = resolveDefeat(campaignState, storyState.gold);
      campaignState = defeated.state;
      storyState = { ...storyState, gold: defeated.gold };
      savePastCampaign();
      transitionStoryArea({
        state: { ...storyState, area: 'castle-town' },
        spawn: PAST_AREAS['castle-town'].spawn
      });
      followUpDialogue = {
        id: 'defeat-return',
        lines: [{ speaker: '宿屋の女将', text: `王都の兵士が運んできてくれたよ。所持金は${storyState.gold}Gになったが、命があって何よりさ。` }]
      };
    } else if (result === 'fled' && !practice) {
      campaignState = {
        ...campaignState,
        currentHp: Math.max(1, activeBattle.player.hp),
        currentMp: Math.max(0, activeBattle.player.mp)
      };
      savePastCampaign();
      if (encounter) {
        const now = performance.now();
        pastEnemies = pastEnemies.map(enemy => enemy.id === encounter.id
          ? { ...enemy, active: false, respawnAt: now + 5000 }
          : enemy);
        sideDungeonEnemies = sideDungeonEnemies.map(enemy => enemy.id === encounter.id
          ? { ...enemy, active: false, respawnAt: now + 5000 }
          : enemy);
      }
    }
    if (!practice && (activeAreaId() === 'overworld' || isSideQuestArea(activeAreaId())) && ['victory', 'fled'].includes(result)) {
      encounterGraceUntil = performance.now() + FIELD_ENCOUNTER_GRACE_MS;
    }
    activeBattle = null;
    activeEncounter = null;
    resetBattleEffects();
    battleOverlay.classList.remove('is-boss');
    battleOverlay.setAttribute('aria-hidden', 'true');
    battleFlee.hidden = false;
    battleFlee.disabled = false;
    updateStoryStatus();
    if (followUpDialogue && bossVictory) {
      playWatchtowerEffect('mist-clearing').then(() => openStoryDialogue(followUpDialogue));
    } else if (followUpDialogue) openStoryDialogue(followUpDialogue);
  }

  battleResolve.addEventListener('click', () => {
    if (!activeBattle) return;
    if (activeBattle.status === 'rescue') return closeBattle('rescued');
    if (activeBattle.status === 'victory') return closeBattle('victory');
    if (activeBattle.status === 'defeat') return closeBattle('defeat');
    resolveSelectedAction();
  });
  battleRedraw.addEventListener('click', () => {
    if (!activeBattle || battleRedraw.disabled) return;
    if (!battleRedrawSelecting) {
      battleRedrawSelecting = true;
      battleRedrawIndices.clear();
    } else {
      activeBattle = redrawOpeningCards(activeBattle, [...battleRedrawIndices]);
      battleRedrawSelecting = false;
      battleRedrawIndices.clear();
    }
    renderBattle();
  });
  battleRedrawCancel.addEventListener('click', () => {
    battleRedrawSelecting = false;
    battleRedrawIndices.clear();
    renderBattle();
  });
  battleFlee.addEventListener('click', () => closeBattle('fled'));
  battlePractice.addEventListener('click', () => {
    if (currentEdition !== 'past' || activeBattle) return;
    openBattle({ id: 'practice', enemyId: 'mist-slime' });
  });

  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.033);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  setCollisionDisplay(false);
  setEdition(currentEdition, false);
  requestAnimationFrame(loop);
})();
