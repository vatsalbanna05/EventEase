-- ==============================================================================
-- EventEase — Smart College Event Registration & Check-In System
-- Database Schema & Security Migrations (PostgreSQL + Supabase)
-- Code Carnival 3.0, Atmiya University | Problem Statement PS-03
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP EXISTING TABLES & TYPES IF ANY (Clean migration)
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.certificate_settings CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'organizer', 'volunteer', 'admin')),
    student_id TEXT,
    department TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. EVENTS TABLE
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Tech', 'Cultural', 'Workshop', 'Sports', 'Hackathon', 'Academic', 'Seminar')),
    banner_url TEXT,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    registration_deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. REGISTRATIONS TABLE
CREATE TABLE public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    student_id TEXT,
    ticket_token TEXT NOT NULL UNIQUE,
    registration_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (registration_status IN ('confirmed', 'cancelled', 'waitlisted')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Unique constraint preventing duplicate active registrations for same email on same event
    CONSTRAINT unique_active_event_registration UNIQUE (event_id, participant_email)
);

-- 6. ATTENDANCE TABLE
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. CERTIFICATE SETTINGS TABLE
CREATE TABLE public.certificate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Certificate of Participation',
    issuing_organization TEXT NOT NULL DEFAULT 'Atmiya University — Code Carnival 3.0',
    signatory_name TEXT NOT NULL DEFAULT 'Dr. Rajesh Patel',
    signatory_role TEXT NOT NULL DEFAULT 'Head of Event Organizing Committee',
    requires_checkin BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. CERTIFICATES TABLE
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    certificate_reference TEXT NOT NULL UNIQUE,
    eligibility_status TEXT NOT NULL DEFAULT 'eligible' CHECK (eligibility_status IN ('eligible', 'issued', 'revoked')),
    issued_at TIMESTAMPTZ,
    certificate_file_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. PERFORMANCE INDEXES
CREATE INDEX idx_events_date_status ON public.events (event_date, status);
CREATE INDEX idx_events_organizer ON public.events (organizer_id);
CREATE INDEX idx_registrations_event ON public.registrations (event_id);
CREATE INDEX idx_registrations_participant ON public.registrations (participant_id);
CREATE INDEX idx_registrations_token ON public.registrations (ticket_token);
CREATE INDEX idx_attendance_event ON public.attendance (event_id);
CREATE INDEX idx_attendance_registration ON public.attendance (registration_id);
CREATE INDEX idx_certificates_registration ON public.certificates (registration_id);

-- ==============================================================================
-- 10. ATOMIC RPC FUNCTIONS (CONCURRENCY SAFE & RACE-CONDITION PROOF)
-- ==============================================================================

-- A. ATOMIC REGISTRATION WITH CAPACITY LOCKING & DUPLICATE CHECKS
CREATE OR REPLACE FUNCTION public.register_for_event(
    p_event_id UUID,
    p_participant_name TEXT,
    p_participant_email TEXT,
    p_student_id TEXT DEFAULT NULL,
    p_participant_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_current_count INTEGER;
    v_normalized_email TEXT;
    v_token TEXT;
    v_registration_id UUID;
    v_new_reg RECORD;
BEGIN
    -- Normalize email to lowercase trimmed
    v_normalized_email := lower(trim(p_participant_email));

    -- Lock event row to prevent concurrent capacity overruns
    SELECT * INTO v_event
    FROM public.events
    WHERE id = p_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'EVENT_NOT_FOUND', 'message', 'Event not found');
    END IF;

    -- Verify event is published
    IF v_event.status <> 'published' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'EVENT_UNAVAILABLE', 'message', 'This event is not accepting registrations.');
    END IF;

    -- Verify registration deadline
    IF v_event.registration_deadline IS NOT NULL AND v_event.registration_deadline < timezone('utc'::text, now()) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'DEADLINE_PASSED', 'message', 'Registration deadline has passed.');
    END IF;

    -- Check for duplicate registration by email
    IF EXISTS (
        SELECT 1 FROM public.registrations
        WHERE event_id = p_event_id 
          AND lower(trim(participant_email)) = v_normalized_email
          AND registration_status = 'confirmed'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'DUPLICATE_REGISTRATION', 'message', 'You are already registered for this event with this email.');
    END IF;

    -- Count active confirmed registrations
    SELECT COUNT(*) INTO v_current_count
    FROM public.registrations
    WHERE event_id = p_event_id AND registration_status = 'confirmed';

    -- Enforce capacity limit
    IF v_current_count >= v_event.capacity THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'EVENT_FULL', 'message', 'Event capacity is full. No spots remaining.');
    END IF;

    -- Generate a unique, unpredictable ticket token (e.g. EE-A8C39F4B)
    v_token := 'EE-' || upper(encode(gen_random_bytes(6), 'hex'));

    -- Insert registration atomically
    INSERT INTO public.registrations (
        event_id,
        participant_id,
        participant_name,
        participant_email,
        student_id,
        ticket_token,
        registration_status
    )
    VALUES (
        p_event_id,
        p_participant_id,
        trim(p_participant_name),
        v_normalized_email,
        trim(p_student_id),
        v_token,
        'confirmed'
    )
    RETURNING id INTO v_registration_id;

    -- Fetch inserted record with event details
    SELECT r.*, e.title AS event_title, e.event_date, e.start_time, e.venue
    INTO v_new_reg
    FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
    WHERE r.id = v_registration_id;

    RETURN jsonb_build_object(
        'success', true,
        'registration', jsonb_build_object(
            'id', v_new_reg.id,
            'event_id', v_new_reg.event_id,
            'event_title', v_new_reg.event_title,
            'participant_name', v_new_reg.participant_name,
            'participant_email', v_new_reg.participant_email,
            'student_id', v_new_reg.student_id,
            'ticket_token', v_new_reg.ticket_token,
            'registration_status', v_new_reg.registration_status,
            'registered_at', v_new_reg.registered_at,
            'event_date', v_new_reg.event_date,
            'venue', v_new_reg.venue
        )
    );
END;
$$;


-- B. ATOMIC QR VERIFICATION & CHECK-IN (DUPLICATE PROOF & TRANSACTION SAFE)
CREATE OR REPLACE FUNCTION public.verify_and_checkin_ticket(
    p_ticket_token TEXT,
    p_event_id UUID,
    p_checked_in_by UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reg RECORD;
    v_att RECORD;
    v_event RECORD;
    v_total_reg INTEGER;
    v_total_att INTEGER;
    v_cert_ref TEXT;
BEGIN
    -- Normalize ticket token
    p_ticket_token := upper(trim(p_ticket_token));

    -- Lock and retrieve registration
    SELECT r.*, e.title AS event_title, e.status AS event_status
    INTO v_reg
    FROM public.registrations r
    JOIN public.events e ON e.id = r.event_id
    WHERE upper(r.ticket_token) = p_ticket_token
    FOR UPDATE OF r;

    -- 1. Check if ticket exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'outcome', 'INVALID_TICKET',
            'success', false,
            'message', 'No valid ticket found matching this QR code or token reference.'
        );
    END IF;

    -- 2. Check if ticket belongs to the selected event
    IF v_reg.event_id <> p_event_id THEN
        SELECT title INTO v_event FROM public.events WHERE id = v_reg.event_id;
        RETURN jsonb_build_object(
            'outcome', 'WRONG_EVENT',
            'success', false,
            'message', 'This ticket belongs to another event (' || coalesce(v_event.title, 'Different Event') || ').',
            'ticket_event_id', v_reg.event_id,
            'participant_name', v_reg.participant_name
        );
    END IF;

    -- 3. Check registration status
    IF v_reg.registration_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'outcome', 'REGISTRATION_CANCELLED',
            'success', false,
            'message', 'This registration was cancelled and cannot be used for check-in.',
            'participant_name', v_reg.participant_name
        );
    END IF;

    -- 4. Check if event is available
    IF v_reg.event_status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'outcome', 'EVENT_UNAVAILABLE',
            'success', false,
            'message', 'The event has been cancelled. Check-in is not permitted.',
            'participant_name', v_reg.participant_name
        );
    END IF;

    -- 5. Check if already checked in (DUPLICATE CHECK-IN PREVENTION)
    SELECT * INTO v_att
    FROM public.attendance
    WHERE registration_id = v_reg.id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'outcome', 'ALREADY_CHECKED_IN',
            'success', false,
            'message', 'Participant has already checked in at ' || to_char(v_att.checked_in_at, 'HH12:MI AM, DD Mon YYYY'),
            'checked_in_at', v_att.checked_in_at,
            'participant_name', v_reg.participant_name,
            'participant_email', v_reg.participant_email,
            'ticket_token', v_reg.ticket_token
        );
    END IF;

    -- 6. RECORD NEW SUCCESSFUL ATTENDANCE ATOMICALLY
    INSERT INTO public.attendance (
        registration_id,
        event_id,
        checked_in_at,
        checked_in_by
    )
    VALUES (
        v_reg.id,
        v_reg.event_id,
        timezone('utc'::text, now()),
        p_checked_in_by
    );

    -- 7. GENERATE CERTIFICATE RECORD IF ELIGIBLE
    v_cert_ref := 'CERT-' || upper(encode(gen_random_bytes(6), 'hex'));
    INSERT INTO public.certificates (
        registration_id,
        event_id,
        certificate_reference,
        eligibility_status,
        issued_at
    )
    VALUES (
        v_reg.id,
        v_reg.event_id,
        v_cert_ref,
        'eligible',
        timezone('utc'::text, now())
    )
    ON CONFLICT (registration_id) DO NOTHING;

    -- 8. FETCH UPDATED ATTENDANCE STATS
    SELECT COUNT(*) INTO v_total_reg
    FROM public.registrations
    WHERE event_id = p_event_id AND registration_status = 'confirmed';

    SELECT COUNT(*) INTO v_total_att
    FROM public.attendance
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object(
        'outcome', 'VALID_TICKET',
        'success', true,
        'message', 'Check-in successful! Welcome ' || v_reg.participant_name,
        'participant_name', v_reg.participant_name,
        'participant_email', v_reg.participant_email,
        'student_id', v_reg.student_id,
        'ticket_token', v_reg.ticket_token,
        'checked_in_at', timezone('utc'::text, now()),
        'attendance_count', v_total_att,
        'total_registered', v_total_reg
    );
END;
$$;


-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- EVENTS POLICIES
CREATE POLICY "Published events are viewable by everyone" 
ON public.events FOR SELECT USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Organizers can create events" 
ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events" 
ON public.events FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events" 
ON public.events FOR DELETE USING (auth.uid() = organizer_id);

-- REGISTRATIONS POLICIES
CREATE POLICY "Participants can view their own registrations" 
ON public.registrations FOR SELECT 
USING (
    participant_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()
    )
);

CREATE POLICY "Allow public insert via RPC or registration form"
ON public.registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Organizers can update registrations for their events" 
ON public.registrations FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()
    )
);

-- ATTENDANCE POLICIES
CREATE POLICY "Attendance viewable by organizers and attendees" 
ON public.attendance FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = attendance.event_id AND events.organizer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.registrations
        WHERE registrations.id = attendance.registration_id AND registrations.participant_id = auth.uid()
    )
);

CREATE POLICY "Volunteers and Organizers can insert attendance" 
ON public.attendance FOR INSERT WITH CHECK (true);

-- CERTIFICATE POLICIES
CREATE POLICY "Users can view their eligible certificates" 
ON public.certificates FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.registrations 
        WHERE registrations.id = certificates.registration_id AND registrations.participant_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.events 
        WHERE events.id = certificates.event_id AND events.organizer_id = auth.uid()
    )
);

-- ==============================================================================
-- 12. AUTOMATIC USER PROFILE TRIGGER ON AUTH SIGNUP
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'participant'),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
