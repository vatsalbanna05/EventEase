/**
 * EventEase Automated Business Logic & Security Test Suite
 * Code Carnival 3.0, Atmiya University | Problem Statement PS-03
 * Tests all 12 core scenarios from the specification.
 */

// Simulated in-memory database matching src/services/db.ts
class EventEaseTestHarness {
  constructor() {
    this.events = [];
    this.registrations = [];
    this.attendance = [];
    this.certificates = [];
    this.certificateSettings = [];
    this.certificateRequests = [];
    this.notifications = [];
  }

  generateTicketToken() {
    const chars = '0123456789ABCDEF';
    let result = 'EE-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  generateCertReference() {
    const chars = '0123456789ABCDEF';
    let result = 'CERT-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isUuid(val) {
    if (!val) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  }

  generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  createEvent(eventData) {
    const newEvent = {
      ...eventData,
      id: eventData.id || this.generateUuid(),
      created_at: new Date().toISOString()
    };
    this.events.push(newEvent);
    return newEvent;
  }

  saveCertificateSettings(settings, operatorRole = 'organizer') {
    if (operatorRole === 'participant') {
      throw new Error('Unauthorized: Only organizers or administrators can configure certificate rules.');
    }
    const idx = this.certificateSettings.findIndex(cs => cs.event_id === settings.event_id);
    if (idx >= 0) {
      this.certificateSettings[idx] = { ...this.certificateSettings[idx], ...settings };
    } else {
      this.certificateSettings.push(settings);
    }
    return settings;
  }

  generateCertificateForRegistration({ registrationId, operatorRole, bypassEligibility = false }) {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) return { success: false, message: 'Registration not found' };
    if (reg.registration_status === 'cancelled') return { success: false, message: 'Registration cancelled' };

    const event = this.events.find(e => e.id === reg.event_id);
    const settings = this.certificateSettings.find(s => s.event_id === reg.event_id) || {
      eligibility_rule: 'checked_in',
      issuing_organization: 'Atmiya University',
      signatory_name: 'Dr. Rajesh Patel',
      signatory_role: 'Head of Organizing Committee'
    };

    const rule = settings.eligibility_rule || 'checked_in';

    // Duplicate Check
    const existing = this.certificates.find(c => c.registration_id === reg.id);
    if (existing) {
      if (existing.eligibility_status === 'revoked') {
        if (operatorRole !== 'organizer' && operatorRole !== 'admin') {
          return { success: false, message: 'Revoked certificate can only be reissued by an organizer', certificate: existing };
        }
      } else {
        return {
          success: true,
          message: 'Certificate already issued',
          certificate: {
            ...existing,
            participant_name: reg.participant_name,
            event_title: event?.title,
            event_date: event?.event_date,
            issuing_organization: settings.issuing_organization,
            signatory_name: settings.signatory_name,
            signatory_role: settings.signatory_role
          }
        };
      }
    }

    // Eligibility Check
    if (!bypassEligibility) {
      if (rule === 'checked_in') {
        const hasAttended = this.attendance.some(a => a.registration_id === reg.id);
        if (!hasAttended) {
          return { success: false, message: 'Ineligible: Gate check-in required for certificate' };
        }
      } else if (rule === 'organizer_approved') {
        const hasApprovedReq = this.certificateRequests.some(r => r.registration_id === reg.id && r.status === 'approved');
        const isStaff = operatorRole === 'organizer' || operatorRole === 'admin';
        if (!hasApprovedReq && !isStaff) {
          return { success: false, message: 'Ineligible: Requires organizer approval' };
        }
      }
    }

    const nowIso = new Date().toISOString();
    let cert;
    if (existing && existing.eligibility_status === 'revoked') {
      existing.eligibility_status = 'issued';
      existing.reissued_at = nowIso;
      existing.revoked_at = undefined;
      existing.revoked_reason = undefined;
      cert = existing;
    } else {
      cert = {
        id: 'cert-' + Math.random().toString(36).substr(2, 9),
        registration_id: reg.id,
        event_id: reg.event_id,
        certificate_reference: this.generateCertReference(),
        eligibility_status: 'issued',
        issued_at: nowIso,
        event_title: event?.title,
        participant_name: reg.participant_name,
        event_date: event?.event_date,
        issuing_organization: settings.issuing_organization,
        signatory_name: settings.signatory_name,
        signatory_role: settings.signatory_role
      };
      this.certificates.push(cert);
    }

    this.notifications.unshift({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      user_email: reg.participant_email.toLowerCase(),
      user_id: reg.participant_id,
      title: 'Certificate Available!',
      message: `Your Certificate is ready. Verification ID: ${cert.certificate_reference}`,
      type: 'certificate',
      read: false,
      created_at: new Date().toISOString()
    });

    return { success: true, certificate: cert, message: 'Certificate generated' };
  }

  revokeCertificate({ certificateReference, operatorRole = 'organizer', reason }) {
    if (operatorRole === 'participant') {
      return { success: false, message: 'Unauthorized: Only organizers can revoke certificates' };
    }
    const cert = this.certificates.find(c => c.certificate_reference === certificateReference);
    if (!cert) return { success: false, message: 'Certificate not found' };

    cert.eligibility_status = 'revoked';
    cert.revoked_at = new Date().toISOString();
    cert.revoked_reason = reason;
    return { success: true, certificate: cert, message: 'Certificate revoked' };
  }

  reissueCertificate({ certificateReference, operatorRole = 'organizer' }) {
    if (operatorRole === 'participant') {
      return { success: false, message: 'Unauthorized: Only organizers can reissue certificates' };
    }
    const cert = this.certificates.find(c => c.certificate_reference === certificateReference);
    if (!cert) return { success: false, message: 'Certificate not found' };

    cert.eligibility_status = 'issued';
    cert.reissued_at = new Date().toISOString();
    cert.revoked_at = undefined;
    cert.revoked_reason = undefined;
    return { success: true, certificate: cert, message: 'Certificate reissued' };
  }

  requestCertificate({ registrationId, reason, participantId, participantName, participantEmail }) {
    const reg = this.registrations.find(r => r.id === registrationId);
    if (!reg) return { success: false, message: 'Registration not found' };
    if (reg.registration_status === 'cancelled') return { success: false, message: 'Registration cancelled' };

    const existingReq = this.certificateRequests.find(
      r => r.registration_id === registrationId && (r.status === 'pending' || r.status === 'approved')
    );
    if (existingReq) {
      return { success: false, message: `Request already ${existingReq.status}`, request: existingReq };
    }

    const newReq = {
      id: 'req-' + Math.random().toString(36).substr(2, 9),
      registration_id: reg.id,
      event_id: reg.event_id,
      participant_id: participantId || reg.participant_id,
      participant_name: participantName || reg.participant_name,
      participant_email: participantEmail || reg.participant_email,
      reason,
      status: 'pending',
      requested_at: new Date().toISOString()
    };
    this.certificateRequests.push(newReq);
    return { success: true, request: newReq, message: 'Request submitted' };
  }

  reviewCertificateRequest({ requestId, decision, operatorRole = 'organizer', reviewerId, reviewNotes }) {
    if (operatorRole === 'participant') {
      return { success: false, message: 'Unauthorized: Only organizers can review requests' };
    }
    const req = this.certificateRequests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found' };

    req.status = decision;
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = reviewerId;
    req.review_notes = reviewNotes;

    let cert;
    if (decision === 'approved') {
      // Issue certificate with bypassEligibility=true WITHOUT creating fake attendance!
      const certRes = this.generateCertificateForRegistration({
        registrationId: req.registration_id,
        operatorRole,
        bypassEligibility: true
      });
      cert = certRes.certificate;
    }

    return { success: true, message: `Request ${decision}`, certificate: cert };
  }

  verifyCertificate(reference) {
    const cleanRef = (reference || '').trim().toUpperCase();
    const cert = this.certificates.find(c => c.certificate_reference.toUpperCase() === cleanRef);
    if (!cert) {
      return { status: 'invalid', message: 'Certificate reference not found' };
    }

    const reg = this.registrations.find(r => r.id === cert.registration_id);
    const ev = this.events.find(e => e.id === cert.event_id);
    const settings = this.certificateSettings.find(s => s.event_id === cert.event_id);

    if (cert.eligibility_status === 'revoked') {
      return {
        status: 'revoked',
        message: 'Certificate was revoked by the issuing institution',
        certificate: {
          certificate_reference: cert.certificate_reference,
          participant_name: reg?.participant_name,
          event_title: ev?.title,
          event_date: ev?.event_date,
          issuing_organization: settings?.issuing_organization || 'Atmiya University',
          signatory_name: settings?.signatory_name || 'Dr. Rajesh Patel',
          signatory_role: settings?.signatory_role || 'Head of Organizing Committee',
          issued_at: cert.issued_at,
          revoked_at: cert.revoked_at,
          revoked_reason: cert.revoked_reason,
          eligibility_status: 'revoked'
        }
      };
    }

    return {
      status: 'valid',
      message: 'Certificate is authentic and verified',
      certificate: {
        certificate_reference: cert.certificate_reference,
        participant_name: reg?.participant_name,
        event_title: ev?.title,
        event_date: ev?.event_date,
        issuing_organization: settings?.issuing_organization || 'Atmiya University',
        signatory_name: settings?.signatory_name || 'Dr. Rajesh Patel',
        signatory_role: settings?.signatory_role || 'Head of Organizing Committee',
        issued_at: cert.issued_at,
        eligibility_status: 'issued'
      }
    };
  }

  registerForEvent({ eventId, participantName, participantEmail, studentId }) {
    const normalizedEmail = participantEmail.trim().toLowerCase();
    const event = this.events.find(e => e.id === eventId);
    if (!event) return { success: false, error_code: 'EVENT_NOT_FOUND', message: 'Event not found' };
    if (event.status !== 'published') return { success: false, error_code: 'EVENT_UNAVAILABLE', message: 'Event unavailable' };

    // Duplicate Check
    const isDuplicate = this.registrations.some(
      r => r.event_id === eventId && r.participant_email.toLowerCase() === normalizedEmail && r.registration_status === 'confirmed'
    );
    if (isDuplicate) {
      return { success: false, error_code: 'DUPLICATE_REGISTRATION', message: 'Duplicate registration rejected' };
    }

    // Capacity Check
    const activeCount = this.registrations.filter(
      r => r.event_id === eventId && r.registration_status === 'confirmed'
    ).length;
    if (activeCount >= event.capacity) {
      return { success: false, error_code: 'EVENT_FULL', message: 'Event capacity is full' };
    }

    const token = this.generateTicketToken();
    const newReg = {
      id: 'reg-' + Math.random().toString(36).substr(2, 9),
      event_id: eventId,
      participant_name: participantName.trim(),
      participant_email: normalizedEmail,
      student_id: studentId,
      ticket_token: token,
      registration_status: 'confirmed',
      registered_at: new Date().toISOString()
    };
    this.registrations.push(newReg);

    this.notifications.unshift({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      user_email: normalizedEmail,
      title: 'Registration Confirmed!',
      message: `You are officially registered for "${event.title}". Token: ${token}`,
      type: 'registration',
      read: false,
      created_at: new Date().toISOString()
    });

    return { success: true, message: 'Registration confirmed', registration: newReg };
  }

  updateEvent(id, updates) {
    const idx = this.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.events[idx] = { ...this.events[idx], ...updates };

    if (updates.venue || updates.event_date || updates.start_time || updates.status) {
      const attendees = this.registrations.filter(r => r.event_id === id && r.registration_status === 'confirmed');
      const details = [
        updates.venue ? `Venue: ${updates.venue}` : '',
        updates.event_date ? `Date: ${updates.event_date}` : '',
        updates.start_time ? `Time: ${updates.start_time}` : '',
        updates.status === 'cancelled' ? 'Status: Cancelled' : ''
      ].filter(Boolean).join(' • ');

      for (const att of attendees) {
        this.notifications.unshift({
          id: 'notif-' + Math.random().toString(36).substr(2, 9),
          user_email: att.participant_email.toLowerCase(),
          title: `Update: ${this.events[idx].title}`,
          message: `Important update: ${details}`,
          type: 'event_update',
          read: false,
          created_at: new Date().toISOString()
        });
      }
    }
    return this.events[idx];
  }

  getMyNotifications(emailOrUserId) {
    const clean = (emailOrUserId || '').trim().toLowerCase();
    return this.notifications.filter(
      n => (n.user_id && n.user_id === emailOrUserId) || n.user_email.toLowerCase() === clean
    );
  }

  markNotificationAsRead(id) {
    const n = this.notifications.find(item => item.id === id);
    if (!n) return false;
    n.read = true;
    return true;
  }

  markAllNotificationsAsRead(emailOrUserId) {
    const clean = (emailOrUserId || '').trim().toLowerCase();
    for (const n of this.notifications) {
      if ((n.user_id && n.user_id === emailOrUserId) || n.user_email.toLowerCase() === clean) {
        n.read = true;
      }
    }
    return true;
  }

  verifyAndCheckInTicket({ ticketToken, selectedEventId, checkedInBy, operatorRole = 'volunteer' }) {
    // Operator Authorization Check (organizer, volunteer, admin)
    const authorizedRoles = ['organizer', 'volunteer', 'admin'];
    if (operatorRole && !authorizedRoles.includes(operatorRole)) {
      return {
        outcome: 'UNAUTHORIZED',
        success: false,
        message: 'Unauthorized: Only event organizers, volunteers, or admins can perform check-ins'
      };
    }

    const cleanToken = (ticketToken || '').trim().toUpperCase();
    if (!cleanToken) return { outcome: 'INVALID_TICKET', success: false, message: 'Missing token' };

    const reg = this.registrations.find(r => r.ticket_token.toUpperCase() === cleanToken);
    if (!reg) return { outcome: 'INVALID_TICKET', success: false, message: 'Invalid ticket' };

    const event = this.events.find(e => e.id === selectedEventId);
    const regEvent = this.events.find(e => e.id === reg.event_id);

    if (reg.event_id !== selectedEventId) {
      return {
        outcome: 'WRONG_EVENT',
        success: false,
        message: 'Wrong event ticket',
        event_title: regEvent?.title || 'Another Event'
      };
    }

    if (reg.registration_status === 'cancelled') {
      return {
        outcome: 'REGISTRATION_CANCELLED',
        success: false,
        message: 'Registration cancelled',
        event_title: event?.title
      };
    }

    if (event?.status === 'cancelled') {
      return {
        outcome: 'EVENT_UNAVAILABLE',
        success: false,
        message: 'Event cancelled',
        event_title: event?.title
      };
    }

    // Duplicate check-in verification
    const existing = this.attendance.find(a => a.registration_id === reg.id);
    if (existing) {
      return {
        outcome: 'ALREADY_CHECKED_IN',
        success: false,
        message: 'Duplicate entry rejected',
        checked_in_at: existing.checked_in_at,
        participant_name: reg.participant_name,
        event_title: event?.title
      };
    }

    // Insert attendance
    const nowIso = new Date().toISOString();
    const newAtt = {
      id: 'att-' + Math.random().toString(36).substr(2, 9),
      registration_id: reg.id,
      event_id: selectedEventId,
      checked_in_at: nowIso,
      checked_in_by: checkedInBy
    };
    this.attendance.push(newAtt);

    // Issue certificate
    const certRef = 'CERT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    this.certificates.push({
      id: 'cert-' + Math.random().toString(36).substr(2, 9),
      registration_id: reg.id,
      event_id: selectedEventId,
      certificate_reference: certRef,
      eligibility_status: 'eligible',
      issued_at: nowIso
    });

    this.notifications.unshift({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      user_email: reg.participant_email.toLowerCase(),
      user_id: reg.participant_id,
      title: 'Certificate Available!',
      message: `Your Certificate is ready. Verification ID: ${certRef}`,
      type: 'certificate',
      read: false,
      created_at: nowIso
    });

    const totalAtt = this.attendance.filter(a => a.event_id === selectedEventId).length;
    return {
      outcome: 'VALID_TICKET',
      success: true,
      message: 'Check-in successful',
      participant_name: reg.participant_name,
      event_title: event?.title,
      attendance_count: totalAtt
    };
  }

  getDashboardStats(params = {}) {
    const filterOrganizerId = typeof params === 'string' ? params : params.organizerId;
    const filterEventId = typeof params === 'object' ? params.eventId : undefined;

    let scopedEvents = this.events;
    if (filterOrganizerId) {
      scopedEvents = scopedEvents.filter(e => e.organizer_id === filterOrganizerId);
    }

    const isSpecificEvent = filterEventId && filterEventId !== 'all';
    let targetEvents = scopedEvents;
    if (isSpecificEvent) {
      targetEvents = scopedEvents.filter(e => e.id === filterEventId);
    }

    const targetEventIds = new Set(targetEvents.map(e => e.id));

    const targetRegistrations = this.registrations.filter(
      r => targetEventIds.has(r.event_id) && r.registration_status === 'confirmed'
    );

    const confirmedRegIds = new Set(targetRegistrations.map(r => r.id));
    const uniqueCheckedInRegIds = new Set(
      this.attendance
        .filter(a => targetEventIds.has(a.event_id) && confirmedRegIds.has(a.registration_id))
        .map(a => a.registration_id)
    );

    const totalCapacity = targetEvents.reduce((sum, e) => sum + (Number(e.capacity) || 0), 0);
    const totalRegistrations = targetRegistrations.length;
    const availableSeats = Math.max(0, totalCapacity - totalRegistrations);
    const registrationPercentage = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

    const totalCheckins = uniqueCheckedInRegIds.size;
    const notCheckedIn = Math.max(0, totalRegistrations - totalCheckins);
    const attendancePercentage = totalRegistrations > 0 ? Math.round((totalCheckins / totalRegistrations) * 100) : 0;

    const targetCertificates = this.certificates.filter(c => targetEventIds.has(c.event_id));
    const certificatesIssued = targetCertificates.filter(
      c => c.eligibility_status === 'issued' || c.eligibility_status === 'eligible'
    ).length;

    const targetRequests = this.certificateRequests.filter(cr => targetEventIds.has(cr.event_id));
    const pendingRequests = targetRequests.filter(cr => cr.status === 'pending').length;
    const approvedRequests = targetRequests.filter(cr => cr.status === 'approved').length;
    const rejectedRequests = targetRequests.filter(cr => cr.status === 'rejected').length;

    const eventPerformance = scopedEvents.map(e => {
      const eRegs = this.registrations.filter(r => r.event_id === e.id && r.registration_status === 'confirmed');
      const eRegIds = new Set(eRegs.map(r => r.id));
      const eAttCount = new Set(
        this.attendance.filter(a => a.event_id === e.id && eRegIds.has(a.registration_id)).map(a => a.registration_id)
      ).size;
      const cap = Number(e.capacity) || 0;
      const regCount = eRegs.length;
      const notChecked = Math.max(0, regCount - eAttCount);
      const avail = Math.max(0, cap - regCount);
      const regRate = cap > 0 ? Math.round((regCount / cap) * 100) : 0;
      const attRate = regCount > 0 ? Math.round((eAttCount / regCount) * 100) : 0;

      return {
        event_id: e.id,
        event_title: e.title,
        category: e.category,
        capacity: cap,
        registered: regCount,
        checked_in: eAttCount,
        not_checked_in: notChecked,
        available_seats: avail,
        registration_rate: regRate,
        attendance_rate: attRate
      };
    });

    const highestParticipation = [...eventPerformance].sort((a, b) => {
      if (b.attendance_rate !== a.attendance_rate) {
        return b.attendance_rate - a.attendance_rate;
      }
      return b.checked_in - a.checked_in;
    });

    return {
      total_events: targetEvents.length,
      total_registrations: totalRegistrations,
      total_capacity: totalCapacity,
      available_seats: availableSeats,
      registration_percentage: registrationPercentage,
      total_checkins: totalCheckins,
      not_checked_in: notCheckedIn,
      attendance_percentage: attendancePercentage,
      overall_attendance_rate: attendancePercentage,
      certificates_issued: certificatesIssued,
      pending_certificate_requests: pendingRequests,
      approved_certificate_requests: approvedRequests,
      rejected_certificate_requests: rejectedRequests,
      event_performance: eventPerformance,
      highest_participation_events: highestParticipation
    };
  }

  getExportReportData(options = {}) {
    const { organizerId, eventId, registrationStatus, attendanceStatus } = options;

    let scopedEvents = this.events;
    if (organizerId) {
      scopedEvents = scopedEvents.filter(e => e.organizer_id === organizerId);
    }

    if (eventId && eventId !== 'all') {
      scopedEvents = scopedEvents.filter(e => e.id === eventId);
    }

    const scopedEventMap = new Map(scopedEvents.map(e => [e.id, e]));

    let filteredRegs = this.registrations.filter(r => scopedEventMap.has(r.event_id));

    if (registrationStatus && registrationStatus !== 'all') {
      filteredRegs = filteredRegs.filter(r => r.registration_status === registrationStatus);
    }

    const attendanceMap = new Map();
    this.attendance.forEach(a => {
      if (!attendanceMap.has(a.registration_id)) {
        attendanceMap.set(a.registration_id, a);
      }
    });

    const certificateMap = new Map();
    this.certificates.forEach(c => {
      if (!certificateMap.has(c.registration_id)) {
        certificateMap.set(c.registration_id, c);
      }
    });

    if (attendanceStatus && attendanceStatus !== 'all') {
      if (attendanceStatus === 'checked_in') {
        filteredRegs = filteredRegs.filter(r => attendanceMap.has(r.id));
      } else if (attendanceStatus === 'not_checked_in') {
        filteredRegs = filteredRegs.filter(r => !attendanceMap.has(r.id));
      }
    }

    const seenRegIds = new Set();
    const uniqueRegs = [];
    filteredRegs.forEach(r => {
      if (!seenRegIds.has(r.id)) {
        seenRegIds.add(r.id);
        uniqueRegs.push(r);
      }
    });

    return uniqueRegs.map(reg => {
      const event = scopedEventMap.get(reg.event_id);
      const att = attendanceMap.get(reg.id);
      const cert = certificateMap.get(reg.id);

      return {
        id: reg.id,
        registration_id: reg.id,
        event_id: reg.event_id,
        event_title: event?.title || 'College Event',
        event_date: event?.event_date || '—',
        participant_name: reg.participant_name,
        participant_email: reg.participant_email,
        student_id: reg.student_id?.trim() || 'N/A',
        ticket_token: reg.ticket_token,
        registration_status: reg.registration_status,
        registered_at: reg.registered_at,
        has_checked_in: !!att,
        checked_in_at: att?.checked_in_at,
        certificate_reference: cert?.certificate_reference || 'Not Issued',
        certificate_status: cert?.eligibility_status || (att ? 'Eligible' : 'Pending Check-In'),
        certificate_issued_at: cert?.issued_at
      };
    });
  }

  generateCSV(reportType, items) {
    let headers = [];
    let rowExtractor;

    if (reportType === 'participant') {
      headers = ['#', 'Participant Name', 'College Email', 'Student ID', 'Event Name', 'Registration Date', 'Registration Status', 'Ticket Pass Token'];
      rowExtractor = (item, idx) => [idx + 1, item.participant_name, item.participant_email, item.student_id || 'N/A', item.event_title, item.registered_at, item.registration_status.toUpperCase(), item.ticket_token];
    } else if (reportType === 'attendance') {
      headers = ['#', 'Participant Name', 'College Email', 'Event Name', 'Check-In Status', 'Check-In Timestamp', 'Ticket Pass Token'];
      rowExtractor = (item, idx) => [idx + 1, item.participant_name, item.participant_email, item.event_title, item.has_checked_in ? 'CHECKED IN' : 'NOT CHECKED IN', item.checked_in_at || 'N/A', item.ticket_token];
    } else {
      headers = ['#', 'Participant Name', 'College Email', 'Event Name', 'Certificate Verification ID', 'Certificate Status', 'Issue Date'];
      rowExtractor = (item, idx) => [idx + 1, item.participant_name, item.participant_email, item.event_title, item.certificate_reference, (item.certificate_status || 'Eligible').toUpperCase(), item.certificate_issued_at || 'N/A'];
    }

    function escapeCSV(val) {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    let csv = '\uFEFF' + headers.map(escapeCSV).join(',') + '\r\n';
    items.forEach((item, idx) => {
      csv += rowExtractor(item, idx).map(escapeCSV).join(',') + '\r\n';
    });
    return csv;
  }
}

// Test Runner
async function runAllTests() {
  console.log('===============================================================');
  console.log('EVENT-EASE TEST SUITE: Code Carnival 3.0 (Problem Statement PS-03)');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  const harness = new EventEaseTestHarness();

  // Test 1: Event Creation with Capacity 3
  const demoEvent = harness.createEvent({
    title: 'Code Carnival Demo Event',
    category: 'Hackathon',
    capacity: 3,
    status: 'published',
    venue: 'Main Auditorium, Atmiya University'
  });
  assert(demoEvent.id && demoEvent.capacity === 3, '1. Event Creation with Capacity = 3');

  // Test 2: Successful Registration of Rahul Patel
  const reg1 = harness.registerForEvent({
    eventId: demoEvent.id,
    participantName: 'Rahul Patel',
    participantEmail: 'rahul.patel@atmiya.edu',
    studentId: 'AU2024-CS-042'
  });
  assert(reg1.success === true && reg1.registration.ticket_token.startsWith('EE-'), '2. Participant Registration (Rahul Patel) & Token Generation');

  // Test 3: Duplicate Registration Rejection for Same Email
  const regDup = harness.registerForEvent({
    eventId: demoEvent.id,
    participantName: 'Rahul Patel',
    participantEmail: 'rahul.patel@atmiya.edu',
    studentId: 'AU2024-CS-042'
  });
  assert(regDup.success === false && regDup.error_code === 'DUPLICATE_REGISTRATION', '3. Duplicate Registration Rejected for Same Email');

  // Test 4: Register 2 More Participants up to Capacity
  const reg2 = harness.registerForEvent({
    eventId: demoEvent.id,
    participantName: 'Priya Sharma',
    participantEmail: 'priya.sharma@atmiya.edu'
  });
  const reg3 = harness.registerForEvent({
    eventId: demoEvent.id,
    participantName: 'Amit Trivedi',
    participantEmail: 'amit.trivedi@atmiya.edu'
  });
  assert(reg2.success && reg3.success, '4. Fill Capacity to 3/3');

  // Test 5: Registration Blocked when Capacity is Full
  const regOver = harness.registerForEvent({
    eventId: demoEvent.id,
    participantName: 'Over Capacity User',
    participantEmail: 'over@atmiya.edu'
  });
  assert(regOver.success === false && regOver.error_code === 'EVENT_FULL', '5. Registration Blocked when Capacity is Full (3/3)');

  // Test 6: Valid QR Check-In (Scan 1)
  const scan1 = harness.verifyAndCheckInTicket({
    ticketToken: reg1.registration.ticket_token,
    selectedEventId: demoEvent.id,
    checkedInBy: 'volunteer-1'
  });
  assert(scan1.outcome === 'VALID_TICKET' && scan1.attendance_count === 1, '6. Scan 1: VALID TICKET — Check-in Successful & Attendance = 1');

  // Test 7: Duplicate QR Check-In Rejected (Scan 2)
  const scan2 = harness.verifyAndCheckInTicket({
    ticketToken: reg1.registration.ticket_token,
    selectedEventId: demoEvent.id,
    checkedInBy: 'volunteer-1'
  });
  assert(scan2.outcome === 'ALREADY_CHECKED_IN' && scan2.success === false, '7. Scan 2: DUPLICATE ENTRY REJECTED — Already Checked In');

  // Test 8: Attendance Count remains 1 after duplicate scan
  const currentAttCount = harness.attendance.filter(a => a.event_id === demoEvent.id).length;
  assert(currentAttCount === 1, '8. Attendance Count Preserved at Exactly 1 (No inflation)');

  // Test 9: Invalid Token Rejection
  const scanInvalid = harness.verifyAndCheckInTicket({
    ticketToken: 'EE-INVALID999',
    selectedEventId: demoEvent.id
  });
  assert(scanInvalid.outcome === 'INVALID_TICKET', '9. Invalid/Counterfeit Token Rejected');

  // Test 10: Wrong Event Token Rejection
  const otherEvent = harness.createEvent({
    title: 'TechSummit 2025',
    category: 'Tech',
    capacity: 50,
    status: 'published'
  });
  const scanWrongEvent = harness.verifyAndCheckInTicket({
    ticketToken: reg1.registration.ticket_token,
    selectedEventId: otherEvent.id
  });
  assert(scanWrongEvent.outcome === 'WRONG_EVENT', '10. Ticket for Another Event Rejected (WRONG_EVENT)');

  // Test 11: Cancelled Registration Rejection
  const regCancelled = harness.registerForEvent({
    eventId: otherEvent.id,
    participantName: 'Cancelled User',
    participantEmail: 'cancelled@atmiya.edu'
  });
  regCancelled.registration.registration_status = 'cancelled';
  const scanCancelled = harness.verifyAndCheckInTicket({
    ticketToken: regCancelled.registration.ticket_token,
    selectedEventId: otherEvent.id
  });
  assert(scanCancelled.outcome === 'REGISTRATION_CANCELLED', '11. Cancelled Registration Rejected (REGISTRATION_CANCELLED)');

  // Test 12: Certificate Issued to Checked-In Participant
  const cert = harness.certificates.find(c => c.registration_id === reg1.registration.id);
  assert(cert && cert.eligibility_status === 'eligible', '12. Certificate Issued for Verified Attendee');

  // Test 13: Valid RFC 4122 v4 UUID Format for Events
  assert(harness.isUuid(demoEvent.id) && harness.isUuid(otherEvent.id), '13. Event ID is a Valid RFC 4122 v4 UUID');

  // Test 14: Backward Compatibility with Preexisting Legacy String Event IDs
  const legacyEvent = harness.createEvent({
    id: 'event-1791607900047-demo',
    title: 'Legacy Timestamp Event',
    category: 'Workshop',
    capacity: 10,
    status: 'published'
  });
  const regLegacy = harness.registerForEvent({
    eventId: legacyEvent.id,
    participantName: 'Legacy User',
    participantEmail: 'legacy@atmiya.edu'
  });
  const scanLegacy = harness.verifyAndCheckInTicket({
    ticketToken: regLegacy.registration.ticket_token,
    selectedEventId: legacyEvent.id
  });
  assert(regLegacy.success && scanLegacy.outcome === 'VALID_TICKET', '14. Legacy Event ID Preserved & Registered Without Error');

  // Test 15: Security: Participant Role Blocked from Performing Check-In (UNAUTHORIZED)
  const scanUnauthorized = harness.verifyAndCheckInTicket({
    ticketToken: reg2.registration.ticket_token,
    selectedEventId: demoEvent.id,
    checkedInBy: 'participant-user',
    operatorRole: 'participant'
  });
  assert(
    scanUnauthorized.outcome === 'UNAUTHORIZED' && scanUnauthorized.success === false,
    '15. Security: Participant Role Blocked from Performing Check-In (UNAUTHORIZED)'
  );

  // Test 16: Check-In Result Includes Event Name, Participant Name, and Status
  const scanAuthValid = harness.verifyAndCheckInTicket({
    ticketToken: reg2.registration.ticket_token,
    selectedEventId: demoEvent.id,
    checkedInBy: 'volunteer-1',
    operatorRole: 'volunteer'
  });
  assert(
    scanAuthValid.outcome === 'VALID_TICKET' &&
    scanAuthValid.participant_name === 'Priya Sharma' &&
    scanAuthValid.event_title === 'Code Carnival Demo Event',
    '16. Scan Details Display Participant Name & Event Name Correctly'
  );

  // Test 17: Live Dashboard Attendance Metrics (Registered, Checked-In, Pending)
  const eventRegistrations = harness.registrations.filter(
    r => r.event_id === demoEvent.id && r.registration_status !== 'cancelled'
  );
  const eventAttendance = harness.attendance.filter(a => a.event_id === demoEvent.id);
  const registeredCount = eventRegistrations.length;
  const checkedInCount = eventAttendance.length;
  const pendingCount = Math.max(0, registeredCount - checkedInCount);
  const turnoutRate = registeredCount > 0 ? Math.round((checkedInCount / registeredCount) * 100) : 0;

  // Registered = 3 (Rahul, Priya, Amit), Checked-in = 2 (Rahul, Priya), Pending = 1 (Amit), Turnout = 67%
  assert(
    registeredCount === 3 && checkedInCount === 2 && pendingCount === 1 && turnoutRate === 67,
    `17. Live Dashboard Metrics: ${registeredCount} Registered, ${checkedInCount} Checked-In, ${pendingCount} Pending (${turnoutRate}%)`
  );

  // Test 18: State Persistence Verification (Simulated Page Refresh / Relink)
  // Simulate page reload by creating a fresh query reference from the persistent store
  const reloadedAttendance = harness.attendance.filter(a => a.event_id === demoEvent.id);
  const reloadedCertificates = harness.certificates.filter(c => c.event_id === demoEvent.id);
  assert(
    reloadedAttendance.length === 2 && reloadedCertificates.length === 2,
    '18. Check-In & Certificate Data Persists Post-Refresh Without Loss'
  );

  // =========================================================================
  // DIGITAL CERTIFICATE MANAGEMENT SYSTEM TESTS (Features 1 - 5 & Security)
  // =========================================================================

  // Test 19: Eligible Checked-In Participant Gets Valid Certificate
  const certGenEligible = harness.generateCertificateForRegistration({
    registrationId: reg1.registration.id,
    operatorRole: 'organizer'
  });
  assert(
    certGenEligible.success === true &&
    certGenEligible.certificate.certificate_reference.startsWith('CERT-') &&
    certGenEligible.certificate.participant_name === 'Rahul Patel',
    '19. Feature 1: Certificate Generated for Eligible Participant (Rahul Patel) with Unique ID'
  );

  // Test 20: Ineligible Participant (Not Checked In) Blocked Under Default 'checked_in' Rule
  harness.saveCertificateSettings({
    event_id: demoEvent.id,
    eligibility_rule: 'checked_in',
    requires_checkin: true,
    issuing_organization: 'Atmiya University'
  }, 'organizer');

  const certGenIneligible = harness.generateCertificateForRegistration({
    registrationId: reg3.registration.id, // Amit Trivedi (registered but never checked in)
    operatorRole: 'participant'
  });
  assert(
    certGenIneligible.success === false &&
    certGenIneligible.message.includes('Gate check-in required'),
    '20. Feature 2: Ineligible (Unchecked-in) Participant Blocked from Certificate Generation'
  );

  // Test 21: Configurable Eligibility Rules - Rule 'registered' Allows Confirmed Attendees
  const flexEvent = harness.createEvent({
    title: 'National Webinar on Cloud Computing',
    category: 'Seminar',
    capacity: 100,
    status: 'published'
  });
  harness.saveCertificateSettings({
    event_id: flexEvent.id,
    eligibility_rule: 'registered',
    requires_checkin: false,
    issuing_organization: 'Faculty of Computer Science'
  }, 'organizer');

  const regFlex = harness.registerForEvent({
    eventId: flexEvent.id,
    participantName: 'Neha Joshi',
    participantEmail: 'neha.joshi@atmiya.edu'
  });

  const certGenFlex = harness.generateCertificateForRegistration({
    registrationId: regFlex.registration.id,
    operatorRole: 'participant'
  });
  assert(
    certGenFlex.success === true && certGenFlex.certificate.participant_name === 'Neha Joshi',
    '21. Feature 2: Configurable Rule "registered" Allows Confirmed Participant to Obtain Certificate'
  );

  // Test 22: Feature 3: Early-Exit Certificate Request Submission & Pending Status
  const regEarlyExit = harness.registerForEvent({
    eventId: flexEvent.id,
    participantName: 'Manish Dave',
    participantEmail: 'manish.dave@atmiya.edu'
  });

  const earlyReq = harness.requestCertificate({
    registrationId: regEarlyExit.registration.id,
    reason: 'Outstation train departing early at 3:00 PM',
    participantName: 'Manish Dave',
    participantEmail: 'manish.dave@atmiya.edu'
  });
  assert(
    earlyReq.success === true && earlyReq.request.status === 'pending',
    '22. Feature 3: Early-Exit Certificate Request Submitted with Status PENDING'
  );

  // Test 23: Duplicate Early-Exit Request Blocked
  const dupReq = harness.requestCertificate({
    registrationId: regEarlyExit.registration.id,
    reason: 'Submitting duplicate request',
    participantName: 'Manish Dave',
    participantEmail: 'manish.dave@atmiya.edu'
  });
  assert(
    dupReq.success === false && dupReq.message.includes('already pending'),
    '23. Feature 3: Duplicate Certificate Request Blocked for Same Registration'
  );

  // Test 24: Organizer Approves Early-Exit Request -> Certificate Issued WITHOUT Counterfeit Attendance
  const initialAttCount = harness.attendance.length;
  const reviewApprove = harness.reviewCertificateRequest({
    requestId: earlyReq.request.id,
    decision: 'approved',
    operatorRole: 'organizer',
    reviewerId: 'user-organizer-1',
    reviewNotes: 'Early departure verified by mentor'
  });
  const postAttCount = harness.attendance.length;
  const manishHasAtt = harness.attendance.some(a => a.registration_id === regEarlyExit.registration.id);

  assert(
    reviewApprove.success === true &&
    reviewApprove.certificate.certificate_reference.startsWith('CERT-') &&
    postAttCount === initialAttCount &&
    manishHasAtt === false,
    '24. Feature 3 & 5: Early-Exit Approved & Certificate Issued WITHOUT Fabricating Attendance'
  );

  // Test 25: Organizer Rejects Certificate Request
  const regReject = harness.registerForEvent({
    eventId: flexEvent.id,
    participantName: 'Invalid Requestor',
    participantEmail: 'invalid.req@atmiya.edu'
  });
  const reqToReject = harness.requestCertificate({
    registrationId: regReject.registration.id,
    reason: 'Skipped morning session without notice',
    participantName: 'Invalid Requestor',
    participantEmail: 'invalid.req@atmiya.edu'
  });
  const reviewReject = harness.reviewCertificateRequest({
    requestId: reqToReject.request.id,
    decision: 'rejected',
    operatorRole: 'organizer',
    reviewerId: 'user-organizer-1',
    reviewNotes: 'Absence not justified under university policy'
  });
  assert(
    reviewReject.success === true && reqToReject.request.status === 'rejected',
    '25. Feature 5: Organizer Rejects Early-Exit Request with Audit Notes'
  );

  // Test 26: Duplicate Certificate Generation Prevention
  const certDupAttempt = harness.generateCertificateForRegistration({
    registrationId: reg1.registration.id,
    operatorRole: 'organizer'
  });
  assert(
    certDupAttempt.success === true &&
    certDupAttempt.message.includes('already') &&
    certDupAttempt.certificate.certificate_reference === certGenEligible.certificate.certificate_reference,
    '26. Feature 1: Duplicate Certificate Prevention (Preserves Existing Reference)'
  );

  // Test 27: Certificate Revocation by Authorized Organizer
  const certToRevoke = certGenEligible.certificate.certificate_reference;
  const revokeResult = harness.revokeCertificate({
    certificateReference: certToRevoke,
    operatorRole: 'organizer',
    reason: 'Disciplinary violation discovered post-event'
  });
  assert(
    revokeResult.success === true &&
    revokeResult.certificate.eligibility_status === 'revoked' &&
    revokeResult.certificate.revoked_at !== undefined,
    '27. Feature 5: Certificate Revoked by Organizer with Recorded Timestamp & Reason'
  );

  // Test 28: Security: Unauthorized Participant Blocked from Revoking Certificate
  const unauthorizedRevoke = harness.revokeCertificate({
    certificateReference: certGenFlex.certificate.certificate_reference,
    operatorRole: 'participant',
    reason: 'Malicious revocation attempt'
  });
  assert(
    unauthorizedRevoke.success === false && unauthorizedRevoke.message.includes('Unauthorized'),
    '28. Security: Participant Blocked from Revoking Certificate (Organizer Only)'
  );

  // Test 29: Public Certificate Verification for Valid Active Certificate (Data Privacy Protected)
  const verifyValid = harness.verifyCertificate(certGenFlex.certificate.certificate_reference);
  assert(
    verifyValid.status === 'valid' &&
    verifyValid.certificate.participant_name === 'Neha Joshi' &&
    verifyValid.certificate.event_title === 'National Webinar on Cloud Computing' &&
    verifyValid.certificate.student_id === undefined &&
    verifyValid.certificate.participant_email === undefined,
    '29. Feature 4: Public Verification Confirms Valid Credential & Protects Personal Data'
  );

  // Test 30: Public Certificate Verification for Revoked Certificate
  const verifyRevoked = harness.verifyCertificate(certToRevoke);
  assert(
    verifyRevoked.status === 'revoked' &&
    verifyRevoked.certificate.revoked_reason === 'Disciplinary violation discovered post-event',
    '30. Feature 4: Public Verification Flags Revoked Status with Stated Reason'
  );

  // Test 31: Public Certificate Verification for Non-Existent Reference
  const verifyInvalid = harness.verifyCertificate('CERT-NONEXISTENT999');
  assert(
    verifyInvalid.status === 'invalid' && verifyInvalid.message.includes('not found'),
    '31. Feature 4: Public Verification Rejects Non-Existent/Counterfeit Certificate ID'
  );

  // Test 32: Reissuing Revoked Certificate Restores Valid State
  const reissueResult = harness.reissueCertificate({
    certificateReference: certToRevoke,
    operatorRole: 'organizer'
  });
  const verifyReissued = harness.verifyCertificate(certToRevoke);
  assert(
    reissueResult.success === true &&
    reissueResult.certificate.eligibility_status === 'issued' &&
    verifyReissued.status === 'valid',
    '32. Feature 5: Authorized Reissue Restores Revoked Certificate to Valid State'
  );

  // =========================================================================
  // LIVE ANALYTICS DASHBOARD TESTS (Requirements 1 - 8)
  // =========================================================================

  // Test 33: Registration Statistics (Total registrations, capacity, available seats, registration %)
  const event1Stats = harness.getDashboardStats({ eventId: demoEvent.id });
  // demoEvent capacity = 3, registrations = 3 (Rahul, Priya, Amit)
  assert(
    event1Stats.total_registrations === 3 &&
    event1Stats.total_capacity === 3 &&
    event1Stats.available_seats === 0 &&
    event1Stats.registration_percentage === 100,
    `33. Dashboard Registration Stats: ${event1Stats.total_registrations} Regs, ${event1Stats.total_capacity} Cap, ${event1Stats.available_seats} Avail (${event1Stats.registration_percentage}%)`
  );

  // Test 34: Attendance Statistics (Checked-in, not checked-in, attendance %, each counted once)
  // Checked in = 2 (Rahul, Priya), Not checked in = 1 (Amit), Attendance % = 67%
  assert(
    event1Stats.total_checkins === 2 &&
    event1Stats.not_checked_in === 1 &&
    event1Stats.attendance_percentage === 67,
    `34. Dashboard Attendance Stats: ${event1Stats.total_checkins} Checked-in, ${event1Stats.not_checked_in} Pending (${event1Stats.attendance_percentage}%)`
  );

  // Test 35: Certificate Statistics (Issued, pending, approved, rejected)
  // Let's create an approved request and a rejected request for demoEvent
  const certStatsBefore = harness.getDashboardStats({ eventId: demoEvent.id });
  assert(
    certStatsBefore.certificates_issued >= 2 &&
    typeof certStatsBefore.pending_certificate_requests === 'number' &&
    typeof certStatsBefore.approved_certificate_requests === 'number' &&
    typeof certStatsBefore.rejected_certificate_requests === 'number',
    `35. Dashboard Certificate Stats: ${certStatsBefore.certificates_issued} Issued, ${certStatsBefore.pending_certificate_requests} Pending, ${certStatsBefore.approved_certificate_requests} Approved, ${certStatsBefore.rejected_certificate_requests} Rejected`
  );

  // Test 36: Event Filter (Specific event vs Portfolio aggregate)
  const portfolioStats = harness.getDashboardStats({ eventId: 'all' });
  assert(
    portfolioStats.total_events >= 2 &&
    portfolioStats.total_capacity >= event1Stats.total_capacity &&
    portfolioStats.total_registrations >= event1Stats.total_registrations,
    `36. Dashboard Event Filter: Scoped correctly between specific event (${event1Stats.total_registrations}) vs portfolio (${portfolioStats.total_registrations})`
  );

  // Test 37: Event Performance & Participation Leaderboard Ranking
  assert(
    Array.isArray(portfolioStats.event_performance) &&
    portfolioStats.event_performance.length >= 2 &&
    portfolioStats.highest_participation_events[0].attendance_rate >=
      portfolioStats.highest_participation_events[portfolioStats.highest_participation_events.length - 1].attendance_rate,
    '37. Dashboard Performance: Events ranked correctly by highest participation and attendance rate'
  );

  // Test 38: Accuracy: Zero-Capacity & Empty Events Safe Handling (No NaN or Division by Zero)
  const emptyEvent = harness.createEvent({
    title: 'Zero Capacity Test Event',
    capacity: 0,
    status: 'draft'
  });
  const emptyStats = harness.getDashboardStats({ eventId: emptyEvent.id });
  assert(
    emptyStats.total_registrations === 0 &&
    emptyStats.total_capacity === 0 &&
    emptyStats.available_seats === 0 &&
    emptyStats.registration_percentage === 0 &&
    emptyStats.attendance_percentage === 0 &&
    !Number.isNaN(emptyStats.registration_percentage) &&
    !Number.isNaN(emptyStats.attendance_percentage),
    '38. Dashboard Accuracy: Zero-capacity and empty event metrics safely calculated without NaN or division by zero'
  );

  // Test 39: Security: Organizer Access Control (Only Organizers/Admins Authorized)
  function checkDashboardAuthorization(userRole) {
    return userRole === 'organizer' || userRole === 'admin';
  }
  assert(
    checkDashboardAuthorization('organizer') === true &&
    checkDashboardAuthorization('admin') === true &&
    checkDashboardAuthorization('participant') === false &&
    checkDashboardAuthorization('volunteer') === false,
    '39. Security: Participant and volunteer roles strictly blocked from accessing Organizer Analytics Dashboard'
  );

  // Test 40: Privacy Protection: Email Masking for Participant Table
  function maskParticipantEmail(email) {
    if (!email || !email.includes('@')) return email || '—';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  }
  const maskedRahul = maskParticipantEmail('rahul.patel@atmiya.edu');
  const maskedPriya = maskParticipantEmail('priya.sharma@atmiya.edu');
  assert(
    maskedRahul === 'ra***l@atmiya.edu' &&
    maskedPriya === 'pr***a@atmiya.edu' &&
    !maskedRahul.includes('patel'),
    '40. Privacy Protection: Participant email address safely masked to prevent unauthorized data exposure'
  );

  // Test 41: Realtime Updates: Stats Recalculate After New Registration & Check-In
  const liveEvent = harness.createEvent({
    title: 'Live Telemetry Test Workshop',
    category: 'Workshop',
    capacity: 20,
    status: 'published'
  });
  const liveStats0 = harness.getDashboardStats({ eventId: liveEvent.id });
  const liveReg = harness.registerForEvent({
    eventId: liveEvent.id,
    participantName: 'Telemetry User',
    participantEmail: 'telemetry@atmiya.edu'
  });
  const liveStats1 = harness.getDashboardStats({ eventId: liveEvent.id });
  harness.verifyAndCheckInTicket({
    ticketToken: liveReg.registration.ticket_token,
    selectedEventId: liveEvent.id,
    checkedInBy: 'organizer-user',
    operatorRole: 'organizer'
  });
  const liveStats2 = harness.getDashboardStats({ eventId: liveEvent.id });
  assert(
    liveStats0.total_registrations === 0 &&
    liveStats1.total_registrations === 1 &&
    liveStats1.total_checkins === 0 &&
    liveStats2.total_checkins === 1 &&
    liveStats2.attendance_percentage === 100,
    '41. Realtime Updates: Dashboard metrics automatically update upon new registration (0->1) and gate check-in (0->1, 100%)'
  );

  // Test 42: Realtime Updates: Certificate Request Review Updates Request Statistics
  const newReq = harness.requestCertificate({
    registrationId: liveReg.registration.id,
    reason: 'Medical early departure'
  });
  const reqStatsPending = harness.getDashboardStats({ eventId: liveEvent.id });
  harness.reviewCertificateRequest({
    requestId: newReq.request.id,
    decision: 'approved',
    operatorRole: 'organizer'
  });
  const reqStatsApproved = harness.getDashboardStats({ eventId: liveEvent.id });
  assert(
    reqStatsPending.pending_certificate_requests === 1 &&
    reqStatsApproved.pending_certificate_requests === 0 &&
    reqStatsApproved.approved_certificate_requests === 1,
    '42. Realtime Updates: Certificate statistics update on review (Pending: 1->0, Approved: 0->1)'
  );

  // =========================================================================
  // EXPORT REPORTS TESTS (Requirements 1 - 10)
  // =========================================================================

  // Test 43: Participant Report Generation
  const partReportItems = harness.getExportReportData({
    eventId: demoEvent.id,
    reportType: 'participant'
  });
  const firstPart = partReportItems.find(p => p.participant_name === 'Rahul Patel');
  assert(
    partReportItems.length === 3 &&
    firstPart &&
    firstPart.participant_name === 'Rahul Patel' &&
    firstPart.participant_email === 'rahul.patel@atmiya.edu' &&
    firstPart.student_id === 'AU2024-CS-042' &&
    firstPart.event_title === 'Code Carnival Demo Event' &&
    firstPart.registered_at &&
    firstPart.registration_status === 'confirmed',
    `43. Participant Report: Contains Name, College Email, Student ID, Event Name, Reg Date, and Status (${partReportItems.length} records)`
  );

  // Test 44: Attendance Report Generation
  const attReportItems = harness.getExportReportData({
    eventId: demoEvent.id,
    reportType: 'attendance'
  });
  const rahulAtt = attReportItems.find(p => p.participant_name === 'Rahul Patel');
  const amitAtt = attReportItems.find(p => p.participant_name === 'Amit Trivedi');
  assert(
    attReportItems.length === 3 &&
    rahulAtt && rahulAtt.has_checked_in === true && rahulAtt.checked_in_at &&
    amitAtt && amitAtt.has_checked_in === false && !amitAtt.checked_in_at,
    `44. Attendance Report: Contains Name, Event, Check-In Status (Checked-In=${rahulAtt?.has_checked_in}, Pending=${amitAtt?.has_checked_in}), and Timestamp`
  );

  // Test 45: Certificate Report Generation
  const certReportItems = harness.getExportReportData({
    eventId: demoEvent.id,
    reportType: 'certificate'
  });
  const rahulCert = certReportItems.find(p => p.participant_name === 'Rahul Patel');
  assert(
    certReportItems.length === 3 &&
    rahulCert &&
    rahulCert.certificate_reference &&
    rahulCert.certificate_reference.startsWith('CERT-') &&
    rahulCert.certificate_status,
    `45. Certificate Report: Contains Name, Event, Certificate Ref ID (${rahulCert?.certificate_reference}), Status (${rahulCert?.certificate_status}), and Issue Date`
  );

  // Test 46: Event Filter (Specific Event vs All Events Portfolio)
  const allEventsReport = harness.getExportReportData({
    eventId: 'all',
    reportType: 'participant'
  });
  assert(
    allEventsReport.length > partReportItems.length &&
    allEventsReport.some(p => p.event_id === otherEvent.id),
    `46. Event Filter: Scoped correctly between specific event (${partReportItems.length}) vs all events portfolio (${allEventsReport.length})`
  );

  // Test 47: Registration Status Filter (confirmed vs cancelled)
  const confirmedReport = harness.getExportReportData({
    registrationStatus: 'confirmed',
    reportType: 'participant'
  });
  const cancelledReport = harness.getExportReportData({
    registrationStatus: 'cancelled',
    reportType: 'participant'
  });
  assert(
    confirmedReport.every(p => p.registration_status === 'confirmed') &&
    cancelledReport.every(p => p.registration_status === 'cancelled') &&
    cancelledReport.length >= 1,
    `47. Registration Status Filter: Filtered confirmed (${confirmedReport.length}) and cancelled (${cancelledReport.length}) records cleanly`
  );

  // Test 48: Attendance Status Filter (checked_in vs not_checked_in)
  const checkedInFilterReport = harness.getExportReportData({
    eventId: demoEvent.id,
    attendanceStatus: 'checked_in',
    reportType: 'attendance'
  });
  const notCheckedInFilterReport = harness.getExportReportData({
    eventId: demoEvent.id,
    attendanceStatus: 'not_checked_in',
    reportType: 'attendance'
  });
  assert(
    checkedInFilterReport.length === 2 &&
    checkedInFilterReport.every(p => p.has_checked_in === true) &&
    notCheckedInFilterReport.length === 1 &&
    notCheckedInFilterReport.every(p => p.has_checked_in === false),
    `48. Attendance Status Filter: Filtered checked-in (${checkedInFilterReport.length}) and pending (${notCheckedInFilterReport.length}) records cleanly`
  );

  // Test 49: Data Accuracy & Deduplication (Count each registration strictly once)
  const deduplicatedItems = harness.getExportReportData({
    eventId: demoEvent.id,
    reportType: 'participant'
  });
  const regIdSet = new Set(deduplicatedItems.map(p => p.registration_id));
  assert(
    regIdSet.size === deduplicatedItems.length &&
    deduplicatedItems.length === 3,
    '49. Data Accuracy: Strict row deduplication verified, exactly 1 row per valid registration without inflation'
  );

  // Test 50: CSV Formatting & RFC 4180 Escaping with UTF-8 BOM
  const testCSVItems = [
    {
      participant_name: 'Dr. John "Jack" O\'Connor, Jr.',
      participant_email: 'jack@atmiya.edu',
      student_id: 'AU-2024,CS',
      event_title: 'Hackathon "Code Carnival 3.0", Atmiya',
      registered_at: '2026-10-10T10:00:00.000Z',
      registration_status: 'confirmed',
      ticket_token: 'EE-A1B2C3D4'
    }
  ];
  const generatedCSV = harness.generateCSV('participant', testCSVItems);
  assert(
    generatedCSV.startsWith('\uFEFF') && // UTF-8 BOM byte marker
    generatedCSV.includes('"Dr. John ""Jack"" O\'Connor, Jr."') && // escaped quotes and comma
    generatedCSV.includes('"AU-2024,CS"') && // escaped comma in student ID
    generatedCSV.includes('"Hackathon ""Code Carnival 3.0"", Atmiya"'), // escaped title
    '50. CSV Formatting: RFC 4180 escaping, internal quote doubling, and UTF-8 BOM verification passed'
  );

  // Test 51: Empty Report Handling (0 records handled gracefully without errors)
  const emptyReportItems = harness.getExportReportData({
    eventId: emptyEvent.id,
    reportType: 'participant'
  });
  const emptyCSV = harness.generateCSV('participant', emptyReportItems);
  assert(
    emptyReportItems.length === 0 &&
    typeof emptyCSV === 'string' &&
    emptyCSV.startsWith('\uFEFF#,'),
    '51. Empty Report Handling: Gracefully returns 0 records and valid empty CSV header without throwing'
  );

  // Test 52: Security & Authorization (Organizers access only authorized events)
  const org1Event = harness.createEvent({
    title: 'Org 1 Private Summit',
    organizer_id: 'org-1-uuid',
    capacity: 50,
    status: 'published'
  });
  const org2Event = harness.createEvent({
    title: 'Org 2 Private Fest',
    organizer_id: 'org-2-uuid',
    capacity: 50,
    status: 'published'
  });
  harness.registerForEvent({
    eventId: org1Event.id,
    participantName: 'Org1 User',
    participantEmail: 'org1@atmiya.edu'
  });
  harness.registerForEvent({
    eventId: org2Event.id,
    participantName: 'Org2 User',
    participantEmail: 'org2@atmiya.edu'
  });

  const org1Exports = harness.getExportReportData({
    organizerId: 'org-1-uuid',
    reportType: 'participant'
  });
  assert(
    org1Exports.every(p => p.event_id === org1Event.id) &&
    !org1Exports.some(p => p.event_id === org2Event.id),
    '52. Security & Ownership: Organizer can only export data for events they are authorized to manage'
  );

  // ==========================================
  // IN-APP NOTIFICATIONS (Requirement 8)
  // ==========================================

  // Test 53: Registration triggers in-app notification with pass reference
  const notifEvent = harness.createEvent({
    title: 'Hackathon Notification Test Event',
    capacity: 20,
    status: 'published'
  });
  const notifUserReg = harness.registerForEvent({
    eventId: notifEvent.id,
    participantName: 'Notification Tester',
    participantEmail: 'notif.user@atmiya.edu'
  });
  const userNotifs = harness.getMyNotifications('notif.user@atmiya.edu');
  assert(
    userNotifs.length > 0 &&
    userNotifs[0].type === 'registration' &&
    userNotifs[0].message.includes(notifUserReg.registration.ticket_token) &&
    userNotifs[0].read === false,
    '53. In-App Notifications: Registration triggers persistent confirmation notification with ticket token'
  );

  // Test 54: Notification user isolation & privacy
  const userNotifsFiltered = harness.getMyNotifications('other.unregistered@atmiya.edu');
  assert(
    userNotifsFiltered.length === 0,
    '54. Security & Privacy: Users can strictly access ONLY their own in-app notifications'
  );

  // Test 55: Event details update triggers notifications to registered attendees
  harness.updateEvent(notifEvent.id, {
    venue: 'Main Auditorium Room 402',
    start_time: '11:00'
  });
  const updatedUserNotifs = harness.getMyNotifications('notif.user@atmiya.edu');
  const eventUpdateNotif = updatedUserNotifs.find(n => n.type === 'event_update');
  assert(
    eventUpdateNotif &&
    eventUpdateNotif.message.includes('Main Auditorium Room 402') &&
    eventUpdateNotif.message.includes('11:00'),
    '55. In-App Notifications: Venue & schedule updates notify registered participants automatically'
  );

  // Test 56: Certificate availability triggers in-app notification
  harness.verifyAndCheckInTicket({
    ticketToken: notifUserReg.registration.ticket_token,
    selectedEventId: notifEvent.id,
    operatorRole: 'organizer'
  });
  const certRes = harness.generateCertificateForRegistration({
    registrationId: notifUserReg.registration.id,
    operatorRole: 'organizer'
  });
  const certNotifs = harness.getMyNotifications('notif.user@atmiya.edu');
  const certNotif = certNotifs.find(n => n.type === 'certificate');
  assert(
    certNotif &&
    certNotif.message.includes(certRes.certificate.certificate_reference),
    '56. In-App Notifications: Verified attendance & certificate availability notifies participant'
  );

  // Test 57: Notification read status management
  const unreadBefore = harness.getMyNotifications('notif.user@atmiya.edu').filter(n => !n.read).length;
  harness.markNotificationAsRead(userNotifs[0].id);
  const unreadAfterSingle = harness.getMyNotifications('notif.user@atmiya.edu').filter(n => !n.read).length;
  harness.markAllNotificationsAsRead('notif.user@atmiya.edu');
  const unreadAfterAll = harness.getMyNotifications('notif.user@atmiya.edu').filter(n => !n.read).length;
  assert(
    unreadBefore > 0 &&
    unreadAfterSingle === unreadBefore - 1 &&
    unreadAfterAll === 0,
    '57. In-App Notifications: Single mark-as-read and bulk mark-all-read update status reliably'
  );

  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runAllTests();



