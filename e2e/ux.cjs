const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5174';
const OUT_DIR = '/tmp/ux_review';
fs.mkdirSync(OUT_DIR, { recursive: true });

async function ss(page, name) {
  const fpath = path.join(OUT_DIR, name + '.png');
  await page.screenshot({ path: fpath, fullPage: false });
  console.log('Screenshot saved: ' + name);
}

// Close any open dialog by pressing Escape
async function closeDialogIfOpen(page) {
  const cancelBtn = page.locator('button:has-text("Cancel")');
  const isVis = await cancelBtn.isVisible().catch(function() { return false; });
  if (isVis) {
    await cancelBtn.click();
    await page.waitForTimeout(300);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // 1. Quest Library (empty)
  await page.goto(BASE_URL);
  await page.waitForTimeout(1500);
  await ss(page, '01_quest_library_empty');

  // 2. Click New Book button
  await page.click('button:has-text("New Book")');
  await page.waitForTimeout(500);
  await ss(page, '02_new_book_form_visible');

  // 3. Fill in book title
  const bookTitleInput = page.locator('input[placeholder="Book title"]');
  await bookTitleInput.fill('Core Quest Book');
  const bookDescInput = page.locator('input[placeholder="Description (optional)"]');
  await bookDescInput.fill('The base HeroQuest campaign');
  await ss(page, '03_new_book_filled');

  await page.click('button:has-text("Create")');
  await page.waitForTimeout(500);
  await ss(page, '04_quest_library_with_book');

  // 4. Click New Quest
  await page.click('button:has-text("New Quest")');
  await page.waitForTimeout(400);
  await ss(page, '05_new_quest_form_visible');

  const questTitleInput = page.locator('input[placeholder="Quest title"]');
  await questTitleInput.fill('Quest 1: The Trial');
  const questDescTextarea = page.locator('textarea[placeholder="Description (optional)"]');
  await questDescTextarea.fill('The heroes must pass through the dungeon and defeat the minions.');
  const bookSelect = page.locator('select');
  const bookOptions = await bookSelect.locator('option').allInnerTexts();
  console.log('Book options: ' + bookOptions.join(', '));
  if (bookOptions.some(function(o) { return o.includes('Core Quest Book'); })) {
    await bookSelect.selectOption({ label: 'Core Quest Book' });
  }
  await ss(page, '06_new_quest_filled');

  // Create & Edit takes us straight into edit mode
  await page.click('button:has-text("Create")');
  await page.waitForTimeout(1500);
  await ss(page, '07_edit_mode_initial');

  // 5. Full board + sidebar
  await ss(page, '08_edit_mode_board_full');

  // 6. Piece palette - Monsters tab (default)
  await ss(page, '09_sidebar_monsters_tab');

  // 7. Select Goblin
  await page.click('button:has-text("Goblin")');
  await page.waitForTimeout(300);
  await ss(page, '10_goblin_selected');

  // 8. Click cells on board to place goblin
  await page.mouse.click(480, 420);
  await page.waitForTimeout(500);
  await ss(page, '11_goblin_placed_attempt');

  await page.mouse.click(450, 380);
  await page.waitForTimeout(500);
  await ss(page, '12_second_piece_placement');

  // 9. Right-click to test rotation
  await page.mouse.click(480, 420, { button: 'right' });
  await page.waitForTimeout(300);
  await ss(page, '13_right_click_rotation');

  // 10. Switch to Traps tab
  await page.click('button:has-text("Traps")');
  await page.waitForTimeout(300);
  await ss(page, '14_traps_tab');

  // 11. Switch to Furniture tab
  await page.click('button:has-text("Furniture")');
  await page.waitForTimeout(300);
  await ss(page, '15_furniture_tab');

  // 12. Switch to Markers tab
  await page.click('button:has-text("Markers")');
  await page.waitForTimeout(300);
  await ss(page, '16_markers_tab');

  // 13. Place a Search Marker
  await page.click('button:has-text("Search Marker")');
  await page.waitForTimeout(300);
  await page.mouse.click(300, 300);
  await page.waitForTimeout(500);
  await ss(page, '17_search_marker_placed');

  // 14. Place a Hero Start marker
  await page.click('button:has-text("Hero Start")');
  await page.waitForTimeout(300);
  await page.mouse.click(400, 350);
  await page.waitForTimeout(500);
  await ss(page, '18_hero_start_placed');

  // 15. Place an Event Note marker - this will open a dialog
  await page.click('button:has-text("Event Note")');
  await page.waitForTimeout(300);
  await page.mouse.click(350, 400);
  await page.waitForTimeout(500);
  await ss(page, '19_event_note_placed');

  // 16. Check if Note dialog opened
  const noteDialog = page.locator('div:has-text("Event Note")').filter({ hasText: 'Note (shown on hover' });
  const dialogVis = await noteDialog.isVisible().catch(function() { return false; });
  if (dialogVis) {
    await ss(page, '20_note_marker_dialog_open');
    // Fill in a note
    const noteTa = page.locator('textarea').last();
    await noteTa.fill('The floor here is unstable - a trap may be hidden beneath the flagstones.');
    await ss(page, '21_note_marker_dialog_filled');
    // Save the note
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(300);
  }
  await ss(page, '22_after_note_saved');

  // 17. Test Save Quest (may fail without Hero Start)
  await page.click('button:has-text("Save Quest")');
  await page.waitForTimeout(500);
  await ss(page, '23_save_quest_attempt');

  // 18. Check if save error appeared
  const saveErrorElem = page.locator('div').filter({ hasText: 'Hero Start' }).last();
  const saveErrVis = await saveErrorElem.isVisible().catch(function() { return false; });
  console.log('Save error visible: ' + saveErrVis);

  // 19. Place Hero Start markers across multiple board cells
  await page.click('button:has-text("Markers")');
  await page.waitForTimeout(200);
  await page.click('button:has-text("Hero Start")');
  await page.waitForTimeout(200);
  const positions = [
    [200, 200], [250, 250], [300, 300], [350, 350], [400, 400],
    [450, 450], [500, 500], [550, 300], [600, 350], [640, 300],
    [680, 400], [400, 250], [450, 300], [500, 350], [550, 400]
  ];
  for (let i = 0; i < positions.length; i++) {
    await page.mouse.click(positions[i][0], positions[i][1]);
    await page.waitForTimeout(100);
  }
  await ss(page, '24_hero_start_placements');
  await page.click('button:has-text("Save Quest")');
  await page.waitForTimeout(800);
  await ss(page, '25_save_result');

  // 20. Switch to Play mode
  // The mode toggle buttons are "Play" and "Edit"
  const modeToggle = page.locator('div').filter({ hasText: /^Play$/ }).locator('button').first();
  // Better: use the mode toggle area
  await page.locator('button').filter({ hasText: /^⚔ Play$/ }).click();
  await page.waitForTimeout(1000);
  await ss(page, '26_play_mode_entered');

  // 21. Board in play mode - fog visible
  await ss(page, '27_play_mode_fog_initial');

  // 22. Click cells to reveal
  await page.mouse.click(400, 350);
  await page.waitForTimeout(600);
  await ss(page, '28_cell_revealed_1');

  await page.mouse.click(450, 380);
  await page.waitForTimeout(600);
  await ss(page, '29_cell_revealed_2');

  await page.mouse.click(500, 420);
  await page.waitForTimeout(600);
  await ss(page, '30_cell_revealed_3');

  // 23. Reveal many cells
  for (let revX = 300; revX <= 600; revX += 37) {
    await page.mouse.click(revX, 300);
    await page.waitForTimeout(150);
    await page.mouse.click(revX, 400);
    await page.waitForTimeout(150);
    await page.mouse.click(revX, 500);
    await page.waitForTimeout(150);
  }
  await ss(page, '31_multiple_reveals');

  // 24. Full view play mode
  await ss(page, '32_play_mode_full_view');

  // 25. Navigate back to library
  await page.click('button:has-text("Library")');
  await page.waitForTimeout(800);
  await ss(page, '33_back_to_library');

  await ss(page, '34_library_with_quest');

  // 26. Open quest in Play mode directly
  const playQuestBtn = page.locator('button').filter({ hasText: /^⚔ Play$/ }).first();
  const isVis = await playQuestBtn.isVisible();
  if (isVis) {
    await playQuestBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, '35_quest_play_mode_direct');
    await page.mouse.click(350, 300);
    await page.waitForTimeout(500);
    await page.mouse.click(400, 350);
    await page.waitForTimeout(500);
    await ss(page, '36_play_mode_reveals');
    await page.click('button:has-text("Library")');
    await page.waitForTimeout(500);
  }

  // 27. Tablet viewport
  await ctx.close();
  const tabletCtx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const tabletPage = await tabletCtx.newPage();
  await tabletPage.goto(BASE_URL);
  await tabletPage.waitForTimeout(1000);
  await tabletPage.screenshot({ path: path.join(OUT_DIR, '37_tablet_library.png') });
  console.log('Screenshot saved: 37_tablet_library');

  const tabletEditBtn = tabletPage.locator('button').filter({ hasText: /✎ Edit/ }).first();
  const tabEditVis = await tabletEditBtn.isVisible();
  if (tabEditVis) {
    await tabletEditBtn.click();
    await tabletPage.waitForTimeout(1500);
    await tabletPage.screenshot({ path: path.join(OUT_DIR, '38_tablet_edit_mode.png') });
    console.log('Screenshot saved: 38_tablet_edit_mode');
    await tabletPage.locator('button').filter({ hasText: /^⚔ Play$/ }).click();
    await tabletPage.waitForTimeout(800);
    await tabletPage.screenshot({ path: path.join(OUT_DIR, '39_tablet_play_mode.png') });
    console.log('Screenshot saved: 39_tablet_play_mode');
    await tabletPage.mouse.click(350, 300);
    await tabletPage.waitForTimeout(500);
    await tabletPage.mouse.click(400, 350);
    await tabletPage.waitForTimeout(500);
    await tabletPage.screenshot({ path: path.join(OUT_DIR, '40_tablet_reveals.png') });
    console.log('Screenshot saved: 40_tablet_reveals');
  }

  await tabletCtx.close();
  await browser.close();

  const files = fs.readdirSync(OUT_DIR).sort();
  console.log('\nDone! ' + files.length + ' screenshots in ' + OUT_DIR);
  files.forEach(function(f) { console.log(' - ' + f); });
})().catch(function(err) {
  console.error('ERROR:', err.message);
  process.exit(1);
});
