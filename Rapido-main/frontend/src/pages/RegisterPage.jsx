import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { User, Shield, AlertCircle, Car, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'captain' ? 'captain' : 'user';

  const [activeTab, setActiveTab] = useState(initialRole);
  const [firstname, setFirstname] = useState('Devashish');
  const [lastname, setLastname] = useState('Srivastava');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Captain vehicle details
  const [vehicleColor, setVehicleColor] = useState('Electric Blue');
  const [vehiclePlate, setVehiclePlate] = useState('DL 01 RP 2026');
  const [vehicleCapacity, setVehicleCapacity] = useState(4);
  const [vehicleType, setVehicleType] = useState('car');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { registerUser, registerCaptain } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'user') {
        await registerUser(firstname, lastname, email, password);
        navigate('/dashboard');
      } else {
        await registerCaptain({
          fullname: { firstname, lastname },
          email,
          password,
          vehicle: {
            color: vehicleColor,
            plate: vehiclePlate,
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

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mb-2">
            <Car className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-500">
            Join the smart transportation revolution with RidePass Pro
          </p>
        </div>

        {/* Role Toggle Switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => { setActiveTab('user'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'user'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Passenger Account</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('captain'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'captain'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Driver / Captain</span>
          </button>
        </div>

        <Card glow={true}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">First Name</label>
                <input
                  type="text"
                  required
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  placeholder="Devashish"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Last Name</label>
                <input
                  type="text"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  placeholder="Srivastava"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
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

            {/* Captain specific fields */}
            {activeTab === 'captain' && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Vehicle Registration Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Vehicle Category</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => {
                        setVehicleType(e.target.value);
                        if (e.target.value === 'motorcycle') setVehicleCapacity(1);
                        else if (e.target.value === 'auto') setVehicleCapacity(3);
                        else setVehicleCapacity(4);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 focus:outline-none"
                    >
                      <option value="car">Car (Prime / Sedan / Hatch)</option>
                      <option value="auto">Auto Rickshaw</option>
                      <option value="motorcycle">Motorcycle / Bike</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Seating Capacity</label>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      required
                      value={vehicleCapacity}
                      onChange={(e) => setVehicleCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Vehicle Color</label>
                    <input
                      type="text"
                      required
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="e.g. White, Silver"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">License Plate Number</label>
                    <input
                      type="text"
                      required
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="e.g. DL 01 AB 1234"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-blue-500 rounded-xl text-sm text-slate-900 focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-4"
            >
              Complete {activeTab === 'user' ? 'Passenger' : 'Driver'} Registration
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                to={`/login?role=${activeTab}`}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
