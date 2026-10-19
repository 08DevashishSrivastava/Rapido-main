import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI, rideAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Car,
  Bike,
  Sparkles,
  TrendingUp,
  Clock,
  ArrowRight,
  Shield,
  CreditCard,
  CheckCircle,
  AlertCircle,
  PlusCircle
} from 'lucide-react';

export default function PassengerDashboard() {
  const { displayName } = useAuth();
  const [activeSub, setActiveSub] = useState(null);
  const [rides, setRides] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, ridesRes, analyticsRes] = await Promise.all([
          subscriptionAPI.getActiveSubscription().catch(() => ({ data: { subscription: null } })),
          rideAPI.getUserRides().catch(() => ({ data: { rides: [] } })),
          subscriptionAPI.getSavingsAnalytics().catch(() => ({ data: { analytics: null } }))
        ]);

        setActiveSub(subRes.data?.subscription || null);
        setRides(ridesRes.data?.rides || []);
        setAnalytics(analyticsRes.data?.analytics || null);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'ongoing': return 'blue';
      case 'accepted':
      case 'arriving': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Passenger Overview</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, <span className="text-blue-400">{displayName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Track your RidePass allowance, instant booking discounts, and trip history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/book">
            <Button size="md" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span>Book a Ride</span>
            </Button>
          </Link>
          <Link to="/plans">
            <Button size="md" variant="secondary" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Explore Plans</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI & Active RidePass Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active RidePass Card */}
        <Card className="md:col-span-2 relative overflow-hidden flex flex-col justify-between" glow={!!activeSub}>
          {activeSub ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="blue" size="sm">ACTIVE SUBSCRIPTION</Badge>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {activeSub.planSnapshot?.name || 'RidePass'}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Valid Until</span>
                  <span className="text-sm font-semibold text-white">
                    {activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Allowance Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Allowance Balance:</span>
                  <span className="text-emerald-400">
                    {activeSub.remainingRides} of {activeSub.totalAllowance} rides left
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, (activeSub.remainingRides / activeSub.totalAllowance) * 100))}%`
                    }}
                  />
                </div>
              </div>

              {/* Policy Specs */}
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">Max Fare / Ride</span>
                  <span className="font-bold text-white text-sm">₹{activeSub.planSnapshot?.maxFarePerRide}</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">Covered Vehicles</span>
                  <span className="font-bold text-white text-sm capitalize">
                    {activeSub.planSnapshot?.allowedVehicleTypes?.join(', ')}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">Excess Policy</span>
                  <span className="font-bold text-emerald-400 text-sm">Pay Difference</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <Link to="/my-pass" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                  <span>Manage pass & view usage ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[11px] text-slate-500">Auto-renewal: {activeSub.autoRenew ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Active RidePass Subscription</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Unlock zero surge pricing, free rides up to your plan cap, and pay only excess fare on longer journeys.
                </p>
              </div>
              <Link to="/plans" className="inline-block pt-2">
                <Button size="sm" variant="primary">
                  Choose a RidePass Plan
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Savings Metric Card */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Savings</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>

            <div>
              <span className="text-3xl font-extrabold text-white">
                ₹{analytics ? analytics.netSavings : 0}
              </span>
              <span className="text-xs text-emerald-400 block mt-1 font-medium">
                Net savings after pass costs
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Pass Rides Taken:</span>
                <span className="text-white font-medium">{analytics ? analytics.totalPassRidesTaken : 0} rides</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gross Discounts:</span>
                <span className="text-emerald-400 font-medium">₹{analytics ? analytics.totalRidePassDiscount : 0}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
            <Link to="/savings" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-between">
              <span>View complete analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Trips Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Rides</h3>
            <p className="text-xs text-slate-400">Your latest bookings and pass usage</p>
          </div>
          <Link to="/book">
            <Button size="sm" variant="outline">
              New Booking
            </Button>
          </Link>
        </div>

        {rides.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Car className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No rides booked yet.</p>
            <Link to="/book">
              <Button size="sm">Book Your First Ride</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Standard Fare</th>
                  <th className="py-3 px-4">RidePass Saved</th>
                  <th className="py-3 px-4">Final Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {rides.slice(0, 5).map((r) => (
                  <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-semibold text-white truncate">{r.pickup}</div>
                      <div className="text-slate-400 truncate">→ {r.destination}</div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-300">
                      {r.vehicleType}
                    </td>
                    <td className="py-3 px-4 text-slate-300">₹{r.fare}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">
                      {r.ridePassDiscount > 0 ? `₹${r.ridePassDiscount}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ₹{r.finalFare}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
