import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { success, error, info } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    if (mode === 'signin') {
      const res = await signIn(email, password || 'demo-password');
      setIsSubmitting(false);

      if (res.success) {
        success('Welcome back!', `Signed in as ${email}`);
        navigate('/events');
      } else {
        setFormError(res.error || 'Invalid credentials.');
        error('Sign In Failed', res.error || 'Please check your email.');
      }
    } else {
      if (!fullName.trim()) {
        setIsSubmitting(false);
        setFormError('Please provide your full name.');
        return;
      }

      const res = await signUp({
        fullName,
        email,
        password: password || 'demo-password',
        role,
        studentId: studentId.trim() || undefined,
        department: department.trim() || undefined,
      });

      setIsSubmitting(false);

      if (res.success) {
        success('Account Created!', `Welcome to EventEase, ${fullName}`);
        navigate('/events');
      } else {
        setFormError(res.error || 'Sign up failed.');
        error('Sign Up Failed', res.error || 'Could not register account.');
      }
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoRoleName: string) => {
    setEmail(demoEmail);
    setPassword('demo-password');
    setIsSubmitting(true);
    const res = await signIn(demoEmail, 'demo-password');
    setIsSubmitting(false);
    if (res.success) {
      info(`Logged in as ${demoRoleName}`, `Active email: ${demoEmail}`);
      navigate('/events');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight">EventEase Auth</h2>
          <p className="text-xs text-slate-300 mt-1">
            Access your tickets, event check-in scanner, and analytics
          </p>

          {/* Tab Switcher */}
          <div className="mt-5 flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <button
              onClick={() => {
                setMode('signin');
                setFormError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setFormError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Patel"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Account Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="participant">Participant (Student / Attendee)</option>
                    <option value="volunteer">Volunteer (Gate Check-In Staff)</option>
                    <option value="organizer">Organizer (Faculty / Event Head)</option>
                  </select>
                </div>

                {role === 'participant' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Student ID / Roll No.
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. AU2024-CS-042"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.patel@atmiya.edu"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Account' : 'Create New Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Hackathon Evaluators */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Hackathon Demo Logins
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickDemoLogin('organizer@atmiya.edu', 'Prof. Rajesh (Organizer)')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-800">Prof. Rajesh</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Organizer Profile</div>
              </button>

              <button
                onClick={() => handleQuickDemoLogin('volunteer@atmiya.edu', 'Aarav Shah (Volunteer)')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-800">Aarav Shah</div>
                <div className="text-[10px] text-teal-700 font-semibold">Volunteer (Gate Staff)</div>
              </button>

              <button
                onClick={() => handleQuickDemoLogin('rahul.patel@atmiya.edu', 'Rahul Patel (Participant)')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-800">Rahul Patel</div>
                <div className="text-[10px] text-blue-700 font-semibold">Participant (Demo User)</div>
              </button>

              <button
                onClick={() => handleQuickDemoLogin('priya.sharma@atmiya.edu', 'Priya Sharma (Participant)')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition-colors"
              >
                <div className="text-xs font-bold text-slate-800">Priya Sharma</div>
                <div className="text-[10px] text-purple-700 font-semibold">Participant</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
