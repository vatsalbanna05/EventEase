import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { DemoScenarioModal } from './components/common/DemoScenarioModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { QRScannerPage } from './pages/QRScannerPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { ManageEventsPage } from './pages/ManageEventsPage';
import { AttendancePage } from './pages/AttendancePage';
import { CertificateCenterPage } from './pages/CertificateCenterPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white font-sans">
            {/* Navigation Header */}
            <Navbar onOpenDemoGuide={() => setIsDemoGuideOpen(true)} />

            {/* Main Application Body */}
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage onOpenDemoGuide={() => setIsDemoGuideOpen(true)} />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:eventId" element={<EventDetailsPage />} />
                <Route path="/my-tickets" element={<MyTicketsPage />} />
                <Route path="/scanner" element={<QRScannerPage />} />
                <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
                <Route path="/organizer/create-event" element={<CreateEventPage />} />
                <Route path="/organizer/events" element={<ManageEventsPage />} />
                <Route path="/organizer/attendance" element={<AttendancePage />} />
                <Route path="/certificates" element={<CertificateCenterPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Hackathon Demo Walkthrough Modal */}
            <DemoScenarioModal
              isOpen={isDemoGuideOpen}
              onClose={() => setIsDemoGuideOpen(false)}
            />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
