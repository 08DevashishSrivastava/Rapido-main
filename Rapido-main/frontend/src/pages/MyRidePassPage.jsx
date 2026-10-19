import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import {
  Sparkles,
  CheckCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  FileText,
  Calendar,
  XCircle,
  ArrowRight
} from 'lucide-react';

export default function MyRidePassPage() {
  const [activeSub, setActiveSub] = useState(null);
  const [history, setHistory] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & cancellation states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of commuting plans');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [renewLoading, setRenewLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [subRes, histRes, ledgerRes] = await Promise.all([
        subscriptionAPI.getActiveSubscription().catch(() => ({ data: { subscription: null } })),
        subscriptionAPI.getHistory().catch(() => ({ data: { subscriptions: [] } })),
        subscriptionAPI.getLedger().catch(() => ({ data: { ledger: [] } }))
      ]);

      setActiveSub(subRes.data.subscription);
      setHistory(histRes.data.subscriptions || []);
      setLedger(ledgerRes.data.ledger || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAutoRenew = async () => {
    if (!activeSub) return;
    setRenewLoading(true);
    try {
      const res = await subscriptionAPI.updateRenew(activeSub._id, !activeSub.autoRenew);
      setActiveSub(res.data.subscription);
      setMessage(`Auto-renewal ${res.data.subscription.autoRenew ? 'enabled' : 'disabled'}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setRenewLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSub) return;
    setCancelLoading(true);
    try {
      await subscriptionAPI.cancel(activeSub._id, cancelReason);
      setCancelModalOpen(false);
      setMessage('Subscription cancelled successfully.');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <Badge variant="blue" size="sm">SUBSCRIPTION MANAGEMENT</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          My <span className="text-blue-600">RidePass</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Monitor your active allowance balance, ledger debits, and subscription renewal status.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-medium">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Active Pass Section or Empty State */}
      {activeSub ? (
        <Card accent="blue" glow={true} className="border-blue-200 bg-blue-50/20">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <Badge variant="green" size="md">ACTIVE COMMUTER PASS</Badge>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {activeSub.planSnapshot?.name}
                </h2>
                <span className="text-xs text-slate-500">
                  Plan Price: ₹{activeSub.planSnapshot?.price} • Fare Cap: ₹{activeSub.planSnapshot?.maxFarePerRide} / ride
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  loading={renewLoading}
                  onClick={handleToggleAutoRenew}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>Auto-Renew: {activeSub.autoRenew ? 'ON' : 'OFF'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setCancelModalOpen(true)}
                >
                  Cancel Pass
                </Button>
              </div>
            </div>

            {/* Allowance Progress Visual */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-semibold text-slate-700">Ride Allowance Utilized:</span>
                <span className="text-sm font-bold text-emerald-600">
                  {activeSub.remainingRides} Rides Remaining ({activeSub.usedRides || 0} Used)
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (activeSub.remainingRides / activeSub.totalAllowance) * 100))}%`
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500">
                <span>0 Rides</span>
                <span>Total: {activeSub.totalAllowance} Rides Allowance</span>
              </div>
            </div>

            {/* Validity Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block mb-1">Activated On</span>
                <span className="font-bold text-slate-900 text-sm">
                  {activeSub.startDate ? new Date(activeSub.startDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block mb-1">Valid Until</span>
                <span className="font-bold text-slate-900 text-sm">
                  {activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 block mb-1">Covered Vehicle Categories</span>
                <span className="font-bold text-slate-900 text-sm capitalize">
                  {activeSub.planSnapshot?.allowedVehicleTypes?.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-12 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">You have no active RidePass</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Activate a 7-day or 30-day commuter pass to unlock free rides up to your plan cap and avoid surge charges.
            </p>
          </div>
          <Link to="/plans" className="inline-block pt-2">
            <Button size="md" variant="primary">
              Browse Available Plans
            </Button>
          </Link>
        </Card>
      )}

      {/* Usage Ledger (Audit Trail) */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Allowance Usage Ledger</h3>
            <p className="text-xs text-slate-500">
              Cryptographically auditable debit and credit records for every ride reservation and reversal
            </p>
          </div>
          <Badge variant="blue" size="sm">
            {ledger.length} Records
          </Badge>
        </div>

        {ledger.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No ledger transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Change</th>
                  <th className="py-3 px-4">Remaining Balance</th>
                  <th className="py-3 px-4">Reason / Trip</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((entry) => (
                  <tr key={entry._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 uppercase">
                      {entry.operationType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={entry.allowanceQuantity > 0 ? 'text-emerald-600' : 'text-blue-600'}>
                        {entry.allowanceQuantity > 0 ? `+${entry.allowanceQuantity}` : entry.allowanceQuantity} ride
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {entry.balanceAfter} rides
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {entry.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Subscription Purchase History */}
      <Card>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Subscription Purchase History</h3>
        {history.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">No past subscriptions.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Allowance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Purchased On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h._id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{h.planSnapshot?.name}</td>
                    <td className="py-3 px-4 text-slate-700">₹{h.planSnapshot?.price}</td>
                    <td className="py-3 px-4 text-slate-700">{h.totalAllowance} rides</td>
                    <td className="py-3 px-4">
                      <Badge variant={h.status === 'active' ? 'green' : h.status === 'cancelled' ? 'red' : 'default'} size="sm">
                        {h.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(h.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel RidePass Subscription"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Are you sure you want to cancel your <span className="font-bold text-slate-900">{activeSub?.planSnapshot?.name}</span>?
            You will lose any remaining allowance upon cancellation.
          </p>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-600">Reason for cancellation:</label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Keep Pass
            </Button>
            <Button size="sm" variant="danger" loading={cancelLoading} onClick={handleCancelSubscription}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
