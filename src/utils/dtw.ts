/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NormalizedPoint } from './normalization';

export interface DTWResult {
  distance: number;
  normalizedDistance: number;
  path: [number, number][];
}

/**
 * Computes Dynamic Time Warping (DTW) distance between two normalized price trajectories.
 * Applies Sakoe-Chiba window constraint (windowRatio: 0.2) to prevent pathological warping.
 */
export function computeDTW(
  seriesA: NormalizedPoint[],
  seriesB: NormalizedPoint[],
  windowRatio: number = 0.25
): DTWResult {
  const n = seriesA.length;
  const m = seriesB.length;
  if (n === 0 || m === 0) {
    return { distance: 1, normalizedDistance: 1, path: [] };
  }

  const w = Math.max(Math.floor(windowRatio * Math.max(n, m)), 2);

  // Initialize cost matrix with Infinity
  const dtw: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(Infinity)
  );

  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    const jStart = Math.max(1, i - w);
    const jEnd = Math.min(m, i + w);

    for (let j = jStart; j <= jEnd; j++) {
      // Euclidean difference in price value
      const cost = Math.abs(seriesA[i - 1].p - seriesB[j - 1].p);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j], // Insertion
        dtw[i][j - 1], // Deletion
        dtw[i - 1][j - 1] // Match
      );
    }
  }

  const totalDistance = dtw[n][m] === Infinity ? 999 : dtw[n][m];
  const maxPossibleCost = Math.max(n, m) * 1.0;
  const normalizedDistance = Math.min(1, Math.max(0, totalDistance / maxPossibleCost));

  // Backtrack optimal warping path
  const path: [number, number][] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    path.unshift([i - 1, j - 1]);
    const minVal = Math.min(dtw[i - 1][j - 1], dtw[i - 1][j], dtw[i][j - 1]);
    if (minVal === dtw[i - 1][j - 1]) {
      i--;
      j--;
    } else if (minVal === dtw[i - 1][j]) {
      i--;
    } else {
      j--;
    }
  }

  return {
    distance: Number(totalDistance.toFixed(4)),
    normalizedDistance: Number(normalizedDistance.toFixed(4)),
    path,
  };
}
