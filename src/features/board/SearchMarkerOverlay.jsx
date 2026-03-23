/**
 * Renders one magnifying-glass icon per room region.
 * Edit mode: always visible (dimmed) with a ✎ button to add a note.
 * Play mode: visible only when the marker's cell is revealed and the region
 *            has not yet been searched; clicking the icon opens the note popup.
 */
const SEARCH_TOOLTIP = "Search for Treasure";

export function SearchMarkerOverlay({
  searchMarkers, searchNotes, searchedCounts,
  fog, isEditMode, getTokenPos,
  onEditNote, onViewNote, onRemoveMarker,
  onShowTooltip, onHideTooltip,
}) {
  return Object.entries(searchMarkers).map(([region, [r, c]]) => {
    if (!isEditMode) {
      // Hide if not yet revealed or fully exhausted (4 searches done).
      if (!fog.has(`${r},${c}`) || (searchedCounts?.[region] ?? 0) >= 4) return null;
    }

    const [px, py] = getTokenPos(c, r);
    const hasNote = !!(searchNotes?.[region]);

    return (
      <div
        key={region}
        style={{
          position: "absolute",
          left: px,
          top: py,
          transform: "translate(-50%, -50%)",
          zIndex: 7,
          pointerEvents: "none",
        }}
      >
        {/* Treasure image */}
        <img
          src="/tiles/search.png"
          alt=""
          style={{
            width: 28, height: 28,
            display: "block",
            opacity: isEditMode ? 0.65 : 1,
            pointerEvents: isEditMode ? "none" : "auto",
            cursor: isEditMode ? "default" : "pointer",
          }}
          onMouseEnter={isEditMode ? undefined : (e) => onShowTooltip?.(e.clientX, e.clientY, SEARCH_TOOLTIP)}
          onMouseLeave={isEditMode ? undefined : () => onHideTooltip?.()}
          onClick={isEditMode ? undefined : () => onViewNote(region, searchNotes?.[region] ?? "")}
        />

        {/* Edit note button — only in edit mode */}
        {isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditNote(region); }}
            title="Edit search note"
            style={{
              position: "absolute",
              top: -8, right: -8,
              width: 16, height: 16,
              padding: 0,
              background: hasNote ? "#c4a870" : "#444",
              color: "#fff",
              border: "none", borderRadius: "50%",
              fontSize: 9, lineHeight: "16px", textAlign: "center",
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >✎</button>
        )}

      </div>
    );
  });
}
