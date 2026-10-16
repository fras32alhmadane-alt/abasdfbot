/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle } from '../types/fractal';

export interface NormalizedPoint {
  t: number; // 0 to 1
  p: number; // 0 to 1 (or directional relative scale)
}

/**
 * Normalizes a slice of candles in time and price.
 * Supports both 'start_end' and 'min_max' normalization with safe handling for bearish trends.
 */
export function normalizeCandleSlice(
  candles: Candle[],
  method: 'min_max' | 'start_end' = 'min_max',
  resamplePoints: number = 50
): NormalizedPoint[] {
  if (candles.length < 2) return [];

  const n = candles.length;
  const startP = candles[0].close;
  const endP = candles[n - 1].close;

  let minP = Infinity;
  let maxP = -Infinity;
  for (const c of candles) {
    if (c.low < minP) minP = c.low;
    if (c.high > maxP) maxP = c.high;
  }

  const priceRange = maxP - minP;
  const safeRange = priceRange === 0 ? 1 : priceRange;

  // Extract raw points (close prices)
  const rawPoints: { t: number; p: number }[] = candles.map((c, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    let p = 0;

    if (method === 'min_max') {
      p = (c.close - minP) / safeRange;
    } else {
      // Start-End Relative
      const delta = endP - startP;
      p = delta === 0 ? 0.5 : (c.close - startP) / delta;
    }

    return { t, p };
  });

  // Resample linearly to standard sample count (e.g. 50 points) for invariant DTW comparison
  return resampleNormalizedCurve(rawPoints, resamplePoints);
}

/**
 * Resamples a sequence of normalized points to exactly N evenly-spaced points along t in [0, 1].
 */
export function resampleNormalizedCurve(
  points: { t: number; p: number }[],
  sampleCount: number = 50
): NormalizedPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return Array.from({ length: sampleCount }, (_, i) => ({
      t: i / (sampleCount - 1),
      p: points[0].p,
    }));
  }

  const result: NormalizedPoint[] = [];

  for (let k = 0; k < sampleCount; k++) {
    const targetT = k / (sampleCount - 1);

    // Find bounding segment
    let left = 0;
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i].t <= targetT && points[i + 1].t >= targetT) {
        left = i;
        break;
      }
    }

    const p0 = points[left];
    const p1 = points[Math.min(left + 1, points.length - 1)];
    const segmentDt = p1.t - p0.t;

    let pVal = p0.p;
    if (segmentDt > 0.000001) {
      const alpha = (targetT - p0.t) / segmentDt;
      pVal = p0.p + alpha * (p1.p - p0.p);
    }

    result.push({
      t: Number(targetT.toFixed(4)),
      p: Number(pVal.toFixed(4)),
    });
  }

  return result;
}
