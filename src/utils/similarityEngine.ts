/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistoricalReference, SimilarityResult, Wave } from '../types/fractal';
import { computeDTW } from './dtw';
import { NormalizedPoint, resampleNormalizedCurve } from './normalization';

export interface SimilarityWeights {
  shape: number; // w1
  ratios: number; // w2
  timing: number; // w3
  structure: number; // w4
}

export const DEFAULT_WEIGHTS: SimilarityWeights = {
  shape: 0.35,
  ratios: 0.25,
  timing: 0.20,
  structure: 0.20,
};

/**
 * Computes composite fractal similarity between candidate wave structure and historical reference.
 */
export function calculateSimilarity(
  candidateNormalizedPoints: NormalizedPoint[],
  candidateWaves: Wave[],
  reference: HistoricalReference,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): SimilarityResult {
  // 1. Resample reference normalized curve to match candidate sample density
  const refResampled = resampleNormalizedCurve(reference.normalizedTrajectory, candidateNormalizedPoints.length || 50);

  // 2. DTW Shape Distance
  const dtwRes = computeDTW(candidateNormalizedPoints, refResampled);
  const shapeScore = Math.max(0, Math.min(100, (1 - dtwRes.normalizedDistance * 1.8) * 100));

  // 3. Wave Ratios Score
  let waveRatioScore = 80;
  const matchedFeatures: string[] = [];
  const divergentFeatures: string[] = [];

  if (candidateWaves.length >= 2) {
    let ratioAcc = 0;
    let comparisons = 0;

    for (let i = 0; i < candidateWaves.length - 1; i++) {
      const w1 = candidateWaves[i];
      const w2 = candidateWaves[i + 1];
      const actualRatio = Math.abs(w2.priceDelta) / (Math.abs(w1.priceDelta) || 1);

      // Typical harmonic Fibonacci ratios (0.382, 0.5, 0.618, 1.0, 1.272, 1.618)
      const fibs = [0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618];
      let minDiff = Infinity;
      let closestFib = 1.0;
      for (const fib of fibs) {
        const diff = Math.abs(actualRatio - fib);
        if (diff < minDiff) {
          minDiff = diff;
          closestFib = fib;
        }
      }

      const matchPct = Math.max(0, 1 - minDiff / 0.8);
      ratioAcc += matchPct;
      comparisons++;

      if (minDiff < 0.12) {
        matchedFeatures.push(
          `تناغم نسبي بين الموجة ${i + 1} والموجة ${i + 2} عند النسبة ${closestFib}`
        );
      } else if (minDiff > 0.35) {
        divergentFeatures.push(
          `تباين في نسبة الموجة ${i + 2} مقارنة بالنسبة النموذجية (${actualRatio.toFixed(2)})`
        );
      }
    }

    waveRatioScore = comparisons > 0 ? (ratioAcc / comparisons) * 100 : 75;
  }

  // 4. Retracement Depth Score
  let depthScore = 82;
  const retracements = candidateWaves
    .filter((w) => w.retracementRatio > 0)
    .map((w) => w.retracementRatio);

  if (retracements.length > 0) {
    let depthSum = 0;
    for (const r of retracements) {
      // Harmonic depth ideal range: 0.382 - 0.618
      const idealDepth = 0.5;
      const dev = Math.abs(r - idealDepth);
      depthSum += Math.max(0, 1 - dev / 0.6);
    }
    depthScore = (depthSum / retracements.length) * 100;
    if (depthScore > 75) {
      matchedFeatures.push('عمق التصحيح متوافق مع النطاق الفراكتالي الصحي (38.2% - 61.8%)');
    }
  }

  // 5. Timing & Duration Symmetry Score
  let timingScore = 78;
  if (candidateWaves.length >= 2) {
    const totalBars = candidateWaves.reduce((acc, w) => acc + w.barsCount, 0);
    const avgBars = totalBars / candidateWaves.length;
    let timingDevSum = 0;
    for (const w of candidateWaves) {
      timingDevSum += Math.abs(w.barsCount - avgBars) / avgBars;
    }
    const timingConsistency = Math.max(0, 1 - (timingDevSum / candidateWaves.length) / 1.5);
    timingScore = timingConsistency * 100;

    if (timingScore > 70) {
      matchedFeatures.push('تناسق في الإيقاع الزمني للموجات');
    } else {
      divergentFeatures.push('تفاوت زمني نسبي في سرعة تشكل الموجات');
    }
  }

  // 6. Structure & Directional Inflections Score
  let structureScore = 85;
  const candidateDirection =
    candidateWaves.length > 0 &&
    candidateWaves[candidateWaves.length - 1].endPrice >= candidateWaves[0].startPrice
      ? 'bullish'
      : 'bearish';

  if (candidateDirection === reference.direction) {
    structureScore = 90;
    matchedFeatures.push(`توافق الاتجاه العام للبنية (${candidateDirection === 'bullish' ? 'صاعد' : 'هابط'})`);
  } else {
    structureScore = 45;
    divergentFeatures.push('تعاكس الاتجاه العام مع النموذج المرجعي');
  }

  // Total weighted score
  const totalWeight = weights.shape + weights.ratios + weights.timing + weights.structure;
  const safeTotalWeight = totalWeight > 0 ? totalWeight : 1;

  const totalScore =
    (weights.shape * shapeScore +
      weights.ratios * waveRatioScore +
      weights.timing * timingScore +
      weights.structure * structureScore) /
    safeTotalWeight;

  return {
    totalScore: Number(Math.max(0, Math.min(100, totalScore)).toFixed(1)),
    shapeScore: Number(shapeScore.toFixed(1)),
    waveRatioScore: Number(waveRatioScore.toFixed(1)),
    depthScore: Number(depthScore.toFixed(1)),
    timingScore: Number(timingScore.toFixed(1)),
    structureScore: Number(structureScore.toFixed(1)),
    matchedFeatures: matchedFeatures.length > 0 ? matchedFeatures : ['تطابق نسبي أولي في هندسة القمم والقيعان'],
    divergentFeatures: divergentFeatures.length > 0 ? divergentFeatures : ['لا توجد انحرافات جوهرية عن النموذج'],
    dtwDistance: dtwRes.distance,
  };
}
