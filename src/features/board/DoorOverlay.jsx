import { CELL } from "../../map.js";
import { PIECES } from "../../pieces.js";
import { resolveScale } from "../../pieces.js";

const DOOR_COLOR     = "#9c6b2e";
const DOOR_THICKNESS = 6;
const DOOR_INSET     = Math.round(CELL * 0.1);

// rotation 0 = right edge, 1 = bottom edge, 2 = left edge, 3 = top edge
export const DOOR_NEIGHBORS = (r, c) => [
  `${r},${c + 1}`, // 0 right
  `${r + 1},${c}`, // 1 bottom
  `${r},${c - 1}`, // 2 left
  `${r - 1},${c}`, // 3 top
];

const DOOR_STYLES = (r, c) => [
  { left: (c + 1) * CELL - Math.floor(DOOR_THICKNESS / 2), top: r * CELL + DOOR_INSET,     width: DOOR_THICKNESS,        height: CELL - DOOR_INSET * 2 }, // right
  { left: c * CELL + DOOR_INSET,                           top: (r + 1) * CELL - Math.floor(DOOR_THICKNESS / 2), width: CELL - DOOR_INSET * 2, height: DOOR_THICKNESS },        // bottom
  { left: c * CELL - Math.floor(DOOR_THICKNESS / 2),       top: r * CELL + DOOR_INSET,     width: DOOR_THICKNESS,        height: CELL - DOOR_INSET * 2 }, // left
  { left: c * CELL + DOOR_INSET,                           top: r * CELL - Math.floor(DOOR_THICKNESS / 2),       width: CELL - DOOR_INSET * 2, height: DOOR_THICKNESS },        // top
];

// neighborOffset indexed by rotation: right, bottom, left, top
const DOOR_NEIGHBOR_OFFSETS = [[0,1],[1,0],[0,-1],[-1,0]];

// Natural door image is landscape (wider than tall).
// Rotations 0 and 2 (vertical doors) need a 90° CSS rotation.
const DOOR_IMAGE_LONG  = CELL;     // spans 1 cell along the edge
const DOOR_IMAGE_SHORT = CELL * 1; // spans both adjacent cells perpendicular to edge

export function DoorOverlay({ anchorKey, rotation, type, fog, isEditMode, getTokenPos, hasCalibration, tileSet }) {
  const [r, c] = anchorKey.split(",").map(Number);
  const neighborKey = DOOR_NEIGHBORS(r, c)[rotation];
  if (!isEditMode && !fog.has(anchorKey) && !fog.has(neighborKey)) return null;

  const p = PIECES[type ?? "door"];

  // Center of the door on the edge between anchor and neighbor cells
  let cx, cy;
  if (hasCalibration && getTokenPos) {
    const [dr, dc] = DOOR_NEIGHBOR_OFFSETS[rotation];
    const [ax, ay] = getTokenPos(c, r);
    const [bx, by] = getTokenPos(c + dc, r + dr);
    cx = (ax + bx) / 2;
    cy = (ay + by) / 2;
  } else {
    const s = DOOR_STYLES(r, c)[rotation];
    cx = s.left + s.width  / 2;
    cy = s.top  + s.height / 2;
  }

  const scale = resolveScale(p?.imageScale, tileSet);
  const imgW = DOOR_IMAGE_LONG  * scale;
  const imgH = DOOR_IMAGE_SHORT * scale;
  // Natural image is horizontal; vertical doors (rotation 0, 2) need 90° turn
  const isVertical = rotation === 0 || rotation === 2;

  if (p?.image) {
    return (
      <img
        src={`/tiles/${tileSet}/${p.image}`}
        alt={p.label}
        style={{
          position: "absolute",
          left: cx - imgW / 2,
          top:  cy - imgH / 2,
          width:  imgW,
          height: imgH,
          transform: isVertical ? "rotate(90deg)" : "none",
          zIndex: 10,
          pointerEvents: "none",
          objectFit: "fill",
        }}
      />
    );
  }

  const doorStyle = {
    background: DOOR_COLOR, borderRadius: 4, zIndex: 10,
    border: "2px solid #f5e6c8",
    boxShadow: `0 0 10px ${DOOR_COLOR}cc, 0 2px 4px #0009`,
    pointerEvents: "none",
  };
  return (
    <div style={{
      position: "absolute",
      ...DOOR_STYLES(r, c)[rotation],
      ...doorStyle,
    }} />
  );
}
