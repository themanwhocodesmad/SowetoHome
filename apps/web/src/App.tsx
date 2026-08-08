import { Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { ThemeEffect } from './components/ThemeEffect.js';
import { HomePage } from './pages/HomePage.js';
import { PropertiesPage } from './pages/PropertiesPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { ServicesPage } from './pages/ServicesPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { PropertyDetailPage } from './pages/PropertyDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { RequireAuth, RequireRole } from './auth/RequireRole.js';
import { MyBookingsPage } from './pages/guest/MyBookingsPage.js';
import { SavedPropertiesPage } from './pages/guest/SavedPropertiesPage.js';
import { BookingDetailPage } from './pages/guest/BookingDetailPage.js';
import { HostListingsPage } from './pages/host/HostListingsPage.js';
import { CreateListingPage } from './pages/host/CreateListingPage.js';
import { EditListingPage } from './pages/host/EditListingPage.js';
import { HostBookingsPage } from './pages/host/HostBookingsPage.js';
import { AdminListingsPage } from './pages/admin/AdminListingsPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage.js';
import { AdminHomepagePage } from './pages/admin/AdminHomepagePage.js';
import { AdminPagesPage } from './pages/admin/AdminPagesPage.js';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.js';

export default function App() {
  const location = useLocation();
  // Dashboard routes (admin/host) render their own DashboardLayout sidebar/topbar shell -
  // the public marketing Navbar (with its search bar) and Footer don't belong there too.
  const isDashboardRoute =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/host');

  return (
    <>
      <ThemeEffect />
      {!isDashboardRoute && <Navbar />}
      <main className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
            path="/saved"
            element={
              <RequireAuth>
                <SavedPropertiesPage />
              </RequireAuth>
            }
          />

          <Route
            path="/host/listings"
            element={
              <RequireRole role="admin">
                <HostListingsPage />
              </RequireRole>
            }
          />
          <Route
            path="/host/listings/new"
            element={
              <RequireRole role="admin">
                <CreateListingPage />
              </RequireRole>
            }
          />
          <Route
            path="/host/listings/:id/edit"
            element={
              <RequireRole role="admin">
                <EditListingPage />
              </RequireRole>
            }
          />
          <Route
            path="/host/bookings"
            element={
              <RequireRole role="admin">
                <HostBookingsPage />
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
            path="/admin/users"
            element={
              <RequireRole role="admin">
                <AdminUsersPage />
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
            path="/admin/homepage"
            element={
              <RequireRole role="admin">
                <AdminHomepagePage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/pages"
            element={
              <RequireRole role="admin">
                <AdminPagesPage />
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
      {!isDashboardRoute && <Footer />}
    </>
  );
}
