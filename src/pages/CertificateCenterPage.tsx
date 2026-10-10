import React, { useEffect, useState } from 'react';
import {
  Award,
  Download,
  Printer,
  ShieldCheck,
  Settings,
  Eye,
  CheckCircle2,
  Calendar,
  Sparkles,
  Save,
  Loader2
} from 'lucide-react';
import { Certificate, CertificateSettings, CollegeEvent } from '../types';
import { api } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CertificateView } from '../components/certificates/CertificateView';

export const CertificateCenterPage: React.FC = () => {
  const { user, role } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'my_certificates' | 'studio'>('my_certificates');
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [selectedCertForPreview, setSelectedCertForPreview] = useState<Certificate | null>(null);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [selectedStudioEventId, setSelectedStudioEventId] = useState<string>('');
  const [studioSettings, setStudioSettings] = useState<CertificateSettings>({
    id: '',
    event_id: '',
    title: 'Certificate of Participation & Excellence',
    issuing_organization: 'Atmiya University — Code Carnival 3.0',
    signatory_name: 'Dr. Rajesh Patel',
    signatory_role: 'Head of Organizing Committee',
    requires_checkin: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const lookupKey = user?.email || 'rahul.patel@atmiya.edu';
    try {
      const [certs, allEvents] = await Promise.all([
        api.getMyCertificates(lookupKey),
        api.getEvents()
      ]);
      setMyCertificates(certs);
      setEvents(allEvents);
      if (allEvents.length > 0) {
        setSelectedStudioEventId(allEvents[0].id);
        const st = await api.getCertificateSettings(allEvents[0].id);
        if (st) {
          setStudioSettings(st);
        }
      }
    } catch (err) {
      console.error('Error loading certificate center:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSelectStudioEvent = async (evId: string) => {
    setSelectedStudioEventId(evId);
    try {
      const st = await api.getCertificateSettings(evId);
      if (st) {
        setStudioSettings(st);
      } else {
        const ev = events.find(e => e.id === evId);
        setStudioSettings({
          id: '',
          event_id: evId,
          title: 'Certificate of Participation',
          issuing_organization: 'Atmiya University',
          signatory_name: 'Dr. Rajesh Patel',
          signatory_role: 'Event Chair',
          requires_checkin: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudioEventId) return;

    setIsSavingSettings(true);
    try {
      await api.saveCertificateSettings({
        ...studioSettings,
        event_id: selectedStudioEventId
      });
      setIsSavingSettings(false);
      success('Template Saved', 'Certificate template and eligibility settings have been updated.');
    } catch (err: any) {
      setIsSavingSettings(false);
      error('Error', err.message);
    }
  };

  // Sample live mock certificate for studio preview
  const livePreviewCert: Certificate = {
    id: 'preview-cert',
    registration_id: 'reg-preview',
    event_id: selectedStudioEventId || 'demo-event-code-carnival-3',
    certificate_reference: 'CERT-DEMO2025',
    eligibility_status: 'eligible',
    created_at: new Date().toISOString(),
    event_title: events.find(e => e.id === selectedStudioEventId)?.title || 'Code Carnival 3.0 Demo Event',
    participant_name: user?.full_name || 'Rahul Patel',
    event_date: new Date().toISOString().split('T')[0],
    issuing_organization: studioSettings.issuing_organization,
    signatory_name: studioSettings.signatory_name,
    signatory_role: studioSettings.signatory_role
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Verifiable Academic & Event Credentials</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Certificate Center
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Official participation certificates automatically generated upon verified gate check-in.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('my_certificates')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'my_certificates'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Earned Certificates ({myCertificates.length})
          </button>

          {(role === 'organizer' || role === 'admin') && (
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'studio'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Organizer Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: MY CERTIFICATES (PARTICIPANT VIEW) */}
      {activeTab === 'my_certificates' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-200/70 animate-pulse" />
              ))}
            </div>
          ) : myCertificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        Official Certificate
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Ref: {cert.certificate_reference}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                      {cert.event_title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Awarded to <strong className="text-slate-800">{cert.participant_name}</strong> by {cert.issuing_organization}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Attendee
                    </span>

                    <button
                      onClick={() => setSelectedCertForPreview(cert)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto ring-1 ring-amber-200">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Certificates Available Yet</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Certificates are automatically unlocked after your QR ticket is scanned and verified at the event check-in gate.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ORGANIZER CERTIFICATE STUDIO */}
      {activeTab === 'studio' && (
        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Certificate Designer & Signatory Settings</h3>
                  <p className="text-xs text-slate-500">Configure certificate wording and authorized signatures</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* Event Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Event to Configure:
                </label>
                <select
                  value={selectedStudioEventId}
                  onChange={(e) => handleSelectStudioEvent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.event_date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Certificate Headline Title
                  </label>
                  <input
                    type="text"
                    required
                    value={studioSettings.title}
                    onChange={(e) => setStudioSettings({ ...studioSettings, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Issuing Organization / Institution
                  </label>
                  <input
                    type="text"
                    required
                    value={studioSettings.issuing_organization}
                    onChange={(e) => setStudioSettings({ ...studioSettings, issuing_organization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Authorized Signatory Name
                  </label>
                  <input
                    type="text"
                    required
                    value={studioSettings.signatory_name}
                    onChange={(e) => setStudioSettings({ ...studioSettings, signatory_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Signatory Role / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={studioSettings.signatory_role}
                    onChange={(e) => setStudioSettings({ ...studioSettings, signatory_role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Eligibility Rule Switch */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-950">Require Gate QR Check-In</div>
                  <div className="text-[11px] text-emerald-800">
                    Only participants who successfully check in at the gate become eligible for this certificate.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={studioSettings.requires_checkin}
                  onChange={(e) => setStudioSettings({ ...studioSettings, requires_checkin: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                >
                  {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Template Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Interactive Studio Preview */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Certificate Preview (Real-Time Rendering)
              </h3>
            </div>
            <CertificateView certificate={livePreviewCert} />
          </div>
        </div>
      )}

      {/* Certificate Fullscreen Modal for Selected Participant Cert */}
      {selectedCertForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative bg-white rounded-3xl p-6 max-w-4xl w-full space-y-4 my-8 shadow-2xl">
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedCertForPreview(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Close Preview
              </button>
            </div>
            <CertificateView certificate={selectedCertForPreview} />
          </div>
        </div>
      )}
    </div>
  );
};
