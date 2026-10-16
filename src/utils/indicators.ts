/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle } from '../types/fractal';

/**
 * Calculates True Range and ATR (Average True Range) for a sequence of candles.
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  const atr: number[] = new Array(candles.length).fill(0);
  if (candles.length === 0) return atr;

  const tr: number[] = new Array(candles.length).fill(0);
  tr[0] = candles[0].high - candles[0].low;

  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr[i] = Math.max(hl, hc, lc);
  }

  // Initial Simple Moving Average for first period
  let sumTR = 0;
  const initialPeriod = Math.min(period, candles.length);
  for (let i = 0; i < initialPeriod; i++) {
    sumTR += tr[i];
  }
  atr[initialPeriod - 1] = sumTR / initialPeriod;

  // Wilder's Smoothing for ATR
  for (let i = initialPeriod; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  // Backfill first period values
  for (let i = 0; i < initialPeriod - 1; i++) {
    atr[i] = atr[initialPeriod - 1];
  }

  return atr;
}

/**
 * Rolling average volume
 */
export function calculateRollingVolume(candles: Candle[], period: number = 20): number[] {
  const result: number[] = new Array(candles.length).fill(1);
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].volume;
    if (i >= period) {
      sum -= candles[i - period].volume;
      result[i] = sum / period;
    } else {
      result[i] = sum / (i + 1);
    }
  }
  return result;
}
