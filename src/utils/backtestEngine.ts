/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BacktestSummary, BacktestTrade, Candle, PlatformConfig } from '../types/fractal';
import { calculateATR } from './indicators';
import { detectSwings } from './swingDetector';
import { buildWavesFromSwings } from './waveBuilder';
import { normalizeCandleSlice } from './normalization';
import { calculateSimilarity } from './similarityEngine';
import { HISTORICAL_PATTERNS_LIBRARY } from './historicalLibrary';

export interface BacktestOptions {
  minSimilarity: number;
  lookbackBars: number;
  stepSize?: number;
}

/**
 * Executes a walk-forward historical backtest on candle series.
 * Strictly avoids lookahead bias by restricting all calculations at bar `t` to data available at `t`.
 */
export function runWalkForwardBacktest(
  candles: Candle[],
  config: PlatformConfig,
  options: BacktestOptions
): { summary: BacktestSummary; trades: BacktestTrade[] } {
  const { minSimilarity = 70, lookbackBars = 200, stepSize = 3 } = options;
  const trades: BacktestTrade[] = [];

  const totalCandles = candles.length;
  if (totalCandles < 60) {
    return {
      summary: createEmptySummary(),
      trades: [],
    };
  }

  const startBar = Math.max(35, totalCandles - lookbackBars);
  const endBar = totalCandles - 10;
  const atrs = calculateATR(candles, config.atrPeriod);

  let lastSignalBar = -999;

  for (let t = startBar; t < endBar; t += stepSize) {
    // Prevent overlapping duplicate signal triggers in same local sequence
    if (t - lastSignalBar < 6) continue;

    // Strict Walk-forward: candle slice strictly up to bar t
    const historicalSlice = candles.slice(0, t + 1);
    const currentPrice = candles[t].close;
    const currentATR = atrs[t] || (candles[t].high - candles[t].low);

    // Detect swings on slice
    const swings = detectSwings(historicalSlice, {
      sensitivity: config.swingSensitivity,
      atrPeriod: config.atrPeriod,
      atrMultiplier: config.atrMultiplier,
    });

    if (swings.length < 3) continue;

    const waves = buildWavesFromSwings(swings, historicalSlice, 2);
    if (waves.length < 3) continue;

    const candidateWaves = waves.slice(-Math.min(waves.length, 4));
    const startIdx = candidateWaves[0].startIndex;
    const endIdx = candidateWaves[candidateWaves.length - 1].endIndex;

    // Ensure candidate wave ended near current bar t
    if (t - endIdx > 3) continue;

    const sliceCandles = historicalSlice.slice(startIdx, endIdx + 1);
    const normPoints = normalizeCandleSlice(sliceCandles, config.normalizationMethod, 40);
    const direction = candidateWaves[candidateWaves.length - 1].endPrice >= candidateWaves[0].startPrice ? 'bullish' : 'bearish';

    const ref = HISTORICAL_PATTERNS_LIBRARY.find((r) => r.direction === direction) || HISTORICAL_PATTERNS_LIBRARY[0];
    const similarity = calculateSimilarity(normPoints, candidateWaves, ref, {
      shape: config.weightShape,
      ratios: config.weightRatios,
      timing: config.weightTiming,
      structure: config.weightStructure,
    });

    if (similarity.totalScore < minSimilarity) continue;

    // Compute entry, target, and invalidation stop
    let minP = Infinity;
    let maxP = -Infinity;
    for (const w of candidateWaves) {
      minP = Math.min(minP, w.startPrice, w.endPrice);
      maxP = Math.max(maxP, w.startPrice, w.endPrice);
    }
    const height = Math.max(currentATR * 2, maxP - minP);

    let targetPrice: number;
    let stopPrice: number;

    if (direction === 'bullish') {
      targetPrice = currentPrice + Math.max(currentATR * 1.5, height * 0.75);
      stopPrice = Math.max(0.00000001, Math.min(currentPrice - currentATR * 0.4, minP - currentATR * 0.2));
    } else {
      targetPrice = Math.max(0.00000001, currentPrice - Math.max(currentATR * 1.5, height * 0.75));
      stopPrice = Math.max(currentPrice + currentATR * 0.4, maxP + currentATR * 0.2);
    }

    // Forward test from bar t + 1 to see outcome
    let outcome: 'win_target' | 'loss_invalidation' | 'open' = 'open';
    let exitBar = t + 1;
    let exitPrice = currentPrice;
    const maxHoldBars = 25;

    for (let f = t + 1; f < Math.min(totalCandles, t + 1 + maxHoldBars); f++) {
      const c = candles[f];
      exitBar = f;

      if (direction === 'bullish') {
        if (c.high >= targetPrice) {
          outcome = 'win_target';
          exitPrice = targetPrice;
          break;
        } else if (c.low <= stopPrice) {
          outcome = 'loss_invalidation';
          exitPrice = stopPrice;
          break;
        }
      } else {
        if (c.low <= targetPrice) {
          outcome = 'win_target';
          exitPrice = targetPrice;
          break;
        } else if (c.high >= stopPrice) {
          outcome = 'loss_invalidation';
          exitPrice = stopPrice;
          break;
        }
      }
    }

    if (outcome === 'open') {
      exitPrice = candles[exitBar].close;
    }

    let returnPct = 0;
    if (direction === 'bullish') {
      returnPct = ((exitPrice - currentPrice) / currentPrice) * 100;
    } else {
      returnPct = ((currentPrice - exitPrice) / currentPrice) * 100;
    }

    trades.push({
      id: `trade-${t}-${trades.length}`,
      patternId: `pattern-${t}`,
      patternName: `${ref.name} (${direction === 'bullish' ? 'صاعد' : 'هابط'})`,
      level: 2,
      direction,
      similarityScore: similarity.totalScore,
      entryIndex: t,
      entryTime: candles[t].time,
      entryPrice: Number(currentPrice.toFixed(2)),
      targetPrice: Number(targetPrice.toFixed(2)),
      stopPrice: Number(stopPrice.toFixed(2)),
      exitIndex: exitBar,
      exitTime: candles[exitBar].time,
      exitPrice: Number(exitPrice.toFixed(2)),
      outcome,
      returnPct: Number(returnPct.toFixed(2)),
      barsHeld: exitBar - t,
    });

    lastSignalBar = t;
  }

  const summary = calculateSummary(trades);
  return { summary, trades };
}

function calculateSummary(trades: BacktestTrade[]): BacktestSummary {
  const totalSignals = trades.length;
  if (totalSignals === 0) return createEmptySummary();

  const wins = trades.filter((t) => t.outcome === 'win_target');
  const losses = trades.filter((t) => t.outcome === 'loss_invalidation');
  const opens = trades.filter((t) => t.outcome === 'open');

  const winRate = Number(((wins.length / (wins.length + losses.length || 1)) * 100).toFixed(1));
  const invalidationRate = Number(((losses.length / totalSignals) * 100).toFixed(1));

  const totalProfit = wins.reduce((acc, t) => acc + t.returnPct, 0);
  const totalLoss = Math.abs(losses.reduce((acc, t) => acc + t.returnPct, 0));

  const avgProfitPct = wins.length > 0 ? Number((totalProfit / wins.length).toFixed(2)) : 0;
  const avgLossPct = losses.length > 0 ? Number((totalLoss / losses.length).toFixed(2)) : 0;

  const profitFactor = totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : (totalProfit > 0 ? 3.5 : 1.0);
  const expectedValue = Number(((winRate / 100) * avgProfitPct - ((100 - winRate) / 100) * avgLossPct).toFixed(2));

  // Max drawdown calculation
  let peak = 0;
  let maxDD = 0;
  let cumulative = 0;
  for (const t of trades) {
    cumulative += t.returnPct;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDD) maxDD = dd;
  }

  // Breakdown by score tier
  const tiers = [
    { label: 'تشابه فائق (≥ 85%)', min: 85, max: 100 },
    { label: 'تشابه قوي (78% - 84%)', min: 78, max: 84.99 },
    { label: 'تشابه معتدل (70% - 77%)', min: 70, max: 77.99 },
  ];

  const byScoreTier = tiers.map((tier) => {
    const tierTrades = trades.filter((t) => t.similarityScore >= tier.min && t.similarityScore <= tier.max);
    const tierWins = tierTrades.filter((t) => t.outcome === 'win_target');
    const tierLosses = tierTrades.filter((t) => t.outcome === 'loss_invalidation');
    const tWinRate = tierTrades.length > 0 ? Number(((tierWins.length / (tierWins.length + tierLosses.length || 1)) * 100).toFixed(1)) : 0;

    const tProfit = tierWins.reduce((acc, t) => acc + t.returnPct, 0);
    const tLoss = Math.abs(tierLosses.reduce((acc, t) => acc + t.returnPct, 0));
    const tPF = tLoss > 0 ? Number((tProfit / tLoss).toFixed(2)) : 1.5;

    return {
      tier: tier.label,
      signals: tierTrades.length,
      winRate: tWinRate,
      profitFactor: tPF,
    };
  });

  return {
    totalSignals,
    targetHitCount: wins.length,
    invalidatedCount: losses.length,
    openCount: opens.length,
    winRate,
    invalidationRate,
    avgProfitPct,
    avgLossPct,
    profitFactor,
    expectedValue,
    maxDrawdownPct: Number(maxDD.toFixed(2)),
    byScoreTier,
    byPatternLevel: [
      { level: 'المستوى الوسيط (L2)', signals: totalSignals, winRate },
    ],
  };
}

function createEmptySummary(): BacktestSummary {
  return {
    totalSignals: 0,
    targetHitCount: 0,
    invalidatedCount: 0,
    openCount: 0,
    winRate: 0,
    invalidationRate: 0,
    avgProfitPct: 0,
    avgLossPct: 0,
    profitFactor: 0,
    expectedValue: 0,
    maxDrawdownPct: 0,
    byScoreTier: [],
    byPatternLevel: [],
  };
}
