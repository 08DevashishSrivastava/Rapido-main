const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
        default: null
    },
    pickup: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    pickupCoords: {
        ltd: { type: Number, default: 28.6139 },
        lng: { type: Number, default: 77.2090 }
    },
    destinationCoords: {
        ltd: { type: Number, default: 28.5355 },
        lng: { type: Number, default: 77.3910 }
    },
    fare: {
        type: Number,
        required: true
    },
    finalFare: {
        type: Number,
        required: true
    },
    ridePassDiscount: {
        type: Number,
        default: 0
    },
    subscriptionApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userSubscription',
        default: null
    },
    vehicleType: {
        type: String,
        enum: ['car', 'motorcycle', 'auto'],
        required: true
    },
    distance: {
        type: Number, // in kilometers
        default: 5.0
    },
    duration: {
        type: Number, // in minutes
        default: 15
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'arriving', 'ongoing', 'completed', 'cancelled'],
        default: 'pending'
    },
    otp: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentId: {
        type: String,
        default: null
    },
    cancelledBy: {
        type: String,
        enum: ['user', 'captain', 'system', null],
        default: null
    },
    cancelReason: {
        type: String,
        default: null
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    review: {
        type: String,
        default: null
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    startedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index to quickly search rides by user and captain
rideSchema.index({ user: 1, status: 1 });
rideSchema.index({ captain: 1, status: 1 });
rideSchema.index({ status: 1 });

module.exports = mongoose.model('ride', rideSchema);
