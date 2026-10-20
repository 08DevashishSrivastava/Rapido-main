const captainController = require('../controllers/captain.controller');
const express = require('express');
const router = express.Router();
const { body } = require("express-validator");
const authMiddleware =require('../middlewares/auth.middleware');

router.post('/register', [
    body('email')
        .isEmail()
        .withMessage('Invalid Email'),

    body('fullname.firstname')
        .isLength({ min: 3 })
        .withMessage('First name must be at least 3 characters long'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),

    body('vehicle.color')
        .isLength({ min: 3 })
        .withMessage('Color must be at least 3 characters long'),

    body('vehicle.plate')
        .isLength({ min: 3 })
        .withMessage('Plate must be at least 3 characters long'),

    body('vehicle.capacity')
        .isInt({ min: 1 })
        .withMessage('Capacity must be at least 1'),

    body('vehicle.vehicleType')
        .isIn(['car', 'motorcycle', 'auto'])
        .withMessage('Invalid vehicle type')
],
    captainController.registerCaptain
)
router.post('/login', [
    body('email')
        .isEmail()
        .withMessage('Invalid Email'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
],
    captainController.loginCaptain
);

router.post('/send-otp', [
    body('email').isEmail().withMessage('Valid email is required to send verification code'),
    body('purpose').optional().isIn(['login', 'register']).withMessage('Invalid OTP purpose')
], captainController.sendCaptainOtp);

router.post('/verify-otp', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit verification code is required'),
    body('purpose').optional().isIn(['login', 'register']).withMessage('Invalid OTP purpose')
], captainController.verifyCaptainOtp);

router.get('/profile', authMiddleware.authCaptain, captainController.getCaptainProfile);
router.put('/profile', authMiddleware.authCaptain, captainController.updateCaptainProfile);
router.get('/logout', authMiddleware.authCaptain, captainController.logoutCaptain);
router.post('/logout', authMiddleware.authCaptain, captainController.logoutCaptain);
router.post('/status', authMiddleware.authCaptain, captainController.updateCaptainStatus);
router.patch('/status', authMiddleware.authCaptain, captainController.updateCaptainStatus);
router.post('/location', authMiddleware.authCaptain, captainController.updateCaptainLocation);
router.patch('/location', authMiddleware.authCaptain, captainController.updateCaptainLocation);

module.exports = router;

