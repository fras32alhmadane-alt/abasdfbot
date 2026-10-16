/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle, SwingPoint, Wave } from '../types/fractal';
import { calculateRollingVolume } from './indicators';

/**
 * Builds individual waves from connected swing inflection points.
 */
export function buildWavesFromSwings(
  swings: SwingPoint[],
  candles: Candle[],
  level: number = 1
): Wave[] {
  if (swings.length < 2) return [];

  const rollingVolumes = calculateRollingVolume(candles, 20);
  const waves: Wave[] = [];

  for (let i = 0; i < swings.length - 1; i++) {
    const s1 = swings[i];
    const s2 = swings[i + 1];

    const direction: 'up' | 'down' = s2.price >= s1.price ? 'up' : 'down';
    const priceDelta = s2.price - s1.price;
    const percentDelta = (priceDelta / s1.price) * 100;
    const barsCount = Math.max(1, s2.index - s1.index);
    const durationMs = (s2.time - s1.time) * 1000;

    // Calculate average volume during this wave relative to baseline
    let waveVolSum = 0;
    let baselineSum = 0;
    const startIndex = Math.min(s1.index, s2.index);
    const endIndex = Math.max(s1.index, s2.index);

    for (let b = startIndex; b <= endIndex && b < candles.length; b++) {
      waveVolSum += candles[b].volume;
      baselineSum += rollingVolumes[b] || 1;
    }
    const volumeRatio = baselineSum > 0 ? (waveVolSum / baselineSum) : 1;

    // Retracement ratio against preceding wave if available
    let retracementRatio = 0;
    if (i > 0) {
      const prevWaveDelta = Math.abs(swings[i].price - swings[i - 1].price);
      if (prevWaveDelta > 0) {
        retracementRatio = Math.abs(priceDelta) / prevWaveDelta;
      }
    }

    // Status: confirmed only if both swings are confirmed
    const status = s1.confirmed && s2.confirmed ? 'confirmed' : 'provisional';

    waves.push({
      id: `wave-${level}-${i}-${s1.index}-${s2.index}`,
      startIndex: s1.index,
      endIndex: s2.index,
      startTime: s1.time,
      endTime: s2.time,
      startPrice: s1.price,
      endPrice: s2.price,
      direction,
      priceDelta,
      percentDelta,
      barsCount,
      durationMs,
      volumeRatio: Number(volumeRatio.toFixed(2)),
      retracementRatio: Number(retracementRatio.toFixed(3)),
      status,
      level,
    });
  }

  return waves;
}
