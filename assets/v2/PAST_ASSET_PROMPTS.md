# 「過去編-夕方」画像生成記録

生成方式: Codex組み込みの画像生成機能。背景・ランドマーク・主人公は生成後、ローカルのビルド処理でゲーム用PNGへ変換しています。

## 背景

```text
Use case: stylized-concept
Asset type: top-down RPG world-map background, Past Evening edition
Input images: Image 1 is the exact map composition and geometry reference
Primary request: transform only the modern city blocks in Image 1 into a richly detailed medieval European sword-and-sorcery kingdom at sunset, while preserving every empty pale road reserve, open plaza, forest boundary, and the exact north-up top-down composition in location and shape.
Scene/backdrop: dense medieval stone-and-timber town blocks, slate and terracotta roofs, castle courtyards, guild houses, small gardens, walls and magic crystal lamps; the large lower-right park remains an ancient enchanted royal forest with winding footpaths.
Style/medium: premium high-resolution Japanese RPG map illustration, slightly isometric top-down, crisp painted pixel-art detail, cohesive with the reference map scale.
Lighting/mood: warm late-afternoon amber sunlight from upper right, long soft shadows toward lower left, faint violet dusk haze, windows and magic lamps beginning to glow.
Constraints: preserve canvas aspect ratio and geography; keep every broad pale road reserve completely unobstructed so code can draw roads later; do not add landmarks into the six large reserved clearings; no modern buildings, cars, asphalt, lane markings, skyscrapers, text, labels, UI, borders, watermark, logos.
```

## ランドマーク（3列×2行の素材シート）

```text
Use case: stylized-concept
Asset type: six isolated top-down fantasy RPG landmark sprites on one chroma-key sprite sheet
Input images: Image 1 is a composition/style and relative silhouette reference only
Primary request: create exactly six distinct medieval European sword-and-sorcery landmark sprites arranged in a strict 3 columns by 2 rows grid, one fully isolated object per equal cell.
Top row left to right: (1) grand circular royal citadel with a tall central keep and small bronze spider-like arcane guardian statue at the forecourt, replacing Roppongi Hills; (2) elegant blue-roofed wizard academy tower complex, replacing Tokyo Midtown; (3) monumental ivory-and-slate royal mage palace with a tall central spire and terraced enchanted gardens, replacing Azabudai Hills.
Bottom row left to right: (4) wide low royal garden plaza with hedge mazes, fountains, pavilions and glowing crystals, replacing Azabudai Garden Plaza; (5) very tall slender red-stone arcane beacon tower with a glowing crystal crown, replacing Tokyo Tower; (6) broad Gothic fantasy cathedral and monastery with red roofs, replacing Zojoji.
Style/medium: premium Japanese RPG map sprites, slightly isometric top-down view, crisp high-detail painted pixel-art, consistent scale, camera angle, outline treatment and warm sunset illumination across all six.
Lighting/mood: late-afternoon amber light from upper right, shadows toward lower left, subtle violet magic glow.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal.
Composition/framing: 3x2 sheet, large generous gap between cells; every object fully visible with padding and grounded along the lower part of its own cell; no object crosses a cell boundary.
Constraints: background must be one uniform #ff00ff with no shadows, gradients, texture, reflections, floor plane or lighting variation; do not use #ff00ff in any object; crisp separated edges; no cast shadow outside objects; no modern architecture, cars, roads, text, labels, grid lines, watermark, logos.
Avoid: characters, overlapping sprites, cropped towers, photorealism.
```

## 主人公（2列×2行の4方向素材シート）

```text
Use case: stylized-concept
Asset type: four-direction RPG protagonist sprite sheet for a fantasy game
Primary request: a young male medieval European sword-and-sorcery adventurer with short black hair, practical dark-brown leather travel clothes, short charcoal cloak, boots, belt pouches, and a sheathed simple sword.
Composition/framing: strict 2 columns by 2 rows sheet, one full-body sprite centered in each equal cell. Top-left faces down toward viewer; top-right faces left; bottom-left faces right; bottom-right faces up away from viewer. Identical body proportions and outfit, generous empty padding, no overlaps.
Style/medium: premium high-resolution Japanese RPG character sprite, clean crisp painted pixel-art, slight top-down game camera.
Lighting/mood: neutral even sprite lighting with a slight warm sunset highlight.
Scene/backdrop: ABSOLUTELY FLAT, PERFECTLY UNIFORM SOLID PURE GREEN RGB(0,255,0), HEX #00FF00 filling every background pixel.
Constraints: green background has no shadow, no glow, no vignette, no gradient, no texture, no floor, no lighting, no reflection; character has no green color; no cast shadow; no aura; no labels, arrows, text, grid lines, logos, watermark; no extra characters; sword sheathed.
```

## 島マップへの編集

```text
Use case: stylized-concept
Asset type: top-down RPG world-map background, Past Evening island edition
Input images: Image 1 is the exact geometry, camera, scale, city texture and lighting reference to edit.
Primary request: preserve the dense medieval European sword-and-magic city, reserved pale landmark clearings, enchanted forest, north-up framing, and every internal spatial relationship, but reshape the outer boundary into a finite island representing a child's remembered world. Surround the land on all four sides with a deep twilight sea. Add an irregular rocky coast, narrow beaches, seawalls and tiny harbor districts only where the existing broad pale road reserves approach the outer coastline.
Scene/backdrop: warm late-afternoon medieval city island surrounded by dark blue-violet ocean with subtle painted waves and sunset reflections.
Style/medium: premium high-resolution Japanese RPG map illustration, slightly isometric top-down, crisp painted pixel-art detail, identical to Image 1.
Lighting/mood: amber sunset from upper right, violet evening sea, magical but grounded.
Composition/framing: exact same 1505:1045 landscape aspect ratio; keep the central city and lower-right forest composition recognizable; leave a visibly continuous sea border around the whole island, approximately 7-12% of canvas depth at each edge.
Constraints: preserve the six pale reserved landmark clearings and internal city composition; do not draw roads, road labels, route numbers, text, UI, landmarks, enemies, ships, cars, modern buildings, watermark or logos. Harbor structures may include wooden docks, warehouses, cranes and mooring posts but no vessels. Do not fill the reserved road corridors with buildings.
```

## 敵キャラクター（3列×1行の素材シート）

```text
Use case: stylized-concept
Asset type: three isolated fantasy RPG enemy sprites on one chroma-key sprite sheet
Primary request: create exactly three distinct medieval sword-and-magic enemies arranged in a strict 3 columns by 1 row grid, one fully isolated full-body enemy per equal cell.
Left to right: (1) a small translucent violet-gray twilight mist slime with a simple readable face; (2) a scrappy small stone-road goblin scout in worn brown leather carrying a rusty short dagger; (3) a lean dark-blue rune wolf with glowing amber runes and alert eyes.
Style/medium: premium high-resolution Japanese RPG character sprites, crisp painted pixel-art, slight top-down three-quarter game camera, coherent with a warm sunset medieval city map.
Composition/framing: strict 3x1 sheet, one centered enemy per cell, identical apparent scale appropriate for visible map encounters and a card-battle screen, full silhouette visible, generous padding, no overlaps.
Lighting/mood: warm upper-right sunset rim light, readable silhouettes.
Scene/backdrop: perfectly flat solid pure green RGB(0,255,0), HEX #00FF00 chroma-key background for local removal.
Constraints: background is one uniform #00FF00 with no shadows, gradients, texture, floor, reflection or lighting variation; no use of green in the enemies; no cast shadows; no smoke extending into another cell; no characters besides the three specified enemies; no text, labels, grid lines, UI, watermark or logos.
```
