import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  QrCode,
  Award,
  Layers,
  Clock,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Filter,
  CheckCheck,
  XCircle,
  AlertCircle,
  Percent,
  Radio,
  ArrowUpRight,
  Sparkles,
  UserX,
  FileCheck2,
  Lock,
  ChevronDown,
  BarChart3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DashboardStats, CollegeEvent } from '../types';
import { api } from '../services/db';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ExportReportsModal } from '../components/reports/ExportReportsModal';

const PALETTE = ['#059669', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

// Privacy helper: masks email for display (e.g. "ra***l@atmiya.edu")
const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email || '—';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
};

export const OrganizerDashboardPage: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const { info, error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [eventsList, setEventsList] = useState<CollegeEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLiveSync, setIsLiveSync] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Check authorization (organizer or admin)
  const isAuthorized = user && (user.role === 'organizer' || user.role === 'admin');
  const organizerId = user?.role === 'admin' ? undefined : user?.id;

  // Fetch all stats and event list
  const fetchDashboardData = useCallback(async (showFullLoader: boolean = false) => {
    if (!isAuthorized) return;

    if (showFullLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      // 1. Fetch available events for this organizer
      const allEvents = await api.getEvents();
      const scopedEvents = user?.role === 'admin' 
        ? allEvents 
        : allEvents.filter(e => e.organizer_id === user?.id);
      setEventsList(scopedEvents);

      // 2. Fetch comprehensive stats with event filter
      const data = await api.getDashboardStats({
        organizerId,
        eventId: selectedEventId === 'all' ? undefined : selectedEventId
      });

      setStats(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error loading live dashboard statistics:', err);
      setErrorMessage(err.message || 'Unable to load dashboard metrics. Please check network connection.');
      toastError('Failed to refresh analytics data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthorized, organizerId, selectedEventId, user?.id, user?.role, toastError]);

  // Initial load & when selected event changes
  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // 1. Supabase Realtime channel subscription
  useEffect(() => {
    if (!isAuthorized || !isSupabaseConfigured()) return;

    const channel = supabase
      .channel('organizer-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchDashboardData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
        fetchDashboardData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, () => {
        fetchDashboardData(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificate_requests' }, () => {
        fetchDashboardData(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthorized, fetchDashboardData]);

  // 2. Cross-tab storage and local custom event listeners
  useEffect(() => {
    if (!isAuthorized) return;

    const handleLocalDataChange = () => {
      fetchDashboardData(false);
    };

    window.addEventListener('eventease:data_changed', handleLocalDataChange);
    window.addEventListener('storage', handleLocalDataChange);

    return () => {
      window.removeEventListener('eventease:data_changed', handleLocalDataChange);
      window.removeEventListener('storage', handleLocalDataChange);
    };
  }, [isAuthorized, fetchDashboardData]);

  // 3. Periodic liveness heartbeat polling (every 12 seconds when enabled)
  useEffect(() => {
    if (!isAuthorized || !isLiveSync) return;

    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 12000);

    return () => clearInterval(interval);
  }, [isAuthorized, isLiveSync, fetchDashboardData]);

  // Handlers
  const handleManualRefresh = () => {
    fetchDashboardData(false);
    info('Dashboard metrics updated with latest records.');
  };

  // If user is not authorized, show clean security prompt
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              <Lock className="w-3.5 h-3.5" />
              Restricted Area
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              Organizer Authorization Required
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This Live Analytics Dashboard contains protected event metrics, gate check-in registers, and official credential statistics reserved for verified organizers and administrators.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                switchDemoRole('organizer');
                info('Switched active role to Professor Rajesh Mehta (Organizer).');
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Switch to Organizer Role (Demo)</span>
            </button>

            <Link
              to="/events"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>Explore Public Campus Events</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-20 bg-slate-200/80 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200/80" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200/80" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 rounded-3xl bg-slate-200/80" />
          <div className="lg:col-span-4 h-80 rounded-3xl bg-slate-200/80" />
        </div>
      </div>
    );
  }

  // Error state
  if (errorMessage && !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-rose-900">Dashboard Unavailable</h2>
          <p className="text-sm text-rose-700 max-w-md mx-auto">{errorMessage}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedEventTitle = selectedEventId === 'all'
    ? 'All Events (Complete Portfolio)'
    : eventsList.find(e => e.id === selectedEventId)?.title || 'Selected Event';

  const isEventEmpty = (stats?.total_events || 0) === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header & Live Controller */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Live Analytics Dashboard</span>
              </span>
              <span className="text-xs text-slate-500">
                • {user?.role === 'admin' ? 'University Administrator' : 'Event Organizer'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Organizer Analytics Command Center
            </h1>
            <p className="text-xs text-slate-600">
              Real-time attendance telemetry, capacity tracking, and digital certificate verification for{' '}
              <strong className="text-slate-900">{user?.full_name || 'Prof. Rajesh Mehta'}</strong>.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 shadow-xs transition-colors cursor-pointer"
              title="Export official CSV spreadsheets and PDF reports"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Reports</span>
            </button>

            <Link
              to="/scanner"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>QR Scanner</span>
            </Link>

            <Link
              to="/organizer/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors"
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Attendance Roster</span>
            </Link>

            <Link
              to="/organizer/create-event"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar & Realtime Sync Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Event Filter Dropdown */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filter by Event:</span>
            </div>

            <div className="relative min-w-[260px] max-w-full">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-3.5 py-2 pr-9 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="all">All Events ({eventsList.length} in Portfolio)</option>
                {eventsList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    [{ev.category}] {ev.title} ({ev.event_date})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {selectedEventId !== 'all' && (
              <button
                onClick={() => setSelectedEventId('all')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
              >
                Reset to All Events
              </button>
            )}
          </div>

          {/* Realtime Status Indicator & Manual Refresh */}
          <div className="flex items-center gap-3 text-xs text-slate-500 self-end lg:self-auto">
            <button
              onClick={() => setIsLiveSync(!isLiveSync)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                isLiveSync
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Click to toggle automatic background sync"
            >
              <span className={`w-2 h-2 rounded-full ${isLiveSync ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span>{isLiveSync ? 'Live Sync Active' : 'Sync Paused'}</span>
            </button>

            <span className="hidden sm:inline text-slate-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors disabled:opacity-50"
              title="Fetch latest database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State Banner if no events */}
      {isEventEmpty && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-900">No Events Found</h3>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              You do not have any published events registered in your organizer account. Create your first event to start gathering live attendance telemetry.
            </p>
          </div>
          <Link
            to="/organizer/create-event"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Campus Event</span>
          </Link>
        </div>
      )}

      {/* 2. SECTION 1: REGISTRATION STATISTICS (Requirement 1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Registration Statistics</span>
            </h2>
            <p className="text-xs text-slate-500">
              Actual database records for <strong className="text-slate-800">{selectedEventTitle}</strong>
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Realtime DB Records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Registrations */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Registrations</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.total_registrations ?? 0}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                Confirmed Passes
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Active signups recorded in database</p>
          </div>

          {/* Card 2: Total Event Capacity */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Event Capacity</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.total_capacity ?? 0}
              </span>
              <span className="text-xs font-bold text-blue-600">
                Maximum Seats
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Configured venue seating limit</p>
          </div>

          {/* Card 3: Available Seats */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Available Seats</span>
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.available_seats ?? 0}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  (stats?.available_seats ?? 0) === 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-teal-100 text-teal-700'
                }`}
              >
                {(stats?.available_seats ?? 0) === 0 ? 'Full Quota' : 'Spots Open'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Remaining capacity before waitlist</p>
          </div>

          {/* Card 4: Registration Percentage */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Registration Rate</span>
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.registration_percentage ?? 0}%
              </span>
              <span className="text-xs font-bold text-indigo-600">
                Seat Fill Rate
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.registration_percentage ?? 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2: ATTENDANCE STATISTICS (Requirement 2) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Attendance Statistics</span>
            </h2>
            <p className="text-xs text-slate-500">
              Unique verified attendees at physical entry gates (counted once per valid registration)
            </p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Duplicate-Proof Gate Counts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Total Checked-in Participants */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Checked-In Participants</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.total_checkins ?? 0}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                Gate Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Unique participants scanned with valid QR pass</p>
          </div>

          {/* Card 2: Participants Not Checked In */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Not Checked In</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.not_checked_in ?? 0}
              </span>
              <span className="text-xs font-bold text-amber-600">
                Pending Arrival
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Confirmed signups yet to pass through check-in</p>
          </div>

          {/* Card 3: Attendance Percentage */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Attendance Percentage</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.attendance_percentage ?? 0}%
              </span>
              <span className="text-xs font-bold text-emerald-600">
                Turnout Ratio
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats?.attendance_percentage ?? 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. SECTION 3: CERTIFICATE STATISTICS (Requirement 3) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Certificate & Credential Statistics</span>
            </h2>
            <p className="text-xs text-slate-500">
              Digital certificate records & early-departure review queue
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/certificates"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>Manage Certificates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Certificates Issued */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Certificates Issued</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.certificates_issued ?? 0}
              </span>
              <span className="text-xs font-bold text-emerald-600">
                Verified Credentials
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Official digital credentials generated</p>
          </div>

          {/* Card 2: Pending Certificate Requests */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Requests</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.pending_certificate_requests ?? 0}
              </span>
              {(stats?.pending_certificate_requests ?? 0) > 0 ? (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                  Needs Review
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">
                  All Clear
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">Early-departure requests awaiting review</p>
          </div>

          {/* Card 3: Approved Requests */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Approved Requests</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.approved_certificate_requests ?? 0}
              </span>
              <span className="text-xs font-bold text-blue-600">
                Granted Exits
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Organizer-approved early exits</p>
          </div>

          {/* Card 4: Rejected Requests */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Rejected Requests</span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 font-display">
                {stats?.rejected_certificate_requests ?? 0}
              </span>
              <span className="text-xs font-bold text-rose-600">
                Declined
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Ineligible requests declined with reason</p>
          </div>
        </div>
      </div>

      {/* 4. EXPORT REPORTS OPERATIONAL SECTION (Requirement 1) */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-7 text-white border border-emerald-800/60 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Institutional Data Service
              </span>
              <span className="text-xs text-slate-400">RFC 4180 CSV & Vector PDF</span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Export Institutional Campus Reports
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Export comprehensive Participant Rosters, Gate Attendance Verification Logs, and Digital Certificate Credential Registries. Filter by event, registration status, and physical check-in confirmation with instant CSV & PDF downloads.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Open Export Reports Manager</span>
          </button>
        </div>
      </div>

      {/* 5. SECTION 4: EVENT PERFORMANCE CHARTS (Requirement 4) */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Event Performance & Analytics</span>
          </h2>
          <p className="text-xs text-slate-500">
            Visual comparisons of signups, physical attendance, and campus engagement
          </p>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Registration versus Attendance (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registration versus Attendance Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Direct comparison of confirmed registrations against verified check-ins
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span>Registered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span>Checked In</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              {stats?.attendance_trend && stats.attendance_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.attendance_trend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="event_title" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="registered" name="Registered" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="checked_in" name="Checked In" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No event records available for comparative chart.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Category Distribution (4 cols) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Category Distribution</h3>
              <p className="text-xs text-slate-500">Signups across campus technical & cultural domains</p>
            </div>

            <div className="h-56 w-full">
              {stats?.category_distribution && stats.category_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.category_distribution}
                      dataKey="registrations"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                      paddingAngle={4}
                    >
                      {stats.category_distribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No category data available.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Total Tracked Events:</span>
              <strong className="text-slate-900">{stats?.total_events ?? 0} Events</strong>
            </div>
          </div>
        </div>

        {/* Chart 3 & Leaderboard: Events with Highest Participation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Highest Participation Leaderboard (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Events with Highest Participation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ranked by turnout percentage and verified gate check-in volume
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500">Turnout Leaderboard</span>
            </div>

            <div className="space-y-3 pt-2">
              {stats?.highest_participation_events && stats.highest_participation_events.length > 0 ? (
                stats.highest_participation_events.map((metric, idx) => (
                  <div
                    key={metric.event_id}
                    className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-100 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300/60'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">{metric.event_title}</h4>
                          <span className="text-[10px] text-slate-500">{metric.category}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-emerald-700 font-display">
                          {metric.attendance_rate}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {metric.checked_in}/{metric.registered} checked in
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, metric.attendance_rate)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No participation records yet.
                </div>
              )}
            </div>
          </div>

          {/* Registrations & Capacity By Event (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrations by Event</h3>
              <p className="text-xs text-slate-500">Signups vs designated venue capacity</p>
            </div>

            <div className="space-y-3 pt-2">
              {stats?.event_performance && stats.event_performance.length > 0 ? (
                stats.event_performance.slice(0, 5).map((ep) => (
                  <div key={ep.event_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {ep.event_title}
                      </span>
                      <span className="text-slate-600 font-bold">
                        {ep.registered} / {ep.capacity} ({ep.registration_rate}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          ep.registration_rate >= 100
                            ? 'bg-rose-500'
                            : ep.registration_rate >= 80
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, ep.registration_rate)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No event records found.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Overall Campus Capacity:</span>
              <strong className="text-slate-900">{stats?.total_capacity ?? 0} Seats</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SECTION 5: RECENT REGISTRATIONS AUDIT LOG (Privacy Protected) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Recent Registrations & Ticket Passes</span>
            </h3>
            <p className="text-xs text-slate-500">
              Latest participant signups with gate pass tokens (Private participant emails masked)
            </p>
          </div>
          <Link
            to="/organizer/attendance"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Complete Attendance Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Participant</th>
                <th className="py-3.5 px-6">Event Title</th>
                <th className="py-3.5 px-6">Ticket Token</th>
                <th className="py-3.5 px-6">Gate Status</th>
                <th className="py-3.5 px-6">Registered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats?.recent_registrations && stats.recent_registrations.length > 0 ? (
                stats.recent_registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-900">{reg.participant_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {maskEmail(reg.participant_email)}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-800">
                      {reg.event?.title || 'College Event'}
                    </td>
                    <td className="py-3.5 px-6">
                      <code className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        {reg.ticket_token}
                      </code>
                    </td>
                    <td className="py-3.5 px-6">
                      {reg.has_checked_in ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Checked In</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Awaiting Entry</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(reg.registered_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No registrations recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Reports Modal */}
      <ExportReportsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        defaultEventId={selectedEventId}
        eventsList={eventsList}
      />
    </div>
  );
};

export default OrganizerDashboardPage;
