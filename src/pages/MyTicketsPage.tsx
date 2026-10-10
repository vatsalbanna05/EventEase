import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Award,
  Clock,
  AlertCircle,
  X,
  Send,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { Registration, CertificateRequest, Certificate } from '../types';
import { api } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TicketCard } from '../components/tickets/TicketCard';
import { CertificateView } from '../components/certificates/CertificateView';

export const MyTicketsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Registration[]>([]);
  const [certRequests, setCertRequests] = useState<CertificateRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Early Exit / Certificate Request Modal State
  const [requestModalReg, setRequestModalReg] = useState<Registration | null>(null);
  const [requestReason, setRequestReason] = useState<string>('Early departure due to university lecture / exam conflict');
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Certificate Modal State
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  const fetchTicketsAndRequests = async () => {
    setIsLoading(true);
    const lookupKey = user?.email || user?.id || 'rahul.patel@atmiya.edu';
    try {
      const [ticketsData, requestsData] = await Promise.all([
        api.getMyTickets(lookupKey),
        api.getMyCertificateRequests(lookupKey)
      ]);
      setTickets(ticketsData);
      setCertRequests(requestsData);
    } catch (err) {
      console.error('Error fetching tickets & requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsAndRequests();
  }, [user]);

  const handleCancel = async (regId: string) => {
    if (!window.confirm('Are you sure you want to cancel this event registration pass?')) {
      return;
    }

    try {
      const ok = await api.cancelRegistration(regId);
      if (ok) {
        success('Pass Cancelled', 'Your registration has been marked as cancelled.');
        fetchTicketsAndRequests();
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
        fetchTicketsAndRequests();
      } else {
        info('Notice', res.message);
        fetchTicketsAndRequests();
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  const handleOpenRequestModal = (reg: Registration) => {
    setRequestModalReg(reg);
    setRequestReason('Early departure due to university lecture / exam conflict');
    setRequestNotes('');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalReg) return;

    setIsSubmittingRequest(true);
    try {
      const res = await api.requestCertificate({
        registrationId: requestModalReg.id,
        reason: requestNotes ? `${requestReason} — ${requestNotes}` : requestReason,
        participantId: user?.id,
        participantName: requestModalReg.participant_name,
        participantEmail: requestModalReg.participant_email
      });

      if (res.success) {
        success('Request Submitted', res.message);
        setRequestModalReg(null);
        fetchTicketsAndRequests();
      } else {
        error('Cannot Submit', res.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleViewCertificate = async (certificateRef: string) => {
    try {
      const cert = await api.getCertificateByRef(certificateRef);
      if (cert) {
        setPreviewCert(cert);
      } else {
        navigate(`/verify-certificate/${certificateRef}`);
      }
    } catch (err) {
      navigate('/certificates');
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
            onClick={fetchTicketsAndRequests}
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
          {tickets.map((reg) => {
            const req = certRequests.find((r) => r.registration_id === reg.id);
            return (
              <TicketCard
                key={reg.id}
                registration={reg}
                certificateRequest={req}
                onRequestCertificate={handleOpenRequestModal}
                onViewCertificate={handleViewCertificate}
                onCancel={handleCancel}
              />
            );
          })}
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

      {/* Early Exit / Request Certificate Modal */}
      {requestModalReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Request Certificate</h3>
                  <p className="text-xs text-slate-500">Early departure & attendance review</p>
                </div>
              </div>

              <button
                onClick={() => setRequestModalReg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-slate-800">
                  Event: {requestModalReg.event?.title || 'Selected Event'}
                </div>
                <div className="text-slate-500">
                  Attendee: {requestModalReg.participant_name} ({requestModalReg.participant_email})
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reason for Early Exit / Certificate Request:
                </label>
                <select
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Early departure due to university lecture / exam conflict">
                    University lecture / exam schedule conflict
                  </option>
                  <option value="Transportation / outstation travel schedule">
                    Outstation bus / train transportation departure
                  </option>
                  <option value="Medical necessity or health emergency">
                    Medical necessity or personal health emergency
                  </option>
                  <option value="Official university duty or athletic representation">
                    Official university delegation / athletic tournament
                  </option>
                  <option value="Completed designated track / module requirements">
                    Completed designated track / module requirements
                  </option>
                  <option value="Other valid academic circumstance">
                    Other valid academic circumstance
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Additional Details / Note for Organizers (Optional):
                </label>
                <textarea
                  rows={2}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g., Department exam starts at 2:00 PM; departed after morning technical session."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Data Integrity Notice */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Attendance Integrity:</strong> Submitting this request allows organizers to grant early exit certificate eligibility without creating counterfeit gate attendance records.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestModalReg(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingRequest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 max-w-4xl w-full space-y-4 my-auto max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewCert(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Close Preview
              </button>
            </div>
            <CertificateView certificate={previewCert} />
          </div>
        </div>
      )}
    </div>
  );
};
