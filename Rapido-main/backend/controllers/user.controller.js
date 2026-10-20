const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');
const blackListTokenModel = require('../models/blacklistToken.model');
const otpService = require('../services/otp.service');


module.exports.registerUser = async (req, res, next) => {

const errors = validationResult(req);
if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
}
console.log(req.body);

const { fullname, email, password } = req.body;
const isUserAlready = await userModel.findOne({ email });

if (isUserAlready) {
    return res.status(400).json({
        message: 'User already exist'
    });
}
const hashedPassword = await userModel.hashPassword(password);

const user = await userService.createUser({
    firstname: fullname.firstname,
    lastname: fullname.lastname,
    email,
    password: hashedPassword
});
const token = user.generateAuthToken();
const userResponse = user.toObject();
delete userResponse.password;

res.status(201).json({ token, user: userResponse });

}
module.exports.loginUser = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
const isMatch = await user.comparePassword(password);

if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
}

const token = user.generateAuthToken();
const userResponse = user.toObject();
delete userResponse.password;

res.status(200).json({ token, user: userResponse });
}

module.exports.sendUserOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, purpose = 'login' } = req.body;
        const result = await otpService.sendOtp({
            contact: email,
            role: 'user',
            purpose
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message });
    }
};

module.exports.verifyUserOtp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, otp, purpose = 'login', fullname } = req.body;

        // Verify OTP code
        await otpService.verifyOtp({
            contact: email,
            otp,
            role: 'user',
            purpose
        });

        // Find or auto-register user
        let user = await userModel.findOne({ email: email.toLowerCase().trim() });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            // Generate friendly default names if not provided
            const emailPrefix = email.split('@')[0];
            const firstname = fullname?.firstname?.trim() || emailPrefix.slice(0, 1).toUpperCase() + emailPrefix.slice(1);
            const lastname = fullname?.lastname?.trim() || 'Passenger';
            const randomPassword = await userModel.hashPassword(Math.random().toString(36).slice(-10));

            user = await userService.createUser({
                firstname: firstname.length >= 3 ? firstname : 'Rider',
                lastname: lastname.length >= 3 ? lastname : 'Passenger',
                email: email.toLowerCase().trim(),
                password: randomPassword
            });
        }

        const token = user.generateAuthToken();
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            message: isNewUser ? 'Account created and verified' : 'OTP verified successfully',
            token,
            user: userResponse,
            isNewUser
        });
    } catch (err) {
        res.status(err.statusCode || 400).json({ message: err.message });
    }
};

module.exports.getUserProfile = async (req,res,next) => {
    res.status(200).json(req.user);
};

module.exports.updateUserProfile = async (req, res, next) => {
    try {
        const { fullname } = req.body;
        if (fullname) {
            if (fullname.firstname) req.user.fullname.firstname = fullname.firstname;
            if (fullname.lastname) req.user.fullname.lastname = fullname.lastname;
        }
        await req.user.save();
        const userObj = req.user.toObject();
        delete userObj.password;
        res.status(200).json({ user: userObj, message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
};

module.exports.logoutUser = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
        await blackListTokenModel.create({ token });
    }
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });

};