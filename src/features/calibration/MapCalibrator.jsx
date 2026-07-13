/**
 * MapCalibrator.jsx
 *
 * A React tool for calibrating dungeon/grid maps by clicking anchor points.
 * For each map image, you click N points and assign logical grid coordinates (col, row).
 * The tool exports a JSON calibration object you can use with useMapTransform.
 *
 * Usage in your app:
 *   import MapCalibrator from './MapCalibrator';
 *   <MapCalibrator />
 *
 * Once calibrated, use the exported JSON with useMapTransform (see bottom of file).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { ROWS, COLS } from "../../shared/map.js";
import { togglePlacedPiece, rotatePlacedPiece, toggleDoor, cycleDoorRotation } from "../game/placementState.js";
import { EditPanel } from "../sidebar/EditPanel.jsx";
import { buildTransform } from "./calibrationTransform.js";

// ---------------------------------------------------------------------------
// MapCalibrator Component
// ---------------------------------------------------------------------------

const DEFAULT_MAPS = [
  { id: "map1", label: "Map 1", src: null },
  { id: "map2", label: "Map 2", src: null },
  { id: "map3", label: "Map 3", src: null },
];

export default function MapCalibrator({ maps = DEFAULT_MAPS, onExport, initialCalibrations = {}, pieceCategories = [] }) {
  // flat piece map id→def, built from categories
  const pieces = Object.fromEntries(
    pieceCategories.flatMap((cat) => cat.pieces.map((p) => [p.id, p]))
  );

  // ── calibrate-mode state ───────────────────────────────────────────────────
  const [activeMapIdx, setActiveMapIdx] = useState(0);
  const [calibrations, setCalibrations] = useState(() =>
    Object.fromEntries(maps.map((m) => [m.id, initialCalibrations[m.id] ?? { anchors: [] }]))
  );
  const [pendingPixel, setPendingPixel] = useState(null);
  const [logicalInput, setLogicalInput] = useState({ col: "", row: "" });
  const [pixelInput, setPixelInput]     = useState({ x: "", y: "" });
  const [editingIdx, setEditingIdx] = useState(null);
  const [imageSizes, setImageSizes] = useState({});
  const [uploadedSrcs, setUploadedSrcs] = useState({});
  const [exportedJSON, setExportedJSON] = useState(null);

  // ── panel mode ─────────────────────────────────────────────────────────────
  const [panelMode, setPanelMode] = useState("calibrate"); // "calibrate" | "test"

  // ── test-mode edit state ───────────────────────────────────────────────────
  const [testTool, setTestTool]   = useState(() => pieceCategories[0]?.pieces[0]?.id ?? null);
  const [testPlaced, setTestPlaced] = useState({});
  const [testDoors, setTestDoors]   = useState({});

  const imgRef = useRef(null);
  const containerRef = useRef(null);

  const activeMap = maps[activeMapIdx];
  const activeCalib = calibrations[activeMap.id];
  const activeSrc = uploadedSrcs[activeMap.id] || activeMap.src;

  // Get the displayed image rect relative to container
  const getImageRect = useCallback(() => {
    if (!imgRef.current) return null;
    return imgRef.current.getBoundingClientRect();
  }, []);

  const getContainerRect = useCallback(() => {
    if (!containerRef.current) return null;
    return containerRef.current.getBoundingClientRect();
  }, []);

  // Convert click event to image-relative pixel coords (in natural image pixels)
  const eventToImagePixel = useCallback(
    (e) => {
      const imgRect = getImageRect();
      if (!imgRect) return null;
      const size = imageSizes[activeMap.id];
      if (!size) return null;

      const relX = e.clientX - imgRect.left;
      const relY = e.clientY - imgRect.top;

      // Scale from displayed size to natural image size
      const scaleX = size.width / imgRect.width;
      const scaleY = size.height / imgRect.height;

      return [Math.round(relX * scaleX), Math.round(relY * scaleY)];
    },
    [activeMap.id, getImageRect, imageSizes]
  );

  // Convert natural image pixel to displayed pixel (for rendering pins)
  const imagePixelToDisplay = useCallback(
    (px, py) => {
      const imgRect = getImageRect();
      const containerRect = getContainerRect();
      if (!imgRect || !containerRect) return null;
      const size = imageSizes[activeMap.id];
      if (!size) return null;

      const scaleX = imgRect.width / size.width;
      const scaleY = imgRect.height / size.height;

      return [
        imgRect.left - containerRect.left + px * scaleX,
        imgRect.top - containerRect.top + py * scaleY,
      ];
    },
    [activeMap.id, getImageRect, getContainerRect, imageSizes]
  );

  const handleImageLoad = (e) => {
    setImageSizes((prev) => ({
      ...prev,
      [activeMap.id]: {
        width: e.target.naturalWidth,
        height: e.target.naturalHeight,
      },
    }));
  };

  // In test mode clicks come from the grid overlay cells, not the image directly.
  const handleTestCellClick = useCallback(
    (r, c) => {
      const pieceDef = pieces[testTool];
      if (!pieceDef) return;
      if (pieceDef.isEdge) {
        setTestDoors((prev) => toggleDoor(prev, r, c, 0));
      } else {
        setTestPlaced((prev) => togglePlacedPiece(prev, pieceDef, r, c, 0));
      }
    },
    [pieces, testTool]
  );

  const handleTestCellRightClick = useCallback(
    (e, r, c) => {
      e.preventDefault();
      setTestPlaced((prev) => rotatePlacedPiece(prev, pieces, r, c));
      setTestDoors((prev) => cycleDoorRotation(prev, r, c));
    },
    [pieces]
  );

  const handleImageClick = useCallback(
    (e) => {
      if (panelMode === "test") return; // handled by grid overlay cells
      if (editingIdx !== null) return;
      const pixel = eventToImagePixel(e);
      if (!pixel) return;
      setPendingPixel(pixel);
      setLogicalInput({ col: "", row: "" });
      setPixelInput({ x: String(pixel[0]), y: String(pixel[1]) });
    },
    [panelMode, editingIdx, eventToImagePixel]
  );

  const confirmAnchor = () => {
    const col = parseFloat(logicalInput.col);
    const row = parseFloat(logicalInput.row);
    if (isNaN(col) || isNaN(row)) return;
    const px = parseInt(pixelInput.x);
    const py = parseInt(pixelInput.y);
    if (isNaN(px) || isNaN(py)) return;
    const pixel = [px, py];

    if (editingIdx !== null) {
      setCalibrations((prev) => {
        const anchors = [...prev[activeMap.id].anchors];
        anchors[editingIdx] = { pixel, logical: [col, row] };
        return { ...prev, [activeMap.id]: { anchors } };
      });
      setEditingIdx(null);
    } else {
      setCalibrations((prev) => {
        const anchors = [...prev[activeMap.id].anchors, { pixel, logical: [col, row] }];
        return { ...prev, [activeMap.id]: { anchors } };
      });
      setPendingPixel(null);
    }
    setLogicalInput({ col: "", row: "" });
    setPixelInput({ x: "", y: "" });
  };

  const cancelInput = () => {
    setPendingPixel(null);
    setEditingIdx(null);
    setLogicalInput({ col: "", row: "" });
    setPixelInput({ x: "", y: "" });
  };

  const deleteAnchor = (idx) => {
    setCalibrations((prev) => {
      const anchors = prev[activeMap.id].anchors.filter((_, i) => i !== idx);
      return { ...prev, [activeMap.id]: { anchors } };
    });
  };

  const startEditAnchor = (idx) => {
    const anchor = activeCalib.anchors[idx];
    setEditingIdx(idx);
    setLogicalInput({ col: String(anchor.logical[0]), row: String(anchor.logical[1]) });
    setPixelInput({ x: String(anchor.pixel[0]), y: String(anchor.pixel[1]) });
    setPendingPixel(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedSrcs((prev) => ({ ...prev, [activeMap.id]: url }));
    // Reset calibration for this map
    setCalibrations((prev) => ({ ...prev, [activeMap.id]: { anchors: [] } }));
  };

  const transform = buildTransform(activeCalib.anchors);

  // Auto-save calibrations to localStorage whenever anchors change.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!onExport) return;
    const output = {};
    for (const map of maps) {
      const calib = calibrations[map.id];
      output[map.id] = { anchors: calib.anchors, ready: calib.anchors.length >= 3 };
    }
    onExport(output);
  }, [calibrations]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = () => {
    const output = {};
    for (const map of maps) {
      const calib = calibrations[map.id];
      output[map.id] = {
        anchors: calib.anchors,
        // Pre-compute a few test points to help verify
        ready: calib.anchors.length >= 3,
      };
    }
    setExportedJSON(JSON.stringify(output, null, 2));
    onExport?.(output);
  };

  // Render anchor pins on top of the image
  const renderPins = () => {
    return activeCalib.anchors.map((anchor, idx) => {
      const display = imagePixelToDisplay(anchor.pixel[0], anchor.pixel[1]);
      if (!display) return null;
      return (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: display[0],
            top: display[1],
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            cursor: "pointer",
          }}
          title={`Anchor ${idx + 1}: grid (${anchor.logical[0]}, ${anchor.logical[1]})`}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#f43f5e",
              border: "2px solid white",
              boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: "bold",
              color: "white",
            }}
          >
            {idx + 1}
          </div>
          <div
            style={{
              position: "absolute",
              top: 24,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.75)",
              color: "white",
              fontSize: 10,
              padding: "1px 4px",
              borderRadius: 3,
              whiteSpace: "nowrap",
            }}
          >
            ({anchor.logical[0]},{anchor.logical[1]})
          </div>
        </div>
      );
    });
  };

  // Convert natural-image pixel coords to display-relative position.
  const natToDisplay = useCallback(
    (natPx, natPy) => imagePixelToDisplay(Math.round(natPx), Math.round(natPy)),
    [imagePixelToDisplay]
  );

  // Render placed test pieces at calibrated pixel positions.
  // Multi-cell pieces show a coloured tint at every covered cell (same as edit mode).
  const renderTestTokens = () => {
    if (!transform) return null;
    const els = [];

    for (const [anchorKey, entry] of Object.entries(testPlaced)) {
      const p = pieces[entry.type];
      if (!p) continue;

      // Coloured footprint for every covered cell (multi-cell pieces)
      const covered = entry.coveredCells ?? [anchorKey];
      if (covered.length > 1) {
        for (const ck of covered) {
          const [cr, cc] = ck.split(",").map(Number);
          const [nx, ny] = transform(cc, cr);
          const disp = natToDisplay(nx, ny);
          if (!disp) continue;
          els.push(
            <div key={`tint-${ck}`} style={{ position: "absolute", left: disp[0], top: disp[1], transform: "translate(-50%,-50%)", zIndex: 18, pointerEvents: "none" }}>
              <div style={{ width: 32, height: 32, background: p.color + "55", border: `1px solid ${p.color}88`, borderRadius: 2 }} />
            </div>
          );
        }
      }

      // Token at anchor
      const [ar, ac] = anchorKey.split(",").map(Number);
      const [nx, ny] = transform(ac, ar);
      const disp = natToDisplay(nx, ny);
      if (!disp) continue;
      const radius = p.shape === "circle" ? "50%" : "3px";
      const isDiamond = p.shape === "diamond";
      els.push(
        <div key={anchorKey} style={{ position: "absolute", left: disp[0], top: disp[1], transform: "translate(-50%,-50%)", zIndex: 20, pointerEvents: "none" }}>
          <div style={{ width: 24, height: 24, borderRadius: radius, background: p.color, border: "2px solid #f5e6c8", boxShadow: `0 0 8px ${p.color}cc, 0 2px 4px #0009`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: "bold", color: "#111", transform: isDiamond ? "rotate(45deg)" : "none" }}>
            <span style={{ transform: isDiamond ? "rotate(-45deg)" : "none" }}>{p.icon}</span>
          </div>
        </div>
      );
    }

    // Doors: render at midpoint between anchor and adjacent cell
    const neighborOffsets = [[0,1],[1,0],[0,-1],[-1,0]];
    for (const [anchorKey, { rotation }] of Object.entries(testDoors)) {
      const [ar, ac] = anchorKey.split(",").map(Number);
      const [dr, dc] = neighborOffsets[rotation];
      const [ax, ay] = transform(ac, ar);
      const [bx, by] = transform(ac + dc, ar + dr);
      const disp = natToDisplay((ax + bx) / 2, (ay + by) / 2);
      if (!disp) continue;
      const doorColor = "#9c6b2e";
      // Vertical door (left/right edge) → tall bar; horizontal (top/bottom) → wide bar
      const isVertical = rotation === 0 || rotation === 2;
      els.push(
        <div key={anchorKey} style={{ position: "absolute", left: disp[0], top: disp[1], transform: "translate(-50%,-50%)", zIndex: 20, pointerEvents: "none" }}>
          <div style={{ width: isVertical ? 7 : 26, height: isVertical ? 26 : 7, borderRadius: 4, background: doorColor, border: "2px solid #f5e6c8", boxShadow: `0 0 10px ${doorColor}cc, 0 2px 4px #0009` }} />
        </div>
      );
    }

    return els;
  };

  const inputStyle = {
    border: "1px solid #d1d5db",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: 13,
    width: 70,
    outline: "none",
  };

  const btnStyle = (color = "#3b82f6") => ({
    background: color,
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1400, margin: "0 auto", padding: 20 }}>
      <h2 style={{ marginBottom: 4, fontSize: 20, fontWeight: 700 }}>🗺 Map Calibrator</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>
        Click on the map to place anchor points. Assign each one a logical grid coordinate (col, row).
        You need at least 3 anchors (4+ recommended) per map for accurate placement.
      </p>

      {/* Map tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {maps.map((m, i) => {
          const count = calibrations[m.id].anchors.length;
          const ready = count >= 3;
          return (
            <button
              key={m.id}
              onClick={() => { setActiveMapIdx(i); setPendingPixel(null); setEditingIdx(null); setTestPlaced({}); setTestDoors({}); }}
              style={{
                padding: "6px 16px",
                borderRadius: 8,
                border: activeMapIdx === i ? "2px solid #3b82f6" : "2px solid #d1d5db",
                background: activeMapIdx === i ? "#eff6ff" : "white",
                fontWeight: activeMapIdx === i ? 700 : 400,
                cursor: "pointer",
                fontSize: 13,
                color: activeMapIdx === i ? "#1d4ed8" : "#374151",
              }}
            >
              {m.label}
              <span style={{ marginLeft: 6, fontSize: 11, color: ready ? "#16a34a" : "#9ca3af" }}>
                {ready ? `✓ ${count}` : `${count}/3`}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Image panel */}
        <div style={{ flex: 1 }}>
          {/* Upload + mode toggle */}
          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {activeMap.src ? (
                <>
                  <label style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Override image:</label>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ fontSize: 11, color: "#6b7280" }} />
                </>
              ) : (
                <>
                  <label style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Image:</label>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ fontSize: 13 }} />
                </>
              )}
            </div>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #d1d5db" }}>
              {["calibrate", "test"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setPanelMode(m); setPendingPixel(null); setEditingIdx(null); }}
                  style={{
                    padding: "5px 14px",
                    fontSize: 12, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: panelMode === m ? "#3b82f6" : "white",
                    color: panelMode === m ? "white" : "#374151",
                    letterSpacing: 0.5,
                    textTransform: "capitalize",
                  }}
                >
                  {m === "calibrate" ? "⊕ Calibrate" : "🧪 Test"}
                </button>
              ))}
            </div>
          </div>

          {activeSrc ? (
            <div
              ref={containerRef}
              style={{
                position: "relative", display: "inline-block", userSelect: "none",
                cursor: panelMode === "test" ? (transform ? "crosshair" : "not-allowed") : "crosshair",
              }}
              onClick={handleImageClick}
            >
              <img
                ref={imgRef}
                src={activeSrc}
                alt={activeMap.label}
                onLoad={handleImageLoad}
                style={{ display: "block", maxWidth: "100%", maxHeight: "72vh", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}
                draggable={false}
              />
              {panelMode === "calibrate" && renderPins()}
              {panelMode === "test" && renderTestTokens()}
              {/* Transparent grid overlay in test mode for cell-click interaction */}
              {panelMode === "test" && (
                <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, zIndex: 15 }}>
                  {Array.from({ length: ROWS }, (_, r) =>
                    Array.from({ length: COLS }, (_, c) => (
                      <div
                        key={`${r},${c}`}
                        onClick={() => handleTestCellClick(r, c)}
                        onContextMenu={(e) => handleTestCellRightClick(e, r, c)}
                        style={{ cursor: "crosshair" }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ width: "100%", height: 300, background: "#f3f4f6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14, border: "2px dashed #d1d5db" }}>
              Upload an image to begin calibration
            </div>
          )}
        </div>

        {/* Side panel */}
        <div style={{ width: 300, flexShrink: 0 }}>

          {/* Input form: pending click or edit */}
          {(pendingPixel || editingIdx !== null) && (
            <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 8, padding: 14, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#854d0e" }}>
                {editingIdx !== null ? `Edit Anchor ${editingIdx + 1}` : "New Anchor"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13 }}>Px X:</span>
                <input
                  style={inputStyle}
                  value={pixelInput.x}
                  onChange={(e) => setPixelInput((p) => ({ ...p, x: e.target.value }))}
                  placeholder="e.g. 412"
                />
                <span style={{ fontSize: 13 }}>Y:</span>
                <input
                  style={inputStyle}
                  value={pixelInput.y}
                  onChange={(e) => setPixelInput((p) => ({ ...p, y: e.target.value }))}
                  placeholder="e.g. 275"
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13 }}>Col:</span>
                <input
                  style={inputStyle}
                  value={logicalInput.col}
                  onChange={(e) => setLogicalInput((p) => ({ ...p, col: e.target.value }))}
                  placeholder="e.g. 5"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && confirmAnchor()}
                />
                <span style={{ fontSize: 13 }}>Row:</span>
                <input
                  style={inputStyle}
                  value={logicalInput.row}
                  onChange={(e) => setLogicalInput((p) => ({ ...p, row: e.target.value }))}
                  placeholder="e.g. 3"
                  onKeyDown={(e) => e.key === "Enter" && confirmAnchor()}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={btnStyle("#22c55e")} onClick={confirmAnchor}>Confirm</button>
                <button style={btnStyle("#6b7280")} onClick={cancelInput}>Cancel</button>
              </div>
            </div>
          )}

          {/* Anchor list */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "#111827" }}>
              Anchors ({activeCalib.anchors.length})
              {activeCalib.anchors.length < 3 && (
                <span style={{ marginLeft: 6, fontSize: 11, color: "#ef4444" }}>Need {3 - activeCalib.anchors.length} more</span>
              )}
            </div>
            {activeCalib.anchors.length === 0 && (
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Click on the map to add anchors.</div>
            )}
            {activeCalib.anchors.map((anchor, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#f43f5e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                <span style={{ color: "#374151", flex: 1 }}>
                  px ({anchor.pixel[0]}, {anchor.pixel[1]}) → grid ({anchor.logical[0]}, {anchor.logical[1]})
                </span>
                <button onClick={() => startEditAnchor(idx)} style={{ fontSize: 11, background: "none", border: "1px solid #d1d5db", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>edit</button>
                <button onClick={() => deleteAnchor(idx)} style={{ fontSize: 11, background: "none", border: "1px solid #fca5a5", borderRadius: 4, padding: "2px 6px", cursor: "pointer", color: "#ef4444" }}>✕</button>
              </div>
            ))}
          </div>

          {/* Test mode — exact same edit-mode panel */}
          {panelMode === "test" && (
            <div style={{ marginBottom: 14 }}>
              {!transform && (
                <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 8, padding: "6px 10px", background: "#fff1f2", border: "1px solid #fca5a5", borderRadius: 6 }}>
                  Need at least 3 anchors to enable test mode.
                </div>
              )}
              <EditPanel
                pieceCategories={pieceCategories}
                tool={testTool}
                onSelectTool={setTestTool}
              />
              {(Object.keys(testPlaced).length > 0 || Object.keys(testDoors).length > 0) && (
                <button
                  style={{ ...btnStyle("#6b7280"), marginTop: 8, width: "100%" }}
                  onClick={() => { setTestPlaced({}); setTestDoors({}); }}
                >
                  Clear all ({Object.keys(testPlaced).length + Object.keys(testDoors).length})
                </button>
              )}
            </div>
          )}

          {/* Export */}
          <button style={{ ...btnStyle("#0f172a"), width: "100%", padding: "10px 0", fontSize: 14, borderRadius: 8, marginBottom: 12 }} onClick={handleExport}>
            Export Calibration JSON
          </button>

          {exportedJSON && (
            <div style={{ position: "relative" }}>
              <pre style={{ background: "#0f172a", color: "#86efac", padding: 12, borderRadius: 8, fontSize: 11, overflowX: "auto", maxHeight: 300, overflowY: "auto" }}>
                {exportedJSON}
              </pre>
              <button
                style={{ position: "absolute", top: 8, right: 8, fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "none", background: "#334155", color: "white", cursor: "pointer" }}
                onClick={() => navigator.clipboard.writeText(exportedJSON)}
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

