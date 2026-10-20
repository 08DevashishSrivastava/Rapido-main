const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    contact: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    otpHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'captain', 'admin'],
        default: 'user'
    },
    purpose: {
        type: String,
        enum: ['login', 'register', 'verification'],
        default: 'login'
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // MongoDB TTL index to auto-remove expired documents
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
