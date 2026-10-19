const Complaint = require('../models/complaint.model');

module.exports.createComplaint = async (req, res) => {
    try {
        const { subject, category, description, rideId } = req.body;
        if (!subject || !description) {
            return res.status(400).json({ message: 'Subject and description are required' });
        }

        const complaint = await Complaint.create({
            user: req.user._id,
            ride: rideId || null,
            subject,
            category: category || 'ride_issue',
            description,
            status: 'open'
        });

        res.status(201).json({
            message: 'Support ticket submitted successfully. Our team will review it shortly.',
            complaint
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit complaint', error: err.message });
    }
};

module.exports.getUserComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user._id })
            .populate('ride')
            .sort({ createdAt: -1 });
        res.status(200).json({ complaints });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch complaints', error: err.message });
    }
};
