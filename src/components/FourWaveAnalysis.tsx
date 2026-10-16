/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FractalPattern, Wave } from '../types/fractal';
import { evaluateFourWaveHypothesis } from '../utils/fourWaveEngine';
import { Zap, Gauge, RefreshCw, BarChart2, ShieldCheck, HelpCircle } from 'lucide-react';

interface FourWaveProps {
  activePattern?: FractalPattern;
}

export const FourWaveAnalysis: React.FC<FourWaveProps> = ({ activePattern }) => {
  const waves: Wave[] = activePattern?.waves || [];
  const metrics = evaluateFourWaveHypothesis(waves);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-base">تحليل فرضية الموجات الأربع (4-Wave Self-Similarity Hypothesis)</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          وضع اختباري تجريبي للتشابه الذاتي
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mb-6">
        تدرس هذه الفرضية ما إذا كانت البنية الحالية تتكون من أربع حركات متسلسلة مترابطة: اندفاع أولي (W1)،
        ثم إعادة تكوين أو امتداد مكرر (W2)، ثم موجة تذبذب وتجميع زمني (W3)، وموجة رابعة تقارن بالثالثة مع فحص الموجة الرابطة (Bridge Wave).
      </p>

      {/* Main Score Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs text-slate-400 block mb-1">معدل التوافق الإجمالي مع الفرضية</span>
          <p className="text-xs text-slate-300 font-medium">{metrics.statusText}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {metrics.overallScore}%
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {metrics.overallScore >= 70 ? 'توافق قوي' : metrics.overallScore >= 50 ? 'توافق جزئي' : 'بنية حرة'}
          </span>
        </div>
      </div>

      {/* 4 Waves Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Wave 1 */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold text-sky-400">الموجة الأولى (W1) - الاندفاع والزخم</span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>سرعة الحركة السعرية:</span>
            <span className="font-mono text-slate-200">{metrics.wave1Speed} % / شمعة</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            تقيس سرعة التغير والزخم لبناء الأساس المرجعي للبنية الفراكتالية.
          </p>
        </div>

        {/* Wave 2 */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold text-amber-400">الموجة الثانية (W2) - التشابه والامتداد</span>
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>تناسب الحجم مع W1:</span>
            <span className="font-mono text-slate-200">{metrics.wave2ReplicaRatio}%</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            تتحقق من مدى كون الموجة الثانية امتداداً تناغمياً أو إعادة تكرار لخصائص الموجة الأولى.
          </p>
        </div>

        {/* Wave 3 */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold text-purple-400">الموجة الثالثة (W3) - السلوك الزمني والتذبذب</span>
            <BarChart2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>مؤشر التذبذب الزمني:</span>
            <span className="font-mono text-slate-200">{metrics.wave3Volatility}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal">
            تدرس مدى تمايز الموجة الثالثة زمنياً وتذبذبياً مقارنة بموجات الاندفاع المباشر.
          </p>
        </div>

        {/* Wave 4 */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="font-semibold text-emerald-400">الموجة الرابعة (W4) - التناظر الهندسي</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>التناظر مع W3:</span>
            <span className="font-mono text-slate-200">{metrics.wave4StructureScore}%</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>الموجة الرابطة (Bridge Wave):</span>
            <span className={`font-medium ${metrics.bridgeWaveDetected ? 'text-emerald-400' : 'text-slate-400'}`}>
              {metrics.bridgeWaveDetected ? 'مرصودة بنجاح' : 'غير ظاهرة'}
            </span>
          </div>
        </div>
      </div>

      {/* Cautionary Note from Section 7 */}
      <div className="mt-5 p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300/80 flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>تنبيه منهجي:</strong> فرضية الموجات الأربع هي أداة بحثية ومقارنة علمية. النظام لا يُجبر السوق على حركات رباعية عند وجود نماذج دافعة ثلاثية أو خماسية أو تصحيحات ثنائية، بل يقيس بدقة درجة التشابه الرياضي لكل تركيبة.
        </span>
      </div>
    </div>
  );
};
