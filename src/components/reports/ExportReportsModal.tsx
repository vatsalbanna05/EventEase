import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  Users,
  Calendar,
  X,
  AlertCircle,
  Loader2,
  Table,
  Check,
  ChevronDown
} from 'lucide-react';
import { CollegeEvent, ReportType, ReportItem } from '../../types';
import { api } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { downloadCSV, downloadPDF, formatDisplayDate } from '../../services/exportService';

interface ExportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventId?: string;
  eventsList: CollegeEvent[];
}

export const ExportReportsModal: React.FC<ExportReportsModalProps> = ({
  isOpen,
  onClose,
  defaultEventId = 'all',
  eventsList
}) => {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [reportType, setReportType] = useState<ReportType>('participant');
  const [selectedEventId, setSelectedEventId] = useState<string>(defaultEventId);
  const [registrationStatus, setRegistrationStatus] = useState<'all' | 'confirmed' | 'cancelled' | 'waitlisted'>('all');
  const [attendanceStatus, setAttendanceStatus] = useState<'all' | 'checked_in' | 'not_checked_in'>('all');

  const [previewItems, setPreviewItems] = useState<ReportItem[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Sync selectedEventId if defaultEventId prop changes when opening
  useEffect(() => {
    if (isOpen && defaultEventId) {
      setSelectedEventId(defaultEventId);
    }
  }, [isOpen, defaultEventId]);

  // Load preview data whenever filters change
  const loadPreviewData = useCallback(async () => {
    if (!isOpen) return;
    setIsLoadingPreview(true);

    try {
      const organizerId = user?.role === 'admin' ? undefined : user?.id;
      const data = await api.getExportReportData({
        organizerId,
        eventId: selectedEventId,
        registrationStatus,
        attendanceStatus,
        reportType
      });
      setPreviewItems(data);
    } catch (err: any) {
      console.error('Error loading report preview:', err);
      toastError('Failed to load report data preview.');
    } finally {
      setIsLoadingPreview(false);
    }
  }, [isOpen, user?.role, user?.id, selectedEventId, registrationStatus, attendanceStatus, reportType, toastError]);

  useEffect(() => {
    if (isOpen) {
      loadPreviewData();
    }
  }, [isOpen, loadPreviewData]);

  if (!isOpen) return null;

  const currentEvent = eventsList.find((e) => e.id === selectedEventId);
  const eventTitle = selectedEventId === 'all'
    ? 'All Events Portfolio'
    : currentEvent?.title || 'Selected Event';

  const filterSummary = [
    `Event: ${eventTitle}`,
    `Reg Status: ${registrationStatus.toUpperCase()}`,
    `Attendance: ${attendanceStatus === 'all' ? 'ALL' : attendanceStatus === 'checked_in' ? 'CHECKED IN ONLY' : 'NOT CHECKED IN'}`
  ].join(' | ');

  const handleExportCSV = () => {
    if (previewItems.length === 0) {
      toastError('No records to export. Please adjust filters.');
      return;
    }
    setIsExportingCSV(true);
    try {
      downloadCSV(reportType, previewItems, eventTitle);
      success(`Successfully exported ${previewItems.length} records to CSV!`);
    } catch (err: any) {
      console.error('CSV Export Error:', err);
      toastError('Failed to generate CSV export.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = () => {
    if (previewItems.length === 0) {
      toastError('No records to export. Please adjust filters.');
      return;
    }
    setIsExportingPDF(true);
    try {
      downloadPDF({
        reportType,
        items: previewItems,
        eventTitle,
        filterSummary,
        organizerName: user?.full_name || 'Prof. Rajesh Mehta'
      });
      success(`Successfully generated PDF report (${previewItems.length} records)!`);
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      toastError('Failed to generate PDF document.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Institutional Data Export
              </span>
              <span className="text-xs text-slate-400">Atmiya University</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-white">
              Export Official Event Reports
            </h2>
            <p className="text-xs text-slate-300">
              Generate formatted CSV spreadsheets and institutional PDF documentation from verified database records.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Controls */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* 1. Report Type Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Select Report Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Type 1: Participant Report */}
              <button
                type="button"
                onClick={() => setReportType('participant')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  reportType === 'participant'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    reportType === 'participant'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Participant Report</span>
                    {reportType === 'participant' && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Roster with name, email, student ID, registration date, and status.
                  </p>
                </div>
              </button>

              {/* Type 2: Attendance Report */}
              <button
                type="button"
                onClick={() => setReportType('attendance')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  reportType === 'attendance'
                    ? 'border-teal-500 bg-teal-50/60 ring-2 ring-teal-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    reportType === 'attendance'
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Attendance Report</span>
                    {reportType === 'attendance' && (
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Physical gate check-in logs with verification timestamps and tokens.
                  </p>
                </div>
              </button>

              {/* Type 3: Certificate Report */}
              <button
                type="button"
                onClick={() => setReportType('certificate')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  reportType === 'certificate'
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    reportType === 'certificate'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Certificate Report</span>
                    {reportType === 'certificate' && (
                      <Check className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Issued digital credentials, verification references, and issue dates.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Filter Controls Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Filter Records
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              
              {/* Filter 1: Event Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Target Event:</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="all">All Events Portfolio ({eventsList.length})</option>
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        [{ev.category}] {ev.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Filter 2: Registration Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-500" />
                  <span>Registration Status:</span>
                </label>
                <div className="relative">
                  <select
                    value={registrationStatus}
                    onChange={(e) => setRegistrationStatus(e.target.value as any)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="all">All Statuses (Confirmed & Others)</option>
                    <option value="confirmed">Confirmed Only</option>
                    <option value="cancelled">Cancelled Only</option>
                    <option value="waitlisted">Waitlisted Only</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Filter 3: Attendance Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>Attendance Status:</span>
                </label>
                <div className="relative">
                  <select
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value as any)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="all">All Participants</option>
                    <option value="checked_in">Checked In Only</option>
                    <option value="not_checked_in">Not Checked In Only</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Live Data Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Data Preview</span>
              </label>
              <div className="flex items-center gap-2">
                {isLoadingPreview ? (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                    <span>Loading matching records...</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {previewItems.length} Records Found
                  </span>
                )}
              </div>
            </div>

            {/* Preview Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Participant</th>
                    <th className="py-2.5 px-3">Event</th>
                    {reportType === 'participant' && (
                      <>
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Reg Date</th>
                        <th className="py-2.5 px-3">Status</th>
                      </>
                    )}
                    {reportType === 'attendance' && (
                      <>
                        <th className="py-2.5 px-3">Check-In Status</th>
                        <th className="py-2.5 px-3">Check-In Time</th>
                        <th className="py-2.5 px-3">Token</th>
                      </>
                    )}
                    {reportType === 'certificate' && (
                      <>
                        <th className="py-2.5 px-3">Certificate Ref</th>
                        <th className="py-2.5 px-3">Cert Status</th>
                        <th className="py-2.5 px-3">Issue Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoadingPreview ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-1" />
                        <span>Gathering actual database records...</span>
                      </td>
                    </tr>
                  ) : previewItems.length > 0 ? (
                    previewItems.slice(0, 10).map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{item.participant_name}</div>
                          <div className="text-[10px] text-slate-500">{item.participant_email}</div>
                        </td>
                        <td className="py-2 px-3 text-slate-800 font-medium max-w-[140px] truncate">
                          {item.event_title}
                        </td>
                        {reportType === 'participant' && (
                          <>
                            <td className="py-2 px-3 font-mono text-[11px]">{item.student_id || 'N/A'}</td>
                            <td className="py-2 px-3 text-slate-500">{formatDisplayDate(item.registered_at)}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {item.registration_status.toUpperCase()}
                              </span>
                            </td>
                          </>
                        )}
                        {reportType === 'attendance' && (
                          <>
                            <td className="py-2 px-3">
                              {item.has_checked_in ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  CHECKED IN
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  NOT CHECKED IN
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {item.has_checked_in ? formatDisplayDate(item.checked_in_at) : '—'}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-emerald-700 font-bold">
                              {item.ticket_token}
                            </td>
                          </>
                        )}
                        {reportType === 'certificate' && (
                          <>
                            <td className="py-2 px-3 font-mono text-[11px] text-amber-700 font-bold">
                              {item.certificate_reference || 'Not Issued'}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                {(item.certificate_status || 'Eligible').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500">
                              {item.certificate_issued_at ? formatDisplayDate(item.certificate_issued_at) : '—'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <AlertCircle className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                        <span>No records match the selected filter parameters.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {previewItems.length > 10 && (
              <p className="text-[11px] text-slate-500 italic text-right">
                Showing first 10 of {previewItems.length} records in preview. Full dataset will be exported.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer with Export Buttons */}
        <div className="bg-slate-50 border-t border-slate-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Export format complies with campus data privacy & institutional guidelines.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={isLoadingPreview || previewItems.length === 0 || isExportingCSV}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingCSV ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              )}
              <span>Export CSV</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={isLoadingPreview || previewItems.length === 0 || isExportingPDF}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingPDF ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReportsModal;
