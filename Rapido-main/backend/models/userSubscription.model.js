const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'subscriptionPlan',
        required: true
    },
    planSnapshot: {
        name: { type: String, required: true },
        slug: { type: String, required: true },
        price: { type: Number, required: true },
        validityDays: { type: Number, required: true },
        rideAllowance: { type: Number, required: true },
        maxFarePerRide: { type: Number, required: true },
        allowedVehicleTypes: [{ type: String }],
        excessFarePolicy: { type: String, default: 'pay_difference' }
    },
    status: {
        type: String,
        enum: ['pending_payment', 'active', 'expired', 'cancelled', 'payment_failed'],
        default: 'pending_payment',
        index: true
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    totalAllowance: {
        type: Number,
        required: true
    },
    remainingRides: {
        type: Number,
        required: true,
        min: 0
    },
    usedRides: {
        type: Number,
        default: 0,
        min: 0
    },
    autoRenew: {
        type: Boolean,
        default: false
    },
    paymentId: {
        type: String,
        default: null
    },
    cancelledAt: {
        type: Date,
        default: null
    },
    cancelReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

userSubscriptionSchema.methods.isExpired = function () {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
};

userSubscriptionSchema.methods.syncStatus = function () {
    if (this.status === 'active' && (this.remainingRides <= 0 || this.isExpired())) {
        this.status = 'expired';
    }
    return this.status;
};

module.exports = mongoose.model('userSubscription', userSubscriptionSchema);
