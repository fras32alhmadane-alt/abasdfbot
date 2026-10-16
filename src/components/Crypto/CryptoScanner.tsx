/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CryptoPair, ScannerResult } from '../../types/crypto';
import { PlatformConfig } from '../../types/fractal';
import { scanCryptoPairs } from '../../services/cryptoScannerService';
import { formatCryptoPrice } from '../../services/binanceService';
import { Radar, Play, RotateCcw, ShieldAlert, ArrowUpRight, ArrowDownRight, Layers, ExternalLink, Filter, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ScannerProps {
  pairs: CryptoPair[];
  config: PlatformConfig;
  selectedTimeframe: string;
  onSelectPairAndNavigate: (symbol: string) => void;
}

export const CryptoScanner: React.FC<ScannerProps> = ({
  pairs,
  config,
  selectedTimeframe,
  onSelectPairAndNavigate,
}) => {
  const [scanScope, setScanScope] = useState<'top20' | 'favorites' | 'top40'>('top20');
  const [activeTimeframe, setActiveTimeframe] = useState<string>(selectedTimeframe);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ scanned: number; total: number }>({ scanned: 0, total: 0 });
  const [results, setResults] = useState<ScannerResult[]>([]);
  const [hasScanned, setHasScanned] = useState<boolean>(false);

  const handleStartScan = async () => {
    setIsScanning(true);
    setHasScanned(true);

    let targetPairs = [...pairs];
    if (scanScope === 'favorites') {
      targetPairs = pairs.filter((p) => p.isFavorite);
      if (targetPairs.length === 0) targetPairs = pairs.slice(0, 10);
    } else if (scanScope === 'top20') {
      targetPairs = pairs.slice(0, 20);
    } else {
      targetPairs = pairs.slice(0, 40);
    }

    setProgress({ scanned: 0, total: targetPairs.length });

    try {
      const scanOutput = await scanCryptoPairs(
        targetPairs,
        activeTimeframe,
        config,
        (scanned, total) => setProgress({ scanned, total })
      );
      setResults(scanOutput);
    } finally {
      setIsScanning(false);
    }
  };

  // Run scan once on mount if empty
  React.useEffect(() => {
    if (!hasScanned && pairs.length > 0) {
      handleStartScan();
    }
  }, [pairs.length]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base text-slate-100">
              ماسح الفراكتال الذاتي للعملات الرقمية (Crypto Fractal Scanner)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            فحص أزواج Binance Spot لاكتشاف الحركات الصغرى التي تمثل البنية الأكبر وترتيبها حسب جودة التشابه
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Scope Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">نطاق الفحص:</span>
            <select
              value={scanScope}
              onChange={(e) => setScanScope(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-hidden"
            >
              <option value="top20">أعلى 20 زوجاً سيولة</option>
              <option value="favorites">قائمة المفضلة فقط</option>
              <option value="top40">أعلى 40 زوجاً</option>
            </select>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">الفريم:</span>
            <select
              value={activeTimeframe}
              onChange={(e) => setActiveTimeframe(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-amber-400 font-mono text-xs focus:outline-hidden"
            >
              <option value="15m">15 دقيقة</option>
              <option value="1h">ساعة واحدة (1h)</option>
              <option value="4h">4 ساعات (4h)</option>
              <option value="1d">يومي (1d)</option>
            </select>
          </div>

          {/* Trigger Scan Button */}
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>جارٍ المسح ({progress.scanned}/{progress.total})...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>بدء مسح السوق</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Strict Methodology Disclaimer */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed text-[11px] text-slate-400">
          <strong className="text-slate-200">شرط الصرامة الفراكتالية:</strong> لا يعرض الماسح أي زوج إلا عند ثبوت أدلة كافية على التشابه الذاتي الهندسي والزمني (تجاوز عتبة {config.minSimilarityThreshold}%). النتائج مرتبة تنازلياً حسب جودة التناغم، والمستويات السعرية هي تقديرات احتمالية مشتقة من مسار النموذج المرجعي.
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4 font-medium">العملة والرمز</th>
              <th className="py-3 px-3 font-medium">السعر اللحظي</th>
              <th className="py-3 px-3 font-medium">نسبة التشابه البنيوي</th>
              <th className="py-3 px-3 font-medium">التناغم الزمني</th>
              <th className="py-3 px-3 font-medium">مرحلة النموذج</th>
              <th className="py-3 px-3 font-medium">موضع الحركة داخل الكبرى</th>
              <th className="py-3 px-3 font-medium">مستويات الإبطال / التأكيد</th>
              <th className="py-3 px-3 font-medium">الهدف الاحتمالي</th>
              <th className="py-3 px-4 font-medium text-center">الإجراء</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
            {isScanning && results.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                  <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                  <p>جارٍ فحص أزواج التداول وحساب التشابه الفراكتالي شمعة بشمعة...</p>
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                  لم يتم رصد أي زوج يتجاوز عتبة التشابه الصارمة ({config.minSimilarityThreshold}%) على فريم {activeTimeframe}.
                  يمكنك توسيع نطاق الفحص أو تعديل العتبة من قائمة المعايرة.
                </td>
              </tr>
            ) : (
              results.map((res) => (
                <tr key={res.symbol} className="hover:bg-slate-800/30 transition-colors">
                  {/* Symbol */}
                  <td className="py-3 px-4 font-sans">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-100">{res.baseAsset}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">/USDT</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">فريم {res.timeframe}</span>
                  </td>

                  {/* Price & Change */}
                  <td className="py-3 px-3 tabular-nums font-semibold text-slate-100">
                    ${formatCryptoPrice(res.price)}
                    <span className={`block text-[10px] ${res.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {res.change24h >= 0 ? `+${res.change24h.toFixed(1)}%` : `${res.change24h.toFixed(1)}%`}
                    </span>
                  </td>

                  {/* Similarity Score */}
                  <td className="py-3 px-3 tabular-nums font-bold text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{res.similarityScore.toFixed(0)}%</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
                        res.confidenceGrade === 'فائق' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {res.confidenceGrade}
                      </span>
                    </div>
                  </td>

                  {/* Timing Score */}
                  <td className="py-3 px-3 tabular-nums text-slate-300">
                    {res.timingScore.toFixed(0)}%
                  </td>

                  {/* Stage */}
                  <td className="py-3 px-3 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      res.stage === 'completed'
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                        : res.stage === 'confirmed'
                        ? 'text-sky-400 bg-sky-500/10 border border-sky-500/30'
                        : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                    }`}>
                      {res.stage === 'completed' ? 'مكتمل هندسياً' : res.stage === 'confirmed' ? 'مؤكد بعد الاختراق' : 'قيد التكوين'}
                    </span>
                  </td>

                  {/* Position in Macro */}
                  <td className="py-3 px-3 font-sans text-xs text-slate-300">
                    <div className="flex items-center gap-1 text-[11px] text-sky-300">
                      <Layers className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                      <span>{res.positionInMacro}</span>
                    </div>
                  </td>

                  {/* Invalidation & Confirmation */}
                  <td className="py-3 px-3 tabular-nums text-[11px] text-slate-400">
                    <div>إبطال: <span className="text-rose-400 font-bold">${formatCryptoPrice(res.invalidationPrice)}</span></div>
                    <div>تأكيد: <span className="text-sky-400">${formatCryptoPrice(res.confirmationPrice)}</span></div>
                  </td>

                  {/* Target Price */}
                  <td className="py-3 px-3 tabular-nums text-emerald-400 font-bold">
                    ${formatCryptoPrice(res.targetPrice)}
                    <span className="block text-[10px] text-slate-500 font-sans font-normal">
                      R:R {res.riskRewardRatio}x
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 font-sans text-center">
                    <button
                      onClick={() => onSelectPairAndNavigate(res.symbol)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-medium transition-all flex items-center gap-1 mx-auto"
                    >
                      <span>تحليل وشارت</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
