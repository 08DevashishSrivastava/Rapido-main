import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import MobileBottomNav from './components/common/MobileBottomNav';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PassengerDashboard from './pages/PassengerDashboard';
import BookRidePage from './pages/BookRidePage';
import DriverDashboard from './pages/DriverDashboard';
import RidePassPlansPage from './pages/RidePassPlansPage';
import MyRidePassPage from './pages/MyRidePassPage';
import SavingsAnalyticsPage from './pages/SavingsAnalyticsPage';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
          <Navbar />
          <main className="flex-1 pb-16 md:pb-0">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/plans" element={<RidePassPlansPage />} />
              <Route path="/book" element={<BookRidePage />} />
              <Route path="/savings" element={<SavingsAnalyticsPage />} />

              {/* Protected User Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <PassengerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-pass"
                element={
                  <ProtectedRoute allowedRoles={['user', 'admin']}>
                    <MyRidePassPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Driver Routes */}
              <Route
                path="/driver"
                element={
                  <ProtectedRoute allowedRoles={['captain']}>
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'user']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Shared Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
          <MobileBottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}
