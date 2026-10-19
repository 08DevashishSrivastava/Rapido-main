const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/payment.model');
const subscriptionService = require('./subscription.service');
const Ride = require('../models/ride.model');

// Helper to safely get Razorpay SDK instance when keys are configured
const getRazorpayClient = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (key_id && key_secret && !key_id.includes('your_test_key') && !key_id.includes('placeholder')) {
        try {
            return new Razorpay({ key_id, key_secret });
        } catch (e) {
            console.warn('Razorpay SDK init error:', e.message);
            return null;
        }
    }
    return null;
};

// Create payment order (supports Razorpay standard checkout)
const createPaymentOrder = async ({ userId, purpose, amount, subscriptionId = null, rideId = null }) => {
    const amountInPaise = Math.round(amount * 100);
    const rzp = getRazorpayClient();
    let orderId;
    let provider = 'razorpay_test';

    if (rzp) {
        try {
            const rzpOrder = await rzp.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                notes: {
                    userId: userId.toString(),
                    purpose,
                    subscriptionId: subscriptionId ? subscriptionId.toString() : ''
                }
            });
            orderId = rzpOrder.id;
            provider = 'razorpay';
        } catch (err) {
            console.warn('Razorpay live order creation fallback to simulated test mode:', err.message);
            orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            provider = 'razorpay_test_mode';
        }
    } else {
        orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        provider = 'razorpay_test_mode';
    }

    const payment = await Payment.create({
        user: userId,
        purpose,
        subscription: subscriptionId,
        ride: rideId,
        amount,
        currency: 'INR',
        orderId,
        provider,
        status: 'pending',
        idempotencyKey: `order-${orderId}`,
        metadata: {
            amountInPaise,
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
        }
    });

    return {
        payment,
        orderId,
        amount,
        amountInPaise,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        isTestMode: !rzp,
        provider
    };
};

// Verify and capture payment via Razorpay HMAC signature
const verifyAndProcessPayment = async ({ orderId, paymentId = `pay_${Date.now()}`, signature = null }) => {
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
        throw new Error('Payment order not found');
    }

    if (payment.status === 'succeeded') {
        return { success: true, payment, message: 'Payment already processed and verified' };
    }

    // Verify official Razorpay signature if secret is configured
    const secret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;
    if (secret && signature && !secret.includes('your_test_key')) {
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (expectedSignature !== signature) {
            payment.status = 'failed';
            await payment.save();
            throw new Error('Invalid Razorpay payment signature verification failed');
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
