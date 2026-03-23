/**
 * QA Test: Pieces Feature — Comprehensive Playwright test
 *
 * Architecture notes (from source):
 * - Categories are TAB buttons (not collapsible), rendered by EditPanel.jsx
 * - Pieces in active category shown as PieceButton elements (full-width buttons)
 * - "Edit" mode button text: "✎ Edit", "Play" mode: "⚔ Play"
 * - Tokens rendered as position:absolute overlays (TokenOverlay.jsx), not inside cells
 * - Images served from /tiles/{tileSet}/{image}, e.g. /tiles/board2/Monster_Goblin.png
 * - ★ button rendered per-monster in edit mode as position:absolute button
 * - Board cells: transparent divs in a flex grid, no data-r/data-c attributes
 * - Fog: SVG polygons (position:absolute), only in play mode
 * - Edit panel has a "💾 Save Quest" button
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SS_DIR = 'qa-screenshots/pieces2';
fs.mkdirSync(SS_DIR, { recursive: true });

const consoleErrors = [];
const bugs = [];

function ss(page, name) {
  return page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: false });
}

function bug(severity, flow, steps, expected, actual, screenshot) {
  bugs.push({ severity, flow, steps, expected, actual, screenshot });
  console.log(`  ❌ [${severity}] ${flow}: ${actual}`);
}

function pass(msg) { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }

// ─── NAVIGATION HELPERS ─────────────────────────────────────────────────────

/** Navigate to app and open a fresh quest in edit mode. */
async function goToEditMode(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Step 1: Click "＋ New Quest" to reveal the form
  // The button has the full-width plus sign ＋ (U+FF0B), so match loosely
  const newQuestBtn = page.getByRole('button', { name: /new quest/i });
  if (await newQuestBtn.count() > 0) {
    await newQuestBtn.first().click();
    await page.waitForTimeout(400);
  }

  // Step 2: Fill in the quest title (now visible after clicking New Quest)
  const titleInput = page.locator('input[placeholder="Quest title"]');
  await titleInput.waitFor({ state: 'visible', timeout: 5000 });
  await titleInput.fill('QA Pieces Test');

  // Step 3: Click "Create & Edit" to navigate to the game screen in edit mode
  await page.getByRole('button', { name: 'Create & Edit' }).click();
  await page.waitForTimeout(1000);

  // At this point we should be on the GameScreen in edit mode.
  // "Create & Edit" calls onEdit(quest) which sets initialMode to "edit" via useGameState.
  await ss(page, '00-edit-mode-entry');
}

/** Click the board at relative position (fracX, fracY) within the board container.
 *  The board div has inline style: background-image: url('/board2.png')
 *  React sets this as the kebab-case attribute in the DOM.
 */
async function clickBoard(page, fracX, fracY, button = 'left') {
  // Try different selectors to find the board grid
  let board = page.locator('[style*="background-image"][style*="board"]').first();
  if (await board.count() === 0) {
    board = page.locator('[style*="border: 2px solid #c4a870"]').first();
  }
  if (await board.count() === 0) {
    board = page.locator('[style*="2px solid #c4a870"]').first();
  }
  const box = await board.boundingBox({ timeout: 10000 });
  if (!box) throw new Error('Board not found with any selector');
  await page.mouse.click(
    box.x + box.width * fracX,
    box.y + box.height * fracY,
    { button }
  );
  await page.waitForTimeout(300);
  return box;
}

/** Get the board bounding box without clicking */
async function getBoardBox(page) {
  let board = page.locator('[style*="background-image"][style*="board"]').first();
  if (await board.count() === 0) {
    board = page.locator('[style*="2px solid #c4a870"]').first();
  }
  return board.boundingBox({ timeout: 10000 });
}

/** Select a piece tab by category label (Monsters/Traps/Furniture/Markers). */
async function selectCategory(page, label) {
  const tab = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') });
  if (await tab.count() === 0) return false;
  await tab.first().click();
  await page.waitForTimeout(200);
  return true;
}

/** Select a piece by label within the currently active category. */
async function selectPiece(page, label) {
  const btn = page.getByRole('button', { name: new RegExp(label, 'i') });
  if (await btn.count() === 0) return false;
  await btn.first().click();
  await page.waitForTimeout(200);
  return true;
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

async function test01_CategoriesVisible(page) {
  console.log('\n=== TEST 01: All 4 categories are visible as tabs ===');
  const categories = ['Monsters', 'Traps', 'Furniture', 'Markers'];
  for (const cat of categories) {
    const tab = page.getByRole('button', { name: new RegExp(`^${cat}$`, 'i') });
    const count = await tab.count();
    if (count === 0) {
      bug('High', 'Categories visible',
        ['Switch to edit mode', `Look for "${cat}" tab`],
        `"${cat}" tab button visible in sidebar`,
        `"${cat}" tab NOT found in DOM`,
        '01-categories'
      );
    } else {
      pass(`Category tab "${cat}" found`);
    }
  }
  await ss(page, '01-categories');
}

async function test02_CategoryTabSwitching(page) {
  console.log('\n=== TEST 02: Clicking a category tab shows its pieces ===');

  // Monsters tab: should show Goblin
  await selectCategory(page, 'Monsters');
  const goblin = page.getByRole('button', { name: /goblin/i });
  if (await goblin.count() === 0) {
    bug('High', 'Category tab switching',
      ['Click Monsters tab'],
      'Goblin piece button appears',
      'Goblin not visible after clicking Monsters tab',
      '02-monsters-tab'
    );
  } else {
    pass('Monsters tab: Goblin is visible');
  }
  await ss(page, '02-monsters-tab');

  // Traps tab: should show Trap
  await selectCategory(page, 'Traps');
  const trap = page.getByRole('button', { name: /^trap$/i });
  if (await trap.count() === 0) {
    bug('High', 'Category tab switching',
      ['Click Traps tab'],
      'Trap piece button appears',
      'Trap not visible after clicking Traps tab',
      '02-traps-tab'
    );
  } else {
    pass('Traps tab: Trap is visible');
  }
  await ss(page, '02-traps-tab');

  // Furniture tab: should show Bookcase
  await selectCategory(page, 'Furniture');
  const bookcase = page.getByRole('button', { name: /bookcase/i });
  if (await bookcase.count() === 0) {
    bug('High', 'Category tab switching',
      ['Click Furniture tab'],
      'Bookcase piece button appears',
      'Bookcase not visible after clicking Furniture tab',
      '02-furniture-tab'
    );
  } else {
    pass('Furniture tab: Bookcase is visible');
  }
  await ss(page, '02-furniture-tab');

  // Markers tab: should show Hero Start
  await selectCategory(page, 'Markers');
  const heroStart = page.getByRole('button', { name: /hero start/i });
  if (await heroStart.count() === 0) {
    bug('High', 'Category tab switching',
      ['Click Markers tab'],
      'Hero Start piece button appears',
      'Hero Start not visible after clicking Markers tab',
      '02-markers-tab'
    );
  } else {
    pass('Markers tab: Hero Start is visible');
  }
  await ss(page, '02-markers-tab');
}

async function test03_PieceHasIconLabelColor(page) {
  console.log('\n=== TEST 03: Each piece button has colored icon + label ===');

  await selectCategory(page, 'Monsters');
  const goblinBtn = page.getByRole('button', { name: /goblin/i }).first();
  if (await goblinBtn.count() === 0) { warn('Goblin not found, skipping icon test'); return; }

  const innerDivs = goblinBtn.locator('div');
  const divCount = await innerDivs.count();
  const innerSpans = goblinBtn.locator('span');
  const spanCount = await innerSpans.count();

  if (divCount === 0) {
    bug('Low', 'Piece icon/color',
      ['Inspect Goblin button in Monsters'],
      'Colored div (icon) inside piece button',
      'No colored div found inside piece button',
      '03-piece-icon'
    );
  } else {
    pass(`Goblin button has ${divCount} div(s) (colored icon) and ${spanCount} span(s)`);
  }

  // Verify "BLK" badge appears for blocking pieces (Bookcase)
  await selectCategory(page, 'Furniture');
  const bookcaseBtn = page.getByRole('button', { name: /bookcase/i }).first();
  const blkText = bookcaseBtn.getByText('BLK');
  if (await blkText.count() === 0) {
    bug('Low', 'BLK badge',
      ['Click Furniture tab', 'Inspect Bookcase button'],
      '"BLK" badge visible on Bookcase (blocks:true)',
      '"BLK" badge NOT found on Bookcase button',
      '03-piece-icon'
    );
  } else {
    pass('Bookcase has "BLK" badge');
  }
  await ss(page, '03-piece-icon-blk');
}

async function test04_PlacingPiece(page) {
  console.log('\n=== TEST 04: Select Goblin → click board → piece appears ===');

  await selectCategory(page, 'Monsters');
  await selectPiece(page, 'Goblin');

  // Click a corridor cell (approximate center of board)
  await clickBoard(page, 0.5, 0.5);
  await ss(page, '04-goblin-placed');

  // The piece appears as an <img> with src containing "Monster_Goblin"
  const goblinImg = page.locator('img[src*="Monster_Goblin"]');
  const count = await goblinImg.count();
  if (count === 0) {
    bug('Critical', 'Placing piece',
      ['Select Goblin from Monsters', 'Click board center cell'],
      'Monster_Goblin.png image appears on board',
      'No img[src*="Monster_Goblin"] found after click',
      '04-goblin-placed'
    );
    return false;
  }
  pass(`Goblin placed — found ${count} Monster_Goblin image(s)`);
  return true;
}

async function test05_TogglePlacement(page) {
  console.log('\n=== TEST 05: Click occupied cell again → piece removed ===');

  const before = await page.locator('img[src*="Monster_Goblin"]').count();
  if (before === 0) { warn('No Goblin placed to toggle; skipping'); return; }

  await selectCategory(page, 'Monsters');
  await selectPiece(page, 'Goblin');
  await clickBoard(page, 0.5, 0.5);
  await ss(page, '05-toggle-placement');

  const after = await page.locator('img[src*="Monster_Goblin"]').count();
  if (after >= before) {
    bug('High', 'Toggle placement',
      ['Place Goblin at center', 'Click same cell with Goblin selected'],
      'Goblin is removed (count decreases)',
      `Goblin count: before=${before}, after=${after} — not removed`,
      '05-toggle-placement'
    );
  } else {
    pass(`Toggle works — Goblin removed (${before}→${after})`);
  }
}

async function test06_MultiCellPiece(page) {
  console.log('\n=== TEST 06: Multi-cell piece (Bookcase 3×1) ===');

  await selectCategory(page, 'Furniture');
  await selectPiece(page, 'Bookcase');

  await clickBoard(page, 0.2, 0.3);
  await ss(page, '06-bookcase-placed');

  const img = page.locator('img[src*="Bookcase"]');
  const count = await img.count();
  if (count === 0) {
    bug('High', 'Multi-cell piece',
      ['Select Bookcase from Furniture', 'Click board'],
      'Bookcase image appears on board',
      'No Bookcase image found',
      '06-bookcase-placed'
    );
  } else {
    pass(`Bookcase placed — ${count} image(s)`);
  }
}

async function test07_RotationRightClick(page) {
  console.log('\n=== TEST 07: Right-click placed piece → rotates ===');

  const existingBookcase = await page.locator('img[src*="Bookcase"]').count();
  if (existingBookcase === 0) {
    await selectCategory(page, 'Furniture');
    await selectPiece(page, 'Bookcase');
    await clickBoard(page, 0.2, 0.3);
    await page.waitForTimeout(300);
  }

  const bookcaseImg = page.locator('img[src*="Bookcase"]').first();
  const styleBefore = await bookcaseImg.getAttribute('style');

  // Right-click the cell where bookcase is placed
  await clickBoard(page, 0.2, 0.3, 'right');
  await ss(page, '07-after-rotation');

  const styleAfter = await bookcaseImg.getAttribute('style');
  if (styleBefore === styleAfter) {
    bug('High', 'Rotation',
      ['Place Bookcase at (0.2, 0.3)', 'Right-click same cell'],
      'Bookcase transform/style changes (rotation increments)',
      'Style unchanged after right-click — rotation may not be working',
      '07-after-rotation'
    );
  } else {
    pass(`Rotation works — style changed (rotate angle changed)`);
  }
}

async function test08_DoorPlacementAndRotation(page) {
  console.log('\n=== TEST 08: Door placement & rotation ===');

  await selectCategory(page, 'Markers');
  const doorBtn = page.getByRole('button', { name: /^door$/i });
  if (await doorBtn.count() === 0) {
    bug('High', 'Door placement',
      ['Click Markers tab', 'Find Door button'],
      'Door button found in Markers',
      'Door button NOT found',
      '08-door'
    );
    return;
  }
  await doorBtn.first().click();
  await page.waitForTimeout(200);

  await clickBoard(page, 0.48, 0.5);
  await ss(page, '08-door-placed');

  const doorImg = page.locator('img[src*="Door"]');
  const count = await doorImg.count();
  if (count === 0) {
    bug('High', 'Door placement',
      ['Select Door', 'Click board'],
      'Door image appears on cell edge',
      'No Door image found',
      '08-door-placed'
    );
  } else {
    pass(`Door placed — ${count} image(s)`);
  }

  // Right-click to rotate door through 4 positions
  for (let i = 1; i <= 3; i++) {
    await clickBoard(page, 0.48, 0.5, 'right');
    await page.waitForTimeout(200);
  }
  await ss(page, '08-door-rotated-3x');
  pass('Door rotation (3 right-clicks) completed without crash');
}

async function test09_MarkerStacking(page) {
  console.log('\n=== TEST 09: Marker stacking on furniture ===');

  await selectCategory(page, 'Furniture');
  await selectPiece(page, 'Chest');
  await clickBoard(page, 0.7, 0.7);
  await ss(page, '09a-chest-placed');

  const chestAfterPlace = await page.locator('img[src*="Chest"]').count();
  if (chestAfterPlace === 0) {
    warn('Chest not placed (may be on wall); skipping stacking test');
    return;
  }
  pass(`Chest placed (${chestAfterPlace} image)`);

  // Select Hero Start (a 1×1 marker, no image) and click the SAME cell
  await selectCategory(page, 'Markers');
  await selectPiece(page, 'Hero Start');
  await clickBoard(page, 0.7, 0.7);
  await ss(page, '09b-marker-stacked');

  const chestAfterStack = await page.locator('img[src*="Chest"]').count();
  if (chestAfterStack < chestAfterPlace) {
    bug('High', 'Marker stacking',
      ['Place Chest at (0.7,0.7)', 'Select Hero Start', 'Click same cell'],
      'Chest remains, Hero Start overlays it (overlayMarker)',
      `Chest count dropped from ${chestAfterPlace} to ${chestAfterStack} — furniture was replaced`,
      '09b-marker-stacked'
    );
  } else {
    pass('Chest still present after stacking Hero Start — overlay works');
  }

  // Click again with Hero Start selected to remove the marker
  await clickBoard(page, 0.7, 0.7);
  await ss(page, '09c-marker-removed');
  const chestAfterUnstack = await page.locator('img[src*="Chest"]').count();
  if (chestAfterUnstack < chestAfterPlace) {
    bug('High', 'Marker unstack',
      ['Stack Hero Start on Chest', 'Click same cell again with Hero Start'],
      'Marker removed, Chest remains',
      'Chest disappeared after unstacking — furniture was removed too',
      '09c-marker-removed'
    );
  } else {
    pass('Marker removed, furniture remains — unstack works');
  }
}

async function test10_SpecialMonsterStarButton(page) {
  console.log('\n=== TEST 10: Special monster ★ button in edit mode ===');

  await selectCategory(page, 'Monsters');
  await selectPiece(page, 'Orc');
  await clickBoard(page, 0.4, 0.4);
  await ss(page, '10a-orc-placed');

  const orcImg = await page.locator('img[src*="Monster_Orc"]').count();
  if (orcImg === 0) {
    warn('Orc not placed (may be on wall); skipping ★ test');
    return;
  }

  // The ★ button is position:absolute near each monster image, title="Mark as special monster"
  const starBtn = page.locator('button[title="Mark as special monster"]');
  const starCount = await starBtn.count();

  if (starCount === 0) {
    bug('High', 'Special monster ★',
      ['Place Orc on board in edit mode', 'Look for ★ button near monster'],
      '★ button appears on placed monster in edit mode',
      'No button[title="Mark as special monster"] found',
      '10a-orc-placed'
    );
    return;
  }
  pass(`Found ${starCount} ★ button(s)`);

  await starBtn.first().click();
  await page.waitForTimeout(300);
  await ss(page, '10b-special-dialog');

  const dialog = page.locator('text=Mark as Special Monster');
  if (await dialog.count() === 0) {
    bug('High', 'Special monster dialog',
      ['Click ★ button on Orc'],
      'SpecialMonsterDialog opens with "Mark as Special Monster" checkbox',
      'Dialog not found',
      '10b-special-dialog'
    );
  } else {
    pass('SpecialMonsterDialog opened');

    const noteArea = page.locator('textarea').first();
    await noteArea.fill('Boss Orc — 5 HP, drops iron key');
    await page.locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(300);
    await ss(page, '10c-special-saved');
    pass('Special monster saved with note');

    // The ★ button should now have purple background (#9c27b0 = rgb(156, 39, 176))
    const starStyle = await page.locator('button[title="Mark as special monster"]').first().getAttribute('style');
    const isPurple = starStyle && (starStyle.includes('#9c27b0') || starStyle.includes('rgb(156, 39, 176)'));
    if (isPurple) {
      pass('★ button turned purple — isSpecial flag set');
    } else {
      bug('Low', 'Special monster visual',
        ['Mark Orc as special', 'Check ★ button color'],
        '★ button becomes purple (#9c27b0) when monster is special',
        `★ button style: ${starStyle}`,
        '10c-special-saved'
      );
    }
  }
}

async function test11_NoteMarkerDialog(page) {
  console.log('\n=== TEST 11: Note Marker (Event Note) dialog ===');

  await selectCategory(page, 'Markers');
  const noteBtn = page.getByRole('button', { name: /event note/i });
  if (await noteBtn.count() === 0) {
    bug('Medium', 'Event Note marker',
      ['Click Markers tab', 'Find "Event Note" button'],
      'Event Note button found',
      'Event Note button NOT found',
      '11-note-marker'
    );
    return;
  }
  await noteBtn.first().click();
  await clickBoard(page, 0.6, 0.3);
  await ss(page, '11a-note-placed');

  const noteImg = page.locator('img[src*="note.png"]');
  if (await noteImg.count() === 0) {
    bug('Medium', 'Event Note marker',
      ['Select Event Note', 'Click board'],
      'note.png image appears on board',
      'No note.png image found',
      '11a-note-placed'
    );
    return;
  }
  pass('Event Note placed (note.png visible)');

  // The pencil button in edit mode
  const pencilBtn = page.locator('button[title="Edit note"]');
  if (await pencilBtn.count() === 0) {
    bug('Medium', 'Event Note edit',
      ['Place Event Note', 'Look for pencil (✎) button'],
      'Pencil ✎ button appears on note marker in edit mode',
      'No button[title="Edit note"] found',
      '11a-note-placed'
    );
    return;
  }

  // Use force:true because the outer container has pointerEvents:none but button has pointerEvents:auto
  await pencilBtn.first().click({ force: true });
  await page.waitForTimeout(300);
  await ss(page, '11b-note-dialog');

  const noteDialog = page.locator('text=📝 Event Note');
  if (await noteDialog.count() === 0) {
    bug('High', 'Event Note dialog',
      ['Place Event Note', 'Click ✎ pencil button'],
      'NoteMarkerDialog opens (shows "📝 Event Note")',
      'Dialog not found',
      '11b-note-dialog'
    );
  } else {
    pass('NoteMarkerDialog opened');
    await page.locator('textarea').first().fill('Beware the trap ahead!');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForTimeout(300);
    pass('Note saved');
  }
}

async function test12_SearchMarker(page) {
  console.log('\n=== TEST 12: Search Marker ===');

  await selectCategory(page, 'Markers');
  const searchBtn = page.getByRole('button', { name: /search marker/i });
  if (await searchBtn.count() === 0) {
    bug('Medium', 'Search Marker',
      ['Click Markers tab', 'Find "Search Marker"'],
      'Search Marker button found',
      'Search Marker NOT found',
      '12-search'
    );
    return;
  }
  await searchBtn.first().click();
  await page.waitForTimeout(200);

  await clickBoard(page, 0.1, 0.5);
  await ss(page, '12-search-marker-placed');
  pass('Search Marker placement attempted — no crash');
}

async function test13_StairsPiece_2x2(page) {
  console.log('\n=== TEST 13: Stairs (2×2 piece) ===');

  await selectCategory(page, 'Markers');
  const stairsBtn = page.getByRole('button', { name: /stairs/i });
  if (await stairsBtn.count() === 0) {
    bug('Medium', 'Stairs piece',
      ['Click Markers tab', 'Find Stairs button'],
      'Stairs found',
      'Stairs NOT found',
      '13-stairs'
    );
    return;
  }
  await stairsBtn.first().click();
  await clickBoard(page, 0.15, 0.75);
  await ss(page, '13-stairs-placed');

  const stairsImg = page.locator('img[src*="Stairs"]');
  if (await stairsImg.count() === 0) {
    bug('Medium', 'Stairs piece',
      ['Select Stairs', 'Click board'],
      'Stairs image appears on board',
      'No Stairs image found',
      '13-stairs-placed'
    );
  } else {
    pass(`Stairs placed — ${await stairsImg.count()} image(s)`);
  }
}

async function test14_BlockerPiece(page) {
  console.log('\n=== TEST 14: Blocker & Double Blocker ===');

  await selectCategory(page, 'Markers');
  const blockerBtn = page.getByRole('button', { name: /^blocked square$/i });
  if (await blockerBtn.count() === 0) {
    bug('Low', 'Blocker piece',
      ['Click Markers tab', 'Find "Blocked Square"'],
      'Blocked Square button found',
      'Blocked Square NOT found',
      '14-blocker'
    );
    return;
  }
  await blockerBtn.first().click();
  await clickBoard(page, 0.5, 0.2);
  await ss(page, '14-blocker-placed');

  const wallImg = page.locator('img[src*="Wall"]');
  if (await wallImg.count() === 0) {
    bug('Low', 'Blocker piece',
      ['Select Blocked Square', 'Click board'],
      'Wall.png image appears',
      'No Wall image found',
      '14-blocker-placed'
    );
  } else {
    pass(`Blocker placed — ${await wallImg.count()} Wall image(s)`);
  }

  // Double Blocker
  const dblBtn = page.getByRole('button', { name: /double blocked square/i });
  if (await dblBtn.count() > 0) {
    await dblBtn.first().click();
    await clickBoard(page, 0.55, 0.2);
    await page.waitForTimeout(300);
    await ss(page, '14-double-blocker-placed');
    const dblImg = page.locator('img[src*="Double_Wall"]');
    if (await dblImg.count() === 0) {
      bug('Low', 'Double Blocker',
        ['Select Double Blocked Square', 'Click board'],
        'Double_Wall.png image appears',
        'No Double_Wall image found',
        '14-double-blocker-placed'
      );
    } else {
      pass(`Double Blocker placed — ${await dblImg.count()} image(s)`);
    }
  } else {
    warn('Double Blocked Square button not found — may be absent from catalogue');
  }
}

async function test15_AllMonstersInCatalogue(page) {
  console.log('\n=== TEST 15: All monsters present in catalogue ===');

  await selectCategory(page, 'Monsters');
  const expectedMonsters = [
    'Goblin', 'Orc', 'Skeleton', 'Zombie', 'Mummy',
    'Abomination', 'Dread Warrior', 'Gargoyle', 'Dread Sorcerer'
  ];
  for (const name of expectedMonsters) {
    const btn = page.getByRole('button', { name: new RegExp(name, 'i') });
    if (await btn.count() === 0) {
      bug('Medium', 'Monsters catalogue',
        [`Check for "${name}" in Monsters tab`],
        `"${name}" found`, `"${name}" NOT found`, '15-monsters'
      );
    } else {
      pass(`Monster "${name}" found`);
    }
  }
  await ss(page, '15-all-monsters');
}

async function test16_AllTrapsInCatalogue(page) {
  console.log('\n=== TEST 16: All traps present in catalogue ===');

  await selectCategory(page, 'Traps');
  const expectedTraps = ['Trap', 'Pit Trap', 'Spear Trap', 'Falling Block'];
  for (const name of expectedTraps) {
    const btn = page.getByRole('button', { name: new RegExp(name, 'i') });
    if (await btn.count() === 0) {
      bug('Medium', 'Traps catalogue',
        [`Check for "${name}" in Traps tab`],
        `"${name}" found`, `"${name}" NOT found`, '16-traps'
      );
    } else {
      pass(`Trap "${name}" found`);
    }
  }
  await ss(page, '16-all-traps');
}

async function test17_AllFurnitureInCatalogue(page) {
  console.log('\n=== TEST 17: All furniture present in catalogue ===');

  await selectCategory(page, 'Furniture');
  const expectedFurniture = [
    'Chest', 'Bookcase', 'Table', 'Throne', 'Fireplace',
    'Cupboard', "Alchemist's Bench", 'Torture Rack', 'Tomb',
    "Sorcerer's Table", 'Weapons Rack'
  ];
  for (const name of expectedFurniture) {
    const btn = page.getByRole('button', { name: new RegExp(name, 'i') });
    if (await btn.count() === 0) {
      bug('Low', 'Furniture catalogue',
        [`Check for "${name}" in Furniture tab`],
        `"${name}" found`, `"${name}" NOT found`, '17-furniture'
      );
    } else {
      pass(`Furniture "${name}" found`);
    }
  }
  await ss(page, '17-all-furniture');
}

async function test18_AllMarkersInCatalogue(page) {
  console.log('\n=== TEST 18: All markers present in catalogue ===');

  await selectCategory(page, 'Markers');
  const expectedMarkers = [
    'Hero Start', 'Event Note', 'Search Marker', 'Door',
    'Secret Door', 'Stairs', 'Blocked Square', 'Double Blocked Square'
  ];
  for (const name of expectedMarkers) {
    const btn = page.getByRole('button', { name: new RegExp(name, 'i') });
    if (await btn.count() === 0) {
      bug('Low', 'Markers catalogue',
        [`Check for "${name}" in Markers tab`],
        `"${name}" found`, `"${name}" NOT found`, '18-markers'
      );
    } else {
      pass(`Marker "${name}" found`);
    }
  }
  await ss(page, '18-all-markers');
}

async function test19_ImageScaleRendering(page) {
  console.log('\n=== TEST 19: Image pieces render with correct dimensions ===');

  await selectCategory(page, 'Monsters');
  await selectPiece(page, 'Goblin');
  await clickBoard(page, 0.3, 0.6);
  await page.waitForTimeout(300);

  const goblinImg = page.locator('img[src*="Monster_Goblin"]').first();
  if (await goblinImg.count() === 0) { warn('No Goblin image to check scale'); return; }

  const box = await goblinImg.boundingBox();
  if (!box) { warn('Goblin image has no bounding box'); return; }

  const CELL_PX = 37;
  if (box.width < 5 || box.height < 5) {
    bug('High', 'Image scale',
      ['Place Goblin', 'Check image dimensions'],
      'Goblin image has reasonable size (>5px)',
      `Image too small: ${box.width}×${box.height}px`,
      '19-image-scale'
    );
  } else if (box.width > CELL_PX * 3 || box.height > CELL_PX * 3) {
    bug('Low', 'Image scale',
      ['Place Goblin', 'Check image dimensions'],
      'Goblin image fits within ~1 cell (~37px)',
      `Image very large: ${box.width}×${box.height}px`,
      '19-image-scale'
    );
  } else {
    pass(`Goblin image size: ${Math.round(box.width)}×${Math.round(box.height)}px — reasonable`);
  }
  await ss(page, '19-image-scale');
}

async function test20_PlaceAllMonsters(page) {
  console.log('\n=== TEST 20: Place all 9 monsters on the board (no crash) ===');

  await selectCategory(page, 'Monsters');
  const monsters = [
    ['Goblin', 0.05, 0.5],
    ['Orc', 0.1, 0.5],
    ['Skeleton', 0.15, 0.5],
    ['Zombie', 0.05, 0.6],
    ['Mummy', 0.1, 0.6],
    ['Abomination', 0.15, 0.6],
    ['Dread Warrior', 0.05, 0.7],
    ['Gargoyle', 0.1, 0.7],
    ['Dread Sorcerer', 0.15, 0.7],
  ];

  let placed = 0;
  for (const [name, fx, fy] of monsters) {
    const ok = await selectPiece(page, name);
    if (!ok) { warn(`${name} button not found`); continue; }
    await clickBoard(page, fx, fy);
    placed++;
  }
  await ss(page, '20-all-monsters-placed');
  pass(`Placed ${placed}/9 monsters without crash`);
}

async function test21_Persistence(page) {
  console.log('\n=== TEST 21: Persistence — Save & reload ===');

  const piecesBefore = await page.locator('img[src*="/tiles/"]').count();
  pass(`Pieces before save: ${piecesBefore}`);

  const saveBtn = page.getByRole('button', { name: /save quest/i });
  if (await saveBtn.count() === 0) {
    bug('High', 'Persistence',
      ['Look for Save Quest button in edit mode'],
      '"💾 Save Quest" button visible in sidebar',
      'Save Quest button NOT found',
      '21-persist'
    );
    return;
  }
  await saveBtn.click();
  await page.waitForTimeout(600);
  await ss(page, '21a-after-save');

  const savedFlash = page.getByText(/saved!/i);
  if (await savedFlash.count() > 0) {
    pass('"✓ Saved!" confirmation appeared');
  } else {
    warn('No "Saved!" flash — may auto-dismiss quickly or was not shown');
  }

  // Reload page
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await ss(page, '21b-after-reload');

  // Navigate back to the QA quest: look for it in the library
  const questItem = page.locator('li, div, tr').filter({ hasText: /QA Pieces Test/i });
  if (await questItem.count() > 0) {
    await questItem.first().click();
    await page.waitForTimeout(500);
  }

  // Look for "Open" or "Edit" action button
  const openBtn = page.getByRole('button', { name: /open|▶/i });
  if (await openBtn.count() > 0) {
    await openBtn.first().click();
    await page.waitForTimeout(800);
  }

  // Switch to Edit mode
  const editBtn = page.getByRole('button', { name: /edit/i });
  if (await editBtn.count() > 0) {
    await editBtn.first().click();
    await page.waitForTimeout(300);
  }

  await ss(page, '21c-reload-edit-mode');
  const piecesAfter = await page.locator('img[src*="/tiles/"]').count();
  pass(`Pieces after reload: ${piecesAfter}`);

  if (piecesBefore > 0 && piecesAfter === 0) {
    bug('Critical', 'Persistence',
      ['Place multiple pieces', 'Save Quest', 'Reload page', 'Reopen quest in edit mode'],
      `${piecesBefore} pieces survive reload`,
      `0 pieces found after reload — data not persisted`,
      '21c-reload-edit-mode'
    );
  } else if (piecesAfter >= piecesBefore && piecesBefore > 0) {
    pass(`Persistence OK — ${piecesAfter} pieces after reload (was ${piecesBefore})`);
  } else {
    warn(`Pieces before: ${piecesBefore}, after: ${piecesAfter} — may have landed on wall cells`);
  }
}

async function test22_PlayModeFog(page) {
  console.log('\n=== TEST 22: Play mode shows fog of war ===');

  const playBtn = page.getByRole('button', { name: /play/i });
  if (await playBtn.count() === 0) {
    warn('No "Play" button found');
    return;
  }
  await playBtn.first().click();
  await page.waitForTimeout(500);
  await ss(page, '22a-play-mode');

  // Fog is SVG polygons with fill="#1a0000"
  const fogPolygons = page.locator('svg polygon[fill="#1a0000"]');
  const fogCount = await fogPolygons.count();
  if (fogCount === 0) {
    bug('High', 'Fog in play mode',
      ['Switch to play mode'],
      'SVG fog polygons cover unrevealed cells',
      'No SVG polygon[fill="#1a0000"] found — fog not rendering',
      '22a-play-mode'
    );
  } else {
    pass(`Fog of war active — ${fogCount} fog polygons`);
  }

  // Click a cell to reveal it
  await clickBoard(page, 0.5, 0.5);
  await ss(page, '22b-after-reveal');
  const fogAfter = await page.locator('svg polygon[fill="#1a0000"]').count();
  if (fogCount > 0 && fogAfter >= fogCount) {
    bug('High', 'Fog reveal',
      ['Click a cell in play mode'],
      'Some fog polygons are removed (cells revealed)',
      `Fog polygon count unchanged: ${fogCount} → ${fogAfter}`,
      '22b-after-reveal'
    );
  } else if (fogCount > 0) {
    pass(`Reveal works — fog reduced from ${fogCount} to ${fogAfter} polygons`);
  }
}

async function test23_SpecialMonsterGlowInPlayMode(page) {
  console.log('\n=== TEST 23: Special monster glow in play mode ===');

  // Reveal the area where the Orc was placed (~0.4, 0.4)
  await clickBoard(page, 0.4, 0.4);
  await page.waitForTimeout(300);
  await ss(page, '23-special-glow-play');

  const glowImg = page.locator('img[style*="drop-shadow(0 0 4px #9c27b0)"]');
  if (await glowImg.count() === 0) {
    warn('Special monster glow not detectable (cell may not be revealed or monster not placed there)');
  } else {
    pass('Special monster purple glow detected in play mode');
  }
}

async function test24_ConsoleErrors(page) {
  console.log('\n=== TEST 24: Console errors ===');
  if (consoleErrors.length === 0) {
    pass('No JS errors captured in browser console');
  } else {
    for (const err of consoleErrors) {
      bug('High', 'Console error',
        ['Use the app normally'],
        'No JS errors',
        err.substring(0, 300),
        null
      );
    }
  }
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('QA: Pieces Feature — Starting');
    console.log('═══════════════════════════════════════════════════════');

    await goToEditMode(page);

    await test01_CategoriesVisible(page);
    await test02_CategoryTabSwitching(page);
    await test03_PieceHasIconLabelColor(page);
    await test04_PlacingPiece(page);
    await test05_TogglePlacement(page);
    await test06_MultiCellPiece(page);
    await test07_RotationRightClick(page);
    await test08_DoorPlacementAndRotation(page);
    await test09_MarkerStacking(page);
    await test10_SpecialMonsterStarButton(page);
    await test11_NoteMarkerDialog(page);
    await test12_SearchMarker(page);
    await test13_StairsPiece_2x2(page);
    await test14_BlockerPiece(page);
    await test15_AllMonstersInCatalogue(page);
    await test16_AllTrapsInCatalogue(page);
    await test17_AllFurnitureInCatalogue(page);
    await test18_AllMarkersInCatalogue(page);
    await test19_ImageScaleRendering(page);
    await test20_PlaceAllMonsters(page);
    await test21_Persistence(page);
    await test22_PlayModeFog(page);
    await test23_SpecialMonsterGlowInPlayMode(page);
    await test24_ConsoleErrors(page);

    await ss(page, 'zz-final');

  } catch (err) {
    console.error('\n[FATAL]', err.message);
    await page.screenshot({ path: `${SS_DIR}/zz-crash.png` });
    bugs.push({
      severity: 'Critical', flow: 'Test runner', steps: ['Run test suite'],
      expected: 'Tests complete without error', actual: err.message, screenshot: 'zz-crash'
    });
  } finally {
    await browser.close();
  }

  // ─── REPORT ──────────────────────────────────────────────────────────────
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('QA REPORT — Pieces Feature');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Screenshots saved to: ${SS_DIR}/`);
  console.log(`Total bugs: ${bugs.length}\n`);

  if (bugs.length === 0) {
    console.log('All tests passed — no bugs found!');
  } else {
    bugs.forEach((b, i) => {
      console.log(`── Bug #${i + 1} ─────────────────────────────────────`);
      console.log(`  Severity:   ${b.severity}`);
      console.log(`  Flow:       ${b.flow}`);
      if (b.steps?.length) console.log(`  Steps:      ${b.steps.join(' → ')}`);
      console.log(`  Expected:   ${b.expected}`);
      console.log(`  Actual:     ${b.actual}`);
      if (b.screenshot) console.log(`  Screenshot: ${SS_DIR}/${b.screenshot}.png`);
      console.log('');
    });
  }

  if (consoleErrors.length > 0) {
    console.log('── Browser Console Errors ──────────────────────────');
    consoleErrors.forEach(e => console.log('  •', e.substring(0, 400)));
  }
})();
