import React, { useRef, useState } from 'react';
import { Award, Download, Printer, ShieldCheck, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Certificate } from '../../types';
import { useToast } from '../../context/ToastContext';

interface CertificateViewProps {
  certificate: Certificate;
}

export const CertificateView: React.FC<CertificateViewProps> = ({ certificate }) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { success, error } = useToast();

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setIsDownloading(true);

    try {
      const element = certRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificate-${certificate.certificate_reference}-${certificate.participant_name?.replace(/\s+/g, '_')}.pdf`);
      success('Certificate Downloaded', 'Official participation certificate saved as high-res PDF.');
    } catch (err) {
      console.error('Certificate PDF generation error:', err);
      error('Download Failed', 'Could not generate certificate PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Printable Certificate Frame */}
      <div
        ref={certRef}
        className="w-full max-w-4xl bg-amber-50/20 p-8 sm:p-12 rounded-3xl border-8 border-double border-emerald-800 shadow-2xl relative overflow-hidden text-center text-slate-800"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #ffffff 60%, #f0fdf4 100%)'
        }}
      >
        {/* Subtle decorative corner watermarks */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-emerald-700" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-emerald-700" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-emerald-700" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-emerald-700" />

        {/* University Crest / Award Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-700 text-amber-300 flex items-center justify-center shadow-lg mb-4 ring-4 ring-emerald-100">
          <Award className="w-9 h-9" />
        </div>

        {/* Institution Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-widest text-emerald-950 font-display">
          {certificate.issuing_organization || 'Atmiya University'}
        </h2>
        <p className="text-xs uppercase tracking-widest font-semibold text-emerald-700 mt-1">
          Code Carnival 3.0 • Verified Event Certification
        </p>

        <div className="my-6">
          <span className="text-sm italic font-serif text-slate-500 block mb-2">This is proudly presented to</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight border-b-2 border-emerald-700/30 pb-2 inline-block px-8 max-w-xl truncate">
            {certificate.participant_name || 'Participant'}
          </div>
        </div>

        <p className="text-sm text-slate-700 max-w-2xl mx-auto leading-relaxed">
          in recognition of their successful registration, verified attendance, and active participation in the event{' '}
          <strong className="text-emerald-950 font-bold">"{certificate.event_title}"</strong> conducted with high academic and technical standards.
        </p>

        {/* Signatures and Verification Badges */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          {/* Signatory 1 */}
          <div className="text-center sm:text-left">
            <div className="font-serif italic text-lg text-emerald-950 font-semibold mb-1">
              {certificate.signatory_name || 'Dr. Rajesh Patel'}
            </div>
            <div className="w-36 h-0.5 bg-slate-400 mx-auto sm:mx-0 mb-1" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              {certificate.signatory_role || 'Organizing Authority'}
            </p>
            <p className="text-[10px] text-slate-500">Event Steering Committee</p>
          </div>

          {/* Verification Badge */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
              Official Blockchain-Verifiable Record
            </span>
            <span className="font-mono text-[9px] text-slate-500 mt-0.5">
              Ref: {certificate.certificate_reference}
            </span>
          </div>

          {/* QR Verification Seal */}
          <div className="flex flex-col items-center sm:items-end">
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs">
              <QRCodeSVG
                value={`https://eventease.atmiya.edu/verify/${certificate.certificate_reference}`}
                size={64}
                level="M"
              />
            </div>
            <span className="text-[9px] text-slate-500 mt-1">Scan to Verify Authenticity</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors disabled:opacity-50"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Download High-Res PDF</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-300 shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print Certificate</span>
        </button>
      </div>
    </div>
  );
};
