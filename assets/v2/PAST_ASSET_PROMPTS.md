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

## 父の羅針盤と星の紋章

`star-crest.png`

```text
Use case: stylized-concept
Asset type: reusable transparent JRPG story emblem overlay
Primary request: Create exactly one distinctive ancient navigation crest: an eight-point star with four elongated cardinal points, an inner compass ring, and a small diamond at the center. It must read immediately as both a star emblem and a compass motif.
Style: hand-painted classic 16-bit/32-bit era JRPG upgraded to high resolution, antique gold and brass with subtle blue-white magical inlay, crisp clean silhouette, suitable for a polished fantasy RPG.
Composition: perfectly centered, front-facing, symmetrical, square canvas, generous transparent padding around the emblem.
Lighting: neutral asset lighting, restrained inner magical glow only.
Constraints: genuinely transparent background; no frame; no plaque; no text; no letters; no numbers; no runes; no watermark; no external cast shadow; no additional objects. The same file will be reused on a compass dial and on a stone seal, so keep the emblem isolated and highly legible.
```

`father-compass.png`

```text
Use case: stylized-concept
Asset type: transparent JRPG story item close-up
Primary request: Create an ornate antique brass pocket compass belonging to a missing explorer father. Show it open, viewed perfectly straight from above. The circular dial must be a plain deep midnight-blue enamel surface with a large clean empty center area; do not draw any compass rose, star, needle, emblem, letters, degree numbers, or markings in that center because a separate exact crest PNG will be overlaid there at runtime.
Style: hand-painted classic 16-bit/32-bit era JRPG upgraded to high resolution, warm aged brass, subtle scratches and inherited heirloom character, polished game production art.
Composition: centered square asset, compass fills about 78% of the canvas, lid open behind the body but does not cover the dial, generous transparent padding.
Lighting: soft neutral studio lighting, clear edges, restrained warm highlights.
Constraints: genuinely transparent background; no hands; no person; no table; no scenery; no text; no letters; no numbers; no watermark; no star emblem; no compass rose in the empty dial center.
```

## 導入航海と見張り台の発見シーン

`voyage-intro.png`

```text
Use case: stylized-concept
Asset type: wide JRPG story cutscene background
Primary request: Opening voyage to a newly discovered continent. A small medieval ocean-going sailing ship advances across a calm dark-blue sea at golden sunset. Camera is on the ship's wooden deck looking forward over the bow. A young dark-haired traveler in simple casual adventurer clothes stands from behind at the railing. Far ahead, a mysterious green-and-rocky new continent rises on the horizon, clearly the destination.
Style: hand-painted classic 16-bit/32-bit era JRPG upgraded to high resolution, polished fantasy adventure game cutscene, rich readable shapes, restrained painterly pixel texture matching an existing isometric fantasy RPG.
Composition: cinematic landscape 16:9, traveler in lower-left third, bow and rigging frame the scene, continent centered in the distance, ample visual space for a dialogue panel at the bottom.
Mood: first journey, curiosity and quiet anticipation, ordinary sword-and-sail fantasy world with no hint this is a memory.
Lighting: warm evening sun from upper right, long soft light across deck and sea.
Constraints: no text, no captions, no UI, no logos, no watermark, no modern objects, no visible compass, no monsters, no magic effects.
```

`watchtower-discovery.png`

```text
Use case: stylized-concept
Asset type: wide JRPG story cutscene background
Primary request: Inside the top chamber of an ancient coastal watchtower immediately after a curse has been broken. In the center foreground is a weathered round stone-and-bronze seal plate set into a cracked pedestal, with a large perfectly blank dark circular medallion area reserved for a separate exact star crest PNG overlay at runtime. Faint remnants of purple mist drift out through open arched windows. The sea and evening sky can be glimpsed beyond.
Style: hand-painted classic 16-bit/32-bit era JRPG upgraded to high resolution, polished fantasy adventure game cutscene, detailed masonry, old navigation instruments and chains, readable silhouettes.
Composition: cinematic landscape 16:9, blank circular medallion centered in the middle third and clearly visible, chamber framing around it, space at the bottom for dialogue.
Mood: mystery resolved but a larger secret discovered; ordinary sword-and-magic fantasy, no memory symbolism.
Lighting: warm evening light entering from upper right, cool purple haze receding, subtle golden rim on the seal plate.
Constraints: do not draw any star, compass rose, crest, emblem, letters, numbers, runes, text, captions, UI, logo, watermark, characters, monster, or battle effect on the blank medallion. It must remain plain and unobstructed for compositing.
```

## 港セットピース

`harbor-setpiece-source.png`

```text
Use case: stylized-concept
Asset type: transparent top-down isometric RPG map setpiece
Primary request: A polished small medieval coastal harbor setpiece for a fantasy overworld. Build one straight, clean wooden pier oriented vertically from land at the bottom toward open water at the top. A compact single-mast medieval sailing ship is neatly moored along the left side of the pier. A small stone lighthouse with warm lantern windows stands on a round stone platform along the right side near the seaward end. Add a few tidy crates, rope coils, bollards, and one tiny rowboat. The pier edges must be smooth and intentionally constructed, not jagged.
Style: hand-painted classic 16-bit/32-bit era JRPG upgraded to high resolution, strict top-down with slight isometric depth matching a detailed fantasy overworld, crisp readable silhouettes.
Composition: square canvas, the complete harbor isolated in the center, generous transparent padding on all sides, land connection at exact bottom center, seaward end at exact top center. Keep all parts within the canvas.
Lighting: neutral soft ambient asset lighting with subtle warm lighthouse glow; avoid directional cast shadows so the whole asset can be rotated to different shore directions without looking wrong.
Constraints: genuinely transparent background; no ocean background; no land terrain background; no coast edge; no people; no labels; no text; no modern vehicles; no UI; no watermark. The asset will be rotated and composited over existing sea and shore pixels.
```

## 港の固定疑似3D投影

港全体を回転すると灯台や帆まで横倒しになるため、最終版では桟橋だけを回転し、船と灯台は常に画面上方向へ立つ独立レイヤーとして合成する。

`harbor-pier-source.png` のベース生成

```text
Use case: precise-object-edit
Asset type: transparent rotatable JRPG overworld pier component
Input images: Image 1 is the current harbor setpiece and the edit target/style reference.
Primary request: Isolate and retain only the clean wooden pier/deck and its low stone land-connection landing. Remove the sailing ship, rowboat, lighthouse, tower, flags, hanging lantern posts, tall masts, crates, barrels, ropes and every other tall or directional prop. Reconstruct any deck boards hidden behind removed objects.
Style/medium: preserve the exact hand-painted high-resolution classic 16-bit/32-bit JRPG overworld style, materials, outline weight and warm brown palette of Image 1.
Composition/framing: square transparent canvas; one straight pier runs vertically from a low stone landing at exact bottom center toward a clean squared seaward end at exact top center; centered; generous transparent padding; perfectly suitable for rotation to any coast direction.
Perspective: mostly top-down deck surface with only very shallow edge thickness. No pseudo-3D vertical structures and no directional lighting or shadows, so rotation by 0/90/180/270 degrees remains visually natural.
Constraints: genuinely transparent background; change the asset into a pier-only layer; no water, no terrain, no coast, no ship, no boat, no lighthouse, no building, no mast, no flags, no text, no UI, no watermark.
```

`harbor-pier-source.png` の透明背景補正

```text
Use case: background-extraction
Asset type: transparent rotatable JRPG overworld pier component
Input images: Image 1 is the pier-only edit target. Its visible pale checkerboard is an incorrect baked background, not part of the artwork.
Primary request: Remove only the entire pale checkerboard/background and replace it with genuine PNG alpha transparency. Preserve the wooden pier, low posts, metal brackets, ropes on the posts, and bottom stone landing exactly as shown, including their shape, colors, texture, scale and centered vertical orientation.
Composition/framing: keep the same square canvas and the same centered bottom-to-top pier placement.
Constraints: actual transparent pixels everywhere outside the pier and landing; clean anti-aliased cutout edges; no white or gray checkerboard; no halo; no new objects; no restyling; no water; no terrain; no text; no UI; no watermark.
```

`harbor-lighthouse-source.png`

```text
Use case: precise-object-edit
Asset type: transparent upright JRPG overworld lighthouse component
Input images: Image 1 is the current harbor setpiece and the edit target/style reference.
Primary request: Isolate the stone lighthouse from Image 1 as a separate reusable sprite. Remove the pier, ships, boats, ropes, barrels, crates, flags and every other harbor object. Preserve the lighthouse's blue-and-gold lantern roof, warm lit windows, round stone base and small front steps, while reconstructing clean hidden edges.
Style/medium: preserve the exact hand-painted high-resolution classic 16-bit/32-bit JRPG overworld style, material detail, outline weight and palette of Image 1.
Composition/framing: square transparent canvas; lighthouse centered; base contact point at exact bottom center; generous transparent padding above and to both sides; entire silhouette visible.
Perspective: front-facing pseudo-3D overworld sprite. The stone base rests at the bottom and the tower rises strictly toward the top edge of the screen. Vertical walls stay vertical. Camera is in front with a slight view of the roof and front doorway, consistent with all buildings extending upward on the map.
Lighting/mood: neutral ambient lighting with warm lantern glow; no long directional cast shadow.
Constraints: genuinely transparent background; no water, no terrain, no pier, no ship, no boat, no extra building, no text, no UI, no watermark. Do not tilt or rotate the tower left, right, or downward.
```

`harbor-ship-source.png`

```text
Use case: precise-object-edit
Asset type: transparent upright JRPG overworld harbor ship component
Input images: Image 1 is the current harbor setpiece and the edit target/style reference.
Primary request: Isolate the compact medieval single-mast sailing ship from Image 1 as a separate reusable harbor sprite. Remove the pier, lighthouse, rowboat, ropes connecting to the pier, crates, barrels, flags outside the ship and every other harbor object. Preserve the blue-and-gold hull, warm cabin windows, mast, rigging and cream sail, reconstructing clean hidden edges.
Style/medium: preserve the exact hand-painted high-resolution classic 16-bit/32-bit JRPG overworld style, material detail, outline weight and palette of Image 1.
Composition/framing: square transparent canvas; complete ship centered; hull contact/base at bottom center; mast and sail rise toward the top edge; generous transparent padding; entire silhouette visible.
Perspective: front-facing pseudo-3D overworld sprite rather than a flat overhead token. The hull rests lower in the image and all vertical mast, sail and cabin details extend strictly upward on screen. Slight top-surface visibility is allowed, but the sprite must never appear sideways or upside-down.
Lighting/mood: neutral ambient asset lighting with restrained warm window glow; no long directional cast shadow.
Constraints: genuinely transparent background; no water, no terrain, no pier, no lighthouse, no rowboat, no extra building, no text, no UI, no watermark. Do not tilt or rotate the mast left, right, or downward.
```

## 港のコンパクトな桟橋

`harbor-pier-source.png` の短縮再制作

```text
Use case: precise-object-edit
Asset type: transparent rotatable JRPG overworld pier component
Input image: Image 1 is the exact pier asset to edit and the style/material reference.
Primary request: Shorten the visible wooden pier to about 55–60 percent of its current length. Keep only four evenly spaced wooden deck bays between the clean squared seaward end and the low stone land-connection landing. Preserve the current pier width, warm brown boards, low round posts, rope details, dark metal brackets, stone landing, crisp painted texture, outline weight, and overall visual quality. Do not merely squash or vertically scale the existing art: reconstruct it naturally as a deliberately compact harbor pier with fewer repeated sections.
Composition/framing: keep a square 2048×2048 transparent canvas. Center the shorter pier vertically and horizontally. Its midpoint must remain at the exact canvas center so rotation around the canvas center remains correct. The squared seaward end points to exact top center and the stone land connection points to exact bottom center. Leave generous and approximately balanced transparent padding above and below the shortened structure.
Perspective: mostly top-down deck surface with only shallow edge thickness. It must remain visually natural when rotated to any coast direction.
Constraints: genuine PNG alpha transparency outside the pier and landing; no checkerboard baked into pixels; no water; no terrain; no shoreline; no ship; no boat; no lighthouse; no building; no mast; no flags; no crates; no barrels; no text; no UI; no watermark; no new props; no directional cast shadow.
```

`harbor-pier-source.png` の透過背景補正

```text
Use case: background-extraction
Asset type: transparent rotatable JRPG overworld pier component
Input image: Image 1 is the exact compact pier edit target. The visible pale gray and white checkerboard is an incorrect baked background, not artwork.
Primary request: Remove only the entire checkerboard and every background pixel, replacing them with genuine PNG alpha transparency. Preserve the compact four-bay wooden pier and low stone landing exactly as shown: same shape, pixel position, proportions, center point, colors, painted detail, warm boards, posts, ropes, brackets, stones, scale, vertical orientation, and balanced padding. Do not redraw, move, resize, rotate, stretch, crop, or restyle the pier.
Composition/framing: retain the same square canvas and centered layout. Seaward end stays at top center, stone land connection stays at bottom center.
Constraints: actual transparent alpha pixels everywhere outside the pier and landing; clean antialiased cutout edges; no gray or white checkerboard; no pale background; no halo; no new objects; no changes to the artwork; no water; no terrain; no text; no UI; no watermark.
```
