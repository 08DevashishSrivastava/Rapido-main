const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        default: null
    },
    subject: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['ride_issue', 'billing', 'driver_behavior', 'app_feedback', 'safety', 'other'],
        default: 'ride_issue'
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    adminNotes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('complaint', complaintSchema);
