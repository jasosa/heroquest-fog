import { useState, useRef } from "react";
import { T } from "./theme.js";
import { COLS, ROWS, CELL } from "./map.js";
import { persistQuest, loadCalibration, saveCalibration } from "./questStorage.js";
import { isSessionDirty, hasUnsavedChanges, stableStringify } from "./navigationGuards.js";
import QuestLibrary from "./QuestLibrary.jsx";
import MapCalibrator from "./components/MapCalibrator.jsx";
import { PIECE_CATEGORIES, PIECES } from "./pieces.js";
import { useGameState, hasHeroStart } from "./features/game/useGameState.js";
import { BoardGrid } from "./features/board/BoardGrid.jsx";
import { Sidebar } from "./features/sidebar/Sidebar.jsx";
import { NoteMarkerDialog } from "./features/board/NoteMarkerDialog.jsx";
import { SpecialMonsterDialog } from "./features/board/SpecialMonsterDialog.jsx";
import { SearchNoteDialog } from "./features/board/SearchNoteDialog.jsx";
import { SearchNotePopup } from "./features/board/SearchNotePopup.jsx";
import { SecretDoorConfigDialog } from "./features/board/SecretDoorConfigDialog.jsx";
import { SecretDoorResultPopup } from "./features/board/SecretDoorResultPopup.jsx";
import { HeroPlacementPopup } from "./features/board/HeroPlacementPopup.jsx";
import { ChestResultPopup } from "./features/board/ChestResultPopup.jsx";
import { ChestConfigDialog } from "./features/board/ChestConfigDialog.jsx";
import { TrapInteractionPopup } from "./features/board/TrapInteractionPopup.jsx";
import { TrapConfigDialog } from "./features/board/TrapConfigDialog.jsx";

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
  openedChests, onOpenChest, onConfigureChest,
  zoom, onZoomIn, onZoomOut }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", gap: 10, padding: "16px 20px",
      overflow: "hidden", minHeight: 0,
    }}>
      <h1 style={{
        margin: 0, fontSize: 20, letterSpacing: 8, flexShrink: 0,
        color: T.title, textTransform: "uppercase",
        textShadow: "0 2px 4px #c4a87044",
        fontWeight: "normal",
      }}>
        HeroQuest — Fog of War
      </h1>

      <div style={{
        fontSize: 10, letterSpacing: 3, textTransform: "uppercase", flexShrink: 0,
        color: mode === "edit" ? T.accentGold : "#2a6a2a",
        border: `1px solid ${mode === "edit" ? T.accentGold : "#2a6a2a"}`,
        padding: "3px 12px",
      }}>
        {mode === "edit" ? "✎ Edit Mode — Click to place · Right-click to rotate" : "⚔ Play Mode — Click to reveal"}
      </div>

      {/* Zoom controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button onClick={onZoomOut} disabled={zoom <= ZOOM_MIN} style={zoomBtnStyle} title="Zoom out">−</button>
        <span style={{ fontSize: 11, color: T.textMuted, minWidth: 38, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={onZoomIn} disabled={zoom >= ZOOM_MAX} style={zoomBtnStyle} title="Zoom in">+</button>
      </div>

      {/* Scrollable board area */}
      <div style={{ overflow: "auto", flex: 1, minHeight: 0, width: "100%" }}>
        {/* Sizing placeholder: gives the scroll container its scrollable dimensions */}
        <div style={{
          width: BOARD_W * zoom,
          height: BOARD_H * zoom,
          position: "relative",
          margin: "0 auto",      // centre horizontally when smaller than container
        }}>
          {/* Hero placement popup — shown once when entering play mode */}
          {pendingPlacementPopup && (
            <HeroPlacementPopup
              message={placementMessage}
              onClose={onDismissPlacementPopup}
            />
          )}

          {/* Board scaled from top-left of placeholder */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            transformOrigin: "top left",
            transform: `scale(${zoom})`,
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
              openedChests={openedChests}
              onOpenChest={onOpenChest}
              onConfigureChest={onConfigureChest}
            />
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1, flexShrink: 0 }}>
        HEROQUEST BOARD · 22 ROOMS · 26×19
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  GAME SCREEN
// ═══════════════════════════════════════════════
function GameScreen({ quest, initialMode, onBack, onQuestSaved }) {
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
  const [hoverTooltip, setHoverTooltip] = useState(null); // {x,y,content}|null
  const [zoom, setZoom] = useState(1);
  const zoomIn  = () => setZoom(z => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100));
  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100));

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
                       gameState.searchedCounts)) {
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

  function handleShowTooltip(x, y, content) {
    setHoverTooltip({ x, y, content });
  }
  function handleHideTooltip() {
    setHoverTooltip(null);
  }

  return (
    <div style={{
      display: "flex", height: "100vh", overflow: "hidden",
      background: T.pageBg,
      fontFamily: "'Palatino Linotype', 'Palatino', 'Book Antiqua', Georgia, serif",
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
        openedChests={gameState.openedChests}
        onOpenChest={gameState.openChest}
        onConfigureChest={gameState.openChestConfig}
        pendingPlacementPopup={gameState.pendingPlacementPopup}
        placementMessage={gameState.questPlacementMessage}
        onDismissPlacementPopup={gameState.dismissPlacementPopup}
        zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut}
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
          color: "#f0e6d0",
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
            onCancel={() => gameState.saveSecretDoorConfig(cellKey, entry.linkedDoorKey, entry.message)}
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
          message={gameState.pendingChestResult.message}
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

      {/* Trap — play mode interaction popup */}
      {gameState.pendingTrapInteraction && (() => {
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

      {/* Trap — edit mode config dialog */}
      {gameState.pendingTrapConfig && (
        <TrapConfigDialog
          initialTrapNote={gameState.placed[gameState.pendingTrapConfig.anchorKey]?.trapNote ?? ""}
          onSave={(trapNote) => gameState.saveTrapConfig(gameState.pendingTrapConfig.anchorKey, trapNote)}
          onCancel={gameState.closeTrapConfig}
        />
      )}

      {/* Warning #2 — navigating back to library with unsaved edit changes */}
      {pendingBackToLibrary && (
        <div
          style={{ position: "fixed", inset: 0, background: "#0008", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
        >
          <div
            style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}`, borderRadius: 8, padding: 20, minWidth: 260, maxWidth: 340, boxShadow: "0 8px 32px #0006" }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: "bold", fontSize: 15, color: T.accent, marginBottom: 10 }}>
              Unsaved Changes
            </div>
            <p style={{ fontSize: 13, color: T.text, margin: "0 0 16px", lineHeight: 1.6 }}>
              Unsaved changes will be lost — go back anyway?
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setPendingBackToLibrary(false)}
                style={{ background: T.btnBg, color: T.btnText, border: `1px solid ${T.btnBorder}`, borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}
              >
                Stay Here
              </button>
              <button
                onClick={() => { onBack(); setPendingBackToLibrary(false); }}
                style={{ background: T.btnActiveBg, color: T.btnActiveText, border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning #1 — switching from play to edit with dirty session */}
      {pendingModeSwitch && (
        <div
          style={{ position: "fixed", inset: 0, background: "#0008", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}
          onMouseDown={() => { gameState.setMode("edit"); setPendingModeSwitch(false); }}
        >
          <div
            style={{ background: T.sidebarBg, border: `2px solid ${T.sidebarBorder}`, borderRadius: 8, padding: 20, minWidth: 260, maxWidth: 340, boxShadow: "0 8px 32px #0006" }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: "bold", fontSize: 15, color: T.accentGold, marginBottom: 10 }}>
              Session State Carries Over
            </div>
            <p style={{ fontSize: 13, color: T.text, margin: "0 0 16px", lineHeight: 1.6 }}>
              Your current session state — opened chests, revealed traps, search counts, and fog —
              will NOT be reset when switching to Edit mode.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => { gameState.setMode("edit"); setPendingModeSwitch(false); }}
                style={{ background: T.btnActiveBg, color: T.btnActiveText, border: `1px solid ${T.btnActiveBdr}`, borderRadius: 4, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: "bold" }}
              >
                Continue to Edit
              </button>
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
