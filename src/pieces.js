// ═══════════════════════════════════════════════
//  PIECE CATALOGUE
// ═══════════════════════════════════════════════

export const PIECE_CATEGORIES = [
  {
    id: "monsters", label: "Monsters",
    pieces: [
      { id: "goblin",       label: "Goblin",         icon: "G",  color: "#66bb6a", shape: "circle",  blocks: false, image: "Monster_Goblin.png",         imageScale: { board: 1.2, board2: 1.2, board3: 1 } },
      { id: "orc",          label: "Orc",             icon: "O",  color: "#a5714d", shape: "circle",  blocks: false, image: "Monster_Orc.png",            imageScale: {board: 1.2, board2: 1.2, board3: 1 } },
      { id: "skeleton",     label: "Skeleton",        icon: "Sk", color: "#c0cdd4", shape: "circle",  blocks: false, image: "Monster_Skeleton.png",       imageScale: { board: 1.2,board2: 1.2, board3: 1 } },
      { id: "zombie",       label: "Zombie",          icon: "Zm", color: "#78909c", shape: "circle",  blocks: false, image: "Monster_Zombie.png",         imageScale: { board: 1.2,board2: 1.2, board3: 1 } },
      { id: "mummy",        label: "Mummy",           icon: "Mm", color: "#c4a87a", shape: "circle",  blocks: false, image: "Monster_Mummy.png",          imageScale: { board: 1.2,board2: 1.2, board3: 1 } },
      { id: "abomination",  label: "Abomination",     icon: "Ab", color: "#6a4c93", shape: "circle",  blocks: false, image: "Monster_Abomination.png",    imageScale: { board: 1.2,board2: 1.2, board3: 1 } },
      { id: "dread",        label: "Dread Warrior",   icon: "Dw", color: "#b71c1c", shape: "circle",  blocks: false, image: "Monster_DreadWarrior.png",   imageScale: { board: 1.2,board2: 1.2, board3: 1 } },
      { id: "gargoyle",     label: "Gargoyle",        icon: "Ga", color: "#8d9eaa", shape: "circle",  blocks: false, image: "Monster_Gargoyle.png",       imageScale: { board: 1.2,board2: 1.3, board3: 1 } },
      { id: "dreadsorcerer", label: "Dread Sorcerer", icon: "Ds", color: "#4a148c", shape: "circle",  blocks: false, image: "Monster_Dread Sorcerer.png", imageScale: { board: 1.2,board2: 1.2, board3: 1 } },
    ],
  },
  {
    id: "traps", label: "Traps",
    pieces: [
      { id: "trap",         label: "Trap",            icon: "T",  color: "#ef5350", shape: "circle",  blocks: false },
      { id: "pit",          label: "Pit Trap",        icon: "Pt", color: "#d32f2f", shape: "circle",  blocks: false, image: "Pit_Tile.png",     imageScale:  {board: 1, board2: 1, board3: 1 }},
      { id: "spear",        label: "Spear Trap",      icon: "Sp", color: "#e64a19", shape: "circle",  blocks: false, image: "Spear.png",        imageScale:  {board: 1, board2: 1, board3: 1 }},
      { id: "falling",      label: "Falling Block",   icon: "Fb", color: "#bf360c", shape: "square",  blocks: false, image: "Falling_Rocks.png", imageScale: {board: 1, board2: 1, board3: 1 }},
    ],
  },
  {
    id: "furniture", label: "Furniture",
    pieces: [
      { id: "chest",        label: "Chest",           icon: "Ch", color: "#ffa726", shape: "square",  blocks: false, image: "Chest.png", imageScale: {board: 0.85, board2: 0.85, board3: 0.85 }},
      { id: "bookcase",     label: "Bookcase",         icon: "Bk", color: "#795548", shape: "square",  blocks: true,  cells: [[0,0],[0,1],[0,2]], image: "Bookcase.png",imageScale: {board: 0.9, board2: 0.9, board3: 0.85 } },
      { id: "cupboard",     label: "Cupboard",         icon: "Cu", color: "#6d4c41", shape: "square",  blocks: true, cells: [[0,0],[0,1],[0,2]], image: "Cupboard.png", imageScale: {board: 0.9, board2: 0.9, board3: 0.85 }},
      { id: "table",        label: "Table",            icon: "Tb", color: "#8d6e63", shape: "square",  blocks: false, cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], image: "Table.png", imageScale: {board: 0.8, board2: 0.8, board3: 0.8 } },
      { id: "throne",       label: "Throne",           icon: "Th", color: "#ffd54f", shape: "square",  blocks: false, image: "Throne.png", imageScale: {board: 0.82, board2: 0.8, board3: 0.90 } },
      { id: "fireplace",    label: "Fireplace",        icon: "Fi", color: "#ff6f00", shape: "square",  blocks: true,  cells: [[0,0],[0,1],[0,2]], image: "Fireplace.png", imageScale: {board: 0.9, board2: 0.9, board3: 0.95 } },
      { id: "alchemist",    label: "Alchemist's Bench",icon: "Al", color: "#80cbc4", shape: "square",  blocks: false, cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], image: "Alchemist_Bench.png", imageScale: {board: 0.85, board2: 0.85, board3: 0.95 } },
      { id: "rack",         label: "Torture Rack",     icon: "Rk", color: "#546e7a", shape: "square",  blocks: false, cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], image: "Torture_Rack.png",  imageScale: {board: 0.85, board2: 0.85, board3: 0.95 } },
      { id: "tomb",         label: "Tomb",             icon: "To", color: "#455a64", shape: "square",  blocks: false, cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], image: "Tomb.png",         imageScale:{board: 0.85, board2: 0.85, board3: 0.95 } },
      { id: "sorcerer",     label: "Sorcerer's Table", icon: "So", color: "#7e57c2", shape: "square",  blocks: false, cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], image: "Sorcerer_Table.png", imageScale: {board: 0.85, board2: 0.85, board3: 0.95 } },
      { id: "weaponsrack",  label: "Weapons Rack",     icon: "Wr", color: "#607d8b", shape: "square",  blocks: false, cells: [[0,0],[0,1],[0,2]], image: "Weapons_Rack.png", imageScale: {board: 0.85, board2: 0.85, board3: 0.95 } },
    ],
  },
  {
    id: "markers", label: "Markers",
    pieces: [
      { id: "start",        label: "Hero Start",      icon: "⚔", color: "#f0c040", shape: "diamond", blocks: false },
      { id: "notemarker",   label: "Event Note",      icon: "📝", color: "#90caf9", shape: "square",  blocks: false },
      { id: "search",       label: "Search Marker",   icon: "🔍", color: "#c4a870", shape: "square",  blocks: false },
      { id: "door",         label: "Door",             icon: "▐",  color: "#9c6b2e", shape: "square",  blocks: false, isEdge: true, image: "Door.png",        imageScale:  { board: 1.2, board2: 1.2, board3: 1 } },
      { id: "secretdoor",   label: "Secret Door",      icon: "▐",  color: "#5d4037", shape: "square",  blocks: false, image: "Secret_Door.png", imageScale: 1 },
      { id: "stairs",       label: "Stairs",           icon: "St", color: "#90a4ae", shape: "square",  blocks: false, cells: [[0,0],[0,1],[1,0],[1,1]], image: "Stairs.png", imageScale: 1 },
      { id: "blocker",      label: "Blocked Square",  icon: "▪",  color: "#455a64", shape: "square",  blocks: true,  image: "Wall.png", imageScale:  { board: 1, board2: 1, board3: 0.90 } },
      { id: "doubleblocker",  label: "Double Blocked Square",  icon: "▪▪",  color: "#455a64", shape: "square",  blocks: true,  image: "Double_Wall.png",  cells: [[0,0],[0,1]], imageScale: { board: 1, board2: 1, board3: 0.95 } },
    ],
  },
];

// Flat lookup map — adding a piece to PIECE_CATEGORIES automatically makes it available here.
export const PIECES = Object.fromEntries(
  PIECE_CATEGORIES.flatMap(cat => cat.pieces.map(p => [p.id, p]))
);

// Maps piece id → category id (e.g. "goblin" → "monsters").
export const PIECE_CATEGORY_ID = Object.fromEntries(
  PIECE_CATEGORIES.flatMap(cat => cat.pieces.map(p => [p.id, cat.id]))
);

// Resolve imageScale: supports a plain number (all tilesets) or an object
// keyed by tileset ID, e.g. { board2: 0.9, board3: 0.75, default: 1 }.
export function resolveScale(imageScale, tileSet) {
  if (!imageScale) return 1;
  if (typeof imageScale === "object") return imageScale[tileSet] ?? imageScale.default ?? 1;
  return imageScale;
}
