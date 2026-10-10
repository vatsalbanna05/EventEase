import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  ArrowLeft,
  Share2,
  Ticket,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Award
} from 'lucide-react';
import { CollegeEvent } from '../types';
import { api } from '../services/db';
import { RegistrationModal } from '../components/events/RegistrationModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { info } = useToast();

  const [event, setEvent] = useState<CollegeEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  const fetchEvent = async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const data = await api.getEventById(eventId);
      setEvent(data);
    } catch (e) {
      console.error('Error fetching event details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      info('Link Copied', 'Event URL copied to clipboard.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-96 rounded-3xl bg-slate-200/70 animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500">The event you are looking for does not exist or has been removed.</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  const registered = event.registered_count || 0;
  const capacity = event.capacity || 1;
  const remainingSpots = Math.max(0, capacity - registered);
  const isFull = remainingSpots <= 0;
  const isCancelled = event.status === 'cancelled';
  const percentage = Math.min(100, Math.round((registered / capacity) * 100));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-950">
        <img
          src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'}
          alt={event.title}
          className="w-full h-80 sm:h-96 object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Floating Top Pill Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-md shadow-xs">
            {event.category}
          </span>
          {event.id === 'demo-event-code-carnival-3' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
              Code Carnival PS-03 Demo
            </span>
          )}
        </div>

        <button
          onClick={handleShare}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-colors"
          title="Share event link"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Floating Bottom Headline */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
            {event.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Organized by {event.organizer_name || 'Atmiya University'} • {event.category}
          </p>
        </div>
      </div>

      {/* Main Content & Registration Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">About this Event</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Event Schedule & Location */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Date, Time & Venue</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Date</div>
                  <div className="text-slate-600 mt-0.5">{event.event_date}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Timings</div>
                  <div className="text-slate-600 mt-0.5">{event.start_time} to {event.end_time}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 sm:col-span-2">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Campus Location</div>
                  <div className="text-slate-600 mt-0.5">{event.venue}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Certification eligibility notice */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
            <Award className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-950">Certificate of Participation</h4>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                Eligible participants who attend and complete gate QR check-in will receive an official verifiable digital certificate issued by Atmiya University.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Registration & Capacity Status Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-lg space-y-5 sticky top-24">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Registration Status</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {isCancelled ? 'Cancelled' : isFull ? 'Fully Booked' : 'Open'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                  {remainingSpots} spots remaining
                </span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Seats Booked:</span>
                <span>{registered} / {capacity} ({percentage}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${percentage >= 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            <div>
              {!isCancelled && !isFull ? (
                <button
                  onClick={() => setIsRegModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Register for Event</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-400 font-bold text-sm cursor-not-allowed"
                >
                  {isCancelled ? 'Event Cancelled' : 'Capacity Full (0 Spots)'}
                </button>
              )}
            </div>

            {/* Staff / Organizer shortcuts if authorized */}
            {(role === 'volunteer' || role === 'organizer' || role === 'admin') && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Staff Quick Actions</span>
                <Link
                  to={`/scanner?eventId=${event.id}`}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Open Scanner for this Event</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        event={event}
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        onSuccess={fetchEvent}
      />
    </div>
  );
};
