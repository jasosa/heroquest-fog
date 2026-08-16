// Pure arithmetic — no DOM, no React.
// Board-pan math: the scaled+translated board is positioned via
// `translate(x,y) scale(zoom)`, so the screen position of board-local point p
// is `zoom*p + (x,y)`. These helpers compute/clamp that (x,y) offset per axis.

export const PAN_DRAG_THRESHOLD_PX = 6;

// Offset that centers a boardSize*zoom-sized axis within containerSize.
// Positive when the board is smaller than the container (centers it inward);
// negative when the board overflows (pulls it back by half the overflow).
export function centeredAxisOffset({ containerSize, boardSize, zoom }) {
  return (containerSize - boardSize * zoom) / 2;
}

// Clamps a desired offset for one axis. When the scaled board fits entirely
// within the container, panning has no effect — always return the centered
// offset regardless of `desired`. Otherwise clamp so the board never reveals
// empty space past its own edges: offset in [containerSize - boardSize*zoom, 0].
export function clampAxisOffset({ desired, containerSize, boardSize, zoom }) {
  const scaledBoardSize = boardSize * zoom;
  if (scaledBoardSize <= containerSize) {
    return centeredAxisOffset({ containerSize, boardSize, zoom });
  }
  const min = containerSize - scaledBoardSize;
  const max = 0;
  return Math.min(max, Math.max(min, desired));
}

export function clampPanOffset({ offset, containerWidth, containerHeight, boardWidth, boardHeight, zoom }) {
  return {
    x: clampAxisOffset({ desired: offset.x, containerSize: containerWidth, boardSize: boardWidth, zoom }),
    y: clampAxisOffset({ desired: offset.y, containerSize: containerHeight, boardSize: boardHeight, zoom }),
  };
}

// Initial pan offset on mount: centered on both axes, then clamped for
// safety (a centered offset is always within clamp bounds, so this is a
// no-op in practice, but keeps the invariant explicit).
export function computeInitialPanOffset({ containerWidth, containerHeight, boardWidth, boardHeight, zoom }) {
  const centered = {
    x: centeredAxisOffset({ containerSize: containerWidth, boardSize: boardWidth, zoom }),
    y: centeredAxisOffset({ containerSize: containerHeight, boardSize: boardHeight, zoom }),
  };
  return clampPanOffset({ offset: centered, containerWidth, containerHeight, boardWidth, boardHeight, zoom });
}

// Recomputes the pan offset when zoom changes so the board-local point that
// was at the container's center stays at the container's center.
export function computeRecenterOnZoomOffset({ oldOffset, oldZoom, newZoom, containerWidth, containerHeight, boardWidth, boardHeight }) {
  function recenterAxis({ containerSize, boardSize, oldOffsetAxis }) {
    const boardCoordAtCenter = (containerSize / 2 - oldOffsetAxis) / oldZoom;
    const desired = containerSize / 2 - newZoom * boardCoordAtCenter;
    return clampAxisOffset({ desired, containerSize, boardSize, zoom: newZoom });
  }
  return {
    x: recenterAxis({ containerSize: containerWidth, boardSize: boardWidth, oldOffsetAxis: oldOffset.x }),
    y: recenterAxis({ containerSize: containerHeight, boardSize: boardHeight, oldOffsetAxis: oldOffset.y }),
  };
}

// True when the scaled board overflows the container on either axis (i.e.
// panning would have a visible effect).
export function isPannable({ containerWidth, containerHeight, boardWidth, boardHeight, zoom }) {
  return boardWidth * zoom > containerWidth || boardHeight * zoom > containerHeight;
}

export function exceedsPanThreshold({ dx, dy, threshold = PAN_DRAG_THRESHOLD_PX }) {
  return Math.hypot(dx, dy) >= threshold;
}
