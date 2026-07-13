// ---------------------------------------------------------------------------
// Calibration transform math
// ---------------------------------------------------------------------------
// Pure functions that map logical grid coordinates (col, row) to board-image
// pixels, using anchor pairs. Extracted from MapCalibrator.jsx so the math can
// live outside the component (and be unit-tested independently of the DOM).

/**
 * Given N anchor pairs ({ pixel: [x,y], logical: [col,row] }),
 * compute a 3x3 homography matrix (perspective transform) when N>=4,
 * or an affine matrix when N==3.
 * Returns a function: (col, row) => [px, py]
 */
export function buildTransform(anchors) {
  if (anchors.length < 3) return null;

  // Use least-squares affine for 3 points, homography for 4+
  if (anchors.length === 3) {
    return buildAffine(anchors);
  }
  return buildHomography(anchors);
}

function buildAffine(anchors) {
  // Solve: [px]   [a b c] [col]
  //        [py] = [d e f] [row]
  //                       [ 1 ]
  // Using 3 point pairs exactly.
  const src = anchors.map((a) => a.logical); // [col, row]
  const dst = anchors.map((a) => a.pixel);   // [px, py]

  // Build matrix A (3x3) and vectors bx, by
  const A = src.map(([c, r]) => [c, r, 1]);
  const bx = dst.map(([px]) => px);
  const by = dst.map(([, py]) => py);

  const coefX = solveLinear3(A, bx);
  const coefY = solveLinear3(A, by);

  return (col, row) => {
    const px = coefX[0] * col + coefX[1] * row + coefX[2];
    const py = coefY[0] * col + coefY[1] * row + coefY[2];
    return [px, py];
  };
}

function solveLinear3(A, b) {
  // Cramer's rule for 3x3
  const det = (m) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const d = det(A);
  const replace = (col) =>
    A.map((row, i) => row.map((v, j) => (j === col ? b[i] : v)));

  return [det(replace(0)) / d, det(replace(1)) / d, det(replace(2)) / d];
}

function buildHomography(anchors) {
  // Direct Linear Transform (DLT) for homography H (3x3)
  // Maps logical [col, row] -> pixel [px, py]
  // We use least-squares via normal equations for overdetermined systems.

  const rows = [];
  for (const { logical: [x, y], pixel: [u, v] } of anchors) {
    rows.push([-x, -y, -1, 0, 0, 0, u * x, u * y, u]);
    rows.push([0, 0, 0, -x, -y, -1, v * x, v * y, v]);
  }

  // Solve using SVD approximation via power iteration (simple JS implementation)
  // For robustness we use least squares: (A^T A) h = 0 with |h|=1
  // Fallback to affine if homography fails
  try {
    const h = solveDLT(rows);
    return (col, row) => {
      const w = h[6] * col + h[7] * row + h[8];
      const px = (h[0] * col + h[1] * row + h[2]) / w;
      const py = (h[3] * col + h[4] * row + h[5]) / w;
      return [px, py];
    };
  } catch {
    // Fallback to affine with first 3 anchors
    return buildAffine(anchors.slice(0, 3));
  }
}

function solveDLT(A) {
  // Compute A^T * A
  const n = A[0].length; // 9
  const ATA = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      A.reduce((s, row) => s + row[i] * row[j], 0)
    )
  );

  // Power iteration to find eigenvector of smallest eigenvalue
  // (equivalent to null space of A up to sign)
  // We use inverse power iteration with a shift
  return smallestEigenvector(ATA, n);
}

function smallestEigenvector(M, n) {
  // Jacobi eigenvalue algorithm (simplified, good enough for 9x9)
  // Returns eigenvector corresponding to smallest eigenvalue
  let V = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
  let A = M.map((r) => [...r]);

  for (let iter = 0; iter < 100; iter++) {
    let maxVal = 0, p = 0, q = 1;
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        if (Math.abs(A[i][j]) > maxVal) { maxVal = Math.abs(A[i][j]); p = i; q = j; }
    if (maxVal < 1e-10) break;

    const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
    const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;

    const newA = A.map((r) => [...r]);
    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        newA[i][p] = c * A[i][p] - s * A[i][q];
        newA[p][i] = newA[i][p];
        newA[i][q] = s * A[i][p] + c * A[i][q];
        newA[q][i] = newA[i][q];
      }
    }
    newA[p][p] = c * c * A[p][p] - 2 * s * c * A[p][q] + s * s * A[q][q];
    newA[q][q] = s * s * A[p][p] + 2 * s * c * A[p][q] + c * c * A[q][q];
    newA[p][q] = 0; newA[q][p] = 0;

    for (let i = 0; i < n; i++) {
      const vi = c * V[i][p] - s * V[i][q];
      const vj = s * V[i][p] + c * V[i][q];
      V[i][p] = vi; V[i][q] = vj;
    }
    A = newA;
  }

  // Find index of smallest eigenvalue
  let minIdx = 0;
  for (let i = 1; i < n; i++) if (A[i][i] < A[minIdx][minIdx]) minIdx = i;

  return V.map((row) => row[minIdx]);
}

/**
 * Given a calibration object (from the exported JSON), returns a transform
 * function for a specific map: (col, row) => [pixelX, pixelY]
 *
 * Note: despite the "use" name this contains no React hooks — it is a pure
 * function safe to call anywhere.
 */
export function useMapTransform(calibrationData, mapId) {
  const anchors = calibrationData?.[mapId]?.anchors ?? [];
  const transformFn = anchors.length >= 3 ? buildTransform(anchors) : null;
  return transformFn ?? (() => [0, 0]);
}
