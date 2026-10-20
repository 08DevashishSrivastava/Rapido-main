const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');

// Get Fare Estimates
module.exports.getFareEstimates = async (req, res) => {
    try {
        const { pickup, destination } = req.query;
        if (!pickup || !destination) {
            return res.status(400).json({ message: 'Pickup and destination are required' });
        }

        const estimates = await rideService.getFareEstimates({
            pickup,
            destination,
            user: req.user || null
        });

        res.status(200).json(estimates);
    } catch (err) {
        res.status(500).json({ message: 'Error calculating fare estimates', error: err.message });
    }
};

// Create a new ride booking
module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { pickup, destination, vehicleType } = req.body;
        const ride = await rideService.createRide({
            user: req.user,
            pickup,
            destination,
            vehicleType
        });

        res.status(201).json({
            message: 'Ride booked successfully',
            ride
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Captain accepts ride
module.exports.acceptRide = async (req, res) => {
    try {
        const { rideId } = req.body;
        if (!rideId) {
            return res.status(400).json({ message: 'rideId is required' });
        }

        const ride = await rideService.acceptRide({
            rideId,
            captainId: req.captain._id
        });

        res.status(200).json({
            message: 'Ride accepted successfully',
            ride
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Captain marks arrived
module.exports.markArrived = async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await rideService.markArrived({
            rideId,
            captainId: req.captain._id
        });

        res.status(200).json({ message: 'Status updated to arriving', ride });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Captain starts trip with OTP
module.exports.startTrip = async (req, res) => {
    try {
        const { rideId, otp } = req.body;
        if (!otp) {
            return res.status(400).json({ message: '4-digit OTP is required to start trip' });
        }

        const ride = await rideService.startTrip({
            rideId,
            captainId: req.captain._id,
            otp
        });

        res.status(200).json({ message: 'Trip started successfully', ride });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Captain completes trip
module.exports.completeTrip = async (req, res) => {
    try {
        const { rideId } = req.body;
        const ride = await rideService.completeTrip({
            rideId,
            captainId: req.captain._id
        });

        res.status(200).json({ message: 'Trip completed successfully', ride });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Cancel trip (Passenger or Captain)
module.exports.cancelTrip = async (req, res) => {
    try {
        const { rideId, reason } = req.body;
        const userId = req.user ? req.user._id : null;
        const captainId = req.captain ? req.captain._id : null;

        const ride = await rideService.cancelTrip({
            rideId,
            userId,
            captainId,
            reason
        });

        res.status(200).json({ message: 'Ride cancelled successfully', ride });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Passenger rates ride
module.exports.rateRide = async (req, res) => {
    try {
        const { rideId, rating, review } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const ride = await rideService.rateRide({
            rideId,
            userId: req.user._id,
            rating,
            review
        });

        res.status(200).json({ message: 'Rating submitted successfully', ride });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get User's ride history
module.exports.getUserRides = async (req, res) => {
    try {
        const rides = await rideService.getUserRides(req.user._id);
        res.status(200).json({ rides });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch rides', error: err.message });
    }
};

// Get Captain's ride history
module.exports.getCaptainRides = async (req, res) => {
    try {
        const rides = await rideService.getCaptainRides(req.captain._id);
        res.status(200).json({ rides });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch captain rides', error: err.message });
    }
};

// Get Available pending rides for nearby captains
module.exports.getAvailableRides = async (req, res) => {
    try {
        const rides = await rideService.getAvailableRidesForCaptains(req.captain);
        res.status(200).json({ rides });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch available rides', error: err.message });
    }
};

// Get single ride details
module.exports.getRideDetails = async (req, res) => {
    try {
        const { rideId } = req.params;
        const userId = req.user ? req.user._id : null;
        const captainId = req.captain ? req.captain._id : null;
        const ride = await rideService.getRideById(rideId, userId, captainId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        res.status(200).json({ ride });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch ride details', error: err.message });
    }
};
