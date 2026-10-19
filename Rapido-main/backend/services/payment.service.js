const crypto = require('crypto');
const Payment = require('../models/payment.model');
const subscriptionService = require('./subscription.service');
const Ride = require('../models/ride.model');

// Create payment order
const createPaymentOrder = async ({ userId, purpose, amount, subscriptionId = null, rideId = null }) => {
    const orderId = `RP_ORD_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const payment = await Payment.create({
        user: userId,
        purpose,
        subscription: subscriptionId,
        ride: rideId,
        amount,
        currency: 'INR',
        orderId,
        provider: process.env.PAYMENT_PROVIDER || 'demo_gateway',
        status: 'pending',
        idempotencyKey: `order-${orderId}`
    });

    return payment;
};

// Verify and capture payment
const verifyAndProcessPayment = async ({ orderId, paymentId = `PAY_${Date.now()}`, signature = null }) => {
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
        throw new Error('Payment order not found');
    }

    if (payment.status === 'succeeded') {
        return { success: true, payment, message: 'Payment already processed' };
    }

    // Verify signature if Razorpay or HMAC secret is configured
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (expectedSignature !== signature) {
            payment.status = 'failed';
            await payment.save();
            throw new Error('Invalid payment signature verification failed');
        }
    }

    payment.paymentId = paymentId;
    payment.status = 'succeeded';
    await payment.save();

    // Trigger fulfillment based on purpose
    if (payment.purpose === 'subscription' && payment.subscription) {
        await subscriptionService.activateSubscription(payment.subscription, paymentId);
    } else if (payment.purpose === 'ride_excess' && payment.ride) {
        await Ride.findByIdAndUpdate(payment.ride, {
            paymentStatus: 'completed',
            paymentId
        });
    }

    return {
        success: true,
        payment,
        message: 'Payment verified and fulfilled successfully'
    };
};

const handlePaymentWebhook = async (payload, signature) => {
    const { orderId, paymentId, status } = payload;
    const idempotencyKey = `webhook-${orderId}-${paymentId}`;

    const existing = await Payment.findOne({
        $or: [
            { idempotencyKey },
            { orderId, status: 'succeeded' }
        ]
    });
    if (existing) {
        return { message: 'Webhook already processed' };
    }

    if (status === 'captured' || status === 'succeeded') {
        const result = await verifyAndProcessPayment({ orderId, paymentId, signature });
        await Payment.findOneAndUpdate({ orderId }, { idempotencyKey });
        return result;
    } else {
        await Payment.findOneAndUpdate(
            { orderId },
            { status: 'failed', idempotencyKey }
        );
        return { message: 'Payment marked failed' };
    }
};

const getUserPaymentHistory = async (userId) => {
    return await Payment.find({ user: userId })
        .populate('subscription')
        .populate('ride')
        .sort({ createdAt: -1 });
};

module.exports = {
    createPaymentOrder,
    verifyAndProcessPayment,
    handlePaymentWebhook,
    getUserPaymentHistory
};
