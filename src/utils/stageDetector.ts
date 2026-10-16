/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PatternStage, Wave } from '../types/fractal';

export interface StageAnalysisResult {
  stage: PatternStage;
  stageNameAr: string;
  stageReason: string;
  isConfirmed: boolean;
}

/**
 * Determines current lifecycle stage of candidate fractal structure.
 */
export function determinePatternStage(
  waves: Wave[],
  requiredWavesCount: number,
  similarityScore: number,
  currentPrice: number,
  invalidationLevel: number,
  confirmationLevel: number,
  direction: 'bullish' | 'bearish'
): StageAnalysisResult {
  if (waves.length === 0) {
    return {
      stage: 'none',
      stageNameAr: 'لا يوجد نموذج واضح',
      stageReason: 'لم يتم رصد حركات موجية مترابطة كافية في النطاق الحالي.',
      isConfirmed: false,
    };
  }

  // Check Invalidation
  if (direction === 'bullish' && currentPrice < invalidationLevel) {
    return {
      stage: 'invalidated',
      stageNameAr: 'فشل النموذج (مُبطل)',
      stageReason: `تم كسر قاع الإبطال عند السعر ${invalidationLevel.toFixed(2)} مما ألغى الفرضية الهندسية.`,
      isConfirmed: false,
    };
  }
  if (direction === 'bearish' && currentPrice > invalidationLevel) {
    return {
      stage: 'invalidated',
      stageNameAr: 'فشل النموذج (مُبطل)',
      stageReason: `تم اختراق قمة الإبطال عند السعر ${invalidationLevel.toFixed(2)} مما ألغى الفرضية الهندسية.`,
      isConfirmed: false,
    };
  }

  // Check Confirmation Breakout
  if (direction === 'bullish' && currentPrice >= confirmationLevel && waves.length >= requiredWavesCount) {
    return {
      stage: 'confirmed',
      stageNameAr: 'مؤكد بعد الاختراق',
      stageReason: `اخترق السعر مستوى التأكيد ${confirmationLevel.toFixed(2)} بحجم كافٍ بعد اكتمال البنية الفراكتالية.`,
      isConfirmed: true,
    };
  }
  if (direction === 'bearish' && currentPrice <= confirmationLevel && waves.length >= requiredWavesCount) {
    return {
      stage: 'confirmed',
      stageNameAr: 'مؤكد بعد الكسر',
      stageReason: `كسر السعر مستوى التأكيد ${confirmationLevel.toFixed(2)} بعد اكتمال بنية النموذج التوزيعي.`,
      isConfirmed: true,
    };
  }

  // Wave count checks
  if (waves.length === 1) {
    return {
      stage: 'potential_start',
      stageNameAr: 'بداية نموذج محتمل',
      stageReason: 'تشكلت موجة دافعة أولية وجارٍ انتظار استجابة التصحيح لتحديد طبيعة الفراكتال.',
      isConfirmed: false,
    };
  }

  if (waves.length === 2) {
    return {
      stage: 'preliminary_match',
      stageNameAr: 'تشابه أولي',
      stageReason: `تظهر الموجتان تشابهاً أولياً بنسبة ${similarityScore.toFixed(0)}% مع احتفاظ التصحيح بمستويات الدعم/المقاومة.`,
      isConfirmed: false,
    };
  }

  if (waves.length < requiredWavesCount) {
    return {
      stage: 'forming',
      stageNameAr: 'نموذج قيد التكوين',
      stageReason: `اكتملت ${waves.length} من أصل ${requiredWavesCount} موجات مطلوبة، مع تطابق هيكلي مستمر.`,
      isConfirmed: false,
    };
  }

  // At required count: check completion vs near completion
  const lastWave = waves[waves.length - 1];
  if (lastWave.status === 'provisional') {
    return {
      stage: 'near_completion',
      stageNameAr: 'اقتراب من الاكتمال',
      stageReason: 'الموجة الأخيرة بلغت النطاق المستهدف هندسياً ولا تزال بانتظار التأكيد الإحصائي النهائي.',
      isConfirmed: false,
    };
  }

  return {
    stage: 'completed',
    stageNameAr: 'مكتمل هندسياً',
    stageReason: `اكتملت جميع الموجات (${requiredWavesCount}) هندسياً مع درجة تشابه ${similarityScore.toFixed(0)}%، وبانتظار تفعيل الاختراق لتأكيد المسار.`,
    isConfirmed: false,
  };
}
