import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscriptionAPI, rideAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Car,
  Bike,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Clock,
  Navigation,
  CreditCard,
  MapPin,
  Calendar,
  ShieldCheck,
  Percent,
  CheckCircle2,
  ChevronRight,
  HelpCircle
} from 'lucide-react';

const POPULAR_DESTINATIONS = [
  'Connaught Place, New Delhi',
  'Indira Gandhi International Airport (DEL)',
  'Cyber Hub, DLF Phase 2, Gurugram',
  'Electronic City, Noida Sector 62'
];

export default function LandingPage() {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Quick Booking Card states
  const [scheduleType, setScheduleType] = useState('now'); // 'now' | 'later'
  const [scheduleTime, setScheduleTime] = useState('');
  const [pickup, setPickup] = useState('Connaught Place, New Delhi');
  const [destination, setDestination] = useState('Indira Gandhi International Airport (DEL)');
  const [selectedVehicle, setSelectedVehicle] = useState('car');
  const [liveEstimates, setLiveEstimates] = useState(null);
  const [estimating, setEstimating] = useState(false);

  const navigate = useNavigate();

  // Load plans
  useEffect(() => {
    subscriptionAPI.getPlans()
      .then((res) => setPlans(res.data.plans || []))
      .catch((err) => console.error(err))
      .finally(() => setLoadingPlans(false));
  }, []);

  // Fetch quick estimates for hero widget
  useEffect(() => {
    if (!pickup.trim() || !destination.trim()) return;
    setEstimating(true);
    rideAPI.getFareEstimates(pickup.trim(), destination.trim())
      .then((res) => setLiveEstimates(res.data))
      .catch(() => {})
      .finally(() => setEstimating(false));
  }, [pickup, destination]);

  const handleStartBooking = (e) => {
    e.preventDefault();
    const query = new URLSearchParams({
      pickup: pickup.trim(),
      destination: destination.trim(),
      vehicle: selectedVehicle,
      schedule: scheduleType,
      ...(scheduleTime ? { time: scheduleTime } : {})
    }).toString();

    navigate(`/book?${query}`);
  };

  return (
    <div className="space-y-16 md:space-y-24 pb-16 bg-slate-50">
      {/* 1. HERO SECTION WITH PROMINENT BOOKING WIDGET */}
      <section className="relative pt-6 sm:pt-10 md:pt-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline & Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>India's Smartest Mobility & RidePass Subscription Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Effortless Urban Commuting with <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-600 to-teal-600">
                Zero Peak Surges.
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Book on-demand cabs, autos, and bikes across Delhi NCR. Save up to 60% on daily travel with pre-loaded RidePass flat-rate allowances and instant OTP driver verification.
            </p>

            {/* Quick Metrics Bar */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-blue-600 block">3 Min</span>
                <span className="text-[11px] text-slate-500 font-semibold">Average Pickup Dispatch</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-teal-600 block">₹0 Surge</span>
                <span className="text-[11px] text-slate-500 font-semibold">Immune to Surge Spikes</span>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 block">100%</span>
                <span className="text-[11px] text-slate-500 font-semibold">Verified Safe Drivers</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/plans">
                <Button variant="outline" size="md" className="flex items-center gap-1.5 font-bold">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>Explore RidePass Plans</span>
                </Button>
              </Link>
              <Link to="/register?role=captain">
                <span className="text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                  <span>Drive & earn with RidePass Pro</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </span>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Quick Booking Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/60 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Book or Schedule a Ride
                  </h3>
                </div>
                <Badge variant="blue" size="sm">Instant Fare</Badge>
              </div>

              {/* Pickup Now vs Schedule for Later Toggle */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-xl mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setScheduleType('now')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    scheduleType === 'now'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Pickup Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('later')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    scheduleType === 'later'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Later</span>
                </button>
              </div>

              {/* Schedule time input if later */}
              {scheduleType === 'later' && (
                <div className="mb-4 p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-1">
                  <label className="text-[11px] font-bold text-blue-900 block">Select Desired Pickup Time</label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Location inputs */}
              <form onSubmit={handleStartBooking} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pickup Point</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Destination Drop</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Popular Route Shortcuts */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {POPULAR_DESTINATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDestination(loc)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-[10px] text-slate-700 transition-colors cursor-pointer"
                    >
                      {loc.split(',')[0]}
                    </button>
                  ))}
                </div>

                {/* Vehicle Choice Cards */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Select Vehicle Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'motorcycle', name: 'Bike', icon: Bike },
                      { id: 'auto', name: 'Auto', icon: Car },
                      { id: 'car', name: 'Prime Cab', icon: Car }
                    ].map((v) => {
                      const Icon = v.icon;
                      const isSelected = selectedVehicle === v.id;
                      const fare = liveEstimates?.fares?.[v.id]?.finalFare;

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVehicle(v.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                          <span className="text-[11px] font-bold text-slate-900 block truncate">
                            {v.name}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700">
                            {estimating ? '...' : fare !== undefined ? `₹${fare}` : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full mt-3 font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                >
                  <span>Continue to Ride Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              <div className="mt-3 text-center">
                <span className="text-[10px] text-slate-400">
                  Includes 4-digit OTP security • Live driver GPS tracking
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. RIDE CATEGORIES SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <Badge variant="teal">MOBILITY OPTIONS</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tailored Vehicles for Every Urban Route
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
            Choose fast two-wheelers for traffic cut-throughs, iconic breezy autos, or comfortable air-conditioned cabs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <Bike className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bike Taxi</h3>
                <span className="text-xs text-amber-700 font-semibold">Fastest Solo Commute</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Zip through heavy urban choke points with sanitized helmets provided. Starting at just ₹20 base fare.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ideal for solo office sprints</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Helmet sanitized for safety</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% covered in Student Pass</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Base ₹20 + ₹8/km</span>
              <Link to="/book?vehicle=motorcycle" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Book Bike →
              </Link>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Auto Rickshaw</h3>
                <span className="text-xs text-teal-700 font-semibold">Breezy & Pocket-Friendly</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Traditional open-air city travel with metered transparency and room for up to 3 passengers.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Space for up to 3 riders</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Doorstep pickup guaranteed</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Included in Commuter Pass</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Base ₹30 + ₹11/km</span>
              <Link to="/book?vehicle=auto" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Book Auto →
              </Link>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Prime Cab</h3>
                <span className="text-xs text-blue-700 font-semibold">AC Hatchbacks & Sedans</span>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Climate-controlled, quiet rides for business meetings, airport journeys, and comfortable family travel.
                </p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 pt-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Air-conditioned comfort</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified 4-seater cars</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Zero cancellation fee window</li>
              </ul>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Base ₹50 + ₹15/km</span>
              <Link to="/book?vehicle=car" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Book Cab →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR RIDEPASS SUBSCRIPTIONS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <Badge variant="blue">SAVINGS ENGINE</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Popular RidePass Commuter Plans
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
            Subscribe once, travel multiple times. Rides under your fare cap are 100% covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((plan) => {
            const isStudent = plan.slug === 'student';
            const isMini = plan.slug === 'mini';
            const cardAccent = isStudent ? 'blue' : isMini ? 'teal' : 'lavender';

            return (
              <Card
                key={plan._id}
                accent={cardAccent}
                className={`flex flex-col justify-between relative transition-all duration-300 hover:shadow-md ${
                  plan.isPopular ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-6">
                    <Badge variant={plan.isPopular ? 'blue' : 'green'} size="sm">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">{plan.tagline || plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-3xl font-black">₹{plan.price}</span>
                    <span className="text-xs text-slate-500 font-medium">/ {plan.validityDays} days</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 space-y-2 text-xs shadow-2xs">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium">Included Rides:</span>
                      <span className="font-bold text-emerald-700">{plan.rideAllowance} rides</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium">Cap per Ride:</span>
                      <span className="font-bold text-slate-900">Up to ₹{plan.maxFarePerRide}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="font-medium">Excess Policy:</span>
                      <span className="text-teal-700 font-semibold">Pay difference only</span>
                    </div>
                  </div>

                  <ul className="space-y-2 pt-1 text-xs text-slate-700">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200">
                  <Link to="/plans" className="block w-full">
                    <Button
                      variant={plan.isPopular ? 'primary' : 'secondary'}
                      className="w-full text-xs font-bold"
                    >
                      Subscribe to {plan.name}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <Badge variant="teal">EFFORTLESS COMMUTING</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How RidePass Pro Works
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
            Three simple steps to save thousands on your daily city commute.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto text-base font-black">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Choose a RidePass</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pick a 7-day or 30-day commuter pass. Your allowance is loaded into your secure account ledger immediately.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center mx-auto text-base font-black">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Book Any Vehicle</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter pickup & destination. Rides under your plan cap cost ₹0. For longer rides, pay only the excess difference.
            </p>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto text-base font-black">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Ride with OTP Security</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Share your 4-digit security code with the assigned driver upon arrival. Enjoy verified drivers and zero peak-hour surge fees.
            </p>
          </div>
        </div>
      </section>

      {/* 5. DRIVER RECRUITMENT CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 border border-blue-200 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <Badge variant="orange">BECOME A DRIVER PARTNER</Badge>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Drive with RidePass Pro
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Get guaranteed high-density ride requests from our active subscriber base with lower commission rates and daily payouts.
            </p>
          </div>
          <Link to="/register?role=captain">
            <Button variant="teal" size="lg" className="whitespace-nowrap shadow-md">
              Register as Driver
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
