import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Sparkles,
  Ticket,
  QrCode,
  Users,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/db';

interface DemoScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoScenarioModal: React.FC<DemoScenarioModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { switchDemoRole } = useAuth();
  const { success, warning, info } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [demoToken, setDemoToken] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Demo Event with Capacity 3',
      desc: 'Verify "Code Carnival Demo Event" created with strict capacity limit = 3.',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      actionLabel: 'View Event Page',
      execute: async () => {
        navigate('/events');
        onClose();
      }
    },
    {
      num: 2,
      title: 'Register Rahul Patel',
      desc: 'Perform atomic registration for Rahul Patel (AU2024-CS-042) ensuring capacity lock & unique email check.',
      icon: <Ticket className="w-5 h-5 text-blue-600" />,
      actionLabel: 'Register Rahul Now',
      execute: async () => {
        setIsExecuting(true);
        switchDemoRole('participant');
        const res = await api.registerForEvent({
          eventId: 'demo-event-code-carnival-3',
          participantName: 'Rahul Patel',
          participantEmail: 'rahul.patel@atmiya.edu',
          studentId: 'AU2024-CS-042',
          participantId: 'user-participant-rahul'
        });

        setIsExecuting(false);
        if (res.success && res.registration) {
          setDemoToken(res.registration.ticket_token);
          success('Rahul Patel Registered!', `Ticket Token: ${res.registration.ticket_token}`);
          setCurrentStep(3);
        } else if (res.error_code === 'DUPLICATE_REGISTRATION') {
          // fetch existing
          const tickets = await api.getMyTickets('rahul.patel@atmiya.edu');
          const carnivalTicket = tickets.find(t => t.event_id === 'demo-event-code-carnival-3');
          if (carnivalTicket) {
            setDemoToken(carnivalTicket.ticket_token);
            info('Rahul is already registered', `Using active ticket: ${carnivalTicket.ticket_token}`);
            setCurrentStep(3);
          }
        } else {
          warning('Registration Response', res.message);
        }
      }
    },
    {
      num: 3,
      title: 'Generate & View Rahul\'s QR Ticket',
      desc: 'Display Rahul\'s secure, unpredictable QR code ticket (EE-XXXXXXXX) with print/download support.',
      icon: <QrCode className="w-5 h-5 text-purple-600" />,
      actionLabel: 'Open My Tickets Page',
      execute: async () => {
        switchDemoRole('participant');
        navigate('/my-tickets');
        onClose();
      }
    },
    {
      num: 4,
      title: 'Scan 1: VALID TICKET Check-In',
      desc: 'Scan Rahul\'s ticket at the entry gate. System records check-in timestamp and increments attendance count to 1.',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      actionLabel: 'Open Scanner & Scan',
      execute: async () => {
        switchDemoRole('volunteer');
        navigate('/scanner');
        onClose();
      }
    },
    {
      num: 5,
      title: 'Scan 2: DUPLICATE CHECK-IN REJECTED',
      desc: 'Attempt to scan the exact same ticket again. Server-side atomic constraint immediately rejects duplicate check-in!',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      actionLabel: 'Test Duplicate Rejection in Scanner',
      execute: async () => {
        switchDemoRole('volunteer');
        navigate('/scanner');
        onClose();
      }
    },
    {
      num: 6,
      title: 'Verify Live Attendance Count = 1',
      desc: 'Confirm attendance count remains exactly 1, preventing duplicate attendance inflation.',
      icon: <ShieldCheck className="w-5 h-5 text-teal-600" />,
      actionLabel: 'Check Attendance Table',
      execute: async () => {
        switchDemoRole('organizer');
        navigate('/organizer/attendance');
        onClose();
      }
    },
    {
      num: 7,
      title: 'Organizer Dashboard & Analytics',
      desc: 'View real-time KPI metrics, attendance percentage, Recharts trends, and certificate eligibility.',
      icon: <LayoutDashboard className="w-5 h-5 text-indigo-600" />,
      actionLabel: 'Open Organizer Dashboard',
      execute: async () => {
        switchDemoRole('organizer');
        navigate('/organizer/dashboard');
        onClose();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Hackathon Demo Walkthrough</h3>
                <p className="text-xs text-slate-300">
                  Step-by-step verification script for Code Carnival 3.0 (PS-03)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Steps List */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {steps.map((step) => {
            const isDone = step.num < currentStep;
            const isCurrent = step.num === currentStep;

            return (
              <div
                key={step.num}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20'
                    : isDone
                    ? 'border-slate-200 bg-slate-50/70 opacity-90'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="shrink-0 pt-0.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        ACTIVE STEP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={step.execute}
                      disabled={isExecuting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {isCurrent && step.num < 7 && (
                      <button
                        onClick={() => setCurrentStep(step.num + 1)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Skip to next step
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Ticket Token:</span>
            <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">
              {demoToken || 'Will generate on Step 2'}
            </code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
