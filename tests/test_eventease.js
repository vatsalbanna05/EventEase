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
  }

  generateTicketToken() {
    const chars = '0123456789ABCDEF';
    let result = 'EE-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createEvent(eventData) {
    const newEvent = {
      ...eventData,
      id: 'event-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    this.events.push(newEvent);
    return newEvent;
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
    return { success: true, message: 'Registration confirmed', registration: newReg };
  }

  verifyAndCheckInTicket({ ticketToken, selectedEventId, checkedInBy }) {
    const cleanToken = (ticketToken || '').trim().toUpperCase();
    if (!cleanToken) return { outcome: 'INVALID_TICKET', success: false, message: 'Missing token' };

    const reg = this.registrations.find(r => r.ticket_token.toUpperCase() === cleanToken);
    if (!reg) return { outcome: 'INVALID_TICKET', success: false, message: 'Invalid ticket' };

    if (reg.event_id !== selectedEventId) {
      return { outcome: 'WRONG_EVENT', success: false, message: 'Wrong event ticket' };
    }

    if (reg.registration_status === 'cancelled') {
      return { outcome: 'REGISTRATION_CANCELLED', success: false, message: 'Registration cancelled' };
    }

    const event = this.events.find(e => e.id === selectedEventId);
    if (event?.status === 'cancelled') {
      return { outcome: 'EVENT_UNAVAILABLE', success: false, message: 'Event cancelled' };
    }

    // Duplicate check-in verification
    const existing = this.attendance.find(a => a.registration_id === reg.id);
    if (existing) {
      return {
        outcome: 'ALREADY_CHECKED_IN',
        success: false,
        message: 'Duplicate entry rejected',
        checked_in_at: existing.checked_in_at,
        participant_name: reg.participant_name
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
    this.certificates.push({
      id: 'cert-' + Math.random().toString(36).substr(2, 9),
      registration_id: reg.id,
      event_id: selectedEventId,
      certificate_reference: 'CERT-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      eligibility_status: 'eligible',
      issued_at: nowIso
    });

    const totalAtt = this.attendance.filter(a => a.event_id === selectedEventId).length;
    return {
      outcome: 'VALID_TICKET',
      success: true,
      message: 'Check-in successful',
      participant_name: reg.participant_name,
      attendance_count: totalAtt
    };
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

  console.log('\n===============================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===============================================================');

  if (failed > 0) process.exit(1);
}

runAllTests();
