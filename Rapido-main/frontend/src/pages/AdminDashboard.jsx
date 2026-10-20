import React, { useState, useEffect } from 'react';
import { adminAPI, subscriptionAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import {
  Shield,
  Users,
  Car,
  CreditCard,
  LifeBuoy,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Plus
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, drivers, users, rides, plans, complaints
  const [metrics, setMetrics] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Plan creation modal state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planTagline, setPlanTagline] = useState('');
  const [planPrice, setPlanPrice] = useState(299);
  const [planValidity, setPlanValidity] = useState(30);
  const [planAllowance, setPlanAllowance] = useState(10);
  const [planMaxFare, setPlanMaxFare] = useState(180);
  const [planBadge, setPlanBadge] = useState('Standard');

  const loadData = async () => {
    try {
      const [overviewRes, driversRes, usersRes, ridesRes, complaintsRes, plansRes] = await Promise.all([
        adminAPI.getOverview().catch(() => ({ data: { metrics: null } })),
        adminAPI.getCaptains().catch(() => ({ data: { captains: [] } })),
        adminAPI.getUsers().catch(() => ({ data: { users: [] } })),
        adminAPI.getRides().catch(() => ({ data: { rides: [] } })),
        adminAPI.getComplaints().catch(() => ({ data: { complaints: [] } })),
        subscriptionAPI.getPlans().catch(() => ({ data: { plans: [] } }))
      ]);

      setMetrics(overviewRes.data?.metrics);
      setDrivers(driversRes.data?.captains || []);
      setUsers(usersRes.data?.users || []);
      setRides(ridesRes.data?.rides || []);
      setComplaints(complaintsRes.data?.complaints || []);
      setPlans(plansRes.data?.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyDriver = async (captainId, isApproved) => {
    setActionLoading(true);
    try {
      await adminAPI.verifyCaptain({
        captainId,
        documentsVerified: isApproved,
        status: isApproved ? 'active' : 'inactive'
      });
      setStatusMessage(`Driver status successfully updated`);
      setTimeout(() => setStatusMessage(''), 3000);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveComplaint = async (complaintId, status) => {
    setActionLoading(true);
    try {
      await adminAPI.resolveComplaint({
        complaintId,
        status,
        adminNotes: `Resolved by admin on ${new Date().toLocaleDateString()}`
      });
      setStatusMessage(`Complaint updated to ${status}`);
      setTimeout(() => setStatusMessage(''), 3000);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!planName.trim()) return;
    setActionLoading(true);
    try {
      await adminAPI.createPlan({
        name: planName.trim(),
        slug: planName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: planTagline.trim() || 'Custom mobility commuter plan',
        description: `Plan includes ${planAllowance} rides up to ₹${planMaxFare} each, valid for ${planValidity} days.`,
        price: Number(planPrice),
        currency: 'INR',
        validityDays: Number(planValidity),
        rideAllowance: Number(planAllowance),
        maxFarePerRide: Number(planMaxFare),
        allowedVehicleTypes: ['car', 'motorcycle', 'auto'],
        excessFarePolicy: 'pay_difference',
        features: [
          `${planAllowance} Rides included (up to ₹${planMaxFare} each)`,
          `Valid for ${planValidity} days across all vehicle types`,
          'Zero surge pricing',
          'Priority driver dispatch'
        ],
        badge: planBadge.trim() || 'Custom',
        isPopular: false,
        isActive: true
      });
      setStatusMessage('New subscription plan published successfully');
      setTimeout(() => setStatusMessage(''), 3000);
      setPlanModalOpen(false);
      setPlanName('');
      setPlanTagline('');
      loadData();
    } catch (err) {
      console.error(err);
      setStatusMessage(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="purple" size="sm">ADMINISTRATOR PORTAL</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            RidePass Pro <span className="text-purple-600">Back-Office</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            System health, driver document verification, ride auditing, and plan configuration.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'drivers', name: `Drivers (${drivers.length})` },
          { id: 'users', name: `Users (${users.length})` },
          { id: 'rides', name: `Rides (${rides.length})` },
          { id: 'plans', name: `Plans (${plans.length})` },
          { id: 'complaints', name: `Complaints (${complaints.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card accent="green">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</span>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">₹{metrics?.totalRevenue || 0}</span>
              <span className="text-xs text-emerald-600 block mt-1">Processed transactions</span>
            </Card>

            <Card accent="blue">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Active Subscribers</span>
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{metrics?.activeSubscriptions || 0}</span>
              <span className="text-xs text-blue-600 block mt-1">Active passes holding balance</span>
            </Card>

            <Card accent="lavender">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Total Drivers</span>
                <Car className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{metrics?.totalCaptains || 0}</span>
              <span className="text-xs text-slate-500 block mt-1">
                {metrics?.activeCaptains || 0} currently online
              </span>
            </Card>

            <Card accent="orange">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Open Support Cases</span>
                <LifeBuoy className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-3xl font-black text-slate-900">{metrics?.openComplaints || 0}</span>
              <span className="text-xs text-amber-600 block mt-1">Pending resolution</span>
            </Card>
          </div>
        </div>
      )}

      {/* Drivers Management Tab */}
      {activeTab === 'drivers' && (
        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Driver Registry & Document Verification</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vehicle Specs</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {d.fullname?.firstname} {d.fullname?.lastname}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{d.email}</td>
                    <td className="py-3 px-4 capitalize text-slate-500">
                      {d.vehicle?.vehicleType} • {d.vehicle?.plate} ({d.vehicle?.color})
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={d.documentsVerified ? 'green' : 'yellow'} size="sm">
                        {d.documentsVerified ? 'Verified' : 'Pending Docs'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={d.status === 'active' ? 'green' : 'default'} size="sm">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant={d.documentsVerified ? 'secondary' : 'success'}
                        loading={actionLoading}
                        onClick={() => handleVerifyDriver(d._id, !d.documentsVerified)}
                      >
                        {d.documentsVerified ? 'Revoke Approval' : 'Approve Driver'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Registered Passengers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Passenger Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {u.fullname?.firstname} {u.fullname?.lastname}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'blue'} size="sm">
                        {u.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rides Tab */}
      {activeTab === 'rides' && (
        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">All Platform Rides</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Standard Fare</th>
                  <th className="py-3 px-4">Final Paid</th>
                  <th className="py-3 px-4">Pass Saved</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.map((r) => (
                  <tr key={r._id}>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-bold text-slate-900 truncate">{r.pickup}</div>
                      <div className="text-slate-500 truncate">→ {r.destination}</div>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">{r.vehicleType}</td>
                    <td className="py-3 px-4 text-slate-600">₹{r.fare}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{r.finalFare}</td>
                    <td className="py-3 px-4 text-emerald-600 font-semibold">₹{r.ridePassDiscount || 0}</td>
                    <td className="py-3 px-4">
                      <Badge variant={r.status === 'completed' ? 'green' : 'default'} size="sm">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Subscription Plans Management Tab */}
      {activeTab === 'plans' && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">RidePass Subscription Plans</h3>
              <p className="text-xs text-slate-500">Configure commuter packs, ride caps, and validity terms</p>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setPlanModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p._id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 text-base">{p.name}</span>
                    <Badge variant={p.isActive ? 'green' : 'default'} size="sm">
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{p.tagline || p.description}</p>
                  <div className="text-2xl font-black text-slate-900 pt-1">
                    ₹{p.price} <span className="text-xs font-normal text-slate-500">/ {p.validityDays} days</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Ride Allowance:</span>
                    <span className="font-bold text-emerald-700">{p.rideAllowance} rides</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fare Cap per Ride:</span>
                    <span className="font-bold text-slate-900">₹{p.maxFarePerRide}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Badge Tag:</span>
                    <span className="font-bold text-blue-600">{p.badge || 'Standard'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Publish New RidePass Plan"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Plan Name</label>
            <input
              type="text"
              required
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. RidePass Metro Elite"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Tagline / Subtitle</label>
            <input
              type="text"
              value={planTagline}
              onChange={(e) => setPlanTagline(e.target.value)}
              placeholder="e.g. Premium pass for frequent airport commuters"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Price (₹)</label>
              <input
                type="number"
                min="1"
                required
                value={planPrice}
                onChange={(e) => setPlanPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Validity (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={planValidity}
                onChange={(e) => setPlanValidity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Ride Allowance</label>
              <input
                type="number"
                min="1"
                required
                value={planAllowance}
                onChange={(e) => setPlanAllowance(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Max Fare Cap / Ride (₹)</label>
              <input
                type="number"
                min="1"
                required
                value={planMaxFare}
                onChange={(e) => setPlanMaxFare(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Badge Label</label>
            <input
              type="text"
              value={planBadge}
              onChange={(e) => setPlanBadge(e.target.value)}
              placeholder="e.g. Popular, Best Value, Executive"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPlanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={actionLoading}
            >
              Publish Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <Card>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Support Inquiries & Complaints</h3>
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No open complaints.</div>
            ) : (
              complaints.map((c) => (
                <div key={c._id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">{c.subject}</span>
                    <Badge variant={c.status === 'resolved' ? 'green' : 'yellow'} size="sm">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-slate-700">{c.description}</p>
                  <div className="flex justify-between items-center pt-2 text-slate-500">
                    <span>Category: {c.category} • Submitted by: {c.user?.email || 'User'}</span>
                    {c.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="success"
                        loading={actionLoading}
                        onClick={() => handleResolveComplaint(c._id, 'resolved')}
                      >
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
