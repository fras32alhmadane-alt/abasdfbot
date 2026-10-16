/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle, FractalPattern, PlatformConfig } from '../types/fractal';
import { calculateATR } from './indicators';
import { detectSwings } from './swingDetector';
import { buildWavesFromSwings } from './waveBuilder';
import { normalizeCandleSlice } from './normalization';
import { calculateSimilarity } from './similarityEngine';
import { HISTORICAL_PATTERNS_LIBRARY } from './historicalLibrary';
import { determinePatternStage } from './stageDetector';
import { generateProjections } from './projectionEngine';

/**
 * Builds a multi-level nested fractal hierarchy tree across 3 to 4 analytical scales.
 */
export function buildNestedFractalHierarchy(
  candles: Candle[],
  config: PlatformConfig,
  timeframeSeconds: number = 3600
): FractalPattern[] {
  if (candles.length < 30) return [];

  const atrs = calculateATR(candles, config.atrPeriod);
  const currentATR = atrs[atrs.length - 1] || (candles[candles.length - 1].high - candles[candles.length - 1].low);
  const currentPrice = candles[candles.length - 1].close;
  const lastBarTime = candles[candles.length - 1].time;

  // We detect at 3 sensitivity scales:
  // Level 1 (Macro): high sensitivity buffer (e.g. 10..14)
  // Level 2 (Intermediate): medium sensitivity (e.g. 5..7)
  // Level 3 (Micro): low sensitivity (e.g. 2..4)
  const macroSens = Math.max(8, config.swingSensitivity * 2);
  const interSens = Math.max(4, config.swingSensitivity);
  const microSens = Math.max(2, Math.floor(config.swingSensitivity / 2));

  const macroSwings = detectSwings(candles, {
    sensitivity: macroSens,
    atrPeriod: config.atrPeriod,
    atrMultiplier: config.atrMultiplier * 1.2,
  });

  const interSwings = detectSwings(candles, {
    sensitivity: interSens,
    atrPeriod: config.atrPeriod,
    atrMultiplier: config.atrMultiplier,
  });

  const microSwings = detectSwings(candles, {
    sensitivity: microSens,
    atrPeriod: config.atrPeriod,
    atrMultiplier: config.atrMultiplier * 0.7,
  });

  const macroWaves = buildWavesFromSwings(macroSwings, candles, 1);
  const interWaves = buildWavesFromSwings(interSwings, candles, 2);
  const microWaves = buildWavesFromSwings(microSwings, candles, 3);

  const patterns: FractalPattern[] = [];

  // 1. Build Macro Pattern (Level 1)
  if (macroWaves.length >= 2) {
    const relevantMacroWaves = macroWaves.slice(-Math.min(macroWaves.length, config.maxWaves));
    const startIdx = relevantMacroWaves[0].startIndex;
    const endIdx = relevantMacroWaves[relevantMacroWaves.length - 1].endIndex;
    const sliceCandles = candles.slice(startIdx, endIdx + 1);

    const normPoints = normalizeCandleSlice(sliceCandles, config.normalizationMethod, 50);
    const macroDir = relevantMacroWaves[relevantMacroWaves.length - 1].endPrice >= relevantMacroWaves[0].startPrice ? 'bullish' : 'bearish';
    
    // Find best historical reference match
    const ref = HISTORICAL_PATTERNS_LIBRARY.find((r) => r.direction === macroDir) || HISTORICAL_PATTERNS_LIBRARY[0];
    const similarity = calculateSimilarity(normPoints, relevantMacroWaves, ref, {
      shape: config.weightShape,
      ratios: config.weightRatios,
      timing: config.weightTiming,
      structure: config.weightStructure,
    });

    const proj = generateProjections(
      relevantMacroWaves,
      currentPrice,
      lastBarTime,
      timeframeSeconds,
      ref,
      macroDir,
      currentATR
    );

    const stageRes = determinePatternStage(
      relevantMacroWaves,
      ref.wavesCount,
      similarity.totalScore,
      currentPrice,
      proj.invalidationLevel,
      proj.confirmationLevel,
      macroDir
    );

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const w of relevantMacroWaves) {
      minPrice = Math.min(minPrice, w.startPrice, w.endPrice);
      maxPrice = Math.max(maxPrice, w.startPrice, w.endPrice);
    }

    const macroPattern: FractalPattern = {
      id: 'pattern-macro-lvl1',
      name: 'الفراكتال الكلي المرجعي (Macro L1)',
      level: 1,
      childIds: ['pattern-inter-lvl2'],
      waves: relevantMacroWaves,
      startIndex: startIdx,
      endIndex: endIdx,
      startTime: candles[startIdx].time,
      endTime: candles[endIdx].time,
      minPrice,
      maxPrice,
      startPrice: relevantMacroWaves[0].startPrice,
      endPrice: relevantMacroWaves[relevantMacroWaves.length - 1].endPrice,
      direction: macroDir,
      stage: stageRes.stage,
      stageReason: stageRes.stageReason,
      isConfirmed: stageRes.isConfirmed,
      similarity,
      referencePatternId: ref.id,
      referenceName: ref.name,
      invalidationLevel: proj.invalidationLevel,
      confirmationLevel: proj.confirmationLevel,
      targetZones: proj.targetZones,
      projectedPath: proj.projectedPath,
    };
    patterns.push(macroPattern);
  }

  // 2. Build Intermediate Pattern (Level 2)
  if (interWaves.length >= 3) {
    const relevantInterWaves = interWaves.slice(-Math.min(interWaves.length, config.maxWaves));
    const startIdx = relevantInterWaves[0].startIndex;
    const endIdx = relevantInterWaves[relevantInterWaves.length - 1].endIndex;
    const sliceCandles = candles.slice(startIdx, endIdx + 1);

    const normPoints = normalizeCandleSlice(sliceCandles, config.normalizationMethod, 50);
    const interDir = relevantInterWaves[relevantInterWaves.length - 1].endPrice >= relevantInterWaves[0].startPrice ? 'bullish' : 'bearish';

    const ref = HISTORICAL_PATTERNS_LIBRARY.find((r) => r.direction === interDir) || HISTORICAL_PATTERNS_LIBRARY[1];
    const similarity = calculateSimilarity(normPoints, relevantInterWaves, ref, {
      shape: config.weightShape,
      ratios: config.weightRatios,
      timing: config.weightTiming,
      structure: config.weightStructure,
    });

    const proj = generateProjections(
      relevantInterWaves,
      currentPrice,
      lastBarTime,
      timeframeSeconds,
      ref,
      interDir,
      currentATR
    );

    const stageRes = determinePatternStage(
      relevantInterWaves,
      ref.wavesCount,
      similarity.totalScore,
      currentPrice,
      proj.invalidationLevel,
      proj.confirmationLevel,
      interDir
    );

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const w of relevantInterWaves) {
      minPrice = Math.min(minPrice, w.startPrice, w.endPrice);
      maxPrice = Math.max(maxPrice, w.startPrice, w.endPrice);
    }

    const macroPattern = patterns.find((p) => p.level === 1);
    let relationToParent: 'impulse_continuation' | 'internal_correction' | 'discordant' = 'impulse_continuation';
    if (macroPattern) {
      if (macroPattern.direction === interDir) {
        relationToParent = 'impulse_continuation';
      } else {
        relationToParent = 'internal_correction';
      }
    }

    const interPattern: FractalPattern = {
      id: 'pattern-inter-lvl2',
      name: 'الفراكتال الوسيط الداخلي (Intermediate L2)',
      level: 2,
      parentId: macroPattern?.id,
      childIds: ['pattern-micro-lvl3'],
      waves: relevantInterWaves,
      startIndex: startIdx,
      endIndex: endIdx,
      startTime: candles[startIdx].time,
      endTime: candles[endIdx].time,
      minPrice,
      maxPrice,
      startPrice: relevantInterWaves[0].startPrice,
      endPrice: relevantInterWaves[relevantInterWaves.length - 1].endPrice,
      direction: interDir,
      stage: stageRes.stage,
      stageReason: stageRes.stageReason,
      isConfirmed: stageRes.isConfirmed,
      similarity,
      referencePatternId: ref.id,
      referenceName: ref.name,
      relationToParent,
      invalidationLevel: proj.invalidationLevel,
      confirmationLevel: proj.confirmationLevel,
      targetZones: proj.targetZones,
      projectedPath: proj.projectedPath,
    };
    patterns.push(interPattern);
  }

  // 3. Build Micro Pattern (Level 3 - The Active Forming Micro Structure)
  if (microWaves.length >= 3) {
    const relevantMicroWaves = microWaves.slice(-Math.min(microWaves.length, config.maxWaves));
    const startIdx = relevantMicroWaves[0].startIndex;
    const endIdx = relevantMicroWaves[relevantMicroWaves.length - 1].endIndex;
    const sliceCandles = candles.slice(startIdx, endIdx + 1);

    const normPoints = normalizeCandleSlice(sliceCandles, config.normalizationMethod, 50);
    const microDir = relevantMicroWaves[relevantMicroWaves.length - 1].endPrice >= relevantMicroWaves[0].startPrice ? 'bullish' : 'bearish';

    const ref = HISTORICAL_PATTERNS_LIBRARY.find((r) => r.direction === microDir) || HISTORICAL_PATTERNS_LIBRARY[0];
    const similarity = calculateSimilarity(normPoints, relevantMicroWaves, ref, {
      shape: config.weightShape,
      ratios: config.weightRatios,
      timing: config.weightTiming,
      structure: config.weightStructure,
    });

    const proj = generateProjections(
      relevantMicroWaves,
      currentPrice,
      lastBarTime,
      timeframeSeconds,
      ref,
      microDir,
      currentATR * 0.7
    );

    const stageRes = determinePatternStage(
      relevantMicroWaves,
      config.enableFourWaveHypothesis ? 4 : ref.wavesCount,
      similarity.totalScore,
      currentPrice,
      proj.invalidationLevel,
      proj.confirmationLevel,
      microDir
    );

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const w of relevantMicroWaves) {
      minPrice = Math.min(minPrice, w.startPrice, w.endPrice);
      maxPrice = Math.max(maxPrice, w.startPrice, w.endPrice);
    }

    const interPattern = patterns.find((p) => p.level === 2);
    let relationToParent: 'impulse_continuation' | 'internal_correction' | 'discordant' = 'impulse_continuation';
    if (interPattern) {
      if (interPattern.direction === microDir) {
        relationToParent = 'impulse_continuation';
      } else {
        relationToParent = 'internal_correction';
      }
    }

    const microPattern: FractalPattern = {
      id: 'pattern-micro-lvl3',
      name: 'الفراكتال المصغر الفعّال (Micro L3)',
      level: 3,
      parentId: interPattern?.id,
      childIds: [],
      waves: relevantMicroWaves,
      startIndex: startIdx,
      endIndex: endIdx,
      startTime: candles[startIdx].time,
      endTime: candles[endIdx].time,
      minPrice,
      maxPrice,
      startPrice: relevantMicroWaves[0].startPrice,
      endPrice: relevantMicroWaves[relevantMicroWaves.length - 1].endPrice,
      direction: microDir,
      stage: stageRes.stage,
      stageReason: stageRes.stageReason,
      isConfirmed: stageRes.isConfirmed,
      similarity,
      referencePatternId: ref.id,
      referenceName: ref.name,
      relationToParent,
      invalidationLevel: proj.invalidationLevel,
      confirmationLevel: proj.confirmationLevel,
      targetZones: proj.targetZones,
      projectedPath: proj.projectedPath,
    };
    patterns.push(microPattern);
  }

  return patterns;
}
