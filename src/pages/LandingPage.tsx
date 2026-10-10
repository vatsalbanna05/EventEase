import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  QrCode,
  ShieldCheck,
  BarChart3,
  Award,
  Zap,
  CheckCircle2,
  ArrowRight,
  Users,
  Sparkles,
  Search,
  Lock,
  Flame
} from 'lucide-react';
import { CollegeEvent } from '../types';
import { api } from '../services/db';
import { EventCard } from '../components/events/EventCard';
import { RegistrationModal } from '../components/events/RegistrationModal';

interface LandingPageProps {
  onOpenDemoGuide?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenDemoGuide }) => {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventForReg, setSelectedEventForReg] = useState<CollegeEvent | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const upcomingEvents = events.filter(e => e.status === 'published').slice(0, 3);

  return (
    <div className="space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 overflow-hidden">
        {/* Decorative background glow & subtle grid */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-100/60 via-teal-50/30 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Hackathon Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-emerald-800 tracking-wide">
              Code Carnival 3.0 • Atmiya University (PS-03)
            </span>
          </div>

          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight font-display leading-[1.1]">
              Every Event. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                Seamlessly Managed.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Eliminate disconnected spreadsheets and duplicate entries. Create college events, generate tamper-proof QR passes, and verify attendees with lightning-fast atomic check-ins.
            </p>
          </div>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/events"
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>Explore Events</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/scanner"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300/80 shadow-xs hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Launch QR Scanner</span>
            </Link>

            {onOpenDemoGuide && (
              <button
                onClick={onOpenDemoGuide}
                className="px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 font-semibold text-sm transition-all flex items-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Run Demo Script</span>
              </button>
            )}
          </div>

          {/* Real-time stats badges */}
          <div className="pt-10 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">100%</div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Atomic Duplicate Prevention</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-display">&lt; 0.5s</div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Gate QR Verification</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Live</div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Capacity Lock Enforced</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 font-display">Auto</div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Certificate Issuance</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. UPCOMING EVENTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4" />
              <span>Campus Live Hub</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Upcoming College Events
            </h2>
          </div>
          <Link
            to="/events"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
          >
            <span>View all campus events</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-200/70 animate-pulse" />
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRegisterClick={(ev) => setSelectedEventForReg(ev)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No upcoming events scheduled right now.</p>
          </div>
        )}
      </section>

      {/* 3. CORE VALUE PROPOSITION & PROBLEM STATEMENT 03 SOLUTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
            Problem Statement PS-03 Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            Engineered to Solve Campus Event Chaos
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Standard Google Forms and paper rosters cause long check-in queues, duplicate scans, and inaccurate headcounts. EventEase replaces manual hassles with a robust, enterprise-grade suite.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-200/60">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dynamic & Tamper-Proof QR Passes</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every participant receives an unpredictable, cryptographically generated ticket token (`EE-XXXXXXXX`). Sensitive personal data is never exposed in the QR payload.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-200/60">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Atomic Anti-Duplicate Gate Checks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforced at the database transaction layer (`SELECT ... FOR UPDATE` & unique constraints). Simultaneous double-scans of the same pass are immediately rejected.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-200/60">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Live Dashboard & CSV Attendance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitor real-time check-in velocity, seat utilization, category breakdown, and export certified attendee lists to CSV for faculty records.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS WORKFLOW */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            Step-by-Step Operation
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display">
            How EventEase Operates
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            A frictionless journey from event announcement to verified certificates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h4 className="text-base font-bold text-white">Create & Limit Capacity</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Organizers publish events with strict seat capacities, category, venue, and registration deadlines.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h4 className="text-base font-bold text-white">Instant QR Generation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Students register with normalized email and receive a downloadable digital PDF pass with embedded QR.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h4 className="text-base font-bold text-white">Gate Scan & Verification</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Volunteers scan passes with mobile camera or manual fallback. Duplicate attempts trigger instant audible alerts.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-3 relative">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h4 className="text-base font-bold text-white">Certificates & Analytics</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Checked-in attendees automatically qualify for verifiable participation certificates with university crests.
            </p>
          </div>
        </div>
      </section>

      {/* Registration Modal trigger */}
      <RegistrationModal
        event={selectedEventForReg}
        isOpen={!!selectedEventForReg}
        onClose={() => setSelectedEventForReg(null)}
        onSuccess={fetchEvents}
      />
    </div>
  );
};
