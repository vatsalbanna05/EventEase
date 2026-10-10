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
  revoked_at?: string;
  revoked_reason?: string;
  reissued_at?: string;
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

export type EligibilityRule = 'checked_in' | 'registered' | 'organizer_approved';

export interface CertificateSettings {
  id: string;
  event_id: string;
  title: string;
  issuing_organization: string;
  signatory_name: string;
  signatory_role: string;
  requires_checkin: boolean;
  eligibility_rule?: EligibilityRule;
  created_at?: string;
}

export type CertificateRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CertificateRequest {
  id: string;
  registration_id: string;
  event_id: string;
  participant_id?: string;
  participant_name: string;
  participant_email: string;
  student_id?: string;
  reason: string;
  status: CertificateRequestStatus;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  // Joined
  event_title?: string;
  event_date?: string;
  ticket_token?: string;
  has_checked_in?: boolean;
}

export interface CertificateVerificationResult {
  status: 'valid' | 'revoked' | 'invalid';
  message: string;
  certificate?: {
    certificate_reference: string;
    participant_name: string;
    event_title: string;
    event_date?: string;
    issuing_organization: string;
    signatory_name: string;
    signatory_role: string;
    issued_at?: string;
    revoked_at?: string;
    revoked_reason?: string;
    eligibility_status: CertificateEligibility;
  };
}

export type ScanOutcome = 
  | 'VALID_TICKET'
  | 'ALREADY_CHECKED_IN'
  | 'INVALID_TICKET'
  | 'WRONG_EVENT'
  | 'REGISTRATION_CANCELLED'
  | 'EVENT_UNAVAILABLE'
  | 'UNAUTHORIZED';

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
  event_title?: string;
  ticket_event_id?: string;
  ticket_event_title?: string;
}

export interface RegistrationResult {
  success: boolean;
  error_code?: 'EVENT_NOT_FOUND' | 'EVENT_UNAVAILABLE' | 'DEADLINE_PASSED' | 'DUPLICATE_REGISTRATION' | 'EVENT_FULL' | 'DATABASE_ERROR';
  message: string;
  registration?: Registration;
}

export interface EventPerformanceMetric {
  event_id: string;
  event_title: string;
  category: EventCategory;
  capacity: number;
  registered: number;
  checked_in: number;
  not_checked_in: number;
  available_seats: number;
  registration_rate: number;
  attendance_rate: number;
}

export interface DashboardStats {
  total_events: number;
  upcoming_events: number;

  // 1. Registration Statistics
  total_registrations: number;
  total_capacity: number;
  available_seats: number;
  registration_percentage: number;

  // 2. Attendance Statistics
  total_checkins: number;
  not_checked_in: number;
  attendance_percentage: number;
  overall_attendance_rate: number;

  // 3. Certificate Statistics
  certificates_issued: number;
  pending_certificate_requests: number;
  approved_certificate_requests: number;
  rejected_certificate_requests: number;

  // 4. Event Performance Charts & Breakdown
  event_performance: EventPerformanceMetric[];
  highest_participation_events: EventPerformanceMetric[];
  category_distribution: { category: string; count: number; registrations: number }[];
  attendance_trend: { event_title: string; registered: number; checked_in: number; capacity: number }[];
  recent_registrations: Registration[];
}

export type ReportType = 'participant' | 'attendance' | 'certificate';

export interface ReportFilterOptions {
  organizerId?: string;
  eventId?: string;
  registrationStatus?: 'all' | 'confirmed' | 'cancelled' | 'waitlisted';
  attendanceStatus?: 'all' | 'checked_in' | 'not_checked_in';
  reportType: ReportType;
}

export interface ReportItem {
  id: string;
  registration_id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  venue?: string;
  participant_name: string;
  participant_email: string;
  student_id?: string;
  ticket_token: string;
  registration_status: RegistrationStatus;
  registered_at: string;
  has_checked_in: boolean;
  checked_in_at?: string;
  certificate_reference?: string;
  certificate_status?: string;
  certificate_issued_at?: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================
export type NotificationType = 'registration' | 'event_update' | 'certificate' | 'system';

export interface AppNotification {
  id: string;
  user_email: string;
  user_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  created_at: string;
}



