const crypto = require('crypto');
const Ride = require('../models/ride.model');
const Captain = require('../models/captain.model');
const subscriptionService = require('./subscription.service');

// Calculate distance and duration from strings or mock locations
const getDistanceAndDuration = async (pickup, destination) => {
    // Deterministic mock distance based on string length hash or default coordinates
    let hash = 0;
    const combined = `${pickup || ''}->${destination || ''}`;
    for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    
    // Distance between 2.5 km and 18.5 km
    const distance = Math.round(((positiveHash % 160) / 10 + 2.5) * 10) / 10;
    // Average speed 22 km/h in city traffic -> minutes
    const duration = Math.max(8, Math.round((distance / 22) * 60));

    return { distance, duration };
};

// Calculate standard fare per vehicle type
const calculateStandardFares = (distance, duration) => {
    // Motorcycle: Base ₹20 + ₹8/km + ₹1/min
    const motorcycle = Math.round(20 + (8 * distance) + (1 * duration));
    // Auto: Base ₹30 + ₹11/km + ₹1.5/min
    const auto = Math.round(30 + (11 * distance) + (1.5 * duration));
    // Car: Base ₹50 + ₹15/km + ₹2/min
    const car = Math.round(50 + (15 * distance) + (2 * duration));

    return { motorcycle, auto, car };
};

// Generate 4-digit numeric OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const getFareEstimates = async ({ pickup, destination, user = null }) => {
    const { distance, duration } = await getDistanceAndDuration(pickup, destination);
    const standardFares = calculateStandardFares(distance, duration);

    const vehicleTypes = ['motorcycle', 'auto', 'car'];
    const estimates = {};

    for (const vType of vehicleTypes) {
        const stdFare = standardFares[vType];
        if (user) {
            const eligibility = await subscriptionService.checkRidePassEligibility(user, vType, stdFare);
            estimates[vType] = {
                standardFare: stdFare,
                finalFare: eligibility.finalFare,
                discount: eligibility.discount,
                excessFare: eligibility.excessFare,
                ridePassEligible: eligibility.eligible,
                planName: eligibility.planName || null,
                remainingRides: eligibility.remainingRides || 0,
                savings: eligibility.discount,
                distance,
                duration
            };
        } else {
            estimates[vType] = {
                standardFare: stdFare,
                finalFare: stdFare,
                discount: 0,
                excessFare: 0,
                ridePassEligible: false,
                savings: 0,
                distance,
                duration
            };
        }
    }

    return {
        distance,
        duration,
        fares: estimates
    };
};

const createRide = async ({ user, pickup, destination, vehicleType }) => {
    if (!pickup || !destination || !vehicleType) {
        throw new Error('Pickup, destination, and vehicleType are required');
    }

    const { distance, duration } = await getDistanceAndDuration(pickup, destination);
    const standardFares = calculateStandardFares(distance, duration);
    const standardFare = standardFares[vehicleType];

    if (!standardFare) {
        throw new Error(`Invalid vehicleType: ${vehicleType}`);
    }

    // Check RidePass eligibility
    const eligibility = await subscriptionService.checkRidePassEligibility(user, vehicleType, standardFare);
    const otp = generateOTP();

    const ride = new Ride({
        user: user._id,
        pickup,
        destination,
        vehicleType,
        distance,
        duration,
        fare: standardFare,
        finalFare: eligibility.finalFare,
        ridePassDiscount: eligibility.discount,
        subscriptionApplied: eligibility.eligible ? eligibility.subscription._id : null,
        otp,
        status: 'pending',
        paymentStatus: eligibility.finalFare === 0 ? 'completed' : 'pending'
    });

    await ride.save();

    // If RidePass was applied, atomically reserve 1 ride from the subscription
    if (eligibility.eligible && eligibility.subscription) {
        await subscriptionService.reserveRideAllowance(eligibility.subscription._id, ride._id, user._id);
    }

    return ride;
};

// Atomic driver acceptance to strictly prevent concurrent double-acceptance
const acceptRide = async ({ rideId, captainId }) => {
    const captain = await Captain.findById(captainId);
    if (!captain) {
        throw new Error('Captain not found');
    }

    // Find pending ride and update atomically
    const ride = await Ride.findOneAndUpdate(
        { _id: rideId, status: 'pending' },
        {
            status: 'accepted',
            captain: captainId,
            acceptedAt: new Date()
        },
        { returnDocument: 'after' }
    ).populate('user', 'fullname email phone');

    if (!ride) {
        throw new Error('Ride is no longer available or was already accepted by another driver.');
    }

    return ride;
};

// Driver arrives at pickup location
const markArrived = async ({ rideId, captainId }) => {
    const ride = await Ride.findOne({ _id: rideId, captain: captainId });
    if (!ride) {
        throw new Error('Ride not found or not assigned to this captain');
    }

    if (ride.status !== 'accepted') {
        throw new Error(`Cannot mark arrived when ride status is ${ride.status}`);
    }

    ride.status = 'arriving';
    await ride.save();
    return ride;
};

// Start trip with OTP validation
const startTrip = async ({ rideId, captainId, otp }) => {
    const ride = await Ride.findOne({ _id: rideId, captain: captainId });
    if (!ride) {
        throw new Error('Ride not found or not assigned to this captain');
    }

    if (!['accepted', 'arriving'].includes(ride.status)) {
        throw new Error(`Cannot start ride with current status: ${ride.status}`);
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP. Please ask the passenger for the correct 4-digit code.');
    }

    ride.status = 'ongoing';
    ride.startedAt = new Date();
    await ride.save();
    return ride;
};

// Complete trip
const completeTrip = async ({ rideId, captainId }) => {
    const ride = await Ride.findOne({ _id: rideId, captain: captainId });
    if (!ride) {
        throw new Error('Ride not found or not assigned to this captain');
    }

    if (ride.status !== 'ongoing') {
        throw new Error(`Cannot complete ride with status: ${ride.status}`);
    }

    ride.status = 'completed';
    ride.completedAt = new Date();
    ride.paymentStatus = 'completed';
    await ride.save();
    return ride;
};

// Cancel trip with automatic RidePass allowance reversal
const cancelTrip = async ({ rideId, userId, captainId, reason }) => {
    const ride = await Ride.findById(rideId);
    if (!ride) {
        throw new Error('Ride not found');
    }

    if (['completed', 'cancelled'].includes(ride.status)) {
        throw new Error(`Cannot cancel a ride that is already ${ride.status}`);
    }

    const isUser = userId && ride.user.toString() === userId.toString();
    const isCaptain = captainId && ride.captain && ride.captain.toString() === captainId.toString();

    if (!isUser && !isCaptain) {
        throw new Error('Unauthorized to cancel this ride');
    }

    ride.status = 'cancelled';
    ride.cancelledBy = isUser ? 'user' : 'captain';
    ride.cancelReason = reason || 'Cancelled by ' + (isUser ? 'passenger' : 'driver');
    await ride.save();

    // If subscription allowance was deducted, safely reverse it!
    if (ride.subscriptionApplied) {
        await subscriptionService.reverseRideAllowance(
            ride.subscriptionApplied,
            ride._id,
            ride.user,
            ride.cancelReason
        );
    }

    return ride;
};

// Rate ride
const rateRide = async ({ rideId, userId, rating, review }) => {
    const ride = await Ride.findOne({ _id: rideId, user: userId });
    if (!ride) {
        throw new Error('Ride not found or does not belong to you');
    }

    if (ride.status !== 'completed') {
        throw new Error('You can only rate a completed ride');
    }

    ride.rating = Number(rating);
    ride.review = review || '';
    await ride.save();
    return ride;
};

const getUserRides = async (userId) => {
    return await Ride.find({ user: userId })
        .populate('captain', 'fullname vehicle')
        .populate('subscriptionApplied')
        .sort({ createdAt: -1 });
};

const getCaptainRides = async (captainId) => {
    return await Ride.find({ captain: captainId })
        .populate('user', 'fullname email')
        .populate('subscriptionApplied')
        .sort({ createdAt: -1 });
};

const getAvailableRidesForCaptains = async (captain) => {
    // Find pending rides matching captain's vehicle type
    return await Ride.find({
        status: 'pending',
        vehicleType: captain.vehicle?.vehicleType || 'car'
    })
    .populate('user', 'fullname')
    .sort({ createdAt: -1 })
    .limit(20);
};

module.exports = {
    getDistanceAndDuration,
    calculateStandardFares,
    getFareEstimates,
    createRide,
    acceptRide,
    markArrived,
    startTrip,
    completeTrip,
    cancelTrip,
    rateRide,
    getUserRides,
    getCaptainRides,
    getAvailableRidesForCaptains
};
