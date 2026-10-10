import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  Edit,
  Trash2,
  PlusCircle,
  QrCode,
  Download,
  AlertCircle,
  FileSpreadsheet,
  XCircle,
  Clock
} from 'lucide-react';
import { CollegeEvent } from '../types';
import { api } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ManageEventsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<CollegeEvent | null>(null);
  const [editCapacity, setEditCapacity] = useState<number>(0);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching manage events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCancelEvent = async (eventId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to cancel "${title}"? This will disable check-ins.`)) {
      return;
    }

    try {
      const ok = await api.cancelEvent(eventId);
      if (ok) {
        success('Event Cancelled', `"${title}" has been marked as cancelled.`);
        fetchEvents();
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      await api.updateEvent(editingEvent.id, { capacity: editCapacity });
      success('Capacity Updated', `New capacity set to ${editCapacity} seats.`);
      setEditingEvent(null);
      fetchEvents();
    } catch (err: any) {
      error('Cannot Update Capacity', err.message);
    }
  };

  const handleExportCSV = async (event: CollegeEvent) => {
    try {
      const attendees = await api.getEventAttendees(event.id);
      if (attendees.length === 0) {
        warning('Empty Attendance', 'No registrations to export for this event.');
        return;
      }

      const headers = ['Participant Name', 'Email', 'Student ID', 'Ticket Token', 'Registration Status', 'Attended', 'Check-In Timestamp'];
      const rows = attendees.map(a => [
        `"${a.participant_name.replace(/"/g, '""')}"`,
        `"${a.participant_email}"`,
        `"${a.student_id || 'N/A'}"`,
        `"${a.ticket_token}"`,
        `"${a.registration_status}"`,
        `"${a.has_checked_in ? 'YES' : 'NO'}"`,
        `"${a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : 'N/A'}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Attendance_${event.title.replace(/\s+/g, '_')}_${event.event_date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      success('CSV Exported', `Downloaded attendance records for "${event.title}".`);
    } catch (err: any) {
      error('Export Error', err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Manage Campus Events ({events.length})
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Oversee event capacities, live check-ins, registration lists, and CSV reporting.
          </p>
        </div>

        <Link
          to="/organizer/create-event"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* Events Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Event Details</th>
                  <th className="py-4 px-6">Schedule & Venue</th>
                  <th className="py-4 px-6">Registrations</th>
                  <th className="py-4 px-6">Attendance</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {events.map((ev) => {
                  const regCount = ev.registered_count || 0;
                  const attCount = ev.checked_in_count || 0;
                  const capacity = ev.capacity || 1;
                  const isFull = regCount >= capacity;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{ev.title}</div>
                        <div className="text-[11px] text-slate-500">{ev.category}</div>
                      </td>

                      <td className="py-4 px-6 space-y-0.5">
                        <div className="font-semibold text-slate-800">{ev.event_date}</div>
                        <div className="text-slate-500">{ev.venue}</div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{regCount} / {capacity}</span>
                          <button
                            onClick={() => {
                              setEditingEvent(ev);
                              setEditCapacity(capacity);
                            }}
                            className="text-slate-400 hover:text-emerald-600 p-1 rounded"
                            title="Edit Capacity Limit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {isFull && (
                          <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                            Capacity Full
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {attCount} Verified
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            ev.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ev.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {ev.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/scanner?eventId=${ev.id}`}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white"
                            title="Open Scanner for this event"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/organizer/attendance?eventId=${ev.id}`}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold"
                            title="View Attendee List"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleExportCSV(ev)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Export CSV"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {ev.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelEvent(ev.id, ev.title)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                              title="Cancel Event"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            No events created yet. Click "Create New Event" to publish one.
          </div>
        )}
      </div>

      {/* Edit Capacity Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Edit Capacity for "{editingEvent.title}"
            </h3>
            <p className="text-xs text-slate-500">
              Current confirmed registrations: <strong>{editingEvent.registered_count || 0}</strong>. Capacity cannot be lower than existing valid registrations.
            </p>

            <form onSubmit={handleSaveCapacity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Capacity Limit
                </label>
                <input
                  type="number"
                  required
                  min={editingEvent.registered_count || 1}
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
