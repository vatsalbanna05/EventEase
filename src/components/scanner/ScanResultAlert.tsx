import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  User,
  Mail,
  Hash,
  Sparkles
} from 'lucide-react';
import { ScanResult, ScanOutcome } from '../../types';

interface ScanResultAlertProps {
  result: ScanResult | null;
  onClear?: () => void;
}

export const ScanResultAlert: React.FC<ScanResultAlertProps> = ({ result, onClear }) => {
  if (!result) return null;

  const outcomeConfigs: Record<
    ScanOutcome,
    {
      bg: string;
      border: string;
      text: string;
      title: string;
      icon: React.ReactNode;
      badgeBg: string;
    }
  > = {
    VALID_TICKET: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/40 ring-2 ring-emerald-500/20',
      text: 'text-emerald-900',
      title: 'VALID TICKET — CHECK-IN SUCCESSFUL',
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />,
      badgeBg: 'bg-emerald-600 text-white'
    },
    ALREADY_CHECKED_IN: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/50 ring-2 ring-amber-500/20',
      text: 'text-amber-900',
      title: 'DUPLICATE ENTRY REJECTED — ALREADY CHECKED IN',
      icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
      badgeBg: 'bg-amber-600 text-white'
    },
    INVALID_TICKET: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/40 ring-2 ring-rose-500/20',
      text: 'text-rose-900',
      title: 'INVALID TICKET — NO RECORD FOUND',
      icon: <XCircle className="w-8 h-8 text-rose-600" />,
      badgeBg: 'bg-rose-600 text-white'
    },
    WRONG_EVENT: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/40 ring-2 ring-orange-500/20',
      text: 'text-orange-900',
      title: 'WRONG EVENT — TICKET MISMATCH',
      icon: <ShieldAlert className="w-8 h-8 text-orange-600" />,
      badgeBg: 'bg-orange-600 text-white'
    },
    REGISTRATION_CANCELLED: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/40 ring-2 ring-purple-500/20',
      text: 'text-purple-900',
      title: 'CANCELLED REGISTRATION — ENTRY DENIED',
      icon: <XCircle className="w-8 h-8 text-purple-600" />,
      badgeBg: 'bg-purple-600 text-white'
    },
    EVENT_UNAVAILABLE: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/40 ring-2 ring-slate-500/20',
      text: 'text-slate-900',
      title: 'EVENT UNAVAILABLE — CHECK-IN CLOSED',
      icon: <Clock className="w-8 h-8 text-slate-600" />,
      badgeBg: 'bg-slate-600 text-white'
    }
  };

  const config = outcomeConfigs[result.outcome] || outcomeConfigs.INVALID_TICKET;

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 shadow-lg ${config.bg} ${config.border}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
        <div className="flex items-center gap-3.5">
          {config.icon}
          <div>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-1 ${config.badgeBg}`}
            >
              {result.outcome.replace(/_/g, ' ')}
            </span>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              {config.title}
            </h3>
          </div>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-black/10 shadow-xs transition-colors self-end sm:self-center"
          >
            Clear Banner
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <p className={`text-sm font-medium leading-relaxed ${config.text}`}>
          {result.message}
        </p>

        {result.participant_name && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs bg-white/70 p-3.5 rounded-xl border border-black/5">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-slate-500" />
              <span>Attendee: <strong className="text-slate-900">{result.participant_name}</strong></span>
            </div>

            {result.participant_email && (
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="truncate">{result.participant_email}</span>
              </div>
            )}

            {result.ticket_token && (
              <div className="flex items-center gap-2 text-slate-700">
                <Hash className="w-4 h-4 text-slate-500" />
                <span>Ticket Token: <strong className="font-mono text-emerald-700">{result.ticket_token}</strong></span>
              </div>
            )}

            {result.checked_in_at && (
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Recorded Time: <strong className="text-slate-900">{formatTime(result.checked_in_at)}</strong></span>
              </div>
            )}
          </div>
        )}

        {result.attendance_count !== undefined && (
          <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-600 font-semibold">
            <span>Current Event Attendance:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {result.attendance_count} / {result.total_registered || '?'} Checked In
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
