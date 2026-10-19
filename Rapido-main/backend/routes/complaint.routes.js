const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware.authUser, complaintController.createComplaint);
router.get('/', authMiddleware.authUser, complaintController.getUserComplaints);

module.exports = router;
