/**
 * QA Test: Pieces Feature — Comprehensive Playwright test
 * Tests all categories, placement, rotation, stacking, special behaviors, and persistence.
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SS_DIR = 'qa-screenshots/pieces2';
fs.mkdirSync(SS_DIR, { recursive: true });

const errors = [];
const bugs = [];

function ss(page, name) {
  return page.screenshot({ path: `${SS_DIR}/${name}.png`, fullPage: false });
}

function bug(severity, flow, steps, expected, actual, screenshot) {
  bugs.push({ severity, flow, steps, expected, actual, screenshot });
  console.log(`\n[BUG ${severity}] ${flow}\n  Expected: ${expected}\n  Actual: ${actual}`);
}

function info(msg) { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }

async function setupQuestInEditMode(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await ss(page, '00-app-initial');

  // Create a quest book if needed
  const bookItems = page.locator('[data-testid="quest-book-item"], .quest-book-item');
  let hasBook = await bookItems.count() > 0;

  if (!hasBook) {
    // Try to find a create book button
    const createBookBtn = page.getByRole('button', { name: /new.*book|create.*book|add.*book/i });
    if (await createBookBtn.count() > 0) {
      await createBookBtn.click();
      await page.waitForTimeout(500);
      const titleInput = page.locator('input').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('QA Test Book');
        const confirmBtn = page.getByRole('button', { name: /ok|confirm|create|save/i }).first();
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  await ss(page, '01-library-state');

  // Find or create a quest
  const createQuestBtn = page.getByRole('button', { name: /new quest|create quest|add quest|\+ quest/i });
  if (await createQuestBtn.count() > 0) {
    await createQuestBtn.first().click();
    await page.waitForTimeout(500);
    await ss(page, '02-new-quest-dialog');
    // Fill in quest title if dialog appears
    const titleInput = page.locator('input[placeholder*="title" i], input[placeholder*="quest" i], input').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('QA Pieces Test');
    }
    const confirmBtn = page.getByRole('button', { name: /ok|confirm|create|save/i }).first();
    if (await confirmBtn.count() > 0) {
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }
  }

  await ss(page, '03-after-quest-create');

  // Navigate to game screen - click open/play on first quest
  const openQuestBtn = page.getByRole('button', { name: /open|play|edit|view/i }).first();
  if (await openQuestBtn.count() > 0) {
    await openQuestBtn.click();
    await page.waitForTimeout(1000);
  }

  await ss(page, '04-game-screen');

  // Switch to Edit mode if not already
  const editModeBtn = page.getByRole('button', { name: /edit/i });
  if (await editModeBtn.count() > 0) {
    const currentMode = await page.locator('button').filter({ hasText: /edit/i }).first().isEnabled();
    await editModeBtn.first().click();
    await page.waitForTimeout(500);
  }

  await ss(page, '05-edit-mode');
  return true;
}

async function testCategoriesVisible(page) {
  console.log('\n=== TEST 1: Categories & Catalogue ===');

  const categories = ['Monsters', 'Traps', 'Furniture', 'Markers'];
  for (const cat of categories) {
    const el = page.getByText(cat, { exact: false });
    const count = await el.count();
    if (count === 0) {
      bug('High', 'Categories visible',
        ['Switch to edit mode', `Look for "${cat}" category`],
        `"${cat}" category is visible in sidebar`,
        `"${cat}" category NOT found in DOM`,
        `01-categories`
      );
    } else {
      info(`Category "${cat}" found`);
    }
  }
  await ss(page, '06-categories-visible');
}

async function testCategoryExpandCollapse(page) {
  console.log('\n=== TEST 2: Category Expand/Collapse ===');

  // Find category headers and click them to expand/collapse
  const categoryHeaders = page.locator('text=Monsters, text=Traps, text=Furniture, text=Markers');

  // Try clicking on "Monsters" to expand/collapse
  const monstersHeader = page.getByText('Monsters').first();
  if (await monstersHeader.count() > 0) {
    // Check if Goblin is visible (category expanded)
    const goblinBefore = await page.getByText('Goblin', { exact: false }).count();
    await monstersHeader.click();
    await page.waitForTimeout(300);
    const goblinAfter = await page.getByText('Goblin', { exact: false }).count();

    await ss(page, '07-after-monsters-click');

    if (goblinBefore === goblinAfter) {
      warn('Clicking "Monsters" header did not change piece visibility (may already be expanded or collapsed)');
    } else {
      info('Monsters category expand/collapse works');
      // Re-expand
      await monstersHeader.click();
      await page.waitForTimeout(300);
    }
  }
}

async function testPlacingPiece(page) {
  console.log('\n=== TEST 3: Placing a Piece ===');

  // Select Goblin from Monsters category
  const goblinBtn = page.getByRole('button', { name: /goblin/i });
  if (await goblinBtn.count() === 0) {
    bug('Critical', 'Placing piece', ['Switch to edit mode', 'Look for Goblin button'],
      'Goblin button found in Monsters category', 'Goblin button NOT found', '08-goblin-btn');
    return null;
  }
  await goblinBtn.first().click();
  await page.waitForTimeout(300);
  info('Selected Goblin piece');
  await ss(page, '08-goblin-selected');

  // Click a board cell (find the board grid)
  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  const boardCount = await board.count();

  let targetCell = null;
  if (boardCount > 0) {
    // Click in the middle of the board
    const box = await board.boundingBox();
    if (box) {
      // Click near the center of the board
      const x = box.x + box.width * 0.5;
      const y = box.y + box.height * 0.5;
      await page.mouse.click(x, y);
      await page.waitForTimeout(500);
      await ss(page, '09-after-goblin-placed');
      info('Clicked board cell to place Goblin');
      return { x, y };
    }
  }

  // If no board testid, try clicking on board cells directly
  const cells = page.locator('[data-r][data-c], [data-row][data-col], [data-cell]');
  const cellCount = await cells.count();
  if (cellCount > 0) {
    const midCell = cells.nth(Math.floor(cellCount / 2));
    await midCell.click();
    await page.waitForTimeout(500);
    await ss(page, '09-after-goblin-placed');
    info(`Clicked cell (${cellCount} cells found)`);
    return await midCell.boundingBox();
  }

  warn('Could not find board cells to click');
  return null;
}

async function testPlacedPieceImage(page) {
  console.log('\n=== TEST 4: Image-based pieces render ===');

  // Check if any img elements appear on the board after placing a monster
  const placedImages = page.locator('img[src*="Monster"], img[src*="monster"]');
  const imgCount = await placedImages.count();

  if (imgCount === 0) {
    // Check for any piece overlay images
    const allPieceImages = page.locator('img[src*=".png"]');
    const allImgCount = await allPieceImages.count();
    if (allImgCount === 0) {
      bug('High', 'Image rendering',
        ['Place a monster (Goblin) on the board'],
        'Monster image renders on the board cell',
        'No monster images found in DOM',
        '09-after-goblin-placed'
      );
    } else {
      info(`Found ${allImgCount} PNG images on board`);
    }
  } else {
    info(`Found ${imgCount} monster images on board`);
  }
  await ss(page, '10-image-rendering');
}

async function testTogglePlacement(page, firstClickPos) {
  console.log('\n=== TEST 5: Toggle placement (click occupied cell removes piece) ===');

  if (!firstClickPos) {
    warn('Skipping toggle test - no first click position');
    return;
  }

  // The goblin was placed, now we need to select Goblin again and click the same cell
  const goblinBtn = page.getByRole('button', { name: /goblin/i });
  if (await goblinBtn.count() > 0) {
    await goblinBtn.first().click();
    await page.waitForTimeout(200);
  }

  // Count placed pieces before
  const piecesBefore = await page.locator('img[src*="Monster"]').count();

  // Click same position
  if (firstClickPos.x && firstClickPos.y) {
    await page.mouse.click(firstClickPos.x, firstClickPos.y);
  } else {
    // Use bounding box center
    const cx = firstClickPos.x + firstClickPos.width / 2;
    const cy = firstClickPos.y + firstClickPos.height / 2;
    await page.mouse.click(cx, cy);
  }
  await page.waitForTimeout(500);

  const piecesAfter = await page.locator('img[src*="Monster"]').count();
  await ss(page, '11-toggle-placement');

  if (piecesAfter >= piecesBefore) {
    bug('High', 'Toggle placement',
      ['Place Goblin on cell', 'Click same cell again with Goblin selected'],
      'Piece is removed (toggle off)',
      `Piece count before: ${piecesBefore}, after: ${piecesAfter} — not removed`,
      '11-toggle-placement'
    );
  } else {
    info('Toggle placement works — piece removed on second click');
  }
}

async function testMultiCellPiece(page) {
  console.log('\n=== TEST 6: Multi-cell piece (Bookcase 3×1) ===');

  // Select Bookcase
  const bookcaseBtn = page.getByRole('button', { name: /bookcase/i });
  if (await bookcaseBtn.count() === 0) {
    bug('High', 'Multi-cell piece', ['Select Bookcase from Furniture'],
      'Bookcase button found', 'Bookcase NOT found', '12-bookcase');
    return;
  }
  await bookcaseBtn.first().click();
  await page.waitForTimeout(300);
  info('Selected Bookcase piece');

  // Click board center
  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  const boardCount = await board.count();
  if (boardCount > 0) {
    const box = await board.boundingBox();
    if (box) {
      // Click a bit left of center so the 3-wide bookcase fits
      await page.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.4);
      await page.waitForTimeout(500);
      await ss(page, '12-bookcase-placed');

      // Check if bookcase images appear (should span 3 cells)
      const bookcaseImgs = page.locator('img[src*="Bookcase"]');
      const count = await bookcaseImgs.count();
      if (count === 0) {
        bug('Medium', 'Multi-cell piece',
          ['Select Bookcase', 'Click board'],
          'Bookcase image appears on board spanning 3 cells',
          'No Bookcase images found',
          '12-bookcase-placed'
        );
      } else {
        info(`Bookcase placed — found ${count} bookcase image(s)`);
      }
    }
  }
}

async function testRotation(page) {
  console.log('\n=== TEST 7: Rotation (right-click) ===');

  // Select Bookcase for rotation test
  const bookcaseBtn = page.getByRole('button', { name: /bookcase/i });
  if (await bookcaseBtn.count() > 0) {
    await bookcaseBtn.first().click();
    await page.waitForTimeout(300);
  }

  // Place it in a fresh spot
  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() > 0) {
    const box = await board.boundingBox();
    if (box) {
      const px = box.x + box.width * 0.6;
      const py = box.y + box.height * 0.4;

      // Left click to place
      await page.mouse.click(px, py);
      await page.waitForTimeout(300);
      await ss(page, '13-before-rotation');

      // Right click to rotate
      await page.mouse.click(px, py, { button: 'right' });
      await page.waitForTimeout(300);
      await ss(page, '13-after-rotation');

      info('Right-clicked on cell (rotation attempt)');

      // Check if any rotation indicator changed
      // Hard to assert without data-rotation attrs, but we can look at the DOM
      const rotatedPieces = page.locator('[data-rotation], [style*="rotate"]');
      const rotCount = await rotatedPieces.count();
      if (rotCount > 0) {
        info(`Found ${rotCount} elements with rotation attributes/styles`);
      } else {
        warn('No rotation attributes found in DOM — rotation may work but is not detectable from attrs alone');
      }
    }
  }
}

async function testDoorPlacement(page) {
  console.log('\n=== TEST 8: Door placement & rotation ===');

  // Select Door from Markers category
  const doorBtn = page.getByRole('button', { name: /^door$/i });
  if (await doorBtn.count() === 0) {
    // Try finding in markers section
    const markersSection = page.getByText('Markers').first();
    if (await markersSection.count() > 0) {
      await markersSection.click();
      await page.waitForTimeout(300);
    }
  }

  const doorBtn2 = page.getByRole('button', { name: /door/i }).first();
  if (await doorBtn2.count() > 0) {
    await doorBtn2.click();
    await page.waitForTimeout(300);
    info('Selected Door piece');

    const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
    if (await board.count() > 0) {
      const box = await board.boundingBox();
      if (box) {
        const px = box.x + box.width * 0.5;
        const py = box.y + box.height * 0.6;

        await page.mouse.click(px, py);
        await page.waitForTimeout(300);
        await ss(page, '14-door-placed');

        // Check for Door image
        const doorImgs = page.locator('img[src*="Door"]');
        const count = await doorImgs.count();
        if (count === 0) {
          bug('Medium', 'Door placement',
            ['Select Door tool', 'Click board cell'],
            'Door image appears on cell edge',
            'No Door images found on board',
            '14-door-placed'
          );
        } else {
          info(`Door placed — found ${count} door image(s)`);
        }

        // Right-click to rotate door
        await page.mouse.click(px, py, { button: 'right' });
        await page.waitForTimeout(300);
        await ss(page, '14-door-rotated');
        info('Right-clicked door for rotation');
      }
    }
  } else {
    bug('Medium', 'Door placement', ['Find Door in Markers'],
      'Door button found', 'Door button NOT found', '14-door-placed');
  }
}

async function testMarkerStacking(page) {
  console.log('\n=== TEST 9: Marker stacking ===');

  // First place a furniture piece (Chest)
  const chestBtn = page.getByRole('button', { name: /chest/i });
  if (await chestBtn.count() === 0) {
    warn('Chest button not found, skipping stacking test');
    return;
  }
  await chestBtn.first().click();
  await page.waitForTimeout(300);

  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) {
    warn('Board not found for stacking test');
    return;
  }
  const box = await board.boundingBox();
  if (!box) return;

  const px = box.x + box.width * 0.7;
  const py = box.y + box.height * 0.7;

  // Place chest
  await page.mouse.click(px, py);
  await page.waitForTimeout(300);
  await ss(page, '15-chest-placed');

  // Now select Hero Start marker
  const startBtn = page.getByRole('button', { name: /hero start/i });
  if (await startBtn.count() === 0) {
    warn('Hero Start marker not found, skipping stacking test');
    return;
  }
  await startBtn.first().click();
  await page.waitForTimeout(300);

  // Click the same cell where chest is
  await page.mouse.click(px, py);
  await page.waitForTimeout(300);
  await ss(page, '15-marker-stacked');

  // Check if chest still there
  const chestImgs = page.locator('img[src*="Chest"]');
  const chestCount = await chestImgs.count();

  if (chestCount === 0) {
    bug('High', 'Marker stacking',
      ['Place Chest on cell', 'Select Hero Start marker', 'Click same cell'],
      'Chest remains with Hero Start marker overlaid',
      'Chest image disappeared — furniture was replaced instead of overlay',
      '15-marker-stacked'
    );
  } else {
    info(`Marker stacking — Chest still present (${chestCount} chest images)`);
  }

  // Remove the marker by clicking again with Hero Start still selected
  await page.mouse.click(px, py);
  await page.waitForTimeout(300);
  await ss(page, '15-marker-removed');
  const chestAfterRemove = await page.locator('img[src*="Chest"]').count();
  if (chestAfterRemove === 0) {
    bug('High', 'Marker stacking remove',
      ['Place Chest', 'Stack Hero Start marker', 'Click same cell with Hero Start selected'],
      'Only the marker is removed, Chest remains',
      'Chest disappeared — entire furniture removed',
      '15-marker-removed'
    );
  } else {
    info('Marker removed, furniture remains — stacking works correctly');
  }
}

async function testLetterMarker(page) {
  console.log('\n=== TEST 10: Letter Marker ===');

  // Note: The letter marker is special - there is no "letter" button in piece categories.
  // According to pieces.js, there's no letter piece in PIECE_CATEGORIES.
  // But LetterMarkerDialog exists. Let's check how it's triggered.
  // The letter functionality might be a special mode or sub-feature.

  // Check if letter marker exists in UI
  const letterBtn = page.getByRole('button', { name: /letter/i });
  const letterCount = await letterBtn.count();
  if (letterCount === 0) {
    warn('No "Letter" button found — letter markers may be placed differently (not in standard catalogue)');
    // Try looking for it in pieces catalogue
    const allButtons = await page.getByRole('button').allTextContents();
    const letterRelated = allButtons.filter(t => /letter|A-Z|note/i.test(t));
    if (letterRelated.length > 0) {
      info(`Found possible letter buttons: ${letterRelated.join(', ')}`);
    }
  } else {
    await letterBtn.first().click();
    await page.waitForTimeout(300);

    // Click a board cell
    const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
    if (await board.count() > 0) {
      const box = await board.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.3);
        await page.waitForTimeout(500);
        await ss(page, '16-letter-dialog');

        // Check for dialog
        const dialog = page.locator('[role="dialog"], .dialog, [class*="dialog"]');
        if (await dialog.count() === 0) {
          bug('High', 'Letter marker',
            ['Select letter marker', 'Click board cell'],
            'A dialog opens to select A-Z letter and note',
            'No dialog appeared',
            '16-letter-dialog'
          );
        } else {
          info('Letter marker dialog appeared');
        }
      }
    }
  }
}

async function testSpecialMonster(page) {
  console.log('\n=== TEST 11: Special Monster (★ button) ===');

  // Place a Goblin first
  const goblinBtn = page.getByRole('button', { name: /goblin/i });
  if (await goblinBtn.count() === 0) {
    warn('Goblin button not found, skipping special monster test');
    return;
  }
  await goblinBtn.first().click();
  await page.waitForTimeout(300);

  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) return;
  const box = await board.boundingBox();
  if (!box) return;

  // Place goblin in a specific spot
  const px = box.x + box.width * 0.45;
  const py = box.y + box.height * 0.45;
  await page.mouse.click(px, py);
  await page.waitForTimeout(300);
  await ss(page, '17-goblin-placed-for-special');

  // Look for ★ button on placed pieces
  const starBtns = page.getByRole('button', { name: '★' });
  const starCount = await starBtns.count();

  if (starCount === 0) {
    // Try hovering over the cell to reveal the star button
    await page.mouse.move(px, py);
    await page.waitForTimeout(300);
    const starBtnsHover = page.getByRole('button', { name: '★' });
    const hoverCount = await starBtnsHover.count();

    if (hoverCount === 0) {
      // Check for any star-like unicode chars
      const starElements = page.locator('button:has-text("★"), [class*="star"]');
      const starElemCount = await starElements.count();
      if (starElemCount === 0) {
        bug('Medium', 'Special monster ★ button',
          ['Switch to edit mode', 'Place a Goblin', 'Look for ★ button on placed piece'],
          '★ button visible on placed monster in edit mode',
          '★ button NOT found anywhere on board',
          '17-goblin-placed-for-special'
        );
      } else {
        info(`Found ${starElemCount} star elements`);
      }
    }
  } else {
    info(`Found ${starCount} ★ button(s)`);
    await starBtns.first().click();
    await page.waitForTimeout(300);
    await ss(page, '17-special-dialog');

    const dialog = page.locator('[role="dialog"], .dialog, [class*="dialog"]');
    if (await dialog.count() === 0) {
      bug('High', 'Special monster dialog',
        ['Click ★ button on placed monster'],
        'SpecialMonsterDialog opens for annotation',
        'No dialog appeared after clicking ★',
        '17-special-dialog'
      );
    } else {
      info('Special monster dialog opened');
    }
  }
}

async function testSearchMarker(page) {
  console.log('\n=== TEST 12: Search Marker ===');

  const searchBtn = page.getByRole('button', { name: /search marker/i });
  if (await searchBtn.count() === 0) {
    bug('Medium', 'Search marker', ['Find "Search Marker" in Markers category'],
      'Search Marker button found', 'Search Marker button NOT found', '18-search');
    return;
  }
  await searchBtn.first().click();
  await page.waitForTimeout(300);

  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) return;
  const box = await board.boundingBox();
  if (!box) return;

  await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.55);
  await page.waitForTimeout(300);
  await ss(page, '18-search-marker-placed');
  info('Placed search marker');
}

async function testHeroStart(page) {
  console.log('\n=== TEST 13: Hero Start Marker ===');

  const heroBtn = page.getByRole('button', { name: /hero start/i });
  if (await heroBtn.count() === 0) {
    bug('Medium', 'Hero Start', ['Find "Hero Start" in Markers category'],
      'Hero Start button found', 'Hero Start button NOT found', '19-hero-start');
    return;
  }
  await heroBtn.first().click();
  await page.waitForTimeout(300);

  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) return;
  const box = await board.boundingBox();
  if (!box) return;

  await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await page.waitForTimeout(300);
  await ss(page, '19-hero-start-placed');

  // Look for a diamond-shaped marker (could be a div with specific styling)
  info('Hero Start marker placed');
}

async function testStairsPiece(page) {
  console.log('\n=== TEST 14: Stairs (2×2) ===');

  const stairsBtn = page.getByRole('button', { name: /stairs/i });
  if (await stairsBtn.count() === 0) {
    bug('Medium', 'Stairs piece', ['Find Stairs in Markers'],
      'Stairs button found', 'Stairs NOT found', '20-stairs');
    return;
  }
  await stairsBtn.first().click();
  await page.waitForTimeout(300);

  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) return;
  const box = await board.boundingBox();
  if (!box) return;

  await page.mouse.click(box.x + box.width * 0.15, box.y + box.height * 0.8);
  await page.waitForTimeout(300);
  await ss(page, '20-stairs-placed');

  const stairsImgs = page.locator('img[src*="Stairs"]');
  const count = await stairsImgs.count();
  if (count === 0) {
    bug('Low', 'Stairs piece', ['Select Stairs', 'Click board'],
      'Stairs image appears (2×2)', 'No Stairs image found', '20-stairs-placed');
  } else {
    info(`Stairs placed — found ${count} image(s)`);
  }
}

async function testBlockerPiece(page) {
  console.log('\n=== TEST 15: Blocker / Double Blocker ===');

  const blockerBtn = page.getByRole('button', { name: /blocked square/i });
  if (await blockerBtn.count() === 0) {
    warn('"Blocked Square" button not found');
    return;
  }
  await blockerBtn.first().click();
  await page.waitForTimeout(300);

  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) return;
  const box = await board.boundingBox();
  if (!box) return;

  await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.8);
  await page.waitForTimeout(300);
  await ss(page, '21-blocker-placed');
  info('Blocker placed');
}

async function testPersistence(page) {
  console.log('\n=== TEST 16: Persistence (Save & Reload) ===');

  // Save the quest
  const saveBtn = page.getByRole('button', { name: /save/i });
  if (await saveBtn.count() > 0) {
    await saveBtn.first().click();
    await page.waitForTimeout(500);
    await ss(page, '22-after-save');
    info('Clicked Save button');
  } else {
    // Some apps auto-save; check for auto-save indicator
    const autoSave = page.locator('[class*="save"], [class*="auto-save"]');
    if (await autoSave.count() > 0) {
      info('Auto-save indicator found');
    } else {
      warn('No Save button found — may be auto-save');
    }
  }

  // Count placed pieces before reload
  const piecesBefore = await page.locator('img[src*=".png"]').count();
  info(`Pieces before reload: ${piecesBefore}`);

  // Reload page
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await ss(page, '22-after-reload');

  // Navigate back to the quest
  // Look for quest list and click on the same quest
  const questItems = page.locator('[class*="quest-item"], [class*="quest"]').filter({ hasText: 'QA Pieces Test' });
  if (await questItems.count() > 0) {
    await questItems.first().click();
    await page.waitForTimeout(500);
  }

  const openBtn = page.getByRole('button', { name: /open|play|edit|view/i }).first();
  if (await openBtn.count() > 0) {
    await openBtn.click();
    await page.waitForTimeout(1000);
  }

  await ss(page, '22-after-reload-quest');

  // Switch to edit mode
  const editBtn = page.getByRole('button', { name: /edit/i });
  if (await editBtn.count() > 0) {
    await editBtn.first().click();
    await page.waitForTimeout(500);
  }

  await ss(page, '22-after-reload-edit');
  const piecesAfter = await page.locator('img[src*=".png"]').count();
  info(`Pieces after reload: ${piecesAfter}`);

  if (piecesAfter < piecesBefore && piecesBefore > 0) {
    bug('Critical', 'Persistence',
      ['Place multiple pieces', 'Save quest', 'Reload page', 'Reopen quest in edit mode'],
      `All ${piecesBefore} placed pieces survive reload`,
      `Only ${piecesAfter} pieces found after reload`,
      '22-after-reload-edit'
    );
  } else if (piecesAfter >= piecesBefore && piecesBefore > 0) {
    info('Persistence OK — pieces survived reload');
  } else {
    warn('Could not compare — no pieces found before reload (may have been on non-playable cells)');
  }
}

async function testPlayModeFogBlocking(page) {
  console.log('\n=== TEST 17: Fog blocking in play mode ===');

  // Switch to play mode
  const playBtn = page.getByRole('button', { name: /play/i });
  if (await playBtn.count() === 0) {
    warn('No "Play" button found for fog blocking test');
    return;
  }
  await playBtn.first().click();
  await page.waitForTimeout(500);
  await ss(page, '23-play-mode-fog');
  info('Switched to play mode — fog should be visible');

  // Check for fog overlay elements
  const fogCells = page.locator('[class*="fog"], [style*="opacity"]');
  const fogCount = await fogCells.count();
  if (fogCount > 0) {
    info(`Found ${fogCount} fog elements`);
  } else {
    warn('No fog elements found — fog may be rendered differently');
  }
}

async function testIconsAndLabels(page) {
  console.log('\n=== TEST 18: Icons & Labels in Catalogue ===');

  // Switch back to edit mode
  const editBtn = page.getByRole('button', { name: /edit/i });
  if (await editBtn.count() > 0) {
    await editBtn.first().click();
    await page.waitForTimeout(500);
  }

  await ss(page, '24-catalogue-icons');

  // Check some specific piece labels
  const expectedLabels = ['Goblin', 'Orc', 'Skeleton', 'Trap', 'Chest', 'Bookcase', 'Hero Start', 'Door'];
  for (const label of expectedLabels) {
    const el = page.getByText(label, { exact: false });
    const count = await el.count();
    if (count === 0) {
      bug('Low', 'Catalogue labels', [`Look for piece label "${label}"`],
        `"${label}" appears in catalogue`, `"${label}" NOT found`, '24-catalogue-icons');
    } else {
      info(`Label "${label}" found`);
    }
  }
}

async function testConsoleErrors(page) {
  console.log('\n=== TEST 19: Console Errors ===');
  if (errors.length === 0) {
    info('No JS errors in browser console');
  } else {
    errors.forEach(e => {
      bug('High', 'Console errors', ['General usage of the app'],
        'No JS errors in console',
        `Error: ${e.substring(0, 200)}`,
        null
      );
    });
  }
}

async function testAllTraps(page) {
  console.log('\n=== TEST 20: All Trap pieces ===');

  const traps = ['Trap', 'Pit Trap', 'Spear Trap', 'Falling Block'];
  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) { warn('No board for trap tests'); return; }
  const box = await board.boundingBox();
  if (!box) return;

  let xOffset = 0.1;
  for (const trapName of traps) {
    const trapBtn = page.getByRole('button', { name: new RegExp(trapName, 'i') });
    if (await trapBtn.count() === 0) {
      bug('Medium', 'Traps catalogue', [`Find "${trapName}" button`],
        `"${trapName}" found in Traps`, `"${trapName}" NOT found`, '25-traps');
    } else {
      await trapBtn.first().click();
      await page.waitForTimeout(200);
      await page.mouse.click(box.x + box.width * xOffset, box.y + box.height * 0.1);
      await page.waitForTimeout(300);
      xOffset += 0.1;
      info(`"${trapName}" placed`);
    }
  }
  await ss(page, '25-all-traps-placed');
}

async function testAllMonsters(page) {
  console.log('\n=== TEST 21: All Monster pieces ===');

  const monsters = ['Goblin', 'Orc', 'Skeleton', 'Zombie', 'Mummy', 'Abomination', 'Dread Warrior', 'Gargoyle', 'Dread Sorcerer'];
  const board = page.locator('[data-testid="board"], .board, #board, [class*="board"]').first();
  if (await board.count() === 0) { warn('No board for monster tests'); return; }
  const box = await board.boundingBox();
  if (!box) return;

  let i = 0;
  for (const monsterName of monsters) {
    const monBtn = page.getByRole('button', { name: new RegExp(monsterName, 'i') });
    if (await monBtn.count() === 0) {
      bug('Low', 'Monsters catalogue', [`Find "${monsterName}" button`],
        `"${monsterName}" in Monsters`, `"${monsterName}" NOT found`, '26-monsters');
    } else {
      await monBtn.first().click();
      await page.waitForTimeout(200);
      const col = (i % 6) * 0.12 + 0.05;
      const row = Math.floor(i / 6) * 0.15 + 0.5;
      await page.mouse.click(box.x + box.width * col, box.y + box.height * row);
      await page.waitForTimeout(300);
      info(`"${monsterName}" placed`);
      i++;
    }
  }
  await ss(page, '26-all-monsters-placed');
}

async function testFurnitureBlockingProperty(page) {
  console.log('\n=== TEST 22: Furniture with blocks:true in pieces.js ===');

  // Bookcase, Fireplace, Cupboard all have blocks:true
  // In play mode, clicking a cell adjacent to bookcase should not see through it
  // This is hard to assert visually, but we can verify the pieces exist and have blocking
  const blockingFurniture = ['Bookcase', 'Fireplace', 'Cupboard'];
  for (const name of blockingFurniture) {
    const btn = page.getByRole('button', { name: new RegExp(name, 'i') });
    if (await btn.count() === 0) {
      bug('Medium', 'Blocking furniture', [`Find "${name}" in Furniture`],
        `"${name}" found`, `"${name}" NOT found`, '27-blocking');
    } else {
      info(`"${name}" (blocks:true) found in catalogue`);
    }
  }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    console.log('Starting Pieces feature QA...\n');

    await setupQuestInEditMode(page);
    await testCategoriesVisible(page);
    await testCategoryExpandCollapse(page);

    const placedPos = await testPlacingPiece(page);
    await testPlacedPieceImage(page);
    await testTogglePlacement(page, placedPos);
    await testMultiCellPiece(page);
    await testRotation(page);
    await testDoorPlacement(page);
    await testMarkerStacking(page);
    await testLetterMarker(page);
    await testSpecialMonster(page);
    await testSearchMarker(page);
    await testHeroStart(page);
    await testStairsPiece(page);
    await testBlockerPiece(page);
    await testIconsAndLabels(page);
    await testAllTraps(page);
    await testAllMonsters(page);
    await testFurnitureBlockingProperty(page);
    await testPersistence(page);
    await testPlayModeFogBlocking(page);
    await testConsoleErrors(page);

    // Final screenshot
    await ss(page, 'zz-final-state');

  } catch (err) {
    console.error('\n[FATAL]', err.message);
    await page.screenshot({ path: `${SS_DIR}/zz-crash.png` });
    errors.push(err.message);
  } finally {
    await browser.close();
  }

  // ── REPORT ────────────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('QA REPORT — Pieces Feature');
  console.log('═══════════════════════════════════════════════════════');

  if (bugs.length === 0) {
    console.log('No bugs found!');
  } else {
    console.log(`\nTotal bugs found: ${bugs.length}\n`);
    bugs.forEach((b, i) => {
      console.log(`--- Bug #${i + 1} ---`);
      console.log(`Severity:  ${b.severity}`);
      console.log(`Flow:      ${b.flow}`);
      console.log(`Steps:     ${b.steps.join(' → ')}`);
      console.log(`Expected:  ${b.expected}`);
      console.log(`Actual:    ${b.actual}`);
      if (b.screenshot) console.log(`Screenshot: ${SS_DIR}/${b.screenshot}.png`);
      console.log('');
    });
  }

  if (errors.length > 0) {
    console.log('\nBrowser JS Errors:');
    errors.forEach(e => console.log('  •', e.substring(0, 300)));
  }
})();
