import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Shield, RotateCcw, Database, Award, CheckCircle2 } from 'lucide-react';
import { resetDemoDatabase } from '../../services/db';
import { isSupabaseConfigured } from '../../services/supabase';
import { useToast } from '../../context/ToastContext';

export const Footer: React.FC = () => {
  const { success } = useToast();
  const isLive = isSupabaseConfigured();

  const handleResetData = () => {
    resetDemoDatabase();
    success('Demo Database Reset', 'Demo events, capacities, and records have been re-seeded.');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: Brand & Hackathon Context */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">EventEase</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Centralized Smart College Event Registration, Dynamic QR Ticketing & Anti-Duplicate Check-In System. Built for Code Carnival 3.0, Atmiya University under Problem Statement PS-03.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Problem Statement PS-03
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                {isLive ? 'Supabase PostgreSQL' : 'Instant Demo DB Mode'}
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/events" className="hover:text-emerald-400 transition-colors">Explore Events</Link>
              </li>
              <li>
                <Link to="/my-tickets" className="hover:text-emerald-400 transition-colors">My QR Tickets</Link>
              </li>
              <li>
                <Link to="/scanner" className="hover:text-emerald-400 transition-colors">Staff QR Scanner</Link>
              </li>
              <li>
                <Link to="/certificates" className="hover:text-emerald-400 transition-colors">Certificate Center</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Hackathon Demo Controls */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Organizer & Demo</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/organizer/dashboard" className="hover:text-emerald-400 transition-colors">Organizer Dashboard</Link>
              </li>
              <li>
                <Link to="/organizer/attendance" className="hover:text-emerald-400 transition-colors">Live Attendance Grid</Link>
              </li>
              <li>
                <button
                  onClick={handleResetData}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors mt-2"
                  title="Reset local sample events and registrations for a clean hackathon demo run"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo State</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & university credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2025 EventEase. Developed for Code Carnival 3.0 at Atmiya University.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Row-Level Security & Atomic RPC
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
