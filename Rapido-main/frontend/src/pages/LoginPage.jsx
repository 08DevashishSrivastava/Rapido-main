import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  User,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Car,
  KeyRound,
  Mail,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'captain' ? 'captain' : 'user';
  const redirectPath = searchParams.get('redirect') || null;

  const [activeTab, setActiveTab] = useState(initialRole); // 'user' | 'captain'
  const [authMethod, setAuthMethod] = useState('otp'); // 'otp' | 'password'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { loginUser, loginCaptain, sendUserOtp, verifyUserOtp, sendCaptainOtp, verifyCaptainOtp } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRoleChange = (role) => {
    setActiveTab(role);
    setError('');
    setSuccessMessage('');
    setOtpSent(false);
    setOtpCode('');
    setDevOtpHint('');
  };

  // Step 1: Send OTP code
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      let res;
      if (activeTab === 'user') {
        res = await sendUserOtp(email.trim(), 'login');
      } else {
        res = await sendCaptainOtp(email.trim(), 'login');
      }

      setOtpSent(true);
      setCooldown(res.cooldownSeconds || 60);
      setSuccessMessage(res.message || 'Verification code sent to your email.');

      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete authentication
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (activeTab === 'user') {
        const userData = await verifyUserOtp(email.trim(), otpCode.trim(), 'login');
        if (redirectPath) {
          navigate(redirectPath);
        } else if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        await verifyCaptainOtp(email.trim(), otpCode.trim(), 'login');
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate('/driver');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Password Login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'user') {
        const userData = await loginUser(email.trim(), password);
        if (redirectPath) {
          navigate(redirectPath);
        } else if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        await loginCaptain(email.trim(), password);
        if (redirectPath) {
          navigate(redirectPath);
        } else {
          navigate('/driver');
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 md:py-12 bg-slate-50">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Left Side: Brand Visual & Value Proposition */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-sky-600 to-teal-500 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                RidePass <span className="text-teal-200">Pro</span>
              </span>
            </Link>

            <div className="space-y-2 pt-4">
              <span className="text-[11px] font-bold text-teal-200 uppercase tracking-widest block">
                Next-Gen Urban Commuting
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                One account for rides, passes & driver earnings.
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Log in to book rides at flat allowances, manage your active passes, or access driver consoles.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3 pt-4 text-xs text-blue-50">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
                </div>
                <span>100% Background-Verified Drivers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span>Zero Peak-Hour Surges on Active Passes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                </div>
                <span>Instant 6-Digit Passwordless OTP Login</span>
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="pt-8 relative z-10 border-t border-white/20 mt-8">
            <div className="flex items-center justify-between text-xs text-blue-100">
              <span>Security Guarantee</span>
              <span className="font-semibold text-teal-100">256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sign in to your account
              </h1>
              <Badge variant={activeTab === 'captain' ? 'green' : 'blue'} size="sm">
                {activeTab === 'captain' ? 'Driver Partner' : 'Passenger'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Enter your email to verify with a one-time code or password.
            </p>
          </div>

          {/* Role Toggle Switch */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border border-slate-200 rounded-2xl">
            <button
              type="button"
              onClick={() => handleRoleChange('user')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'user'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Passenger / User</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('captain')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'captain'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Driver / Captain</span>
            </button>
          </div>

          {/* Auth Method Tabs: OTP vs Password */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setAuthMethod('otp'); setError(''); }}
              className={`pb-1 px-1 transition-colors cursor-pointer ${
                authMethod === 'otp'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Instant OTP Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('password'); setError(''); }}
              className={`pb-1 px-1 transition-colors cursor-pointer ${
                authMethod === 'password'
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Password Login
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Dev OTP Helper Banner in Development Mode */}
          {devOtpHint && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-300 rounded-2xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Development Mode OTP Code
                </span>
                <span className="text-[10px] bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Dev Only
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600">Your generated 6-digit test code is:</span>
                <span className="font-mono font-black text-sm text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                  {devOtpHint}
                </span>
              </div>
            </div>
          )}

          {/* Form 1: OTP Authentication Flow */}
          {authMethod === 'otp' && (
            <div>
              {!otpSent ? (
                /* Step A: Request OTP */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full mt-2"
                  >
                    Send 6-Digit Verification Code
                  </Button>
                </form>
              ) : (
                /* Step B: Verify OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-slate-700">Enter 6-Digit OTP</label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Change Email ({email})
                      </button>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-xl font-bold tracking-[0.35em] text-center text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Didn't receive code?</span>
                    {cooldown > 0 ? (
                      <span className="text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> Resend in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full mt-2"
                  >
                    Verify & Sign In as {activeTab === 'user' ? 'Passenger' : 'Driver'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Form 2: Password Authentication Flow */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full mt-2"
              >
                Sign In as {activeTab === 'user' ? 'Passenger' : 'Driver'}
              </Button>
            </form>
          )}

          {/* Footer note & register link */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Don't have an account yet?{' '}
              <Link
                to={`/register?role=${activeTab}`}
                className="text-blue-600 hover:text-blue-700 font-bold"
              >
                Create new {activeTab === 'user' ? 'passenger' : 'driver'} account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
