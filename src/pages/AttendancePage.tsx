import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  QrCode,
  Filter,
  RefreshCw,
  UserCheck,
  Hash,
  Download
} from 'lucide-react';
import { CollegeEvent, Registration, AttendanceRecord, Certificate } from '../types';
import { api } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type AttendeeItem = Registration & {
  attendance?: AttendanceRecord;
  certificate?: Certificate;
};

export const AttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'checked_in' | 'not_checked_in' | 'cancelled'>('all');

  const loadEvents = async () => {
    try {
      const allEvents = await api.getEvents();
      setEvents(allEvents);
      const qId = searchParams.get('eventId');
      if (qId && allEvents.some(e => e.id === qId)) {
        setSelectedEventId(qId);
      } else if (allEvents.length > 0) {
        setSelectedEventId(allEvents[0].id);
      }
    } catch (err) {
      console.error('Error loading events for attendance:', err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadAttendees = async (eventId: string) => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const data = await api.getEventAttendees(eventId);
      setAttendees(data);
    } catch (err) {
      console.error('Error loading attendees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadAttendees(selectedEventId);
    }
  }, [selectedEventId]);

  const handleManualCheckIn = async (regId: string, name: string) => {
    if (!window.confirm(`Perform manual check-in verification for ${name}?`)) {
      return;
    }

    try {
      const res = await api.manualCheckInAttendee(regId, user?.id);
      if (res.success) {
        success('Manual Check-In Confirmed', `${name} has been verified.`);
        loadAttendees(selectedEventId);
      } else {
        warning('Check-In Outcome', res.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const handleExportCSV = () => {
    if (attendees.length === 0) {
      warning('No Data', 'No attendee records to export.');
      return;
    }

    const currentEv = events.find(e => e.id === selectedEventId);
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
    link.setAttribute('download', `Attendance_Roster_${currentEv?.title.replace(/\s+/g, '_') || 'Event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success('CSV Export Completed', 'Attendance roster downloaded successfully.');
  };

  const currentEvent = events.find(e => e.id === selectedEventId);

  // Summary counts
  const totalRegistered = attendees.filter(a => a.registration_status === 'confirmed').length;
  const checkedInCount = attendees.filter(a => a.has_checked_in).length;
  const notCheckedInCount = Math.max(0, totalRegistered - checkedInCount);
  const attendanceRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  // Filtered list
  const filteredAttendees = attendees.filter((a) => {
    const matchesSearch =
      a.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.participant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.student_id && a.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.ticket_token.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      filterTab === 'all' ||
      (filterTab === 'checked_in' && a.has_checked_in) ||
      (filterTab === 'not_checked_in' && !a.has_checked_in && a.registration_status === 'confirmed') ||
      (filterTab === 'cancelled' && a.registration_status === 'cancelled');

    return matchesSearch && matchesTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Attendance & Roster Tracking</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Attendance Management
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Searchable participant roster, gate check-in timestamps, and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedEventId && loadAttendees(selectedEventId)}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 shadow-xs transition-colors"
            title="Refresh attendee list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {selectedEventId && (
            <Link
              to={`/scanner?eventId=${selectedEventId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Gate Scanner</span>
            </Link>
          )}
        </div>
      </div>

      {/* Event Selector & Live Metric Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Event Select Dropdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Selected Campus Event:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.event_date})
              </option>
            ))}
          </select>
          {currentEvent && (
            <div className="text-[11px] text-slate-500 flex justify-between pt-1">
              <span>Venue: {currentEvent.venue}</span>
              <span className="font-semibold text-emerald-700">Capacity: {currentEvent.capacity}</span>
            </div>
          )}
        </div>

        {/* 4 Attendance Counter Badges (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Registered</span>
            <div className="text-xl font-extrabold text-slate-900 font-display mt-0.5">{totalRegistered}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Checked In</span>
            <div className="text-xl font-extrabold text-emerald-600 font-display mt-0.5">{checkedInCount}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600">Pending</span>
            <div className="text-xl font-extrabold text-amber-600 font-display mt-0.5">{notCheckedInCount}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-teal-600">Turnout %</span>
            <div className="text-xl font-extrabold text-teal-600 font-display mt-0.5">{attendanceRate}%</div>
          </div>
        </div>
      </div>

      {/* Search and Tabs Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendee, email, or token..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto text-xs">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 font-semibold rounded-lg shrink-0 transition-all ${
              filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({attendees.length})
          </button>
          <button
            onClick={() => setFilterTab('checked_in')}
            className={`px-3 py-1.5 font-semibold rounded-lg shrink-0 transition-all ${
              filterTab === 'checked_in' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Checked In ({checkedInCount})
          </button>
          <button
            onClick={() => setFilterTab('not_checked_in')}
            className={`px-3 py-1.5 font-semibold rounded-lg shrink-0 transition-all ${
              filterTab === 'not_checked_in' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({notCheckedInCount})
          </button>
          <button
            onClick={() => setFilterTab('cancelled')}
            className={`px-3 py-1.5 font-semibold rounded-lg shrink-0 transition-all ${
              filterTab === 'cancelled' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredAttendees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-4 px-6">Participant</th>
                  <th className="py-4 px-6">Student ID</th>
                  <th className="py-4 px-6">Pass Reference</th>
                  <th className="py-4 px-6">Gate Status</th>
                  <th className="py-4 px-6">Check-In Time</th>
                  <th className="py-4 px-6 text-right">Staff Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAttendees.map((att) => {
                  const checkInTimeStr = att.checked_in_at
                    ? new Date(att.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : null;

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm">{att.participant_name}</div>
                        <div className="text-[11px] text-slate-500">{att.participant_email}</div>
                      </td>

                      <td className="py-4 px-6 font-mono text-slate-700">
                        {att.student_id || <span className="text-slate-400">N/A</span>}
                      </td>

                      <td className="py-4 px-6">
                        <code className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {att.ticket_token}
                        </code>
                      </td>

                      <td className="py-4 px-6">
                        {att.registration_status === 'cancelled' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            Cancelled
                          </span>
                        ) : att.has_checked_in ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Not Checked In
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-slate-600">
                        {checkInTimeStr ? (
                          <span className="font-semibold text-slate-900">{checkInTimeStr}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        {!att.has_checked_in && att.registration_status === 'confirmed' ? (
                          <button
                            onClick={() => handleManualCheckIn(att.id, att.participant_name)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
                          >
                            Check In
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No attendees matching your search or filter tab.
          </div>
        )}
      </div>
    </div>
  );
};
