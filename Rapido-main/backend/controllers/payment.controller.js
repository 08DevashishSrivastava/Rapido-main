const paymentService = require('../services/payment.service');

// Create payment order
module.exports.createOrder = async (req, res) => {
    try {
        const { purpose, amount, subscriptionId, rideId } = req.body;
        if (!purpose || !amount) {
            return res.status(400).json({ message: 'purpose and amount are required' });
        }

        const payment = await paymentService.createPaymentOrder({
            userId: req.user._id,
            purpose,
            amount: Number(amount),
            subscriptionId,
            rideId
        });

        res.status(201).json({
            message: 'Payment order created',
            payment,
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Verify payment
module.exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;
        if (!orderId) {
            return res.status(400).json({ message: 'orderId is required' });
        }

        const result = await paymentService.verifyAndProcessPayment({
            orderId,
            paymentId: paymentId || `DEMO_PAY_${Date.now()}`,
            signature
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Webhook listener
module.exports.webhook = async (req, res) => {
    try {
        const signature = req.headers['x-payment-signature'] || null;
        const result = await paymentService.handlePaymentWebhook(req.body, signature);
        res.status(200).json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Payment history for logged in user
module.exports.getHistory = async (req, res) => {
    try {
        const history = await paymentService.getUserPaymentHistory(req.user._id);
        res.status(200).json({ payments: history });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch payment history', error: err.message });
    }
};
