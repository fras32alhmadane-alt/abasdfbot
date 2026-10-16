/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlatformConfig } from '../types/fractal';
import { CryptoPair } from '../types/crypto';
import {
  DeepFractalSearchResult,
  findHighestFractalResonance,
  TimeframeScanMatch,
} from '../services/multiTimeframeSearch';
import { formatCryptoPrice } from '../services/binanceService';
import {
  SearchCode,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  CheckCircle2,
  GitCompare,
  ExternalLink,
  ShieldAlert,
  Target,
} from 'lucide-react';

interface MultiTimeframeProps {
  selectedPair: CryptoPair;
  config: PlatformConfig;
  onApplyTimeframe: (tfValue: string) => void;
}

export const MultiTimeframeScanner: React.FC<MultiTimeframeProps> = ({
  selectedPair,
  config,
  onApplyTimeframe,
}) => {
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [searchResult, setSearchResult] = useState<DeepFractalSearchResult | null>(null);

  const handleStartDeepSearch = async () => {
    setIsSearching(true);
    setProgressPct(10);
    setProgressText('بدء فحص السلاسل الزمنية...');

    try {
      const result = await findHighestFractalResonance(
        selectedPair.symbol,
        config,
        selectedPair.price,
        (tfLabel, pct) => {
          setProgressText(`جارٍ فحص فريم ${tfLabel}...`);
          setProgressPct(pct);
        }
      );
      setSearchResult(result);
    } finally {
      setIsSearching(false);
      setProgressPct(100);
    }
  };

  // Run on mount if no result
  React.useEffect(() => {
    if (!searchResult) {
      handleStartDeepSearch();
    }
  }, [selectedPair.symbol]);

  const best = searchResult?.highestMatch;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <SearchCode className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base text-slate-100">
              الفحص الهرمي للأطر الزمنية (Multi-Timeframe Fractal Search)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            البحث المتسلسل عبر الفريمات (يومي، 4 ساعات، ساعة، 15د، 5د) لاكتشاف الحركة المصغرة ذات أعلى تشابه ذاتي للبنية الأكبر
          </p>
        </div>

        <button
          onClick={handleStartDeepSearch}
          disabled={isSearching}
          className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50 shadow-md shrink-0 cursor-pointer"
        >
          {isSearching ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>{progressText} ({progressPct}%)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>إعادة فحص جميع الفريمات</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar during search */}
      {isSearching && (
        <div className="space-y-1.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400">
            <span>{progressText}</span>
            <span className="font-mono text-amber-400">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Highest Resonant Match Spotlight Banner */}
      {best && (
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-950 to-blue-950/30 border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  أعلى توافق فراكتالي تم اكتشافه
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedPair.baseAsset}/USDT
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <h3 className="text-xl font-bold text-slate-100">
                  فريم {best.timeframeLabel}
                </h3>
                <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                  تشابه {best.similarityScore.toFixed(1)}%
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                رصدت الخوارزمية بنية سعرية مصغرة على فريم <strong>{best.timeframeLabel}</strong> تمثل تكراراً ذاتياً عالي التناغم مع البنية الكبرى للزوج، محققة تطابق شكل هندسي (DTW) بنسبة {best.shapeScore.toFixed(0)}% وتناظر زمني بنسبة {best.timingScore.toFixed(0)}%.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-slate-400">
                <span className="flex items-center gap-1 text-sky-300">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  {best.positionInMacro}
                </span>
                <span>·</span>
                <span>الحالة: <strong className="text-emerald-400">{best.stageNameAr}</strong></span>
                <span>·</span>
                <span>
                  الهدف المقترح: <strong className="text-emerald-400 font-mono">${formatCryptoPrice(best.targetPrice)}</strong> (R:R {best.riskReward}x)
                </span>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="shrink-0 flex flex-col gap-2">
              <button
                onClick={() => onApplyTimeframe(best.timeframe)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg hover:shadow-amber-500/20 cursor-pointer"
              >
                <span>تطبيق هذا الفريم على الرسم البياني</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-slate-500 text-center font-mono">
                ينقل الشارت فوراً إلى فريم {best.timeframeLabel}
              </span>
            </div>
          </div>

          {/* Synchronized Contour Wave Visualizer */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-sky-400" />
                المقارنة البصرية الهندسية: البنية الكبرى (أزرق) مقابل الحركة المصغرة (ذهبي)
              </span>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                  <span>مسار الفراكتال الكلي</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                  <span>مسار الحركة المصغرة المستخرجة</span>
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="w-full h-32 bg-slate-950/80 rounded-xl border border-slate-800/80 p-2 relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="25" x2="400" y2="25" stroke="rgba(51, 65, 85, 0.3)" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(51, 65, 85, 0.3)" strokeDasharray="3 3" />
                <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(51, 65, 85, 0.3)" strokeDasharray="3 3" />

                {/* Macro Wave (Sky Blue) */}
                {best.macroNormalized.length > 1 && (
                  <path
                    d={best.macroNormalized
                      .map((pt, idx) => {
                        const x = pt.t * 400;
                        const y = 90 - pt.p * 80;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Micro Wave (Amber Gold) */}
                {best.microNormalized.length > 1 && (
                  <path
                    d={best.microNormalized
                      .map((pt, idx) => {
                        const x = pt.t * 400;
                        const y = 90 - pt.p * 80;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Grid of all scanned timeframes */}
      {searchResult && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300">
            نتائج فحص بقية الأطر الزمنية على زوج {selectedPair.baseAsset}/USDT:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResult.allTimeframeMatches.map((match) => {
              const isBest = match.timeframe === best?.timeframe;

              return (
                <div
                  key={match.timeframe}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                    isBest
                      ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-sm">
                      فريم {match.timeframeLabel}
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        match.similarityScore >= 80
                          ? 'text-amber-400'
                          : match.similarityScore >= 70
                          ? 'text-sky-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {match.similarityScore.toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <div>
                      <span>الشكل (DTW): </span>
                      <strong className="text-slate-200 font-mono">{match.shapeScore.toFixed(0)}%</strong>
                    </div>
                    <div>
                      <span>الزمن: </span>
                      <strong className="text-slate-200 font-mono">{match.timingScore.toFixed(0)}%</strong>
                    </div>
                    <div>
                      <span>النسب: </span>
                      <strong className="text-slate-200 font-mono">{match.waveRatiosScore.toFixed(0)}%</strong>
                    </div>
                    <div>
                      <span>الهيكل: </span>
                      <strong className="text-slate-200 font-mono">{match.structureScore.toFixed(0)}%</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {match.stageNameAr}
                    </span>
                    <button
                      onClick={() => onApplyTimeframe(match.timeframe)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      فتح الفريم
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
