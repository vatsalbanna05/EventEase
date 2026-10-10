import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  XCircle,
  ShieldCheck,
  User,
  Hash,
  Loader2,
  Award
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Registration, CertificateRequest } from '../../types';
import { useToast } from '../../context/ToastContext';

interface TicketCardProps {
  registration: Registration;
  onCancel?: (registrationId: string) => void;
  certificateRequest?: CertificateRequest;
  onRequestCertificate?: (registration: Registration) => void;
  onViewCertificate?: (certificateRef: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  registration,
  onCancel,
  certificateRequest,
  onRequestCertificate,
  onViewCertificate
}) => {
  const { success, error } = useToast();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const event = registration.event;
  const isCheckedIn = registration.has_checked_in;
  const isCancelled = registration.registration_status === 'cancelled';

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return 'Date TBA';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);

    try {
      const element = ticketRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Ticket-${registration.ticket_token}-${registration.participant_name.replace(/\s+/g, '_')}.pdf`);
      success('Ticket Downloaded', 'Official PDF pass saved to your downloads.');
    } catch (err: any) {
      console.error('PDF download error:', err);
      error('Download Failed', 'Could not generate PDF pass. Please try printing directly.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {/* Printable / Renderable Ticket Card Container */}
      <div ref={ticketRef} className="p-4 sm:p-6 bg-white flex flex-col md:flex-row gap-5 sm:gap-6 relative">
        {/* Left / Main Details */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              {event?.category || 'College Event'}
            </span>

            {/* Status Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              {isCancelled ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelled
                </span>
              ) : isCheckedIn ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Checked In
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pending Gate Check-In
                </span>
              )}

              {registration.certificate_reference ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Certificate Ready
                </span>
              ) : certificateRequest?.status === 'pending' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Cert Request: Pending
                </span>
              ) : certificateRequest?.status === 'rejected' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Cert Request: Declined
                </span>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{event?.title || 'College Event'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Organized by {event?.organizer_name || 'Atmiya University'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formatEventDate(event?.event_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{event?.start_time || '09:00'} - {event?.end_time || '17:00'}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{event?.venue || 'Campus Venue'}</span>
            </div>
          </div>

          {/* Attendee Info Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Attendee:
              </span>
              <span className="font-bold text-slate-900">{registration.participant_name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Email:</span>
              <span className="text-slate-700">{registration.participant_email}</span>
            </div>
            {registration.student_id && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Student ID:</span>
                <span className="font-mono font-medium text-slate-800">{registration.student_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right / QR & Ticket Token */}
        <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-center w-full md:w-auto md:min-w-[180px]">
          <div className="bg-white p-2.5 rounded-xl shadow-xs border border-emerald-200/80 mb-2">
            <QRCodeSVG
              value={registration.ticket_token}
              size={120}
              level="H"
              includeMargin={true}
            />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pass Reference</span>
          <div className="font-mono font-bold text-sm text-emerald-800 tracking-wider">
            {registration.ticket_token}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Anti-Duplicate Token</span>
          </div>
        </div>
      </div>

      {/* Ticket Footer Actions */}
      <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download Pass (PDF)</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          {/* Certificate Action Buttons */}
          {registration.certificate_reference ? (
            <button
              onClick={() => onViewCertificate?.(registration.certificate_reference!)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>View Certificate</span>
            </button>
          ) : !isCancelled && onRequestCertificate && (
            <button
              onClick={() => onRequestCertificate(registration)}
              disabled={certificateRequest?.status === 'pending'}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-colors ${
                certificateRequest?.status === 'pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 opacity-80 cursor-not-allowed'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>
                {certificateRequest?.status === 'pending'
                  ? 'Request Pending Review'
                  : 'Request Certificate'}
              </span>
            </button>
          )}
        </div>

        {!isCheckedIn && !isCancelled && onCancel && (
          <button
            onClick={() => onCancel(registration.id)}
            className="text-rose-600 hover:text-rose-700 font-medium transition-colors text-center sm:text-right py-1 sm:py-0"
          >
            Cancel Pass
          </button>
        )}
      </div>
    </div>
  );
};
