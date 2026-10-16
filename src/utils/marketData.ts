/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Candle } from '../types/fractal';

export interface MarketAsset {
  symbol: string;
  nameAr: string;
  nameEn: string;
  category: 'crypto' | 'forex' | 'commodity' | 'indices';
  basePrice: number;
  decimals: number;
}

export const SUPPORTED_ASSETS: MarketAsset[] = [
  { symbol: 'BTCUSDT', nameAr: 'بيتكوين / دولار', nameEn: 'Bitcoin / USDT', category: 'crypto', basePrice: 68450, decimals: 1 },
  { symbol: 'ETHUSDT', nameAr: 'إيثيريوم / دولار', nameEn: 'Ethereum / USDT', category: 'crypto', basePrice: 3520, decimals: 2 },
  { symbol: 'SOLUSDT', nameAr: 'سولانا / دولار', nameEn: 'Solana / USDT', category: 'crypto', basePrice: 182, decimals: 2 },
  { symbol: 'XAUUSD', nameAr: 'الذهب / دولار', nameEn: 'Gold / USD', category: 'commodity', basePrice: 2680, decimals: 2 },
  { symbol: 'EURUSD', nameAr: 'اليورو / دولار', nameEn: 'EUR / USD', category: 'forex', basePrice: 1.085, decimals: 4 },
  { symbol: 'SPX500', nameAr: 'مؤشر S&P 500', nameEn: 'S&P 500 Index', category: 'indices', basePrice: 5860, decimals: 1 },
];

export interface TimeframeOption {
  label: string;
  value: string;
  seconds: number;
  binanceVal: string;
}

export const TIMEFRAMES: TimeframeOption[] = [
  { label: '5 د', value: '5m', seconds: 300, binanceVal: '5m' },
  { label: '15 د', value: '15m', seconds: 900, binanceVal: '15m' },
  { label: '1 س', value: '1h', seconds: 3600, binanceVal: '1h' },
  { label: '4 س', value: '4h', seconds: 14400, binanceVal: '4h' },
  { label: '1 ي', value: '1d', seconds: 86400, binanceVal: '1d' },
];

/**
 * Fetches market candles from Binance public API when possible,
 * or generates realistic geometric fractal price action if network is unavailable or asset is non-crypto.
 */
export async function fetchMarketCandles(
  symbol: string,
  timeframe: string,
  limit: number = 220
): Promise<Candle[]> {
  const asset = SUPPORTED_ASSETS.find((a) => a.symbol === symbol) || SUPPORTED_ASSETS[0];

  if (asset.category === 'crypto') {
    try {
      const tf = TIMEFRAMES.find((t) => t.value === timeframe) || TIMEFRAMES[2];
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf.binanceVal}&limit=${limit}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 20) {
          return raw.map((k: any) => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
          }));
        }
      }
    } catch {
      // Graceful fallback to synthetic market generator
    }
  }

  // Generate synthetic candles with organic multi-scale fractal structures
  return generateFractalCandles(asset.basePrice, limit, timeframe);
}

/**
 * Generates organic historical candles embedded with self-similar wave structures
 */
export function generateFractalCandles(
  basePrice: number,
  count: number = 200,
  timeframe: string = '1h'
): Candle[] {
  const tf = TIMEFRAMES.find((t) => t.value === timeframe) || TIMEFRAMES[2];
  const stepSeconds = tf.seconds;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * stepSeconds;

  const candles: Candle[] = [];
  let price = basePrice;
  const volatility = basePrice * 0.008;

  // Multi-frequency harmonic wave components
  const freq1 = (2 * Math.PI) / 80; // Macro swing
  const freq2 = (2 * Math.PI) / 28; // Intermediate wave
  const freq3 = (2 * Math.PI) / 10; // Micro fluctuation

  for (let i = 0; i < count; i++) {
    const time = startTime + i * stepSeconds;

    // Harmonic fractal trend component
    const harmonicTrend =
      Math.sin(i * freq1) * volatility * 4 +
      Math.sin(i * freq2) * volatility * 1.8 +
      Math.sin(i * freq3) * volatility * 0.6;

    // Random walk noise
    const noise = (Math.random() - 0.49) * volatility * 1.2;

    const open = price;
    const close = Math.max(1, basePrice * 0.6 + harmonicTrend + noise);
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(100 + Math.random() * 500 + Math.abs(close - open) * 10);

    candles.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    price = close;
  }

  return candles;
}
