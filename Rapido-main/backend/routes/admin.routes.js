const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All admin routes are protected with authAdmin
router.use(authMiddleware.authAdmin);

// Overview metrics
router.get('/overview', adminController.getOverview);

// Captain management
router.get('/captains', adminController.getCaptains);
router.post('/verify-captain', adminController.verifyCaptain);

// User management
router.get('/users', adminController.getUsers);

// Ride management
router.get('/rides', adminController.getRides);

// Plan management
router.post('/plans', adminController.createPlan);
router.put('/plans/:planId', adminController.updatePlan);

// Subscriptions & Ledger
router.get('/subscriptions', adminController.getAllSubscriptions);
router.get('/ledger', adminController.getLedger);

// Complaints
router.get('/complaints', adminController.getComplaints);
router.post('/resolve-complaint', adminController.resolveComplaint);

module.exports = router;
