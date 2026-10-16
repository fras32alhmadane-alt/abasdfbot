/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlatformConfig } from '../types/fractal';
import { Settings, Sliders, X, Check, RotateCcw } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: PlatformConfig;
  onSaveConfig: (newConfig: PlatformConfig) => void;
}

export const SettingsModal: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [form, setForm] = React.useState<PlatformConfig>({ ...config });

  React.useEffect(() => {
    setForm({ ...config });
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    setForm({
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
  };

  const handleSave = () => {
    onSaveConfig(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base">إعدادات محرك الفراكتال والمعايرة الرياضية</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Section: Wave & Swing Detection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2">
              1. حساسية رصد القمم والقيعان ومؤشر ATR
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  حساسية السوينغ (Lookback K): <strong className="text-slate-100 font-mono">{form.swingSensitivity} شموع</strong>
                </label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={form.swingSensitivity}
                  onChange={(e) => setForm({ ...form, swingSensitivity: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">عدد الشموع قبل وبعد النقطة لتأكيد القمة/القاع</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  مضاعف فلتر ATR: <strong className="text-slate-100 font-mono">{form.atrMultiplier}x</strong>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={form.atrMultiplier}
                  onChange={(e) => setForm({ ...form, atrMultiplier: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">تصفية التذبذبات الصغيرة الأقل من تقلب السوق</span>
              </div>
            </div>
          </div>

          {/* Section: Similarity Weights */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2">
              2. أوزان قياس درجة التشابه (Similarity Weights)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">
                  وزن الشكل الهندسي (Shape w1): <strong className="text-slate-100 font-mono">{(form.weightShape * 100).toFixed(0)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={form.weightShape}
                  onChange={(e) => setForm({ ...form, weightShape: Number(e.target.value) })}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  وزن نسب أطوال الموجات (Ratios w2): <strong className="text-slate-100 font-mono">{(form.weightRatios * 100).toFixed(0)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                  value={form.weightRatios}
                  onChange={(e) => setForm({ ...form, weightRatios: Number(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  وزن التناظر الزمني (Timing w3): <strong className="text-slate-100 font-mono">{(form.weightTiming * 100).toFixed(0)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={form.weightTiming}
                  onChange={(e) => setForm({ ...form, weightTiming: Number(e.target.value) })}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  وزن البنية والتسلسل (Structure w4): <strong className="text-slate-100 font-mono">{(form.weightStructure * 100).toFixed(0)}%</strong>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={form.weightStructure}
                  onChange={(e) => setForm({ ...form, weightStructure: Number(e.target.value) })}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Method & Hypotheses */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-100 text-sm border-b border-slate-800 pb-2">
              3. طريقة التطبيع والفرضيات
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">طريقة تطبيع السعر</label>
                <select
                  value={form.normalizationMethod}
                  onChange={(e) => setForm({ ...form, normalizationMethod: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden"
                >
                  <option value="min_max">تطبيع النطاق الشامل (Min-Max Box)</option>
                  <option value="start_end">تطبيع نسبي من البداية للنهاية (Start-End Relative)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">الحد الأدنى لدرجة التشابه المقبولة</label>
                <select
                  value={form.minSimilarityThreshold}
                  onChange={(e) => setForm({ ...form, minSimilarityThreshold: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden font-mono"
                >
                  <option value={65}>65% (اكتشاف مرن واسع)</option>
                  <option value={72}>72% (متوازن - موصى به)</option>
                  <option value={80}>80% (تشابه مرتفع ودقيق)</option>
                  <option value={85}>85% (أقصى صرامة)</option>
                </select>
              </div>
            </div>

            {/* Toggle checkboxes */}
            <div className="pt-2 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableFourWaveHypothesis}
                  onChange={(e) => setForm({ ...form, enableFourWaveHypothesis: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <span>تفعيل وضع فحص فرضية الموجات الأربع (4-Wave Self-Similarity)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.preventLookaheadBias}
                  onChange={(e) => setForm({ ...form, preventLookaheadBias: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <span>منع تسريب معلومات المستقبل وفصل الإشارات المؤكدة عن المؤقتة</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضيات</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>تطبيق التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
