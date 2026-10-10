import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { CollegeEvent } from '../../types';

interface EventCardProps {
  event: CollegeEvent;
  onRegisterClick?: (event: CollegeEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onRegisterClick }) => {
  const registered = event.registered_count || 0;
  const capacity = event.capacity || 1;
  const remainingSpots = Math.max(0, capacity - registered);
  const isFull = remainingSpots <= 0;
  const isCancelled = event.status === 'cancelled';
  const isPast = new Date(event.event_date) < new Date(new Date().toISOString().split('T')[0]);
  const percentage = Math.min(100, Math.round((registered / capacity) * 100));

  const categoryColors: Record<string, string> = {
    Tech: 'bg-blue-50 text-blue-700 border-blue-200',
    Hackathon: 'bg-purple-50 text-purple-700 border-purple-200',
    Cultural: 'bg-rose-50 text-rose-700 border-rose-200',
    Workshop: 'bg-amber-50 text-amber-700 border-amber-200',
    Sports: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Academic: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    Seminar: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  const badgeColor = categoryColors[event.category] || 'bg-slate-100 text-slate-700 border-slate-200';

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Banner & Badges */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${badgeColor}`}>
            {event.category}
          </span>
        </div>

        {/* Status Pill */}
        <div className="absolute top-3 right-3">
          {isCancelled ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
              Cancelled
            </span>
          ) : isPast ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-200 shadow-xs">
              Past Event
            </span>
          ) : isFull ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs animate-pulse">
              Housefull (0 Seats)
            </span>
          ) : remainingSpots <= 3 ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
              Only {remainingSpots} {remainingSpots === 1 ? 'spot' : 'spots'} left!
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              {remainingSpots} spots left
            </span>
          )}
        </div>

        {/* Capacity Bar on image bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Capacity: <strong className="text-white">{registered}</strong> / {capacity}</span>
          </div>
          <span className={`font-semibold ${percentage >= 90 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {percentage}% Filled
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <Link to={`/events/${event.id}`}>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
              {event.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          <div className="pt-2 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{formatEventDate(event.event_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{event.start_time} - {event.end_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Details
          </Link>

          {!isCancelled && !isPast && !isFull && onRegisterClick ? (
            <button
              onClick={() => onRegisterClick(event)}
              className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>Register</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : isFull ? (
            <button
              disabled
              className="flex-1 py-2 px-3 text-center text-xs font-semibold rounded-xl text-slate-400 bg-slate-100 cursor-not-allowed"
            >
              Full
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
