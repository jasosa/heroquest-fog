import { useState, useEffect, useMemo } from "react";
import { BOARD, ROWS, COLS, CELL } from "../../map.js";
import { loadCalibration } from "../../questStorage.js";
import { useMapTransform } from "../../components/MapCalibrator.jsx";
import BoardCell from "./BoardCell.jsx";
import { TokenOverlay } from "./TokenOverlay.jsx";
import { DoorOverlay } from "./DoorOverlay.jsx";

export function BoardGrid({ fog, placed, doors, mode, lastClick, onCellClick, onCellRotate, bgImage }) {
  const isEditMode = mode === "edit";

  // Load natural image dimensions so calibrated pixel coords can be scaled
  // to the displayed board size (COLS*CELL × ROWS*CELL).
  const [naturalSize, setNaturalSize] = useState({ w: COLS * CELL, h: ROWS * CELL });
  useEffect(() => {
    const img = new Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = `/${bgImage}.png`;
  }, [bgImage]);

  // Read calibration from localStorage (written by CalibratePage via saveCalibration).
  const [calibrationData] = useState(() => loadCalibration());

  // useMapTransform returns a (col,row)→[px,py] function using calibration anchors.
  // Falls back to ()=>[0,0] when no calibration exists for this board.
  const transform = useMapTransform(calibrationData, bgImage);
  const hasCalibration = calibrationData?.[bgImage]?.ready === true;

  // Convert grid (col, row) to displayed pixel position.
  // With calibration: scale natural-image pixels to the displayed grid size.
  // Without calibration: use grid-cell centre.
  // Accepts fractional col/row so cell corners (±0.5) can be computed.
  function getTokenPos(col, row) {
    if (hasCalibration) {
      const [px, py] = transform(col, row);
      return [px * (COLS * CELL / naturalSize.w), py * (ROWS * CELL / naturalSize.h)];
    }
    return [col * CELL + CELL / 2, row * CELL + CELL / 2];
  }

  // Calibration-aware fog polygons.
  // Each un-revealed cell becomes a quadrilateral whose 4 corners are derived
  // from getTokenPos at ±0.5 offsets.  With no calibration the corners collapse
  // to the exact cell rectangle (identical to the old per-cell dark overlay).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fogPolygons = useMemo(() => {
    if (isEditMode) return null;
    const polys = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!BOARD[r]?.[c]) continue;
        if (fog.has(`${r},${c}`)) continue;
        const [x0, y0] = getTokenPos(c - 0.5, r - 0.5); // top-left
        const [x1, y1] = getTokenPos(c + 0.5, r - 0.5); // top-right
        const [x2, y2] = getTokenPos(c + 0.5, r + 0.5); // bottom-right
        const [x3, y3] = getTokenPos(c - 0.5, r + 0.5); // bottom-left
        polys.push(`${r},${c}|${x0},${y0} ${x1},${y1} ${x2},${y2} ${x3},${y3}`);
      }
    }
    return polys;
  // getTokenPos captures hasCalibration/transform/naturalSize; naturalSize is
  // the only one that changes (on image load) so we include it explicitly.
  }, [fog, isEditMode, naturalSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build a cell-key → {piece, anchorKey} map so each BoardCell knows
  // whether it is covered and whether it is the anchor.
  const coverage = useMemo(() => {
    const map = {};
    for (const [anchorKey, piece] of Object.entries(placed)) {
      for (const cellKey of (piece.coveredCells ?? [anchorKey])) {
        map[cellKey] = { piece, anchorKey };
      }
    }
    return map;
  }, [placed]);

  return (
    <div style={{
      border: "2px solid #c4a870",
      boxShadow: "0 0 20px #c4a87044",
      display: "inline-block",
      backgroundImage: `url('/${bgImage}.png')`,
      backgroundSize: "100% 100%",
      backgroundRepeat: "no-repeat",
      overflow: "hidden",
      lineHeight: 0,
      position: "relative",
    }}>
      {BOARD.map((row, r) => (
        <div key={r} style={{ display: "flex" }}>
          {row.map((region, c) => {
            const k = `${r},${c}`;
            const cov = coverage[k];
            return (
              <BoardCell
                key={c}
                r={r} c={c}
                region={region}
                isRevealed={fog.has(k)}
                isEditMode={isEditMode}
                isLastClick={lastClick === k}
                coverage={cov?.piece}
                onClick={() => onCellClick(r, c)}
                onRightClick={isEditMode ? () => onCellRotate(r, c) : undefined}
              />
            );
          })}
        </div>
      ))}
      {/* Calibration-aware fog — SVG quadrilaterals replace per-cell dark divs */}
      {fogPolygons && (
        <svg style={{
          position: "absolute", inset: 0, overflow: "visible",
          width: COLS * CELL, height: ROWS * CELL,
          zIndex: 2, pointerEvents: "none",
        }}>
          {fogPolygons.map((entry) => {
            const bar = entry.indexOf("|");
            return <polygon key={entry.slice(0, bar)} points={entry.slice(bar + 1)} fill="#060401" />;
          })}
        </svg>
      )}

      {/* Token overlays — calibrated or grid-centre fallback */}
      {Object.entries(placed).map(([anchorKey, piece]) => (
        <TokenOverlay key={anchorKey} anchorKey={anchorKey} type={piece.type}
          coveredCells={piece.coveredCells} rotation={piece.rotation}
          fog={fog} isEditMode={isEditMode} getTokenPos={getTokenPos} tileSet={bgImage} />
      ))}
      {/* Door overlays — calibrated position when available, fixed grid otherwise */}
      {Object.entries(doors).map(([anchorKey, { rotation, type }]) => (
        <DoorOverlay key={anchorKey} anchorKey={anchorKey} rotation={rotation} type={type}
          fog={fog} isEditMode={isEditMode}
          getTokenPos={getTokenPos} hasCalibration={hasCalibration} tileSet={bgImage} />
      ))}
    </div>
  );
}
