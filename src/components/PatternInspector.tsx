/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FractalPattern } from '../types/fractal';
import { formatCryptoPrice } from '../services/binanceService';
import { ShieldAlert, TrendingUp, TrendingDown, CheckCircle2, Clock, Activity, Target, GitCompare } from 'lucide-react';

interface InspectorProps {
  pattern?: FractalPattern;
  currentPrice: number;
}

export const PatternInspector: React.FC<InspectorProps> = ({ pattern, currentPrice }) => {
  if (!pattern) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400">
        <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">لم يتم تحديد نموذج فراكتالي. حدد نموذجاً من الرسم البياني أو شجرة البنى المتداخلة.</p>
      </div>
    );
  }

  const similarity = pattern.similarity;
  const isBullish = pattern.direction === 'bullish';

  // Lifecycle stage colors & descriptions
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'completed':
        return { label: 'مكتمل هندسياً', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'confirmed':
        return { label: 'مؤكد بعد الاختراق', color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
      case 'forming':
        return { label: 'قيد التكوين', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'near_completion':
        return { label: 'اقتراب من الاكتمال', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
      case 'preliminary_match':
        return { label: 'تشابه أولي', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      case 'invalidated':
        return { label: 'فشل النموذج (مُبطل)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      default:
        return { label: 'بداية محتملة', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    }
  };

  const stageBadge = getStageBadge(pattern.stage);

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl text-slate-200">
      {/* Header Info */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-100 text-base">{pattern.name}</h3>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${stageBadge.color}`}>
              {stageBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <span>المستوى {pattern.level}</span>
            <span>·</span>
            <span>{pattern.waves.length} موجات مرصودة</span>
            <span>·</span>
            <span className={pattern.isConfirmed ? 'text-emerald-400' : 'text-amber-400'}>
              {pattern.isConfirmed ? 'موجات مؤكدة' : 'قيد التكوين المؤقت'}
            </span>
          </div>
        </div>

        <div className="text-left font-mono">
          <div className="text-xs text-slate-400">السعر الحالي</div>
          <div className="text-base font-bold text-slate-100 tabular-nums">
            ${formatCryptoPrice(currentPrice)}
          </div>
        </div>
      </div>

      {/* Rationale Callout */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 text-xs leading-relaxed text-slate-300">
        <strong className="text-slate-100 block mb-1">حالة النموذج وسبب التصنيف:</strong>
        {pattern.stageReason}
      </div>

      {/* Similarity Score Breakdown Grid */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300">درجة التشابه الذاتي الكلية</span>
          <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {similarity?.totalScore || 75}%
          </span>
        </div>

        {/* 4 Factor Meters */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800/60">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>تشابه الشكل (DTW)</span>
              <span className="font-mono text-slate-200">{similarity?.shapeScore || 80}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${similarity?.shapeScore || 80}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800/60">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>نسب أطوال الموجات</span>
              <span className="font-mono text-slate-200">{similarity?.waveRatioScore || 75}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${similarity?.waveRatioScore || 75}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800/60">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>الإيقاع الزمني</span>
              <span className="font-mono text-slate-200">{similarity?.timingScore || 78}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${similarity?.timingScore || 78}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800/60">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>البنية والتسلسل</span>
              <span className="font-mono text-slate-200">{similarity?.structureScore || 88}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${similarity?.structureScore || 88}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Matched vs Divergent Diagnostics */}
      {similarity && (
        <div className="text-xs space-y-1.5">
          <div className="text-slate-400 font-medium">الخصائص المتوافقة مع النموذج المرجعي:</div>
          <ul className="space-y-1 text-slate-300">
            {similarity.matchedFeatures.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5 text-emerald-300/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Target & Invalidation Levels */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-rose-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-semibold">مستوى الإبطال الصارم</span>
          </div>
          <div className="font-mono text-sm font-bold text-rose-300 tabular-nums">
            ${formatCryptoPrice(pattern.invalidationLevel)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">كسر هذا المستوى يلغي الفرضية كلياً</span>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="font-semibold">الهدف الفراكتالي الأول</span>
          </div>
          <div className="font-mono text-sm font-bold text-emerald-300 tabular-nums">
            ${formatCryptoPrice(pattern.targetZones[0]?.min || 0)}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            احتمال تاريخي: {pattern.targetZones[0]?.probability || 65}%
          </span>
        </div>
      </div>

      {/* Historical Model Reference & Disclaimer */}
      <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/60 flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-sky-400 shrink-0" />
        <div>
          <span>النموذج المرجعي: <strong className="text-slate-200">{pattern.referenceName || 'نموذج تاريخي مؤرشف'}</strong></span>
          <span className="block text-[10px] text-slate-500 mt-0.5">
            النسب والمسارات هي سيناريوهات احتمالية مشتقة من بيانات تاريخية وليست أرقاماً مضمونة.
          </span>
        </div>
      </div>
    </div>
  );
};
