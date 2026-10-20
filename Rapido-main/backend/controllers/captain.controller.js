const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model');
const otpService = require('../services/otp.service');

module.exports.registerCaptain = async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, vehicle } = req.body;
    const isCaptainAlreadyExist = await captainModel.findOne({ email });
    if (isCaptainAlreadyExist) {
        return res.status(400).json({
            message: 'Captain already exist'
        });
    }

    const hashedPassword = await captainModel.hashPassword(password);

    const captain = await captainService.createCaptain({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
        password: hashedPassword,
        color: vehicle.color,
        plate: vehicle.plate,
        capacity: vehicle.capacity,
        vehicleType: vehicle.vehicleType,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude
    });

    const token = captain.generateAuthToken();
    const captainResponse = captain.toObject ? captain.toObject() : { ...captain._doc };
    delete captainResponse.password;

    res.status(201).json({ token, captain: captainResponse });

};

module.exports.loginCaptain = async (req , res , next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select('+password');
    if (!captain) {
        return res.status(401).json({
            message: 'Invalid email or password'
        });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({
            message: 'Invalid email or password'
        });
    }

    const token = captain.generateAuthToken();
    res.cookie('token', token);

    const captainResponse = captain.toObject ? captain.toObject() : { ...captain._doc };
    delete captainResponse.password;

    res.status(200).json({ token, captain: captainResponse });
}

module.exports.sendCaptainOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, purpose = 'login' } = req.body;
        const result = await otpService.sendOtp({
            contact: email,
            role: 'captain',
            purpose
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

module.exports.verifyCaptainOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, otp, purpose = 'login', fullname, vehicle } = req.body;

        // Verify OTP
        await otpService.verifyOtp({
            contact: email,
            otp,
            role: 'captain',
            purpose
        });

        let captain = await captainModel.findOne({ email: email.toLowerCase().trim() });
        let isNewCaptain = false;

        if (!captain) {
            isNewCaptain = true;
            const emailPrefix = email.split('@')[0];
            const firstname = fullname?.firstname?.trim() || emailPrefix.slice(0, 1).toUpperCase() + emailPrefix.slice(1);
            const lastname = fullname?.lastname?.trim() || 'Captain';
            const randomPassword = await captainModel.hashPassword(Math.random().toString(36).slice(-10));

            captain = await captainService.createCaptain({
                firstname: firstname.length >= 3 ? firstname : 'Driver',
                lastname: lastname.length >= 3 ? lastname : 'Partner',
                email: email.toLowerCase().trim(),
                password: randomPassword,
                color: vehicle?.color?.trim() || 'White',
                plate: vehicle?.plate?.trim()?.toUpperCase() || `DL01${Math.floor(1000 + Math.random() * 9000)}`,
                capacity: Number(vehicle?.capacity) || 4,
                vehicleType: vehicle?.vehicleType || 'car',
                latitude: vehicle?.latitude || 28.6139,
                longitude: vehicle?.longitude || 77.2090
            });
        }

        const token = captain.generateAuthToken();
        const captainResponse = captain.toObject ? captain.toObject() : { ...captain._doc };
        delete captainResponse.password;

        res.cookie('token', token);
        res.status(200).json({
            message: isNewCaptain ? 'Captain account created and verified' : 'OTP verified successfully',
            token,
            captain: captainResponse,
            isNewCaptain
        });
    } catch (err) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

module.exports.getCaptainProfile = async (req , res , next) => {
    const captainResponse = req.captain.toObject ? req.captain.toObject() : { ...req.captain._doc };
    if (captainResponse) delete captainResponse.password;
    res.status(200).json({ captain: captainResponse });
};

module.exports.updateCaptainProfile = async (req, res, next) => {
    try {
        const { fullname, vehicle } = req.body;
        if (fullname) {
            if (fullname.firstname) req.captain.fullname.firstname = fullname.firstname;
            if (fullname.lastname) req.captain.fullname.lastname = fullname.lastname;
        }
        if (vehicle) {
            if (vehicle.color) req.captain.vehicle.color = vehicle.color;
            if (vehicle.plate) req.captain.vehicle.plate = vehicle.plate;
        }
        await req.captain.save();
        const captainResponse = req.captain.toObject ? req.captain.toObject() : { ...req.captain._doc };
        delete captainResponse.password;
        res.status(200).json({ captain: captainResponse, message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating captain profile', error: err.message });
    }
};

module.exports.updateCaptainStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be active or inactive' });
        }
        req.captain.status = status;
        await req.captain.save();
        res.status(200).json({ message: 'Status updated successfully', status: req.captain.status });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update status', error: err.message });
    }
}

module.exports.updateCaptainLocation = async (req, res, next) => {
    try {
        const { ltd, lng } = req.body;
        if (ltd === undefined || lng === undefined) {
            return res.status(400).json({ message: 'ltd and lng coordinates are required' });
        }
        req.captain.location = { ltd: Number(ltd), lng: Number(lng) };
        if (req.captain.vehicle) {
            req.captain.vehicle.latitude = Number(ltd);
            req.captain.vehicle.longitude = Number(lng);
        }
        await req.captain.save();
        res.status(200).json({ message: 'Location updated successfully', location: req.captain.location });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update location', error: err.message });
    }
}

module.exports.logoutCaptain = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (token) {
        await blackListTokenModel.create({ token });
    }

    res.clearCookie('token');

    res.status(200).json({ message: 'Logout successfully' });
};