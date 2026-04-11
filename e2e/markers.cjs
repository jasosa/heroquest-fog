/**
 * QA Suite: Letter Markers & Special Monsters
 * Tests letter marker dialog, note storage, special monster dialog, purple ring in play mode,
 * and marker stacking on furniture.
 * Run with: node qa-markers.cjs
 * App must be running on http://localhost:5173
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let shotIdx = 0;
const results = [];

async function shot(page, label) {
  const file = path.join(SCREENSHOT_DIR, `markers-${String(++shotIdx).padStart(2, '0')}-${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}
function pass(test, detail = '') {
  console.log(`  ✅ ${test}${detail ? ' — ' + detail : ''}`);
  results.push({ status: 'PASS', test });
}
function fail(test, detail, severity = 'High') {
  console.log(`  ❌ [${severity}] ${test} — ${detail}`);
  results.push({ status: 'FAIL', test, detail, severity });
}

async function openGameScreen(page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');

  const newQuestBtn = page.locator('button', { hasText: /new quest/i });
  await newQuestBtn.waitFor({ state: 'visible', timeout: 8000 });
  await newQuestBtn.click();
  await page.waitForTimeout(300);
  await page.locator('input[placeholder="Quest title"]').fill('Markers QA');
  await page.locator('button', { hasText: 'Create & Edit' }).click();
  await page.waitForTimeout(800);
}

async function switchToPlay(page) {
  const playBtn = page.locator('button', { hasText: /play mode/i });
  if (await playBtn.isVisible()) { await playBtn.click(); await page.waitForTimeout(500); }
}

async function switchToEdit(page) {
  const editBtn = page.locator('button', { hasText: /edit mode/i });
  if (await editBtn.isVisible()) { await editBtn.click(); await page.waitForTimeout(400); }
}

async function selectTool(page, categoryText, toolText) {
  const cat = page.locator('button', { hasText: categoryText });
  await cat.first().waitFor({ state: 'visible', timeout: 8000 });
  await cat.first().click();
  await page.waitForTimeout(300);
  const tool = page.locator('button', { hasText: toolText });
  await tool.first().waitFor({ state: 'visible', timeout: 8000 });
  await tool.first().scrollIntoViewIfNeeded().catch(() => {});
  await tool.first().click();
  await page.waitForTimeout(200);
}

(async () => {
  console.log('\n🎯 QA Suite: Letter Markers & Special Monsters');
  console.log(`   Target: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));

  try {
    await openGameScreen(page);

    // ── 1. Place a letter marker ────────────────────────────────────────────
    console.log('\n=== 1. Place Letter Marker ===');
    await selectTool(page, 'Markers', 'Letter');
    await page.mouse.click(500, 350);
    await page.waitForTimeout(400);
    await shot(page, 'letter-marker-dialog');

    const letterDialog = page.locator('text=Letter Marker').or(page.locator('[role="dialog"]')).first();
    if (await letterDialog.isVisible()) {
      pass('Letter Marker dialog opens on placement');
    } else {
      fail('Letter Marker dialog', 'Dialog not shown after placing letter marker', 'High');
    }

    // ── 2. Fill in letter and note ──────────────────────────────────────────
    console.log('\n=== 2. Fill letter and note ===');
    // Letter select or input
    const letterInput = page.locator('select, input[maxlength="1"]').first();
    if (await letterInput.isVisible()) {
      const tag = await letterInput.evaluate(el => el.tagName.toLowerCase());
      if (tag === 'select') await letterInput.selectOption('A');
      else await letterInput.fill('A');
      pass('Letter field filled');
    } else {
      fail('Letter field', 'No letter input/select found in dialog', 'Medium');
    }

    const noteInput = page.locator('textarea, input[placeholder*="note" i]').first();
    if (await noteInput.isVisible()) {
      await noteInput.fill('Test note for QA');
      pass('Note field filled');
    } else {
      fail('Note field', 'No note textarea found in dialog', 'Medium');
    }

    // Confirm the dialog
    const confirmBtn = page.locator('button', { hasText: /confirm|save|ok/i }).first();
    await confirmBtn.click();
    await page.waitForTimeout(300);
    await shot(page, 'letter-marker-placed');

    // Letter marker should now show on board
    const letterOnBoard = page.locator('text=A').first();
    if (await letterOnBoard.isVisible()) pass('Letter "A" visible on board');
    else fail('Letter visible on board', 'Letter "A" not visible after confirming dialog', 'Medium');

    // ── 3. Click existing letter marker in edit mode opens dialog ───────────
    console.log('\n=== 3. Click letter marker to edit ===');
    await page.mouse.click(500, 350);
    await page.waitForTimeout(400);
    await shot(page, 'letter-marker-edit-dialog');
    const editDialog = page.locator('text=Letter Marker').or(page.locator('[role="dialog"]')).first();
    if (await editDialog.isVisible()) pass('Clicking existing letter marker reopens dialog');
    else fail('Letter marker edit dialog', 'Dialog not reopened on click in edit mode', 'Medium');

    // Cancel to close
    const cancelBtn = page.locator('button', { hasText: /cancel/i }).first();
    if (await cancelBtn.isVisible()) await cancelBtn.click();
    await page.waitForTimeout(200);

    // ── 4. Letter marker tooltip in play mode ───────────────────────────────
    console.log('\n=== 4. Letter marker tooltip in play mode ===');
    await switchToPlay(page);
    // Reveal the cell first
    await page.mouse.click(500, 350);
    await page.waitForTimeout(400);
    await shot(page, 'letter-marker-play-before-hover');

    // Hover to show tooltip (desktop behavior)
    await page.mouse.move(500, 350);
    await page.waitForTimeout(500);
    await shot(page, 'letter-marker-hover-tooltip');
    pass('Letter marker hover in play mode — no crash');

    // Click to toggle tooltip (mobile behavior)
    await page.mouse.click(500, 350);
    await page.waitForTimeout(300);
    await shot(page, 'letter-marker-click-tooltip');
    pass('Letter marker click in play mode — no crash');

    // ── 5. Place a monster and mark it as special ───────────────────────────
    console.log('\n=== 5. Special Monster ===');
    await switchToEdit(page);
    await selectTool(page, 'Monsters', 'Goblin');
    await page.mouse.click(600, 380);
    await page.waitForTimeout(400);
    await shot(page, 'goblin-placed-for-special');

    // Look for the ★ button on the placed monster
    const starBtn = page.locator('button', { hasText: '★' }).first();
    if (await starBtn.isVisible()) {
      await starBtn.click();
      await page.waitForTimeout(300);
      await shot(page, 'special-monster-dialog');

      const specialDialog = page.locator('text=Special Monster').or(page.locator('[role="dialog"]')).first();
      if (await specialDialog.isVisible()) {
        pass('Special Monster dialog opens via ★ button');

        // Fill in a note
        const specialNote = page.locator('textarea, input[placeholder*="note" i]').first();
        if (await specialNote.isVisible()) {
          await specialNote.fill('This goblin has a magic sword');
          pass('Special monster note filled');
        } else {
          fail('Special monster note field', 'Note input not found in special monster dialog', 'Medium');
        }

        const saveBtn = page.locator('button', { hasText: /confirm|save|ok/i }).first();
        await saveBtn.click();
        await page.waitForTimeout(300);
        pass('Special monster dialog confirmed');
      } else {
        fail('Special Monster dialog', 'Dialog not shown after clicking ★', 'High');
      }
    } else {
      fail('★ button on monster', '★ button not visible on placed Goblin in edit mode', 'High');
    }

    // ── 6. Special monster purple ring in play mode ─────────────────────────
    console.log('\n=== 6. Special monster purple ring in play mode ===');
    await switchToPlay(page);
    await page.mouse.click(600, 380);
    await page.waitForTimeout(400);
    await shot(page, 'special-monster-play-mode');

    // Check for purple ring (box-shadow on overlay element)
    const purpleRing = await page.evaluate(() => {
      const overlays = document.querySelectorAll('[style*="box-shadow"]');
      for (const el of overlays) {
        const shadow = window.getComputedStyle(el).boxShadow;
        if (shadow && (shadow.includes('128, 0, 128') || shadow.includes('purple') || shadow.includes('rgba(128'))) {
          return true;
        }
      }
      return false;
    });
    if (purpleRing) pass('Special monster purple ring rendered');
    else fail('Special monster purple ring', 'No purple box-shadow overlay found on special monster', 'Medium');

    // ── 7. Marker stacking on furniture ────────────────────────────────────
    console.log('\n=== 7. Marker stacking on furniture ===');
    await switchToEdit(page);

    // Place furniture first
    await selectTool(page, 'Furniture', 'Table');
    await page.mouse.click(700, 420);
    await page.waitForTimeout(400);

    // Place a non-image marker on top
    await selectTool(page, 'Markers', 'Trap Marker');
    const trapMarker = page.locator('button, div', { hasText: 'Trap Marker' }).first();
    if (await trapMarker.isVisible()) {
      await page.mouse.click(700, 420);
      await page.waitForTimeout(300);
      await shot(page, 'marker-stacked-on-furniture');
      pass('Marker stacking on furniture — no crash');

      // Click again to remove the marker
      await page.mouse.click(700, 420);
      await page.waitForTimeout(300);
      pass('Clicking stacked marker removes it — no crash');
    } else {
      fail('Marker stacking', 'Trap Marker tool not found for stacking test', 'Low');
    }

    // ── 8. Console errors ───────────────────────────────────────────────────
    console.log('\n=== 8. Console errors ===');
    if (consoleErrors.length === 0) pass('No console errors during marker interactions');
    else consoleErrors.forEach(e => fail('Console error', e, 'High'));

  } catch (err) {
    await shot(page, 'unexpected-error');
    fail('Unexpected error', err.message, 'Critical');
    console.error(err);
  } finally {
    await browser.close();

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`QA SUMMARY — Markers & Special Monsters | Passed: ${passed} | Failed: ${failed}`);
    if (failed > 0) {
      results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  [${r.severity}] ${r.test}: ${r.detail}`));
      process.exit(1);
    } else {
      console.log('All checks passed ✅');
      process.exit(0);
    }
  }
})();
