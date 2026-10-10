import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  XCircle,
  AlertTriangle,
  Search,
  Calendar,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { api } from '../services/db';
import { CertificateVerificationResult } from '../types';

export const VerifyCertificatePage: React.FC = () => {
  const { reference } = useParams<{ reference?: string }>();
  const [searchInput, setSearchInput] = useState(reference || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);
  const [searchedRef, setSearchedRef] = useState<string>('');

  const performVerification = async (refToVerify: string) => {
    const clean = refToVerify.trim().toUpperCase();
    if (!clean) return;

    setIsLoading(true);
    setSearchedRef(clean);
    try {
      const res = await api.verifyCertificate(clean);
      setResult(res);
    } catch (err: any) {
      setResult({
        status: 'invalid',
        message: err.message || 'Error occurred while verifying certificate.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reference) {
      setSearchInput(reference);
      performVerification(reference);
    }
  }, [reference]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(searchInput);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not Specified';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Public Credential Verification Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
          Verify Certificate Authenticity
        </h1>
        <p className="text-sm text-slate-600">
          Instant public verification of certificates issued by Atmiya University events. All credentials carry a tamper-proof verification reference.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            required
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Certificate ID (e.g., CERT-A1B2C3D4)"
            className="w-full pl-11 pr-32 py-3.5 rounded-2xl border border-slate-300 text-slate-900 font-mono text-sm shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
          <button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="absolute right-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>Verify</span>
          </button>
        </div>
      </form>

      {/* Verification Result Card */}
      {result && (
        <div className="max-w-2xl mx-auto">
          {result.status === 'valid' && result.certificate && (
            <div className="bg-white rounded-3xl border-2 border-emerald-500/80 shadow-xl overflow-hidden animate-fadeIn">
              {/* Status Header Banner */}
              <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Authentic & Verified Credential</h2>
                    <p className="text-xs text-emerald-100">Valid record in the university registry</p>
                  </div>
                </div>
                <span className="font-mono text-xs bg-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-500">
                  {result.certificate.certificate_reference}
                </span>
              </div>

              {/* Certificate Details */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Awarded To</span>
                  <div className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {result.certificate.participant_name}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Event Title</span>
                    <div className="text-sm font-bold text-emerald-950 mt-0.5">
                      {result.certificate.event_title}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Event Date</span>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5">
                      {formatDate(result.certificate.event_date)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Issuing Institution</span>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5">
                      {result.certificate.issuing_organization}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Authorized Signatory</span>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5">
                      {result.certificate.signatory_name}
                      <span className="block text-xs text-slate-500 font-normal">{result.certificate.signatory_role}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">
                    Official Issue Date: <strong className="text-slate-800">{formatDate(result.certificate.issued_at)}</strong>
                  </span>

                  {/* Privacy Safeguard Note */}
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personal contact details & ID protected</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {result.status === 'revoked' && result.certificate && (
            <div className="bg-white rounded-3xl border-2 border-rose-500 shadow-xl overflow-hidden animate-fadeIn">
              <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-rose-200" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider">Credential Revoked</h2>
                    <p className="text-xs text-rose-100">This certificate is no longer valid</p>
                  </div>
                </div>
                <span className="font-mono text-xs bg-rose-700 px-2.5 py-1 rounded-lg border border-rose-500">
                  {result.certificate.certificate_reference}
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                  <div className="font-bold">Revocation Notice:</div>
                  <p>
                    {result.certificate.revoked_reason || 'This certificate was officially revoked by the event organizing committee.'}
                  </p>
                  {result.certificate.revoked_at && (
                    <div className="text-[11px] text-rose-700 pt-1">
                      Revocation Date: {formatDate(result.certificate.revoked_at)}
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div><strong>Awardee:</strong> {result.certificate.participant_name}</div>
                  <div><strong>Event:</strong> {result.certificate.event_title}</div>
                  <div><strong>Institution:</strong> {result.certificate.issuing_organization}</div>
                </div>
              </div>
            </div>
          )}

          {result.status === 'invalid' && (
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-8 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto ring-1 ring-rose-200">
                <XCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Certificate Reference Not Found</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  No certificate was found with reference <strong className="font-mono text-slate-800">"{searchedRef}"</strong>.
                  Please check the ID for typos or verify that the pass was officially issued.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  <span>Explore Campus Events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
