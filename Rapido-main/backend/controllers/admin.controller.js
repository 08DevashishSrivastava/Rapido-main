const User = require('../models/user.model');
const Captain = require('../models/captain.model');
const Ride = require('../models/ride.model');
const SubscriptionPlan = require('../models/subscriptionPlan.model');
const UserSubscription = require('../models/userSubscription.model');
const SubscriptionLedger = require('../models/subscriptionLedger.model');
const Payment = require('../models/payment.model');
const Complaint = require('../models/complaint.model');

// Overview analytics
module.exports.getOverview = async (req, res) => {
    try {
        const [
            totalUsers,
            totalCaptains,
            activeCaptains,
            totalRides,
            completedRides,
            activeSubscriptions,
            totalPayments,
            openComplaints
        ] = await Promise.all([
            User.countDocuments(),
            Captain.countDocuments(),
            Captain.countDocuments({ status: 'active' }),
            Ride.countDocuments(),
            Ride.countDocuments({ status: 'completed' }),
            UserSubscription.countDocuments({ status: 'active' }),
            Payment.find({ status: 'succeeded' }),
            Complaint.countDocuments({ status: 'open' })
        ]);

        const totalRevenue = totalPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

        res.status(200).json({
            metrics: {
                totalUsers,
                totalCaptains,
                activeCaptains,
                totalRides,
                completedRides,
                activeSubscriptions,
                totalRevenue,
                openComplaints
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch overview metrics', error: err.message });
    }
};

// Manage Captains
module.exports.getCaptains = async (req, res) => {
    try {
        const captains = await Captain.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ captains });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch captains', error: err.message });
    }
};

module.exports.verifyCaptain = async (req, res) => {
    try {
        const { captainId, documentsVerified, status } = req.body;
        const captain = await Captain.findById(captainId);
        if (!captain) {
            return res.status(404).json({ message: 'Captain not found' });
        }

        if (documentsVerified !== undefined) captain.documentsVerified = documentsVerified;
        if (status) captain.status = status;
        await captain.save();

        res.status(200).json({ message: 'Captain status updated', captain });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update captain', error: err.message });
    }
};

// Manage Users
module.exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
};

// Manage Rides
module.exports.getRides = async (req, res) => {
    try {
        const rides = await Ride.find()
            .populate('user', 'fullname email')
            .populate('captain', 'fullname vehicle')
            .populate('subscriptionApplied')
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json({ rides });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch rides', error: err.message });
    }
};

// Manage Subscription Plans
module.exports.createPlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);
        res.status(201).json({ message: 'Plan created successfully', plan });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports.updatePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const plan = await SubscriptionPlan.findByIdAndUpdate(planId, req.body, { new: true });
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }
        res.status(200).json({ message: 'Plan updated', plan });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports.getAllSubscriptions = async (req, res) => {
    try {
        const subscriptions = await UserSubscription.find()
            .populate('user', 'fullname email')
            .populate('plan')
            .sort({ createdAt: -1 });
        res.status(200).json({ subscriptions });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch subscriptions', error: err.message });
    }
};

module.exports.getLedger = async (req, res) => {
    try {
        const ledger = await SubscriptionLedger.find()
            .populate('user', 'fullname email')
            .populate('ride')
            .sort({ createdAt: -1 })
            .limit(150);
        res.status(200).json({ ledger });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch ledger', error: err.message });
    }
};

// Manage Complaints
module.exports.getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate('user', 'fullname email')
            .populate('ride')
            .sort({ createdAt: -1 });
        res.status(200).json({ complaints });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch complaints', error: err.message });
    }
};

module.exports.resolveComplaint = async (req, res) => {
    try {
        const { complaintId, status, adminNotes } = req.body;
        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        if (status) complaint.status = status;
        if (adminNotes) complaint.adminNotes = adminNotes;
        await complaint.save();
        res.status(200).json({ message: 'Complaint updated', complaint });
    } catch (err) {
        res.status(500).json({ message: 'Failed to resolve complaint', error: err.message });
    }
};
