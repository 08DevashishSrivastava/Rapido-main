const captainModel = require('../models/captain.model');

module.exports.createCaptain = async ({
    firstname,
    lastname,
    email,
    password,
    color,
    plate,
    capacity,
    vehicleType,
    latitude,
    longitude
}) => {

    if (
        !firstname ||
        !email ||
        !password ||
        !color ||
        !plate ||
        !capacity ||
        !vehicleType
    ) {
        throw new Error('All fields are required');
    }

    const defaultLat = latitude !== undefined && latitude !== null ? Number(latitude) : 28.6139;
    const defaultLng = longitude !== undefined && longitude !== null ? Number(longitude) : 77.2090;

    const captain = await captainModel.create({
        fullname: {
            firstname,
            lastname
        },
        email,
        password,
        status: 'active',
        documentsVerified: true,
        location: {
            ltd: defaultLat,
            lng: defaultLng
        },
        vehicle: {
            color,
            plate,
            capacity,
            vehicleType,
            latitude: defaultLat,
            longitude: defaultLng
        }
    });

    return captain;
};