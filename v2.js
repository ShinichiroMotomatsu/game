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
  const infoToggle = document.querySelector('#v2-info-toggle');
  const battleOverlay = document.querySelector('#v2-battle');
  const battleHand = document.querySelector('#v2-battle-hand');
  const battleResolve = document.querySelector('#v2-battle-resolve');
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
  const interactionPrompt = document.querySelector('#v2-interaction-prompt');
  const dialogueOverlay = document.querySelector('#v2-dialogue');
  const dialogueSpeaker = document.querySelector('#v2-dialogue-speaker');
  const dialogueText = document.querySelector('#v2-dialogue-text');
  const dialogueNext = document.querySelector('#v2-dialogue-next');
  const shopOverlay = document.querySelector('#v2-shop');
  const shopTitle = document.querySelector('#v2-shop-title');
  const shopGold = document.querySelector('#v2-shop-gold');
  const shopMessage = document.querySelector('#v2-shop-message');
  const shopList = document.querySelector('#v2-shop-list');
  const shopClose = document.querySelector('#v2-shop-close');
  const dragGuide = document.querySelector('#v2-drag-guide');
  const dragGuideKnob = dragGuide.querySelector('span');
  const landmarkGeometry = window.V2_LANDMARK_GEOMETRY;
  const editionApi = window.V2_EDITIONS;
  const assetApi = window.V2_ASSETS;
  const battleApi = window.V2_BATTLE;
  const pastWorldApi = window.V2_PAST_WORLD;
  const pastCampaignApi = window.V2_PAST_CAMPAIGN;
  const pastSceneApi = window.V2_PAST_SCENES;
  const pastStoryApi = window.V2_PAST_STORY;
  const dialogueApi = window.V2_DIALOGUE;
  const saveApi = window.V2_SAVE;
  const inputApi = window.V2_INPUT;
  const mapLayout = window.V2_MAP_LAYOUT;
  if (!landmarkGeometry || !editionApi || !assetApi || !battleApi || !pastWorldApi || !pastCampaignApi || !pastSceneApi || !pastStoryApi || !dialogueApi || !saveApi || !inputApi || !mapLayout) {
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
  const { CARD_LIBRARY, ENEMY_INTENTS, createBattle, previewAction, resolveTurn, toggleCard } = battleApi;
  const { advancePatrol, createPastEnemies, landmarkMemoryState, nextMemoryStage, respawnPastEnemies, shouldStartEncounter } = pastWorldApi;
  const { consumePastRestart } = saveApi;
  const { dragMovementVector } = inputApi;
  const { NPC_SPRITE_ASSETS, PAST_EVENT_ASSETS, PAST_SCENE_ASSETS, npcPoseAt } = pastSceneApi;
  const { createTypewriterLine, revealTypewriterLine, tickTypewriterLine, typewriterText } = dialogueApi;
  const {
    SHOP_CATALOG,
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
    openDungeonTreasure,
    reachWatchtower,
    resolveDefeat,
    restAtInn,
    useItem
  } = pastCampaignApi;
  const {
    CASTLE_NPCS,
    CROSSROADS_NPCS,
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
    storyAllowsEncounters,
    storyUnlocksInteraction,
    storyObjective
  } = pastStoryApi;
  const campaignProducts = new Map(Object.values(SHOP_CATALOG).flat().map(product => [product.id, product]));

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
  let memoryStage = Number.parseInt(localStorage.getItem('roppongi-past-memory-stage') || '0', 10);
  if (!Number.isFinite(memoryStage)) memoryStage = 0;
  let activeBattle = null;
  let activeEncounter = null;
  let battleEffectTimer = 0;
  let encounterTransitioning = false;
  let ready = false;
  let currentEdition = normalizeEdition(restartRequest.edition);
  let storyPanelVisible = localStorage.getItem('roppongi-past-story-panel') !== 'hidden';
  let storyState = loadPastStory();
  let campaignState = loadPastCampaign();
  pastEnemies = pastEnemies.map(enemy => campaignState.defeatedRoadEnemies.includes(enemy.id)
    ? { ...enemy, active: false, respawnAt: performance.now() + 300000 }
    : enemy);
  let activeStoryDialogue = null;
  let storyDialogueIndex = 0;
  let activeTypewriterLine = null;
  let dialogueTypeTimer = 0;
  let activeInteraction = null;
  let activeServiceId = null;
  let activeLocationKey = 'modern-overworld';
  const locationPositions = new Map([
    ['modern-overworld', [roppongiCrossing.point[0] * maskScale, roppongiCrossing.point[1] * maskScale]],
    ['past-overworld', [PAST_START.point[0] * maskScale, PAST_START.point[1] * maskScale]],
    ['past-castle-town', [...PAST_AREAS['castle-town'].spawn]],
    ['past-castle', [...PAST_AREAS.castle.spawn]],
    ['past-crossroads-town', [...PAST_AREAS['crossroads-town'].spawn]],
    ['past-crossroads-dungeon', [...PAST_AREAS['crossroads-dungeon'].spawn]]
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
    ['crossroads-sentinel', 'crossroads-sentinel.png']
  ];
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
    const image = assetLoader.register(eventAssetKey(eventId), `${definition.path}?event=1`);
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
        ...Object.keys(PAST_EVENT_ASSETS).map(eventAssetKey)
      ];
    }
    if (activeAreaId() === 'castle-town') {
      return [
        ...playerAssets,
        sceneAssetKey('castle-town-ground'),
        sceneAssetKey('castle-town-buildings'),
        ...new Set(TOWN_NPCS.map(npc => npcAssetKey(npc.sprite)))
      ];
    }
    if (activeAreaId() === 'crossroads-town') {
      return [
        ...playerAssets,
        sceneAssetKey('crossroads-town'),
        ...new Set(CROSSROADS_NPCS.map(npc => npcAssetKey(npc.sprite)))
      ];
    }
    if (activeAreaId() === 'crossroads-dungeon') {
      return [
        ...playerAssets,
        sceneAssetKey('crossroads-dungeon'),
        eventAssetKey('card-chest-frost'),
        eventAssetKey('card-chest-mend'),
        enemyAssetKey('crossroads-sentinel')
      ];
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
      if (currentEdition === 'past' && !storyState.arrivalSeen) openStoryDialogue(STORY_DIALOGUES.arrival);
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
    storyObjectiveLabel.textContent = storyState.phase === 'first-mission'
      ? campaignObjective(campaignState)
      : storyObjective(storyState);
    storyStatus.dataset.phase = storyState.phase;
    storyStatus.dataset.level = String(campaignState.level);
    storyStatus.dataset.energy = String(profile.energy);
    storyStatus.dataset.roadVictories = String(campaignState.roadVictories);
    storyStatus.dataset.bossDefeated = String(campaignState.bossDefeated);
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
    if (complete && eventId === 'watchtower-return-to-king') {
      transitionStoryArea({ state: { ...storyState, area: 'castle' }, spawn: [500, 430] });
    } else if (complete && eventId) commitStoryEvent(eventId);
  }

  function serviceTitle(serviceId) {
    return {
      weapon: '武器屋「鉄蜘蛛」',
      armor: '防具屋「銀の殻」',
      item: '道具屋「旅支度」',
      card: 'カード屋「星札堂」',
      inn: '宿屋「夕映え亭」',
      bag: 'もちもの・装備'
    }[serviceId] || '城下町の店';
  }

  function itemOwnedLabel(product) {
    if (product.type === 'weapon' && campaignState.equipment.weapon === product.id) return '装備中';
    if (product.type === 'armor' && campaignState.equipment.armor === product.id) return '装備中';
    if (product.type === 'card' && campaignState.ownedCards.includes(product.id)) return '所持済み';
    if (product.type === 'item') return `所持 ${campaignState.inventory[product.id] || 0}`;
    return '';
  }

  function createServiceButton({ name, detail, price = null, badge = '', disabled = false, onClick }) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'v2-shop-item';
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

  function renderService() {
    if (!activeServiceId) return;
    shopTitle.textContent = serviceTitle(activeServiceId);
    shopGold.textContent = `${storyState.gold.toLocaleString('ja-JP')} G`;
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
      entries.push(createServiceButton({
        name: '無料で一晩泊まる',
        detail: `HPとMPを全回復　HP ${campaignState.currentHp}/${profile.maxHp}・MP ${campaignState.currentMp}/${profile.maxMp}`,
        onClick: () => {
          const result = restAtInn(campaignState, storyState.gold);
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
    } else {
      for (const product of SHOP_CATALOG[activeServiceId] || []) {
        const badge = itemOwnedLabel(product);
        const uniqueOwned = badge === '装備中' || badge === '所持済み';
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
    activeServiceId = serviceId;
    keys.clear();
    resetMapDrag();
    updateInteractionPrompt(null);
    shopMessage.textContent = serviceId === 'bag' ? '道具を使うか、装備を確認できます。' : '何を買いますか？';
    if (serviceId === 'inn') shopMessage.textContent = '新大陸へ来た旅人は無料です。旅の疲れをすっかり癒やします。';
    renderService();
    shopOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeService() {
    activeServiceId = null;
    shopOverlay.setAttribute('aria-hidden', 'true');
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
    if (interaction.actionId === 'learn-first-magic') return true;
    if (interaction.cardId) return canDiscoverCard(campaignState, interaction.cardId);
    if (interaction.actionId?.startsWith('dungeon-treasure:')) {
      return !campaignState.openedDungeonChests.includes(interaction.actionId.split(':')[1]);
    }
    if (interaction.actionId === 'crossroads-boss') return !campaignState.crossroadsBossDefeated;
    return true;
  }

  function transitionStoryArea(result) {
    const previousArea = storyState.area;
    locationPositions.set(activeLocationKey, [player.x, player.y]);
    storyState = result.state;
    if (storyState.area !== previousArea && storyState.area !== 'overworld') {
      pastEnemies = respawnPastEnemies(pastEnemies);
    }
    savePastStory();
    activeLocationKey = locationKey('past', storyState.area);
    const spawn = result.spawn || PAST_AREAS[storyState.area].spawn;
    const scale = storyState.area === 'overworld' ? maskScale : 1;
    const intendedSpawn = [spawn[0] * scale, spawn[1] * scale];
    const safeSpawn = storyState.area === 'overworld'
      ? nearestWalkablePoint(intendedSpawn, (x, y) => canStandAt(x, y))
      : intendedSpawn;
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
    if (currentEdition !== 'past' || !activeInteraction || activeStoryDialogue || activeBattle || activeServiceId) return;
    const result = activatePastInteraction(storyState, activeInteraction.id);
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
        openBattle({ id: 'watchtower-boss', enemyId: 'mist-watcher', boss: true });
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
      openBattle({ id: 'crossroads-boss', enemyId: 'crossroads-sentinel', boss: true });
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
  interactionPrompt.addEventListener('click', performStoryInteraction);
  dialogueOverlay.addEventListener('click', advanceStoryDialogue);
  openBagButton.addEventListener('click', () => openService('bag'));
  shopClose.addEventListener('click', closeService);

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

  const mapDragBlockedSelector = '.v2-floating-controls, .v2-settings, .v2-help, .v2-map, .v2-landmark-info, .v2-story-status, .v2-interaction-prompt, .v2-dialogue, .v2-shop, .v2-battle, .v2-controls, .v2-attribution, #v2-loading, button, a, input, select, textarea';

  function isMapDragOrigin(event) {
    return event.target instanceof Element && !event.target.closest(mapDragBlockedSelector);
  }

  shell.addEventListener('pointerdown', event => {
    if (
      event.isPrimary === false || event.button > 0 || !isMapDragOrigin(event) ||
      settingsPanel.getAttribute('aria-hidden') === 'false' || activeBattle || encounterTransitioning ||
      activeStoryDialogue || activeServiceId
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
      return canStandInPastArea(activeAreaId(), x, y, r);
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
        const nearViewport = enemy.active
          && enemy.x >= viewport.x - enemyMargin
          && enemy.x <= viewportRight + enemyMargin
          && enemy.y >= viewport.y - enemyMargin
          && enemy.y <= viewportBottom + enemyMargin;
        if (nearViewport) assetKeys.push(enemyAssetKey(enemy.enemyId));
      }
    }
    loadAssetsInBackground(assetKeys);
  }

  function update(dt) {
    if (!ready || activeBattle || encounterTransitioning || activeStoryDialogue || activeServiceId) return;
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

    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      dx /= length;
      dy /= length;
      movePlayer(dx, dy, player.speed * dt * movementStrength);
      player.step += dt * 9;
      player.facing = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
    }

    if (currentEdition === 'past' && activeAreaId() === 'overworld') {
      const now = performance.now();
      pastEnemies = pastEnemies.map(enemy => {
        if (!enemy.active && now >= enemy.respawnAt) {
          return { ...enemy, active: true, x: enemy.patrol[0][0], y: enemy.patrol[0][1], patrolIndex: 1 };
        }
        return advancePatrol(enemy, dt);
      });
      const encounter = pastEnemies.find(enemy => shouldStartEncounter(player, enemy, 23 * maskScale, now));
      if (encounter) openBattle(encounter);
    }

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
    const background = pastSceneImages.get(areaId);
    if (!imageIsLoaded(background)) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(background, 0, 0, area.width, area.height);
    if (areaId === 'crossroads-dungeon') drawCrossroadsDungeonEvents();
  }

  function drawCrossroadsDungeonEvents() {
    for (const interaction of pastStoryApi.PAST_INTERACTIONS.filter(item => item.area === 'crossroads-dungeon' && item.actionId?.startsWith('dungeon-treasure:'))) {
      const treasureId = interaction.actionId.split(':')[1];
      if (campaignState.openedDungeonChests.includes(treasureId)) continue;
      const assetId = treasureId === 'merchant-cache' ? 'card-chest-mend' : 'card-chest-frost';
      const image = pastEventImages.get(assetId);
      const definition = PAST_EVENT_ASSETS[assetId];
      if (imageIsLoaded(image)) ctx.drawImage(image, interaction.point[0] - definition.width / 2, interaction.point[1] - definition.height + 8, definition.width, definition.height);
    }
    if (!campaignState.crossroadsBossDefeated) {
      const boss = pastEnemyImages.get('crossroads-sentinel');
      if (imageIsLoaded(boss)) ctx.drawImage(boss, 535, 65, 130, 130 * boss.naturalHeight / boss.naturalWidth);
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
    if (activeAreaId() === 'castle-town') return TOWN_NPCS;
    if (activeAreaId() === 'castle') return CASTLE_NPCS;
    if (activeAreaId() === 'crossroads-town') return CROSSROADS_NPCS;
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

  function drawLocalCharacters() {
    const now = performance.now();
    const characters = [
      ...localNpcs().map(npc => {
        const pose = npcPoseAt(npc, now);
        return { y: pose.y, draw: () => drawPastNpc(npc, pose, now) };
      }),
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
      if (!enemy.active) continue;
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
    mctx.clearRect(0, 0, 210, 145);
    const areaId = activeAreaId();
    if (currentEdition === 'past' && areaId !== 'overworld') {
      const area = PAST_AREAS[areaId];
      const baseAssetId = areaId === 'castle'
        ? 'castle-interior'
        : areaId === 'castle-town'
          ? 'castle-town-ground'
          : areaId;
      const baseImage = pastSceneImages.get(baseAssetId);
      if (imageIsLoaded(baseImage)) mctx.drawImage(baseImage, 0, 0, 210, 145);
      if (areaId === 'castle-town') {
        const buildings = pastSceneImages.get('castle-town-buildings');
        if (imageIsLoaded(buildings)) mctx.drawImage(buildings, 0, 0, 210, 145);
      }
      mctx.save();
      mctx.scale(210 / area.width, 145 / area.height);
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
        if (!enemy.active) continue;
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
    document.querySelector('#v2-battle-player-hp').textContent = `${activeBattle.player.hp} / ${activeBattle.player.maxHp}`;
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
    battleResolve.textContent = activeBattle.status === 'victory'
      ? `勝利 · ${activeBattle.reward.gold}G / ${activeBattle.reward.xp}EXP`
      : activeBattle.status === 'defeat' ? '王都で目覚める' : '行動する';
    battleHand.replaceChildren(...activeBattle.hand.map((cardId, index) => {
      const card = CARD_LIBRARY[cardId];
      const selectedCountBefore = activeBattle.hand.slice(0, index).filter(id => id === cardId).length;
      const selectedOccurrence = activeBattle.selected.filter(id => id === cardId).length > selectedCountBefore;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v2-card';
      button.dataset.card = cardId;
      button.dataset.discipline = card.discipline;
      if (card.element) button.dataset.element = card.element;
      button.setAttribute('aria-pressed', String(selectedOccurrence));
      const remainingMp = activeBattle.player.mp - action.mpCost;
      const remainingEnergy = activeBattle.energy - spentEnergy;
      const canAffordMp = selectedOccurrence || (card.mpCost || 0) <= remainingMp;
      const canAffordEnergy = selectedOccurrence || card.cost <= remainingEnergy;
      button.disabled = activeBattle.status !== 'active' || !canAffordMp || !canAffordEnergy;
      const mpCost = card.mpCost
        ? `<span class="v2-card-mp-cost" aria-label="消費MP ${card.mpCost}">MP${card.mpCost}</span>`
        : '';
      button.innerHTML = `
        <span class="v2-card-frame" aria-hidden="true"></span>
        <span class="v2-card-cost" aria-label="消費行動力 ${card.cost}">◆${card.cost}</span>
        ${mpCost}
        <span class="v2-card-art" aria-hidden="true"><i>${card.icon}</i></span>
        <span class="v2-card-copy"><strong>${card.name}</strong><small>${card.description}</small></span>`;
      button.addEventListener('click', () => {
        activeBattle = toggleCard(activeBattle, cardId);
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
      const label = document.createElement('strong');
      label.className = 'v2-combat-effect v2-combat-effect--enemy-damage';
      label.textContent = `-${enemyDamage.amount}`;
      battleEffects.append(label);
      announcements.push(`敵に${enemyDamage.amount}ダメージ`);
    }
    if (playerDamage) {
      battleOverlay.classList.add('is-player-hit');
      battleDamageFlash.classList.add('is-active');
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

  function playEncounterTransition() {
    encounterTransition.setAttribute('aria-hidden', 'false');
    encounterTransition.classList.remove('is-active', 'is-revealing');
    void encounterTransition.offsetWidth;
    encounterTransition.classList.add('is-active');
    return new Promise(resolve => window.setTimeout(resolve, 620));
  }

  function resetEncounterTransition() {
    encounterTransition.classList.remove('is-active', 'is-revealing');
    encounterTransition.setAttribute('aria-hidden', 'true');
    encounterTransitioning = false;
  }

  function resolveSelectedAction() {
    if (!activeBattle || activeBattle.status !== 'active' || !activeBattle.selected.length) return;
    activeBattle = resolveTurn(activeBattle);
    renderBattle();
    playBattleEffects(activeBattle.effects);
  }

  async function openBattle(encounter) {
    if (activeBattle || encounterTransitioning) return;
    encounterTransitioning = true;
    keys.clear();
    resetMapDrag();
    try {
      await Promise.all([
        playEncounterTransition(),
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
    activeEncounter = encounter;
    activeBattle = createBattle(encounter.enemyId, Math.random, battleProfile(campaignState));
    resetBattleEffects();
    battleOverlay.setAttribute('aria-hidden', 'false');
    renderBattle();
    encounterTransition.classList.add('is-revealing');
    window.setTimeout(resetEncounterTransition, 420);
  }

  function closeBattle(result) {
    if (!activeBattle) return;
    const encounter = activeEncounter;
    const practice = encounter?.id === 'practice';
    const bossVictory = result === 'victory' && encounter?.id === 'watchtower-boss';
    const crossroadsBossVictory = result === 'victory' && encounter?.id === 'crossroads-boss';
    let followUpDialogue = null;
    if (result === 'victory' && encounter && !practice) {
      storyState = addStoryGold(storyState, activeBattle.reward.gold);
      const outcome = applyBattleVictory(campaignState, {
        xp: activeBattle.reward.xp,
        playerHp: activeBattle.player.hp,
        playerMp: activeBattle.player.mp,
        encounterId: encounter.id
      });
      campaignState = outcome.state;
      savePastCampaign();
      savePastStory();
      const now = performance.now();
      pastEnemies = pastEnemies.map(enemy => enemy.id === encounter.id
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
      }
    }
    activeBattle = null;
    activeEncounter = null;
    resetBattleEffects();
    battleOverlay.classList.remove('is-boss');
    battleOverlay.setAttribute('aria-hidden', 'true');
    updateStoryStatus();
    if (followUpDialogue) openStoryDialogue(followUpDialogue);
  }

  battleResolve.addEventListener('click', () => {
    if (!activeBattle) return;
    if (activeBattle.status === 'victory') return closeBattle('victory');
    if (activeBattle.status === 'defeat') return closeBattle('defeat');
    resolveSelectedAction();
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
