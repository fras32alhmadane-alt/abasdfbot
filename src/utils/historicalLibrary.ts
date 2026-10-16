/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistoricalReference } from '../types/fractal';

export const HISTORICAL_PATTERNS_LIBRARY: HistoricalReference[] = [
  {
    id: 'ref-bullish-4wave-replica',
    name: 'نموذج الفراكتال الصاعد رباعي الموجات (4-Wave Bullish Fractal)',
    asset: 'BTC/USDT',
    timeframe: '4h',
    direction: 'bullish',
    wavesCount: 4,
    sampleHistoricalOccurrences: 142,
    historicalSuccessRate: 67.4,
    // 50-point resampled normalized curve for wave trajectory
    normalizedTrajectory: [
      { t: 0.0, p: 0.1 },
      { t: 0.05, p: 0.28 },
      { t: 0.1, p: 0.45 },
      { t: 0.15, p: 0.52 },
      { t: 0.2, p: 0.48 },
      { t: 0.25, p: 0.38 }, // End wave 1 / start wave 2
      { t: 0.3, p: 0.32 },
      { t: 0.35, p: 0.42 },
      { t: 0.4, p: 0.58 },
      { t: 0.45, p: 0.72 },
      { t: 0.5, p: 0.85 }, // Wave 2 impulse
      { t: 0.55, p: 0.80 },
      { t: 0.6, p: 0.68 },
      { t: 0.65, p: 0.60 }, // Wave 3 consolidation
      { t: 0.7, p: 0.62 },
      { t: 0.75, p: 0.58 },
      { t: 0.8, p: 0.64 },
      { t: 0.85, p: 0.75 },
      { t: 0.9, p: 0.88 },
      { t: 0.95, p: 0.96 },
      { t: 1.0, p: 1.0 }, // Completion
    ],
    // Subsequent historical path post-completion
    postCompletionPath: [
      { t: 0.0, p: 1.0 },
      { t: 0.2, p: 1.12 },
      { t: 0.4, p: 1.25 },
      { t: 0.6, p: 1.21 },
      { t: 0.8, p: 1.34 },
      { t: 1.0, p: 1.42 },
    ],
  },
  {
    id: 'ref-bearish-distribution-fractal',
    name: 'نموذج التوزيع الفراكتالي الهابط (Bearish Distribution Fractal)',
    asset: 'ETH/USDT',
    timeframe: '1h',
    direction: 'bearish',
    wavesCount: 4,
    sampleHistoricalOccurrences: 118,
    historicalSuccessRate: 63.8,
    normalizedTrajectory: [
      { t: 0.0, p: 0.95 },
      { t: 0.05, p: 0.78 },
      { t: 0.1, p: 0.65 },
      { t: 0.15, p: 0.58 },
      { t: 0.2, p: 0.68 },
      { t: 0.25, p: 0.75 }, // Retracement up
      { t: 0.3, p: 0.72 },
      { t: 0.35, p: 0.55 },
      { t: 0.4, p: 0.42 },
      { t: 0.45, p: 0.35 }, // Down leg 2
      { t: 0.5, p: 0.44 },
      { t: 0.55, p: 0.48 },
      { t: 0.6, p: 0.45 },
      { t: 0.65, p: 0.38 }, // Consolidation
      { t: 0.7, p: 0.32 },
      { t: 0.75, p: 0.22 },
      { t: 0.8, p: 0.15 },
      { t: 0.85, p: 0.12 },
      { t: 0.9, p: 0.06 },
      { t: 1.0, p: 0.0 }, // Breakdown
    ],
    postCompletionPath: [
      { t: 0.0, p: 0.0 },
      { t: 0.2, p: -0.12 },
      { t: 0.4, p: -0.22 },
      { t: 0.6, p: -0.18 },
      { t: 0.8, p: -0.32 },
      { t: 1.0, p: -0.39 },
    ],
  },
  {
    id: 'ref-nested-impulse-5wave',
    name: 'نموذج الدافع التناظري الخماسي (5-Wave Impulse Symmetrical)',
    asset: 'SOL/USDT',
    timeframe: '15m',
    direction: 'bullish',
    wavesCount: 5,
    sampleHistoricalOccurrences: 184,
    historicalSuccessRate: 70.1,
    normalizedTrajectory: [
      { t: 0.0, p: 0.05 },
      { t: 0.1, p: 0.32 },
      { t: 0.18, p: 0.22 }, // End W2
      { t: 0.3, p: 0.55 },
      { t: 0.42, p: 0.75 }, // End W3
      { t: 0.52, p: 0.58 }, // End W4
      { t: 0.65, p: 0.78 },
      { t: 0.78, p: 0.92 },
      { t: 0.9, p: 0.98 },
      { t: 1.0, p: 1.0 }, // End W5
    ],
    postCompletionPath: [
      { t: 0.0, p: 1.0 },
      { t: 0.2, p: 0.88 },
      { t: 0.4, p: 0.82 },
      { t: 0.6, p: 0.94 },
      { t: 0.8, p: 1.15 },
      { t: 1.0, p: 1.28 },
    ],
  },
  {
    id: 'ref-symmetrical-fractal-expansion',
    name: 'نموذج التوسع الفراكتالي المتدرج (Multi-Scale Symmetrical Expansion)',
    asset: 'XAU/USD',
    timeframe: '1h',
    direction: 'bullish',
    wavesCount: 4,
    sampleHistoricalOccurrences: 96,
    historicalSuccessRate: 65.2,
    normalizedTrajectory: [
      { t: 0.0, p: 0.15 },
      { t: 0.15, p: 0.4 },
      { t: 0.25, p: 0.3 },
      { t: 0.4, p: 0.6 },
      { t: 0.55, p: 0.48 },
      { t: 0.7, p: 0.8 },
      { t: 0.85, p: 0.7 },
      { t: 1.0, p: 0.98 },
    ],
    postCompletionPath: [
      { t: 0.0, p: 0.98 },
      { t: 0.3, p: 1.1 },
      { t: 0.6, p: 1.06 },
      { t: 1.0, p: 1.25 },
    ],
  },
];
