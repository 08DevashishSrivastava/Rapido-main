import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function RidePassPlansPage() {
  const { user, displayName } = useAuth();
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
    setSuccessMessage('');
    setModalOpen(true);
  };

  // Official Razorpay Standard Checkout Integration
  const handleRazorpayCheckout = async () => {
    if (!selectedPlan) return;
    setCheckoutLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Create order on backend (returns orderId, amountInPaise, keyId, isTestMode)
      const checkoutRes = await subscriptionAPI.checkout(selectedPlan._id, autoRenew);
      const { subscription, orderId, amountInPaise, keyId, isTestMode } = checkoutRes.data;

      // 2. Check if live Razorpay SDK modal can be invoked
      const hasLiveRazorpay = window.Razorpay && keyId && !keyId.includes('placeholder') && !keyId.includes('your_test_key');

      if (hasLiveRazorpay) {
        const options = {
          key: keyId,
          amount: amountInPaise,
          currency: 'INR',
          name: 'RidePass Pro',
          description: `${selectedPlan.name} Subscription`,
          order_id: orderId,
          prefill: {
            name: displayName,
            email: user?.email || ''
          },
          theme: {
            color: '#2563EB'
          },
          handler: async function (response) {
            try {
              // 3. Verify Razorpay signature on server
              await paymentAPI.verifyPayment({
                orderId: response.razorpay_order_id || orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              });

              // 4. Activate subscription upon backend verification
              await subscriptionAPI.activate(subscription._id, response.razorpay_payment_id);

              setSuccessMessage('Payment verified! RidePass activated successfully.');
              setTimeout(() => {
                setModalOpen(false);
                navigate('/my-pass');
              }, 1200);
            } catch (err) {
              setErrorMessage(err.response?.data?.message || 'Payment verification failed on server');
            }
          },
          modal: {
            ondismiss: function () {
              setCheckoutLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setErrorMessage(`Payment failed: ${response.error.description || 'Transaction declined'}`);
          setCheckoutLoading(false);
        });
        rzp.open();
      } else {
        // Fallback: Test mode simulation when test credentials are placeholders
        const testPaymentId = `pay_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        await paymentAPI.verifyPayment({
          orderId,
          paymentId: testPaymentId
        });

        await subscriptionAPI.activate(subscription._id, testPaymentId);

        setSuccessMessage('Razorpay Test Mode: Verified & Activated successfully!');
        setTimeout(() => {
          setModalOpen(false);
          navigate('/my-pass');
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message || 'Checkout failed. Please ensure you are logged in as a passenger.'
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge variant="blue" size="sm">SUBSCRIPTIONS</Badge>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          Choose the Perfect <span className="text-blue-600">RidePass</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Zero surge pricing, flat-rate ride caps, and seamless automatic renewal. Pay only excess difference for longer journeys.
        </p>
      </div>

      {/* Plans Comparison Grid */}
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
                plan.isPopular ? 'ring-2 ring-blue-500 shadow-md scale-[1.01]' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 right-6">
                  <Badge variant={plan.isPopular ? 'blue' : 'green'} size="sm">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{plan.tagline || plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 text-slate-900">
                  <span className="text-4xl font-black">₹{plan.price}</span>
                  <span className="text-xs text-slate-500 font-semibold">/ {plan.validityDays} days</span>
                </div>

                {/* Core Specs Grid */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200/90 space-y-2.5 text-xs shadow-2xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">Included Ride Allowance:</span>
                    <span className="font-bold text-emerald-700">{plan.rideAllowance} rides</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">Maximum Fare Cap:</span>
                    <span className="font-bold text-slate-900">Up to ₹{plan.maxFarePerRide} / ride</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">Eligible Vehicles:</span>
                    <span className="font-bold text-teal-700 capitalize">
                      {plan.allowedVehicleTypes?.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">Excess Fare Policy:</span>
                    <span className="text-blue-700 font-semibold">Pay difference only</span>
                  </div>
                </div>

                {/* Features checklist */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Included Benefits:
                  </span>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {plan.features?.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-200">
                <Button
                  variant={plan.isPopular ? 'primary' : 'secondary'}
                  className="w-full text-sm font-bold"
                  onClick={() => handleSelectPlan(plan)}
                >
                  Subscribe to {plan.name}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Policy Clarification */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 shadow-sm">
        <div className="space-y-1.5">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>How the Fare Cap Works</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            If your standard ride fare is ₹130 and your plan cap is ₹150, you pay ₹0. If your ride fare is ₹180, you pay only the ₹30 excess fare.
          </p>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            <span>Cancellation Policy</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            If a ride is cancelled before completion, your deducted ride allowance is automatically reversed back to your pass immediately.
          </p>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span>Surge Immunity</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">
            All RidePass holders are immune to peak-hour multiplier spikes during rainy weather, rush hours, and local events.
          </p>
        </div>
      </div>

      {/* Razorpay Standard Checkout Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm RidePass Purchase"
      >
        {selectedPlan && (
          <div className="space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Plan Card in modal */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-slate-900 text-lg">{selectedPlan.name}</span>
                <span className="font-black text-blue-600 text-2xl">₹{selectedPlan.price}</span>
              </div>
              <p className="text-xs text-slate-600">{selectedPlan.description}</p>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Validity</span>
                  <span className="font-bold text-slate-800">{selectedPlan.validityDays} Days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ride Allowance</span>
                  <span className="font-bold text-emerald-700">{selectedPlan.rideAllowance} Rides</span>
                </div>
              </div>
            </div>

            {/* Auto-renew checkbox */}
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Enable auto-renewal at expiration (can be cancelled anytime from dashboard)
              </span>
            </label>

            {/* Razorpay Security Badge */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Razorpay Standard Checkout: 256-bit SSL encrypted. Supports UPI, Cards, NetBanking.
              </span>
            </div>

            {/* CTA */}
            <Button
              variant="primary"
              size="lg"
              className="w-full text-sm font-bold shadow-md"
              loading={checkoutLoading}
              onClick={handleRazorpayCheckout}
            >
              Pay ₹{selectedPlan.price} with Razorpay
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
