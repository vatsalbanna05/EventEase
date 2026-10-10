import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  QrCode,
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  Award,
  LogOut,
  LogIn,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Play,
  Database,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole, AppNotification } from '../../types';
import { api } from '../../services/db';

interface NavbarProps {
  onOpenDemoGuide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDemoGuide }) => {
  const { user, role, isAuthenticated, signOut, switchDemoRole, isDemoMode } = useAuth();
  const { info } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  useEffect(() => {
    const loadNotifs = async () => {
      if (!user?.email) {
        setNotifications([]);
        return;
      }
      const data = await api.getMyNotifications(user.email);
      setNotifications(data);
    };
    loadNotifs();

    const handleDataChange = () => {
      loadNotifs();
    };
    window.addEventListener('eventease:data_changed', handleDataChange);
    return () => {
      window.removeEventListener('eventease:data_changed', handleDataChange);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const isActive = (path: string) => location.pathname === path;

  const handleRoleChange = (newRole: UserRole) => {
    switchDemoRole(newRole);
    setRoleDropdownOpen(false);
    info(`Switched Active Role to ${newRole.toUpperCase()}`, `Now previewing platform as a ${newRole}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top University Banner & Role Switcher Ticker */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Code Carnival 3.0
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="font-medium text-slate-300">Atmiya University — Problem Statement PS-03</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Quick Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors"
                title="Quick Role Switcher for Hackathon Testing"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Role: <strong className="text-emerald-300 capitalize">{role}</strong></span>
                <span className="text-slate-400 text-[9px]">▼</span>
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-slate-800">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Switch Test Persona
                  </div>
                  <button
                    onClick={() => handleRoleChange('organizer')}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 ${role === 'organizer' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'}`}
                  >
                    <span>Prof. Rajesh (Organizer)</span>
                    {role === 'organizer' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleChange('volunteer')}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 ${role === 'volunteer' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'}`}
                  >
                    <span>Aarav Shah (Volunteer)</span>
                    {role === 'volunteer' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <button
                    onClick={() => handleRoleChange('participant')}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-50 ${role === 'participant' ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'}`}
                  >
                    <span>Rahul Patel (Participant)</span>
                    {role === 'participant' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>
              )}
            </div>

            {/* Hackathon Demo Walkthrough Button */}
            {onOpenDemoGuide && (
              <button
                onClick={onOpenDemoGuide}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors shadow-xs"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Demo Walkthrough</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-display">EventEase</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">SMART</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium -mt-1 hidden sm:block">Campus Event & QR Check-In</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/events"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/events')
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Explore Events
            </Link>

            {/* Participant Ticket Link */}
            <Link
              to="/my-tickets"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/my-tickets')
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Ticket className="w-4 h-4 text-emerald-600" />
              <span>My Tickets</span>
            </Link>

            {/* Volunteer & Organizer QR Scanner */}
            {(role === 'volunteer' || role === 'organizer' || role === 'admin') && (
              <Link
                to="/scanner"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/scanner')
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100/80'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>QR Check-In Scanner</span>
              </Link>
            )}

            {/* Organizer Controls */}
            {(role === 'organizer' || role === 'admin') && (
              <>
                <Link
                  to="/organizer/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/organizer/dashboard')
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/organizer/events"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/organizer/events')
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Manage Events
                </Link>

                <Link
                  to="/organizer/attendance"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/organizer/attendance')
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Attendance</span>
                </Link>
              </>
            )}

            <Link
              to="/certificates"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/certificates')
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Certificates</span>
            </Link>

            <Link
              to="/verify-certificate"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/verify-certificate')
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Verify</span>
            </Link>
          </nav>

          {/* User Account / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {(role === 'organizer' || role === 'admin') && (
              <Link
                to="/organizer/create-event"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Event</span>
              </Link>
            )}

            {/* Notification Bell Component */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="In-App Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white ring-2 ring-white shadow-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={async () => {
                            if (user?.email) {
                              await api.markAllNotificationsAsRead(user.email);
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                            }
                          }}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <p className="text-xs text-slate-400">No notifications at this time.</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={async () => {
                              if (!n.read) {
                                await api.markNotificationAsRead(n.id);
                                setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                              }
                              if (n.link) {
                                setNotifDropdownOpen(false);
                                navigate(n.link);
                              }
                            }}
                            className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${!n.read ? 'bg-emerald-50/50' : ''}`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                              n.type === 'registration' ? 'bg-emerald-100 text-emerald-700' :
                              n.type === 'certificate' ? 'bg-amber-100 text-amber-700' :
                              n.type === 'event_update' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {n.type === 'registration' && <Ticket className="w-3.5 h-3.5" />}
                              {n.type === 'certificate' && <Award className="w-3.5 h-3.5" />}
                              {n.type === 'event_update' && <Calendar className="w-3.5 h-3.5" />}
                              {n.type === 'system' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} truncate`}>
                                  {n.title}
                                </p>
                                {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>}
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                              <span className="text-[9px] text-slate-400 mt-1 block">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  title="View Profile"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold ring-2 ring-emerald-500/30">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left leading-tight hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[110px]">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{role}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile menu and notifications */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold text-white ring-2 ring-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Explore Events
          </Link>
          <Link
            to="/my-tickets"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            My Tickets
          </Link>
          <Link
            to="/scanner"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50"
          >
            QR Check-In Scanner
          </Link>
          {(role === 'organizer' || role === 'admin') && (
            <>
              <Link
                to="/organizer/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                Organizer Dashboard
              </Link>
              <Link
                to="/organizer/events"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                Manage Events
              </Link>
              <Link
                to="/organizer/attendance"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                Attendance Management
              </Link>
              <Link
                to="/organizer/create-event"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50"
              >
                + Create New Event
              </Link>
            </>
          )}
          <Link
            to="/certificates"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Certificates
          </Link>
          <Link
            to="/verify-certificate"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 hover:bg-slate-100"
          >
            Verify Credential
          </Link>
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800"
            >
              Profile ({user?.full_name})
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="text-xs font-semibold text-rose-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
