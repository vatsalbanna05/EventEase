export type UserRole = 'participant' | 'organizer' | 'volunteer' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  student_id?: string;
  department?: string;
  avatar_url?: string;
  created_at: string;
}

export type EventCategory = 
  | 'Tech' 
  | 'Cultural' 
  | 'Workshop' 
  | 'Sports' 
  | 'Hackathon' 
  | 'Academic' 
  | 'Seminar';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface CollegeEvent {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  category: EventCategory;
  banner_url?: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  venue: string;
  capacity: number;
  registration_deadline?: string;
  status: EventStatus;
  created_at: string;
  updated_at?: string;
  // Computed fields
  registered_count?: number;
  checked_in_count?: number;
  organizer_name?: string;
  is_user_registered?: boolean;
}

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'waitlisted';

export interface Registration {
  id: string;
  event_id: string;
  participant_id?: string;
  participant_name: string;
  participant_email: string;
  student_id?: string;
  ticket_token: string; // e.g. EE-B394AF21
  registration_status: RegistrationStatus;
  registered_at: string;
  // Joined fields
  event?: CollegeEvent;
  checked_in_at?: string;
  checked_in_by?: string;
  has_checked_in?: boolean;
  certificate_reference?: string;
}

export interface AttendanceRecord {
  id: string;
  registration_id: string;
  event_id: string;
  checked_in_at: string;
  checked_in_by?: string;
  created_at: string;
  // Joined
  participant_name?: string;
  participant_email?: string;
  student_id?: string;
  ticket_token?: string;
}

export type CertificateEligibility = 'eligible' | 'issued' | 'revoked';

export interface Certificate {
  id: string;
  registration_id: string;
  event_id: string;
  certificate_reference: string;
  eligibility_status: CertificateEligibility;
  issued_at?: string;
  certificate_file_path?: string;
  created_at: string;
  // Joined
  event_title?: string;
  participant_name?: string;
  event_date?: string;
  issuing_organization?: string;
  signatory_name?: string;
  signatory_role?: string;
}

export interface CertificateSettings {
  id: string;
  event_id: string;
  title: string;
  issuing_organization: string;
  signatory_name: string;
  signatory_role: string;
  requires_checkin: boolean;
  created_at?: string;
}

export type ScanOutcome = 
  | 'VALID_TICKET'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_TICKET'
  | 'WRONG_EVENT'
  | 'REGISTRATION_CANCELLED'
  | 'EVENT_UNAVAILABLE';

export interface ScanResult {
  outcome: ScanOutcome;
  success: boolean;
  message: string;
  participant_name?: string;
  participant_email?: string;
  student_id?: string;
  ticket_token?: string;
  checked_in_at?: string;
  attendance_count?: number;
  total_registered?: number;
  ticket_event_id?: string;
  ticket_event_title?: string;
}

export interface RegistrationResult {
  success: boolean;
  error_code?: 'EVENT_NOT_FOUND' | 'EVENT_UNAVAILABLE' | 'DEADLINE_PASSED' | 'DUPLICATE_REGISTRATION' | 'EVENT_FULL' | 'DATABASE_ERROR';
  message: string;
  registration?: Registration;
}

export interface DashboardStats {
  total_events: number;
  upcoming_events: number;
  total_registrations: number;
  total_checkins: number;
  overall_attendance_rate: number;
  total_capacity: number;
  recent_registrations: Registration[];
  category_distribution: { category: string; count: number; registrations: number }[];
  attendance_trend: { event_title: string; registered: number; checked_in: number; capacity: number }[];
}
