/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistoricalReference, ProjectedPoint, TargetZone, Wave } from '../types/fractal';

export interface ProjectionOutput {
  targetZones: TargetZone[];
  invalidationLevel: number;
  confirmationLevel: number;
  projectedPath: ProjectedPoint[];
}

/**
 * Projects subsequent probable paths based on historical reference post-completion behavior.
 */
export function generateProjections(
  waves: Wave[],
  currentPrice: number,
  lastBarTime: number,
  timeframeSeconds: number,
  reference: HistoricalReference,
  direction: 'bullish' | 'bearish',
  atr: number
): ProjectionOutput {
  if (waves.length === 0) {
    return {
      targetZones: [],
      invalidationLevel: currentPrice * 0.95,
      confirmationLevel: currentPrice * 1.02,
      projectedPath: [],
    };
  }

  // Find pattern bounds
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (const w of waves) {
    minPrice = Math.min(minPrice, w.startPrice, w.endPrice);
    maxPrice = Math.max(maxPrice, w.startPrice, w.endPrice);
  }
  const height = maxPrice - minPrice;
  const safeHeight = height > 0 ? height : atr * 3;

  let invalidationLevel: number;
  let confirmationLevel: number;
  let target1: number;
  let target2: number;

  if (direction === 'bullish') {
    // Invalidation is below the lowest trough minus half ATR
    invalidationLevel = minPrice - atr * 0.5;
    // Confirmation is breaking above pattern max peak
    confirmationLevel = maxPrice + atr * 0.2;
    // Targets extrapolated from harmonic expansion (Fibonacci 1.272 and 1.618 extensions)
    target1 = maxPrice + safeHeight * 0.618;
    target2 = maxPrice + safeHeight * 1.272;
  } else {
    // Bearish: Invalidation is above highest peak plus half ATR
    invalidationLevel = maxPrice + atr * 0.5;
    // Confirmation is breaking below pattern min trough
    confirmationLevel = minPrice - atr * 0.2;
    // Bearish Targets
    target1 = minPrice - safeHeight * 0.618;
    target2 = minPrice - safeHeight * 1.272;
  }

  const baseSuccess = reference.historicalSuccessRate || 65;
  const targetZones: TargetZone[] = [
    {
      min: direction === 'bullish' ? target1 * 0.985 : target1 * 1.015,
      max: direction === 'bullish' ? target1 * 1.015 : target1 * 0.985,
      label: 'الهدف الفراكتالي الأول (امتداد 61.8%)',
      probability: Math.round(baseSuccess),
    },
    {
      min: direction === 'bullish' ? target2 * 0.98 : target2 * 1.02,
      max: direction === 'bullish' ? target2 * 1.02 : target2 * 0.98,
      label: 'الهدف الفراكتالي الممتد (امتداد 127.2%)',
      probability: Math.round(baseSuccess * 0.68),
    },
  ];

  // Synthesize projected path from reference.postCompletionPath
  const projectedPath: ProjectedPoint[] = [];
  const postPath = reference.postCompletionPath || [
    { t: 0, p: 1 },
    { t: 0.5, p: 1.15 },
    { t: 1.0, p: 1.35 },
  ];

  const totalProjectionBars = 18;
  const timeStep = timeframeSeconds || 3600;

  for (let step = 0; step < postPath.length; step++) {
    const pt = postPath[step];
    const projectedTime = lastBarTime + (step + 1) * 3 * timeStep;

    let projPrice = currentPrice;
    if (direction === 'bullish') {
      const deltaFactor = (pt.p - 1.0);
      projPrice = currentPrice + safeHeight * deltaFactor;
    } else {
      const deltaFactor = Math.abs(pt.p);
      projPrice = currentPrice - safeHeight * deltaFactor;
    }

    // Cone uncertainty expands over time
    const uncertainty = (step + 1) * atr * 0.4;
    projectedPath.push({
      time: projectedTime,
      price: Number(projPrice.toFixed(2)),
      isHypothetical: true,
      upperBand: Number((projPrice + uncertainty).toFixed(2)),
      lowerBand: Number((projPrice - uncertainty).toFixed(2)),
    });
  }

  return {
    targetZones,
    invalidationLevel: Number(invalidationLevel.toFixed(2)),
    confirmationLevel: Number(confirmationLevel.toFixed(2)),
    projectedPath,
  };
}
