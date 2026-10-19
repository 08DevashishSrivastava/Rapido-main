const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Protected: create payment order
router.post('/create-order', authMiddleware.authUser, paymentController.createOrder);

// Protected: verify payment
router.post('/verify', authMiddleware.authUser, paymentController.verifyPayment);

// Webhook listener (unauthenticated, signature checked)
router.post('/webhook', paymentController.webhook);

// Protected: payment history
router.get('/history', authMiddleware.authUser, paymentController.getHistory);

module.exports = router;
