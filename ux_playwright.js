const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5174';
const OUT_DIR = '/tmp/ux_review';
fs.mkdirSync(OUT_DIR, { recursive: true });

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`Screenshot: ${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // 1. Quest Library
  await page.goto(BASE_URL);
  await page.waitForTimeout(1000);
  await screenshot(page, '01_quest_library_empty');

  // 2. Create a quest book
  const createBookBtn = page.locator('button').filter({ hasText: /new quest book|create|add/i }).first();
  if (await createBookBtn.isVisible()) {
    await createBookBtn.click();
    await page.waitForTimeout(500);
    await screenshot(page, '02_create_book_dialog');
    const titleInput = page.locator('input').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Quest Book');
      await screenshot(page, '03_create_book_filled');
      const submitBtn = page.locator('button').filter({ hasText: /create|save|ok|confirm/i }).first();
      if (await submitBtn.isVisible()) await submitBtn.click();
      await page.waitForTimeout(500);
    }
  }
  await screenshot(page, '04_quest_library_with_book');

  // 3. Create a quest
  const createQuestBtn = page.locator('button').filter({ hasText: /new quest|add quest/i }).first();
  if (await createQuestBtn.isVisible()) {
    await createQuestBtn.click();
    await page.waitForTimeout(500);
    await screenshot(page, '05_create_quest_dialog');
    const inputs = page.locator('input');
    const count = await inputs.count();
    if (count > 0) {
      await inputs.first().fill('Quest 1: The Trial');
      if (count > 1) await inputs.nth(1).fill('Find the hidden treasure');
    }
    await screenshot(page, '06_create_quest_filled');
    const submitBtn = page.locator('button').filter({ hasText: /create|save|ok|confirm/i }).first();
    if (await submitBtn.isVisible()) await submitBtn.click();
    await page.waitForTimeout(500);
  }
  await screenshot(page, '07_quest_library_with_quest');

  // 4. Enter the quest (Edit mode)
  const playBtn = page.locator('button').filter({ hasText: /play|open|edit|start/i }).first();
  if (await playBtn.isVisible()) {
    await playBtn.click();
    await page.waitForTimeout(1500);
  }
  await screenshot(page, '08_edit_mode_board');

  // 5. Sidebar / piece selection
  await screenshot(page, '09_sidebar_piece_selection');

  const categories = page.locator('button, div').filter({ hasText: /monster|trap|furniture|marker/i });
  const catCount = await categories.count();
  console.log(`Found ${catCount} potential category elements`);

  const monsterCat = page.locator('button, div').filter({ hasText: /monster/i }).first();
  if (await monsterCat.isVisible()) {
    await monsterCat.click();
    await page.waitForTimeout(300);
    await screenshot(page, '10_monsters_category_open');
  }

  // 6. Try placing a piece
  const goblinBtn = page.locator('button, div').filter({ hasText: /goblin|orc|zombie|skeleton/i }).first();
  if (await goblinBtn.isVisible()) {
    await goblinBtn.click();
    await page.waitForTimeout(300);
    await screenshot(page, '11_piece_selected');
    const board = page.locator('[data-testid="board"], .board, canvas').first();
    if (await board.isVisible()) {
      const box = await board.boundingBox();
      if (box) {
        await page.mouse.click(box.x + 200, box.y + 200);
        await page.waitForTimeout(500);
        await screenshot(page, '12_piece_placed');
      }
    } else {
      await page.mouse.click(640, 450);
      await page.waitForTimeout(500);
      await screenshot(page, '12_piece_placed_attempt');
    }
  }

  // 7. Look for search markers
  await screenshot(page, '13_search_markers_visible');

  await page.mouse.click(400, 400, { button: 'right' });
  await page.waitForTimeout(300);
  await screenshot(page, '14_right_click_rotation');

  // 8. Check overall edit mode layout
  await screenshot(page, '15_edit_mode_full_view');

  // 9. Switch to Play mode
  const playModeBtn = page.locator('button').filter({ hasText: /play mode|start|begin play/i }).first();
  if (await playModeBtn.isVisible()) {
    await playModeBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '16_play_mode_entered');
  } else {
    const modeBtn = page.locator('button').filter({ hasText: /mode/i }).first();
    if (await modeBtn.isVisible()) {
      await modeBtn.click();
      await page.waitForTimeout(1000);
      await screenshot(page, '16_play_mode_entered');
    }
  }
  await screenshot(page, '17_play_mode_fog_view');

  // 10. Reveal a cell
  await page.mouse.click(500, 400);
  await page.waitForTimeout(500);
  await screenshot(page, '18_cell_revealed');

  await page.mouse.click(520, 400);
  await page.waitForTimeout(300);
  await page.mouse.click(540, 400);
  await page.waitForTimeout(300);
  await screenshot(page, '19_more_cells_revealed');

  // 11. Back to library
  const backBtn = page.locator('button').filter({ hasText: /library|back|home/i }).first();
  if (await backBtn.isVisible()) {
    await backBtn.click();
    await page.waitForTimeout(500);
    await screenshot(page, '21_back_to_library');
  }
  await screenshot(page, '22_library_final_state');

  // 13. Tablet viewport test (1024x768 landscape)
  await context.close();
  const tabletContext = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const tabletPage = await tabletContext.newPage();
  await tabletPage.goto(BASE_URL);
  await tabletPage.waitForTimeout(1000);
  await tabletPage.screenshot({ path: path.join(OUT_DIR, '23_tablet_library.png') });

  const questCards = tabletPage.locator('button').filter({ hasText: /play|open|edit/i }).first();
  if (await questCards.isVisible()) {
    await questCards.click();
    await tabletPage.waitForTimeout(1500);
    await tabletPage.screenshot({ path: path.join(OUT_DIR, '24_tablet_edit_mode.png') });
  }

  await tabletContext.close();
  await browser.close();
  console.log('Done! Screenshots saved to', OUT_DIR);
  console.log('Files:', fs.readdirSync(OUT_DIR).sort());
})().catch(console.error);
