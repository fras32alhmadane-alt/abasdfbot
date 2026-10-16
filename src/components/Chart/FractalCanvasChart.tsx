/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Candle, FractalPattern, SwingPoint } from '../../types/fractal';
import { formatCryptoPrice } from '../../services/binanceService';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  Compass,
  SlidersHorizontal,
  SearchCode,
  Expand,
  Shrink,
} from 'lucide-react';

interface ChartProps {
  candles: Candle[];
  swings: SwingPoint[];
  patterns: FractalPattern[];
  selectedPatternId?: string;
  onSelectPattern?: (id: string) => void;
  assetSymbol: string;
  timeframe: string;
  connectionState?: 'connected' | 'connecting' | 'disconnected' | 'polling_fallback';
  lastUpdateTime?: number;
  onTriggerAutoScan?: () => void;
}

export const FractalCanvasChart: React.FC<ChartProps> = ({
  candles,
  swings,
  patterns,
  selectedPatternId,
  onSelectPattern,
  assetSymbol,
  timeframe,
  connectionState = 'connected',
  lastUpdateTime,
  onTriggerAutoScan,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport state: index offset and visible candle count
  const [visibleCount, setVisibleCount] = useState<number>(85);
  const [offsetIndex, setOffsetIndex] = useState<number>(0); // 0 means scrolled to the right (most recent)
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; candle: Candle | null } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Advanced institutional layer toggles
  const [showCandles, setShowCandles] = useState<boolean>(true);
  const [showSwings, setShowSwings] = useState<boolean>(true);
  const [showMacroBox, setShowMacroBox] = useState<boolean>(true);
  const [showMicroBox, setShowMicroBox] = useState<boolean>(true);
  const [showGhost, setShowGhost] = useState<boolean>(true); // Self-similarity contour overlay
  const [showFibonacci, setShowFibonacci] = useState<boolean>(true); // Auto Fibonacci retracement
  const [showProjections, setShowProjections] = useState<boolean>(true);
  const [showTargets, setShowTargets] = useState<boolean>(true);

  // Mouse interaction
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const initialOffsetRef = useRef<number>(0);

  // Sync latest candle on new data arrival
  useEffect(() => {
    if (offsetIndex === 0) {
      setOffsetIndex(0);
    }
  }, [candles.length]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (candles.length === 0) {
      ctx.restore();
      return;
    }

    // Chart margins
    const padding = { top: 32, right: 85, bottom: 45, left: 20 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const volumeH = Math.min(85, chartH * 0.16);
    const priceH = chartH - volumeH - 20;

    // Determine candle slice
    const totalBars = candles.length;
    const count = Math.min(visibleCount, totalBars);
    const endIndex = Math.max(0, totalBars - 1 - offsetIndex);
    const startIndex = Math.max(0, endIndex - count + 1);
    const visibleCandles = candles.slice(startIndex, endIndex + 1);

    if (visibleCandles.length === 0) {
      ctx.restore();
      return;
    }

    // Calculate price domain
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVol = 0;

    for (const c of visibleCandles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }

    // Include projections and targets in scale if visible
    const activePattern = patterns.find((p) => p.id === selectedPatternId) || patterns[patterns.length - 1];
    if (activePattern && showTargets) {
      if (activePattern.invalidationLevel) {
        minPrice = Math.min(minPrice, activePattern.invalidationLevel);
        maxPrice = Math.max(maxPrice, activePattern.invalidationLevel);
      }
      activePattern.targetZones.forEach((tz) => {
        minPrice = Math.min(minPrice, tz.min);
        maxPrice = Math.max(maxPrice, tz.max);
      });
    }

    const priceMargin = (maxPrice - minPrice) * 0.08 || 1;
    minPrice -= priceMargin;
    maxPrice += priceMargin;
    const priceRange = maxPrice - minPrice;

    // Helper functions
    const getX = (idx: number): number => {
      const relIdx = idx - startIndex;
      const step = chartW / Math.max(1, visibleCandles.length - 1);
      return padding.left + relIdx * step;
    };

    const getY = (price: number): number => {
      const ratio = (price - minPrice) / priceRange;
      return padding.top + priceH - ratio * priceH;
    };

    const getVolY = (vol: number): number => {
      const ratio = maxVol > 0 ? vol / maxVol : 0;
      return padding.top + chartH - ratio * volumeH;
    };

    // --- 0. Background Gradient & Canvas Border ---
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#0e1626');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // --- 1. Draw Grid Lines ---
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)'; // slate-700 subtle
    const priceSteps = 6;
    for (let i = 0; i <= priceSteps; i++) {
      const p = minPrice + (i / priceSteps) * priceRange;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price Axis Labels
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(formatCryptoPrice(p), width - padding.right + 8, y + 3);
    }

    // Time Vertical Grid
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 6));
    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const x = getX(startIndex + i);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartH);
      ctx.stroke();

      const date = new Date(visibleCandles[i].time * 1000);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, padding.top + chartH + 18);
    }

    // --- 2. Volume Bars with Gradient ---
    const barW = Math.max(2, (chartW / visibleCandles.length) * 0.72);
    for (let i = 0; i < visibleCandles.length; i++) {
      const c = visibleCandles[i];
      const x = getX(startIndex + i);
      const y = getVolY(c.volume);
      const isUp = c.close >= c.open;
      ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)';
      ctx.fillRect(x - barW / 2, y, barW, padding.top + chartH - y);
    }

    // --- 3. Auto Fibonacci Retracement Levels ---
    if (showFibonacci && activePattern) {
      const pMin = activePattern.minPrice;
      const pMax = activePattern.maxPrice;
      const pDiff = pMax - pMin;

      if (pDiff > 0) {
        const fibRatios = [
          { ratio: 0.0, label: '0.0% (قاع)' },
          { ratio: 0.236, label: '23.6%' },
          { ratio: 0.382, label: '38.2% (دعم فراكتالي)' },
          { ratio: 0.5, label: '50.0% (توازن)' },
          { ratio: 0.618, label: '61.8% (النسبة الذهبية)' },
          { ratio: 0.786, label: '78.6%' },
          { ratio: 1.0, label: '100.0% (قمة)' },
        ];

        ctx.save();
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1;

        fibRatios.forEach(({ ratio, label }) => {
          const fibPrice = activePattern.direction === 'bullish'
            ? pMin + pDiff * (1 - ratio)
            : pMax - pDiff * (1 - ratio);
          const y = getY(fibPrice);

          if (y >= padding.top && y <= padding.top + priceH) {
            ctx.strokeStyle = ratio === 0.618 || ratio === 0.5 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(148, 163, 184, 0.25)';
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            ctx.fillStyle = ratio === 0.618 ? '#fbbf24' : '#64748b';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`${label} - ${formatCryptoPrice(fibPrice)}`, width - padding.right - 8, y - 3);
          }
        });
        ctx.restore();
      }
    }

    // --- 4. Macro Fractal Bounding Box (Level 1: Deep Sapphire) ---
    if (showMacroBox) {
      const macroPat = patterns.find((p) => p.level === 1);
      if (macroPat && macroPat.startIndex <= endIndex && macroPat.endIndex >= startIndex) {
        const x1 = Math.max(padding.left, getX(macroPat.startIndex));
        const x2 = Math.min(width - padding.right, getX(macroPat.endIndex));
        const yTop = getY(macroPat.maxPrice);
        const yBottom = getY(macroPat.minPrice);

        // Gradient inside macro
        const boxGrad = ctx.createLinearGradient(x1, yTop, x2, yBottom);
        boxGrad.addColorStop(0, 'rgba(30, 58, 138, 0.12)'); // blue-900
        boxGrad.addColorStop(1, 'rgba(14, 165, 233, 0.04)'); // sky-500
        ctx.fillStyle = boxGrad;
        ctx.fillRect(x1, yTop, x2 - x1, yBottom - yTop);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)'; // sky-400
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(x1, yTop, x2 - x1, yBottom - yTop);
        ctx.setLineDash([]);

        // Elegant Title Tag
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('البنية الكبرى المرجعية (Macro L1)', x1 + 8, yTop + 16);
      }
    }

    // --- 5. Micro Fractal Highlight Box (Level 3: Luminous Amber) ---
    if (showMicroBox) {
      const microPat = patterns.find((p) => p.level === 3) || patterns.find((p) => p.level === 2);
      if (microPat && microPat.startIndex <= endIndex && microPat.endIndex >= startIndex) {
        const x1 = Math.max(padding.left, getX(microPat.startIndex));
        const x2 = Math.min(width - padding.right, getX(microPat.endIndex));
        const yTop = getY(microPat.maxPrice);
        const yBottom = getY(microPat.minPrice);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.07)';
        ctx.fillRect(x1, yTop, x2 - x1, yBottom - yTop);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, yTop, x2 - x1, yBottom - yTop);

        // Header Tag with Glowing Indicator
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          `الحركة الصغرى المتداخلة (Micro L3) · تشابه ${microPat.similarity?.totalScore.toFixed(0) || 75}%`,
          x1 + 8,
          yTop + 16
        );

        // --- 5.B: Self-Similarity Ghost Contour Overlay ---
        if (showGhost && microPat.similarity && microPat.waves.length >= 2) {
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)'; // glowing amber
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 3]);

          ctx.beginPath();
          const waveCount = microPat.waves.length;
          for (let w = 0; w < waveCount; w++) {
            const wave = microPat.waves[w];
            const wx = getX(wave.endIndex);
            const wy = getY(wave.endPrice);
            if (w === 0) {
              const startX = getX(wave.startIndex);
              const startY = getY(wave.startPrice);
              ctx.moveTo(startX, startY);
            }
            ctx.lineTo(wx, wy);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }
    }

    // --- 6. Japanese Candlesticks (Ultra-Crisp Body & Wicks) ---
    if (showCandles) {
      for (let i = 0; i < visibleCandles.length; i++) {
        const c = visibleCandles[i];
        const x = getX(startIndex + i);
        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);
        const isUp = c.close >= c.open;

        // Wick
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body with crisp stroke
        const topY = Math.min(openY, closeY);
        const bodyH = Math.max(2, Math.abs(closeY - openY));

        ctx.fillStyle = isUp ? '#16a34a' : '#dc2626';
        ctx.fillRect(x - barW / 2, topY, barW, bodyH);

        ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - barW / 2, topY, barW, bodyH);
      }
    }

    // --- 7. ZigZag Swings & Wave Labels ---
    if (showSwings && swings.length > 1) {
      for (let i = 0; i < swings.length - 1; i++) {
        const s1 = swings[i];
        const s2 = swings[i + 1];

        if (s2.index < startIndex || s1.index > endIndex) continue;

        const x1 = getX(s1.index);
        const y1 = getY(s1.price);
        const x2 = getX(s2.index);
        const y2 = getY(s2.price);

        const isConfirmed = s1.confirmed && s2.confirmed;

        ctx.lineWidth = isConfirmed ? 2 : 1.5;
        ctx.strokeStyle = isConfirmed ? 'rgba(56, 189, 248, 0.9)' : 'rgba(244, 63, 94, 0.8)';
        ctx.setLineDash(isConfirmed ? [] : [5, 4]);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Swing Dot Marker
        ctx.fillStyle = s2.type === 'high' ? '#38bdf8' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(x2, y2, s2.confirmed ? 4 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Wave Label Badge: [1], [2], [3], [4]
        if (i < 6) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          const labelY = s2.type === 'high' ? y2 - 10 : y2 + 16;
          ctx.fillText(`[${i + 1}]`, x2, labelY);
        }
      }
    }

    // --- 8. Projected Forward Trajectory with Uncertainty Cone ---
    if (showProjections && activePattern && activePattern.projectedPath.length > 0) {
      const lastCandleX = getX(endIndex);
      const lastCandleY = getY(candles[endIndex].close);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lastCandleX, lastCandleY);

      const pathSteps = activePattern.projectedPath;
      const stepX = (chartW / visibleCandles.length) * 2.2;

      // Upper cone
      for (let s = 0; s < pathSteps.length; s++) {
        const px = lastCandleX + (s + 1) * stepX;
        const py = getY(pathSteps[s].upperBand || pathSteps[s].price);
        ctx.lineTo(px, py);
      }
      // Lower cone
      for (let s = pathSteps.length - 1; s >= 0; s--) {
        const px = lastCandleX + (s + 1) * stepX;
        const py = getY(pathSteps[s].lowerBand || pathSteps[s].price);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = activePattern.direction === 'bullish' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
      ctx.fill();

      // Median line
      ctx.beginPath();
      ctx.moveTo(lastCandleX, lastCandleY);
      ctx.strokeStyle = activePattern.direction === 'bullish' ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);

      for (let s = 0; s < pathSteps.length; s++) {
        const px = lastCandleX + (s + 1) * stepX;
        const py = getY(pathSteps[s].price);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // --- 9. Invalidation & Target Levels ---
    if (showTargets && activePattern) {
      // Invalidation Line
      const invY = getY(activePattern.invalidationLevel);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, invY);
      ctx.lineTo(width - padding.right, invY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`إبطال: ${formatCryptoPrice(activePattern.invalidationLevel)}`, width - padding.right + 6, invY + 3);

      // Target Zones
      activePattern.targetZones.forEach((tz, idx) => {
        const targetMid = (tz.min + tz.max) / 2;
        const targetY = getY(targetMid);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, targetY);
        ctx.lineTo(width - padding.right, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#22c55e';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`هدف ${idx + 1}: ${formatCryptoPrice(targetMid)} (${tz.probability}%)`, width - padding.right + 6, targetY + 3);
      });
    }

    // --- 10. Interactive Crosshair ---
    if (crosshair && crosshair.candle) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(crosshair.x, padding.top);
      ctx.lineTo(crosshair.x, padding.top + chartH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding.left, crosshair.y);
      ctx.lineTo(width - padding.right, crosshair.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    candles,
    swings,
    patterns,
    selectedPatternId,
    visibleCount,
    offsetIndex,
    showCandles,
    showSwings,
    showMacroBox,
    showMicroBox,
    showGhost,
    showFibonacci,
    showProjections,
    showTargets,
    crosshair,
  ]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    initialOffsetRef.current = offsetIndex;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const deltaX = e.clientX - dragStartXRef.current;
      const barWidth = (canvas.clientWidth - 105) / visibleCount;
      const shiftBars = Math.round(deltaX / barWidth);
      const maxOffset = Math.max(0, candles.length - visibleCount);
      const newOffset = Math.max(0, Math.min(maxOffset, initialOffsetRef.current + shiftBars));
      setOffsetIndex(newOffset);
    } else {
      const chartW = canvas.clientWidth - 105;
      const relX = x - 20;
      const totalBars = candles.length;
      const endIndex = Math.max(0, totalBars - 1 - offsetIndex);
      const startIndex = Math.max(0, endIndex - visibleCount + 1);
      const visibleLength = endIndex - startIndex + 1;
      const step = chartW / Math.max(1, visibleLength - 1);
      const hoveredIdx = Math.round(relX / step);

      if (hoveredIdx >= 0 && hoveredIdx < visibleLength) {
        const c = candles[startIndex + hoveredIdx];
        setCrosshair({ x, y, candle: c });
      } else {
        setCrosshair(null);
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const newCount = Math.round(Math.max(25, Math.min(250, visibleCount * zoomFactor)));
    setVisibleCount(newCount);
  };

  const resetView = () => {
    setVisibleCount(85);
    setOffsetIndex(0);
  };

  const activePat = patterns.find((p) => p.id === selectedPatternId) || patterns[patterns.length - 1];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-2 z-50 rounded-xl' : 'h-full'
      }`}
    >
      {/* Top Institutional Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 text-sm tracking-tight">{assetSymbol}</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-400 font-mono font-semibold">{timeframe}</span>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionState === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : connectionState === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-sky-400'
              }`}
            />
            <span className="text-slate-300">
              {connectionState === 'connected'
                ? 'Binance Live WS'
                : connectionState === 'connecting'
                ? 'Connecting...'
                : 'REST Proxy'}
            </span>
            {lastUpdateTime && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">
                  {new Date(lastUpdateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </>
            )}
          </div>

          {/* Crosshair Values HUD */}
          {crosshair?.candle && (
            <div className="hidden 2xl:flex items-center gap-3 font-mono text-[11px] text-slate-300 mr-2">
              <span>O: <strong className="text-slate-100">${formatCryptoPrice(crosshair.candle.open)}</strong></span>
              <span>H: <strong className="text-emerald-400">${formatCryptoPrice(crosshair.candle.high)}</strong></span>
              <span>L: <strong className="text-rose-400">${formatCryptoPrice(crosshair.candle.low)}</strong></span>
              <span>C: <strong className={crosshair.candle.close >= crosshair.candle.open ? 'text-emerald-400' : 'text-rose-400'}>${formatCryptoPrice(crosshair.candle.close)}</strong></span>
              <span>Vol: <strong className="text-slate-400">{crosshair.candle.volume}</strong></span>
            </div>
          )}
        </div>

        {/* Action Controls & Layer Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Quick Deep Scan Trigger */}
          {onTriggerAutoScan && (
            <button
              onClick={onTriggerAutoScan}
              className="px-3 py-1 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 text-amber-300 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 mr-1 cursor-pointer"
              title="فحص الفريمات آلياً واكتشاف أعلى نسبة تشابه"
            >
              <SearchCode className="w-3.5 h-3.5" />
              <span>فحص الفريمات الآلي</span>
            </button>
          )}

          {/* Ghost Overlay Toggle */}
          <button
            onClick={() => setShowGhost(!showGhost)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              showGhost ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="إسقاط شبح النموذج المرجعي على الحركة المصغرة"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>شبح الفراكتال</span>
          </button>

          {/* Fibonacci Toggle */}
          <button
            onClick={() => setShowFibonacci(!showFibonacci)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              showFibonacci ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="مستويات فيبوناتشي التلقائية"
          >
            <Compass className="w-3 h-3 text-sky-400" />
            <span>فيبوناتشي</span>
          </button>

          {/* Swings Toggle */}
          <button
            onClick={() => setShowSwings(!showSwings)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              showSwings ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="موجات متأرجحة ZigZag"
          >
            {showSwings ? <Eye className="w-3 h-3 text-sky-400" /> : <EyeOff className="w-3 h-3" />}
            <span>الموجات</span>
          </button>

          {/* Macro & Micro Box */}
          <button
            onClick={() => setShowMacroBox(!showMacroBox)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              showMacroBox ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="حدود الفراكتال الكلي"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>الكلي</span>
          </button>

          <button
            onClick={() => setShowMicroBox(!showMicroBox)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 cursor-pointer ${
              showMicroBox ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="حدود الحركة المصغرة"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>المصغر</span>
          </button>

          {/* Zoom controls */}
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => setVisibleCount((prev) => Math.max(25, Math.round(prev * 0.8)))}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            title="تكبير"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setVisibleCount((prev) => Math.min(250, Math.round(prev * 1.25)))}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            title="تصغير"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            title="إعادة ضبط العرض"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة الكاملة'}
          >
            {isFullscreen ? <Shrink className="w-3.5 h-3.5 text-amber-400" /> : <Expand className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full min-h-[480px]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            isDraggingRef.current = false;
            setCrosshair(null);
          }}
          onWheel={handleWheel}
          className="w-full h-full cursor-crosshair select-none"
        />

        {/* HUD Info Watermark Badge */}
        <div className="absolute top-3 left-4 pointer-events-none text-[11px] text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>البنية النشطة: <strong className="text-slate-100">{activePat?.name || 'قيد المعالجة'}</strong></span>
          </div>
          <span className="text-slate-600">·</span>
          <span>درجة التشابه: <strong className="text-amber-400 font-mono">{activePat?.similarity?.totalScore || 75}%</strong></span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono">الخطوط المتقطعة = مؤقتة</span>
        </div>
      </div>

      {/* Mini-Map / Timeline Range Slider at bottom */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span>مجال العرض:</span>
          <strong className="text-slate-200">{visibleCount} شمعة</strong>
          <span className="text-slate-600">/</span>
          <span>إجمالي {candles.length} شمعة تاريخية</span>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 max-w-xs mx-4">
          <input
            type="range"
            min="0"
            max={Math.max(0, candles.length - visibleCount)}
            value={offsetIndex}
            onChange={(e) => setOffsetIndex(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            title="سحب للتنقل الزمني عبر التاريخ"
          />
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          <span>اسحب الرسم للتنقل · عجلة الفأرة للتكبير والتصغير</span>
        </div>
      </div>
    </div>
  );
};
