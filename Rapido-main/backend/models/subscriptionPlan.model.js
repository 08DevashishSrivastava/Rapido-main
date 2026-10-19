const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    tagline: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    validityDays: {
        type: Number,
        required: true,
        min: 1
    },
    rideAllowance: {
        type: Number,
        required: true,
        min: 1
    },
    maxFarePerRide: {
        type: Number,
        required: true,
        min: 1
    },
    allowedVehicleTypes: [{
        type: String,
        enum: ['car', 'motorcycle', 'auto']
    }],
    excessFarePolicy: {
        type: String,
        enum: ['pay_difference', 'full_fare_after_cap', 'reject_ride'],
        default: 'pay_difference'
    },
    features: [{
        type: String
    }],
    badge: {
        type: String,
        default: ''
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('subscriptionPlan', subscriptionPlanSchema);
