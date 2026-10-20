const express = require('express');
const router = express.Router();

const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('fullname.firstname')
        .isLength({ min: 3 })
        .withMessage('First name must be at least 3 characters long'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
], userController.registerUser);

router.post('/login', [
    body('email').isEmail().withMessage('Invalid Email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
], userController.loginUser);

router.post('/send-otp', [
    body('email').isEmail().withMessage('Valid email is required to send verification code'),
    body('purpose').optional().isIn(['login', 'register']).withMessage('Invalid OTP purpose')
], userController.sendUserOtp);

router.post('/verify-otp', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit verification code is required'),
    body('purpose').optional().isIn(['login', 'register']).withMessage('Invalid OTP purpose')
], userController.verifyUserOtp);

router.get('/profile', authMiddleware.authUser, userController.getUserProfile);
router.put('/profile', authMiddleware.authUser, userController.updateUserProfile);
router.post('/logout', authMiddleware.authUser, userController.logoutUser);
router.get('/logout', authMiddleware.authUser, userController.logoutUser);

module.exports = router;
