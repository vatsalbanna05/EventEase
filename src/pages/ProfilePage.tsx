import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Award,
  Ticket,
  CheckCircle2,
  Calendar,
  Edit2,
  Save,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/db';
import { Registration, Certificate } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, role, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tickets, setTickets] = useState<Registration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setStudentId(user.student_id || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  const loadUserData = async () => {
    setIsLoading(true);
    const lookupKey = user?.email || 'rahul.patel@atmiya.edu';
    try {
      const [userTickets, userCerts] = await Promise.all([
        api.getMyTickets(lookupKey),
        api.getMyCertificates(lookupKey)
      ]);
      setTickets(userTickets);
      setCertificates(userCerts);
    } catch (err) {
      console.error('Error loading profile data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        student_id: studentId.trim() || undefined,
        department: department.trim() || undefined,
      });
      setIsSaving(false);
      setIsEditing(false);
      success('Profile Updated', 'Your user details have been saved.');
    } catch (err: any) {
      setIsSaving(false);
      error('Error', err.message);
    }
  };

  const checkedInCount = tickets.filter(t => t.has_checked_in).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900" />

        <div className="px-6 sm:px-8 pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-3xl font-extrabold ring-4 ring-white shadow-xl">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 font-display">
                  {user?.full_name || 'Participant Profile'}
                </h1>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                {role}
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* Profile Details or Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Student ID / Enrollment
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. AU2024-CS-042"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Department / Major
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold">Student ID:</span>
                <span className="font-bold text-slate-900">{user?.student_id || 'AU2024-CS-042'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold">Department:</span>
                <span className="font-bold text-slate-900">{user?.department || 'Computer Science & Eng.'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-semibold">Institution:</span>
                <span className="font-bold text-slate-900">Atmiya University</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Registered Passes</span>
            <div className="text-2xl font-extrabold text-slate-900 font-display">{tickets.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Attended Events</span>
            <div className="text-2xl font-extrabold text-teal-600 font-display">{checkedInCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-400">Earned Certificates</span>
            <div className="text-2xl font-extrabold text-amber-600 font-display">{certificates.length}</div>
          </div>
        </div>
      </div>

      {/* Quick Access to Passes & Certificates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Passes Preview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">My Registered Passes</h3>
            <Link to="/my-tickets" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {tickets.length > 0 ? (
              tickets.slice(0, 3).map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{t.event?.title || 'College Event'}</div>
                    <code className="text-[10px] text-emerald-700 font-mono">{t.ticket_token}</code>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.has_checked_in ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {t.has_checked_in ? 'Checked In' : 'Pending'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3">No active passes registered.</p>
            )}
          </div>
        </div>

        {/* Certificates Preview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Earned Certificates</h3>
            <Link to="/certificates" className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Certificate Center
            </Link>
          </div>

          <div className="space-y-2.5">
            {certificates.length > 0 ? (
              certificates.slice(0, 3).map((c) => (
                <div key={c.id} className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{c.event_title}</div>
                    <div className="text-[10px] font-mono text-slate-500">Ref: {c.certificate_reference}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Verified
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-3">No certificates unlocked yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
