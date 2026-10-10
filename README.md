# EventEase — Smart College Event Registration & Check-In System

> **Code Carnival 3.0 • Atmiya University | Problem Statement PS-03**  
> *A centralized, modern, full-stack college event registration, dynamic QR ticketing, anti-duplicate gate check-in, and live attendance analytics system.*

---

## 🌟 Overview

College event organizers traditionally struggle with fragmented Google Forms and spreadsheets, leading to duplicate entries, sluggish gate check-ins, inaccurate attendance rosters, and gate fraud.

**EventEase** solves this by delivering an enterprise-grade platform with:
- **Atomic Capacity Locks**: Guarantees concurrent sign-ups never exceed event hall capacity.
- **Dynamic Unpredictable QR Passes**: Cryptographically generated opaque ticket tokens (`EE-XXXXXXXX`) preventing credential tampering.
- **Strict Anti-Duplicate Gate Verification**: Server-side transactional locks (`SELECT ... FOR UPDATE` & unique constraints) that reject duplicate scans instantly.
- **Real-Time Attendance Analytics**: Dynamic Recharts visualizations comparing confirmed registrations vs gate check-ins.
- **Verifiable Academic Certificate Studio**: Instant high-resolution participation certificates with university seals and verification references.

---

## 🚀 Key Features

| Feature Area | Capabilities |
| :--- | :--- |
| **Landing & Discovery** | University branding, hero showcase, live event feed, and category filtering. |
| **Authentication & RBAC** | Role-based permissions (`Participant`, `Organizer`, `Volunteer`, `Admin`) with Supabase Auth & Demo Switcher. |
| **Smart Event Management** | Event publishing, date/time scheduling, banner presets, venue assignment, and strict capacity limits. |
| **Dynamic QR Ticketing** | High-contrast QR codes, client PDF export (`jsPDF` + `html2canvas`), print passes, and status badges. |
| **Gate Check-In Scanner** | Camera-based scanner (`html5-qrcode`) with laser visual feedback and manual code fallback. |
| **Anti-Duplicate Engine** | Handles all 6 scan outcomes: `VALID_TICKET`, `ALREADY_CHECKED_IN`, `INVALID_TICKET`, `WRONG_EVENT`, `REGISTRATION_CANCELLED`, `EVENT_UNAVAILABLE`. |
| **Organizer Analytics** | KPI cards, turnout rates, attendance trend bar charts, and category breakdown. |
| **Attendance Roster & Export** | Searchable attendee roster with gate timestamps and 1-click CSV export for university records. |
| **Certificate Center** | Customizable certificate template studio and participant certificate vault with PDF download. |

---

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Backend & Database**: Supabase (PostgreSQL with Row-Level Security & Atomic RPC Functions)
- **QR Generation**: `qrcode.react`
- **QR Scanning**: `html5-qrcode`
- **Charts & Data Viz**: `recharts`
- **PDF & Certificate Generation**: `jspdf` & `html2canvas`
- **Celebration Effects**: `canvas-confetti`

---

## 📁 Project Architecture

```
EventEase/
├── public/
│   └── favicon.svg               # SVG application icon
├── src/
│   ├── components/
│   │   ├── certificates/         # Certificate preview & PDF download
│   │   ├── common/               # Navbar, Footer, DemoScenarioModal
│   │   ├── events/               # EventCard, RegistrationModal
│   │   ├── scanner/              # QRCameraScanner, ScanResultAlert
│   │   └── tickets/              # TicketCard with QR rendering
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth state, Supabase listener, Role switching
│   │   └── ToastContext.tsx      # Floating toast notifications
│   ├── pages/
│   │   ├── LandingPage.tsx       # Public homepage with PS-03 problem statement
│   │   ├── AuthPage.tsx          # Sign In, Sign Up & 1-click demo logins
│   │   ├── EventsPage.tsx        # Event catalog with search & category filters
│   │   ├── EventDetailsPage.tsx  # Full event overview & registration modal
│   │   ├── MyTicketsPage.tsx     # Participant digital QR pass vault
│   │   ├── QRScannerPage.tsx     # Gate QR scanner with 6 outcome handlers
│   │   ├── OrganizerDashboardPage.tsx # Recharts metrics & analytics
│   │   ├── CreateEventPage.tsx   # Event creator with capacity locking
│   │   ├── ManageEventsPage.tsx  # Organizer event management & CSV export
│   │   ├── AttendancePage.tsx    # Live attendance roster & manual check-in
│   │   ├── CertificateCenterPage.tsx # Certificate designer & download center
│   │   └── ProfilePage.tsx       # User account details & history
│   ├── services/
│   │   ├── db.ts                 # Unified DB provider (Supabase RPC + Local DB Engine)
│   │   └── supabase.ts           # Supabase client initializer
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces and types
│   ├── App.tsx                   # Routing and root providers
│   ├── index.css                 # Tailwind CSS v4 styles & animations
│   └── main.tsx                  # Application entry point
├── supabase/
│   └── schema.sql                # Complete PostgreSQL migration with atomic RPCs & RLS
├── tests/
│   └── test_eventease.js         # Automated business logic & security test suite
├── .env.example                  # Environment configuration template
├── package.json
└── vite.config.ts
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone or navigate to the project directory
cd EventEase

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser to launch EventEase.

---

## 🗄️ Database Setup (Supabase PostgreSQL)

EventEase operates in **Dual Mode**:
1. **Instant Demo Database (Default)**: Runs seamlessly out of the box with zero configuration for testing and live hackathon judging.
2. **Live Supabase PostgreSQL**: Fully integrated when credentials are configured.

### Connecting Real Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. In Supabase Dashboard, open **SQL Editor** and paste the entire content of [`supabase/schema.sql`](./supabase/schema.sql), then click **Run**.
3. Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```
4. Restart the development server (`npm run dev`).

---

## 🏆 Hackathon Demonstration Workflow

Follow this exact scenario designed for Code Carnival 3.0 PS-03 evaluators:

1. **Step 1: Inspect Event Capacity**
   - Click **"Explore Events"** and view **"Code Carnival Demo Event"** configured with capacity: **3**.
2. **Step 2: Register Rahul Patel**
   - Click **"Register"**, fill in `Rahul Patel` (`rahul.patel@atmiya.edu`, `AU2024-CS-042`), and submit.
   - Observe celebratory confetti and instant token generation (e.g. `EE-9B41F0C2`).
3. **Step 3: View & Download QR Ticket**
   - Click **"View in My Tickets"** to inspect Rahul's digital QR pass.
   - Click **"Download Pass (PDF)"** to verify crisp PDF generation.
4. **Step 4: Scan 1 (Entry Gate Check-In)**
   - Click **"QR Check-In Scanner"** in the navigation bar.
   - Select **"Code Carnival Demo Event"**.
   - Click **"Test Rahul Patel Ticket"** in the Jury Verification box (or scan via camera).
   - **Outcome**: `VALID TICKET — CHECK-IN SUCCESSFUL` (Green banner, attendance increments to **1 / 3**).
5. **Step 5: Scan 2 (Simulate Duplicate Fraud Attempt)**
   - Click **"Test Rahul Patel Ticket"** a second time.
   - **Outcome**: `DUPLICATE ENTRY REJECTED — ALREADY CHECKED IN` (Amber warning banner with original check-in timestamp).
6. **Step 6: Verify Attendance Count Integrity**
   - Check the live attendance counter: Attendance remains exactly **1**, demonstrating server-side duplicate immunity.
7. **Step 7: Live Organizer Analytics & Certificates**
   - Navigate to **"Dashboard"** to inspect updated Recharts trends and turnout metrics.
   - Navigate to **"Attendance"** to see Rahul's check-in timestamp and click **"Export CSV"**.
   - Navigate to **"Certificates"** to view and download Rahul's official participation certificate.

---

## 🧪 Automated Testing

To run the automated security, business logic, analytics, reports, and notification verification suite:
```bash
node tests/test_eventease.js
```

### Test Results:
```
===============================================================
EVENT-EASE TEST SUITE: Code Carnival 3.0 (Problem Statement PS-03)
===============================================================
[PASS] 1-18.  Core Workflow (Creation, Capacity, Anti-Duplicate Registration & Scan)
[PASS] 19-32. Digital Certificate Lifecycle (Eligibility, Requests, Revoke/Reissue & Verification)
[PASS] 33-42. Live Analytics Dashboard (KPIs, Charts, Zero-Capacity Safety & Telemetry)
[PASS] 43-52. Multi-Format Export Reports (CSV RFC 4180 BOM, PDF, Filters, Deduplication)
[PASS] 53-57. In-App Notifications (Registration, Updates, Privacy, Read Status)
===============================================================
TOTAL TESTS: 57 | PASSED: 57 | FAILED: 0
===============================================================
```

---

## 🔒 Security & Concurrency Design

- **Row Level Security (RLS)**: Enforced across `profiles`, `events`, `registrations`, `attendance`, and `certificates`.
- **Atomic Concurrency Protection**: Database stored procedures utilize `SELECT ... FOR UPDATE` row locks to prevent simultaneous race conditions from overbooking capacity or double-checking in tickets.
- **Zero Sensitive Data in QR**: Pass QR codes contain only opaque references (`EE-XXXXXXXX`). Private student details are resolved server-side.
- **Service-Role Safety**: Never exposes Supabase master/service-role credentials to the client.

---

## 📜 License & Hackathon Credits

Developed for **Code Carnival 3.0** at **Atmiya University** under **Problem Statement PS-03**.
All rights reserved © 2025 EventEase.
