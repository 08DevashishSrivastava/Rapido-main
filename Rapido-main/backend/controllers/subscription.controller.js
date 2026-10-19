const subscriptionService = require('../services/subscription.service');
const paymentService = require('../services/payment.service');
const Ride = require('../models/ride.model');
const UserSubscription = require('../models/userSubscription.model');

// Get active RidePass subscription plans
module.exports.getPlans = async (req, res) => {
    try {
        const plans = await subscriptionService.getActivePlans();
        res.status(200).json({ plans });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch plans', error: err.message });
    }
};

// Get current logged-in user's active RidePass
module.exports.getActiveSubscription = async (req, res) => {
    try {
        const subscription = await subscriptionService.getUserActiveSubscription(req.user._id);
        res.status(200).json({ subscription });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch active subscription', error: err.message });
    }
};

// Checkout RidePass plan (creates pending subscription & payment order)
module.exports.checkoutSubscription = async (req, res) => {
    try {
        const { planId, autoRenew } = req.body;
        if (!planId) {
            return res.status(400).json({ message: 'planId is required' });
        }

        const checkoutData = await subscriptionService.checkoutSubscription(
            req.user._id,
            planId,
            autoRenew
        );

        res.status(201).json({
            message: 'Subscription order created. Proceed with payment to activate.',
            ...checkoutData
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Activate subscription (called after payment verification or demo confirmation)
module.exports.activateSubscription = async (req, res) => {
    try {
        const { subscriptionId, paymentId } = req.body;
        if (!subscriptionId) {
            return res.status(400).json({ message: 'subscriptionId is required' });
        }

        // Verify that this subscription belongs to the logged-in user
        const sub = await UserSubscription.findOne({ _id: subscriptionId, user: req.user._id });
        if (!sub) {
            return res.status(404).json({ message: 'Subscription record not found for this user' });
        }

        const activated = await subscriptionService.activateSubscription(subscriptionId, paymentId);

        res.status(200).json({
            message: 'RidePass activated successfully! You can now book rides with your allowance.',
            subscription: activated
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get subscription history
module.exports.getSubscriptionHistory = async (req, res) => {
    try {
        const history = await subscriptionService.getSubscriptionHistory(req.user._id);
        res.status(200).json({ subscriptions: history });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch history', error: err.message });
    }
};

// Get usage ledger
module.exports.getUsageLedger = async (req, res) => {
    try {
        const ledger = await subscriptionService.getUsageLedger(req.user._id);
        res.status(200).json({ ledger });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch ledger', error: err.message });
    }
};

// Cancel subscription
module.exports.cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId, reason } = req.body;
        const cancelled = await subscriptionService.cancelSubscription(
            req.user._id,
            subscriptionId,
            reason
        );

        res.status(200).json({
            message: 'Subscription cancelled successfully',
            subscription: cancelled
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update renewal preference
module.exports.updateRenewal = async (req, res) => {
    try {
        const { subscriptionId, autoRenew } = req.body;
        const updated = await subscriptionService.updateRenewalPreference(
            req.user._id,
            subscriptionId,
            autoRenew
        );

        res.status(200).json({
            message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}`,
            subscription: updated
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Savings Analytics
module.exports.getSavingsAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all completed rides where RidePass was applied
        const passRides = await Ride.find({
            user: userId,
            status: 'completed',
            subscriptionApplied: { $ne: null }
        });

        // Total standard fare vs final fare paid
        let totalStandardFare = 0;
        let totalFinalFarePaid = 0;
        let totalRidePassDiscount = 0;

        passRides.forEach(r => {
            totalStandardFare += (r.fare || 0);
            totalFinalFarePaid += (r.finalFare || 0);
            totalRidePassDiscount += (r.ridePassDiscount || 0);
        });

        // Find total spend on active/completed subscriptions
        const userSubs = await UserSubscription.find({
            user: userId,
            status: { $in: ['active', 'expired'] }
        });

        let totalSubscriptionCost = 0;
        userSubs.forEach(s => {
            totalSubscriptionCost += (s.planSnapshot?.price || 0);
        });

        const netSavings = Math.max(0, totalRidePassDiscount - totalSubscriptionCost);

        // Monthly trends
        const monthlyData = {};
        passRides.forEach(r => {
            const date = new Date(r.createdAt);
            const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthKey, rides: 0, savings: 0, standardFare: 0 };
            }
            monthlyData[monthKey].rides += 1;
            monthlyData[monthKey].savings += (r.ridePassDiscount || 0);
            monthlyData[monthKey].standardFare += (r.fare || 0);
        });

        res.status(200).json({
            analytics: {
                totalPassRidesTaken: passRides.length,
                totalStandardFare,
                totalFinalFarePaid,
                totalRidePassDiscount,
                totalSubscriptionCost,
                netSavings,
                monthlyTrends: Object.values(monthlyData)
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Error calculating analytics', error: err.message });
    }
};
