import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  User,
  Shield,
  AlertCircle,
  Car,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Zap,
  Sparkles,
  KeyRound,
  Clock
} from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'captain' ? 'captain' : 'user';

  const [activeTab, setActiveTab] = useState(initialRole);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification mode for registration
  const [useOtpVerification, setUseOtpVerification] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Captain vehicle details
  const [vehicleColor, setVehicleColor] = useState('White');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState(4);
  const [vehicleType, setVehicleType] = useState('car');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { registerUser, registerCaptain, sendUserOtp, verifyUserOtp, sendCaptainOtp, verifyCaptainOtp } = useAuth();
  const navigate = useNavigate();

  // Cooldown timer
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
    setDevOtpHint('');
  };

  // Standard Password-based registration submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (firstname.trim().length < 3) {
      setError('First name must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (activeTab === 'captain' && (!vehiclePlate || vehiclePlate.trim().length < 3)) {
      setError('Vehicle plate number must be at least 3 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'user') {
        await registerUser(firstname.trim(), lastname.trim(), email.trim(), password);
        navigate('/dashboard');
      } else {
        await registerCaptain({
          fullname: { firstname: firstname.trim(), lastname: lastname.trim() },
          email: email.trim(),
          password,
          vehicle: {
            color: vehicleColor.trim() || 'White',
            plate: vehiclePlate.trim().toUpperCase(),
            capacity: Number(vehicleCapacity),
            vehicleType
          }
        });
        navigate('/driver');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please check form fields.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // OTP Step 1: Send registration OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (firstname.trim().length < 3) {
      setError('First name must be at least 3 characters long.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Valid email address is required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let res;
      if (activeTab === 'user') {
        res = await sendUserOtp(email.trim(), 'register');
      } else {
        res = await sendCaptainOtp(email.trim(), 'register');
      }

      setOtpSent(true);
      setCooldown(res.cooldownSeconds || 60);
      setSuccessMessage('Verification code sent to your email.');
      if (res.devOtp) setDevOtpHint(res.devOtp);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Step 2: Verify registration OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (activeTab === 'user') {
        await verifyUserOtp(email.trim(), otpCode.trim(), 'register', {
          firstname: firstname.trim(),
          lastname: lastname.trim()
        });
        navigate('/dashboard');
      } else {
        await verifyCaptainOtp(
          email.trim(),
          otpCode.trim(),
          'register',
          { firstname: firstname.trim(), lastname: lastname.trim() },
          {
            color: vehicleColor.trim() || 'White',
            plate: vehiclePlate.trim().toUpperCase(),
            capacity: Number(vehicleCapacity),
            vehicleType
          }
        );
        navigate('/driver');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Verification failed. Please check code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 md:py-12 bg-slate-50">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Left Side: Brand Visual */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-600 via-sky-600 to-teal-500 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
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
                Join the Platform
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                {activeTab === 'captain'
                  ? 'Drive with RidePass Pro & Earn Guaranteed Daily Revenue.'
                  : 'Start Commuting Smarter with Zero Peak Surges.'}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                {activeTab === 'captain'
                  ? 'Access steady ride requests from active RidePass subscribers with transparent earnings and immediate OTP trip start.'
                  : 'Get discounted flat-rate allowances across cabs, autos, and bikes in Delhi NCR.'}
              </p>
            </div>

            <div className="space-y-3 pt-4 text-xs text-blue-50">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-200" />
                </div>
                <span>Fast Onboarding in Under 2 Minutes</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <span>Instant Account Activation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                </div>
                <span>Automated RidePass Fare Calculation</span>
              </div>
            </div>
          </div>

          <div className="pt-8 relative z-10 border-t border-white/20 mt-8">
            <div className="flex items-center justify-between text-xs text-blue-100">
              <span>Trusted Mobility Network</span>
              <span className="font-semibold text-teal-100">Delhi NCR Region</span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Create your account
              </h1>
              <Badge variant={activeTab === 'captain' ? 'green' : 'blue'} size="sm">
                {activeTab === 'captain' ? 'Driver Partner' : 'Passenger'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Select your role and enter your details to get started.
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
              <span>Passenger Account</span>
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

          {/* Verification Mode Toggle */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setUseOtpVerification(false); setError(''); }}
              className={`pb-1 px-1 transition-colors cursor-pointer ${
                !useOtpVerification
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Password Registration
            </button>
            <button
              type="button"
              onClick={() => { setUseOtpVerification(true); setError(''); }}
              className={`pb-1 px-1 transition-colors cursor-pointer ${
                useOtpVerification
                  ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Email OTP Registration
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-800 text-xs font-medium animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {devOtpHint && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-300 rounded-2xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Development Mode Registration OTP
                </span>
                <span className="text-[10px] bg-blue-200/70 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Dev Only
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600">Your generated 6-digit code is:</span>
                <span className="font-mono font-black text-sm text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                  {devOtpHint}
                </span>
              </div>
            </div>
          )}

          {/* Form Option 1: Standard Password Registration */}
          {!useOtpVerification && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

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
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              {/* Captain vehicle fields */}
              {activeTab === 'captain' && (
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                    Vehicle Registration Specifications
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Vehicle Type</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => {
                          setVehicleType(e.target.value);
                          if (e.target.value === 'motorcycle') setVehicleCapacity(1);
                          else if (e.target.value === 'auto') setVehicleCapacity(3);
                          else setVehicleCapacity(4);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      >
                        <option value="car">Car (Prime Sedan / Hatchback)</option>
                        <option value="auto">Auto Rickshaw</option>
                        <option value="motorcycle">Motorcycle / Bike</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">License Plate</label>
                      <input
                        type="text"
                        required
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="e.g. DL 01 AB 1234"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 uppercase focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Vehicle Color</label>
                      <input
                        type="text"
                        required
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        placeholder="e.g. Silver, White"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Seating Capacity</label>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        required
                        value={vehicleCapacity}
                        onChange={(e) => setVehicleCapacity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full mt-2"
              >
                Complete {activeTab === 'user' ? 'Passenger' : 'Driver'} Registration
              </Button>
            </form>
          )}

          {/* Form Option 2: OTP Registration Flow */}
          {useOtpVerification && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">First Name</label>
                      <input
                        type="text"
                        required
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        placeholder="e.g. Priya"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Last Name</label>
                      <input
                        type="text"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        placeholder="e.g. Verma"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900"
                      />
                    </div>
                  </div>

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
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  {activeTab === 'captain' && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Plate Number</label>
                        <input
                          type="text"
                          required
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="DL01AB9999"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Vehicle Type</label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                        >
                          <option value="car">Car</option>
                          <option value="auto">Auto</option>
                          <option value="motorcycle">Bike</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    className="w-full mt-2"
                  >
                    Send OTP Verification Code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-slate-700">Enter 6-Digit Code</label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Edit Details
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-xl font-bold tracking-[0.35em] text-center text-slate-900 placeholder-slate-300"
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
                    Verify & Create Account
                  </Button>
                </form>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                to={`/login?role=${activeTab}`}
                className="text-blue-600 hover:text-blue-700 font-bold"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
