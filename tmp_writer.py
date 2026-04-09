script = r"""const { chromium } = require('playwright');
const path = require('path');
const fs2 = require('fs');
const BASE = 'http://localhost:5174';
const SS_DIR = path.join(__dirname, 'qa_screenshots');
if (!fs2.existsSync(SS_DIR)) fs2.mkdirSync(SS_DIR);
let issueCount = 0;
const issues = [];
function log(msg) { console.log(msg); }
function issue(severity, flow, steps, expected, actual, sp) {
  issueCount++;
  issues.push({ id: issueCount, severity, flow, steps, expected, actual, sp });
  console.log('\n[' + severity + '] #' + issueCount + ' -- ' + flow);
  console.log('  Expected: ' + expected);
  console.log('  Actual: ' + actual);
  if (sp) console.log('  Screenshot: ' + sp);
}
async function ss(page, name) {
  const p = path.join(SS_DIR, name + '.png');
  await page.screenshot({ path: p, fullPage: true });
  return p;
}
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');

  log('\n=== FLOW 1: Create Quest Book ===');
  await page.click('button:has-text("New Book")');
  await page.waitForTimeout(400);
  await page.locator('input').first().fill('Trial Book');
  await page.locator('button').filter({ hasText: /^(Save|Create|OK)$/i }).first().click();
  await page.waitForTimeout(500);
  const p1 = await ss(page, '01_book_created');
  if (await page.locator('text=Trial Book').count() === 0) {
    issue('High', 'Create Quest Book', '1.Click New Book 2.Fill 3.Save', 'Book in sidebar', 'Book not visible', p1);
  } else { log('OK - Book visible in sidebar'); }

  log('\n=== FLOW 2: Create Quest ===');
  await page.locator('text=Trial Book').first().click();
  await page.waitForTimeout(200);
  await page.click('button:has-text("New Quest")');
  await page.waitForTimeout(400);
  await page.locator('input').first().fill('Quest One');
  await page.locator('button').filter({ hasText: /^(Save|Create)$/i }).first().click();
  await page.waitForTimeout(500);
  const p2 = await ss(page, '02_quest_created');
  if (await page.locator('text=Quest One').count() === 0) {
    issue('High', 'Create Quest', '1.New Quest 2.Fill 3.Save', 'Quest card visible', 'Quest not shown', p2);
  } else { log('OK - Quest card visible'); }

  log('\n=== FLOW 3: Open Quest ===');
  const allBtns = await page.locator('button').allTextContents();
  log('Library buttons: ' + JSON.stringify(allBtns));
  const openBtn = page.locator('button').filter({ hasText: /open|edit quest/i }).first();
  if (await openBtn.count() === 0) {
    issue('Critical', 'Open Quest', '1.Create quest 2.Find open', 'Open button', 'Not found', await ss(page, '03_no_open'));
    await browser.close(); return;
  }
  await openBtn.click();
  await page.waitForTimeout(1000);
  await ss(page, '03_game_screen');
  const gameBtns = await page.locator('button').allTextContents();
  log('Game screen buttons: ' + JSON.stringify(gameBtns));
  const gameText = await page.locator('body').innerText();
  log('Game text: ' + gameText.substring(0, 400));

  log('\n=== FLOW 4: Collapsible Sidebar ===');
  const collapseBtns = page.locator('button').filter({ hasText: /[<>]/ });
  log('Collapse-like buttons: ' + (await collapseBtns.count()));
  if (await collapseBtns.count() > 0) {
    log('Texts: ' + JSON.stringify(await collapseBtns.allTextContents()));
    await collapseBtns.first().click();
    await page.waitForTimeout(400);
    await ss(page, '04_sidebar_collapsed');
    await collapseBtns.first().click();
    await page.waitForTimeout(300);
    log('Sidebar toggle tested');
  }

  log('\n=== FLOW 5: Switch to Play Mode ===');
  const playBtn = page.locator('button').filter({ hasText: /play/i }).first();
  if (await playBtn.count() === 0) {
    issue('Critical', 'Play Mode', '1.Open quest 2.Find Play', 'Play Mode button', 'Not found', await ss(page, '05_no_play'));
  } else {
    await playBtn.click();
    await page.waitForTimeout(600);
    await ss(page, '05_play_mode');
    log('Switched to play mode');
    log('Play mode buttons: ' + JSON.stringify(await page.locator('button').allTextContents()));

    const bodyPlay = await page.locator('body').innerText();
    const hasPopup = /place.*hero|stairway|hero.*start/i.test(bodyPlay);
    log('Hero placement popup: ' + hasPopup);
    if (hasPopup) {
      await ss(page, '05b_hero_popup');
      const closeBtn = page.locator('button').filter({ hasText: /ok|close|dismiss|got it/i }).first();
      if (await closeBtn.count() > 0) { await closeBtn.click(); await page.waitForTimeout(300); }
    }

    log('\n=== FLOW 6: Fog Reveal ===');
    await page.mouse.click(480, 340);
    await page.waitForTimeout(500);
    const p6 = await ss(page, '06_fog_reveal');
    const redFound = await page.evaluate(() => {
      for (const el of document.querySelectorAll('*')) {
        const s = el.style.border || '';
        if (s.includes('red')) return s;
      }
      return null;
    });
    if (redFound) {
      issue('Medium', 'ISSUE-002 red border regression', '1.Enter play 2.Click cell', 'No red border', 'Red border: ' + redFound, p6);
    } else { log('OK - No red border'); }

    log('\n=== FLOW 7: Disconnected Corridor Click ===');
    await page.mouse.click(880, 620);
    await page.waitForTimeout(600);
    const p7 = await ss(page, '07_disconnected');
    const bodyDiscon = await page.locator('body').innerText();
    const hasConfirm = /reveal|confirm|not.*connect/i.test(bodyDiscon);
    log('Confirm for disconnected cell: ' + hasConfirm);
    if (hasConfirm) {
      await ss(page, '07b_confirm_dialog');
      const noBtn = page.locator('button').filter({ hasText: /cancel|no/i }).first();
      if (await noBtn.count() > 0) { await noBtn.click(); await page.waitForTimeout(300); }
    }

    log('\n=== FLOW 8: Reset Fog ===');
    log('Buttons: ' + JSON.stringify(await page.locator('button').allTextContents()));
    const resetBtn = page.locator('button').filter({ hasText: /reset/i }).first();
    if (await resetBtn.count() > 0) {
      await resetBtn.click();
      await page.waitForTimeout(400);
      const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes|ok/i }).first();
      if (await confirmBtn.count() > 0 && await confirmBtn.isVisible()) {
        await confirmBtn.click(); await page.waitForTimeout(400);
      }
      await ss(page, '08_after_reset');
      log('Fog reset done');
    } else { log('No reset button found'); }

    log('\n=== FLOW 9: Play to Edit Warning ===');
    const editBtns = page.locator('button').filter({ hasText: /edit/i });
    log('Edit buttons: ' + JSON.stringify(await editBtns.allTextContents()));
    if (await editBtns.count() > 0) {
      await editBtns.first().click();
      await page.waitForTimeout(500);
      const p9 = await ss(page, '09_play_to_edit');
      const bodySwitch = await page.locator('body').innerText();
      const hasWarning = /chest|trap|carry|session|warning/i.test(bodySwitch);
      log('Play->Edit warning: ' + hasWarning);
      if (!hasWarning) {
        issue('Low', 'FEAT-018: Play to Edit warning', '1.Enter play 2.Click Edit', 'Warning about session state', 'No warning shown', p9);
      }
      const okBtn = page.locator('button').filter({ hasText: /ok|confirm|switch|continue/i }).first();
      if (await okBtn.count() > 0 && await okBtn.isVisible()) { await okBtn.click(); await page.waitForTimeout(300); }
    }
  }

  log('\n=== FLOW 10: Back to Library ===');
  const backBtns = page.locator('button').filter({ hasText: /back|library/i });
  log('Back buttons: ' + JSON.stringify(await backBtns.allTextContents()));
  if (await backBtns.count() > 0) {
    await backBtns.first().click();
    await page.waitForTimeout(500);
    const p10 = await ss(page, '10_back_library');
    const bodyBack = await page.locator('body').innerText();
    const hasUnsaved = /unsaved|go back|changes/i.test(bodyBack);
    log('Unsaved changes warning: ' + hasUnsaved);
    if (!hasUnsaved) {
      issue('Low', 'FEAT-018: Back to Library warning', '1.Edit quest 2.Click Back', 'Unsaved changes warning', 'Navigated without warning', p10);
    } else {
      const goBtn = page.locator('button').filter({ hasText: /go back|yes|leave/i }).first();
      if (await goBtn.count() > 0) { await goBtn.click(); await page.waitForTimeout(300); }
    }
  }

  log('\n=== Console Errors ===');
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e, i) => {
      log('  ' + (i+1) + '. ' + e.substring(0, 200));
      issue('Medium', 'Console Error', 'General navigation', 'No JS errors', e.substring(0, 200), null);
    });
  } else { log('OK - No console errors'); }

  log('\n================================================');
  log('TESTING COMPLETE -- ' + issueCount + ' issue(s) found');
  log('================================================');
  issues.forEach(i => {
    log('\n  #' + i.id + ' [' + i.severity + '] ' + i.flow);
    log('     Expected: ' + i.expected);
    log('     Actual:   ' + i.actual);
    if (i.sp) log('     Screenshot: ' + i.sp);
  });
  await page.waitForTimeout(1000);
  await browser.close();
})();
"""

with open(r'C:/Users/Juanan/code/heroquest-fog/heroquest-fog/qa_explore.cjs', 'w', encoding='utf-8') as f:
    f.write(script)
print('Written OK, length:', len(script))
