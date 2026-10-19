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
  Percent,
  Clock,
  Navigation
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
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Ride-Hailing & Subscription Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Smart Ride Booking with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
              RidePass Pro Subscriptions
            </span>
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            Eliminate surge pricing and cut your commuting expenses by up to 60%. Enjoy flat-rate allowances across bikes, autos, and cabs with verified drivers and instant OTP verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/book">
              <Button size="lg" className="w-full sm:w-auto flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                <span>Book a Ride Now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>

            <Link to="/plans">
              <Button size="lg" variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span>View RidePass Plans</span>
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex items-center justify-center gap-8 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Drivers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Zero Peak-Hour Surges</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Instant OTP Matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Preview */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          <Badge variant="blue">COMMUTER PASSES</Badge>
          <h2 className="text-3xl font-extrabold text-white">Popular RidePass Subscriptions</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Choose a plan tailored to your travel frequency. Any ride under your fare cap is 100% covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan._id}
              className={`flex flex-col justify-between relative ${
                plan.isPopular ? 'border-blue-500/50 bg-slate-900/90 glow-blue ring-1 ring-blue-500/30' : ''
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
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plan.tagline}</p>
                </div>

                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-3xl font-extrabold">₹{plan.price}</span>
                  <span className="text-xs text-slate-400">/ {plan.validityDays} days</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Included Rides:</span>
                    <span className="font-bold text-emerald-400">{plan.rideAllowance} rides</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cap per Ride:</span>
                    <span className="font-bold text-white">Up to ₹{plan.maxFarePerRide}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Excess Fare:</span>
                    <span className="text-slate-400">Pay difference only</span>
                  </div>
                </div>

                <ul className="space-y-2 pt-2 text-xs text-slate-300">
                  {plan.features?.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800">
                <Link to="/plans" className="block w-full">
                  <Button variant={plan.isPopular ? 'primary' : 'secondary'} className="w-full text-xs">
                    Get {plan.name}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <Badge variant="green">EFFORTLESS COMMUTING</Badge>
          <h2 className="text-3xl font-extrabold text-white">How RidePass Pro Works</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Three simple steps to save thousands on your monthly rides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-lg font-bold">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Subscribe to a RidePass</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Activate a 7-day or 30-day pass. Your ride allowance is loaded into your secure account ledger immediately.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-lg font-bold">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Book Any Ride</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter pickup & drop. If your fare is under your plan cap, it costs ₹0! If it exceeds the cap, you only pay the excess difference.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-lg font-bold">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Hop In with OTP</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Share your 4-digit security code with the assigned driver. Enjoy high-priority matching and zero surge fees.
            </p>
          </div>
        </div>
      </section>

      {/* Driver CTA Banner */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-900/50 via-slate-900 to-indigo-950/60 border border-blue-500/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <Badge variant="blue">BECOME A CAPTAIN</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Drive with RidePass Pro</h2>
            <p className="text-sm text-slate-300">
              Get guaranteed high-density ride requests from our active subscriber base with lower commission rates and daily payouts.
            </p>
          </div>
          <Link to="/register?role=captain">
            <Button variant="success" size="lg" className="whitespace-nowrap">
              Register as Driver
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
