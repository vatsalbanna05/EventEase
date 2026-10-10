import { jsPDF } from 'jspdf';
import { ReportType, ReportItem } from '../types';

/**
 * Format ISO timestamp into clean date string
 * e.g. "2026-10-10 14:30:00"
 */
export const formatReportDate = (isoString?: string): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
  } catch {
    return isoString;
  }
};

/**
 * Format date for human reading
 * e.g. "10 Oct 2026, 02:30 PM"
 */
export const formatDisplayDate = (isoString?: string): string => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
};

/**
 * RFC 4180 CSV Escaping
 * Wraps values with quotes if they contain commas, quotes, or newlines,
 * and doubles internal quotes.
 */
export const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Generate sanitized filename safe for all file systems
 */
export const generateReportFilename = (
  reportType: ReportType,
  eventTitle: string,
  extension: 'csv' | 'pdf'
): string => {
  const safeTitle = (eventTitle || 'All_Events')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
  const typeLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1);
  const dateStr = new Date().toISOString().split('T')[0];
  return `EventEase_${typeLabel}_Report_${safeTitle}_${dateStr}.${extension}`;
};

/**
 * Build CSV string from Report Items with UTF-8 BOM
 */
export const generateCSVContent = (
  reportType: ReportType,
  items: ReportItem[]
): string => {
  let headers: string[] = [];
  let rowExtractor: (item: ReportItem, index: number) => any[];

  switch (reportType) {
    case 'participant':
      headers = [
        '#',
        'Participant Name',
        'College Email',
        'Student ID',
        'Event Name',
        'Registration Date',
        'Registration Status',
        'Ticket Pass Token'
      ];
      rowExtractor = (item, idx) => [
        idx + 1,
        item.participant_name,
        item.participant_email,
        item.student_id || 'N/A',
        item.event_title,
        formatReportDate(item.registered_at),
        item.registration_status.toUpperCase(),
        item.ticket_token
      ];
      break;

    case 'attendance':
      headers = [
        '#',
        'Participant Name',
        'College Email',
        'Event Name',
        'Check-In Status',
        'Check-In Timestamp',
        'Ticket Pass Token'
      ];
      rowExtractor = (item, idx) => [
        idx + 1,
        item.participant_name,
        item.participant_email,
        item.event_title,
        item.has_checked_in ? 'CHECKED IN' : 'NOT CHECKED IN',
        item.has_checked_in ? formatReportDate(item.checked_in_at) : 'N/A',
        item.ticket_token
      ];
      break;

    case 'certificate':
      headers = [
        '#',
        'Participant Name',
        'College Email',
        'Event Name',
        'Certificate Verification ID',
        'Certificate Status',
        'Issue Date'
      ];
      rowExtractor = (item, idx) => [
        idx + 1,
        item.participant_name,
        item.participant_email,
        item.event_title,
        item.certificate_reference || 'Not Issued',
        (item.certificate_status || 'Eligible').toUpperCase(),
        item.certificate_issued_at ? formatReportDate(item.certificate_issued_at) : 'N/A'
      ];
      break;
  }

  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  let csv = '\uFEFF';
  csv += headers.map(escapeCSV).join(',') + '\r\n';

  items.forEach((item, idx) => {
    const row = rowExtractor(item, idx);
    csv += row.map(escapeCSV).join(',') + '\r\n';
  });

  return csv;
};

/**
 * Trigger client-side browser download for CSV
 */
export const downloadCSV = (
  reportType: ReportType,
  items: ReportItem[],
  eventTitle: string = 'All Events'
): void => {
  const content = generateCSVContent(reportType, items);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generateReportFilename(reportType, eventTitle, 'csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate & Download Professional EventEase PDF Report
 */
export const downloadPDF = (params: {
  reportType: ReportType;
  items: ReportItem[];
  eventTitle: string;
  filterSummary: string;
  organizerName?: string;
}): void => {
  const { reportType, items, eventTitle, filterSummary, organizerName = 'Prof. Rajesh Mehta' } = params;

  // Create A4 Landscape document (297mm x 210mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297
  const pageHeight = doc.internal.pageSize.getHeight(); // 210
  const margin = 14;
  const usableWidth = pageWidth - margin * 2; // 269mm

  // Report Title Mapping
  const reportTitles: Record<ReportType, string> = {
    participant: 'OFFICIAL PARTICIPANT ROSTER & REGISTRATION REPORT',
    attendance: 'GATE ATTENDANCE VERIFICATION & CHECK-IN REPORT',
    certificate: 'DIGITAL CREDENTIAL ISSUANCE & VERIFICATION REGISTRY'
  };

  // Helper to draw Header & Metadata box
  const drawPageHeader = (pageNum: number, totalPagesPlaceholder: boolean = false) => {
    // 1. Dark Slate Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, 10, usableWidth, 20, 'F');

    // 2. Emerald accent underline
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(margin, 30, usableWidth, 2, 'F');

    // Branding Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('EventEase', margin + 6, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(167, 243, 208); // emerald-200
    doc.text('SMART COLLEGE EVENT REGISTRATION & CHECK-IN SYSTEM', margin + 35, 18);

    // Report Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(reportTitles[reportType], margin + 6, 26);

    // Right-aligned Institution badge
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Atmiya University — Code Carnival 3.0', pageWidth - margin - 6, 18, { align: 'right' });
    doc.text(`Generated: ${formatReportDate(new Date().toISOString())}`, pageWidth - margin - 6, 26, { align: 'right' });

    // 3. Metadata Filter Summary Box (only on page 1)
    if (pageNum === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(margin, 35, usableWidth, 14, 'FD');

      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFont('helvetica', 'bold');
      doc.text('Target Event:', margin + 4, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(eventTitle || 'All Events Portfolio', margin + 26, 40);

      doc.setFont('helvetica', 'bold');
      doc.text('Organizer:', margin + 110, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(organizerName, margin + 128, 40);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Records:', margin + 210, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(`${items.length} records exported`, margin + 233, 40);

      doc.setFont('helvetica', 'bold');
      doc.text('Filter Criteria:', margin + 4, 46);
      doc.setFont('helvetica', 'normal');
      doc.text(filterSummary, margin + 26, 46);
    }
  };

  // Helper to draw page footer
  const drawPageFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      'EventEase Verified Administrative Document • Atmiya University Problem Statement PS-03',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // Define Columns & Widths per Report Type
  interface ColumnDef {
    header: string;
    width: number;
    align?: 'left' | 'center' | 'right';
  }

  let columns: ColumnDef[] = [];

  if (reportType === 'participant') {
    columns = [
      { header: '#', width: 10, align: 'center' },
      { header: 'Participant Name', width: 48 },
      { header: 'College Email', width: 55 },
      { header: 'Student ID', width: 30, align: 'center' },
      { header: 'Event Title', width: 56 },
      { header: 'Registration Date', width: 40 },
      { header: 'Status', width: 30, align: 'center' }
    ];
  } else if (reportType === 'attendance') {
    columns = [
      { header: '#', width: 10, align: 'center' },
      { header: 'Participant Name', width: 52 },
      { header: 'College Email', width: 55 },
      { header: 'Event Title', width: 60 },
      { header: 'Check-In Status', width: 32, align: 'center' },
      { header: 'Check-In Timestamp', width: 36 },
      { header: 'Pass Token', width: 24, align: 'center' }
    ];
  } else {
    // certificate
    columns = [
      { header: '#', width: 10, align: 'center' },
      { header: 'Participant Name', width: 50 },
      { header: 'College Email', width: 55 },
      { header: 'Event Title', width: 58 },
      { header: 'Certificate Ref ID', width: 38, align: 'center' },
      { header: 'Status', width: 28, align: 'center' },
      { header: 'Issued Date', width: 30 }
    ];
  }

  // Draw Table Header Row
  const drawTableHeader = (startY: number) => {
    doc.setFillColor(4, 120, 87); // emerald-700
    doc.rect(margin, startY, usableWidth, 7, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let currentX = margin;
    columns.forEach((col) => {
      const textX = col.align === 'center'
        ? currentX + col.width / 2
        : currentX + 2;
      doc.text(col.header, textX, startY + 4.8, {
        align: col.align === 'center' ? 'center' : 'left'
      });
      currentX += col.width;
    });
  };

  // Paginated Rendering
  let currentPage = 1;
  let yPos = 52; // start below metadata box on page 1

  drawPageHeader(currentPage);
  drawTableHeader(yPos);
  yPos += 7;

  if (items.length === 0) {
    // Empty state message
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPos, usableWidth, 20, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No records found matching the specified report criteria.', pageWidth / 2, yPos + 11, {
      align: 'center'
    });
  } else {
    items.forEach((item, index) => {
      // Check if page overflow
      if (yPos > pageHeight - 22) {
        currentPage++;
        doc.addPage();
        drawPageHeader(currentPage);
        yPos = 35; // start below header on subsequent pages
        drawTableHeader(yPos);
        yPos += 7;
      }

      // Alternating row color
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin, yPos, usableWidth, 6.5, 'F');
      }

      // Row border bottom
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, yPos + 6.5, margin + usableWidth, yPos + 6.5);

      // Row Data extraction
      let rowValues: string[] = [];
      if (reportType === 'participant') {
        rowValues = [
          String(index + 1),
          item.participant_name,
          item.participant_email,
          item.student_id || 'N/A',
          item.event_title,
          formatDisplayDate(item.registered_at),
          item.registration_status.toUpperCase()
        ];
      } else if (reportType === 'attendance') {
        rowValues = [
          String(index + 1),
          item.participant_name,
          item.participant_email,
          item.event_title,
          item.has_checked_in ? 'CHECKED IN' : 'NOT CHECKED IN',
          item.has_checked_in ? formatDisplayDate(item.checked_in_at) : '—',
          item.ticket_token
        ];
      } else {
        rowValues = [
          String(index + 1),
          item.participant_name,
          item.participant_email,
          item.event_title,
          item.certificate_reference || 'Not Issued',
          (item.certificate_status || 'Eligible').toUpperCase(),
          item.certificate_issued_at ? formatDisplayDate(item.certificate_issued_at) : '—'
        ];
      }

      // Print cells
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59); // slate-800

      let currentX = margin;
      rowValues.forEach((val, colIdx) => {
        const col = columns[colIdx];
        const textX = col.align === 'center'
          ? currentX + col.width / 2
          : currentX + 2;

        // Truncate text if it exceeds column width
        const maxChars = Math.floor(col.width * 0.45);
        let printVal = val;
        if (col.align !== 'center' && printVal.length > maxChars) {
          printVal = printVal.slice(0, maxChars - 2) + '..';
        }

        // Color coding for status values
        if (col.header.includes('Status')) {
          if (val === 'CONFIRMED' || val === 'CHECKED IN' || val === 'ISSUED') {
            doc.setTextColor(4, 120, 87); // emerald-700
            doc.setFont('helvetica', 'bold');
          } else if (val.includes('NOT') || val.includes('CANCELLED')) {
            doc.setTextColor(225, 29, 72); // rose-600
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setTextColor(180, 83, 9); // amber-700
            doc.setFont('helvetica', 'bold');
          }
        }

        doc.text(printVal, textX, yPos + 4.5, {
          align: col.align === 'center' ? 'center' : 'left'
        });

        // Reset style
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        currentX += col.width;
      });

      yPos += 6.5;
    });
  }

  // Draw footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(i, totalPages);
  }

  // Save document
  doc.save(generateReportFilename(reportType, eventTitle, 'pdf'));
};
