/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candle {
  time: number; // Unix timestamp in seconds or ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: 'high' | 'low';
  confirmed: boolean; // Confirmed after lookback buffer K, provisional if recent
  barAge: number; // Candles since swing occurred
  atr: number; // ATR value at time of swing
}

export interface Wave {
  id: string;
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  startPrice: number;
  endPrice: number;
  direction: 'up' | 'down';
  priceDelta: number;
  percentDelta: number;
  barsCount: number;
  durationMs: number;
  volumeRatio: number; // Relative volume during wave vs rolling avg
  retracementRatio: number; // Retracement relative to preceding wave (e.g. 0.382, 0.5, 0.618)
  status: 'confirmed' | 'provisional';
  level: number; // 1=Macro, 2=Intermediate, 3=Micro, 4=Sub-micro
}

export type PatternStage =
  | 'none'
  | 'potential_start'
  | 'preliminary_match'
  | 'forming'
  | 'near_completion'
  | 'completed'
  | 'confirmed'
  | 'invalidated';

export interface SimilarityResult {
  totalScore: number; // 0 - 100
  shapeScore: number; // 0 - 100 (Dynamic Time Warping / Euclidean similarity)
  waveRatioScore: number; // 0 - 100 (proportions between impulse & corrective legs)
  depthScore: number; // 0 - 100 (Fibonacci retracement depth match)
  timingScore: number; // 0 - 100 (relative duration symmetry)
  structureScore: number; // 0 - 100 (sequence of swings & inflections)
  matchedFeatures: string[];
  divergentFeatures: string[];
  dtwDistance: number;
}

export interface TargetZone {
  min: number;
  max: number;
  label: string;
  probability: number;
}

export interface ProjectedPoint {
  time: number;
  price: number;
  isHypothetical: boolean;
  upperBand?: number;
  lowerBand?: number;
}

export interface FractalPattern {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4; // 1: Macro, 2: Intermediate, 3: Micro, 4: Sub-micro
  parentId?: string;
  childIds: string[];
  waves: Wave[];
  startIndex: number;
  endIndex: number;
  startTime: number;
  endTime: number;
  minPrice: number;
  maxPrice: number;
  startPrice: number;
  endPrice: number;
  direction: 'bullish' | 'bearish';
  stage: PatternStage;
  stageReason: string;
  isConfirmed: boolean;
  similarity?: SimilarityResult;
  referencePatternId?: string;
  referenceName?: string;
  relationToParent?: 'impulse_continuation' | 'internal_correction' | 'discordant';
  invalidationLevel: number;
  confirmationLevel: number;
  targetZones: TargetZone[];
  projectedPath: ProjectedPoint[];
}

export interface FourWaveHypothesis {
  wave1Speed: number; // Price velocity (% / bars)
  wave2ReplicaRatio: number; // Correlation / ratio to wave 1
  wave3Volatility: number; // Volatility index during consolidation
  wave4StructureScore: number; // Similarity to wave 3
  bridgeWaveDetected: boolean;
  overallScore: number;
  statusText: string;
}

export interface HistoricalReference {
  id: string;
  name: string;
  asset: string;
  timeframe: string;
  direction: 'bullish' | 'bearish';
  wavesCount: number;
  normalizedTrajectory: { t: number; p: number }[];
  postCompletionPath: { t: number; p: number }[]; // Subsequent historical price action
  sampleHistoricalOccurrences: number;
  historicalSuccessRate: number; // Walk-forward success rate from verified archives
}

export interface BacktestTrade {
  id: string;
  patternId: string;
  patternName: string;
  level: number;
  direction: 'bullish' | 'bearish';
  similarityScore: number;
  entryIndex: number;
  entryTime: number;
  entryPrice: number;
  targetPrice: number;
  stopPrice: number;
  exitIndex: number;
  exitTime: number;
  exitPrice: number;
  outcome: 'win_target' | 'loss_invalidation' | 'open';
  returnPct: number;
  barsHeld: number;
}

export interface BacktestSummary {
  totalSignals: number;
  targetHitCount: number;
  invalidatedCount: number;
  openCount: number;
  winRate: number;
  invalidationRate: number;
  avgProfitPct: number;
  avgLossPct: number;
  profitFactor: number;
  expectedValue: number;
  maxDrawdownPct: number;
  byScoreTier: {
    tier: string;
    signals: number;
    winRate: number;
    profitFactor: number;
  }[];
  byPatternLevel: {
    level: string;
    signals: number;
    winRate: number;
  }[];
}

export interface AlertNotification {
  id: string;
  timestamp: number;
  asset: string;
  timeframe: string;
  patternId: string;
  patternName: string;
  type: 'new_match' | 'stage_transition' | 'near_completion' | 'target_hit' | 'invalidated';
  message: string;
  similarity: number;
  stage: PatternStage;
  read: boolean;
}

export interface PlatformConfig {
  swingSensitivity: number; // lookback bar buffer (e.g. 5)
  atrPeriod: number; // 14
  atrMultiplier: number; // 1.2
  minWaves: number; // default 3
  maxWaves: number; // default 5
  minSimilarityThreshold: number; // e.g. 70 (%)
  weightShape: number; // 0.35
  weightRatios: number; // 0.25
  weightTiming: number; // 0.20
  weightStructure: number; // 0.20
  normalizationMethod: 'min_max' | 'start_end';
  enableFourWaveHypothesis: boolean;
  enableMultiTimeframe: boolean;
  allowBullishPatterns: boolean;
  allowBearishPatterns: boolean;
  preventLookaheadBias: boolean;
}
