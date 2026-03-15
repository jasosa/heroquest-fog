const C = "C";

/**
 * Returns a computeReveal function bound to a specific board.
 * This factory pattern lets tests inject a small board without touching
 * the real 26×19 HeroQuest layout.
 */
export function makeComputeReveal(board, rows, cols) {
  return function computeReveal(r, c, placed) {
    const region = board[r]?.[c];
    if (!region) return new Set();

    // Expand multi-cell pieces: a blocking piece blocks every cell it covers,
    // not just its anchor. coveredCells is stored at placement time.
    const blockers = new Set();
    for (const [anchorKey, v] of Object.entries(placed)) {
      if (!v.blocks) continue;
      for (const cellKey of (v.coveredCells ?? [anchorKey])) blockers.add(cellKey);
    }

    if (region !== C) {
      // ROOM → flood fill within same region, respecting blockers
      const vis = new Set();
      const q = [[r, c]];
      while (q.length) {
        const [cr, cc] = q.shift();
        if (cr < 0 || cr >= rows || cc < 0 || cc >= cols) continue;
        const k = `${cr},${cc}`;
        if (vis.has(k)) continue;
        if (board[cr][cc] !== region) continue;
        if (blockers.has(k)) continue;
        vis.add(k);
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]])
          q.push([cr + dr, cc + dc]);
      }
      return vis;
    } else {
      // CORRIDOR → for each cardinal direction, collect all parallel starting cells
      // (the clicked cell + adjacent corridor cells that form a wide corridor), then
      // cast an independent ray from each. This means each lane of a wide corridor
      // is traced separately, so a blocker in one lane never stops the other lane.
      const vis = new Set([`${r},${c}`]);
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        // Starting positions: the hero cell plus any adjacent parallel-corridor cells.
        // A neighbour qualifies only if BOTH it AND the hero cell extend in the ray
        // direction — this ensures we only widen the ray for a true parallel-lane
        // corridor (cols 12-13), not for a T-junction where a perpendicular corridor
        // happens to continue in the same direction as the ray.
        const heroExtendsInRayDir =
          board[r + dr]?.[c + dc] === C || board[r - dr]?.[c - dc] === C;
        const starts = [[r, c]];
        for (const [sdr, sdc] of [[dc, dr], [-dc, -dr]]) {
          const [pr, pc] = [r + sdr, c + sdc];
          if (pr < 0 || pr >= rows || pc < 0 || pc >= cols) continue;
          if (board[pr][pc] !== C) continue;
          const neighborExtendsInRayDir =
            board[pr + dr]?.[pc + dc] === C || board[pr - dr]?.[pc - dc] === C;
          if (heroExtendsInRayDir && neighborExtendsInRayDir) {
            vis.add(`${pr},${pc}`);
            starts.push([pr, pc]);
          }
        }
        // Cast an independent ray from each starting position.
        for (const [sr, sc] of starts) {
          let [cr, cc] = [sr + dr, sc + dc];
          while (cr >= 0 && cr < rows && cc >= 0 && cc < cols) {
            if (board[cr][cc] !== C) break;
            const k = `${cr},${cc}`;
            if (blockers.has(k)) { vis.add(k); break; }
            vis.add(k);
            cr += dr; cc += dc;
          }
        }
      }
      return vis;
    }
  };
}
