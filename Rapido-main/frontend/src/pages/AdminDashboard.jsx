import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
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
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, drivers, users, rides, plans, complaints
  const [metrics, setMetrics] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = async () => {
    try {
      const [overviewRes, driversRes, usersRes, ridesRes, complaintsRes] = await Promise.all([
        adminAPI.getOverview().catch(() => ({ data: { metrics: null } })),
        adminAPI.getCaptains().catch(() => ({ data: { captains: [] } })),
        adminAPI.getUsers().catch(() => ({ data: { users: [] } })),
        adminAPI.getRides().catch(() => ({ data: { rides: [] } })),
        adminAPI.getComplaints().catch(() => ({ data: { complaints: [] } }))
      ]);

      setMetrics(overviewRes.data?.metrics);
      setDrivers(driversRes.data?.captains || []);
      setUsers(usersRes.data?.users || []);
      setRides(ridesRes.data?.rides || []);
      setComplaints(complaintsRes.data?.complaints || []);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="purple" size="sm">ADMINISTRATOR PORTAL</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            RidePass Pro <span className="text-purple-400">Back-Office</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            System health, driver document verification, ride auditing, and plan configuration.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        {[
          { id: 'overview', name: 'Overview' },
          { id: 'drivers', name: `Drivers (${drivers.length})` },
          { id: 'users', name: `Users (${users.length})` },
          { id: 'rides', name: `Rides (${rides.length})` },
          { id: 'complaints', name: `Complaints (${complaints.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
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
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Revenue</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-3xl font-black text-white">₹{metrics?.totalRevenue || 0}</span>
              <span className="text-xs text-emerald-400 block mt-1">Processed transactions</span>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Active Subscribers</span>
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-3xl font-black text-white">{metrics?.activeSubscriptions || 0}</span>
              <span className="text-xs text-blue-400 block mt-1">Active passes holding balance</span>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Drivers</span>
                <Car className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-3xl font-black text-white">{metrics?.totalCaptains || 0}</span>
              <span className="text-xs text-slate-400 block mt-1">
                {metrics?.activeCaptains || 0} currently online
              </span>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Open Support Cases</span>
                <LifeBuoy className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-3xl font-black text-white">{metrics?.openComplaints || 0}</span>
              <span className="text-xs text-amber-400 block mt-1">Pending resolution</span>
            </Card>
          </div>
        </div>
      )}

      {/* Drivers Management Tab */}
      {activeTab === 'drivers' && (
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Driver Registry & Document Verification</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vehicle Specs</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {drivers.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-bold text-white">
                      {d.fullname?.firstname} {d.fullname?.lastname}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{d.email}</td>
                    <td className="py-3 px-4 capitalize text-slate-400">
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
          <h3 className="text-lg font-bold text-white mb-4">Registered Passengers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Passenger Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-3 px-4 font-bold text-white">
                      {u.fullname?.firstname} {u.fullname?.lastname}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'blue'} size="sm">
                        {u.role || 'user'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
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
          <h3 className="text-lg font-bold text-white mb-4">All Platform Rides</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
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
              <tbody className="divide-y divide-slate-800">
                {rides.map((r) => (
                  <tr key={r._id}>
                    <td className="py-3 px-4 max-w-xs truncate">
                      <div className="font-bold text-white truncate">{r.pickup}</div>
                      <div className="text-slate-400 truncate">→ {r.destination}</div>
                    </td>
                    <td className="py-3 px-4 capitalize">{r.vehicleType}</td>
                    <td className="py-3 px-4">₹{r.fare}</td>
                    <td className="py-3 px-4 font-bold text-white">₹{r.finalFare}</td>
                    <td className="py-3 px-4 text-emerald-400">₹{r.ridePassDiscount || 0}</td>
                    <td className="py-3 px-4">
                      <Badge variant={r.status === 'completed' ? 'green' : 'default'} size="sm">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Support Inquiries & Complaints</h3>
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No open complaints.</div>
            ) : (
              complaints.map((c) => (
                <div key={c._id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-white text-sm">{c.subject}</span>
                    <Badge variant={c.status === 'resolved' ? 'green' : 'yellow'} size="sm">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-slate-300">{c.description}</p>
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
