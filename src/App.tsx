/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, FractalPattern, PlatformConfig, SwingPoint, AlertNotification } from './types/fractal';
import { ConnectionState, CryptoPair } from './types/crypto';
import { TIMEFRAMES, TimeframeOption } from './utils/marketData';
import {
  fetchBinanceSpotPairs,
  fetchBinanceCandles,
  BinanceWebSocketManager,
  getStoredFavorites,
  saveStoredFavorites,
  formatCryptoPrice,
} from './services/binanceService';
import { detectSwings } from './utils/swingDetector';
import { calculateATR } from './utils/indicators';
import { buildNestedFractalHierarchy } from './utils/nestedFractalTree';
import { Header } from './components/Header';
import { FractalCanvasChart } from './components/Chart/FractalCanvasChart';
import { PatternInspector } from './components/PatternInspector';
import { FractalTreeView } from './components/FractalTreeView';
import { FourWaveAnalysis } from './components/FourWaveAnalysis';
import { BacktestPanel } from './components/BacktestPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { ArchitectureDoc } from './components/ArchitectureDoc';
import { SettingsModal } from './components/SettingsModal';
import { CryptoMarketSelector } from './components/Crypto/CryptoMarketSelector';
import { CryptoScanner } from './components/Crypto/CryptoScanner';
import { MultiTimeframeScanner } from './components/MultiTimeframeScanner';
import { ShieldCheck, TrendingUp, TrendingDown, Layers, Radar } from 'lucide-react';

export default function App() {
  // Navigation & Config State
  const [currentTab, setCurrentTab] = useState<string>('chart');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCryptoSelectorOpen, setIsCryptoSelectorOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Dynamic Crypto Pairs State
  const [cryptoPairs, setCryptoPairs] = useState<CryptoPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<CryptoPair>({
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 68450,
    change24h: 2.45,
    volume24h: 1845000000,
    high24h: 69200,
    low24h: 66800,
    isFavorite: true,
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(TIMEFRAMES[2]); // 1h
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Platform Mathematical Parameters
  const [config, setConfig] = useState<PlatformConfig>({
    swingSensitivity: 5,
    atrPeriod: 14,
    atrMultiplier: 1.2,
    minWaves: 3,
    maxWaves: 5,
    minSimilarityThreshold: 72,
    weightShape: 0.35,
    weightRatios: 0.25,
    weightTiming: 0.20,
    weightStructure: 0.20,
    normalizationMethod: 'min_max',
    enableFourWaveHypothesis: true,
    enableMultiTimeframe: true,
    allowBullishPatterns: true,
    allowBearishPatterns: true,
    preventLookaheadBias: true,
  });

  // Market & Analytical State
  const [candles, setCandles] = useState<Candle[]>([]);
  const [swings, setSwings] = useState<SwingPoint[]>([]);
  const [patterns, setPatterns] = useState<FractalPattern[]>([]);
  const [selectedPatternId, setSelectedPatternId] = useState<string | undefined>(undefined);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);

  const wsManagerRef = useRef<BinanceWebSocketManager | null>(null);

  // 1. Initial Load of Dynamic Binance Spot Pairs
  useEffect(() => {
    async function loadPairs() {
      const pairs = await fetchBinanceSpotPairs();
      setCryptoPairs(pairs);
      const btc = pairs.find((p) => p.symbol === 'BTCUSDT') || pairs[0];
      if (btc) setSelectedPair(btc);
    }
    loadPairs();
  }, []);

  // 2. Load historical candle data when pair or timeframe changes
  const loadMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchBinanceCandles(selectedPair.symbol, selectedTimeframe.binanceVal, 200);
      setCandles(data);
      setLastUpdateTime(Date.now());

      // Detect swings & fractal patterns
      const detectedSwings = detectSwings(data, {
        sensitivity: config.swingSensitivity,
        atrPeriod: config.atrPeriod,
        atrMultiplier: config.atrMultiplier,
      });
      setSwings(detectedSwings);

      const hierarchy = buildNestedFractalHierarchy(data, config, selectedTimeframe.seconds);
      setPatterns(hierarchy);

      if (hierarchy.length > 0) {
        const micro = hierarchy.find((p) => p.level === 3) || hierarchy[hierarchy.length - 1];
        setSelectedPatternId(micro.id);

        // Check if alert should trigger
        if (micro.similarity && micro.similarity.totalScore >= config.minSimilarityThreshold) {
          const newAlert: AlertNotification = {
            id: `alert-${Date.now()}`,
            timestamp: Math.floor(Date.now() / 1000),
            asset: selectedPair.symbol,
            timeframe: selectedTimeframe.label,
            patternId: micro.id,
            patternName: micro.name,
            type: 'new_match',
            message: `تم اكتشاف تشابه فراكتالي متداخل على ${selectedPair.baseAsset} بنسبة ${micro.similarity.totalScore}% (${micro.stageReason})`,
            similarity: micro.similarity.totalScore,
            stage: micro.stage,
            read: false,
          };

          setAlerts((prev) => {
            const exists = prev.some((a) => a.patternId === micro.id && Math.abs(a.timestamp - newAlert.timestamp) < 120);
            return exists ? prev : [newAlert, ...prev.slice(0, 30)];
          });
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedPair.symbol, selectedTimeframe, config]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  // 3. Connect Binance WebSocket for live candle stream
  useEffect(() => {
    if (!wsManagerRef.current) {
      wsManagerRef.current = new BinanceWebSocketManager(
        (candleUpdate, isClosed) => {
          setLastUpdateTime(Date.now());
          setCandles((prev) => {
            if (prev.length === 0) return prev;
            const last = prev[prev.length - 1];

            // If same candle, update it
            if (last.time === candleUpdate.time) {
              const updated = [...prev.slice(0, -1), candleUpdate];
              return updated;
            } else if (candleUpdate.time > last.time) {
              // New candle started
              return [...prev.slice(1), candleUpdate];
            }
            return prev;
          });

          // Update current price of active pair in pairs list
          setSelectedPair((prev) => ({
            ...prev,
            price: candleUpdate.close,
          }));
        },
        (state) => {
          setConnectionState(state);
        }
      );
    }

    wsManagerRef.current.subscribe(selectedPair.symbol, selectedTimeframe.binanceVal);

    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.cleanup();
      }
    };
  }, [selectedPair.symbol, selectedTimeframe.binanceVal]);

  // Clean destruction on unmount
  useEffect(() => {
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.destroy();
        wsManagerRef.current = null;
      }
    };
  }, []);

  // Re-run swing detector when candle prices update significantly
  useEffect(() => {
    if (candles.length > 30) {
      const detectedSwings = detectSwings(candles, {
        sensitivity: config.swingSensitivity,
        atrPeriod: config.atrPeriod,
        atrMultiplier: config.atrMultiplier,
      });
      setSwings(detectedSwings);
    }
  }, [candles.length, config.swingSensitivity, config.atrMultiplier]);

  // Toggle favorite
  const handleToggleFavorite = (symbol: string) => {
    const favorites = getStoredFavorites();
    let updated: string[];
    if (favorites.includes(symbol)) {
      updated = favorites.filter((s) => s !== symbol);
    } else {
      updated = [...favorites, symbol];
    }
    saveStoredFavorites(updated);

    setCryptoPairs((prev) =>
      prev.map((p) => ({
        ...p,
        isFavorite: updated.includes(p.symbol),
      }))
    );

    if (selectedPair.symbol === symbol) {
      setSelectedPair((prev) => ({
        ...prev,
        isFavorite: updated.includes(symbol),
      }));
    }
  };

  // Select pair and navigate to chart
  const handleSelectPairAndNavigate = (symbol: string) => {
    const pair = cryptoPairs.find((p) => p.symbol === symbol);
    if (pair) {
      setSelectedPair(pair);
      setCurrentTab('chart');
    }
  };

  const activePattern = patterns.find((p) => p.id === selectedPatternId) || patterns[patterns.length - 1];
  const currentCandle = candles[candles.length - 1];
  const currentPrice = currentCandle ? currentCandle.close : selectedPair.price;

  const seriesDelta = candles.length > 1
    ? ((currentPrice - candles[0].close) / candles[0].close) * 100
    : selectedPair.change24h;

  const atrs = candles.length > 0 ? calculateATR(candles, config.atrPeriod) : [];
  const currentATR = atrs.length > 0 ? atrs[atrs.length - 1] : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedPair={selectedPair}
        onOpenCryptoSelector={() => setIsCryptoSelectorOpen(true)}
        onToggleFavorite={handleToggleFavorite}
        selectedTimeframe={selectedTimeframe}
        onSelectTimeframe={setSelectedTimeframe}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshData={loadMarketData}
        isRefreshing={isRefreshing}
        unreadAlertsCount={alerts.filter((a) => !a.read).length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* KPI & Market Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-0.5">
              سعر {selectedPair.baseAsset} اللحظي (Binance)
            </span>
            <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
              ${formatCryptoPrice(currentPrice)}
            </div>
            <div className={`text-[10px] font-mono flex items-center gap-1 mt-0.5 ${seriesDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {seriesDelta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{seriesDelta >= 0 ? `+${seriesDelta.toFixed(2)}%` : `${seriesDelta.toFixed(2)}%`} (24س)</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-0.5">مؤشر التقلب (ATR 14)</span>
            <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
              {currentATR.toFixed(currentATR > 10 ? 2 : 4)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">فلترة الضوضاء السعرية</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-0.5">البنية المرصودة الحالية</span>
            <div className="text-xs font-semibold text-sky-400 truncate">
              {activePattern ? activePattern.name : 'انتظار تشكل الموجات'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              المستوى {activePattern?.level || 1} · {activePattern?.waves.length || 0} موجات
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-0.5">درجة التشابه الذاتي</span>
            <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
              {activePattern?.similarity?.totalScore || 75}%
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {activePattern?.isConfirmed ? 'موجات مؤكدة هندسياً' : 'قيد التكوين المؤقت'}
            </span>
          </div>

          <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
            <span className="text-[11px] text-slate-400 block mb-0.5">اتصال السوق</span>
            <div className="text-xs font-medium text-slate-200 truncate flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{connectionState === 'connected' ? 'بث حي ومباشر' : 'استطلاع دوري'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
              حجم 24س: ${(selectedPair.volume24h / 1000000).toFixed(1)}M USDT
            </span>
          </div>
        </div>

        {/* Tab 1: Chart & Live Analysis */}
        {currentTab === 'chart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Chart Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <FractalCanvasChart
                candles={candles}
                swings={swings}
                patterns={patterns}
                selectedPatternId={selectedPatternId}
                onSelectPattern={setSelectedPatternId}
                assetSymbol={`${selectedPair.baseAsset}/USDT`}
                timeframe={selectedTimeframe.label}
                connectionState={connectionState}
                lastUpdateTime={lastUpdateTime}
                onTriggerAutoScan={() => setCurrentTab('multi_tf')}
              />

              {/* Multi-Level Hierarchy Selector */}
              <div className="flex items-center gap-2 overflow-x-auto p-1 text-xs">
                <span className="text-slate-400 text-xs shrink-0">البنى المتداخلة:</span>
                {patterns.map((p) => {
                  const isSel = p.id === selectedPatternId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatternId(p.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition-all ${
                        isSel
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{p.name}</span>
                      <span className="mr-1.5 font-mono text-slate-500">({p.similarity?.totalScore || 75}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inspector Column (1 Col) */}
            <div className="lg:col-span-1">
              <PatternInspector
                pattern={activePattern}
                currentPrice={currentPrice}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Recursive Multi-Timeframe Search */}
        {currentTab === 'multi_tf' && (
          <MultiTimeframeScanner
            selectedPair={selectedPair}
            config={config}
            onApplyTimeframe={(tfVal) => {
              const tf = TIMEFRAMES.find((t) => t.value === tfVal);
              if (tf) {
                setSelectedTimeframe(tf);
                setCurrentTab('chart');
              }
            }}
          />
        )}

        {/* Tab 3: Crypto Multi-Pair Scanner */}
        {currentTab === 'scanner' && (
          <CryptoScanner
            pairs={cryptoPairs}
            config={config}
            selectedTimeframe={selectedTimeframe.value}
            onSelectPairAndNavigate={handleSelectPairAndNavigate}
          />
        )}

        {/* Tab 3: Nested Hierarchy Tree */}
        {currentTab === 'tree' && (
          <FractalTreeView
            patterns={patterns}
            selectedPatternId={selectedPatternId}
            onSelectPattern={(id) => {
              setSelectedPatternId(id);
              setCurrentTab('chart');
            }}
          />
        )}

        {/* Tab 4: 4-Wave Hypothesis */}
        {currentTab === 'four_wave' && (
          <FourWaveAnalysis activePattern={activePattern} />
        )}

        {/* Tab 5: Walk-Forward Backtesting */}
        {currentTab === 'backtest' && (
          <BacktestPanel
            candles={candles}
            config={config}
            assetSymbol={selectedPair.symbol}
            timeframe={selectedTimeframe.label}
          />
        )}

        {/* Tab 6: Real-time Alerts */}
        {currentTab === 'alerts' && (
          <AlertsPanel
            alerts={alerts}
            onMarkAllRead={() => {
              setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
            }}
            onClearAlerts={() => setAlerts([])}
          />
        )}

        {/* Tab 7: Architecture & Math Specification */}
        {currentTab === 'docs' && <ArchitectureDoc />}
      </main>

      {/* Dynamic Binance Crypto Market Selector Modal */}
      <CryptoMarketSelector
        isOpen={isCryptoSelectorOpen}
        onClose={() => setIsCryptoSelectorOpen(false)}
        pairs={cryptoPairs}
        selectedSymbol={selectedPair.symbol}
        onSelectPair={(pair) => {
          setSelectedPair(pair);
        }}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          loadMarketData();
        }}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-800 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span>منصة اكتشاف الفراكتال المتداخل FSDP</span>
          <span>·</span>
          <span>Binance Spot Live Integrated</span>
          <span>·</span>
          <span>محرك التشابه الذاتي للعملات الرقمية</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>خوارزميات خالية من التسريب الزمني</span>
          <span>·</span>
          <span>Paper Mode (وضع التحليل والاختبار فقط)</span>
        </div>
      </footer>
    </div>
  );
}
