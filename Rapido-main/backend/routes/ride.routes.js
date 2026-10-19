const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const rideController = require('../controllers/ride.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Fare estimation (supports authenticated user for RidePass discount calculation)
router.get(
    '/get-fare',
    [
        query('pickup').isString().notEmpty().withMessage('Pickup location is required'),
        query('destination').isString().notEmpty().withMessage('Destination location is required')
    ],
    // Optional auth: if token is present, decode user to show active RidePass savings
    async (req, res, next) => {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const userModel = require('../models/user.model');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ridepass_pro_default_jwt_secret');
                req.user = await userModel.findById(decoded._id);
            } catch (e) {
                // Ignore token error for public estimates
            }
        }
        next();
    },
    rideController.getFareEstimates
);

// Create ride booking (Passenger only)
router.post(
    '/create',
    authMiddleware.authUser,
    [
        body('pickup').isString().isLength({ min: 3 }).withMessage('Valid pickup address required'),
        body('destination').isString().isLength({ min: 3 }).withMessage('Valid destination address required'),
        body('vehicleType').isIn(['car', 'motorcycle', 'auto']).withMessage('Invalid vehicle type')
    ],
    rideController.createRide
);

// Accept ride (Captain only)
router.post('/confirm', authMiddleware.authCaptain, rideController.acceptRide);

// Mark arrived (Captain only)
router.post('/arrived', authMiddleware.authCaptain, rideController.markArrived);

// Start trip with OTP (Captain only)
router.post(
    '/start-ride',
    authMiddleware.authCaptain,
    [
        body('rideId').notEmpty().withMessage('rideId is required'),
        body('otp').isLength({ min: 4, max: 4 }).withMessage('Valid 4-digit OTP is required')
    ],
    rideController.startTrip
);

// Complete trip (Captain only)
router.post('/end-ride', authMiddleware.authCaptain, rideController.completeTrip);

// Cancel trip (Passenger or Captain)
router.post(
    '/cancel',
    async (req, res, next) => {
        // Try user auth first, then captain auth
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        try {
            const jwt = require('jsonwebtoken');
            const userModel = require('../models/user.model');
            const captainModel = require('../models/captain.model');
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ridepass_pro_default_jwt_secret');

            const user = await userModel.findById(decoded._id);
            if (user) {
                req.user = user;
                return next();
            }
            const captain = await captainModel.findById(decoded._id);
            if (captain) {
                req.captain = captain;
                return next();
            }
            return res.status(401).json({ message: 'Unauthorized' });
        } catch (e) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    },
    rideController.cancelTrip
);

// Rate ride (Passenger only)
router.post('/rate', authMiddleware.authUser, rideController.rateRide);

// Get user rides
router.get('/user-rides', authMiddleware.authUser, rideController.getUserRides);

// Get captain rides
router.get('/captain-rides', authMiddleware.authCaptain, rideController.getCaptainRides);

// Get available pending rides for captains
router.get('/available', authMiddleware.authCaptain, rideController.getAvailableRides);

module.exports = router;
