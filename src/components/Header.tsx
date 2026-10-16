/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TIMEFRAMES, TimeframeOption } from '../utils/marketData';
import { CryptoPair } from '../types/crypto';
import { Sliders, RefreshCw, Search, Star, Radar, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  selectedPair: CryptoPair;
  onOpenCryptoSelector: () => void;
  onToggleFavorite: (symbol: string) => void;
  selectedTimeframe: TimeframeOption;
  onSelectTimeframe: (tf: TimeframeOption) => void;
  onOpenSettings: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  unreadAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  selectedPair,
  onOpenCryptoSelector,
  onToggleFavorite,
  selectedTimeframe,
  onSelectTimeframe,
  onOpenSettings,
  onRefreshData,
  isRefreshing,
  unreadAlertsCount,
}) => {
  const tabs = [
    { id: 'chart', label: 'الرسم البياني والتحليل' },
    { id: 'multi_tf', label: 'فحص الأطر الزمنية' },
    { id: 'scanner', label: 'ماسح العملات الرقمية' },
    { id: 'tree', label: 'شجرة الفراكتال المتداخل' },
    { id: 'four_wave', label: 'فرضية الموجات الـ 4' },
    { id: 'backtest', label: 'الاختبار التاريخي' },
    { id: 'alerts', label: 'التنبيهات' },
    { id: 'docs', label: 'دليل البنية الرياضية' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
            FSDP <span className="text-amber-400 font-normal">| منصة الفراكتال المتداخل</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links (single line, unboxed with subtle hover) */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-400 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
                  isActive
                    ? 'text-amber-400 font-semibold'
                    : 'hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id === 'alerts' && unreadAlertsCount > 0 && (
                  <span className="mr-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                    {unreadAlertsCount}
                  </span>
                )}
                {tab.id === 'scanner' && (
                  <span className="mr-1 px-1.5 py-0.2 rounded text-[10px] bg-sky-500/20 text-sky-300 font-sans">
                    Binance
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Market controls & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dynamic Crypto Pair Selector Button */}
          <button
            onClick={onOpenCryptoSelector}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition-colors cursor-pointer group"
            title="اختيار زوج عملات رقمية من Binance"
          >
            <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-1.5">
              <strong className="text-slate-100">{selectedPair.baseAsset}</strong>
              <span className="text-[11px] text-slate-500 font-mono">/USDT</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Quick Favorite Toggle */}
          <button
            onClick={() => onToggleFavorite(selectedPair.symbol)}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors"
            title={selectedPair.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Star className={`w-4 h-4 ${selectedPair.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
          </button>

          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe.value}
            onChange={(e) => {
              const tf = TIMEFRAMES.find((item) => item.value === e.target.value);
              if (tf) onSelectTimeframe(tf);
            }}
            aria-label="اختيار الإطار الزمني"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-medium text-amber-400 focus:outline-hidden hover:border-slate-700 cursor-pointer"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="تحديث البيانات السعرية اللحظية"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="إعدادات المحرك والأوزان"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">المعايرة</span>
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Nav row */}
      <div className="flex xl:hidden items-center gap-2 overflow-x-auto pt-2 pb-1 text-xs border-t border-slate-800/60 mt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded text-xs transition-colors ${
              currentTab === tab.id
                ? 'bg-amber-500/20 text-amber-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
