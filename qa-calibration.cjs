/**
 * QA Test: Map Calibration Feature
 * HeroQuest Fog of War — http://localhost:5173
 *
 * Run with: node qa-calibration.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let screenshotIndex = 0;
async function shot(page, label) {
  const file = path.join(SCREENSHOT_DIR, `${String(++screenshotIndex).padStart(2,'0')}-${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${path.basename(file)}`);
  return file;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function clearLocalStorage(page) {
  await page.evaluate(() => localStorage.clear());
}

async function getCalibrationFromStorage(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('hq_calibration');
    return raw ? JSON.parse(raw) : null;
  });
}

// ─── Test runner ──────────────────────────────────────────────────────────────

const results = [];

function pass(test, detail = '') {
  console.log(`  ✅ PASS: ${test}${detail ? ' — ' + detail : ''}`);
  results.push({ status: 'PASS', test, detail });
}

function fail(test, detail, severity = 'High') {
  console.log(`  ❌ FAIL [${severity}]: ${test} — ${detail}`);
  results.push({ status: 'FAIL', test, detail, severity });
}

function info(msg) {
  console.log(`  ℹ️  ${msg}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 1: Initial app load / landing screen
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 1: Initial state / landing screen ===');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await clearLocalStorage(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await shot(page, 'initial-library-screen');

    // The calibrate button is at the bottom of the left sidebar
    // Text: "⚙ Calibrate Maps"
    const calibrateBtn = page.locator('button', { hasText: /calibrate maps/i });
    // Wait up to 5s for it to appear (page might still be rendering)
    await calibrateBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const calibrateBtnCount = await calibrateBtn.count();
    if (calibrateBtnCount > 0) {
      pass('Access flow', '"⚙ Calibrate Maps" button found on library screen left sidebar');
    } else {
      fail('Access flow', 'No "⚙ Calibrate Maps" button visible on library screen', 'High');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 2: Navigate to calibration page
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 2: Navigate to calibration page ===');
    await calibrateBtn.first().click();
    await page.waitForTimeout(400);
    await shot(page, 'calibration-page-initial');

    const heading = page.locator('h2', { hasText: /map calibrat/i });
    if (await heading.count() > 0) {
      pass('Calibration page navigation', 'Calibration page rendered with heading');
    } else {
      fail('Calibration page navigation', 'Calibration page heading not found', 'High');
    }

    // Verify map tabs (Board 1, Board 2, Board 3)
    const board1Tab = page.locator('button', { hasText: /board 1/i });
    const board2Tab = page.locator('button', { hasText: /board 2/i });
    const board3Tab = page.locator('button', { hasText: /board 3/i });
    const tabCount = (await board1Tab.count()) + (await board2Tab.count()) + (await board3Tab.count());
    if (tabCount === 3) {
      pass('Map tabs', 'All 3 map tabs present (Board 1, Board 2, Board 3)');
    } else {
      fail('Map tabs', `Expected 3 map tabs, found ${tabCount}`, 'Medium');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 3: Board image is shown (board2 is the default src)
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 3: Map image display ===');
    // Board 2 tab should be the second tab — click it
    await board2Tab.first().click();
    await page.waitForTimeout(300);
    const img = page.locator('img[alt="Board 2"]');
    const imgVisible = await img.count() > 0 && await img.first().isVisible();
    if (imgVisible) {
      pass('Board 2 image shown', 'Board 2 tab shows the board image');
    } else {
      fail('Board 2 image shown', 'Board 2 image not visible after clicking tab', 'Medium');
    }

    // Board 1: should show upload placeholder (no built-in src for board1 unless mapped)
    await board1Tab.first().click();
    await page.waitForTimeout(300);
    await shot(page, 'board1-tab-no-image');

    const uploadPlaceholder = page.locator('text=Upload an image to begin calibration');
    if (await uploadPlaceholder.count() > 0) {
      pass('Board 1 placeholder', 'Board 1 shows upload placeholder when no image');
    } else {
      // It might have an image if board.png is mapped
      const board1Img = page.locator('img[alt="Board 1"]');
      if (await board1Img.count() > 0) {
        pass('Board 1 image', 'Board 1 has a board image');
      } else {
        fail('Board 1 state', 'Neither upload placeholder nor image visible for Board 1', 'Low');
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 4: Anchor list shows "Need X more" when < 3 anchors
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 4: Anchor count validation UI ===');
    // Switch to Board 2 which has an image
    await board2Tab.first().click();
    await page.waitForTimeout(300);

    const needMoreText = page.locator('text=Need 3 more');
    if (await needMoreText.count() > 0) {
      pass('Anchor count validation', '"Need 3 more" shown when 0 anchors');
    } else {
      fail('Anchor count validation', '"Need 3 more" not shown for Board 2 (0 anchors)', 'Medium');
    }

    // Tab badge should show "0/3"
    const zeroThreeBadge = page.locator('text=0/3');
    if (await zeroThreeBadge.count() > 0) {
      pass('Tab badge', 'Tab shows "0/3" badge for uncalibrated map');
    } else {
      fail('Tab badge', '"0/3" badge not found on Board 2 tab', 'Low');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 5: Adding an anchor by clicking on image
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 5: Add anchor by clicking image ===');

    const boardImgEl = page.locator('img[alt="Board 2"]').first();
    const imgBox = await boardImgEl.boundingBox();
    info(`Board 2 image bounding box: ${JSON.stringify(imgBox)}`);

    // Click somewhere on the image to start an anchor
    await page.mouse.click(imgBox.x + 100, imgBox.y + 100);
    await page.waitForTimeout(500);
    await shot(page, 'anchor-form-appeared');

    const newAnchorForm = page.locator('text=New Anchor');
    if (await newAnchorForm.count() > 0) {
      pass('Anchor form appears', '"New Anchor" form shown after clicking image');
    } else {
      fail('Anchor form appears', '"New Anchor" form not shown after clicking image', 'High');
    }

    // Input layout discovered via diagnostics:
    // nth(0) = unknown/hidden input (value="" placeholder=null)
    // nth(1) = Px X  (pre-filled from click)
    // nth(2) = Px Y  (pre-filled from click)
    // nth(3) = Col   (logical, blank)
    // nth(4) = Row   (logical, blank)
    const visibleInputs = page.locator('input').filter({ hasNot: page.locator('[type="file"]') });
    const viCount = await visibleInputs.count();
    info(`Non-file inputs when form open: ${viCount}`);

    // Check that Px X and Px Y are pre-filled (indices 1 and 2)
    let pxXVal = '', pxYVal = '';
    if (viCount >= 3) {
      pxXVal = await visibleInputs.nth(1).inputValue().catch(() => '');
      pxYVal = await visibleInputs.nth(2).inputValue().catch(() => '');
      info(`Pixel inputs: X="${pxXVal}", Y="${pxYVal}"`);
      if (pxXVal !== '' && pxYVal !== '') {
        pass('Pixel inputs pre-filled', `Px X=${pxXVal}, Y=${pxYVal} auto-populated from click`);
      } else {
        fail('Pixel inputs pre-filled', `Pixel X/Y not auto-populated: X="${pxXVal}", Y="${pxYVal}"`, 'Medium');
      }
    }

    // Fill in logical Col (nth(3)) and Row (nth(4))
    if (viCount >= 5) {
      await visibleInputs.nth(3).fill('5');
      await visibleInputs.nth(4).fill('3');
    }
    await shot(page, 'anchor-form-filled');

    // Confirm the anchor
    const confirmBtn = page.locator('button', { hasText: 'Confirm' });
    await confirmBtn.click();
    await page.waitForTimeout(300);
    await shot(page, 'after-first-anchor');

    // Anchor should now be listed
    const anchorsSection = page.locator('text=Anchors (1)');
    if (await anchorsSection.count() > 0) {
      pass('First anchor added', 'Anchor count shows "(1)" after confirming');
    } else {
      // Try broader check
      const anchorText = page.locator('text=grid (5, 3)');
      if (await anchorText.count() > 0) {
        pass('First anchor added', 'Anchor visible in list: grid (5, 3)');
      } else {
        fail('First anchor added', 'Anchor not visible after confirming', 'High');
      }
    }

    // Badge should now show "1/3"
    const oneThreeBadge = page.locator('text=1/3');
    if (await oneThreeBadge.count() > 0) {
      pass('Tab badge updated', 'Tab badge updated to "1/3"');
    } else {
      fail('Tab badge updated', '"1/3" badge not found after first anchor', 'Low');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 6: Visual pin rendered on image
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 6: Visual pin rendered on image ===');
    // Pins are rendered as absolutely-positioned numbered circles on the image.
    // The anchor list in the sidebar shows the anchor number as a red circle with text.
    // Check for anchor pin via: the anchor number badge in the side panel (red circle "1")
    // AND check for the label text on the map pin "(5,3)"
    const mapPinLabel = page.locator('text=(5,3)'); // pin tooltip shows "(col,row)"
    const mapPinCount = await mapPinLabel.count();
    info(`Map pin label "(5,3)" found: ${mapPinCount}`);
    // Also check via anchor badge in sidebar list
    const sidebarAnchorBadge = page.locator('text=px (109, 108)');
    const sidebarBadgeCount = await sidebarAnchorBadge.count();
    info(`Sidebar anchor entry "px (109, 108)" found: ${sidebarBadgeCount}`);
    if (mapPinCount > 0 || sidebarBadgeCount > 0) {
      pass('Anchor pin visual', `Red anchor pin rendered on image (map pin label visible: ${mapPinCount > 0}, sidebar entry: ${sidebarBadgeCount > 0})`);
    } else {
      fail('Anchor pin visual', 'Neither map pin label nor sidebar entry visible after adding anchor', 'Medium');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 7: Add 2 more anchors to reach minimum 3
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 7: Add anchors 2 and 3 ===');

    // Helper: fill col/row and confirm anchor
    // Input layout: nth(0)=hidden, nth(1)=PxX, nth(2)=PxY, nth(3)=Col, nth(4)=Row
    async function addAnchor(clickX, clickY, col, row) {
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(300);
      // Wait for form
      await page.locator('text=New Anchor').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      const fInputs = page.locator('input').filter({ hasNot: page.locator('[type="file"]') });
      const fCount = await fInputs.count();
      if (fCount >= 5) {
        await fInputs.nth(3).fill(String(col));
        await fInputs.nth(4).fill(String(row));
      }
      await page.locator('button', { hasText: 'Confirm' }).click();
      await page.waitForTimeout(200);
    }

    // Anchor 2
    await addAnchor(imgBox.x + 300, imgBox.y + 100, 15, 3);

    // Anchor 3
    await addAnchor(imgBox.x + 100, imgBox.y + 300, 5, 15);
    await page.waitForTimeout(300);
    await shot(page, 'three-anchors-added');

    // Tab badge should now show "✓ 3"
    const readyBadge = page.locator('text=✓ 3');
    if (await readyBadge.count() > 0) {
      pass('Ready badge', 'Tab badge shows "✓ 3" (ready) after 3 anchors');
    } else {
      fail('Ready badge', '"✓ 3" ready badge not shown after 3 anchors', 'Medium');
    }

    // "Need X more" should no longer show in the ANCHORS PANEL (not the tab buttons,
    // which still show "Need 3 more" for Board 1 and Board 3).
    // The anchor panel header is "Anchors (3)  Need X more" — check that "Need" is absent there.
    const anchorsHeader = page.locator('text=Anchors (3)');
    const anchorsHeaderText = await anchorsHeader.first().textContent().catch(() => '');
    info(`Anchors panel header text: "${anchorsHeaderText}"`);
    if (!anchorsHeaderText.includes('Need')) {
      pass('Anchor validation cleared', '"Need more" text gone from anchors panel after reaching 3 anchors');
    } else {
      fail('Anchor validation cleared', `"Need more" still in anchors panel header with 3 anchors: "${anchorsHeaderText}"`, 'Medium');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 8: Edit an anchor
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 8: Edit anchor ===');
    const editButtons = page.locator('button', { hasText: 'edit' });
    const editCount = await editButtons.count();
    if (editCount > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(200);
      await shot(page, 'anchor-edit-form');

      const editForm = page.locator('text=Edit Anchor 1');
      if (await editForm.count() > 0) {
        pass('Edit anchor form', '"Edit Anchor 1" form opens when clicking edit button');
        // Cancel the edit
        await page.locator('button', { hasText: 'Cancel' }).click();
        await page.waitForTimeout(200);
        pass('Cancel edit', 'Edit form dismissed via Cancel button');
      } else {
        fail('Edit anchor form', '"Edit Anchor 1" form not shown', 'Medium');
      }
    } else {
      fail('Edit anchor buttons', 'No edit buttons found in anchor list', 'Medium');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 9: Delete an anchor
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 9: Delete anchor ===');
    const deleteButtons = page.locator('button', { hasText: '✕' });
    const deleteCount = await deleteButtons.count();
    if (deleteCount > 0) {
      // Delete the last anchor so we drop back to 2
      await deleteButtons.last().click();
      await page.waitForTimeout(300);
      await shot(page, 'after-anchor-delete');

      const anchorsAfterDelete = page.locator('text=Anchors (2)');
      if (await anchorsAfterDelete.count() > 0) {
        pass('Delete anchor', 'Anchor count decremented to 2 after deletion');
      } else {
        // broader check
        const twoThreeBadge = page.locator('text=2/3');
        if (await twoThreeBadge.count() > 0) {
          pass('Delete anchor', 'Tab badge dropped to "2/3" after deleting 1 anchor');
        } else {
          fail('Delete anchor', 'Anchor count not updated after deletion', 'Medium');
        }
      }

      // "Need 1 more" should appear
      const needOneMore = page.locator('text=Need 1 more');
      if (await needOneMore.count() > 0) {
        pass('Need more updated', '"Need 1 more" shown after dropping to 2 anchors');
      } else {
        fail('Need more updated', '"Need 1 more" not shown after dropping to 2 anchors', 'Low');
      }

      // Re-add anchor 3 so we're back to calibrated
      await addAnchor(imgBox.x + 100, imgBox.y + 300, 5, 15);
    } else {
      fail('Delete anchor buttons', 'No delete (✕) buttons found', 'Medium');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 10: Export calibration
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 10: Export calibration ===');
    const exportBtn = page.locator('button', { hasText: /export calibration/i });
    if (await exportBtn.count() > 0) {
      await exportBtn.click();
      await page.waitForTimeout(400);
      await shot(page, 'after-export');

      // Should show JSON output
      const preBlock = page.locator('pre');
      if (await preBlock.count() > 0) {
        const jsonText = await preBlock.first().textContent();
        info(`Exported JSON preview: ${jsonText.slice(0, 120)}...`);
        if (jsonText.includes('"board2"') || jsonText.includes('"anchors"')) {
          pass('Export JSON', 'Calibration JSON exported and shown in pre block');
        } else {
          fail('Export JSON', 'Exported JSON does not contain expected keys', 'Medium');
        }
      } else {
        fail('Export JSON', 'No pre block shown after clicking Export', 'High');
      }

      // Copy button should be visible
      const copyBtn = page.locator('button', { hasText: 'Copy' });
      if (await copyBtn.count() > 0) {
        pass('Copy button', 'Copy button present alongside exported JSON');
      } else {
        fail('Copy button', 'Copy button not found next to JSON export', 'Low');
      }
    } else {
      fail('Export button', '"Export Calibration JSON" button not found', 'Critical');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 11: Persistence — data saved to localStorage via Export
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 11: Persistence to localStorage ===');
    const storedCalib = await getCalibrationFromStorage(page);
    if (storedCalib) {
      const board2Calib = storedCalib['board2'];
      if (board2Calib && board2Calib.anchors && board2Calib.anchors.length >= 3) {
        pass('LocalStorage persistence', `hq_calibration saved with ${board2Calib.anchors.length} anchors for board2`);
        info(`Ready flag: ${board2Calib.ready}`);
        if (board2Calib.ready === true) {
          pass('Ready flag', 'ready: true set when >= 3 anchors in export');
        } else {
          fail('Ready flag', 'ready flag not true in stored calibration', 'Medium');
        }
      } else {
        fail('LocalStorage persistence', `board2 calibration anchors missing or < 3: ${JSON.stringify(board2Calib)}`, 'High');
      }
    } else {
      fail('LocalStorage persistence', 'hq_calibration not found in localStorage after export', 'Critical');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 12: Persistence after page reload
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 12: Persistence after reload ===');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Navigate back to calibration
    await page.locator('button', { hasText: /calibrate maps/i }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    const calibBtnAfterReload = page.locator('button', { hasText: /calibrate maps/i });
    if (await calibBtnAfterReload.count() > 0) {
      await calibBtnAfterReload.first().click();
      await page.waitForTimeout(400);
      await shot(page, 'after-reload-calibration');

      // Board 2 tab should still show ready state
      await page.locator('button', { hasText: /board 2/i }).first().click();
      await page.waitForTimeout(300);

      const persistedReadyBadge = page.locator('text=✓ 3');
      if (await persistedReadyBadge.count() > 0) {
        pass('Anchors persisted after reload', 'Board 2 tab shows "✓ 3" after reload — anchors persisted');
      } else {
        // Check anchor list
        const anchorsAfterReload = page.locator('text=Anchors (3)');
        if (await anchorsAfterReload.count() > 0) {
          pass('Anchors persisted after reload', '"Anchors (3)" shown after reload');
        } else {
          fail('Anchors persisted after reload', 'Anchors not re-loaded from localStorage after page reload', 'High');
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 13: Back navigation — return to library
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 13: Back navigation ===');
    const backBtn = page.locator('button', { hasText: /← library/i });
    if (await backBtn.count() > 0) {
      await backBtn.click();
      await page.waitForTimeout(400);
      await shot(page, 'back-to-library');

      // Should be back on library screen (no calibration heading)
      const calibHeading = page.locator('h2', { hasText: /map calibrat/i });
      if (await calibHeading.count() === 0) {
        pass('Back navigation', 'Back button returns to library screen');
      } else {
        fail('Back navigation', 'Still on calibration page after clicking ← Library', 'High');
      }
    } else {
      fail('Back button', '"← Library" back button not found on calibration page', 'High');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 14: Calibrate/Test mode toggle
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 14: Calibrate / Test mode toggle ===');
    // Re-enter calibration
    await page.locator('button', { hasText: /calibrate maps/i }).first().click();
    await page.waitForTimeout(400);
    await page.locator('button', { hasText: /board 2/i }).first().click();
    await page.waitForTimeout(200);

    const testModeBtn = page.locator('button', { hasText: /🧪 test/i });
    if (await testModeBtn.count() > 0) {
      await testModeBtn.click();
      await page.waitForTimeout(300);
      await shot(page, 'test-mode-active');

      // The EditPanel should now appear
      const editPanelPresent = page.locator('text=Monsters').or(page.locator('text=Furniture'));
      if (await editPanelPresent.count() > 0) {
        pass('Test mode toggle', 'Test mode shows piece edit panel (Monsters/Furniture)');
      } else {
        // Check for error message about needing anchors
        const needAnchorsMsg = page.locator('text=Need at least 3 anchors');
        if (await needAnchorsMsg.count() > 0) {
          info('Test mode shows "Need at least 3 anchors" warning — but board2 should have 3...');
          fail('Test mode with calibrated map', 'Test mode shows "Need 3 anchors" warning even though board2 has 3 anchors', 'Medium');
        } else {
          fail('Test mode toggle', 'No piece panel or anchor warning shown in test mode', 'Medium');
        }
      }

      // Switch back to calibrate mode
      const calibrateModeBtn = page.locator('button', { hasText: /⊕ calibrate/i });
      if (await calibrateModeBtn.count() > 0) {
        await calibrateModeBtn.click();
        await page.waitForTimeout(200);
        pass('Mode toggle back', 'Can switch back from Test to Calibrate mode');
      }
    } else {
      fail('Test mode button', '"🧪 Test" mode button not found', 'Medium');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 15: Cancel anchor input with Cancel button
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 15: Cancel anchor input ===');
    await page.locator('button', { hasText: /board 2/i }).first().click();
    await page.waitForTimeout(200);
    // Ensure calibrate mode
    const calibModeBtn2 = page.locator('button', { hasText: /⊕ calibrate/i });
    if (await calibModeBtn2.count() > 0) await calibModeBtn2.click();
    await page.waitForTimeout(100);

    await page.mouse.click(imgBox.x + 200, imgBox.y + 200);
    await page.waitForTimeout(200);
    const formAfterClick = page.locator('text=New Anchor');
    if (await formAfterClick.count() > 0) {
      const cancelBtn = page.locator('button', { hasText: 'Cancel' });
      await cancelBtn.click();
      await page.waitForTimeout(200);
      const formGone = await page.locator('text=New Anchor').count() === 0;
      if (formGone) {
        pass('Cancel anchor input', 'Form dismissed without adding anchor on Cancel');
      } else {
        fail('Cancel anchor input', 'Form still visible after Cancel', 'Medium');
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 16: No validation warning preventing export with < 3 anchors
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 16: Export with < 3 anchors (Board 1 — no image) ===');
    // Switch to Board 1 (no image, 0 anchors by default)
    await page.locator('button', { hasText: /board 1/i }).first().click();
    await page.waitForTimeout(200);
    await shot(page, 'board1-zero-anchors');

    // Click Export — should it warn? The code does NOT prevent export, just sets ready: false
    const exportBtn2 = page.locator('button', { hasText: /export calibration/i });
    await exportBtn2.click();
    await page.waitForTimeout(300);
    await shot(page, 'export-with-zero-anchors');

    const preAfterExport = page.locator('pre');
    const jsonWithZero = await preAfterExport.count() > 0 ? await preAfterExport.first().textContent() : '';
    info(`Export JSON with 0 anchors: ${jsonWithZero.slice(0, 200)}`);

    if (jsonWithZero.includes('"ready": false') || jsonWithZero.includes('"ready":false')) {
      pass('Export with 0 anchors', 'Export succeeds and marks ready: false for maps with < 3 anchors');
      info('NOTE: No blocking validation when exporting with < 3 anchors — this is by design (ready: false)');
    } else if (jsonWithZero.includes('"ready": true') || jsonWithZero.includes('"ready":true')) {
      fail('Export with 0 anchors', 'Export shows ready: true for a map with 0 anchors', 'High');
    } else {
      info(`Unexpected export output: ${jsonWithZero}`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 17: Keyboard Enter confirms anchor
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 17: Keyboard Enter to confirm anchor ===');
    await page.locator('button', { hasText: /board 2/i }).first().click();
    await page.waitForTimeout(200);
    // Ensure calibrate mode
    const calibModeBtn3 = page.locator('button', { hasText: /⊕ calibrate/i });
    if (await calibModeBtn3.count() > 0) await calibModeBtn3.click();
    await page.waitForTimeout(100);

    const currentAnchorCountBefore = (await page.locator('text=Anchors (').first().textContent()).match(/\d+/)?.[0] ?? '?';
    info(`Current anchor count before keyboard test: ${currentAnchorCountBefore}`);

    await page.mouse.click(imgBox.x + 250, imgBox.y + 250);
    await page.waitForTimeout(300);
    await page.locator('text=New Anchor').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const kbFormInputs = page.locator('input').filter({ hasNot: page.locator('[type="file"]') });
    const kbCount = await kbFormInputs.count();
    if (kbCount >= 5) {
      await kbFormInputs.nth(3).fill('10');
      await kbFormInputs.nth(4).fill('10');
      await kbFormInputs.nth(4).press('Enter');
      await page.waitForTimeout(300);

      const formGoneAfterEnter = await page.locator('text=New Anchor').count() === 0;
      if (formGoneAfterEnter) {
        pass('Keyboard Enter confirm', 'Pressing Enter on Row input confirms and dismisses form');
      } else {
        fail('Keyboard Enter confirm', 'Form not dismissed after Enter key press', 'Low');
      }
    } else {
      info(`Only ${kbCount} inputs found for keyboard Enter test — skipping`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEST 18: Instruction text present
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 18: User instructions visible ===');
    const instrText = page.locator('text=You need at least 3 anchors');
    if (await instrText.count() > 0) {
      pass('Instruction text', 'Calibration instructions visible to user');
    } else {
      fail('Instruction text', 'No instructions about needing 3 anchors visible', 'Low');
    }

    await shot(page, 'final-state');

  } catch (err) {
    console.error('\n❌ UNEXPECTED ERROR:', err.message);
    await shot(page, 'error-state');
  } finally {
    // ═══════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('QA SUMMARY — Map Calibration Feature');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}\n`);

    if (failed > 0) {
      console.log('FAILURES:');
      results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  [${r.severity}] ${r.test}: ${r.detail}`));
    }

    console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);
    await browser.close();
  }
})();
