import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Shield, CheckCircle, Heart, LifeBuoy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">
                RidePass <span className="text-blue-500">Pro</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Smart mobility and subscription platform engineered for reliable, affordable urban commuting.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Developed by <span className="text-slate-300 font-semibold">Devashish Srivastava</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/book" className="hover:text-blue-400 transition-colors">Book a Ride</Link></li>
              <li><Link to="/plans" className="hover:text-blue-400 transition-colors">RidePass Plans</Link></li>
              <li><Link to="/savings" className="hover:text-blue-400 transition-colors">Savings Calculator</Link></li>
              <li><Link to="/driver" className="hover:text-blue-400 transition-colors">Drive with Us</Link></li>
            </ul>
          </div>

          {/* Security & Policies */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Trust & Safety</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-500" /> Verified Drivers</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> OTP Verification</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-blue-500" /> Encrypted Payments</li>
              <li><span className="text-slate-500 text-xs">Excess Fare: Pay Difference Policy</span></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Support</h4>
            <p className="text-sm text-slate-400 mb-3">
              Need assistance with your ride or RidePass subscription? Our support team is ready 24/7.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-400" />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RidePass Pro. Built with pride by Devashish Srivastava.</p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              API Services Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
