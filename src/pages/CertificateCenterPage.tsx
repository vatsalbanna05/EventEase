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
  Loader2,
  Clock,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  FileCheck2,
  Filter,
  UserCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  Certificate,
  CertificateSettings,
  CertificateRequest,
  CollegeEvent,
  EligibilityRule
} from '../types';
import { api } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CertificateView } from '../components/certificates/CertificateView';

export const CertificateCenterPage: React.FC = () => {
  const { user, role } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'my_certificates' | 'my_requests' | 'organizer_requests' | 'registry' | 'studio'>('my_certificates');
  
  // Data state
  const [myCertificates, setMyCertificates] = useState<Certificate[]>([]);
  const [myRequests, setMyRequests] = useState<CertificateRequest[]>([]);
  const [allCertificates, setAllCertificates] = useState<Certificate[]>([]);
  const [allRequests, setAllRequests] = useState<CertificateRequest[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  
  // Selected preview certificate
  const [selectedCertForPreview, setSelectedCertForPreview] = useState<Certificate | null>(null);

  // Studio Settings state
  const [selectedStudioEventId, setSelectedStudioEventId] = useState<string>('');
  const [studioSettings, setStudioSettings] = useState<CertificateSettings>({
    id: '',
    event_id: '',
    title: 'Certificate of Excellence & Participation',
    issuing_organization: 'Atmiya University — Code Carnival 3.0',
    signatory_name: 'Dr. Rajesh Patel',
    signatory_role: 'Head of Organizing Committee',
    requires_checkin: true,
    eligibility_rule: 'checked_in'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  // Revoke Modal state
  const [revokingCert, setRevokingCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('Found duplicate or unauthorized registration entry');

  const isStaff = role === 'organizer' || role === 'admin' || role === 'volunteer';

  const loadData = async () => {
    setIsLoading(true);
    const lookupKey = user?.email || user?.id || 'rahul.patel@atmiya.edu';
    try {
      const [certs, userReqs, allEvs] = await Promise.all([
        api.getMyCertificates(lookupKey),
        api.getMyCertificateRequests(lookupKey),
        api.getEvents()
      ]);
      setMyCertificates(certs);
      setMyRequests(userReqs);
      setEvents(allEvs);

      if (isStaff) {
        const [orgCerts, orgReqs] = await Promise.all([
          api.getAllCertificates(),
          api.getAllCertificateRequests()
        ]);
        setAllCertificates(orgCerts);
        setAllRequests(orgReqs);
      }

      if (allEvs.length > 0 && !selectedStudioEventId) {
        setSelectedStudioEventId(allEvs[0].id);
        const st = await api.getCertificateSettings(allEvs[0].id);
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
  }, [user, role]);

  const handleSelectStudioEvent = async (evId: string) => {
    setSelectedStudioEventId(evId);
    try {
      const st = await api.getCertificateSettings(evId);
      if (st) {
        setStudioSettings(st);
      } else {
        const ev = events.find((e) => e.id === evId);
        setStudioSettings({
          id: '',
          event_id: evId,
          title: 'Certificate of Participation',
          issuing_organization: 'Atmiya University',
          signatory_name: 'Dr. Rajesh Patel',
          signatory_role: 'Head of Organizing Committee',
          requires_checkin: true,
          eligibility_rule: 'checked_in'
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
      await api.saveCertificateSettings(
        {
          ...studioSettings,
          event_id: selectedStudioEventId
        },
        role
      );
      setIsSavingSettings(false);
      success('Template Saved', 'Certificate template and eligibility rules updated successfully.');
      loadData();
    } catch (err: any) {
      setIsSavingSettings(false);
      error('Error', err.message);
    }
  };

  // Organizer Reviews
  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const res = await api.reviewCertificateRequest({
        requestId,
        decision: 'approved',
        operatorRole: role,
        reviewerId: user?.id,
        reviewNotes: 'Early departure approved by organizer committee.'
      });

      if (res.success) {
        success('Request Approved', 'Certificate generated and verified for the participant.');
        loadData();
      } else {
        error('Action Failed', res.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const note = window.prompt('Enter reason for declining this certificate request:');
    if (note === null) return;

    setProcessingRequestId(requestId);
    try {
      const res = await api.reviewCertificateRequest({
        requestId,
        decision: 'rejected',
        operatorRole: role,
        reviewerId: user?.id,
        reviewNotes: note || 'Request declined by organizer.'
      });

      if (res.success) {
        info('Request Declined', 'Participant request has been marked as rejected.');
        loadData();
      } else {
        error('Action Failed', res.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Revoke Certificate
  const handleRevokeConfirm = async () => {
    if (!revokingCert) return;

    try {
      const res = await api.revokeCertificate({
        certificateReference: revokingCert.certificate_reference,
        operatorRole: role,
        reason: revokeReason
      });

      if (res.success) {
        success('Certificate Revoked', `Credential ${revokingCert.certificate_reference} marked as revoked.`);
        setRevokingCert(null);
        loadData();
      } else {
        error('Revoke Failed', res.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  // Reissue Certificate
  const handleReissue = async (certRef: string) => {
    if (!window.confirm(`Are you sure you want to reinstate & reissue certificate ${certRef}?`)) return;

    try {
      const res = await api.reissueCertificate({
        certificateReference: certRef,
        operatorRole: role
      });

      if (res.success) {
        success('Certificate Reissued', `Credential ${certRef} is now active and verified.`);
        loadData();
      } else {
        error('Reissue Failed', res.message);
      }
    } catch (err: any) {
      error('Error', err.message);
    }
  };

  // Live preview cert
  const livePreviewCert: Certificate = {
    id: 'preview-cert',
    registration_id: 'reg-preview',
    event_id: selectedStudioEventId || 'demo-event-code-carnival-3',
    certificate_reference: 'CERT-DEMO2025',
    eligibility_status: 'eligible',
    created_at: new Date().toISOString(),
    event_title: events.find((e) => e.id === selectedStudioEventId)?.title || 'Code Carnival 3.0 Demo Event',
    participant_name: user?.full_name || 'Rahul Patel',
    event_date: new Date().toISOString().split('T')[0],
    issuing_organization: studioSettings.issuing_organization,
    signatory_name: studioSettings.signatory_name,
    signatory_role: studioSettings.signatory_role
  };

  const pendingRequestsCount = allRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Digital Certificate Management System</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            Certificate Center
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Verifiable participation credentials, configurable eligibility rules, and early departure review.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab('my_certificates')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'my_certificates'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Earned Passes ({myCertificates.length})
          </button>

          <button
            onClick={() => setActiveTab('my_requests')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'my_requests'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Requests ({myRequests.length})
          </button>

          {isStaff && (
            <>
              <button
                onClick={() => setActiveTab('organizer_requests')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'organizer_requests'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Review Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-amber-800 font-bold">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('registry')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'registry'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Issued Registry ({allCertificates.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('studio')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'studio'
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Rules & Designer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: MY CERTIFICATES (PARTICIPANT) */}
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
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        cert.eligibility_status === 'revoked'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {cert.eligibility_status === 'revoked' ? 'Revoked' : 'Official Certificate'}
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
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Credential
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
                  Certificates are unlocked upon verified gate check-in or approved early departure. View your passes under My Tickets to submit a request.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MY CERTIFICATE REQUESTS (PARTICIPANT) */}
      {activeTab === 'my_requests' && (
        <div className="space-y-6">
          {myRequests.length > 0 ? (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{req.event_title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status === 'approved' ? 'Approved' : req.status === 'rejected' ? 'Declined' : 'Pending Review'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Reason:</strong> {req.reason}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Submitted on {new Date(req.requested_at).toLocaleDateString()}
                    </p>
                  </div>

                  {req.status === 'approved' && (
                    <button
                      onClick={() => setActiveTab('my_certificates')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      View Issued Certificate
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3 max-w-md mx-auto">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Early Exit Requests</h3>
              <p className="text-xs text-slate-500">
                You haven't submitted any early departure or certificate requests. You can submit one from My Tickets.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: ORGANIZER REVIEW REQUESTS (ORGANIZER) */}
      {activeTab === 'organizer_requests' && isStaff && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Pending Early-Exit & Certificate Requests ({allRequests.length})
            </h3>
          </div>

          {allRequests.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Participant</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Reason / Details</th>
                      <th className="px-4 py-3">Gate Check-In Status</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900">{req.participant_name}</div>
                          <div className="text-[11px] text-slate-500">{req.participant_email}</div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {req.event_title}
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="line-clamp-2 text-slate-600">{req.reason}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {req.has_checked_in ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Gate Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Not Gate Checked In (Early Exit)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveRequest(req.id)}
                                disabled={processingRequestId === req.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                {processingRequestId === req.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => handleRejectRequest(req.id)}
                                disabled={processingRequestId === req.id}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                <span>Decline</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No pending certificate or early departure requests.
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: ISSUED CREDENTIALS REGISTRY (ORGANIZER) */}
      {activeTab === 'registry' && isStaff && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Issued Credential Registry ({allCertificates.length})
            </h3>
          </div>

          {allCertificates.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Reference ID</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Issue Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allCertificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-emerald-800">
                          {cert.certificate_reference}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {cert.participant_name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          {cert.event_title}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : 'Issued'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cert.eligibility_status === 'revoked'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {cert.eligibility_status === 'revoked' ? 'REVOKED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCertForPreview(cert)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                            >
                              View
                            </button>

                            {cert.eligibility_status === 'revoked' ? (
                              <button
                                onClick={() => handleReissue(cert.certificate_reference)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                              >
                                Reissue
                              </button>
                            ) : (
                              <button
                                onClick={() => setRevokingCert(cert)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              No certificates issued yet.
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: ORGANIZER STUDIO (CONFIG & RULES) */}
      {activeTab === 'studio' && isStaff && (
        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Certificate Designer & Eligibility Rules</h3>
                  <p className="text-xs text-slate-500">Configure certificate wording, signatures, and attendance requirements</p>
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

              {/* Eligibility Rule Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Certificate Eligibility Rule:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    (studioSettings.eligibility_rule || 'checked_in') === 'checked_in'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="eligibility_rule"
                      value="checked_in"
                      checked={(studioSettings.eligibility_rule || 'checked_in') === 'checked_in'}
                      onChange={() => setStudioSettings({ ...studioSettings, eligibility_rule: 'checked_in', requires_checkin: true })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">Gate Checked-In Only</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Standard rule: Requires verified gate QR check-in record.
                    </p>
                  </label>

                  <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    studioSettings.eligibility_rule === 'registered'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="eligibility_rule"
                      value="registered"
                      checked={studioSettings.eligibility_rule === 'registered'}
                      onChange={() => setStudioSettings({ ...studioSettings, eligibility_rule: 'registered', requires_checkin: false })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">All Registered Users</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Any participant with a confirmed registration pass is eligible.
                    </p>
                  </label>

                  <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    studioSettings.eligibility_rule === 'organizer_approved'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="eligibility_rule"
                      value="organizer_approved"
                      checked={studioSettings.eligibility_rule === 'organizer_approved'}
                      onChange={() => setStudioSettings({ ...studioSettings, eligibility_rule: 'organizer_approved' })}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">Organizer-Approved</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Requires explicit review and approval of early-exit or certificate requests.
                    </p>
                  </label>
                </div>
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

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                >
                  {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Studio Preview */}
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

      {/* Revocation Modal */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Revoke Certificate Credential</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to revoke certificate <strong className="font-mono">{revokingCert.certificate_reference}</strong> issued to <strong>{revokingCert.participant_name}</strong>.
              This will mark the credential as invalid in the public registry.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Reason for Revocation:
              </label>
              <textarea
                rows={2}
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokingCert(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Certificate Modal */}
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
