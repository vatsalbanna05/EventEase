import { supabase, isSupabaseConfigured } from './supabase';
import {
  CollegeEvent,
  Registration,
  AttendanceRecord,
  Certificate,
  CertificateSettings,
  ScanResult,
  RegistrationResult,
  DashboardStats,
  UserProfile,
  UserRole
} from '../types';

const STORAGE_KEY = 'eventease_database_v1';

// Initial Demo Seed Data
const initialProfiles: UserProfile[] = [
  {
    id: 'user-organizer-1',
    full_name: 'Prof. Rajesh Mehta',
    email: 'organizer@atmiya.edu',
    role: 'organizer',
    department: 'Computer Science & Engineering',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'user-volunteer-1',
    full_name: 'Aarav Shah',
    email: 'volunteer@atmiya.edu',
    role: 'volunteer',
    student_id: 'AU2023-CS-108',
    department: 'Information Technology',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'user-participant-rahul',
    full_name: 'Rahul Patel',
    email: 'rahul.patel@atmiya.edu',
    role: 'participant',
    student_id: 'AU2024-CS-042',
    department: 'Computer Science',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'user-participant-priya',
    full_name: 'Priya Sharma',
    email: 'priya.sharma@atmiya.edu',
    role: 'participant',
    student_id: 'AU2024-IT-019',
    department: 'Information Technology',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  }
];

const getTomorrowDate = (daysAhead: number = 1): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const initialEvents: CollegeEvent[] = [
  {
    id: 'demo-event-code-carnival-3',
    organizer_id: 'user-organizer-1',
    organizer_name: 'Prof. Rajesh Mehta',
    title: 'Code Carnival Demo Event',
    description: 'Official Code Carnival 3.0 Hackathon Problem Statement PS-03 Demo Event. Features real-time capacity limits, fast dynamic QR verification, and instant attendance analytics.',
    category: 'Hackathon',
    banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    event_date: getTomorrowDate(1),
    start_time: '09:30',
    end_time: '17:00',
    venue: 'Main Auditorium, Atmiya University',
    capacity: 3, // Capacity configured to 3 for hackathon demonstration!
    status: 'published',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-event-techsummit',
    organizer_id: 'user-organizer-1',
    organizer_name: 'Prof. Rajesh Mehta',
    title: 'TechSummit 2025: AI & Future Computing',
    description: 'Explore generative AI breakthroughs, deep learning architectures, and cloud microservices with national industry tech leaders and university researchers.',
    category: 'Tech',
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    event_date: getTomorrowDate(3),
    start_time: '10:00',
    end_time: '16:00',
    venue: 'CS Seminar Hall 101, Atmiya Campus',
    capacity: 50,
    status: 'published',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'demo-event-cultural',
    organizer_id: 'user-organizer-1',
    organizer_name: 'Prof. Rajesh Mehta',
    title: 'Campus Music & Cultural Fest "Vibrance"',
    description: 'Annual inter-college celebration of music, theatrical performances, dance battles, and live arts. Open to all students with authorized college ID passes.',
    category: 'Cultural',
    banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    event_date: getTomorrowDate(7),
    start_time: '18:00',
    end_time: '22:00',
    venue: 'Open Air Amphitheatre',
    capacity: 150,
    status: 'published',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  }
];

const initialRegistrations: Registration[] = [
  {
    id: 'reg-demo-priya',
    event_id: 'demo-event-techsummit',
    participant_id: 'user-participant-priya',
    participant_name: 'Priya Sharma',
    participant_email: 'priya.sharma@atmiya.edu',
    student_id: 'AU2024-IT-019',
    ticket_token: 'EE-9B41F0C2',
    registration_status: 'confirmed',
    registered_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

const initialAttendance: AttendanceRecord[] = [];

const initialCertSettings: CertificateSettings[] = [
  {
    id: 'cert-setting-1',
    event_id: 'demo-event-code-carnival-3',
    title: 'Certificate of Excellence & Participation',
    issuing_organization: 'Atmiya University — Code Carnival 3.0',
    signatory_name: 'Dr. Rajesh Patel',
    signatory_role: 'Chairperson, Event Organizing Committee',
    requires_checkin: true,
  },
  {
    id: 'cert-setting-2',
    event_id: 'demo-event-techsummit',
    title: 'Certificate of Attendance & Completion',
    issuing_organization: 'Faculty of Engineering & Technology, Atmiya University',
    signatory_name: 'Prof. Rajesh Mehta',
    signatory_role: 'Head of Computer Science',
    requires_checkin: true,
  }
];

const initialCertificates: Certificate[] = [];

interface LocalDatabaseState {
  profiles: UserProfile[];
  events: CollegeEvent[];
  registrations: Registration[];
  attendance: AttendanceRecord[];
  certificateSettings: CertificateSettings[];
  certificates: Certificate[];
}

function getLocalState(): LocalDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.events)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading local state:', e);
  }
  const defaultState: LocalDatabaseState = {
    profiles: initialProfiles,
    events: initialEvents,
    registrations: initialRegistrations,
    attendance: initialAttendance,
    certificateSettings: initialCertSettings,
    certificates: initialCertificates,
  };
  saveLocalState(defaultState);
  return defaultState;
}

function saveLocalState(state: LocalDatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving local state:', e);
  }
}

export function resetDemoDatabase(): void {
  const defaultState: LocalDatabaseState = {
    profiles: initialProfiles,
    events: initialEvents,
    registrations: initialRegistrations,
    attendance: initialAttendance,
    certificateSettings: initialCertSettings,
    certificates: initialCertificates,
  };
  saveLocalState(defaultState);
}

// Generate unpredictable opaque ticket token
export function generateTicketToken(): string {
  const chars = '0123456789ABCDEF';
  let result = 'EE-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateCertReference(): string {
  const chars = '0123456789ABCDEF';
  let result = 'CERT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Unified API Service
export const api = {
  // ==========================================
  // EVENTS
  // ==========================================
  async getEvents(): Promise<CollegeEvent[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            profiles:organizer_id (full_name),
            registrations:registrations (id, registration_status),
            attendance:attendance (id)
          `)
          .order('event_date', { ascending: true });

        if (!error && data) {
          return data.map((ev: any) => {
            const confirmedRegs = ev.registrations?.filter((r: any) => r.registration_status === 'confirmed').length || 0;
            const checkedIns = ev.attendance?.length || 0;
            return {
              id: ev.id,
              organizer_id: ev.organizer_id,
              organizer_name: ev.profiles?.full_name || 'Event Organizer',
              title: ev.title,
              description: ev.description,
              category: ev.category,
              banner_url: ev.banner_url,
              event_date: ev.event_date,
              start_time: ev.start_time,
              end_time: ev.end_time,
              venue: ev.venue,
              capacity: ev.capacity,
              registration_deadline: ev.registration_deadline,
              status: ev.status,
              created_at: ev.created_at,
              registered_count: confirmedRegs,
              checked_in_count: checkedIns,
            };
          });
        }
      } catch (err) {
        console.warn('Supabase getEvents failed, using local database:', err);
      }
    }

    const state = getLocalState();
    return state.events.map(ev => {
      const regCount = state.registrations.filter(r => r.event_id === ev.id && r.registration_status === 'confirmed').length;
      const attCount = state.attendance.filter(a => a.event_id === ev.id).length;
      const org = state.profiles.find(p => p.id === ev.organizer_id);
      return {
        ...ev,
        registered_count: regCount,
        checked_in_count: attCount,
        organizer_name: org?.full_name || ev.organizer_name || 'EventEase Organizer'
      };
    });
  },

  async getEventById(id: string): Promise<CollegeEvent | null> {
    const events = await this.getEvents();
    return events.find(e => e.id === id) || null;
  },

  async createEvent(eventData: Omit<CollegeEvent, 'id' | 'created_at' | 'registered_count' | 'checked_in_count'>): Promise<CollegeEvent> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single();

        if (!error && data) {
          // Also create default certificate settings
          await supabase.from('certificate_settings').insert([{
            event_id: data.id,
            title: 'Certificate of Participation',
            issuing_organization: 'Atmiya University',
            signatory_name: 'Organizing Committee',
            signatory_role: 'Event Lead',
            requires_checkin: true,
          }]);

          return { ...data, registered_count: 0, checked_in_count: 0 };
        }
      } catch (err) {
        console.warn('Supabase createEvent failed, using local database:', err);
      }
    }

    const state = getLocalState();
    const newEvent: CollegeEvent = {
      ...eventData,
      id: 'event-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      created_at: new Date().toISOString(),
      registered_count: 0,
      checked_in_count: 0,
    };
    state.events.unshift(newEvent);

    // Default cert settings
    state.certificateSettings.push({
      id: 'cert-set-' + Date.now(),
      event_id: newEvent.id,
      title: 'Certificate of Participation',
      issuing_organization: 'Atmiya University',
      signatory_name: 'Organizing Committee',
      signatory_role: 'Event Lead',
      requires_checkin: true,
    });

    saveLocalState(state);
    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<CollegeEvent>): Promise<CollegeEvent | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('events')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateEvent error, falling back:', err);
      }
    }

    const state = getLocalState();
    const index = state.events.findIndex(e => e.id === id);
    if (index === -1) return null;

    // Safety check: Do not allow capacity to be reduced below active registrations
    const confirmedRegs = state.registrations.filter(r => r.event_id === id && r.registration_status === 'confirmed').length;
    if (updates.capacity !== undefined && updates.capacity < confirmedRegs) {
      throw new Error(`Cannot reduce capacity to ${updates.capacity}. There are already ${confirmedRegs} confirmed registrations.`);
    }

    state.events[index] = { ...state.events[index], ...updates, updated_at: new Date().toISOString() };
    saveLocalState(state);
    return state.events[index];
  },

  async cancelEvent(id: string): Promise<boolean> {
    return !!(await this.updateEvent(id, { status: 'cancelled' }));
  },

  // ==========================================
  // ATOMIC REGISTRATION
  // ==========================================
  async registerForEvent(params: {
    eventId: string;
    participantName: string;
    participantEmail: string;
    studentId?: string;
    participantId?: string;
  }): Promise<RegistrationResult> {
    const { eventId, participantName, participantEmail, studentId, participantId } = params;
    const normalizedEmail = participantEmail.trim().toLowerCase();
    const trimmedName = participantName.trim();

    if (!trimmedName || !normalizedEmail) {
      return { success: false, error_code: 'DATABASE_ERROR', message: 'Name and email are required.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('register_for_event', {
          p_event_id: eventId,
          p_participant_name: trimmedName,
          p_participant_email: normalizedEmail,
          p_student_id: studentId?.trim() || null,
          p_participant_id: participantId || null
        });

        if (error) {
          return { success: false, error_code: 'DATABASE_ERROR', message: error.message };
        }
        if (data && !data.success) {
          return { success: false, error_code: data.error_code, message: data.message };
        }
        if (data && data.success) {
          return { success: true, message: 'Registration confirmed!', registration: data.registration };
        }
      } catch (err: any) {
        console.warn('Supabase RPC register_for_event fallback to local:', err);
      }
    }

    // Local Atomic Engine
    const state = getLocalState();
    const event = state.events.find(e => e.id === eventId);
    if (!event) {
      return { success: false, error_code: 'EVENT_NOT_FOUND', message: 'Event not found.' };
    }

    if (event.status !== 'published') {
      return { success: false, error_code: 'EVENT_UNAVAILABLE', message: 'This event is not accepting registrations.' };
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return { success: false, error_code: 'DEADLINE_PASSED', message: 'The registration deadline has passed.' };
    }

    // Duplicate Check
    const isDuplicate = state.registrations.some(
      r => r.event_id === eventId &&
           r.participant_email.toLowerCase() === normalizedEmail &&
           r.registration_status === 'confirmed'
    );

    if (isDuplicate) {
      return {
        success: false,
        error_code: 'DUPLICATE_REGISTRATION',
        message: 'You are already registered for this event with this email address.'
      };
    }

    // Capacity Check
    const activeCount = state.registrations.filter(
      r => r.event_id === eventId && r.registration_status === 'confirmed'
    ).length;

    if (activeCount >= event.capacity) {
      return {
        success: false,
        error_code: 'EVENT_FULL',
        message: `Event capacity (${event.capacity} seats) is completely full.`
      };
    }

    // Generate Token
    const token = generateTicketToken();
    const newReg: Registration = {
      id: 'reg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      event_id: eventId,
      participant_id: participantId,
      participant_name: trimmedName,
      participant_email: normalizedEmail,
      student_id: studentId?.trim(),
      ticket_token: token,
      registration_status: 'confirmed',
      registered_at: new Date().toISOString(),
      event: event
    };

    state.registrations.unshift(newReg);
    saveLocalState(state);

    return {
      success: true,
      message: 'Registration confirmed! Your QR ticket is ready.',
      registration: newReg
    };
  },

  // ==========================================
  // ATOMIC QR VERIFICATION & CHECK-IN
  // ==========================================
  async verifyAndCheckInTicket(params: {
    ticketToken: string;
    selectedEventId: string;
    checkedInBy?: string;
  }): Promise<ScanResult> {
    const { ticketToken, selectedEventId, checkedInBy } = params;
    const cleanToken = ticketToken.trim().toUpperCase();

    if (!cleanToken) {
      return {
        outcome: 'INVALID_TICKET',
        success: false,
        message: 'Ticket token or QR data is missing.'
      };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('verify_and_checkin_ticket', {
          p_ticket_token: cleanToken,
          p_event_id: selectedEventId,
          p_checked_in_by: checkedInBy || null
        });

        if (!error && data) {
          return data as ScanResult;
        }
      } catch (err) {
        console.warn('Supabase RPC verify_and_checkin_ticket fallback:', err);
      }
    }

    // Local Atomic Engine
    const state = getLocalState();

    // 1. Find Registration by Token
    const reg = state.registrations.find(
      r => r.ticket_token.trim().toUpperCase() === cleanToken
    );

    if (!reg) {
      return {
        outcome: 'INVALID_TICKET',
        success: false,
        message: `No matching ticket found for code "${cleanToken}". Please check the QR code or enter a valid reference.`
      };
    }

    // 2. Event Match Verification
    if (reg.event_id !== selectedEventId) {
      const ticketEvent = state.events.find(e => e.id === reg.event_id);
      return {
        outcome: 'WRONG_EVENT',
        success: false,
        message: `Ticket belongs to "${ticketEvent?.title || 'Another Event'}", not the currently selected check-in event.`,
        participant_name: reg.participant_name,
        ticket_event_id: reg.event_id,
        ticket_event_title: ticketEvent?.title
      };
    }

    // 3. Cancelled Registration Check
    if (reg.registration_status === 'cancelled') {
      return {
        outcome: 'REGISTRATION_CANCELLED',
        success: false,
        message: 'This registration has been cancelled and cannot be used for entry.',
        participant_name: reg.participant_name,
        ticket_token: reg.ticket_token
      };
    }

    // 4. Event Status Check
    const event = state.events.find(e => e.id === selectedEventId);
    if (event?.status === 'cancelled') {
      return {
        outcome: 'EVENT_UNAVAILABLE',
        success: false,
        message: 'The selected event has been cancelled by the organizer. Check-ins are disabled.',
        participant_name: reg.participant_name
      };
    }

    // 5. Duplicate Check-in Check (Strict Server-Side / State Level Prevention)
    const existingAttendance = state.attendance.find(a => a.registration_id === reg.id);
    if (existingAttendance) {
      const checkInDate = new Date(existingAttendance.checked_in_at);
      const timeStr = checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = checkInDate.toLocaleDateString();

      return {
        outcome: 'ALREADY_CHECKED_IN',
        success: false,
        message: `DUPLICATE ENTRY REJECTED: ${reg.participant_name} was already checked in at ${timeStr} (${dateStr}).`,
        participant_name: reg.participant_name,
        participant_email: reg.participant_email,
        student_id: reg.student_id,
        ticket_token: reg.ticket_token,
        checked_in_at: existingAttendance.checked_in_at
      };
    }

    // 6. RECORD NEW ATTENDANCE ATOMICALLY
    const nowIso = new Date().toISOString();
    const newAtt: AttendanceRecord = {
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      registration_id: reg.id,
      event_id: selectedEventId,
      checked_in_at: nowIso,
      checked_in_by: checkedInBy,
      created_at: nowIso,
      participant_name: reg.participant_name,
      participant_email: reg.participant_email,
      student_id: reg.student_id,
      ticket_token: reg.ticket_token
    };
    state.attendance.push(newAtt);

    // 7. ISSUE / MARK CERTIFICATE ELIGIBILITY
    const existingCert = state.certificates.find(c => c.registration_id === reg.id);
    if (!existingCert) {
      state.certificates.push({
        id: 'cert-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        registration_id: reg.id,
        event_id: selectedEventId,
        certificate_reference: generateCertReference(),
        eligibility_status: 'eligible',
        issued_at: nowIso,
        created_at: nowIso,
      });
    }

    saveLocalState(state);

    const totalReg = state.registrations.filter(r => r.event_id === selectedEventId && r.registration_status === 'confirmed').length;
    const totalAtt = state.attendance.filter(a => a.event_id === selectedEventId).length;

    return {
      outcome: 'VALID_TICKET',
      success: true,
      message: `CHECK-IN SUCCESSFUL! Welcome ${reg.participant_name}.`,
      participant_name: reg.participant_name,
      participant_email: reg.participant_email,
      student_id: reg.student_id,
      ticket_token: reg.ticket_token,
      checked_in_at: nowIso,
      attendance_count: totalAtt,
      total_registered: totalReg
    };
  },

  // ==========================================
  // PARTICIPANT TICKETS & REGISTRATIONS
  // ==========================================
  async getMyTickets(emailOrUserId: string): Promise<Registration[]> {
    const events = await this.getEvents();
    const state = getLocalState();
    const cleanLookup = emailOrUserId.trim().toLowerCase();

    const userRegs = state.registrations.filter(
      r => (r.participant_id && r.participant_id === emailOrUserId) ||
           r.participant_email.toLowerCase() === cleanLookup
    );

    return userRegs.map(reg => {
      const ev = events.find(e => e.id === reg.event_id);
      const att = state.attendance.find(a => a.registration_id === reg.id);
      const cert = state.certificates.find(c => c.registration_id === reg.id);

      return {
        ...reg,
        event: ev,
        has_checked_in: !!att,
        checked_in_at: att?.checked_in_at,
        certificate_reference: cert?.certificate_reference
      };
    });
  },

  async cancelRegistration(registrationId: string): Promise<boolean> {
    const state = getLocalState();
    const reg = state.registrations.find(r => r.id === registrationId);
    if (!reg) return false;

    // Disallow cancelling if already checked in
    const att = state.attendance.find(a => a.registration_id === registrationId);
    if (att) {
      throw new Error('Cannot cancel a registration that has already been checked in.');
    }

    reg.registration_status = 'cancelled';
    saveLocalState(state);
    return true;
  },

  // ==========================================
  // ATTENDANCE & PARTICIPANT MANAGEMENT
  // ==========================================
  async getEventAttendees(eventId: string): Promise<Array<Registration & { attendance?: AttendanceRecord; certificate?: Certificate }>> {
    const state = getLocalState();
    const regs = state.registrations.filter(r => r.event_id === eventId);

    return regs.map(reg => {
      const att = state.attendance.find(a => a.registration_id === reg.id);
      const cert = state.certificates.find(c => c.registration_id === reg.id);
      return {
        ...reg,
        attendance: att,
        has_checked_in: !!att,
        checked_in_at: att?.checked_in_at,
        certificate: cert
      };
    });
  },

  async manualCheckInAttendee(registrationId: string, checkedInBy?: string): Promise<ScanResult> {
    const state = getLocalState();
    const reg = state.registrations.find(r => r.id === registrationId);
    if (!reg) {
      return { outcome: 'INVALID_TICKET', success: false, message: 'Registration record not found.' };
    }
    return this.verifyAndCheckInTicket({
      ticketToken: reg.ticket_token,
      selectedEventId: reg.event_id,
      checkedInBy
    });
  },

  // ==========================================
  // ORGANIZER DASHBOARD STATS
  // ==========================================
  async getDashboardStats(organizerId?: string): Promise<DashboardStats> {
    const state = getLocalState();
    let events = state.events;
    if (organizerId) {
      events = events.filter(e => e.organizer_id === organizerId);
    }

    const eventIds = new Set(events.map(e => e.id));
    const registrations = state.registrations.filter(r => eventIds.has(r.event_id) && r.registration_status === 'confirmed');
    const attendance = state.attendance.filter(a => eventIds.has(a.event_id));

    const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    const totalRegistrations = registrations.length;
    const totalCheckins = attendance.length;
    const overallRate = totalRegistrations > 0 ? Math.round((totalCheckins / totalRegistrations) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = events.filter(e => e.event_date >= todayStr && e.status === 'published').length;

    // Category Distribution
    const catMap: Record<string, { count: number; registrations: number }> = {};
    events.forEach(e => {
      if (!catMap[e.category]) catMap[e.category] = { count: 0, registrations: 0 };
      catMap[e.category].count += 1;
      const countRegs = state.registrations.filter(r => r.event_id === e.id && r.registration_status === 'confirmed').length;
      catMap[e.category].registrations += countRegs;
    });

    const category_distribution = Object.keys(catMap).map(k => ({
      category: k,
      count: catMap[k].count,
      registrations: catMap[k].registrations
    }));

    // Attendance Trend by Event
    const attendance_trend = events.map(e => {
      const regC = state.registrations.filter(r => r.event_id === e.id && r.registration_status === 'confirmed').length;
      const attC = state.attendance.filter(a => a.event_id === e.id).length;
      return {
        event_title: e.title.length > 18 ? e.title.substring(0, 16) + '...' : e.title,
        registered: regC,
        checked_in: attC,
        capacity: e.capacity
      };
    });

    // Recent registrations with event title
    const recent_registrations = registrations.slice(0, 8).map(r => ({
      ...r,
      event: events.find(e => e.id === r.event_id)
    }));

    return {
      total_events: events.length,
      upcoming_events: upcomingEvents,
      total_registrations: totalRegistrations,
      total_checkins: totalCheckins,
      overall_attendance_rate: overallRate,
      total_capacity: totalCapacity,
      recent_registrations,
      category_distribution,
      attendance_trend
    };
  },

  // ==========================================
  // CERTIFICATE CENTER
  // ==========================================
  async getCertificateSettings(eventId: string): Promise<CertificateSettings | null> {
    const state = getLocalState();
    return state.certificateSettings.find(cs => cs.event_id === eventId) || null;
  },

  async saveCertificateSettings(settings: CertificateSettings): Promise<CertificateSettings> {
    const state = getLocalState();
    const idx = state.certificateSettings.findIndex(cs => cs.event_id === settings.event_id);
    if (idx >= 0) {
      state.certificateSettings[idx] = settings;
    } else {
      state.certificateSettings.push(settings);
    }
    saveLocalState(state);
    return settings;
  },

  async getMyCertificates(emailOrUserId: string): Promise<Certificate[]> {
    const state = getLocalState();
    const cleanLookup = emailOrUserId.trim().toLowerCase();
    const userRegs = state.registrations.filter(
      r => (r.participant_id && r.participant_id === emailOrUserId) ||
           r.participant_email.toLowerCase() === cleanLookup
    );

    const userRegIds = new Set(userRegs.map(r => r.id));
    const certs = state.certificates.filter(c => userRegIds.has(c.registration_id));

    return certs.map(c => {
      const reg = userRegs.find(r => r.id === c.registration_id);
      const ev = state.events.find(e => e.id === c.event_id);
      const cs = state.certificateSettings.find(s => s.event_id === c.event_id);

      return {
        ...c,
        event_title: ev?.title || 'College Event',
        participant_name: reg?.participant_name || 'Participant',
        event_date: ev?.event_date,
        issuing_organization: cs?.issuing_organization || 'Atmiya University',
        signatory_name: cs?.signatory_name || 'Organizing Authority',
        signatory_role: cs?.signatory_role || 'Event Chair'
      };
    });
  },

  async getCertificateByRef(ref: string): Promise<Certificate | null> {
    const state = getLocalState();
    const cert = state.certificates.find(c => c.certificate_reference.toUpperCase() === ref.trim().toUpperCase());
    if (!cert) return null;

    const reg = state.registrations.find(r => r.id === cert.registration_id);
    const ev = state.events.find(e => e.id === cert.event_id);
    const cs = state.certificateSettings.find(s => s.event_id === cert.event_id);

    return {
      ...cert,
      event_title: ev?.title || 'College Event',
      participant_name: reg?.participant_name || 'Participant',
      event_date: ev?.event_date,
      issuing_organization: cs?.issuing_organization || 'Atmiya University',
      signatory_name: cs?.signatory_name || 'Organizing Authority',
      signatory_role: cs?.signatory_role || 'Event Chair'
    };
  }
};
