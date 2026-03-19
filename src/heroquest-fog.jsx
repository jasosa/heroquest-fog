import { useState } from "react";
import { T } from "./theme.js";
import { persistQuest, loadCalibration, saveCalibration } from "./questStorage.js";
import QuestLibrary from "./QuestLibrary.jsx";
import MapCalibrator from "./components/MapCalibrator.jsx";
import { PIECE_CATEGORIES } from "./pieces.js";
import { useGameState, hasHeroStart } from "./features/game/useGameState.js";
import { BoardGrid } from "./features/board/BoardGrid.jsx";
import { Sidebar } from "./features/sidebar/Sidebar.jsx";

// ═══════════════════════════════════════════════
//  BOARD AREA (left panel)
// ═══════════════════════════════════════════════
function BoardArea({ fog, placed, doors, mode, lastClick, onCellClick, onCellRotate, bgImage,
  pendingRoomReveal, onConfirmReveal, onCancelReveal }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 14, padding: 20, overflowY: "auto",
    }}>
      <h1 style={{
        margin: 0, fontSize: 20, letterSpacing: 8,
        color: T.title, textTransform: "uppercase",
        textShadow: "0 2px 4px #c4a87044",
        fontWeight: "normal",
      }}>
        HeroQuest — Fog of War
      </h1>

      <div style={{
        fontSize: 10, letterSpacing: 3, textTransform: "uppercase",
        color: mode === "edit" ? T.accentGold : "#2a6a2a",
        border: `1px solid ${mode === "edit" ? T.accentGold : "#2a6a2a"}`,
        padding: "3px 12px", marginTop: -6,
      }}>
        {mode === "edit" ? "✎ Edit Mode — Click to place · Right-click to rotate" : "⚔ Play Mode — Click to reveal"}
      </div>

      <BoardGrid
        fog={fog} placed={placed} doors={doors} mode={mode}
        lastClick={lastClick} onCellClick={onCellClick} onCellRotate={onCellRotate}
        bgImage={bgImage}
        pendingRoomReveal={pendingRoomReveal}
        onConfirmReveal={onConfirmReveal}
        onCancelReveal={onCancelReveal}
      />

      <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: 1 }}>
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
    initialMode: initialMode ?? "play",
    initialTitle: quest?.title ?? "Untitled Quest",
    initialDescription: quest?.description ?? "",
  });
  const [bgImage, setBgImage]       = useState("board2");
  const [savedFlash, setSavedFlash] = useState(false);

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
      placed: gameState.placed,
      doors: gameState.doors,
    };
    persistQuest(updated);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    onQuestSaved?.(updated);
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
        mode={gameState.mode} lastClick={gameState.lastClick}
        onCellClick={gameState.handleCell} onCellRotate={gameState.handleCellRotate}
        bgImage={bgImage}
        pendingRoomReveal={gameState.pendingRoomReveal}
        onConfirmReveal={gameState.confirmPendingReveal}
        onCancelReveal={gameState.cancelPendingReveal}
      />
      <Sidebar
        mode={gameState.mode} tool={gameState.tool}
        setMode={gameState.setMode} setTool={gameState.setTool}
        onReset={gameState.resetFog}
        bgImage={bgImage} setBgImage={setBgImage}
        onBack={onBack}
        onSave={handleSave}
        savedFlash={savedFlash}
        saveError={gameState.saveError}
        questTitle={gameState.questTitle}
        questDescription={gameState.questDescription}
        setQuestTitle={gameState.setQuestTitle}
        setQuestDescription={gameState.setQuestDescription}
      />
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
