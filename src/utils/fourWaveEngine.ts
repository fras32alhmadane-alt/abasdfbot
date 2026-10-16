/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FourWaveHypothesis, Wave } from '../types/fractal';

/**
 * Analyzes whether a 4-wave candidate structure adheres to the 4-Wave Self-Similarity Hypothesis.
 * Evaluates:
 * - Wave 1: Velocity & directional momentum
 * - Wave 2: Expansion/replica of Wave 1
 * - Wave 3: Time structure & consolidation volatility
 * - Wave 4: Comparison to Wave 3 structure & bridge transition
 */
export function evaluateFourWaveHypothesis(waves: Wave[]): FourWaveHypothesis {
  if (waves.length < 4) {
    return {
      wave1Speed: 0,
      wave2ReplicaRatio: 0,
      wave3Volatility: 0,
      wave4StructureScore: 0,
      bridgeWaveDetected: false,
      overallScore: 0,
      statusText: 'البيانات غير كافية لتقييم نموذج الموجات الأربع (مطلوب 4 موجات على الأقل)',
    };
  }

  const [w1, w2, w3, w4] = waves.slice(0, 4);

  // 1. Wave 1 Speed: % move per bar
  const w1Bars = Math.max(1, w1.barsCount);
  const wave1Speed = Math.abs(w1.percentDelta) / w1Bars;

  // 2. Wave 2 Replica Ratio: price delta ratio and duration comparison to W1
  const w1Magnitude = Math.abs(w1.priceDelta) || 1;
  const w2Magnitude = Math.abs(w2.priceDelta);
  const magnitudeRatio = w2Magnitude / w1Magnitude;
  // Score closeness to harmonic ratio (e.g. 0.618 or 1.0 or 1.272)
  const replicaScore = Math.max(0, 100 - Math.min(
    Math.abs(magnitudeRatio - 0.618),
    Math.abs(magnitudeRatio - 1.0),
    Math.abs(magnitudeRatio - 1.272)
  ) * 75);

  // 3. Wave 3 Volatility: ratio of price spread to duration
  const w3Bars = Math.max(1, w3.barsCount);
  const wave3Volatility = (Math.abs(w3.percentDelta) * 10) / w3Bars;

  // 4. Wave 4 Structural symmetry compared to Wave 3
  const w4Bars = Math.max(1, w4.barsCount);
  const barRatio = Math.min(w3Bars, w4Bars) / Math.max(w3Bars, w4Bars);
  const w3Mag = Math.abs(w3.priceDelta) || 1;
  const w4Mag = Math.abs(w4.priceDelta);
  const magRatio = Math.min(w3Mag, w4Mag) / Math.max(w3Mag, w4Mag);
  const wave4StructureScore = ((barRatio + magRatio) / 2) * 100;

  // Bridge Wave detection: Is there a short transitional pause between w2 and w3?
  const bridgeWaveDetected = Math.abs(w2.retracementRatio - 0.382) < 0.15 || Math.abs(w2.retracementRatio - 0.5) < 0.15;

  // Overall harmonic score
  const overallScore = Math.round(
    replicaScore * 0.35 +
    wave4StructureScore * 0.35 +
    (bridgeWaveDetected ? 20 : 10) +
    Math.min(10, wave1Speed * 5)
  );

  let statusText = '';
  if (overallScore >= 75) {
    statusText = 'توافق عالي مع فرضية التشابه الذاتي الرباعي (تكرار نسبي متوازن)';
  } else if (overallScore >= 55) {
    statusText = 'توافق متوسط مع تباين طفيف في الإيقاع الزمني للموجة الثالثة';
  } else {
    statusText = 'بنية غير متوافقة مع فرضية الموجات الأربع؛ السوق يتحرك بنموذج حر';
  }

  return {
    wave1Speed: Number(wave1Speed.toFixed(2)),
    wave2ReplicaRatio: Number(replicaScore.toFixed(1)),
    wave3Volatility: Number(wave3Volatility.toFixed(2)),
    wave4StructureScore: Number(wave4StructureScore.toFixed(1)),
    bridgeWaveDetected,
    overallScore: Math.min(100, Math.max(0, overallScore)),
    statusText,
  };
}
