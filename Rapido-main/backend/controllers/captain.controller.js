const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model');

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

module.exports.getCaptainProfile = async (req , res , next) => {
    const captainResponse = req.captain.toObject ? req.captain.toObject() : { ...req.captain._doc };
    if (captainResponse) delete captainResponse.password;
    res.status(200).json({ captain: captainResponse });
}

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