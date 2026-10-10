import { supabase, isSupabaseConfigured } from './supabase';
import {
  CollegeEvent,
  Registration,
  AttendanceRecord,
  Certificate,
  CertificateSettings,
  CertificateRequest,
  CertificateVerificationResult,
  EligibilityRule,
  ScanResult,
  RegistrationResult,
  DashboardStats,
  EventPerformanceMetric,
  ReportFilterOptions,
  ReportItem,
  UserProfile,
  UserRole,
  AppNotification,
  NotificationType
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
    eligibility_rule: 'checked_in',
  },
  {
    id: 'cert-setting-2',
    event_id: 'demo-event-techsummit',
    title: 'Certificate of Attendance & Completion',
    issuing_organization: 'Faculty of Engineering & Technology, Atmiya University',
    signatory_name: 'Prof. Rajesh Mehta',
    signatory_role: 'Head of Computer Science',
    requires_checkin: true,
    eligibility_rule: 'checked_in',
  }
];

const initialCertificates: Certificate[] = [];
const initialCertificateRequests: CertificateRequest[] = [];

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-seed-1',
    user_email: 'rahul.patel@atmiya.edu',
    user_id: 'user-participant-rahul',
    title: 'Registration Confirmed!',
    message: 'You are officially registered for Code Carnival Demo Event. Your pass reference is EE-B394AF21.',
    type: 'registration',
    read: false,
    link: '/my-tickets',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'notif-seed-2',
    user_email: 'rahul.patel@atmiya.edu',
    user_id: 'user-participant-rahul',
    title: 'Certificate Available',
    message: 'Your Certificate of Excellence & Participation is now available after attendance verification.',
    type: 'certificate',
    read: false,
    link: '/certificates',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'notif-seed-3',
    user_email: 'organizer@atmiya.edu',
    user_id: 'user-organizer-1',
    title: 'Event Published',
    message: 'Code Carnival Demo Event is now live for student registrations.',
    type: 'system',
    read: true,
    link: '/organizer/dashboard',
    created_at: new Date(Date.now() - 7200000).toISOString(),
  }
];

interface LocalDatabaseState {
  profiles: UserProfile[];
  events: CollegeEvent[];
  registrations: Registration[];
  attendance: AttendanceRecord[];
  certificateSettings: CertificateSettings[];
  certificates: Certificate[];
  certificateRequests: CertificateRequest[];
  notifications: AppNotification[];
}

function getLocalState(): LocalDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.events)) {
        if (!parsed.certificateRequests) parsed.certificateRequests = [];
        if (!parsed.certificates) parsed.certificates = [];
        if (!parsed.certificateSettings) parsed.certificateSettings = initialCertSettings;
        if (!parsed.notifications) parsed.notifications = initialNotifications;
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
    certificateRequests: initialCertificateRequests,
    notifications: initialNotifications,
  };
  saveLocalState(defaultState);
  return defaultState;
}

export function notifyDataChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eventease:data_changed'));
  }
}

function saveLocalState(state: LocalDatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notifyDataChanged();
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
    certificateRequests: initialCertificateRequests,
    notifications: initialNotifications,
  };
  saveLocalState(defaultState);
}

// Helper to test if a string is a valid UUID
export function isUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

// Generate RFC 4122 v4 UUID
export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
          const supabaseEvents = data.map((ev: any) => {
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

          // Also preserve any local non-db events (e.g. preexisting local demo events)
          const state = getLocalState();
          const supabaseIds = new Set(supabaseEvents.map(e => e.id));
          const localEvents = state.events.filter(e => !supabaseIds.has(e.id)).map(ev => {
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

          return [...supabaseEvents, ...localEvents];
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
        // Sanitize payload to ONLY include valid table columns of public.events
        const insertPayload: Record<string, any> = {
          title: eventData.title.trim(),
          description: eventData.description.trim(),
          category: eventData.category,
          banner_url: eventData.banner_url?.trim() || null,
          event_date: eventData.event_date,
          start_time: eventData.start_time,
          end_time: eventData.end_time,
          venue: eventData.venue.trim(),
          capacity: Number(eventData.capacity),
          registration_deadline: eventData.registration_deadline || null,
          status: eventData.status || 'published',
        };

        // Only pass organizer_id if it's a valid UUID (profiles.id reference)
        if (eventData.organizer_id && isUuid(eventData.organizer_id)) {
          insertPayload.organizer_id = eventData.organizer_id;
        }

        const { data, error } = await supabase
          .from('events')
          .insert([insertPayload])
          .select()
          .single();

        if (error) {
          console.error('Supabase createEvent error:', error);
          throw new Error(error.message || 'Failed to create event in Supabase');
        }

        if (data) {
          // Also create default certificate settings
          await supabase.from('certificate_settings').insert([{
            event_id: data.id,
            title: 'Certificate of Participation',
            issuing_organization: 'Atmiya University',
            signatory_name: 'Organizing Committee',
            signatory_role: 'Event Lead',
            requires_checkin: true,
          }]);

          return {
            ...data,
            organizer_name: eventData.organizer_name || 'Event Organizer',
            registered_count: 0,
            checked_in_count: 0
          };
        }
      } catch (err: any) {
        console.warn('Supabase createEvent failed, falling back to local persistent store:', err);
      }
    }

    const state = getLocalState();
    const newEvent: CollegeEvent = {
      ...eventData,
      id: generateUuid(),
      created_at: new Date().toISOString(),
      registered_count: 0,
      checked_in_count: 0,
    };
    state.events.unshift(newEvent);

    // Default cert settings
    state.certificateSettings.push({
      id: generateUuid(),
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
    if (isSupabaseConfigured() && isUuid(id)) {
      try {
        const updatePayload: Record<string, any> = {};
        if (updates.title !== undefined) updatePayload.title = updates.title;
        if (updates.description !== undefined) updatePayload.description = updates.description;
        if (updates.category !== undefined) updatePayload.category = updates.category;
        if (updates.banner_url !== undefined) updatePayload.banner_url = updates.banner_url;
        if (updates.event_date !== undefined) updatePayload.event_date = updates.event_date;
        if (updates.start_time !== undefined) updatePayload.start_time = updates.start_time;
        if (updates.end_time !== undefined) updatePayload.end_time = updates.end_time;
        if (updates.venue !== undefined) updatePayload.venue = updates.venue;
        if (updates.capacity !== undefined) updatePayload.capacity = Number(updates.capacity);
        if (updates.registration_deadline !== undefined) updatePayload.registration_deadline = updates.registration_deadline;
        if (updates.status !== undefined) updatePayload.status = updates.status;
        if (updates.organizer_id !== undefined && isUuid(updates.organizer_id)) {
          updatePayload.organizer_id = updates.organizer_id;
        }

        const { data, error } = await supabase
          .from('events')
          .update(updatePayload)
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

    // Auto-notify registered participants on schedule/venue/status modifications
    if (updates.venue || updates.event_date || updates.start_time || updates.status) {
      const attendees = state.registrations.filter(r => r.event_id === id && r.registration_status === 'confirmed');
      const eventTitle = state.events[index].title;
      const details = [
        updates.venue ? `Venue: ${updates.venue}` : '',
        updates.event_date ? `Date: ${updates.event_date}` : '',
        updates.start_time ? `Time: ${updates.start_time}` : '',
        updates.status === 'cancelled' ? 'Status: Cancelled' : ''
      ].filter(Boolean).join(' • ') || 'Event details updated.';

      for (const attendee of attendees) {
        state.notifications.unshift({
          id: generateUuid(),
          user_email: attendee.participant_email.toLowerCase(),
          user_id: attendee.participant_id,
          title: `Event Update: ${eventTitle}`,
          message: `Important update for ${eventTitle}: ${details}`,
          type: 'event_update',
          read: false,
          link: '/my-tickets',
          created_at: new Date().toISOString()
        });
      }
    }

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

    const validEventUuid = isUuid(eventId);
    const validParticipantUuid = isUuid(participantId);

    if (isSupabaseConfigured() && validEventUuid) {
      try {
        const { data, error } = await supabase.rpc('register_for_event', {
          p_event_id: eventId,
          p_participant_name: trimmedName,
          p_participant_email: normalizedEmail,
          p_student_id: studentId?.trim() || null,
          p_participant_id: validParticipantUuid ? participantId : null
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
      id: generateUuid(),
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

    // Auto-create persistent in-app registration notification
    state.notifications.unshift({
      id: generateUuid(),
      user_email: normalizedEmail,
      user_id: participantId,
      title: 'Registration Confirmed!',
      message: `You are officially registered for "${event.title}". Your pass reference is ${token}.`,
      type: 'registration',
      read: false,
      link: '/my-tickets',
      created_at: new Date().toISOString()
    });

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

    const validEventUuid = isUuid(selectedEventId);
    const validCheckedInByUuid = isUuid(checkedInBy);

    if (isSupabaseConfigured() && validEventUuid) {
      try {
        const { data, error } = await supabase.rpc('verify_and_checkin_ticket', {
          p_ticket_token: cleanToken,
          p_event_id: selectedEventId,
          p_checked_in_by: validCheckedInByUuid ? checkedInBy : null
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

    // 1. Operator Authorization Check (Only Organizers & Volunteers permitted)
    if (checkedInBy) {
      const operator = state.profiles.find(p => p.id === checkedInBy);
      if (operator && operator.role === 'participant') {
        return {
          outcome: 'UNAUTHORIZED',
          success: false,
          message: 'Security Violation: Participant accounts are not permitted to check in tickets.',
          participant_name: reg.participant_name
        };
      }
    }

    // 2. Event Match Verification
    const event = state.events.find(e => e.id === selectedEventId);
    if (reg.event_id !== selectedEventId) {
      const ticketEvent = state.events.find(e => e.id === reg.event_id);
      return {
        outcome: 'WRONG_EVENT',
        success: false,
        message: `Ticket belongs to "${ticketEvent?.title || 'Another Event'}", not the currently selected check-in event.`,
        participant_name: reg.participant_name,
        ticket_event_id: reg.event_id,
        ticket_event_title: ticketEvent?.title,
        event_title: event?.title || 'Selected Event'
      };
    }

    // 3. Cancelled Registration Check
    if (reg.registration_status === 'cancelled') {
      return {
        outcome: 'REGISTRATION_CANCELLED',
        success: false,
        message: 'This registration has been cancelled and cannot be used for entry.',
        participant_name: reg.participant_name,
        ticket_token: reg.ticket_token,
        event_title: event?.title || 'Selected Event'
      };
    }

    // 4. Event Status Check
    if (event?.status === 'cancelled') {
      return {
        outcome: 'EVENT_UNAVAILABLE',
        success: false,
        message: 'The selected event has been cancelled by the organizer. Check-ins are disabled.',
        participant_name: reg.participant_name,
        event_title: event?.title || 'Selected Event'
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
        checked_in_at: existingAttendance.checked_in_at,
        event_title: event?.title || 'Selected Event'
      };
    }

    // 6. RECORD NEW ATTENDANCE ATOMICALLY
    const nowIso = new Date().toISOString();
    const newAtt: AttendanceRecord = {
      id: generateUuid(),
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
        id: generateUuid(),
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
      total_registered: totalReg,
      event_title: event?.title || 'Selected Event'
    };
  },

  // ==========================================
  // PARTICIPANT TICKETS & REGISTRATIONS
  // ==========================================
  async getMyTickets(emailOrUserId: string): Promise<Registration[]> {
    const events = await this.getEvents();
    const cleanLookup = emailOrUserId.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('registrations')
          .select(`
            *,
            events:event_id (*),
            attendance:attendance (*),
            certificates:certificates (*)
          `);

        if (isUuid(emailOrUserId)) {
          query = query.or(`participant_id.eq.${emailOrUserId},participant_email.ilike.${cleanLookup}`);
        } else {
          query = query.ilike('participant_email', cleanLookup);
        }

        const { data, error } = await query;
        if (!error && data) {
          const remoteTickets = data.map((r: any) => ({
            ...r,
            event: r.events,
            has_checked_in: Boolean(r.attendance && (Array.isArray(r.attendance) ? r.attendance.length > 0 : true)),
            checked_in_at: (Array.isArray(r.attendance) ? r.attendance[0]?.checked_in_at : r.attendance?.checked_in_at) || undefined,
            certificate_reference: (Array.isArray(r.certificates) ? r.certificates[0]?.certificate_reference : r.certificates?.certificate_reference)
          }));

          const state = getLocalState();
          const localRegs = state.registrations.filter(
            r => (r.participant_id && r.participant_id === emailOrUserId) ||
                 r.participant_email.toLowerCase() === cleanLookup
          ).map(reg => {
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

          const remoteTokens = new Set(remoteTickets.map((t: any) => t.ticket_token));
          const uniqueLocal = localRegs.filter(l => !remoteTokens.has(l.ticket_token));
          return [...remoteTickets, ...uniqueLocal];
        }
      } catch (err) {
        console.warn('Supabase getMyTickets error:', err);
      }
    }

    const state = getLocalState();

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
    if (isSupabaseConfigured() && isUuid(eventId)) {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            *,
            attendance:attendance (*),
            certificates:certificates (*)
          `)
          .eq('event_id', eventId);

        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            ...r,
            attendance: Array.isArray(r.attendance) ? r.attendance[0] : r.attendance,
            has_checked_in: Boolean(r.attendance && (Array.isArray(r.attendance) ? r.attendance.length > 0 : true)),
            checked_in_at: (Array.isArray(r.attendance) ? r.attendance[0]?.checked_in_at : r.attendance?.checked_in_at) || undefined,
            certificate: Array.isArray(r.certificates) ? r.certificates[0] : r.certificates
          }));
        }
      } catch (err) {
        console.warn('Supabase getEventAttendees error:', err);
      }
    }

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
  // EXPORT REPORTS DATA GENERATOR
  // ==========================================
  async getExportReportData(options: ReportFilterOptions): Promise<ReportItem[]> {
    const { organizerId, eventId, registrationStatus, attendanceStatus } = options;

    let allEvents: CollegeEvent[] = [];
    let allRegistrations: Registration[] = [];
    let allAttendance: AttendanceRecord[] = [];
    let allCertificates: Certificate[] = [];

    // Attempt Supabase fetch if configured
    if (isSupabaseConfigured()) {
      try {
        let eventsQuery = supabase.from('events').select('*');
        if (organizerId && isUuid(organizerId)) {
          eventsQuery = eventsQuery.eq('organizer_id', organizerId);
        }

        const [evRes, regRes, attRes, certRes] = await Promise.all([
          eventsQuery,
          supabase.from('registrations').select('*'),
          supabase.from('attendance').select('*'),
          supabase.from('certificates').select('*')
        ]);

        if (!evRes.error && evRes.data) {
          allEvents = evRes.data;
        }
        if (!regRes.error && regRes.data) {
          allRegistrations = regRes.data;
        }
        if (!attRes.error && attRes.data) {
          allAttendance = attRes.data;
        }
        if (!certRes.error && certRes.data) {
          allCertificates = certRes.data;
        }
      } catch (err) {
        console.warn('Supabase getExportReportData fallback to local:', err);
      }
    }

    // Always merge with local state
    const state = getLocalState();

    const remoteEventIds = new Set(allEvents.map(e => e.id));
    allEvents = [...allEvents, ...state.events.filter(e => !remoteEventIds.has(e.id))];

    const remoteRegTokens = new Set(allRegistrations.map(r => r.ticket_token));
    allRegistrations = [...allRegistrations, ...state.registrations.filter(r => !remoteRegTokens.has(r.ticket_token))];

    const remoteAttRegIds = new Set(allAttendance.map(a => a.registration_id));
    allAttendance = [...allAttendance, ...state.attendance.filter(a => !remoteAttRegIds.has(a.registration_id))];

    const remoteCertRegIds = new Set(allCertificates.map(c => c.registration_id));
    allCertificates = [...allCertificates, ...state.certificates.filter(c => !remoteCertRegIds.has(c.registration_id))];

    // Filter events by organizer (ownership & permission check)
    let scopedEvents = allEvents;
    if (organizerId) {
      scopedEvents = scopedEvents.filter(e => e.organizer_id === organizerId);
    }

    // Filter by specific event if specified (and not 'all')
    if (eventId && eventId !== 'all') {
      scopedEvents = scopedEvents.filter(e => e.id === eventId);
    }

    const scopedEventMap = new Map(scopedEvents.map(e => [e.id, e]));

    // Filter registrations belonging to scoped events
    let filteredRegs = allRegistrations.filter(r => scopedEventMap.has(r.event_id));

    // Filter by registration status if specified
    if (registrationStatus && registrationStatus !== 'all') {
      filteredRegs = filteredRegs.filter(r => r.registration_status === registrationStatus);
    }

    // Build deduplicated lookup maps for attendance and certificates
    const attendanceMap = new Map<string, AttendanceRecord>();
    allAttendance.forEach(a => {
      if (!attendanceMap.has(a.registration_id)) {
        attendanceMap.set(a.registration_id, a);
      }
    });

    const certificateMap = new Map<string, Certificate>();
    allCertificates.forEach(c => {
      if (!certificateMap.has(c.registration_id)) {
        certificateMap.set(c.registration_id, c);
      }
    });

    // Filter by attendance status if specified
    if (attendanceStatus && attendanceStatus !== 'all') {
      if (attendanceStatus === 'checked_in') {
        filteredRegs = filteredRegs.filter(r => attendanceMap.has(r.id));
      } else if (attendanceStatus === 'not_checked_in') {
        filteredRegs = filteredRegs.filter(r => !attendanceMap.has(r.id));
      }
    }

    // Deduplicate registrations by ID to ensure each registration appears only once
    const seenRegIds = new Set<string>();
    const uniqueRegs: Registration[] = [];
    filteredRegs.forEach(r => {
      if (!seenRegIds.has(r.id)) {
        seenRegIds.add(r.id);
        uniqueRegs.push(r);
      }
    });

    // Map to normalized ReportItem format
    const reportItems: ReportItem[] = uniqueRegs.map(reg => {
      const event = scopedEventMap.get(reg.event_id);
      const att = attendanceMap.get(reg.id);
      const cert = certificateMap.get(reg.id);

      return {
        id: reg.id,
        registration_id: reg.id,
        event_id: reg.event_id,
        event_title: event?.title || 'College Event',
        event_date: event?.event_date || '—',
        venue: event?.venue || '—',
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

    // Sort newest registration first
    return reportItems.sort(
      (a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
    );
  },

  // ==========================================
  // ORGANIZER DASHBOARD STATS
  // ==========================================
  async getDashboardStats(params?: { organizerId?: string; eventId?: string } | string): Promise<DashboardStats> {
    const filterOrganizerId = typeof params === 'string' ? params : params?.organizerId;
    const filterEventId = typeof params === 'object' ? params?.eventId : undefined;

    let allEvents: CollegeEvent[] = [];
    let allRegistrations: Registration[] = [];
    let allAttendance: AttendanceRecord[] = [];
    let allCertificates: Certificate[] = [];
    let allCertificateRequests: CertificateRequest[] = [];

    // Attempt Supabase fetch if configured
    if (isSupabaseConfigured()) {
      try {
        let eventsQuery = supabase.from('events').select(`
          *,
          profiles:organizer_id (full_name)
        `);
        if (filterOrganizerId && isUuid(filterOrganizerId)) {
          eventsQuery = eventsQuery.eq('organizer_id', filterOrganizerId);
        }

        const [evRes, regRes, attRes, certRes, reqRes] = await Promise.all([
          eventsQuery,
          supabase.from('registrations').select('*'),
          supabase.from('attendance').select('*'),
          supabase.from('certificates').select('*'),
          supabase.from('certificate_requests').select('*')
        ]);

        if (!evRes.error && evRes.data) {
          allEvents = evRes.data.map((ev: any) => ({
            id: ev.id,
            organizer_id: ev.organizer_id,
            organizer_name: ev.profiles?.full_name || 'EventEase Organizer',
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
          }));
        }

        if (!regRes.error && regRes.data) {
          allRegistrations = regRes.data;
        }

        if (!attRes.error && attRes.data) {
          allAttendance = attRes.data;
        }

        if (!certRes.error && certRes.data) {
          allCertificates = certRes.data;
        }

        if (!reqRes.error && reqRes.data) {
          allCertificateRequests = reqRes.data;
        }
      } catch (err) {
        console.warn('Supabase getDashboardStats fetch fallback to local database:', err);
      }
    }

    // Always merge with local state to ensure no offline/demo data is lost
    const state = getLocalState();

    // Merge events (avoid duplicate IDs)
    const remoteEventIds = new Set(allEvents.map(e => e.id));
    const localEventsToInclude = state.events.filter(e => !remoteEventIds.has(e.id));
    allEvents = [...allEvents, ...localEventsToInclude];

    // Merge registrations
    const remoteRegTokens = new Set(allRegistrations.map(r => r.ticket_token));
    const localRegsToInclude = state.registrations.filter(r => !remoteRegTokens.has(r.ticket_token));
    allRegistrations = [...allRegistrations, ...localRegsToInclude];

    // Merge attendance
    const remoteAttRegIds = new Set(allAttendance.map(a => a.registration_id));
    const localAttToInclude = state.attendance.filter(a => !remoteAttRegIds.has(a.registration_id));
    allAttendance = [...allAttendance, ...localAttToInclude];

    // Merge certificates
    const remoteCertRegIds = new Set(allCertificates.map(c => c.registration_id));
    const localCertsToInclude = state.certificates.filter(c => !remoteCertRegIds.has(c.registration_id));
    allCertificates = [...allCertificates, ...localCertsToInclude];

    // Merge certificate requests
    const remoteReqIds = new Set(allCertificateRequests.map(cr => cr.id));
    const localReqsToInclude = state.certificateRequests.filter(cr => !remoteReqIds.has(cr.id));
    allCertificateRequests = [...allCertificateRequests, ...localReqsToInclude];

    // Scope events by organizer if specified (security & ownership check)
    let scopedEvents = allEvents;
    if (filterOrganizerId) {
      scopedEvents = scopedEvents.filter(e => e.organizer_id === filterOrganizerId);
    }

    // Filter by specific event if requested (and not 'all')
    const isSpecificEvent = filterEventId && filterEventId !== 'all';
    let targetEvents = scopedEvents;
    if (isSpecificEvent) {
      targetEvents = scopedEvents.filter(e => e.id === filterEventId);
    }

    const targetEventIds = new Set(targetEvents.map(e => e.id));

    // Valid confirmed registrations for target events
    const targetRegistrations = allRegistrations.filter(
      r => targetEventIds.has(r.event_id) && r.registration_status === 'confirmed'
    );

    // Valid attendance for target events: count each valid registration only once
    const confirmedRegIds = new Set(targetRegistrations.map(r => r.id));
    const uniqueCheckedInRegIds = new Set(
      allAttendance
        .filter(a => targetEventIds.has(a.event_id) && confirmedRegIds.has(a.registration_id))
        .map(a => a.registration_id)
    );

    // 1. REGISTRATION STATISTICS (Calculated from actual database records)
    const totalCapacity = targetEvents.reduce((sum, e) => sum + (Number(e.capacity) || 0), 0);
    const totalRegistrations = targetRegistrations.length;
    const availableSeats = Math.max(0, totalCapacity - totalRegistrations);
    const registrationPercentage = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;

    // 2. ATTENDANCE STATISTICS (Counting each valid registration only once)
    const totalCheckins = uniqueCheckedInRegIds.size;
    const notCheckedIn = Math.max(0, totalRegistrations - totalCheckins);
    const attendancePercentage = totalRegistrations > 0 ? Math.round((totalCheckins / totalRegistrations) * 100) : 0;

    // 3. CERTIFICATE STATISTICS (Using actual certificate and request records)
    const targetCertificates = allCertificates.filter(c => targetEventIds.has(c.event_id));
    const certificatesIssued = targetCertificates.filter(
      c => c.eligibility_status === 'issued' || c.eligibility_status === 'eligible'
    ).length;

    const targetRequests = allCertificateRequests.filter(cr => targetEventIds.has(cr.event_id));
    const pendingRequests = targetRequests.filter(cr => cr.status === 'pending').length;
    const approvedRequests = targetRequests.filter(cr => cr.status === 'approved').length;
    const rejectedRequests = targetRequests.filter(cr => cr.status === 'rejected').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingEvents = targetEvents.filter(e => e.event_date >= todayStr && e.status === 'published').length;

    // 4. EVENT PERFORMANCE & CHARTS METRICS
    // Calculated across all scopedEvents so comparison charts are meaningful
    const eventPerformance: EventPerformanceMetric[] = scopedEvents.map(e => {
      const eRegs = allRegistrations.filter(r => r.event_id === e.id && r.registration_status === 'confirmed');
      const eRegIds = new Set(eRegs.map(r => r.id));
      const eAttCount = new Set(
        allAttendance.filter(a => a.event_id === e.id && eRegIds.has(a.registration_id)).map(a => a.registration_id)
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

    // Highest participation events (sorted by turnout % desc, then total checked in desc)
    const highestParticipation = [...eventPerformance].sort((a, b) => {
      if (b.attendance_rate !== a.attendance_rate) {
        return b.attendance_rate - a.attendance_rate;
      }
      return b.checked_in - a.checked_in;
    });

    // Attendance trend comparison (for Recharts BarChart)
    const attendanceTrend = eventPerformance.map(ep => ({
      event_title: ep.event_title.length > 20 ? ep.event_title.substring(0, 18) + '...' : ep.event_title,
      registered: ep.registered,
      checked_in: ep.checked_in,
      capacity: ep.capacity
    }));

    // Category Distribution (across scoped events)
    const catMap: Record<string, { count: number; registrations: number }> = {};
    scopedEvents.forEach(e => {
      if (!catMap[e.category]) catMap[e.category] = { count: 0, registrations: 0 };
      catMap[e.category].count += 1;
      const countRegs = allRegistrations.filter(r => r.event_id === e.id && r.registration_status === 'confirmed').length;
      catMap[e.category].registrations += countRegs;
    });

    const categoryDistribution = Object.keys(catMap).map(k => ({
      category: k,
      count: catMap[k].count,
      registrations: catMap[k].registrations
    }));

    // Recent registrations (newest first with joined event details & gate check-in status)
    const recentRegistrations = targetRegistrations
      .slice()
      .sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime())
      .slice(0, 10)
      .map(r => {
        const ev = allEvents.find(e => e.id === r.event_id);
        const hasCheckedIn = uniqueCheckedInRegIds.has(r.id);
        return {
          ...r,
          event: ev,
          has_checked_in: hasCheckedIn
        };
      });

    return {
      total_events: targetEvents.length,
      upcoming_events: upcomingEvents,

      // 1. Registration Statistics
      total_registrations: totalRegistrations,
      total_capacity: totalCapacity,
      available_seats: availableSeats,
      registration_percentage: registrationPercentage,

      // 2. Attendance Statistics
      total_checkins: totalCheckins,
      not_checked_in: notCheckedIn,
      attendance_percentage: attendancePercentage,
      overall_attendance_rate: attendancePercentage,

      // 3. Certificate Statistics
      certificates_issued: certificatesIssued,
      pending_certificate_requests: pendingRequests,
      approved_certificate_requests: approvedRequests,
      rejected_certificate_requests: rejectedRequests,

      // 4. Event Performance & Charts
      event_performance: eventPerformance,
      highest_participation_events: highestParticipation,
      attendance_trend: attendanceTrend,
      category_distribution: categoryDistribution,
      recent_registrations: recentRegistrations
    };
  },

  // ==========================================
  // CERTIFICATE CENTER & CREDENTIAL MANAGEMENT
  // ==========================================
  async getCertificateSettings(eventId: string): Promise<CertificateSettings | null> {
    const state = getLocalState();
    return state.certificateSettings.find(cs => cs.event_id === eventId) || null;
  },

  async saveCertificateSettings(settings: CertificateSettings, operatorRole: string = 'organizer'): Promise<CertificateSettings> {
    if (operatorRole === 'participant') {
      throw new Error('Unauthorized: Only organizers or administrators can configure certificate templates and eligibility rules.');
    }

    const state = getLocalState();
    const idx = state.certificateSettings.findIndex(cs => cs.event_id === settings.event_id);
    if (idx >= 0) {
      state.certificateSettings[idx] = {
        ...state.certificateSettings[idx],
        ...settings,
        requires_checkin: settings.eligibility_rule === 'checked_in' || settings.requires_checkin
      };
    } else {
      state.certificateSettings.push({
        ...settings,
        requires_checkin: settings.eligibility_rule === 'checked_in' || settings.requires_checkin
      });
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
        signatory_name: cs?.signatory_name || 'Dr. Rajesh Patel',
        signatory_role: cs?.signatory_role || 'Head of Organizing Committee'
      };
    });
  },

  async getAllCertificates(eventId?: string, operatorRole: string = 'organizer'): Promise<Certificate[]> {
    const state = getLocalState();
    let certs = state.certificates;
    if (eventId) {
      certs = certs.filter(c => c.event_id === eventId);
    }

    return certs.map(c => {
      const reg = state.registrations.find(r => r.id === c.registration_id);
      const ev = state.events.find(e => e.id === c.event_id);
      const cs = state.certificateSettings.find(s => s.event_id === c.event_id);

      return {
        ...c,
        event_title: ev?.title || 'College Event',
        participant_name: reg?.participant_name || 'Participant',
        event_date: ev?.event_date,
        issuing_organization: cs?.issuing_organization || 'Atmiya University',
        signatory_name: cs?.signatory_name || 'Dr. Rajesh Patel',
        signatory_role: cs?.signatory_role || 'Head of Organizing Committee'
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
      signatory_name: cs?.signatory_name || 'Dr. Rajesh Patel',
      signatory_role: cs?.signatory_role || 'Head of Organizing Committee'
    };
  },

  async generateCertificateForRegistration(params: {
    registrationId: string;
    operatorRole?: string;
    bypassEligibility?: boolean;
  }): Promise<{ success: boolean; certificate?: Certificate; message: string }> {
    const { registrationId, operatorRole, bypassEligibility = false } = params;
    const state = getLocalState();

    const reg = state.registrations.find(r => r.id === registrationId);
    if (!reg) {
      return { success: false, message: 'Registration record not found.' };
    }

    if (reg.registration_status === 'cancelled') {
      return { success: false, message: 'Cannot generate certificate for a cancelled registration.' };
    }

    const event = state.events.find(e => e.id === reg.event_id);
    const settings = state.certificateSettings.find(s => s.event_id === reg.event_id) || {
      id: generateUuid(),
      event_id: reg.event_id,
      title: 'Certificate of Excellence & Participation',
      issuing_organization: 'Atmiya University',
      signatory_name: 'Dr. Rajesh Patel',
      signatory_role: 'Head of Organizing Committee',
      requires_checkin: true,
      eligibility_rule: 'checked_in'
    };

    const rule: EligibilityRule = settings.eligibility_rule || (settings.requires_checkin ? 'checked_in' : 'registered');

    // Duplicate Prevention Check
    const existing = state.certificates.find(c => c.registration_id === reg.id);
    if (existing) {
      if (existing.eligibility_status === 'revoked') {
        if (operatorRole !== 'organizer' && operatorRole !== 'admin') {
          return {
            success: false,
            message: 'This certificate was previously revoked and can only be reissued by an authorized event organizer.',
            certificate: existing
          };
        }
      } else {
        return {
          success: true,
          message: 'Certificate is already available for this participant.',
          certificate: {
            ...existing,
            event_title: event?.title || 'College Event',
            participant_name: reg.participant_name,
            event_date: event?.event_date,
            issuing_organization: settings.issuing_organization,
            signatory_name: settings.signatory_name,
            signatory_role: settings.signatory_role
          }
        };
      }
    }

    // Eligibility Rules Verification (unless explicitly approved by organizer via early-exit review)
    if (!bypassEligibility) {
      if (rule === 'checked_in') {
        const hasAttended = state.attendance.some(a => a.registration_id === reg.id);
        if (!hasAttended) {
          return {
            success: false,
            message: 'Eligibility Incomplete: Certificate generation requires verified gate check-in attendance.'
          };
        }
      } else if (rule === 'organizer_approved') {
        const hasApprovedReq = state.certificateRequests.some(
          r => r.registration_id === reg.id && r.status === 'approved'
        );
        const isStaff = operatorRole === 'organizer' || operatorRole === 'admin';
        if (!hasApprovedReq && !isStaff) {
          return {
            success: false,
            message: 'Organizer approval is required for this certificate. Please submit an early-exit or certificate request.'
          };
        }
      }
    }

    const nowIso = new Date().toISOString();
    let cert: Certificate;

    if (existing && existing.eligibility_status === 'revoked') {
      // Reissuing existing revoked certificate
      existing.eligibility_status = 'issued';
      existing.reissued_at = nowIso;
      existing.revoked_at = undefined;
      existing.revoked_reason = undefined;
      cert = existing;
    } else {
      cert = {
        id: generateUuid(),
        registration_id: reg.id,
        event_id: reg.event_id,
        certificate_reference: generateCertReference(),
        eligibility_status: 'issued',
        issued_at: nowIso,
        created_at: nowIso,
      };
      state.certificates.push(cert);
    }

    // Auto-create persistent in-app certificate notification
    state.notifications.unshift({
      id: generateUuid(),
      user_email: reg.participant_email.toLowerCase(),
      user_id: reg.participant_id,
      title: 'Certificate Available!',
      message: `Your Certificate for "${event?.title || 'College Event'}" is ready. Verification ID: ${cert.certificate_reference}`,
      type: 'certificate',
      read: false,
      link: '/certificates',
      created_at: nowIso
    });

    saveLocalState(state);

    return {
      success: true,
      message: 'Certificate successfully generated and verified.',
      certificate: {
        ...cert,
        event_title: event?.title || 'College Event',
        participant_name: reg.participant_name,
        event_date: event?.event_date,
        issuing_organization: settings.issuing_organization,
        signatory_name: settings.signatory_name,
        signatory_role: settings.signatory_role
      }
    };
  },

  async revokeCertificate(params: {
    certificateReference: string;
    operatorRole?: string;
    reason: string;
  }): Promise<{ success: boolean; certificate?: Certificate; message: string }> {
    const { certificateReference, operatorRole = 'organizer', reason } = params;
    if (operatorRole === 'participant') {
      return { success: false, message: 'Unauthorized: Only event organizers or administrators can revoke certificates.' };
    }

    const state = getLocalState();
    const cert = state.certificates.find(
      c => c.certificate_reference.toUpperCase() === certificateReference.trim().toUpperCase()
    );

    if (!cert) {
      return { success: false, message: 'Certificate reference not found.' };
    }

    cert.eligibility_status = 'revoked';
    cert.revoked_at = new Date().toISOString();
    cert.revoked_reason = reason.trim() || 'Certificate revoked by authorized event administrator.';

    saveLocalState(state);
    return { success: true, certificate: cert, message: 'Certificate successfully revoked.' };
  },

  async reissueCertificate(params: {
    certificateReference: string;
    operatorRole?: string;
  }): Promise<{ success: boolean; certificate?: Certificate; message: string }> {
    const { certificateReference, operatorRole = 'organizer' } = params;
    if (operatorRole === 'participant') {
      return { success: false, message: 'Unauthorized: Only event organizers or administrators can reissue certificates.' };
    }

    const state = getLocalState();
    const cert = state.certificates.find(
      c => c.certificate_reference.toUpperCase() === certificateReference.trim().toUpperCase()
    );

    if (!cert) {
      return { success: false, message: 'Certificate reference not found.' };
    }

    cert.eligibility_status = 'issued';
    cert.reissued_at = new Date().toISOString();
    cert.revoked_at = undefined;
    cert.revoked_reason = undefined;

    saveLocalState(state);
    return { success: true, certificate: cert, message: 'Certificate successfully reissued.' };
  },

  // Early Exit & Certificate Requests
  async requestCertificate(params: {
    registrationId: string;
    reason: string;
    participantId?: string;
    participantName?: string;
    participantEmail?: string;
  }): Promise<{ success: boolean; request?: CertificateRequest; message: string }> {
    const { registrationId, reason, participantId, participantName, participantEmail } = params;
    const state = getLocalState();

    const reg = state.registrations.find(r => r.id === registrationId);
    if (!reg) {
      return { success: false, message: 'Registration record not found.' };
    }

    if (reg.registration_status === 'cancelled') {
      return { success: false, message: 'Cannot request certificate for a cancelled registration.' };
    }

    // Check duplicate request
    const existingReq = state.certificateRequests.find(
      r => r.registration_id === registrationId && (r.status === 'pending' || r.status === 'approved')
    );

    if (existingReq) {
      return {
        success: false,
        message: `A certificate request for this event is already ${existingReq.status.toUpperCase()}.`,
        request: existingReq
      };
    }

    const nowIso = new Date().toISOString();
    const newReq: CertificateRequest = {
      id: generateUuid(),
      registration_id: reg.id,
      event_id: reg.event_id,
      participant_id: participantId || reg.participant_id,
      participant_name: participantName || reg.participant_name,
      participant_email: participantEmail || reg.participant_email,
      student_id: reg.student_id,
      reason: reason.trim(),
      status: 'pending',
      requested_at: nowIso,
      ticket_token: reg.ticket_token
    };

    state.certificateRequests.unshift(newReq);
    saveLocalState(state);

    return {
      success: true,
      message: 'Certificate request submitted successfully! An organizer will review your early departure / eligibility.',
      request: newReq
    };
  },

  async getMyCertificateRequests(emailOrUserId: string): Promise<CertificateRequest[]> {
    const state = getLocalState();
    const cleanLookup = emailOrUserId.trim().toLowerCase();
    const userRegs = state.registrations.filter(
      r => (r.participant_id && r.participant_id === emailOrUserId) ||
           r.participant_email.toLowerCase() === cleanLookup
    );
    const userRegIds = new Set(userRegs.map(r => r.id));

    const reqs = state.certificateRequests.filter(
      r => (r.participant_id && r.participant_id === emailOrUserId) ||
           r.participant_email.toLowerCase() === cleanLookup ||
           userRegIds.has(r.registration_id)
    );

    return reqs.map(req => {
      const ev = state.events.find(e => e.id === req.event_id);
      const reg = state.registrations.find(r => r.id === req.registration_id);
      const att = state.attendance.find(a => a.registration_id === req.registration_id);
      return {
        ...req,
        event_title: ev?.title || 'College Event',
        event_date: ev?.event_date,
        ticket_token: reg?.ticket_token,
        has_checked_in: !!att
      };
    });
  },

  async getAllCertificateRequests(eventId?: string, operatorRole: string = 'organizer'): Promise<CertificateRequest[]> {
    const state = getLocalState();
    let reqs = state.certificateRequests;
    if (eventId) {
      reqs = reqs.filter(r => r.event_id === eventId);
    }

    return reqs.map(req => {
      const ev = state.events.find(e => e.id === req.event_id);
      const reg = state.registrations.find(r => r.id === req.registration_id);
      const att = state.attendance.find(a => a.registration_id === req.registration_id);
      return {
        ...req,
        event_title: ev?.title || 'College Event',
        event_date: ev?.event_date,
        ticket_token: reg?.ticket_token,
        has_checked_in: !!att
      };
    });
  },

  async reviewCertificateRequest(params: {
    requestId: string;
    decision: 'approved' | 'rejected';
    operatorRole?: string;
    reviewerId?: string;
    reviewNotes?: string;
  }): Promise<{ success: boolean; message: string; certificate?: Certificate }> {
    const { requestId, decision, operatorRole = 'organizer', reviewerId, reviewNotes } = params;
    if (operatorRole === 'participant') {
      return { success: false, message: 'Unauthorized: Only organizers or administrators can review certificate requests.' };
    }

    const state = getLocalState();
    const req = state.certificateRequests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Certificate request not found.' };
    }

    req.status = decision;
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = reviewerId;
    req.review_notes = reviewNotes;

    let cert: Certificate | undefined;
    if (decision === 'approved') {
      // Atomically generate certificate with bypassEligibility=true (WITHOUT falsely marking attendance)
      const certRes = await this.generateCertificateForRegistration({
        registrationId: req.registration_id,
        operatorRole,
        bypassEligibility: true
      });
      cert = certRes.certificate;
    }

    saveLocalState(state);
    return {
      success: true,
      message: `Certificate request ${decision.toUpperCase()} successfully.`,
      certificate: cert
    };
  },

  // Public Certificate Verification (Privacy-safe: no email, no student ID exposed)
  async verifyCertificate(reference: string): Promise<CertificateVerificationResult> {
    const cleanRef = (reference || '').trim().toUpperCase();
    if (!cleanRef) {
      return {
        status: 'invalid',
        message: 'Please provide a valid certificate verification reference ID.'
      };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('verify_certificate_credential', {
          p_reference: cleanRef
        });
        if (!error && data) {
          return data as CertificateVerificationResult;
        }
      } catch (err) {
        console.warn('Supabase RPC verify_certificate_credential fallback:', err);
      }
    }

    const state = getLocalState();
    const cert = state.certificates.find(
      c => c.certificate_reference.toUpperCase() === cleanRef
    );

    if (!cert) {
      return {
        status: 'invalid',
        message: `Certificate reference "${cleanRef}" was not found in the verified registry. Please check for typos.`
      };
    }

    const reg = state.registrations.find(r => r.id === cert.registration_id);
    const ev = state.events.find(e => e.id === cert.event_id);
    const cs = state.certificateSettings.find(s => s.event_id === cert.event_id);

    if (cert.eligibility_status === 'revoked') {
      return {
        status: 'revoked',
        message: 'This certificate was revoked by the issuing institution.',
        certificate: {
          certificate_reference: cert.certificate_reference,
          participant_name: reg?.participant_name || 'Participant',
          event_title: ev?.title || 'College Event',
          event_date: ev?.event_date,
          issuing_organization: cs?.issuing_organization || 'Atmiya University',
          signatory_name: cs?.signatory_name || 'Dr. Rajesh Patel',
          signatory_role: cs?.signatory_role || 'Head of Organizing Committee',
          issued_at: cert.issued_at,
          revoked_at: cert.revoked_at,
          revoked_reason: cert.revoked_reason,
          eligibility_status: 'revoked'
        }
      };
    }

    return {
      status: 'valid',
      message: 'Official Authentic Credential Verified.',
      certificate: {
        certificate_reference: cert.certificate_reference,
        participant_name: reg?.participant_name || 'Participant',
        event_title: ev?.title || 'College Event',
        event_date: ev?.event_date,
        issuing_organization: cs?.issuing_organization || 'Atmiya University',
        signatory_name: cs?.signatory_name || 'Dr. Rajesh Patel',
        signatory_role: cs?.signatory_role || 'Head of Organizing Committee',
        issued_at: cert.issued_at,
        eligibility_status: 'issued'
      }
    };
  },

  // ==========================================
  // IN-APP PERSISTENT NOTIFICATIONS
  // ==========================================
  async getMyNotifications(emailOrUserId: string): Promise<AppNotification[]> {
    const state = getLocalState();
    const clean = (emailOrUserId || '').trim().toLowerCase();
    return state.notifications
      .filter(n => (n.user_id && n.user_id === emailOrUserId) || n.user_email.toLowerCase() === clean)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async markNotificationAsRead(id: string): Promise<boolean> {
    const state = getLocalState();
    const n = state.notifications.find(item => item.id === id);
    if (!n) return false;
    n.read = true;
    saveLocalState(state);
    return true;
  },

  async markAllNotificationsAsRead(emailOrUserId: string): Promise<boolean> {
    const state = getLocalState();
    const clean = (emailOrUserId || '').trim().toLowerCase();
    let updated = false;
    for (const n of state.notifications) {
      if ((n.user_id && n.user_id === emailOrUserId) || n.user_email.toLowerCase() === clean) {
        if (!n.read) {
          n.read = true;
          updated = true;
        }
      }
    }
    if (updated) saveLocalState(state);
    return true;
  },

  async createNotification(notif: Omit<AppNotification, 'id' | 'created_at' | 'read'>): Promise<AppNotification> {
    const state = getLocalState();
    const created: AppNotification = {
      ...notif,
      id: generateUuid(),
      read: false,
      created_at: new Date().toISOString()
    };
    state.notifications.unshift(created);
    saveLocalState(state);
    return created;
  }
};
