const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Otp = require('../models/otp.model');

// Configuration
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;
const MAX_HOURLY_REQUESTS = 5;

/**
 * Generate a cryptographically secure 6-digit OTP
 */
const generateOtpCode = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Send / Generate OTP for a contact
 */
const sendOtp = async ({ contact, role = 'user', purpose = 'login' }) => {
    if (!contact || typeof contact !== 'string') {
        throw new Error('Valid contact (email or phone) is required');
    }

    const normalizedContact = contact.toLowerCase().trim();

    // 1. Check Resend Cooldown (60 seconds)
    const recentOtp = await Otp.findOne({
        contact: normalizedContact,
        role,
        purpose,
        createdAt: { $gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) }
    }).sort({ createdAt: -1 });

    if (recentOtp) {
        const remainingSeconds = Math.ceil(
            (recentOtp.createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
        );
        const err = new Error(`Please wait ${Math.max(1, remainingSeconds)} seconds before requesting another code.`);
        err.statusCode = 429;
        throw err;
    }

    // 2. Check Hourly Rate Limit (5 per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await Otp.countDocuments({
        contact: normalizedContact,
        createdAt: { $gte: oneHourAgo }
    });

    if (hourlyCount >= MAX_HOURLY_REQUESTS) {
        const err = new Error('Too many verification requests. Please try again in an hour.');
        err.statusCode = 429;
        throw err;
    }

    // 3. Invalidate previous unused OTPs for this contact & purpose
    await Otp.updateMany(
        { contact: normalizedContact, role, purpose, isUsed: false },
        { isUsed: true }
    );

    // 4. Generate new secure 6-digit code and hash it
    const plainOtp = generateOtpCode();
    const otpHash = await bcrypt.hash(plainOtp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otpRecord = await Otp.create({
        contact: normalizedContact,
        otpHash,
        role,
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt
    });

    // 5. Delivery Provider Simulation / Console
    const isDev = process.env.NODE_ENV !== 'production';
    console.log(`[RIDE-PASS-PRO OTP SERVICE] Contact: ${normalizedContact} | Purpose: ${purpose} | Role: ${role} | OTP: ${plainOtp}`);

    return {
        success: true,
        message: `Verification code sent to ${normalizedContact}. Code valid for ${OTP_EXPIRY_MINUTES} minutes.`,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        // Only return devOtp in non-production environments to facilitate rapid testing
        devOtp: isDev ? plainOtp : undefined
    };
};

/**
 * Verify submitted OTP code
 */
const verifyOtp = async ({ contact, otp, role = 'user', purpose = 'login' }) => {
    if (!contact || !otp) {
        throw new Error('Contact and verification OTP code are required');
    }

    const normalizedContact = contact.toLowerCase().trim();
    const normalizedOtp = otp.toString().trim();

    // Find the latest valid OTP record
    const otpRecord = await Otp.findOne({
        contact: normalizedContact,
        role,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
        const err = new Error('Verification code has expired or is invalid. Please request a new code.');
        err.statusCode = 400;
        throw err;
    }

    // Check maximum attempts limit
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
        otpRecord.isUsed = true;
        await otpRecord.save();
        const err = new Error('Maximum verification attempts exceeded. Please request a new code.');
        err.statusCode = 400;
        throw err;
    }

    // Compare submitted OTP with stored hash
    const isMatch = await bcrypt.compare(normalizedOtp, otpRecord.otpHash);

    if (!isMatch) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        const remaining = MAX_ATTEMPTS - otpRecord.attempts;
        const err = new Error(
            remaining > 0
                ? `Invalid verification code. ${remaining} attempt(s) remaining.`
                : 'Invalid verification code. Maximum attempts reached. Please request a new code.'
        );
        err.statusCode = 400;
        throw err;
    }

    // Mark as used to prevent replay attacks
    otpRecord.isUsed = true;
    await otpRecord.save();

    return {
        success: true,
        contact: normalizedContact,
        role,
        purpose
    };
};

module.exports = {
    sendOtp,
    verifyOtp,
    OTP_EXPIRY_MINUTES,
    RESEND_COOLDOWN_SECONDS
};
