/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatternStage } from './fractal';

export interface CryptoPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  volume24h: number; // Quote volume (USDT)
  high24h: number;
  low24h: number;
  isFavorite?: boolean;
}

export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'polling_fallback';

export interface ScannerResult {
  symbol: string;
  baseAsset: string;
  price: number;
  change24h: number;
  timeframe: string;
  patternName: string;
  similarityScore: number;
  shapeScore: number;
  timingScore: number;
  stage: PatternStage;
  stageNameAr: string;
  positionInMacro: string; // e.g. "داخل الموجة التصحيحية (W2) من الفراكتال الكلي"
  direction: 'bullish' | 'bearish';
  confirmationPrice: number;
  invalidationPrice: number;
  targetPrice: number;
  riskRewardRatio: number;
  confidenceGrade: 'فائق' | 'مرتفع' | 'متوسط';
  isConfirmed: boolean;
  timestamp: number;
}
