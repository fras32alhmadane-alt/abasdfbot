/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertNotification } from '../types/fractal';
import { Bell, CheckCheck, ShieldAlert, Sparkles, Target, Zap, Clock } from 'lucide-react';

interface AlertsProps {
  alerts: AlertNotification[];
  onMarkAllRead: () => void;
  onClearAlerts: () => void;
}

export const AlertsPanel: React.FC<AlertsProps> = ({
  alerts,
  onMarkAllRead,
  onClearAlerts,
}) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'new_match':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'stage_transition':
        return <Zap className="w-4 h-4 text-sky-400" />;
      case 'target_hit':
        return <Target className="w-4 h-4 text-emerald-400" />;
      case 'invalidated':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-base">مركز التنبيهات وإشارات الفراكتال الحية</h2>
          {alerts.filter((a) => !a.read).length > 0 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {alerts.filter((a) => !a.read).length} جديد
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تحديد الكل كمقروء</span>
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={onClearAlerts}
            className="text-rose-400/80 hover:text-rose-300 transition-colors"
          >
            مسح السجل
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>لا توجد تنبيهات نشطة حالياً. ستظهر هنا الإشارات بمجرد رصد تشابه جديد أو تغير مرحلة النموذج.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {alerts.map((alert) => {
            const timeDate = new Date(alert.timestamp * 1000);
            const timeStr = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-lg border text-xs transition-colors flex items-start gap-3 ${
                  alert.read
                    ? 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                    : 'bg-slate-950 border-amber-500/30 text-slate-100 ring-1 ring-amber-500/20'
                }`}
              >
                <div className="p-2 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-100">{alert.asset}</strong>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400 font-mono">{alert.timeframe}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-amber-400 font-mono font-semibold">
                        تشابه {alert.similarity.toFixed(0)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{timeStr}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
