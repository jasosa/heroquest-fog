/**
 * Renders one key icon per searchsecret marker entry.
 * Edit mode: always visible (dimmed) with a ✎ config button.
 * Play mode: visible only when the marker's cell is revealed; clicking triggers search.
 */
const SEARCH_SECRET_TOOLTIP = "Search for Secret Door";

export function SecretDoorMarkerOverlay({
  secretDoorMarkers, placed, fog, isEditMode, getTokenPos,
  onEditConfig, onSearch,
  onShowTooltip, onHideTooltip,
}) {
  return Object.entries(secretDoorMarkers).map(([cellKey, entry]) => {
    const [r, c] = cellKey.split(",").map(Number);

    if (!isEditMode && !fog.has(cellKey)) return null;

    const [px, py] = getTokenPos(c, r);
    const isLinked = entry.linkedDoorKey && placed[entry.linkedDoorKey];

    return (
      <div
        key={cellKey}
        style={{
          position: "absolute",
          left: px,
          top: py,
          transform: "translate(-50%, -50%)",
          zIndex: 7,
          pointerEvents: "none",
        }}
      >
        <img
          src="/tiles/search-secret-door.png"
          alt="Search for Secret Door"
          style={{
            width: 28, height: 28,
            display: "block",
            opacity: isEditMode ? 0.65 : 1,
            pointerEvents: isEditMode ? "none" : "auto",
            cursor: isEditMode ? "default" : "pointer",
            filter: isLinked ? "drop-shadow(0 0 4px #c4a870)" : "none",
          }}
          onMouseEnter={isEditMode ? undefined : (e) => onShowTooltip?.(e.clientX, e.clientY, SEARCH_SECRET_TOOLTIP)}
          onMouseLeave={isEditMode ? undefined : () => onHideTooltip?.()}
          onClick={isEditMode ? undefined : () => onSearch(cellKey)}
        />

        {isEditMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onEditConfig(cellKey); }}
            title="Configure secret door search"
            style={{
              position: "absolute",
              top: -8, right: -8,
              width: 16, height: 16,
              padding: 0,
              background: isLinked ? "#c4a870" : "#444",
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
