import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI, paymentAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import {
  Sparkles,
  CheckCircle,
  Shield,
  CreditCard,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

export default function RidePassPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    subscriptionAPI.getPlans()
      .then(res => setPlans(res.data.plans || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleCheckoutAndActivate = async () => {
    if (!selectedPlan) return;
    setCheckoutLoading(true);
    setErrorMessage('');

    try {
      // 1. Create checkout order on backend
      const checkoutRes = await subscriptionAPI.checkout(selectedPlan._id, autoRenew);
      const { subscription, orderId } = checkoutRes.data;

      // 2. Process demo payment verification
      const paymentId = `PAY_DEMO_${Date.now()}`;
      await paymentAPI.verifyPayment({
        orderId,
        paymentId
      });

      // 3. Activate subscription
      await subscriptionAPI.activate(subscription._id, paymentId);

      setSuccessMessage('RidePass activated successfully! Redirecting to your pass...');
      setTimeout(() => {
        setModalOpen(false);
        navigate('/my-pass');
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Checkout failed. Please ensure you are logged in as a passenger.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="blue" size="sm">RIDEPASS PRO SUBSCRIPTIONS</Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Choose the Perfect <span className="text-blue-500">RidePass</span>
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Unlock guaranteed zero surge pricing, free rides up to your plan cap, and pay only excess fare on longer journeys. Plans adapt to your weekly or monthly commuting frequency.
        </p>
      </div>

      {/* Plans Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan._id}
            className={`flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.01] ${
              plan.isPopular ? 'border-blue-500/60 bg-slate-900/90 glow-blue ring-1 ring-blue-500/30' : ''
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-6">
                <Badge variant={plan.isPopular ? 'blue' : 'green'} size="sm">
                  {plan.badge}
                </Badge>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.tagline || plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 text-white">
                <span className="text-4xl font-black">₹{plan.price}</span>
                <span className="text-xs text-slate-400">/ {plan.validityDays} days</span>
              </div>

              {/* Core Specs Grid */}
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Included Ride Allowance:</span>
                  <span className="font-bold text-emerald-400">{plan.rideAllowance} rides</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Maximum Fare Cap:</span>
                  <span className="font-bold text-white">Up to ₹{plan.maxFarePerRide} / ride</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Eligible Vehicles:</span>
                  <span className="font-bold text-slate-200 capitalize">
                    {plan.allowedVehicleTypes?.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="font-medium">Excess Fare Policy:</span>
                  <span className="text-blue-400 font-semibold">Pay difference only</span>
                </div>
              </div>

              {/* Features checklist */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Included Benefits:
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {plan.features?.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <Button
                variant={plan.isPopular ? 'primary' : 'secondary'}
                className="w-full text-sm"
                onClick={() => handleSelectPlan(plan)}
              >
                Subscribe to {plan.name}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Policy Clarification */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
        <div className="space-y-1.5">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>How the Fare Cap Works</span>
          </h4>
          <p className="text-slate-400">
            If your standard ride fare is ₹130 and your plan cap is ₹150, you pay ₹0. If your ride fare is ₹180, you pay only the ₹30 excess fare.
          </p>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Cancellation Policy</span>
          </h4>
          <p className="text-slate-400">
            If a ride is cancelled before completion, your deducted ride allowance is automatically reversed back to your pass immediately.
          </p>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Surge Immunity</span>
          </h4>
          <p className="text-slate-400">
            All RidePass holders are immune to peak-hour multiplier spikes across rainy days and rush hour traffic.
          </p>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm RidePass Subscription"
      >
        {selectedPlan && (
          <div className="space-y-6">
            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-white text-lg">{selectedPlan.name}</span>
                <span className="font-extrabold text-white text-xl">₹{selectedPlan.price}</span>
              </div>
              <p className="text-xs text-slate-400">{selectedPlan.description}</p>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Validity</span>
                  <span className="font-semibold text-slate-300">{selectedPlan.validityDays} Days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Allowance</span>
                  <span className="font-semibold text-emerald-400">{selectedPlan.rideAllowance} Rides</span>
                </div>
              </div>
            </div>

            {/* Auto renew toggle */}
            <label className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-300">
                Enable auto-renewal at expiration (can be cancelled anytime)
              </span>
            </label>

            {/* Payment simulation disclosure */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>
                Demonstration Mode: Instant verified payment activation via test gateway.
              </span>
            </div>

            <Button
              variant="success"
              size="lg"
              className="w-full text-sm"
              loading={checkoutLoading}
              onClick={handleCheckoutAndActivate}
            >
              Pay ₹{selectedPlan.price} & Activate {selectedPlan.name}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
