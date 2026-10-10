import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Ticket,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  Download,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { CollegeEvent, Registration } from '../../types';
import { api } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface RegistrationModalProps {
  event: CollegeEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredTicket, setRegisteredTicket] = useState<Registration | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setStudentId(user.student_id || '');
    }
    if (isOpen) {
      setErrorMessage(null);
      setRegisteredTicket(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid college email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.registerForEvent({
        eventId: event.id,
        participantName: fullName.trim(),
        participantEmail: email.trim(),
        studentId: studentId.trim() || undefined,
        participantId: user?.id
      });

      setIsSubmitting(false);

      if (res.success && res.registration) {
        setRegisteredTicket(res.registration);
        success('Registration Confirmed!', `Your unique QR ticket ${res.registration.ticket_token} has been generated.`);
        
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore confetti if browser blocks
        }

        if (onSuccess) {
          onSuccess();
        }
      } else {
        const msg = res.message || 'Registration failed. Please try again.';
        setErrorMessage(msg);
        if (res.error_code === 'DUPLICATE_REGISTRATION') {
          warning('Duplicate Registration', msg);
        } else if (res.error_code === 'EVENT_FULL') {
          error('Event Full', msg);
        } else {
          error('Error', msg);
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err.message || 'Network error occurred during registration.';
      setErrorMessage(msg);
      error('Registration Error', msg);
    }
  };

  const handleClose = () => {
    setRegisteredTicket(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 sm:p-6 text-white relative shrink-0">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-600/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <Ticket className="w-4 h-4" />
            <span>Event Registration</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">{event.title}</h3>
          
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-emerald-100">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {event.event_date} ({event.start_time})
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {event.venue}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {registeredTicket ? (
            /* SUCCESS STATE WITH QR TICKET */
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">Registration Successful!</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Here is your official digital pass. Show this QR code at the check-in gate.
                </p>
              </div>

              {/* Digital QR Ticket Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-xs mx-auto shadow-inner relative">
                <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 inline-block mb-3">
                  <QRCodeSVG
                    value={registeredTicket.ticket_token}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Unique Token</span>
                  <div className="text-lg font-mono font-bold text-emerald-700 tracking-wider">
                    {registeredTicket.ticket_token}
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{registeredTicket.participant_name}</p>
                  <p className="text-[11px] text-slate-500">{registeredTicket.participant_email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    handleClose();
                    navigate('/my-tickets');
                  }}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Ticket className="w-4 h-4" />
                  <span>View in My Tickets</span>
                </button>
                <button
                  onClick={handleClose}
                  className="py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  College Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.patel@atmiya.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used to prevent duplicate registrations & issue your pass.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Student ID / Enrollment No. (Optional)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. AU2024-CS-042"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Spots indicator */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <span>Total Event Capacity:</span>
                <span className="font-bold">{event.registered_count || 0} / {event.capacity} Registered</span>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
