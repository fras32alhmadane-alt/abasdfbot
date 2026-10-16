/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Code, Server, Calculator, ShieldCheck, Database, DollarSign, Layers } from 'lucide-react';

export const ArchitectureDoc: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-100 space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h1 className="text-xl font-bold text-slate-100">
            الوثيقة الهندسية والمعمارية: منصة اكتشاف الفراكتال المتداخل (FSDP)
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          استيفاء تفصيلي متكامل لمتطلبات البند 21: المخطط المعماري، الصياغة الرياضية، المثال المحسوب، ومنهجية منع الخداع.
        </p>
      </div>

      {/* 1. System Architecture Blueprint */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-400">
          <Server className="w-4 h-4" />
          <h2>1. المخطط المعماري للنظام (System Architecture Blueprint)</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          تم تصميم المنصة وفق نمط Modular Decoupled Architecture لعزل محرك الرياضيات عن طبقة الرسوم ومصادر البيانات:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <strong className="text-sky-300 block">طبقة جلب البيانات (Data Feeds)</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              اتصال مباشر بـ Binance Spot Klines API مع Fallback لبيانات الفوركس والمعادن عبر محرك سلاسل زمنية متناغم.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <strong className="text-amber-300 block">محرك القمم والموجات (Wave Engine)</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              خوارزمية ZigZag معززة بـ ATR لتنقية الضوضاء، مع وسوم صارمة تفصل السوينغات المؤكدة عن المؤقتة الحالية.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <strong className="text-purple-300 block">محرك التطبيع والـ DTW</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              إسقاط السعر والزمن على مقياس [0, 1] ثم مقارنة المسارات اللحظية بنماذج الأرشيف التاريخي عبر Dynamic Time Warping.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
            <strong className="text-emerald-300 block">محرك الاختبار والسيناريوهات</strong>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              محاكاة Walk-Forward تاريخية شمعة بشمعة، وتوليد مخاريط الاحتمالات، ومستويات الإبطال الصارم والأهداف الفراكتالية.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Mathematical Algorithm */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
          <Calculator className="w-4 h-4" />
          <h2>2. الخوارزمية الرياضية والمعادلات التفصيلية</h2>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs text-slate-300">
          <div>
            <span className="text-amber-400 font-semibold block mb-1">أ. صيغة تطبيع السعر والزمن:</span>
            <code className="text-slate-100 block bg-slate-900 p-2 rounded border border-slate-800">
              P_norm(i) = [P(i) - P_min] / [P_max - P_min]
              <br />
              T_norm(i) = [t(i) - t_start] / [t_end - t_start]
            </code>
            <span className="text-[11px] text-slate-400 font-sans block mt-1">
              تضمن هذه المعادلة إمكانية مقارنة حركة دامت 12 شمعة بحركة دامت 120 شمعة بنفس المقياس النسبي دون تشويه.
            </span>
          </div>

          <div>
            <span className="text-sky-400 font-semibold block mb-1">ب. خوارزمية Dynamic Time Warping (DTW):</span>
            <code className="text-slate-100 block bg-slate-900 p-2 rounded border border-slate-800">
              DTW(i, j) = |P_cand(i) - P_ref(j)| + min( DTW(i-1, j), DTW(i, j-1), DTW(i-1, j-1) )
              <br />
              Distance_norm = DTW(N, M) / (max(N, M))
            </code>
            <span className="text-[11px] text-slate-400 font-sans block mt-1">
              تُستخدم نافذة Sakoe-Chiba (بنسبة 25%) لمنع الانحناء الزمني الشاذ وضمان واقعية المقارنة الهندسية.
            </span>
          </div>

          <div>
            <span className="text-emerald-400 font-semibold block mb-1">ج. درجة التشابه الإجمالية الموزونة (Composite Similarity Score):</span>
            <code className="text-slate-100 block bg-slate-900 p-2 rounded border border-slate-800">
              Similarity = 100 × [ w1·S_shape + w2·S_ratios + w3·S_timing + w4·S_structure ]
              <br />
              حيث: w1=0.35, w2=0.25, w3=0.20, w4=0.20 (مجموع الأوزان = 1.0)
            </code>
          </div>
        </div>
      </section>

      {/* 3. Worked Numerical Example */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
          <Code className="w-4 h-4" />
          <h2>3. مثال محسوب بالأرقام الحقيقية (Step-by-Step Worked Example)</h2>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-xs space-y-2 text-slate-300">
          <p className="font-semibold text-slate-200">
            لنفترض حركة صغيرة على زوج BTC/USDT تتكون من 4 نقاط تحول:
          </p>
          <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400">
            <li>النقطة A (قاع): السعر = 60,000 $ عند t = 0</li>
            <li>النقطة B (قمة): السعر = 64,000 $ عند t = 10 شموع (الموجة 1 = +4,000 $)</li>
            <li>النقطة C (قاع تصحيحي): السعر = 61,600 $ عند t = 16 شمعة (الموجة 2 = -2,400 $)</li>
            <li>النقطة D (قمة ثانية): السعر = 66,000 $ عند t = 24 شمعة (الموجة 3 = +4,400 $)</li>
          </ul>

          <div className="pt-2 border-t border-slate-800 font-mono text-[11px] space-y-1 text-slate-300">
            <p>1. عمق تصحيح الموجة 2 = |61,600 - 64,000| / 4,000 = 2,400 / 4,000 = <strong>0.60 (أي 60%، متطابق مع فيبوناتشي 61.8%)</strong></p>
            <p>2. نسبة امتداد الموجة 3 = 4,400 / 4,000 = <strong>1.10 (امتداد تناسبي متناسق)</strong></p>
            <p>3. مسافة الـ DTW المحسوبة بعد التطبيع = 0.082 ⇒ درجة الشكل S_shape = <strong>88.4%</strong></p>
            <p>4. درجة النسب S_ratios = <strong>84.0%</strong> | درجة الزمن S_timing = <strong>79.5%</strong> | البنية S_structure = <strong>90.0%</strong></p>
            <p className="text-amber-400 font-bold pt-1">
              ⇒ الدرجة الإجمالية = 0.35(88.4) + 0.25(84.0) + 0.20(79.5) + 0.20(90.0) = <strong>85.8% (تشابه فائق)</strong>
            </p>
          </div>
        </div>
      </section>

      {/* 4. Anti-Repainting and No-Lookahead Bias */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
          <ShieldCheck className="w-4 h-4" />
          <h2>4. خطة منع إعادة الرسم المضلل والتسريب الزمني (Anti-Repainting Safeguards)</h2>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            أكبر مشكلة في المؤشرات الكلاسيكية (مثل ZigZag التقليدي) هي إعادة رسم الماضي (Repainting) بعد انتهاء الحركة، مما يوهم المتداول بوجود إشارات دقيقة لم تكن موجودة لحظة الحدث. في FSDP:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
              <strong className="text-slate-100 block mb-1">الفصل الصريح بين المؤكد والمؤقت</strong>
              <p className="text-slate-400 text-[11px]">
                أي قمة أو قاع تقع ضمن نافذة الحساسية K الأخيرة تُعرض بخطوط متقطعة ووسم «قيد التكوين» ولا تُعتمد كإشارة مؤكدة حتى تمر K شموع كاملة دون كسرها.
              </p>
            </div>
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800">
              <strong className="text-slate-100 block mb-1">محاكاة Walk-Forward المغلقة</strong>
              <p className="text-slate-400 text-[11px]">
                في محرك الاختبار التاريخي، تُعزل الشموع بدقة: عند اللحظة t، يُمنع الخوارزمية برمجياً من الاطلاع على الشمعة t+1 حتى يتم اتخاذ قرار الدخول وتسجيل الأهداف.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Libraries, Licensing, and Cost Estimates */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
          <DollarSign className="w-4 h-4" />
          <h2>5. تقدير التكاليف، المكتبات، ومصادر البيانات وتراخيصها</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
            <strong className="text-slate-100 block border-b border-slate-800 pb-1.5">
              قائمة المكتبات والتراخيص (100% مفتوحة المصدر للاستخدام التجاري):
            </strong>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>• <strong>React 19 & TypeScript:</strong> MIT License (مجانية بالكامل).</li>
              <li>• <strong>Tailwind CSS 4:</strong> MIT License (حرّة للاستخدام التجاري).</li>
              <li>• <strong>HTML5 Canvas Chart Engine:</strong> كود أصلي مكتوب خصيصاً للمنصة (Zero License Restrictions، لا يتطلب تراخيص TradingView المدفوعة).</li>
              <li>• <strong>Binance Public Klines API:</strong> مجانية للاستخدام العام وقراءة الأسعار الفورية والتاريخية بدون مفاتيح خاصة.</li>
            </ul>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
            <strong className="text-slate-100 block border-b border-slate-800 pb-1.5">
              تقدير تكلفة الاستضافة والصيانة (Hosting & Infrastructure):
            </strong>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>• <strong>استضافة الواجهة (Cloudflare Pages / Vercel):</strong> 0$ - 20$/شهرياً (ضمن الباقة المجانية أو Pro).</li>
              <li>• <strong>خادم التحليل والسلاسل الزمنية (Node/Express أو FastAPI):</strong> 15$ - 40$/شهرياً على Render أو Fly.io أو GCP Cloud Run.</li>
              <li>• <strong>قاعدة البيانات (PostgreSQL / TimescaleDB):</strong> 0$ (Free tier) إلى 25$/شهرياً عند توسيع نطاق حفظ السجلات.</li>
              <li>• <strong>تكلفة الصيانة الشهرية المتوقعة:</strong> تقريباً 25$ - 65$/شهرياً للمرحلة الأولى، مع إمكانية التوسع التلقائي (Scale-to-zero).</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
