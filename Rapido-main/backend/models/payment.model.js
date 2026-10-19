const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    purpose: {
        type: String,
        enum: ['subscription', 'ride_excess', 'ride_standard'],
        required: true
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userSubscription',
        default: null
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        default: null
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        default: 'demo_gateway'
    },
    status: {
        type: String,
        enum: ['created', 'pending', 'succeeded', 'failed', 'refunded'],
        default: 'created',
        index: true
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('payment', paymentSchema);
