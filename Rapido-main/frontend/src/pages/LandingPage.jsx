import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
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
  CreditCard
} from 'lucide-react';

export default function LandingPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionAPI.getPlans()
      .then(res => setPlans(res.data.plans || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 md:space-y-24 pb-12">
      {/* Hero Section */}
      <section className="relative pt-8 md:pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Next-Gen Smart Mobility & Subscription Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Smart Ride Booking with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600">
              RidePass Pro Subscriptions
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Eliminate surge pricing and cut your commuting expenses by up to 60%. Enjoy flat-rate allowances across bikes, autos, and cabs with verified drivers and instant OTP verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/book" className="w-full sm:w-auto">
              <Button size="lg" variant="primary" className="w-full sm:w-auto flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                <span>Book a Ride Now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            <Link to="/plans" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>View RidePass Plans</span>
              </Button>
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-slate-600 font-semibold">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>100% Verified Drivers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Zero Peak-Hour Surges</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>4-Digit OTP Security</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Razorpay Standard Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Preview */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <Badge variant="blue">COMMUTER PASSES</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Popular RidePass Subscriptions
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
            Choose a plan tailored to your travel frequency. Rides under your fare cap are 100% covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((plan, idx) => {
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
                      className="w-full text-xs"
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

      {/* How It Works */}
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
          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto text-base font-black">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Subscribe via Razorpay</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose a 7-day or 30-day commuter pass. Your ride allowance is loaded into your secure account ledger immediately.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center mx-auto text-base font-black">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Book Any Vehicle</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter pickup & drop. If your fare is under your plan cap, it costs ₹0! If it exceeds the cap, you only pay the excess difference.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm hover:shadow-md transition-shadow">
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

      {/* Driver CTA Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 via-teal-50 to-emerald-50 border border-blue-200 rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <Badge variant="orange">BECOME A CAPTAIN</Badge>
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
