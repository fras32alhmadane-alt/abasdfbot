/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FractalPattern } from '../types/fractal';
import { Network, ArrowUpRight, ArrowDownRight, Layers, CornerDownLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface TreeProps {
  patterns: FractalPattern[];
  selectedPatternId?: string;
  onSelectPattern: (id: string) => void;
}

export const FractalTreeView: React.FC<TreeProps> = ({
  patterns,
  selectedPatternId,
  onSelectPattern,
}) => {
  const macroPatterns = patterns.filter((p) => p.level === 1);
  const interPatterns = patterns.filter((p) => p.level === 2);
  const microPatterns = patterns.filter((p) => p.level === 3);

  const getRelationBadge = (rel?: string) => {
    switch (rel) {
      case 'impulse_continuation':
        return { label: 'امتداد دافع متسق', color: 'text-emerald-400 bg-emerald-500/10' };
      case 'internal_correction':
        return { label: 'تصحيح داخلي ضمن النموذج الأب', color: 'text-amber-400 bg-amber-500/10' };
      case 'discordant':
        return { label: 'بنية متنافرة غير متوافقة', color: 'text-rose-400 bg-rose-500/10' };
      default:
        return { label: 'نموذج مرجعي رئيسي', color: 'text-blue-400 bg-blue-500/10' };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-base">شجرة البنى الفراكتالية المتداخلة (Nested Fractal Tree)</h2>
        </div>
        <span className="text-xs text-slate-400">
          تفاعل هرمي متعدد المقاييس (Multi-Scale Decomposition)
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-6">
        تدرس هذه الوحدة العلاقات الهندسية بين الحركات الكبرى (المستوى الأول) والحركات الوسيطة والصغرى المتشكلة بداخلها.
        انقر على أي عقدة في الشجرة لعرض تفاصيلها وتحديث نافذة الرسم البياني.
      </p>

      {/* Tree Visualization Container */}
      <div className="space-y-6">
        {/* Level 1: Macro Pattern */}
        {macroPatterns.map((macro) => {
          const isSelected = selectedPatternId === macro.id;
          const relation = getRelationBadge(macro.relationToParent);

          return (
            <div key={macro.id} className="relative">
              {/* Macro Node Box */}
              <div
                onClick={() => onSelectPattern(macro.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/40 shadow-lg'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      المستوى 1 (كلي Macro)
                    </span>
                    <h3 className="font-semibold text-sm text-slate-100">{macro.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {macro.waves.length} موجات
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      {macro.direction === 'bullish' ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" /> صاعد
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" /> هابط
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      تشابه {macro.similarity?.totalScore || 80}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>النطاق السعري: <strong className="text-slate-200 font-mono">{macro.minPrice.toFixed(1)} - {macro.maxPrice.toFixed(1)}</strong></span>
                  <span>·</span>
                  <span>المرحلة: <strong className="text-slate-200">{macro.stage}</strong></span>
                  <span>·</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] ${relation.color}`}>
                    {relation.label}
                  </span>
                </div>
              </div>

              {/* Branch connecting to Intermediate (L2) */}
              <div className="mr-8 pr-4 border-r-2 border-slate-800 space-y-4 mt-4">
                {interPatterns.map((inter) => {
                  const isInterSelected = selectedPatternId === inter.id;
                  const interRel = getRelationBadge(inter.relationToParent);

                  return (
                    <div key={inter.id} className="relative">
                      {/* Intermediate Node Box */}
                      <div
                        onClick={() => onSelectPattern(inter.id)}
                        className={`cursor-pointer p-3.5 rounded-lg border transition-all ${
                          isInterSelected
                            ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/40 shadow-md'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <CornerDownLeft className="w-3.5 h-3.5 text-slate-500" />
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              المستوى 2 (وسيط Intermediate)
                            </span>
                            <span className="font-semibold text-xs text-slate-200">{inter.name}</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className={inter.direction === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}>
                              {inter.direction === 'bullish' ? 'صاعد' : 'هابط'}
                            </span>
                            <span className="font-mono font-bold text-amber-400">
                              {inter.similarity?.totalScore || 78}%
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                          <span className={`text-[11px] px-2 py-0.5 rounded ${interRel.color}`}>
                            {interRel.label}
                          </span>
                          <span>·</span>
                          <span className="font-mono">
                            {inter.waves.length} موجات وسيطة
                          </span>
                        </div>
                      </div>

                      {/* Branch connecting to Micro (L3) */}
                      <div className="mr-6 pr-3 border-r-2 border-slate-800/80 space-y-3 mt-3">
                        {microPatterns.map((micro) => {
                          const isMicroSelected = selectedPatternId === micro.id;
                          const microRel = getRelationBadge(micro.relationToParent);

                          return (
                            <div
                              key={micro.id}
                              onClick={() => onSelectPattern(micro.id)}
                              className={`cursor-pointer p-3 rounded-lg border transition-all ${
                                isMicroSelected
                                  ? 'bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/40'
                                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CornerDownLeft className="w-3 h-3 text-slate-500" />
                                  <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    المستوى 3 (مصغر Micro)
                                  </span>
                                  <span className="font-semibold text-xs text-slate-200">{micro.name}</span>
                                </div>

                                <div className="flex items-center gap-3 text-xs">
                                  <span className="font-mono font-bold text-amber-400">
                                    {micro.similarity?.totalScore || 75}%
                                  </span>
                                </div>
                              </div>

                              <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded ${microRel.color}`}>
                                  {microRel.label}
                                </span>
                                <span>·</span>
                                <span className="text-slate-300">
                                  {micro.stageReason}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
