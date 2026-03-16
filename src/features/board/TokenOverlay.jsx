import { CELL } from "../../map.js";
import { PIECES } from "../../pieces.js";
import { resolveScale } from "../../pieces.js";

function Token({ type }) {
  const p = PIECES[type];
  if (!p) return null;
  const size = 26;
  const radius = p.shape === "circle" ? "50%" : "3px";
  return (
    <div style={{
      width: size, height: size,
      background: p.color,
      borderRadius: radius,
      transform: p.shape === "diamond" ? "rotate(45deg)" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 8, fontWeight: "bold", color: "#111",
      boxShadow: `0 0 8px ${p.color}99, 0 1px 3px #0008`,
      flexShrink: 0, zIndex: 3,
    }}>
      <span style={{ transform: p.shape === "diamond" ? "rotate(-45deg)" : "none" }}>
        {p.icon}
      </span>
    </div>
  );
}

// Tokens are rendered as overlays rather than inside grid cells so their
// position can be driven by calibrated pixel coordinates (useMapTransform).
export function TokenOverlay({ anchorKey, type, coveredCells, rotation, fog, isEditMode, getTokenPos, tileSet }) {
  const p = PIECES[type];
  const isVisible = isEditMode || fog.has(anchorKey) ||
    (coveredCells && coveredCells.some(k => fog.has(k)));
  if (!isVisible) return null;

  const [r, c] = anchorKey.split(",").map(Number);

  if (p?.image && coveredCells?.length) {
    const cells = coveredCells.map(k => k.split(",").map(Number));
    const minR = Math.min(...cells.map(([cr]) => cr));
    const maxR = Math.max(...cells.map(([cr]) => cr));
    const minC = Math.min(...cells.map(([, cc]) => cc));
    const maxC = Math.max(...cells.map(([, cc]) => cc));
    const [left, top] = getTokenPos(minC - 0.5, minR - 0.5);
    const [right, bottom] = getTokenPos(maxC + 0.5, maxR + 0.5);
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;

    // Natural (rotation=0) dimensions from piece definition
    const natCells = p.cells ?? [[0, 0]];
    const natRows = Math.max(...natCells.map(([dr]) => dr)) - Math.min(...natCells.map(([dr]) => dr)) + 1;
    const natCols = Math.max(...natCells.map(([, dc]) => dc)) - Math.min(...natCells.map(([, dc]) => dc)) + 1;
    // For odd rotations (90°/270°) the natural w/h are swapped to fit the footprint
    const isOdd = (rotation ?? 0) % 2 === 1;
    const bbW = right - left;
    const scale = resolveScale(p.imageScale, tileSet);
    // Natural image proportion: natCols × natRows; scale to fit bounding box
    const cellPx = isOdd ? bbW / natRows : bbW / natCols;
    const w = natCols * cellPx * scale;
    const h = natRows * cellPx * scale;

    return (
      <img
        src={`/tiles/${tileSet}/${p.image}`}
        alt={p.label}
        style={{
          position: "absolute",
          left: cx - w / 2,
          top: cy - h / 2,
          width: w,
          height: h,
          transform: `rotate(${(rotation ?? 0) * 90}deg)`,
          zIndex: 5,
          pointerEvents: "none",
          objectFit: "fill",
        }}
      />
    );
  }

  const [px, py] = getTokenPos(c, r);
  return (
    <div style={{
      position: "absolute",
      left: px, top: py,
      transform: "translate(-50%, -50%)",
      zIndex: 5, pointerEvents: "none",
    }}>
      <Token type={type} />
    </div>
  );
}
