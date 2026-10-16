/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformConfig } from '../types/fractal';
import { CryptoPair, ScannerResult } from '../types/crypto';
import { fetchBinanceCandles } from './binanceService';
import { buildNestedFractalHierarchy } from '../utils/nestedFractalTree';

/**
 * Concurrently scans crypto pairs and runs the core fractal self-similarity discovery engine.
 * Filters strictly to pairs with genuine evidence of self-similarity (score >= minSimilarityThreshold).
 */
export async function scanCryptoPairs(
  pairs: CryptoPair[],
  timeframe: string = '1h',
  config: PlatformConfig,
  onProgress?: (scanned: number, total: number) => void
): Promise<ScannerResult[]> {
  const results: ScannerResult[] = [];
  const total = pairs.length;
  let scanned = 0;

  // Process in small batches of 4 to prevent rate limits
  const batchSize = 4;
  for (let i = 0; i < total; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (pair) => {
        try {
          const tfSeconds = timeframe === '15m' ? 900 : timeframe === '4h' ? 14400 : timeframe === '1d' ? 86400 : 3600;
          const candles = await fetchBinanceCandles(pair.symbol, timeframe, 160, pair.price);
          if (candles.length >= 40) {
            const patterns = buildNestedFractalHierarchy(candles, config, tfSeconds);

            // Look for active Micro (L3) or Intermediate (L2) fractal pattern
            const activePattern = patterns.find((p) => p.level === 3) || patterns.find((p) => p.level === 2);
            const macroPattern = patterns.find((p) => p.level === 1);

            if (activePattern && activePattern.similarity) {
              const score = activePattern.similarity.totalScore;

              // STRICT RULE: No signal if similarity is below threshold
              if (score >= config.minSimilarityThreshold) {
                // Determine position of micro inside macro
                let positionInMacro = 'بنية مستقلة متسقة مع الأرشيف';
                if (macroPattern && activePattern.waves.length > 0) {
                  const microStart = activePattern.waves[0].startIndex;
                  // Find which macro wave contains the micro pattern
                  const macroWaveIdx = macroPattern.waves.findIndex(
                    (mw) => microStart >= mw.startIndex && microStart <= mw.endIndex
                  );
                  if (macroWaveIdx !== -1) {
                    positionInMacro = `موضع داخلي: ضمن الموجة (${macroWaveIdx + 1}) الكبرى`;
                  } else {
                    positionInMacro = `امتداد هيكلي في الطور الختامي للفراكتال الكلي`;
                  }
                }

                // Confidence grade
                let confidenceGrade: 'فائق' | 'مرتفع' | 'متوسط' = 'متوسط';
                if (score >= 84) confidenceGrade = 'فائق';
                else if (score >= 76) confidenceGrade = 'مرتفع';

                const target1 = activePattern.targetZones[0]?.min || pair.price * 1.05;
                const riskReward = Math.abs(target1 - pair.price) / (Math.abs(pair.price - activePattern.invalidationLevel) || 1);

                results.push({
                  symbol: pair.symbol,
                  baseAsset: pair.baseAsset,
                  price: pair.price,
                  change24h: pair.change24h,
                  timeframe,
                  patternName: activePattern.name,
                  similarityScore: score,
                  shapeScore: activePattern.similarity.shapeScore,
                  timingScore: activePattern.similarity.timingScore,
                  stage: activePattern.stage,
                  stageNameAr: activePattern.stageReason.slice(0, 35) + '...',
                  positionInMacro,
                  direction: activePattern.direction,
                  confirmationPrice: activePattern.confirmationLevel,
                  invalidationPrice: activePattern.invalidationLevel,
                  targetPrice: Number(target1.toFixed(pair.price > 10 ? 2 : 4)),
                  riskRewardRatio: Number(riskReward.toFixed(2)),
                  confidenceGrade,
                  isConfirmed: activePattern.isConfirmed,
                  timestamp: Math.floor(Date.now() / 1000),
                });
              }
            }
          }
        } catch (err) {
          console.warn(`Error scanning ${pair.symbol}:`, err);
        } finally {
          scanned++;
          if (onProgress) onProgress(scanned, total);
        }
      })
    );
  }

  // Rank by composite similarity score descending
  return results.sort((a, b) => b.similarityScore - a.similarityScore);
}
