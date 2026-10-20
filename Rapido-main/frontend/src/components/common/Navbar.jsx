import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Car,
  CreditCard,
  TrendingUp,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  Navigation
} from 'lucide-react';

export default function Navbar() {
  const { user, captain, role, logout, displayName, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-1">
                  RidePass <span className="text-blue-600">Pro</span>
                </span>
                <span className="text-[10px] font-bold text-teal-600 tracking-wider uppercase">
                  Smart Mobility & Passes
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive('/')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Home
              </Link>

              {role !== 'captain' && (
                <>
                  <Link
                    to="/book"
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/book')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Book Ride
                  </Link>
                  <Link
                    to="/plans"
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive('/plans')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>RidePass Plans</span>
                  </Link>
                </>
              )}

              {isAuthenticated && role === 'user' && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/dashboard')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-pass"
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/my-pass')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    My Pass
                  </Link>
                  <Link
                    to="/savings"
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive('/savings')
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Savings
                  </Link>
                </>
              )}

              {isAuthenticated && role === 'captain' && (
                <Link
                  to="/driver"
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive('/driver')
                      ? 'text-teal-700 bg-teal-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Driver Console
                </Link>
              )}

              {isAuthenticated && role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive('/admin')
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right Header Section: Display Name & User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Display Name Pill */}
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {displayName || 'User'}
                    </span>
                    <span className="text-[10px] text-blue-600 font-semibold tracking-wide uppercase">
                      {role ? role : 'PLATFORM USER'}
                    </span>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Profile & Settings"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            {isAuthenticated && displayName && (
              <span className="text-xs font-bold text-blue-600 truncate max-w-[120px]">
                {displayName.split(' ')[0]}
              </span>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Top Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1.5 shadow-lg">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>
          <Link
            to="/book"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Book a Ride
          </Link>
          <Link
            to="/plans"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            RidePass Plans
          </Link>

          {isAuthenticated ? (
            <>
              {role === 'user' && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Passenger Dashboard
                  </Link>
                  <Link
                    to="/my-pass"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    My RidePass
                  </Link>
                  <Link
                    to="/savings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Savings & Analytics
                  </Link>
                </>
              )}
              {role === 'captain' && (
                <Link
                  to="/driver"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-teal-700 hover:bg-teal-50"
                >
                  Driver Console
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50"
                >
                  Admin Portal
                </Link>
              )}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Profile & Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-slate-700 font-semibold hover:bg-slate-50 rounded-xl"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-blue-600 font-bold text-white rounded-xl shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
