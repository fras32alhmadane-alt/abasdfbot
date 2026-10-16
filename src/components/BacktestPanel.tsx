/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BacktestSummary, BacktestTrade, Candle, PlatformConfig } from '../types/fractal';
import { runWalkForwardBacktest } from '../utils/backtestEngine';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, TrendingUp, Filter } from 'lucide-react';

interface BacktestProps {
  candles: Candle[];
  config: PlatformConfig;
  assetSymbol: string;
  timeframe: string;
}

export const BacktestPanel: React.FC<BacktestProps> = ({
  candles,
  config,
  assetSymbol,
  timeframe,
}) => {
  const [minSimilarity, setMinSimilarity] = useState<number>(75);
  const [lookbackBars, setLookbackBars] = useState<number>(180);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<{
    summary: BacktestSummary;
    trades: BacktestTrade[];
  } | null>(null);

  const handleRunBacktest = () => {
    setIsLoading(true);
    setTimeout(() => {
      const result = runWalkForwardBacktest(candles, config, {
        minSimilarity,
        lookbackBars,
        stepSize: 2,
      });
      setBacktestResult(result);
      setIsLoading(false);
    }, 250);
  };

  // Run initial test on mount if not done
  React.useEffect(() => {
    if (!backtestResult && candles.length > 50) {
      handleRunBacktest();
    }
  }, [candles.length]);

  const summary = backtestResult?.summary;
  const trades = backtestResult?.trades || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-base">محرك الاختبار التاريخي الصارم (Walk-Forward Backtesting)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            اختبار خوارزميات الفراكتال دون تسريب لمعلومات المستقبل (No Lookahead Bias) على الأصل {assetSymbol} بإطار {timeframe}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">عتبة التشابه:</span>
            <select
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-hidden"
            >
              <option value={70}>≥ 70% (شامل)</option>
              <option value={75}>≥ 75% (متوازن)</option>
              <option value={80}>≥ 80% (صارم)</option>
              <option value={85}>≥ 85% (فائق التناغم)</option>
            </select>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>بدء الاختبار</span>
          </button>
        </div>
      </div>

      {/* Methodology Disclaimer Banner from Section 14 */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-3 mb-6">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-slate-200">الضمانات المنهجية لمنع الخداع الإحصائي:</p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            يتم فحص البيانات شمعة بشمعة وفق تسلسل Walk-Forward، بحيث تكون الحسابات عند الشمعة <em>t</em> معتمدة حصرياً على البيانات المتاحة حتى تلك اللحظة دون استقراء مستقبلي. لا تدعي المنصة نسب ربح مطلقة، بل تقدم حقائق اختبار العينة بشفافية.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 block mb-1">إجمالي الإشارات المرصودة</span>
            <div className="text-lg font-bold font-mono text-slate-100 tabular-nums">
              {summary.totalSignals}
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 block mb-1">نسبة تحقيق الهدف (Win Rate)</span>
            <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
              {summary.winRate}%
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 block mb-1">نسبة الإبطال (Stop Rate)</span>
            <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
              {summary.invalidationRate}%
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 block mb-1">عامل الربحية (Profit Factor)</span>
            <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
              {summary.profitFactor.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 block mb-1">العائد المتوقع لكل إشارة</span>
            <div className="text-lg font-bold font-mono text-sky-400 tabular-nums">
              {summary.expectedValue >= 0 ? `+${summary.expectedValue}%` : `${summary.expectedValue}%`}
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
            <span className="text-[11px] text-slate-400 block mb-1">أقصى تراجع (Max Drawdown)</span>
            <div className="text-lg font-bold font-mono text-slate-300 tabular-nums">
              -{summary.maxDrawdownPct}%
            </div>
          </div>
        </div>
      )}

      {/* Score Tier Breakdown Table */}
      {summary && summary.byScoreTier.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">توزيع النتائج بحسب درجة التشابه الفراكتالي:</h3>
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-medium">نطاق درجة التشابه</th>
                  <th className="py-2.5 px-3 font-medium">عدد الإشارات</th>
                  <th className="py-2.5 px-3 font-medium">نسبة النجاح</th>
                  <th className="py-2.5 px-3 font-medium">عامل الربحية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                {summary.byScoreTier.map((tier, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-sans font-medium text-slate-300">{tier.tier}</td>
                    <td className="py-2 px-3 tabular-nums">{tier.signals}</td>
                    <td className="py-2 px-3 tabular-nums text-emerald-400">{tier.winRate}%</td>
                    <td className="py-2 px-3 tabular-nums text-amber-400">{tier.profitFactor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Signals Ledger Table */}
      <div>
        <h3 className="text-xs font-semibold text-slate-300 mb-2">سجل الإشارات التاريخية المنفذة:</h3>
        <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-3 font-medium">النموذج والاتجاه</th>
                <th className="py-2.5 px-3 font-medium">التشابه</th>
                <th className="py-2.5 px-3 font-medium">سعر الدخول</th>
                <th className="py-2.5 px-3 font-medium">الهدف / الإبطال</th>
                <th className="py-2.5 px-3 font-medium">سعر الخروج</th>
                <th className="py-2.5 px-3 font-medium">النتيجة</th>
                <th className="py-2.5 px-3 font-medium">العائد %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-slate-200">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                    لا توجد صفقات مطابقة للمعايير الحالية. جرب خفض عتبة التشابه.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-sans text-slate-300">{t.patternName}</td>
                    <td className="py-2 px-3 tabular-nums text-amber-400">{t.similarityScore.toFixed(0)}%</td>
                    <td className="py-2 px-3 tabular-nums">{t.entryPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 tabular-nums text-slate-400">
                      <span className="text-emerald-400">{t.targetPrice.toFixed(1)}</span> /{' '}
                      <span className="text-rose-400">{t.stopPrice.toFixed(1)}</span>
                    </td>
                    <td className="py-2 px-3 tabular-nums">{t.exitPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 font-sans">
                      {t.outcome === 'win_target' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> تحقيق الهدف
                        </span>
                      ) : t.outcome === 'loss_invalidation' ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> كسر الإبطال
                        </span>
                      ) : (
                        <span className="text-slate-400">مفتوحة</span>
                      )}
                    </td>
                    <td className={`py-2 px-3 tabular-nums font-bold ${t.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.returnPct >= 0 ? `+${t.returnPct}%` : `${t.returnPct}%`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
