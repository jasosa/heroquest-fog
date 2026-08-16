import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { T, FONT_TITLE, FONT_HEADING, FONT_BODY } from "../../shared/theme.js";
import { COLS, ROWS, CELL } from "../../shared/map.js";
import { persistQuest, loadCalibration, saveCalibration } from "../../shared/questStorage.js";
import { computeFitZoom } from "./fitZoom.js";
import {
  PAN_DRAG_THRESHOLD_PX, computeInitialPanOffset, computeRecenterOnZoomOffset,
  clampPanOffset, isPannable, exceedsPanThreshold,
} from "./panOffset.js";
import { isSessionDirty, hasUnsavedChanges, stableStringify } from "./navigationGuards.js";
import QuestLibrary from "../library/QuestLibrary.jsx";
import MapCalibrator from "../calibration/MapCalibrator.jsx";
import { PIECE_CATEGORIES, PIECES } from "../../shared/pieces.js";
import { useGameState, hasHeroStart } from "./useGameState.js";
import { BoardGrid } from "../board/BoardGrid.jsx";
import { Sidebar } from "../sidebar/Sidebar.jsx";
import { NoteMarkerDialog } from "../board/NoteMarkerDialog.jsx";
import { SpecialMonsterDialog } from "../board/SpecialMonsterDialog.jsx";
import { SearchNoteDialog } from "../board/SearchNoteDialog.jsx";
import { SearchNotePopup } from "../board/SearchNotePopup.jsx";
import { SecretDoorConfigDialog } from "../board/SecretDoorConfigDialog.jsx";
import { SecretDoorResultPopup } from "../board/SecretDoorResultPopup.jsx";
import { HeroPlacementPopup } from "../board/HeroPlacementPopup.jsx";
import { ChestResultPopup } from "../board/ChestResultPopup.jsx";
import { ChestConfigDialog } from "../board/ChestConfigDialog.jsx";
import { TrapInteractionPopup } from "../board/TrapInteractionPopup.jsx";
import { TrapConfigDialog } from "../board/TrapConfigDialog.jsx";

const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const ZOOM_STEP = 0.25;
const ZOOM_MIN  = 0.25;
const ZOOM_MAX  = 3;

const zoomBtnStyle = {
  width: 28, height: 28, padding: 0, lineHeight: "28px", textAlign: "center",
  background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`,
  cursor: "pointer", fontFamily: "inherit", fontSize: 16, borderRadius: 3,
  userSelect: "none",
};

// ═══════════════════════════════════════════════
//  BOARD AREA (left panel)
// ═══════════════════════════════════════════════
function BoardArea({ fog, placed, doors, searchMarkers, searchNotes, searchedCounts, mode, lastClick, onCellClick, onCellRotate, bgImage,
  pendingRoomReveal, onConfirmReveal, onCancelReveal,
  pendingPlacementPopup, placementMessage, onDismissPlacementPopup,
  onShowTooltip, onHideTooltip, onAnnotateMonster, onEditNote,
  onEditSearchNote, onViewSearchNote, onRemoveSearchMarker,
  secretDoorMarkers, revealedSecretDoors, onEditSecretDoorConfig, onSearchSecretDoor,
  revealedTraps, onTrapInteraction, onConfigureTrap,
  disarmedTraps, springedTraps,
  openedChests, onOpenChest, onConfigureChest,
  zoom, onZoomIn, onZoomOut,
  pan, cursor, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, onPointerLeave,
  trapInteractionPopup, boardAreaRef }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", gap: 10, padding: "16px 20px",
      overflow: "hidden", minHeight: 0, position: "relative",
    }}>
      <h1 style={{
        margin: 0, fontSize: 20, letterSpacing: 6, flexShrink: 0,
        color: T.sidebarTitle, textTransform: "uppercase",
        textShadow: "0 2px 8px #c4a87066",
        fontWeight: "normal",
        fontFamily: FONT_TITLE,
      }}>
        HeroQuest — Fog of War
      </h1>

      <div style={{
        fontSize: 9, letterSpacing: 3, textTransform: "uppercase", flexShrink: 0,
        color: mode === "edit" ? T.accentGold : "#4caf50",
        border: `1px solid ${mode === "edit" ? T.accentGold : "#4caf50"}`,
        padding: "3px 12px",
        fontFamily: FONT_HEADING,
      }}>
        {mode === "edit" ? "✎ Edit Mode — Click to place · Right-click to rotate" : "⚔ Play Mode — Click to reveal"}
      </div>

      {/* Zoom controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button onClick={onZoomOut} disabled={zoom <= ZOOM_MIN} style={zoomBtnStyle} title="Zoom out">−</button>
        <span style={{
          fontSize: 11, color: T.sidebarText, minWidth: 38, textAlign: "center",
          background: T.panelBg, border: `1px solid ${T.sidebarBorder}`,
          borderRadius: 10, padding: "1px 7px",
        }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={onZoomIn} disabled={zoom >= ZOOM_MAX} style={zoomBtnStyle} title="Zoom in">+</button>
      </div>

      {/* Pannable board area */}
      <div
        ref={boardAreaRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onLostPointerCapture={onLostPointerCapture}
        onPointerLeave={onPointerLeave}
        style={{
          overflow: "hidden", flex: 1, minHeight: 0, width: "100%",
          position: "relative", touchAction: "none", cursor,
        }}
      >
        {/* Hero placement popup — shown once when entering play mode; covers
            the full container (not just the board's footprint), independent
            of pan/zoom. */}
        {pendingPlacementPopup && (
          <HeroPlacementPopup
            message={placementMessage}
            onClose={onDismissPlacementPopup}
          />
        )}

        {/* Sizing placeholder: gives the board its unscaled dimensions */}
        <div style={{
          width: BOARD_W,
          height: BOARD_H,
          position: "absolute", top: 0, left: 0,
          transformOrigin: "top left",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          willChange: "transform",
        }}>
          <BoardGrid
            fog={fog} placed={placed} doors={doors}
            searchMarkers={searchMarkers} searchNotes={searchNotes} searchedCounts={searchedCounts}
            mode={mode}
            lastClick={lastClick} onCellClick={onCellClick} onCellRotate={onCellRotate}
            bgImage={bgImage}
            pendingRoomReveal={pendingRoomReveal}
            onConfirmReveal={onConfirmReveal}
            onCancelReveal={onCancelReveal}
            onShowTooltip={onShowTooltip} onHideTooltip={onHideTooltip}
            onAnnotateMonster={onAnnotateMonster} onEditNote={onEditNote}
            onEditSearchNote={onEditSearchNote} onViewSearchNote={onViewSearchNote}
            onRemoveSearchMarker={onRemoveSearchMarker}
            secretDoorMarkers={secretDoorMarkers}
            revealedSecretDoors={revealedSecretDoors}
            onEditSecretDoorConfig={onEditSecretDoorConfig}
            onSearchSecretDoor={onSearchSecretDoor}
            revealedTraps={revealedTraps}
            onTrapInteraction={onTrapInteraction}
            onConfigureTrap={onConfigureTrap}
            disarmedTraps={disarmedTraps}
            springedTraps={springedTraps}
            openedChests={openedChests}
            onOpenChest={onOpenChest}
            onConfigureChest={onConfigureChest}
          />
        </div>
      </div>

      <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, flexShrink: 0 }}>
        HEROQUEST BOARD · 22 ROOMS · 26×19
      </div>

      {trapInteractionPopup}
    </div>
  );
}

// ═══════════════════════════════════════════════
//  GAME SCREEN
// ═══════════════════════════════════════════════
export function GameScreen({ quest, initialMode, onBack, onQuestSaved }) {
  const gameState = useGameState({
    initialPlaced: quest?.placed ?? {},
    initialDoors: quest?.doors ?? {},
    initialSearchMarkers: quest?.searchMarkers ?? null,
    initialSearchNotes: quest?.searchNotes ?? null,
    initialSecretDoorMarkers: quest?.secretDoorMarkers ?? null,
    initialMode: initialMode ?? "play",
    initialTitle: quest?.title ?? "Untitled Quest",
    initialDescription: quest?.description ?? "",
    initialPlacementMessage: quest?.placementMessage ?? "",
  });
  const savedStateRef = useRef(stableStringify({
    placed: quest?.placed ?? {},
    doors: quest?.doors ?? {},
    searchMarkers: quest?.searchMarkers ?? {},
    searchNotes: quest?.searchNotes ?? {},
    secretDoorMarkers: quest?.secretDoorMarkers ?? {},
  }));
  const [pendingModeSwitch, setPendingModeSwitch] = useState(false);
  const [pendingBackToLibrary, setPendingBackToLibrary] = useState(false);

  const [bgImage, setBgImage]       = useState("board2");
  const [savedFlash, setSavedFlash] = useState(false);
  const [hoverTooltip, setHoverTooltip] = useState(null); // {anchorKey,x,y,content}|null
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const boardAreaRef = useRef(null);

  // Refs kept in sync with the latest zoom/pan state so pointer handlers
  // (registered once, with no dependency on zoom/pan) can read current
  // values without stale closures — same pattern as useGameState's useLatest.
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useLayoutEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useLayoutEffect(() => { panRef.current = pan; }, [pan]);

  // Drag-gesture tracking lives in a ref (not state) to avoid a re-render on
  // every pointermove pixel; `isPanning` state only flips once the drag
  // crosses PAN_DRAG_THRESHOLD_PX (the only bit that needs to trigger a
  // cursor re-render).
  // Note: dragRef tracks a single in-flight pointerId, checked only inside
  // handlePointerMove (`drag.pointerId !== e.pointerId`); pointerup /
  // pointercancel / lostpointercapture don't re-check pointerId, and
  // setPointerCapture doesn't make this safe for a second concurrent
  // pointer either. Multi-touch drag (two fingers panning at once) is
  // explicitly out of scope for this feature.
  const dragRef = useRef({ active: false, pointerId: null, startX: 0, startY: 0, startPanX: 0, startPanY: 0, crossedThreshold: false });
  // Set right before a drag ends; read by the native capture-phase click
  // listener below to suppress the synthetic click a pointerup generates
  // after a real pan gesture.
  const wasPanningRef = useRef(false);

  function resetDrag() {
    dragRef.current = { active: false, pointerId: null, startX: 0, startY: 0, startPanX: 0, startPanY: 0, crossedThreshold: false };
    setIsPanning(false);
  }

  // pointerup (and the zoom-button-mid-drag case, which behaves "as if
  // pointerup fired") is the only path that can trigger a browser-emitted
  // synthetic click for the same gesture, so only this path arms the
  // suppression flag.
  function endPanAsRelease() {
    if (dragRef.current.active) {
      wasPanningRef.current = dragRef.current.crossedThreshold;
    }
    resetDrag();
  }

  // pointercancel / lostpointercapture / pointerleave never produce a
  // trailing click for the same gesture (the browser doesn't emit one), so
  // these must NOT arm the suppression flag — a genuinely new click right
  // after should behave normally.
  function endPanAsCancel() {
    resetDrag();
  }

  function applyZoom(newZoom) {
    endPanAsRelease();
    const rect = boardAreaRef.current?.getBoundingClientRect();
    const newPan = computeRecenterOnZoomOffset({
      oldOffset: panRef.current, oldZoom: zoomRef.current, newZoom,
      containerWidth: rect?.width ?? 0, containerHeight: rect?.height ?? 0,
      boardWidth: BOARD_W, boardHeight: BOARD_H,
    });
    setZoom(newZoom);
    setPan(newPan);
  }
  const zoomIn  = () => applyZoom(Math.min(ZOOM_MAX, Math.round((zoomRef.current + ZOOM_STEP) * 100) / 100));
  const zoomOut = () => applyZoom(Math.max(ZOOM_MIN, Math.round((zoomRef.current - ZOOM_STEP) * 100) / 100));

  // Mount-time-only viewport cover-fit (FEAT-035 / ISSUE-018). Scales the
  // board up until it fully covers the board area on both axes — it may
  // overflow (and be pannable) on whichever axis isn't the binding
  // constraint, rather than leaving a gap. Deliberately does NOT react to
  // resize/rotation/sidebar toggle — recomputing later would clobber a
  // player's manual zoom and cause a pan-position jump. Runs once per
  // GameScreen mount (i.e. once per quest session, since key={quest.id}
  // forces a full remount on quest switch).
  useLayoutEffect(() => {
    const rect = boardAreaRef.current?.getBoundingClientRect();
    const containerWidth = rect?.width ?? 0;
    const containerHeight = rect?.height ?? 0;
    const fitZoom = computeFitZoom({
      availableWidth: containerWidth,
      availableHeight: containerHeight,
      boardWidth: BOARD_W, boardHeight: BOARD_H,
      zoomMin: ZOOM_MIN, zoomMax: ZOOM_MAX,
    });
    setZoom(fitZoom);
    setPan(computeInitialPanOffset({
      containerWidth, containerHeight,
      boardWidth: BOARD_W, boardHeight: BOARD_H,
      zoom: fitZoom,
    }));
  }, []);

  // ── Pointer-gesture panning ────────────────────────────────────────────
  // Arms only for the primary mouse button (or any non-mouse pointer, e.g.
  // touch/pen) and only when no in-board dialog (room-confirm / hero
  // placement) is open. Right-click is never touched here, so BoardCell's
  // existing onContextMenu rotate handler needs no changes.
  function shouldArmPan(e) {
    if (gameState.pendingRoomReveal || gameState.pendingPlacementPopup) return false;
    if (e.pointerType === "mouse") return e.button === 0;
    return true;
  }

  function handlePointerDown(e) {
    if (!shouldArmPan(e)) return;
    const rect = boardAreaRef.current?.getBoundingClientRect();
    const containerWidth = rect?.width ?? 0;
    const containerHeight = rect?.height ?? 0;
    if (!isPannable({ containerWidth, containerHeight, boardWidth: BOARD_W, boardHeight: BOARD_H, zoom: zoomRef.current })) return;
    dragRef.current = {
      active: true, pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      startPanX: panRef.current.x, startPanY: panRef.current.y,
      crossedThreshold: false,
    };
    // Deliberately NOT calling setPointerCapture here (ISSUE-021): in real
    // browsers it retargets the eventual click event to the *capturing*
    // element (this container) instead of the actual clicked descendant
    // (BoardCell/TokenOverlay), silently breaking cell/piece clicks whenever
    // a drag was armed — i.e. whenever the board was pannable (zoom high
    // enough to overflow the container). Not needed for correctness here:
    // handlePointerLeave already ends the gesture the moment the pointer
    // leaves the container bounds, so we never relied on capture's usual
    // purpose of continuing to receive events outside the element.
  }

  function handlePointerMove(e) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.crossedThreshold && exceedsPanThreshold({ dx, dy, threshold: PAN_DRAG_THRESHOLD_PX })) {
      drag.crossedThreshold = true;
      setIsPanning(true);
    }
    const rect = boardAreaRef.current?.getBoundingClientRect();
    const containerWidth = rect?.width ?? 0;
    const containerHeight = rect?.height ?? 0;
    setPan(clampPanOffset({
      offset: { x: drag.startPanX + dx, y: drag.startPanY + dy },
      containerWidth, containerHeight,
      boardWidth: BOARD_W, boardHeight: BOARD_H,
      zoom: zoomRef.current,
    }));
  }

  function handlePointerUp() { endPanAsRelease(); }
  function handlePointerCancel() { endPanAsCancel(); }
  function handleLostPointerCapture() { endPanAsCancel(); }
  function handlePointerLeave() { endPanAsCancel(); }

  // Native capture-phase click listener: required because React's delegated
  // onClick on BoardCell/TokenOverlay fires after native capture reaches
  // this ancestor, so a React-level/bubble-phase guard would be too late to
  // suppress the synthetic click a pointerup emits after a real pan drag.
  useEffect(() => {
    const el = boardAreaRef.current;
    if (!el) return undefined;
    function handleClickCapture(e) {
      if (wasPanningRef.current) {
        e.stopPropagation();
        e.preventDefault();
        wasPanningRef.current = false;
      }
    }
    el.addEventListener("click", handleClickCapture, true);
    return () => el.removeEventListener("click", handleClickCapture, true);
  }, []);

  const boardAreaRect = boardAreaRef.current?.getBoundingClientRect();
  const boardIsPannable = isPannable({
    containerWidth: boardAreaRect?.width ?? 0,
    containerHeight: boardAreaRect?.height ?? 0,
    boardWidth: BOARD_W, boardHeight: BOARD_H, zoom,
  });
  const boardAreaCursor = (gameState.pendingRoomReveal || gameState.pendingPlacementPopup)
    ? "default"
    : isPanning ? "grabbing" : (boardIsPannable ? "grab" : "default");

  function handleSave() {
    if (!hasHeroStart(gameState.placed)) {
      gameState.setSaveError("Add a Hero Start marker before saving.");
      setTimeout(() => gameState.setSaveError(null), 3000);
      return;
    }
    gameState.setSaveError(null);
    const updated = {
      ...quest,
      title: gameState.questTitle,
      description: gameState.questDescription,
      placementMessage: gameState.questPlacementMessage,
      placed: gameState.placed,
      doors: gameState.doors,
      searchMarkers: gameState.searchMarkers,
      searchNotes: gameState.searchNotes,
      secretDoorMarkers: gameState.secretDoorMarkers,
    };
    persistQuest(updated);
    savedStateRef.current = stableStringify({
      placed: gameState.placed,
      doors: gameState.doors,
      searchMarkers: gameState.searchMarkers,
      searchNotes: gameState.searchNotes,
      secretDoorMarkers: gameState.secretDoorMarkers,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    onQuestSaved?.(updated);
  }

  function guardedSetMode(m) {
    if (gameState.mode === "play" && m === "edit" &&
        isSessionDirty(gameState.fog, gameState.openedChests,
                       gameState.revealedTraps, gameState.revealedSecretDoors,
                       gameState.searchedCounts, gameState.springedTraps, gameState.disarmedTraps)) {
      setPendingModeSwitch(true);
      return;
    }
    gameState.setMode(m);
  }

  function guardedBack() {
    if (gameState.mode === "edit" &&
        hasUnsavedChanges(savedStateRef.current, {
          placed: gameState.placed,
          doors: gameState.doors,
          searchMarkers: gameState.searchMarkers,
          searchNotes: gameState.searchNotes,
          secretDoorMarkers: gameState.secretDoorMarkers,
        })) {
      setPendingBackToLibrary(true);
      return;
    }
    onBack();
  }

  const { pendingNoteEdit, saveNoteMarkerEdit, deleteNoteMarker, setPendingNoteEdit } = gameState;
  const { pendingMonsterAnnotation, saveMonsterAnnotation, cancelMonsterAnnotation, openMonsterAnnotation } = gameState;

  function handleEditNote(anchorKey) {
    const piece = gameState.placed[anchorKey];
    if (piece?.type === "notemarker") {
      gameState.setPendingNoteEdit({ anchorKey, note: piece.note ?? "" });
    }
  }

  function handleShowTooltip(anchorKey, x, y, content) {
    setHoverTooltip(prev => (prev && prev.anchorKey === anchorKey) ? null : { anchorKey, x, y, content });
  }
  function handleHideTooltip() {
    setHoverTooltip(null);
  }
  function handleDismissTooltip() {
    setHoverTooltip(prev => (prev ? null : prev));
  }

  return (
    <div
      onClick={handleDismissTooltip}
      style={{
        display: "flex", height: "100vh", overflow: "hidden",
        background: T.pageBg,
        fontFamily: FONT_BODY,
        color: T.text,
      }}>
      <BoardArea
        fog={gameState.fog} placed={gameState.placed} doors={gameState.doors}
        searchMarkers={gameState.searchMarkers}
        searchNotes={gameState.searchNotes}
        searchedCounts={gameState.searchedCounts}
        mode={gameState.mode} lastClick={gameState.lastClick}
        onCellClick={gameState.handleCell} onCellRotate={gameState.handleCellRotate}
        bgImage={bgImage}
        pendingRoomReveal={gameState.pendingRoomReveal}
        onConfirmReveal={gameState.confirmPendingReveal}
        onCancelReveal={gameState.cancelPendingReveal}
        onShowTooltip={handleShowTooltip} onHideTooltip={handleHideTooltip}
        onAnnotateMonster={openMonsterAnnotation} onEditNote={handleEditNote}
        onEditSearchNote={gameState.openSearchNoteEdit}
        onViewSearchNote={gameState.viewSearchNote}
        onRemoveSearchMarker={gameState.removeSearchMarker}
        secretDoorMarkers={gameState.secretDoorMarkers}
        revealedSecretDoors={gameState.revealedSecretDoors}
        onEditSecretDoorConfig={gameState.openSecretDoorEdit}
        onSearchSecretDoor={cellKey => {
          const [r, c] = cellKey.split(",").map(Number);
          gameState.handleCell(r, c);
        }}
        revealedTraps={gameState.revealedTraps}
        onTrapInteraction={gameState.openTrapInteraction}
        onConfigureTrap={gameState.openTrapConfig}
        disarmedTraps={gameState.disarmedTraps}
        springedTraps={gameState.springedTraps}
        openedChests={gameState.openedChests}
        onOpenChest={gameState.openChest}
        onConfigureChest={gameState.openChestConfig}
        pendingPlacementPopup={gameState.pendingPlacementPopup}
        placementMessage={gameState.questPlacementMessage}
        onDismissPlacementPopup={gameState.dismissPlacementPopup}
        zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut}
        pan={pan} cursor={boardAreaCursor}
        onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture} onPointerLeave={handlePointerLeave}
        boardAreaRef={boardAreaRef}
        trapInteractionPopup={gameState.pendingTrapInteraction && (() => {
          const { anchorKey, isRevealed } = gameState.pendingTrapInteraction;
          const piece = gameState.placed[anchorKey];
          const pieceDef = piece ? PIECES[piece.type] : null;
          return (
            <TrapInteractionPopup
              anchorKey={anchorKey}
              isRevealed={isRevealed}
              pieceType={piece?.type}
              pieceLabel={pieceDef?.label}
              pieceImage={pieceDef?.image}
              trapNote={piece?.trapNote}
              onRevealTrap={gameState.revealTrap}
              onDisarmTrap={gameState.disarmTrap}
              onClose={gameState.closeTrapInteraction}
            />
          );
        })()}
      />
      <Sidebar
        mode={gameState.mode} tool={gameState.tool}
        setMode={guardedSetMode} setTool={gameState.setTool}
        onReset={gameState.resetFog}
        bgImage={bgImage} setBgImage={setBgImage}
        onBack={guardedBack}
        onSave={handleSave}
        savedFlash={savedFlash}
        saveError={gameState.saveError}
        questTitle={gameState.questTitle}
        questDescription={gameState.questDescription}
        setQuestTitle={gameState.setQuestTitle}
        setQuestDescription={gameState.setQuestDescription}
        placementMessage={gameState.questPlacementMessage}
        setQuestPlacementMessage={gameState.setQuestPlacementMessage}
      />

      {/* Shared hover tooltip — fixed position, immune to overflow:hidden */}
      {hoverTooltip?.content && (
        <div style={{
          position: "fixed",
          left: hoverTooltip.x,
          top: hoverTooltip.y - 12,
          transform: "translate(-50%, -100%)",
          background: "#1a0f04",
          color: T.sidebarText,
          border: "1px solid #c4a870",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 12,
          whiteSpace: "pre-wrap",
          maxWidth: 220,
          boxShadow: "0 4px 12px #0008",
          zIndex: 200,
          pointerEvents: "none",
        }}>
          {hoverTooltip.content}
        </div>
      )}

      {/* Note marker edit dialog */}
      {pendingNoteEdit && (
        <NoteMarkerDialog
          initialNote={pendingNoteEdit.note}
          onSave={(note) => saveNoteMarkerEdit(pendingNoteEdit.anchorKey, note)}
          onDelete={() => deleteNoteMarker(pendingNoteEdit.anchorKey)}
          onCancel={() => setPendingNoteEdit(null)}
        />
      )}

      {/* Feature B: Special monster annotation dialog */}
      {pendingMonsterAnnotation && (() => {
        const piece = gameState.placed[pendingMonsterAnnotation.anchorKey];
        const pieceDef = PIECES[piece?.type];
        return (
          <SpecialMonsterDialog
            monsterLabel={pieceDef?.label}
            initialIsSpecial={piece?.isSpecial ?? false}
            initialNote={piece?.specialNote ?? ""}
            onSave={(isSpecial, note) => saveMonsterAnnotation(pendingMonsterAnnotation.anchorKey, isSpecial, note)}
            onCancel={cancelMonsterAnnotation}
          />
        );
      })()}

      {/* Search marker — edit note dialog */}
      {gameState.pendingSearchEdit && (
        <SearchNoteDialog
          regionId={gameState.pendingSearchEdit.regionId}
          initialNotes={gameState.searchNotes[gameState.pendingSearchEdit.regionId] ?? []}
          onSave={(notes) => gameState.saveSearchNote(gameState.pendingSearchEdit.regionId, notes)}
          onDelete={() => { gameState.removeSearchMarker(gameState.pendingSearchEdit.regionId); gameState.setPendingSearchEdit(null); }}
          onCancel={() => gameState.setPendingSearchEdit(null)}
        />
      )}

      {/* Search marker — play mode popup */}
      {gameState.pendingSearchView && (
        <SearchNotePopup
          notes={gameState.pendingSearchView.notes}
          count={gameState.pendingSearchView.count}
          onClose={gameState.closeSearchNote}
        />
      )}

      {/* Secret door search — edit config dialog */}
      {gameState.pendingSecretDoorEdit && (() => {
        const { cellKey } = gameState.pendingSecretDoorEdit;
        const entry = gameState.secretDoorMarkers[cellKey] ?? { linkedDoorKey: null, message: "" };
        const secretDoorOptions = Object.entries(gameState.placed)
          .filter(([, p]) => p.type === "secretdoor")
          .map(([k]) => k);
        return (
          <SecretDoorConfigDialog
            cellKey={cellKey}
            entry={entry}
            secretDoorOptions={secretDoorOptions}
            onSave={(linkedDoorKey, message) => gameState.saveSecretDoorConfig(cellKey, linkedDoorKey, message)}
            onDelete={() => gameState.deleteSecretDoorMarker(cellKey)}
            onCancel={gameState.cancelSecretDoorEdit}
          />
        );
      })()}

      {/* Secret door search — play mode result popup */}
      {gameState.pendingSecretDoorResult && (
        <SecretDoorResultPopup
          action={gameState.pendingSecretDoorResult.action}
          text={gameState.pendingSecretDoorResult.text}
          onClose={gameState.closeSecretDoorResult}
        />
      )}

      {/* Chest — play mode result popup */}
      {gameState.pendingChestResult && (
        <ChestResultPopup
          hasTrap={gameState.pendingChestResult.hasTrap}
          springMessage={gameState.pendingChestResult.springMessage}
          anchorKey={gameState.pendingChestResult.anchorKey}
          onSpringTrap={gameState.springTrap}
          onDisarmTrap={gameState.disarmTrap}
          onResolve={gameState.resolveChest}
          onClose={gameState.closeChestResult}
        />
      )}

      {/* Chest — edit mode config dialog */}
      {gameState.pendingChestConfig && (() => {
        const piece = gameState.placed[gameState.pendingChestConfig.anchorKey];
        return (
          <ChestConfigDialog
            initialHasTrap={piece?.hasTrap ?? false}
            initialTrapNote={piece?.trapNote ?? ""}
            onSave={(hasTrap, trapNote) => gameState.saveChestConfig(gameState.pendingChestConfig.anchorKey, hasTrap, trapNote)}
            onCancel={() => gameState.setPendingChestConfig(null)}
          />
        );
      })()}


      {/* Trap — edit mode config dialog */}
      {gameState.pendingTrapConfig && (() => {
        const anchorKey = gameState.pendingTrapConfig.anchorKey;
        const piece = gameState.placed[anchorKey];
        const pieceDef = piece ? PIECES[piece.type] : null;
        return (
          <TrapConfigDialog
            initialSpringMessage={piece?.springMessage ?? pieceDef?.trapRules ?? ""}
            initialRemoveAfterSpring={piece?.removeAfterSpring ?? true}
            trapTypeLabel={pieceDef?.label}
            onSave={({ springMessage, removeAfterSpring, applyToAll }) => gameState.saveTrapConfig(anchorKey, { springMessage, removeAfterSpring, applyToAll })}
            onCancel={gameState.closeTrapConfig}
          />
        );
      })()}
      {/* Warning #2 — navigating back to library with unsaved edit changes */}
      {pendingBackToLibrary && (
        <div className="hq-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 340 }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
              <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
                <h6 className="modal-title m-0" style={{ color: T.accent, fontSize: 15 }}>Unsaved Changes</h6>
              </div>
              <div className="modal-body px-3 py-3">
                <p style={{ fontSize: 13, color: T.sidebarText, margin: 0, lineHeight: 1.6 }}>
                  Unsaved changes will be lost — go back anyway?
                </p>
              </div>
              <div className="modal-footer py-2 px-3 gap-2" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
                <button onClick={() => setPendingBackToLibrary(false)} className="btn btn-hq-light" style={{ fontSize: 13 }}>
                  Stay Here
                </button>
                <button
                  onClick={() => { onBack(); setPendingBackToLibrary(false); }}
                  className="btn btn-hq-light active"
                  style={{ fontSize: 13 }}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning #1 — switching from play to edit with dirty session */}
      {pendingModeSwitch && (
        <div
          className="hq-modal-backdrop"
          onMouseDown={() => { gameState.setMode("edit"); setPendingModeSwitch(false); }}
        >
          <div className="modal-dialog modal-dialog-centered m-0" style={{ width: 340 }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-content" style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}` }}>
              <div className="modal-header py-2 px-3" style={{ borderBottom: `1px solid ${T.sidebarBorder}` }}>
                <h6 className="modal-title m-0" style={{ color: T.accentGold, fontSize: 15 }}>Session State Carries Over</h6>
              </div>
              <div className="modal-body px-3 py-3">
                <p style={{ fontSize: 13, color: T.sidebarText, margin: 0, lineHeight: 1.6 }}>
                  Your current session state — opened chests, revealed traps, search counts, and fog —
                  will NOT be reset when switching to Edit mode.
                </p>
              </div>
              <div className="modal-footer py-2 px-3" style={{ borderTop: `1px solid ${T.sidebarBorder}` }}>
                <button
                  onClick={() => { gameState.setMode("edit"); setPendingModeSwitch(false); }}
                  className="btn btn-hq-light active"
                  style={{ fontSize: 13 }}
                >
                  Continue to Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ═══════════════════════════════════════════════
//  CALIBRATE PAGE  (dev / admin tool)
// ═══════════════════════════════════════════════
const CALIBRATE_MAPS = [
  { id: "board",  label: "Board 1", src: "/board.png"  },
  { id: "board2", label: "Board 2", src: "/board2.png" },
  { id: "board3", label: "Board 3", src: "/board3.png" },
];

function CalibratePage({ onBack }) {
  return (
    <div style={{
      background: T.pageBg, minHeight: "100vh",
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif",
      color: T.text,
    }}>
      <div style={{
        padding: "10px 20px", background: T.sidebarBg,
        borderBottom: `1px solid ${T.sidebarBorder}`,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <button onClick={onBack} style={{
          padding: "5px 12px", background: T.btnBg, color: T.btnText,
          border: `1px solid ${T.btnBorder}`, cursor: "pointer",
          fontFamily: "inherit", fontSize: 11, letterSpacing: 1,
        }}>
          ← Library
        </button>
        <span style={{ fontSize: 11, color: T.textMuted, letterSpacing: 1 }}>
          Map Calibrator — Click anchors on each board, then press Export to save calibration to browser storage
        </span>
      </div>
      <MapCalibrator
        maps={CALIBRATE_MAPS}
        onExport={saveCalibration}
        initialCalibrations={loadCalibration()}
        pieceCategories={PIECE_CATEGORIES}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
//  ROOT COMPONENT
// ═══════════════════════════════════════════════
export default function HeroQuestFog() {
  const [screen, setScreen]         = useState("library");
  const [gameConfig, setGameConfig] = useState(null); // { quest, mode }

  function openQuest(quest, mode) {
    setGameConfig({ quest, mode });
    setScreen("game");
  }

  if (screen === "calibrate") {
    return <CalibratePage onBack={() => setScreen("library")} />;
  }

  if (screen === "library") {
    return (
      <QuestLibrary
        onPlay={q => openQuest(q, "play")}
        onEdit={q => openQuest(q, "edit")}
        onCalibrate={() => setScreen("calibrate")}
      />
    );
  }

  return (
    <GameScreen
      key={gameConfig.quest.id}
      quest={gameConfig.quest}
      initialMode={gameConfig.mode}
      onBack={() => setScreen("library")}
      onQuestSaved={updated => setGameConfig(prev => ({ ...prev, quest: updated }))}
    />
  );
}
