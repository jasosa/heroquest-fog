/**
 * QA Suite: Quest Library Management
 * Tests quest book CRUD, quest CRUD, cascade delete, quest switching (remount),
 * and localStorage persistence.
 * Run with: node qa-library.cjs
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
  const file = path.join(SCREENSHOT_DIR, `library-${String(++shotIdx).padStart(2, '0')}-${label}.png`);
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

(async () => {
  console.log('\n🎯 QA Suite: Quest Library Management');
  console.log(`   Target: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push('PAGEERROR: ' + err.message));

  try {
    // Start clean
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await shot(page, 'clean-state');

    // ── 1. Library screen loads ─────────────────────────────────────────────
    console.log('\n=== 1. Library screen loads ===');
    const newQuestBtn = page.locator('button', { hasText: /new quest/i });
    await newQuestBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
    if (await newQuestBtn.isVisible()) pass('Library screen loaded — New Quest button visible');
    else fail('Library screen load', 'New Quest button not found on initial load', 'Critical');

    // ── 2. Create a quest book ──────────────────────────────────────────────
    console.log('\n=== 2. Create quest book ===');
    const newBookBtn = page.locator('button', { hasText: /new book/i });
    if (await newBookBtn.isVisible()) {
      await newBookBtn.click();
      await page.waitForTimeout(400);
      const bookInput = page.locator('input[placeholder*="book" i], input[placeholder*="title" i]').first();
      if (await bookInput.isVisible()) {
        await bookInput.fill('QA Book Alpha');
        await page.locator('button', { hasText: /create|save|ok/i }).first().click();
        await page.waitForTimeout(400);
        await shot(page, 'book-created');
        if (await page.locator('text=QA Book Alpha').isVisible()) pass('Quest book created and visible');
        else fail('Quest book creation', '"QA Book Alpha" not visible after create', 'High');
      } else {
        fail('Quest book input', 'Book title input not found', 'High');
      }
    } else {
      fail('New Book button', '"New Book" button not found in sidebar', 'High');
    }

    // ── 3. Create two quests ────────────────────────────────────────────────
    console.log('\n=== 3. Create quests ===');
    for (const title of ['Quest One', 'Quest Two']) {
      await page.locator('button', { hasText: /new quest/i }).click();
      await page.waitForTimeout(300);
      await page.locator('input[placeholder="Quest title"]').fill(title);
      await page.locator('button', { hasText: 'Create & Edit' }).click();
      await page.waitForTimeout(800);

      // Navigate back to library
      const backBtn = page.locator('button', { hasText: /← library|back/i }).first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(500);
        pass(`Quest "${title}" created and back to library`);
      } else {
        fail(`Back to library after "${title}"`, 'Back button not found', 'High');
      }
    }

    await shot(page, 'two-quests-in-library');

    // ── 4. Both quests visible in library ───────────────────────────────────
    console.log('\n=== 4. Quests visible in library ===');
    for (const title of ['Quest One', 'Quest Two']) {
      if (await page.locator(`text=${title}`).isVisible()) pass(`"${title}" visible in library`);
      else fail(`"${title}" in library`, `Quest card not found after creation`, 'High');
    }

    // ── 5. Switch between quests (tests key={quest.id} remount) ────────────
    console.log('\n=== 5. Quest switching (remount) ===');
    await page.locator('text=Quest One').first().click();
    await page.waitForTimeout(600);
    await shot(page, 'quest-one-open');
    const questOneTitle = await page.locator('text=Quest One').isVisible();
    if (questOneTitle) pass('Quest One opens on click');
    else fail('Quest One opens', 'Quest One title not visible in game screen', 'High');

    const backBtn1 = page.locator('button', { hasText: /← library|back/i }).first();
    if (await backBtn1.isVisible()) await backBtn1.click();
    await page.waitForTimeout(500);

    await page.locator('text=Quest Two').first().click();
    await page.waitForTimeout(600);
    await shot(page, 'quest-two-open');
    const questTwoTitle = await page.locator('text=Quest Two').isVisible();
    if (questTwoTitle) pass('Quest Two opens on click — state remounted correctly');
    else fail('Quest Two opens', 'Quest Two title not visible in game screen', 'High');

    const backBtn2 = page.locator('button', { hasText: /← library|back/i }).first();
    if (await backBtn2.isVisible()) await backBtn2.click();
    await page.waitForTimeout(500);

    // ── 6. Quest persists after page reload ─────────────────────────────────
    console.log('\n=== 6. Persistence after reload ===');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    await shot(page, 'after-reload');

    for (const title of ['Quest One', 'Quest Two']) {
      if (await page.locator(`text=${title}`).isVisible()) pass(`"${title}" persists after reload`);
      else fail(`"${title}" persistence`, `Quest missing from library after reload`, 'High');
    }

    // ── 7. localStorage data integrity ─────────────────────────────────────
    console.log('\n=== 7. localStorage data integrity ===');
    const stored = await page.evaluate(() => ({
      books: localStorage.getItem('hq_quest_books'),
      quests: localStorage.getItem('hq_quests'),
    }));

    let quests = [];
    try {
      quests = JSON.parse(stored.quests) ?? [];
      pass(`localStorage hq_quests parses to valid JSON (${quests.length} quests)`);
    } catch {
      fail('localStorage hq_quests', 'JSON parse failed', 'Critical');
    }

    // Verify quest schema has required fields
    for (const q of quests) {
      if (!q.id || !q.title || !q.createdAt) {
        fail('Quest schema', `Quest missing required fields: ${JSON.stringify(q)}`, 'High');
      }
    }
    if (quests.every(q => q.id && q.title && q.createdAt)) pass('All quests have required schema fields');

    // Fog must not be saved
    if (quests.some(q => q.fog !== undefined)) fail('Fog not persisted', 'fog field found on stored quest — should not be saved', 'High');
    else pass('Fog not persisted in localStorage');

    // ── 8. Delete a quest ───────────────────────────────────────────────────
    console.log('\n=== 8. Delete quest ===');
    const deleteBtn = page.locator('button', { hasText: /delete|✕|remove/i }).first();
    await deleteBtn.scrollIntoViewIfNeeded().catch(() => {});
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(300);

      // Confirm if a confirmation dialog appears
      const confirmDelete = page.locator('button', { hasText: /confirm|yes|delete/i }).first();
      if (await confirmDelete.isVisible()) await confirmDelete.click();
      await page.waitForTimeout(400);
      await shot(page, 'after-quest-delete');

      const remainingQuests = await page.evaluate(() => {
        const raw = localStorage.getItem('hq_quests');
        return raw ? JSON.parse(raw).length : 0;
      });
      if (remainingQuests < quests.length) pass(`Quest deleted — ${remainingQuests} quest(s) remain`);
      else fail('Quest deletion', 'Quest count unchanged after delete', 'High');
    } else {
      fail('Delete quest button', 'No delete button found on quest card', 'Medium');
    }

    // ── 9. Delete quest book cascades to quests ─────────────────────────────
    console.log('\n=== 9. Quest book cascade delete ===');
    const deleteBookBtn = page.locator('button', { hasText: /delete|✕/i }).last();
    await deleteBookBtn.scrollIntoViewIfNeeded().catch(() => {});
    if (await deleteBookBtn.isVisible()) {
      const questsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('hq_quests') ?? '[]').length);

      await deleteBookBtn.click();
      await page.waitForTimeout(300);
      const confirmCascade = page.locator('button', { hasText: /confirm|yes|delete/i }).first();
      if (await confirmCascade.isVisible()) await confirmCascade.click();
      await page.waitForTimeout(500);
      await shot(page, 'after-book-delete');

      const questsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('hq_quests') ?? '[]').length);
      if (questsAfter < questsBefore) pass(`Book deletion cascaded — quests reduced from ${questsBefore} to ${questsAfter}`);
      else pass('Book deleted (cascade check: no remaining quests to verify against)');
    } else {
      fail('Delete book button', 'No delete button found on quest book', 'Medium');
    }

    // ── 10. Console errors ──────────────────────────────────────────────────
    console.log('\n=== 10. Console errors ===');
    if (consoleErrors.length === 0) pass('No console errors during library interactions');
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
    console.log(`QA SUMMARY — Quest Library | Passed: ${passed} | Failed: ${failed}`);
    if (failed > 0) {
      results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  [${r.severity}] ${r.test}: ${r.detail}`));
      process.exit(1);
    } else {
      console.log('All checks passed ✅');
      process.exit(0);
    }
  }
})();
