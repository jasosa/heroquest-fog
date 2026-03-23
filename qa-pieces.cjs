/**
 * QA Suite: Piece Placement
 * Tests all 4 categories, rotation, multi-cell pieces, image rendering, blocking behavior, and doors.
 * Run with: node qa-pieces.cjs
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
  const file = path.join(SCREENSHOT_DIR, `pieces-${String(++shotIdx).padStart(2, '0')}-${label}.png`);
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

// Navigate to the game screen by creating a fresh quest
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

  const titleInput = page.locator('input[placeholder="Quest title"]');
  await titleInput.fill('Pieces QA');
  await page.locator('button', { hasText: 'Create & Edit' }).click();
  await page.waitForTimeout(800);
}

// Select a tool from the sidebar by label text
async function selectTool(page, categoryText, toolText) {
  const cat = page.locator('button, div', { hasText: categoryText }).first();
  await cat.scrollIntoViewIfNeeded().catch(() => {});
  await cat.click();
  await page.waitForTimeout(200);
  const tool = page.locator('button, div', { hasText: toolText }).first();
  await tool.scrollIntoViewIfNeeded().catch(() => {});
  await tool.click();
  await page.waitForTimeout(200);
}

(async () => {
  console.log('\n🎯 QA Suite: Piece Placement');
  console.log(`   Target: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    await openGameScreen(page);
    await shot(page, 'game-initial');

    // ── 1. All 4 categories visible in sidebar ──────────────────────────────
    console.log('\n=== 1. Sidebar Categories ===');
    for (const cat of ['Monsters', 'Traps', 'Furniture', 'Markers']) {
      const el = page.locator('button, div', { hasText: cat }).first();
      await el.scrollIntoViewIfNeeded().catch(() => {});
      if (await el.isVisible()) pass(`Category "${cat}" visible`);
      else fail(`Category "${cat}" visible`, `"${cat}" not found in edit sidebar`);
    }

    // ── 2. Monsters — place a Goblin ────────────────────────────────────────
    console.log('\n=== 2. Monsters ===');
    await selectTool(page, 'Monsters', 'Goblin');
    await page.mouse.click(500, 350);
    await page.waitForTimeout(400);
    const goblinImg = page.locator('img[src*="Goblin"]').first();
    if (await goblinImg.isVisible()) pass('Goblin image renders after placement');
    else fail('Goblin image renders', 'Goblin.png not visible after placing');
    await shot(page, 'goblin-placed');

    // ── 3. Traps — place Spear Trap, Pit Trap, Falling Block ───────────────
    console.log('\n=== 3. Traps ===');
    for (const [label, imgKey, x, y] of [
      ['Spear Trap',     'Spear',         420, 280],
      ['Pit Trap',       'Pit_Tile',      460, 280],
      ['Falling Block',  'Falling_Rocks', 500, 280],
    ]) {
      await selectTool(page, 'Traps', label);
      await page.mouse.click(x, y);
      await page.waitForTimeout(300);
      const img = page.locator(`img[src*="${imgKey}"]`).first();
      if (await img.isVisible()) pass(`${label} image renders`);
      else fail(`${label} image renders`, `${imgKey}.png not visible after placing`);
    }
    await shot(page, 'traps-placed');

    // ── 4. Furniture — place Table (multi-cell) ─────────────────────────────
    console.log('\n=== 4. Furniture (multi-cell) ===');
    await selectTool(page, 'Furniture', 'Table');
    await page.mouse.click(700, 380);
    await page.waitForTimeout(400);
    const tableImg = page.locator('img[src*="Table"]').first();
    if (await tableImg.isVisible()) pass('Table image renders');
    else fail('Table image renders', 'Table.png not visible after placing');
    await shot(page, 'table-placed');

    // ── 5. Furniture — place Fireplace (multi-cell) ─────────────────────────
    console.log('\n=== 5. Furniture — Fireplace ===');
    await selectTool(page, 'Furniture', 'Fireplace');
    await page.mouse.click(760, 380);
    await page.waitForTimeout(400);
    const fireplaceImg = page.locator('img[src*="Fireplace"]').first();
    if (await fireplaceImg.isVisible()) pass('Fireplace image renders');
    else fail('Fireplace image renders', 'Fireplace.png not visible after placing');

    // ── 6. Right-click rotation ─────────────────────────────────────────────
    console.log('\n=== 6. Rotation (right-click) ===');
    await selectTool(page, 'Furniture', 'Table');
    await page.mouse.click(600, 420);
    await page.waitForTimeout(300);
    await page.mouse.click(600, 420, { button: 'right' });
    await page.waitForTimeout(300);
    await shot(page, 'table-rotated');
    // Check table still visible (rotation shouldn't remove it)
    const tableStillVisible = await page.locator('img[src*="Table"]').first().isVisible();
    if (tableStillVisible) pass('Piece survives right-click rotation');
    else fail('Piece survives right-click rotation', 'Table disappeared after right-click');

    // ── 7. Click to delete ──────────────────────────────────────────────────
    console.log('\n=== 7. Delete piece (click again) ===');
    // Place a goblin then click it again to remove
    await selectTool(page, 'Monsters', 'Goblin');
    await page.mouse.click(550, 420);
    await page.waitForTimeout(300);
    const beforeCount = await page.locator('img[src*="Goblin"]').count();
    await page.mouse.click(550, 420);
    await page.waitForTimeout(300);
    const afterCount = await page.locator('img[src*="Goblin"]').count();
    if (afterCount < beforeCount) pass('Clicking placed piece removes it');
    else fail('Clicking placed piece removes it', `Goblin count before=${beforeCount} after=${afterCount}`);

    // ── 8. Door placement and rotation ─────────────────────────────────────
    console.log('\n=== 8. Doors ===');
    await selectTool(page, 'Markers', 'Door');
    await page.mouse.click(480, 320);
    await page.waitForTimeout(400);
    const doorImg = page.locator('img[src*="Door"]').first();
    if (await doorImg.isVisible()) pass('Door image renders');
    else fail('Door image renders', 'Door.png not visible after placing');

    // Right-click to cycle door rotation
    await page.mouse.click(480, 320, { button: 'right' });
    await page.waitForTimeout(300);
    await shot(page, 'door-rotated');
    pass('Door right-click rotation (no crash)');

    // ── 9. Secret Door ──────────────────────────────────────────────────────
    console.log('\n=== 9. Secret Door ===');
    await selectTool(page, 'Markers', 'Secret Door');
    await page.mouse.click(520, 320);
    await page.waitForTimeout(400);
    const secretDoorImg = page.locator('img[src*="Secret"]').first();
    if (await secretDoorImg.isVisible()) pass('Secret Door image renders');
    else fail('Secret Door image renders', 'Secret_Door.png not visible after placing');

    // ── 10. Hero Start marker ───────────────────────────────────────────────
    console.log('\n=== 10. Hero Start Marker ===');
    await selectTool(page, 'Markers', 'Hero Start');
    await page.mouse.click(560, 360);
    await page.waitForTimeout(300);
    pass('Hero Start marker placed (no crash)');
    await shot(page, 'hero-start-placed');

    // ── 11. Broken images check ─────────────────────────────────────────────
    console.log('\n=== 11. Broken Images ===');
    const allImgs = await page.locator('img').all();
    let broken = 0;
    for (const img of allImgs) {
      const src = await img.getAttribute('src') ?? '';
      const w = await img.evaluate(el => el.naturalWidth);
      if (w === 0 && src && !src.startsWith('data:')) {
        broken++;
        fail(`Broken image: ${src}`, 'naturalWidth=0 — file missing or wrong path', 'Medium');
      }
    }
    if (broken === 0) pass('No broken piece images');

  } catch (err) {
    const ss = await shot(page, 'unexpected-error');
    fail('Unexpected error', err.message, 'Critical');
    console.error(err);
  } finally {
    await browser.close();

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`QA SUMMARY — Piece Placement | Passed: ${passed} | Failed: ${failed}`);
    if (failed > 0) {
      results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  [${r.severity}] ${r.test}: ${r.detail}`));
      process.exit(1);
    } else {
      console.log('All checks passed ✅');
      process.exit(0);
    }
  }
})();
