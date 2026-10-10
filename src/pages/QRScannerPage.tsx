import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Camera,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CollegeEvent, ScanResult, Registration } from '../types';
import { api } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { QRCameraScanner } from '../components/scanner/QRCameraScanner';
import { ScanResultAlert } from '../components/scanner/ScanResultAlert';

export const QRScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, role } = useAuth();
  const { success, warning, error, info } = useToast();

  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [manualToken, setManualToken] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [recentAttendees, setRecentAttendees] = useState<Registration[]>([]);
  const [currentEventAttendance, setCurrentEventAttendance] = useState<{ checkedIn: number; total: number }>({ checkedIn: 0, total: 0 });

  const loadData = async () => {
    try {
      const allEvents = await api.getEvents();
      setEvents(allEvents);

      const queryEventId = searchParams.get('eventId');
      if (queryEventId && allEvents.some(e => e.id === queryEventId)) {
        setSelectedEventId(queryEventId);
      } else if (allEvents.length > 0) {
        setSelectedEventId(allEvents[0].id);
      }
    } catch (err) {
      console.error('Error loading events for scanner:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshEventStats = async (eventId: string) => {
    if (!eventId) return;
    try {
      const attendees = await api.getEventAttendees(eventId);
      const checkedIns = attendees.filter(a => a.has_checked_in);
      const totalConfirmed = attendees.filter(a => a.registration_status === 'confirmed').length;

      setCurrentEventAttendance({
        checkedIn: checkedIns.length,
        total: totalConfirmed
      });

      // Set recent check-ins sorted by check-in time desc
      const sortedCheckedIns = checkedIns
        .sort((a, b) => new Date(b.checked_in_at || 0).getTime() - new Date(a.checked_in_at || 0).getTime())
        .slice(0, 5);

      setRecentAttendees(sortedCheckedIns);
    } catch (err) {
      console.error('Error fetching event attendees:', err);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      refreshEventStats(selectedEventId);
    }
  }, [selectedEventId]);

  const handleProcessToken = async (rawToken: string) => {
    if (!selectedEventId) {
      warning('Select Event', 'Please select an event before scanning tickets.');
      return;
    }

    const cleanToken = rawToken.trim().toUpperCase();
    if (!cleanToken) return;

    setIsVerifying(true);

    try {
      const result = await api.verifyAndCheckInTicket({
        ticketToken: cleanToken,
        selectedEventId: selectedEventId,
        checkedInBy: user?.id
      });

      setLastScanResult(result);
      setIsVerifying(false);

      if (result.outcome === 'VALID_TICKET') {
        success('CHECK-IN SUCCESSFUL!', result.message);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch {
          // ignore
        }
      } else if (result.outcome === 'ALREADY_CHECKED_IN') {
        warning('DUPLICATE REJECTED', result.message);
      } else {
        error(result.outcome.replace(/_/g, ' '), result.message);
      }

      await refreshEventStats(selectedEventId);
    } catch (err: any) {
      setIsVerifying(false);
      error('System Error', err.message || 'Failed to verify ticket.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken) {
      handleProcessToken(manualToken);
      setManualToken('');
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Gate Access & Anti-Duplicate Check-In</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            QR Check-In Scanner
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Live atomic ticket token verification for authorized volunteers & organizers.
          </p>
        </div>

        {/* Current Event Attendance Pill */}
        {selectedEvent && (
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Check-Ins</div>
              <div className="text-base font-extrabold text-slate-900 font-display">
                <span className="text-emerald-600">{currentEventAttendance.checkedIn}</span> / {currentEventAttendance.total} Attended
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Selector Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="w-full md:w-1/2 space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Selected Check-In Event:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.event_date}) — Capacity: {ev.capacity}
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
            <div>
              <span className="font-semibold text-slate-700">Venue:</span> {selectedEvent.venue}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Time:</span> {selectedEvent.start_time} - {selectedEvent.end_time}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Status:</span>{' '}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {selectedEvent.status.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Scanner & Verification Results View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Camera Scanner Viewport & Manual Fallback (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Live Camera Feed</h3>
              </div>
              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  isCameraActive
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isCameraActive ? 'Camera Active' : 'Start Camera'}
              </button>
            </div>

            {/* QR Camera Component */}
            <QRCameraScanner
              isActive={isCameraActive}
              onScanSuccess={(code) => handleProcessToken(code)}
            />

            {/* Manual Token Entry Fallback */}
            <div className="pt-4 border-t border-slate-100">
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-slate-400" />
                  <span>Manual Ticket Token Fallback (If Camera Unavailable)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="e.g. EE-9B41F0C2 or EE-A8C39F4B"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying || !manualToken.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <span>Verify</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Hackathon Demo Test Shortcuts */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-3xl border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                1-Click Hackathon Jury Verification Shortcuts
              </h4>
            </div>
            <p className="text-xs text-slate-300">
              Click any token below to simulate instant scanning without needing a second physical phone:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={async () => {
                  // Register Rahul if not already registered, then scan
                  const res = await api.registerForEvent({
                    eventId: 'demo-event-code-carnival-3',
                    participantName: 'Rahul Patel',
                    participantEmail: 'rahul.patel@atmiya.edu',
                    studentId: 'AU2024-CS-042'
                  });
                  const tokenToScan = res.registration?.ticket_token || 'EE-RAHUL042';
                  if (res.error_code === 'DUPLICATE_REGISTRATION') {
                    const tickets = await api.getMyTickets('rahul.patel@atmiya.edu');
                    const match = tickets.find(t => t.event_id === 'demo-event-code-carnival-3');
                    if (match) handleProcessToken(match.ticket_token);
                  } else {
                    handleProcessToken(tokenToScan);
                  }
                }}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-emerald-900/60 border border-slate-700 text-left transition-colors"
              >
                <div className="font-bold text-emerald-300">Test Rahul Patel Ticket</div>
                <div className="text-[10px] text-slate-400">Scan 1: Success / Scan 2: Duplicate Blocked</div>
              </button>

              <button
                onClick={() => handleProcessToken('EE-INVALID9999')}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-rose-950/60 border border-slate-700 text-left transition-colors"
              >
                <div className="font-bold text-rose-300">Test Invalid QR Token</div>
                <div className="text-[10px] text-slate-400">Simulate unknown counterfeit pass</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Live Outcome Alert & Recent Feed (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scan Outcome Card */}
          {lastScanResult ? (
            <ScanResultAlert
              result={lastScanResult}
              onClear={() => setLastScanResult(null)}
            />
          ) : (
            <div className="p-8 bg-slate-50 border border-slate-200/90 rounded-3xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Awaiting QR Scan</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Hold a participant's digital pass in front of the camera or enter their ticket token manually.
              </p>
            </div>
          )}

          {/* Recent Check-Ins Live Feed */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Gate Check-Ins</h3>
              </div>
              <button
                onClick={() => selectedEventId && refreshEventStats(selectedEventId)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh log"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentAttendees.length > 0 ? (
              <div className="space-y-2.5">
                {recentAttendees.map((att) => {
                  const checkInDate = new Date(att.checked_in_at || Date.now());
                  const timeStr = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div
                      key={att.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{att.participant_name}</div>
                        <div className="font-mono text-[10px] text-slate-500">{att.ticket_token}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          {timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No attendees have checked in for this event yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
