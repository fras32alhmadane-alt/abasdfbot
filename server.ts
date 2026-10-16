/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory cache for Binance data to prevent rate limits
let cachedPairs: any[] | null = null;
let lastPairsFetchTime = 0;
const PAIRS_CACHE_TTL_MS = 30000; // 30 seconds

// 1. API route: Fetch 24hr tickers for USDT pairs from Binance
app.get('/api/binance/pairs', async (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedPairs && now - lastPairsFetchTime < PAIRS_CACHE_TTL_MS) {
    return res.json(cachedPairs);
  }

  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: AbortSignal.timeout(6000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FSDP-Fractal-Platform/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Binance HTTP error: ${response.status}`);
    }

    const data: any[] = await response.json();
    const usdtPairs = data
      .filter((item) => item.symbol.endsWith('USDT') && !item.symbol.includes('UP') && !item.symbol.includes('DOWN'))
      .map((item) => ({
        symbol: item.symbol,
        baseAsset: item.symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        price: parseFloat(item.lastPrice) || 0,
        change24h: parseFloat(item.priceChangePercent) || 0,
        volume24h: parseFloat(item.quoteVolume) || 0,
        high24h: parseFloat(item.highPrice) || 0,
        low24h: parseFloat(item.lowPrice) || 0,
      }))
      .filter((pair) => pair.volume24h > 100000)
      .sort((a, b) => b.volume24h - a.volume24h);

    cachedPairs = usdtPairs;
    lastPairsFetchTime = now;
    return res.json(usdtPairs);
  } catch (error) {
    console.warn('Backend proxy failed to fetch Binance pairs, returning cached or empty:', error);
    if (cachedPairs) {
      return res.json(cachedPairs);
    }
    return res.status(502).json({ error: 'Failed to fetch from Binance' });
  }
});

// 2. API route: Fetch klines from Binance
app.get('/api/binance/klines', async (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string || 'BTCUSDT').toUpperCase();
  const interval = (req.query.interval as string || '1h').toLowerCase();
  const limit = parseInt(req.query.limit as string || '200', 10);

  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FSDP-Fractal-Platform/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Binance klines error: ${response.status}`);
    }

    const raw: any[] = await response.json();
    const candles = raw.map((k: any) => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    return res.json(candles);
  } catch (error) {
    console.warn(`Backend proxy failed klines for ${symbol}:`, error);
    return res.status(502).json({ error: `Failed to fetch klines for ${symbol}` });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FSDP Server running on port ${PORT}`);
  });
}

startServer();
