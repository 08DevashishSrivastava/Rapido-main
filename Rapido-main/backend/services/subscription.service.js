const SubscriptionPlan = require('../models/subscriptionPlan.model');
const UserSubscription = require('../models/userSubscription.model');
const SubscriptionLedger = require('../models/subscriptionLedger.model');
const Payment = require('../models/payment.model');

// Seed default plans if collection is empty
const seedDefaultPlans = async () => {
    const count = await SubscriptionPlan.countDocuments();
    if (count === 0) {
        const defaultPlans = [
            {
                name: 'RidePass Mini',
                slug: 'mini',
                tagline: 'Ideal for weekly commuters & light travel',
                description: 'Enjoy 5 heavily discounted or free rides up to ₹150 each, valid for 7 days.',
                price: 199,
                currency: 'INR',
                validityDays: 7,
                rideAllowance: 5,
                maxFarePerRide: 150,
                allowedVehicleTypes: ['car', 'motorcycle', 'auto'],
                excessFarePolicy: 'pay_difference',
                features: [
                    '5 Included Rides up to ₹150 each',
                    'Valid for 7 days across Car, Auto & Bike',
                    'Pay only the excess fare if ride exceeds ₹150',
                    'Priority driver matching & surge immunity'
                ],
                badge: 'Weekly Pack',
                isPopular: false,
                isActive: true
            },
            {
                name: 'RidePass Student',
                slug: 'student',
                tagline: 'Budget-friendly daily campus commuting',
                description: 'Designed for college and university students with 20 rides up to ₹200 each for 30 days.',
                price: 499,
                currency: 'INR',
                validityDays: 30,
                rideAllowance: 20,
                maxFarePerRide: 200,
                allowedVehicleTypes: ['car', 'motorcycle', 'auto'],
                excessFarePolicy: 'pay_difference',
                features: [
                    '20 Rides included (up to ₹200 each)',
                    'Valid for 30 days',
                    'Zero peak-hour pricing up to cap',
                    'Free instant cancellations'
                ],
                badge: 'Student Special',
                isPopular: true,
                isActive: true
            },
            {
                name: 'RidePass Pro',
                slug: 'pro',
                tagline: 'Maximum savings for frequent corporate commuters',
                description: 'Our premier pass with 50 rides up to ₹300 each, VIP matching, and zero surge pricing.',
                price: 999,
                currency: 'INR',
                validityDays: 30,
                rideAllowance: 50,
                maxFarePerRide: 300,
                allowedVehicleTypes: ['car', 'motorcycle', 'auto'],
                excessFarePolicy: 'pay_difference',
                features: [
                    '50 Rides included (up to ₹300 each)',
                    'Valid for 30 days on all vehicle categories',
                    'Guaranteed zero surge charges',
                    'Dedicated 24/7 priority customer support',
                    'Up to ₹15,000 in monthly travel value'
                ],
                badge: 'Best Value',
                isPopular: false,
                isActive: true
            }
        ];
        await SubscriptionPlan.insertMany(defaultPlans);
    }
};

const getActivePlans = async () => {
    await seedDefaultPlans();
    return await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
};

const getAllPlans = async () => {
    await seedDefaultPlans();
    return await SubscriptionPlan.find().sort({ createdAt: -1 });
};

const getUserActiveSubscription = async (userId) => {
    const sub = await UserSubscription.findOne({
        user: userId,
        status: 'active'
    }).populate('plan');

    if (!sub) return null;

    // Check auto-expiry
    if (sub.isExpired() || sub.remainingRides <= 0) {
        sub.status = 'expired';
        await sub.save();
        return null;
    }

    return sub;
};

const getSubscriptionHistory = async (userId) => {
    return await UserSubscription.find({ user: userId })
        .populate('plan')
        .sort({ createdAt: -1 });
};

const getUsageLedger = async (userId) => {
    return await SubscriptionLedger.find({ user: userId })
        .populate('ride')
        .sort({ createdAt: -1 });
};

const checkoutSubscription = async (userId, planId, autoRenew = false) => {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
        throw new Error('Selected subscription plan is not available.');
    }

    // Check if user already has an active subscription with remaining allowance
    const existingActive = await UserSubscription.findOne({
        user: userId,
        status: 'active'
    });

    if (existingActive && !existingActive.isExpired() && existingActive.remainingRides > 0) {
        throw new Error('You already have an active RidePass. Wait until it expires or use remaining allowance before buying a new one.');
    }

    const orderId = `RP_ORD_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const userSub = await UserSubscription.create({
        user: userId,
        plan: plan._id,
        planSnapshot: {
            name: plan.name,
            slug: plan.slug,
            price: plan.price,
            validityDays: plan.validityDays,
            rideAllowance: plan.rideAllowance,
            maxFarePerRide: plan.maxFarePerRide,
            allowedVehicleTypes: plan.allowedVehicleTypes,
            excessFarePolicy: plan.excessFarePolicy
        },
        status: 'pending_payment',
        totalAllowance: plan.rideAllowance,
        remainingRides: plan.rideAllowance,
        usedRides: 0,
        autoRenew
    });

    // Create corresponding payment record
    const payment = await Payment.create({
        user: userId,
        purpose: 'subscription',
        subscription: userSub._id,
        amount: plan.price,
        currency: plan.currency || 'INR',
        orderId,
        provider: 'demo_gateway',
        status: 'pending',
        idempotencyKey: `sub-init-${userSub._id}`
    });

    return {
        subscription: userSub,
        payment,
        orderId,
        amount: plan.price,
        planName: plan.name
    };
};

const activateSubscription = async (userSubId, paymentId = `PAY_DEMO_${Date.now()}`) => {
    const userSub = await UserSubscription.findById(userSubId);
    if (!userSub) {
        throw new Error('Subscription record not found');
    }

    if (userSub.status === 'active') {
        return userSub; // Idempotent
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + userSub.planSnapshot.validityDays);

    userSub.status = 'active';
    userSub.startDate = startDate;
    userSub.endDate = endDate;
    userSub.paymentId = paymentId;
    await userSub.save();

    // Update payment
    await Payment.findOneAndUpdate(
        { subscription: userSub._id },
        { status: 'succeeded', paymentId }
    );

    // Record credit in ledger
    const idempotencyKey = `credit-${userSub._id}`;
    const existingLedger = await SubscriptionLedger.findOne({ idempotencyKey });
    if (!existingLedger) {
        await SubscriptionLedger.create({
            userSubscription: userSub._id,
            user: userSub.user,
            operationType: 'purchase_credit',
            allowanceQuantity: userSub.totalAllowance,
            balanceAfter: userSub.remainingRides,
            idempotencyKey,
            reason: `Purchased and activated ${userSub.planSnapshot.name} with ${userSub.totalAllowance} rides`
        });
    }

    return userSub;
};

const checkRidePassEligibility = async (user, vehicleType, estimatedFare) => {
    const activeSub = await getUserActiveSubscription(user._id || user);
    if (!activeSub) {
        return {
            eligible: false,
            subscription: null,
            standardFare: estimatedFare,
            discount: 0,
            finalFare: estimatedFare,
            excessFare: 0,
            remainingRides: 0,
            reason: 'No active RidePass subscription'
        };
    }

    // Check vehicle eligibility
    if (!activeSub.planSnapshot.allowedVehicleTypes.includes(vehicleType)) {
        return {
            eligible: false,
            subscription: activeSub,
            standardFare: estimatedFare,
            discount: 0,
            finalFare: estimatedFare,
            excessFare: 0,
            remainingRides: activeSub.remainingRides,
            reason: `RidePass does not cover ${vehicleType}`
        };
    }

    // Check remaining rides
    if (activeSub.remainingRides <= 0) {
        return {
            eligible: false,
            subscription: activeSub,
            standardFare: estimatedFare,
            discount: 0,
            finalFare: estimatedFare,
            excessFare: 0,
            remainingRides: 0,
            reason: 'Ride allowance exhausted'
        };
    }

    const maxCap = activeSub.planSnapshot.maxFarePerRide;
    let discount = 0;
    let finalFare = 0;
    let excessFare = 0;

    if (estimatedFare <= maxCap) {
        discount = estimatedFare;
        finalFare = 0;
        excessFare = 0;
    } else {
        discount = maxCap;
        excessFare = Math.round((estimatedFare - maxCap) * 100) / 100;
        finalFare = excessFare;
    }

    return {
        eligible: true,
        subscription: activeSub,
        planName: activeSub.planSnapshot.name,
        standardFare: estimatedFare,
        discount,
        finalFare,
        excessFare,
        remainingRides: activeSub.remainingRides,
        reason: 'Eligible for RidePass discount'
    };
};

const reserveRideAllowance = async (userSubId, rideId, userId) => {
    // Atomic deduction: find subscription with remainingRides > 0 and decrement
    const updatedSub = await UserSubscription.findOneAndUpdate(
        { _id: userSubId, remainingRides: { $gt: 0 } },
        {
            $inc: { remainingRides: -1, usedRides: 1 }
        },
        { new: true }
    );

    if (!updatedSub) {
        throw new Error('Unable to reserve RidePass allowance: pass has no remaining rides.');
    }

    // Check if exhausted
    if (updatedSub.remainingRides === 0) {
        updatedSub.status = 'expired';
        await updatedSub.save();
    }

    // Create ledger entry
    const idempotencyKey = `reserve-${rideId}`;
    try {
        await SubscriptionLedger.create({
            userSubscription: updatedSub._id,
            user: userId,
            ride: rideId,
            operationType: 'ride_reservation',
            allowanceQuantity: -1,
            balanceAfter: updatedSub.remainingRides,
            idempotencyKey,
            reason: `Reserved 1 ride allowance for ride #${rideId}`
        });
    } catch (err) {
        // Idempotency duplicate key is fine
    }

    return updatedSub;
};

const reverseRideAllowance = async (userSubId, rideId, userId, reason = 'Ride cancelled') => {
    // Atomic restore
    const idempotencyKey = `reverse-${rideId}`;
    const existing = await SubscriptionLedger.findOne({ idempotencyKey });
    if (existing) {
        return; // Already reversed
    }

    const updatedSub = await UserSubscription.findOneAndUpdate(
        { _id: userSubId },
        {
            $inc: { remainingRides: 1, usedRides: -1 },
            $set: { status: 'active' } // Reactivate if it was marked expired due to 0 balance
        },
        { new: true }
    );

    if (updatedSub) {
        await SubscriptionLedger.create({
            userSubscription: updatedSub._id,
            user: userId,
            ride: rideId,
            operationType: 'ride_reversal',
            allowanceQuantity: 1,
            balanceAfter: updatedSub.remainingRides,
            idempotencyKey,
            reason: `Reversed 1 ride allowance: ${reason}`
        });
    }

    return updatedSub;
};

const cancelSubscription = async (userId, userSubId, reason = 'User requested cancellation') => {
    const sub = await UserSubscription.findOne({ _id: userSubId, user: userId, status: 'active' });
    if (!sub) {
        throw new Error('Active subscription not found to cancel');
    }

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    sub.cancelReason = reason;
    await sub.save();

    await SubscriptionLedger.create({
        userSubscription: sub._id,
        user: userId,
        operationType: 'admin_adjustment',
        allowanceQuantity: 0,
        balanceAfter: sub.remainingRides,
        idempotencyKey: `cancel-${sub._id}-${Date.now()}`,
        reason: `Subscription cancelled: ${reason}`
    });

    return sub;
};

const updateRenewalPreference = async (userId, userSubId, autoRenew) => {
    const sub = await UserSubscription.findOne({ _id: userSubId, user: userId });
    if (!sub) {
        throw new Error('Subscription not found');
    }
    sub.autoRenew = !!autoRenew;
    await sub.save();
    return sub;
};

module.exports = {
    seedDefaultPlans,
    getActivePlans,
    getAllPlans,
    getUserActiveSubscription,
    getSubscriptionHistory,
    getUsageLedger,
    checkoutSubscription,
    activateSubscription,
    checkRidePassEligibility,
    reserveRideAllowance,
    reverseRideAllowance,
    cancelSubscription,
    updateRenewalPreference
};
