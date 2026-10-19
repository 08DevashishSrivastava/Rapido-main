import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Shield, CheckCircle, LifeBuoy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/90 mt-16 pb-16 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                RidePass <span className="text-blue-600">Pro</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Smart mobility and subscription platform engineered for reliable, affordable urban commuting.
            </p>
            <div className="pt-1 text-xs text-slate-500">
              Developed by <span className="text-slate-900 font-bold">Devashish Srivastava</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link to="/book" className="hover:text-blue-600 transition-colors">Book a Ride</Link></li>
              <li><Link to="/plans" className="hover:text-blue-600 transition-colors">RidePass Plans</Link></li>
              <li><Link to="/savings" className="hover:text-blue-600 transition-colors">Savings Analytics</Link></li>
              <li><Link to="/register?role=captain" className="hover:text-blue-600 transition-colors">Drive with Us</Link></li>
            </ul>
          </div>

          {/* Security & Policies */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Trust & Safety</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-600" /> Verified Drivers</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 4-Digit OTP Verification</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-teal-600" /> Razorpay Standard Checkout</li>
              <li><span className="text-slate-500 text-[11px]">Fare Cap Policy: Pay Difference Only</span></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Support</h4>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Questions regarding pass allowances, subscriptions, or bookings? Our support desk is active.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />
              <span>Contact Support Desk</span>
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-200/90 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} RidePass Pro. Built with pride by Devashish Srivastava.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            <span className="text-emerald-700 font-semibold">API & Payment Services Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
