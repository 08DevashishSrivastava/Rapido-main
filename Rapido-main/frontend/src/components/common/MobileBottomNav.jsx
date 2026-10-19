import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Navigation,
  Sparkles,
  LayoutDashboard,
  User,
  Shield
} from 'lucide-react';

export default function MobileBottomNav() {
  const { role, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Determine middle dashboard link based on role
  let dashboardPath = '/dashboard';
  let dashboardLabel = 'Dashboard';
  if (role === 'captain') {
    dashboardPath = '/driver';
    dashboardLabel = 'Console';
  } else if (role === 'admin') {
    dashboardPath = '/admin';
    dashboardLabel = 'Admin';
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 md:hidden flex items-center justify-around shadow-lg">
      {/* Home */}
      <Link
        to="/"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          isActive('/') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Home</span>
      </Link>

      {/* Book Ride */}
      <Link
        to="/book"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          isActive('/book') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Navigation className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">Book</span>
      </Link>

      {/* RidePass Plans */}
      <Link
        to="/plans"
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          isActive('/plans') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Sparkles className="w-5 h-5 mb-0.5 text-teal-600" />
        <span className="text-[10px]">Passes</span>
      </Link>

      {/* Dashboard / Driver Console */}
      {isAuthenticated && (
        <Link
          to={dashboardPath}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
            isActive(dashboardPath) ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {role === 'captain' ? (
            <Shield className="w-5 h-5 mb-0.5 text-teal-600" />
          ) : (
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
          )}
          <span className="text-[10px]">{dashboardLabel}</span>
        </Link>
      )}

      {/* Profile / Login */}
      <Link
        to={isAuthenticated ? '/profile' : '/login'}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          isActive('/profile') || isActive('/login') ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <User className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">{isAuthenticated ? 'Profile' : 'Sign In'}</span>
      </Link>
    </nav>
  );
}
