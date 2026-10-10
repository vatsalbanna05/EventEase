import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, PlusCircle, ArrowRight, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { Registration } from '../types';
import { api } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TicketCard } from '../components/tickets/TicketCard';

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [tickets, setTickets] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    setIsLoading(true);
    const lookupKey = user?.email || user?.id || 'rahul.patel@atmiya.edu';
    try {
      const data = await api.getMyTickets(lookupKey);
      setTickets(data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleCancel = async (regId: string) => {
    if (!window.confirm('Are you sure you want to cancel this event registration pass?')) {
      return;
    }

    try {
      const ok = await api.cancelRegistration(regId);
      if (ok) {
        success('Pass Cancelled', 'Your registration has been marked as cancelled.');
        fetchTickets();
      }
    } catch (err: any) {
      error('Cannot Cancel', err.message || 'Error cancelling registration.');
    }
  };

  const handleQuickRegisterDemo = async () => {
    try {
      const res = await api.registerForEvent({
        eventId: 'demo-event-code-carnival-3',
        participantName: user?.full_name || 'Rahul Patel',
        participantEmail: user?.email || 'rahul.patel@atmiya.edu',
        studentId: user?.student_id || 'AU2024-CS-042',
        participantId: user?.id
      });

      if (res.success) {
        success('Demo Pass Generated', `Registered for Code Carnival Demo Event! Token: ${res.registration?.ticket_token}`);
        fetchTickets();
      } else {
        info('Notice', res.message);
        fetchTickets();
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Ticket className="w-4 h-4" />
            <span>Digital Passes & Verification</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            My Event Passes ({tickets.length})
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Showing passes registered under <strong className="text-slate-800">{user?.email || 'rahul.patel@atmiya.edu'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-xs transition-colors"
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register for Events</span>
          </Link>
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200/70 animate-pulse" />
          ))}
        </div>
      ) : tickets.length > 0 ? (
        <div className="space-y-6">
          {tickets.map((reg) => (
            <TicketCard
              key={reg.id}
              registration={reg}
              onCancel={handleCancel}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-5 max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-1 ring-emerald-200">
            <Ticket className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Active Passes Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              You haven't registered for any events yet. Explore upcoming campus competitions or generate an instant demo pass.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleQuickRegisterDemo}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>1-Click Hackathon Demo Pass</span>
            </button>

            <Link
              to="/events"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors text-center"
            >
              Browse All Events
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
