const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public: View subscription plans
router.get('/plans', subscriptionController.getPlans);

// Protected: Get current logged-in user's active pass
router.get('/active', authMiddleware.authUser, subscriptionController.getActiveSubscription);

// Protected: Purchase/Checkout a subscription
router.post('/checkout', authMiddleware.authUser, subscriptionController.checkoutSubscription);

// Protected: Activate purchased subscription
router.post('/activate', authMiddleware.authUser, subscriptionController.activateSubscription);

// Protected: Get past subscriptions
router.get('/history', authMiddleware.authUser, subscriptionController.getSubscriptionHistory);

// Protected: Get allowance ledger
router.get('/ledger', authMiddleware.authUser, subscriptionController.getUsageLedger);

// Protected: Cancel subscription
router.post('/cancel', authMiddleware.authUser, subscriptionController.cancelSubscription);

// Protected: Update auto-renewal
router.patch('/renew', authMiddleware.authUser, subscriptionController.updateRenewal);

// Protected: Savings Analytics
router.get('/savings', authMiddleware.authUser, subscriptionController.getSavingsAnalytics);

module.exports = router;
