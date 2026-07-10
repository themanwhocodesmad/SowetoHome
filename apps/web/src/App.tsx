import { Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { AboutPage } from './pages/AboutPage.js';
import { ServicesPage } from './pages/ServicesPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { PropertyDetailPage } from './pages/PropertyDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { BecomeHostPage } from './pages/BecomeHostPage.js';
import { RequireAuth, RequireRole } from './auth/RequireRole.js';
import { MyBookingsPage } from './pages/guest/MyBookingsPage.js';
import { BookingDetailPage } from './pages/guest/BookingDetailPage.js';
import { HostListingsPage } from './pages/host/HostListingsPage.js';
import { CreateListingPage } from './pages/host/CreateListingPage.js';
import { EditListingPage } from './pages/host/EditListingPage.js';
import { HostBookingsPage } from './pages/host/HostBookingsPage.js';
import { HostPayoutsPage } from './pages/host/HostPayoutsPage.js';
import { AdminListingsPage } from './pages/admin/AdminListingsPage.js';
import { AdminCreateListingPage } from './pages/admin/AdminCreateListingPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminPayoutsPage } from './pages/admin/AdminPayoutsPage.js';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/become-host"
            element={
              <RequireAuth>
                <BecomeHostPage />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAuth>
                <MyBookingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <RequireAuth>
                <BookingDetailPage />
              </RequireAuth>
            }
          />

          <Route
            path="/host/listings"
            element={
              <RequireRole role="host">
                <HostListingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/host/listings/new"
            element={
              <RequireRole role="host">
                <CreateListingPage />
              </RequireRole>
            }
          />
          <Route
            path="/host/listings/:id/edit"
            element={
              <RequireRole role="host">
                <EditListingPage />
              </RequireRole>
            }
          />
          <Route
            path="/host/bookings"
            element={
              <RequireRole role="host">
                <HostBookingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/host/payouts"
            element={
              <RequireRole role="host">
                <HostPayoutsPage />
              </RequireRole>
            }
          />

          <Route
            path="/admin/listings"
            element={
              <RequireRole role="admin">
                <AdminListingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/listings/new"
            element={
              <RequireRole role="admin">
                <AdminCreateListingPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole role="admin">
                <AdminUsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/payouts"
            element={
              <RequireRole role="admin">
                <AdminPayoutsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RequireRole role="admin">
                <AdminAnalyticsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireRole role="admin">
                <AdminSettingsPage />
              </RequireRole>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
