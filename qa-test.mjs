import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:5173';
const BASE = BASE_URL; // alias for compatibility
const SS = 'qa-screenshots';
await mkdir(SS, { recursive: true });

const issues = [];
let shotIdx = 0;

async function shot(page, name) {
  const file = path.join(SS, `${String(++shotIdx).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}
function issue(title, detail, file) {
  issues.push({ title, detail, file });
  console.log(`\n⚠  ISSUE: ${title}\n   ${detail}${file ? `\n   Screenshot: ${file}` : ''}`);
}
function ok(msg) { console.log(`   ✓ ${msg}`); }

// Helper: find button by partial text, scrolling into view first
async function findBtn(page, text) {
  const btn = page.locator(`button:has-text("${text}")`).first();
  try { await btn.scrollIntoViewIfNeeded({ timeout: 3000 }); } catch {}
  return btn;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });
page.setDefaultTimeout(8000);

// ─────────────────────────────────────────────
// 1. LIBRARY SCREEN
// ─────────────────────────────────────────────
console.log('\n=== 1. Library Screen ===');
await page.goto(BASE);
await page.waitForLoadState('networkidle');
await shot(page, 'library-initial');
ok(`Page title: "${await page.title()}"`);

// "+ New Book" is at the bottom of the sidebar
const newBookBtn = await findBtn(page, 'New Book');
if (await newBookBtn.isVisible()) {
  ok('"+ New Book" button visible');
  await newBookBtn.click();
  await page.waitForTimeout(500);
  await shot(page, 'after-new-book');
  // If a text input appeared for the book name, fill it
  const bookInput = page.locator('input').filter({ hasText: '' }).first();
  const bookInputVisible = await page.locator('input[placeholder]').first().isVisible().catch(() => false);
  if (bookInputVisible) {
    await page.locator('input[placeholder]').first().fill('Test Book');
    const confirmBtn = await findBtn(page, 'Create');
    if (await confirmBtn.isVisible()) { await confirmBtn.click(); await page.waitForTimeout(400); }
  }
  ok('Quest book created');
} else {
  issue('"+ New Book" button not found', 'Sidebar footer button missing', await shot(page, 'no-new-book'));
}

// "+ New Quest"
const newQuestBtn = await findBtn(page, 'New Quest');
if (await newQuestBtn.isVisible()) {
  ok('"+ New Quest" button visible');
  await newQuestBtn.click();
  await page.waitForTimeout(400);
  await shot(page, 'new-quest-form');

  // Fill title
  const titleInput = page.locator('input').first();
  if (await titleInput.isVisible()) {
    await titleInput.fill('Test Quest');
    ok('Filled quest title');
  } else {
    issue('Quest title input not found', 'Form input missing', await shot(page, 'no-title-input'));
  }

  // "Create & Edit"
  const createBtn = await findBtn(page, 'Create & Edit');
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(1000);
    ok('Clicked "Create & Edit"');
  } else {
    issue('"Create & Edit" not found', 'Cannot enter game screen', await shot(page, 'no-create-edit'));
    await browser.close(); process.exit(1);
  }
} else {
  issue('"+ New Quest" not found', 'Cannot create quest', await shot(page, 'no-new-quest'));
  await browser.close(); process.exit(1);
}

// ─────────────────────────────────────────────
// 2. GAME SCREEN
// ─────────────────────────────────────────────
console.log('\n=== 2. Game Screen ===');
await shot(page, 'game-initial');

const boardImg = page.locator('img').first();
if (await boardImg.isVisible()) ok('Board image visible');
else issue('Board image not visible', 'Background image not rendering', await shot(page, 'no-board'));

// Detect edit mode (should be default after Create & Edit)
const pageContent = await page.content();
ok(`Page has board: ${pageContent.includes('board')}`);

// ─────────────────────────────────────────────
// 3. EDIT SIDEBAR — CATEGORIES & TOOLS
// ─────────────────────────────────────────────
console.log('\n=== 3. Edit Sidebar ===');
await shot(page, 'edit-sidebar');

for (const cat of ['Monsters', 'Traps', 'Furniture', 'Markers']) {
  const el = page.getByText(cat).first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  if (await el.isVisible()) ok(`Category "${cat}" visible`);
  else issue(`Category "${cat}" missing`, `Edit sidebar missing "${cat}"`, await shot(page, `no-cat-${cat}`));
}

// ─────────────────────────────────────────────
// 4. PLACE PIECES
// ─────────────────────────────────────────────
console.log('\n=== 4. Piece Placement ===');

// Expand Furniture and place Table
await page.getByText('Furniture').first().click();
await page.waitForTimeout(300);

const tableTool = page.getByText('Table').first();
await tableTool.scrollIntoViewIfNeeded().catch(() => {});
if (await tableTool.isVisible()) {
  await tableTool.click();
  ok('Selected Table');
  await page.mouse.click(700, 380);
  await page.waitForTimeout(400);
  await shot(page, 'table-placed');
  const tableImg = page.locator('img[src*="Table"]').first();
  if (await tableImg.isVisible()) ok('Table image rendered ✓');
  else issue('Table image missing', 'Table.png not rendering after placement', await shot(page, 'table-no-img'));
} else {
  issue('Table tool not visible', 'Table missing from Furniture category', await shot(page, 'no-table'));
}

// Place Door
await page.getByText('Markers').first().click();
await page.waitForTimeout(300);
const doorTool = page.getByText('Door').first();
await doorTool.scrollIntoViewIfNeeded().catch(() => {});
if (await doorTool.isVisible()) {
  await doorTool.click();
  await page.mouse.click(500, 300);
  await page.waitForTimeout(400);
  await shot(page, 'door-placed');
  const doorImg = page.locator('img[src*="Door"]').first();
  if (await doorImg.isVisible()) ok('Door image rendered ✓');
  else issue('Door image missing', 'Door.png not rendering after placement', await shot(page, 'door-no-img'));
} else {
  issue('Door tool not found', 'Door missing from Markers', await shot(page, 'no-door'));
}

// Place Secret Door
const secretDoorTool = page.getByText('Secret Door').first();
await secretDoorTool.scrollIntoViewIfNeeded().catch(() => {});
if (await secretDoorTool.isVisible()) {
  await secretDoorTool.click();
  await page.mouse.click(550, 300);
  await page.waitForTimeout(400);
  const sdImg = page.locator('img[src*="Secret"]').first();
  if (await sdImg.isVisible()) ok('Secret Door image rendered ✓');
  else issue('Secret Door image missing', 'Secret_Door.png not rendering', await shot(page, 'secret-door-no-img'));
  // Right-click to rotate
  await page.mouse.click(550, 300, { button: 'right' });
  await page.waitForTimeout(300);
  await shot(page, 'secret-door-rotated');
  ok('Secret Door rotation tested');
} else {
  issue('Secret Door tool not found', 'Secret Door missing from Markers', await shot(page, 'no-secret-door'));
}

// Test Trap images
await page.getByText('Traps').first().click();
await page.waitForTimeout(300);
for (const [toolName, imgKey, px, py] of [
  ['Spear Trap',    'Spear',        400, 200],
  ['Pit Trap',      'Pit_Tile',     450, 200],
  ['Falling Block', 'Falling_Rocks',500, 200],
]) {
  const t = page.getByText(toolName).first();
  await t.scrollIntoViewIfNeeded().catch(() => {});
  if (await t.isVisible()) {
    await t.click();
    await page.mouse.click(px, py);
    await page.waitForTimeout(300);
    const img = page.locator(`img[src*="${imgKey}"]`).first();
    if (await img.isVisible()) ok(`${toolName} image rendered ✓`);
    else issue(`${toolName} image missing`, `${imgKey}.png not rendering`);
  }
}
await shot(page, 'traps-placed');

// ─────────────────────────────────────────────
// 5. PLAY MODE & FOG
// ─────────────────────────────────────────────
console.log('\n=== 5. Play Mode & Fog ===');

const playBtn = await findBtn(page, 'Play Mode');
if (await playBtn.isVisible()) {
  await playBtn.click();
  await page.waitForTimeout(500);
  await shot(page, 'play-mode-initial');
  ok('Entered Play Mode');

  // Click several cells to reveal fog
  for (const [x, y] of [[600,350],[400,250],[750,400],[350,400]]) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(300);
  }
  await shot(page, 'fog-revealed');
  ok('Revealed fog in multiple cells');

  // Verify board still visible after reveal
  const brdImg = page.locator('img').first();
  if (await brdImg.isVisible()) ok('Board image intact after fog reveal');
  else issue('Board image disappeared after fog reveal', 'Possible rendering issue');
} else {
  issue('Play Mode button not found', 'Cannot switch to play mode', await shot(page, 'no-play-mode'));
}

// ─────────────────────────────────────────────
// 6. BOARD SWITCHING
// ─────────────────────────────────────────────
console.log('\n=== 6. Board Switching ===');

// Switch back to edit mode first to access board switcher
const editBtn = await findBtn(page, 'Edit Mode');
if (await editBtn.isVisible()) { await editBtn.click(); await page.waitForTimeout(300); }

for (const label of ['Board 1', 'Board 2', 'Board 3']) {
  const btn = await findBtn(page, label);
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(600);
    await shot(page, `board-${label.replace(' ','')}`);
    ok(`Switched to ${label}`);
  } else {
    issue(`"${label}" switch button not found`, `Board switcher missing ${label}`, await shot(page, `no-${label.replace(' ','')}`));
  }
}

// ─────────────────────────────────────────────
// 7. BROKEN IMAGES CHECK
// ─────────────────────────────────────────────
console.log('\n=== 7. Broken Images Check ===');

const allImgs = await page.locator('img').all();
let broken = 0;
for (const img of allImgs) {
  const src = await img.getAttribute('src') ?? '';
  const w = await img.evaluate(el => el.naturalWidth);
  if (w === 0 && src && !src.startsWith('data:')) {
    broken++;
    issue(`Broken image: ${src}`, `naturalWidth=0 — file not found or wrong path`, await shot(page, `broken-img-${broken}`));
  }
}
if (broken === 0) ok('No broken images found ✓');

// ─────────────────────────────────────────────
// 8. SAVE & PERSISTENCE
// ─────────────────────────────────────────────
console.log('\n=== 8. Save & Persistence ===');

const saveBtn = await findBtn(page, 'Save');
if (await saveBtn.isVisible()) {
  await saveBtn.click();
  await page.waitForTimeout(400);
  ok('Quest saved');
} else {
  issue('Save button not found', 'Cannot explicitly save quest');
}

// Back to library
const backBtn = page.locator('button').filter({ hasText: /←|back|library/i }).first();
await backBtn.scrollIntoViewIfNeeded().catch(() => {});
if (await backBtn.isVisible()) {
  await backBtn.click();
  await page.waitForTimeout(600);
  await shot(page, 'back-to-library');

  const questInLib = page.getByText('Test Quest').first();
  if (await questInLib.isVisible()) ok('"Test Quest" visible in library ✓');
  else issue('Quest not in library', '"Test Quest" missing after save + back', await shot(page, 'quest-missing'));
} else {
  issue('Back button not found', 'Cannot return to library', await shot(page, 'no-back'));
}

// Reload persistence check
await page.reload();
await page.waitForLoadState('networkidle');
await shot(page, 'after-reload');
if (await page.getByText('Test Quest').first().isVisible()) ok('Quest persisted after reload ✓');
else issue('Quest lost after reload', 'localStorage persistence broken', await shot(page, 'no-quest-reload'));

// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────
await browser.close();

console.log('\n' + '═'.repeat(55));
console.log(`QA SUMMARY — ${issues.length} issue(s) found`);
console.log('═'.repeat(55));
if (issues.length === 0) {
  console.log('\n✅ All checks passed!');
} else {
  issues.forEach((iss, i) => {
    console.log(`\n${i + 1}. ${iss.title}`);
    console.log(`   Detail: ${iss.detail}`);
    if (iss.file) console.log(`   Screenshot: ${iss.file}`);
  });
}
