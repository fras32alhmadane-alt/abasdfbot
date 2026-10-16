/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CryptoPair } from '../../types/crypto';
import { formatCryptoPrice } from '../../services/binanceService';
import { Search, Star, TrendingUp, TrendingDown, X, Sparkles, Flame, Check } from 'lucide-react';

interface SelectorProps {
  isOpen: boolean;
  onClose: () => void;
  pairs: CryptoPair[];
  selectedSymbol: string;
  onSelectPair: (pair: CryptoPair) => void;
  onToggleFavorite: (symbol: string) => void;
}

export const CryptoMarketSelector: React.FC<SelectorProps> = ({
  isOpen,
  onClose,
  pairs,
  selectedSymbol,
  onSelectPair,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'volume' | 'gainers'>('all');

  const filteredPairs = useMemo(() => {
    let list = [...pairs];

    // Filter tab
    if (activeFilter === 'favorites') {
      list = list.filter((p) => p.isFavorite);
    } else if (activeFilter === 'volume') {
      list = list.sort((a, b) => b.volume24h - a.volume24h);
    } else if (activeFilter === 'gainers') {
      list = list.sort((a, b) => b.change24h - a.change24h);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.symbol.toLowerCase().includes(q) ||
          p.baseAsset.toLowerCase().includes(q)
      );
    }

    return list;
  }, [pairs, activeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="font-semibold text-base text-slate-100">
              أزواج العملات الرقمية النشطة (Binance Spot USDT)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              جلب ديناميكي فوري من منصة باينانس مرتبط مباشرة بمحرك الفراكتال
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث برمز العملة أو الاسم (مثال: BTC, ETH, SOL, PEPE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500/50"
              autoFocus
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeFilter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              الكل ({pairs.length})
            </button>

            <button
              onClick={() => setActiveFilter('favorites')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeFilter === 'favorites'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>المفضلة ({pairs.filter((p) => p.isFavorite).length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('volume')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeFilter === 'volume'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>الأعلى سيولة وحجماً</span>
            </button>

            <button
              onClick={() => setActiveFilter('gainers')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors font-medium ${
                activeFilter === 'gainers'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>الأعلى تغيراً (24h)</span>
            </button>
          </div>
        </div>

        {/* Pairs List Grid / Table */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredPairs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>لم يتم العثور على أزواج تطابق بحثك.</p>
            </div>
          ) : (
            filteredPairs.map((pair) => {
              const isSelected = pair.symbol === selectedSymbol;

              return (
                <div
                  key={pair.symbol}
                  onClick={() => {
                    onSelectPair(pair);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Left: Star + Symbol */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(pair.symbol);
                      }}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                      title={pair.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          pair.isFavorite ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs text-slate-100">{pair.baseAsset}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">/ USDT</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                            الزوج الحالي
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        حجم 24س: ${(pair.volume24h / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>

                  {/* Right: Price & 24h Change */}
                  <div className="text-left font-mono">
                    <div className="text-xs font-semibold text-slate-100 tabular-nums">
                      ${formatCryptoPrice(pair.price)}
                    </div>
                    <div
                      className={`text-[11px] font-medium tabular-nums ${
                        pair.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {pair.change24h >= 0 ? `+${pair.change24h.toFixed(2)}%` : `${pair.change24h.toFixed(2)}%`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
