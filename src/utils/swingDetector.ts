/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle, SwingPoint } from '../types/fractal';
import { calculateATR } from './indicators';

export interface SwingDetectionOptions {
  sensitivity: number; // K bars lookback & lookahead
  atrPeriod?: number;
  atrMultiplier?: number;
}

/**
 * Detects swing highs and swing lows without lookahead repainting deception.
 * Strictly flags points as 'confirmed' (index <= candles.length - 1 - K) or
 * 'provisional' (still within the active evaluation horizon where a new bar could alter it).
 */
export function detectSwings(
  candles: Candle[],
  options: SwingDetectionOptions
): SwingPoint[] {
  const { sensitivity: k, atrPeriod = 14, atrMultiplier = 1.0 } = options;
  if (candles.length < k * 2 + 1) return [];

  const atrs = calculateATR(candles, atrPeriod);
  const rawPoints: SwingPoint[] = [];
  const n = candles.length;

  for (let i = k; i < n; i++) {
    const isProvisional = i > n - 1 - k;
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;
    const atr = atrs[i] || (candles[i].high - candles[i].low);

    // Left lookback check
    let isHighCandidate = true;
    let isLowCandidate = true;

    for (let j = 1; j <= k; j++) {
      if (candles[i - j].high > currentHigh) isHighCandidate = false;
      if (candles[i - j].low < currentLow) isLowCandidate = false;
    }

    // Right check (for completed bars up to available data)
    const rightLimit = Math.min(k, n - 1 - i);
    for (let j = 1; j <= rightLimit; j++) {
      if (candles[i + j].high > currentHigh) isHighCandidate = false;
      if (candles[i + j].low < currentLow) isLowCandidate = false;
    }

    // ATR noise filter
    const minMove = atr * atrMultiplier;

    if (isHighCandidate) {
      rawPoints.push({
        index: i,
        time: candles[i].time,
        price: currentHigh,
        type: 'high',
        confirmed: !isProvisional,
        barAge: n - 1 - i,
        atr,
      });
    } else if (isLowCandidate) {
      rawPoints.push({
        index: i,
        time: candles[i].time,
        price: currentLow,
        type: 'low',
        confirmed: !isProvisional,
        barAge: n - 1 - i,
        atr,
      });
    }
  }

  // Filter alternating swings (ZigZag simplification)
  // Ensure we don't have consecutive high-high or low-low without picking the peak
  const filtered: SwingPoint[] = [];
  for (const point of rawPoints) {
    if (filtered.length === 0) {
      filtered.push(point);
      continue;
    }

    const prev = filtered[filtered.length - 1];
    if (prev.type === point.type) {
      // Keep the more extreme one
      if (point.type === 'high' && point.price > prev.price) {
        filtered[filtered.length - 1] = point;
      } else if (point.type === 'low' && point.price < prev.price) {
        filtered[filtered.length - 1] = point;
      }
    } else {
      // Different type: ensure move exceeds ATR threshold
      const priceDiff = Math.abs(point.price - prev.price);
      if (priceDiff >= point.atr * atrMultiplier * 0.8) {
        filtered.push(point);
      }
    }
  }

  return filtered;
}
