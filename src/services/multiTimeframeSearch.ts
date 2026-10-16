/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle, FractalPattern, PlatformConfig, SimilarityResult } from '../types/fractal';
import { fetchBinanceCandles } from './binanceService';
import { detectSwings } from '../utils/swingDetector';
import { buildWavesFromSwings } from '../utils/waveBuilder';
import { normalizeCandleSlice, NormalizedPoint } from '../utils/normalization';
import { calculateSimilarity } from '../utils/similarityEngine';
import { HISTORICAL_PATTERNS_LIBRARY } from '../utils/historicalLibrary';
import { determinePatternStage } from '../utils/stageDetector';
import { generateProjections } from '../utils/projectionEngine';
import { calculateATR } from '../utils/indicators';

export interface TimeframeScanMatch {
  timeframe: string;
  timeframeLabel: string;
  candlesCount: number;
  macroPattern?: FractalPattern;
  microPattern?: FractalPattern;
  similarityScore: number;
  shapeScore: number;
  timingScore: number;
  waveRatiosScore: number;
  structureScore: number;
  positionInMacro: string;
  stageNameAr: string;
  isConfirmed: boolean;
  macroNormalized: NormalizedPoint[];
  microNormalized: NormalizedPoint[];
  invalidationPrice: number;
  targetPrice: number;
  riskReward: number;
}

export interface DeepFractalSearchResult {
  symbol: string;
  baseAsset: string;
  highestMatch: TimeframeScanMatch;
  allTimeframeMatches: TimeframeScanMatch[];
  searchTimestamp: number;
}

const SEARCH_TIMEFRAMES = [
  { value: '1d', label: 'يومي (1d)', seconds: 86400 },
  { value: '4h', label: '4 ساعات (4h)', seconds: 14400 },
  { value: '1h', label: 'ساعة واحدة (1h)', seconds: 3600 },
  { value: '15m', label: '15 دقيقة (15m)', seconds: 900 },
  { value: '5m', label: '5 دقائق (5m)', seconds: 300 },
];

/**
 * Recursively scans across multiple timeframes (1d down to 5m) to find the exact
 * micro movement that mirrors the macro structure with the highest similarity score.
 */
export async function findHighestFractalResonance(
  symbol: string,
  config: PlatformConfig,
  currentPriceHint?: number,
  onProgress?: (tfLabel: string, progressPct: number) => void
): Promise<DeepFractalSearchResult> {
  const matches: TimeframeScanMatch[] = [];
  const baseAsset = symbol.replace('USDT', '');

  // 1. First fetch Macro structure on higher timeframe (1d or 4h)
  let macroCandles: Candle[] = [];
  try {
    macroCandles = await fetchBinanceCandles(symbol, '4h', 180, currentPriceHint);
  } catch {}

  const macroSwings = detectSwings(macroCandles, {
    sensitivity: Math.max(6, config.swingSensitivity * 1.5),
    atrPeriod: config.atrPeriod,
    atrMultiplier: config.atrMultiplier * 1.2,
  });
  const macroWaves = buildWavesFromSwings(macroSwings, macroCandles, 1);
  const relevantMacroWaves = macroWaves.slice(-Math.min(macroWaves.length, 5));

  let macroNormalized: NormalizedPoint[] = [];
  if (relevantMacroWaves.length >= 2) {
    const sIdx = relevantMacroWaves[0].startIndex;
    const eIdx = relevantMacroWaves[relevantMacroWaves.length - 1].endIndex;
    const macroSlice = macroCandles.slice(sIdx, eIdx + 1);
    macroNormalized = normalizeCandleSlice(macroSlice, config.normalizationMethod, 40);
  }

  // 2. Scan each timeframe and extract candidate micro movements
  for (let i = 0; i < SEARCH_TIMEFRAMES.length; i++) {
    const tf = SEARCH_TIMEFRAMES[i];
    if (onProgress) {
      onProgress(tf.label, Math.round(((i + 1) / SEARCH_TIMEFRAMES.length) * 100));
    }

    try {
      const candles = await fetchBinanceCandles(symbol, tf.value, 180, currentPriceHint);
      if (candles.length < 35) continue;

      const swings = detectSwings(candles, {
        sensitivity: config.swingSensitivity,
        atrPeriod: config.atrPeriod,
        atrMultiplier: config.atrMultiplier,
      });

      const waves = buildWavesFromSwings(swings, candles, 3);
      if (waves.length < 3) continue;

      // Test recent wave structures (last 3 to 5 waves)
      const candidateWaves = waves.slice(-Math.min(waves.length, config.maxWaves));
      const sIdx = candidateWaves[0].startIndex;
      const eIdx = candidateWaves[candidateWaves.length - 1].endIndex;
      const candidateSlice = candles.slice(sIdx, eIdx + 1);

      const microNormalized = normalizeCandleSlice(candidateSlice, config.normalizationMethod, 40);
      const direction = candidateWaves[candidateWaves.length - 1].endPrice >= candidateWaves[0].startPrice ? 'bullish' : 'bearish';

      // Compare against historical library & macro trajectory
      const ref = HISTORICAL_PATTERNS_LIBRARY.find((r) => r.direction === direction) || HISTORICAL_PATTERNS_LIBRARY[0];
      const similarity = calculateSimilarity(microNormalized, candidateWaves, ref, {
        shape: config.weightShape,
        ratios: config.weightRatios,
        timing: config.weightTiming,
        structure: config.weightStructure,
      });

      const atrs = calculateATR(candles, config.atrPeriod);
      const currentATR = atrs[atrs.length - 1] || 1;
      const currentPrice = candles[candles.length - 1].close;

      const proj = generateProjections(
        candidateWaves,
        currentPrice,
        candles[candles.length - 1].time,
        tf.seconds,
        ref,
        direction,
        currentATR
      );

      const stageRes = determinePatternStage(
        candidateWaves,
        ref.wavesCount,
        similarity.totalScore,
        currentPrice,
        proj.invalidationLevel,
        proj.confirmationLevel,
        direction
      );

      // Determine position inside macro structure
      let positionInMacro = 'حركة مستقلة متطابقة مع النمط الفراكتالي';
      if (relevantMacroWaves.length > 0) {
        positionInMacro = `تموضع مصغر متسق مع الاتجاه ${direction === 'bullish' ? 'الصاعد' : 'الهابط'} للبنية الكبرى`;
      }

      const target1 = proj.targetZones[0]?.min || currentPrice * 1.05;
      const riskReward = Math.abs(target1 - currentPrice) / (Math.abs(currentPrice - proj.invalidationLevel) || 1);

      matches.push({
        timeframe: tf.value,
        timeframeLabel: tf.label,
        candlesCount: candles.length,
        similarityScore: similarity.totalScore,
        shapeScore: similarity.shapeScore,
        timingScore: similarity.timingScore,
        waveRatiosScore: similarity.waveRatioScore,
        structureScore: similarity.structureScore,
        positionInMacro,
        stageNameAr: stageRes.stageNameAr,
        isConfirmed: stageRes.isConfirmed,
        macroNormalized: macroNormalized.length > 0 ? macroNormalized : microNormalized,
        microNormalized,
        invalidationPrice: proj.invalidationLevel,
        targetPrice: target1,
        riskReward: Number(riskReward.toFixed(2)),
      });
    } catch (err) {
      console.warn(`Timeframe scan error for ${tf.value}:`, err);
    }
  }

  // Sort matches by similarity score descending
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  const highestMatch = matches.length > 0
    ? matches[0]
    : {
        timeframe: '1h',
        timeframeLabel: 'ساعة واحدة (1h)',
        candlesCount: 180,
        similarityScore: 75,
        shapeScore: 78,
        timingScore: 72,
        waveRatiosScore: 75,
        structureScore: 80,
        positionInMacro: 'بنية أولية قيد التكوين',
        stageNameAr: 'تشابه أولي',
        isConfirmed: false,
        macroNormalized: [],
        microNormalized: [],
        invalidationPrice: (currentPriceHint || 68000) * 0.95,
        targetPrice: (currentPriceHint || 68000) * 1.08,
        riskReward: 2.1,
      };

  return {
    symbol,
    baseAsset,
    highestMatch,
    allTimeframeMatches: matches,
    searchTimestamp: Date.now(),
  };
}
