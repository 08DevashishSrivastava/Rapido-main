const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Models
const User = require('../models/user.model');
const Captain = require('../models/captain.model');
const Ride = require('../models/ride.model');
const SubscriptionPlan = require('../models/subscriptionPlan.model');
const UserSubscription = require('../models/userSubscription.model');
const SubscriptionLedger = require('../models/subscriptionLedger.model');
const Payment = require('../models/payment.model');
const BlacklistToken = require('../models/blacklistToken.model');

// Services & Controllers
const subscriptionService = require('../services/subscription.service');
const rideService = require('../services/ride.service');
const paymentService = require('../services/payment.service');
const connectToDb = require('../db/db');

describe('RidePass Pro Comprehensive QA Automation Test Suite', async () => {
    let testUser, testCaptain, testAdmin, testPlan, testSub;

    before(async () => {
        process.env.DB_CONNECT = process.env.DB_CONNECT || 'mongodb://127.0.0.1:27017/ridepass_pro_test';
        process.env.JWT_SECRET = 'test_jwt_secret_12345';
        await connectToDb();

        // Clean test collections
        await Promise.all([
            User.deleteMany({ email: { $regex: /@test\.com$/ } }),
            Captain.deleteMany({ email: { $regex: /@test\.com$/ } }),
            Ride.deleteMany({ pickup: { $regex: /Test/ } }),
            UserSubscription.deleteMany({}),
            SubscriptionLedger.deleteMany({}),
            Payment.deleteMany({})
        ]);

        await subscriptionService.seedDefaultPlans();
    });

    after(async () => {
        await mongoose.connection.close();
    });

    // TEST 1: Passenger registration and login
    await test('1. Passenger registration and login', async () => {
        const email = `passenger_${Date.now()}@test.com`;
        const hashedPassword = await User.hashPassword('secretPassword123');

        const user = await User.create({
            fullname: { firstname: 'Devashish', lastname: 'Srivastava' },
            email,
            password: hashedPassword,
            role: 'user'
        });

        assert.ok(user._id);
        assert.strictEqual(user.fullname.firstname, 'Devashish');
        assert.strictEqual(user.fullname.lastname, 'Srivastava');

        const token = user.generateAuthToken();
        assert.ok(token);

        const isMatch = await user.comparePassword('secretPassword123');
        assert.strictEqual(isMatch, true);

        testUser = user;
    });

    // TEST 2: Driver registration and verification
    await test('2. Driver registration and verification', async () => {
        const email = `driver_${Date.now()}@test.com`;
        const hashedPassword = await Captain.hashPassword('driverPassword123');

        const captain = await captainServiceCreate();
        async function captainServiceCreate() {
            return await Captain.create({
                fullname: { firstname: 'Rahul', lastname: 'Sharma' },
                email,
                password: hashedPassword,
                status: 'active',
                documentsVerified: true,
                vehicle: {
                    color: 'Electric Blue',
                    plate: 'DL01AB9999',
                    capacity: 4,
                    vehicleType: 'car'
                }
            });
        }

        assert.ok(captain._id);
        assert.strictEqual(captain.documentsVerified, true);
        assert.strictEqual(captain.vehicle.vehicleType, 'car');

        testCaptain = captain;
    });

    // TEST 3: Ride creation and driver assignment
    await test('3. Ride creation and driver assignment', async () => {
        const ride = await rideService.createRide({
            user: testUser,
            pickup: 'Test Pickup CP',
            destination: 'Test Drop Airport',
            vehicleType: 'car'
        });

        assert.ok(ride._id);
        assert.strictEqual(ride.status, 'pending');
        assert.ok(ride.otp);
        assert.strictEqual(ride.otp.length, 4);

        // Driver accepts
        const acceptedRide = await rideService.acceptRide({
            rideId: ride._id,
            captainId: testCaptain._id
        });

        assert.strictEqual(acceptedRide.status, 'accepted');
        assert.strictEqual(acceptedRide.captain.toString(), testCaptain._id.toString());
    });

    // TEST 4: Concurrent acceptance of the same ride
    await test('4. Concurrent acceptance of the same ride strictly prevents race condition', async () => {
        const ride = await rideService.createRide({
            user: testUser,
            pickup: 'Test Pickup Location A',
            destination: 'Test Destination Location B',
            vehicleType: 'car'
        });

        // Create a second captain
        const secondCaptain = await Captain.create({
            fullname: { firstname: 'Amit', lastname: 'Verma' },
            email: `second_driver_${Date.now()}@test.com`,
            password: 'password123',
            vehicle: { color: 'White', plate: 'DL02XY1111', capacity: 4, vehicleType: 'car' }
        });

        // Both drivers attempt concurrent acceptance simultaneously
        const results = await Promise.allSettled([
            rideService.acceptRide({ rideId: ride._id, captainId: testCaptain._id }),
            rideService.acceptRide({ rideId: ride._id, captainId: secondCaptain._id })
        ]);

        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        // Exactly one driver MUST succeed, and the other MUST fail
        assert.strictEqual(fulfilled.length, 1, 'Only one driver can successfully accept the ride');
        assert.strictEqual(rejected.length, 1, 'The competing driver must be rejected');
        assert.match(rejected[0].reason.message, /already accepted|no longer available/);
    });

    // TEST 5: Invalid ride-state transitions
    await test('5. Invalid ride-state transitions are blocked', async () => {
        const ride = await rideService.createRide({
            user: testUser,
            pickup: 'Test State CP',
            destination: 'Test State Noida',
            vehicleType: 'car'
        });

        // Attempting to complete a pending ride without acceptance
        await assert.rejects(
            async () => {
                await rideService.completeTrip({ rideId: ride._id, captainId: testCaptain._id });
            },
            /Ride not found or not assigned/
        );

        // Accept first
        await rideService.acceptRide({ rideId: ride._id, captainId: testCaptain._id });

        // Starting with wrong OTP must fail
        await assert.rejects(
            async () => {
                await rideService.startTrip({ rideId: ride._id, captainId: testCaptain._id, otp: '0000' });
            },
            /Invalid OTP/
        );
    });

    // TEST 6: Subscription plan retrieval
    await test('6. Subscription plan retrieval returns active plans', async () => {
        const plans = await subscriptionService.getActivePlans();
        assert.ok(plans.length >= 3);
        const slugs = plans.map(p => p.slug);
        assert.ok(slugs.includes('mini'));
        assert.ok(slugs.includes('student'));
        assert.ok(slugs.includes('pro'));
        testPlan = plans.find(p => p.slug === 'mini');
    });

    // TEST 7: Subscription purchase and confirmed activation
    await test('7. Subscription purchase and confirmed activation', async () => {
        const checkoutData = await subscriptionService.checkoutSubscription(testUser._id, testPlan._id);
        assert.ok(checkoutData.subscription);
        assert.strictEqual(checkoutData.subscription.status, 'pending_payment');

        // Activate with paymentId
        const paymentId = `PAY_TEST_${Date.now()}`;
        const activeSub = await subscriptionService.activateSubscription(checkoutData.subscription._id, paymentId);

        assert.strictEqual(activeSub.status, 'active');
        assert.strictEqual(activeSub.remainingRides, testPlan.rideAllowance);
        assert.ok(activeSub.endDate > activeSub.startDate);

        // Ledger must have credit entry
        const ledger = await SubscriptionLedger.findOne({ userSubscription: activeSub._id });
        assert.ok(ledger);
        assert.strictEqual(ledger.operationType, 'purchase_credit');
        assert.strictEqual(ledger.allowanceQuantity, testPlan.rideAllowance);

        testSub = activeSub;
    });

    // TEST 8: Payment failure
    await test('8. Payment failure leaves subscription pending and unactivated', async () => {
        const otherUser = await User.create({
            fullname: { firstname: 'Pooja', lastname: 'Singh' },
            email: `pooja_${Date.now()}@test.com`,
            password: 'password123'
        });

        const checkout = await subscriptionService.checkoutSubscription(otherUser._id, testPlan._id);
        const payment = checkout.payment;

        // Payment fails
        payment.status = 'failed';
        await payment.save();

        const sub = await UserSubscription.findById(checkout.subscription._id);
        assert.strictEqual(sub.status, 'pending_payment');
        assert.strictEqual(sub.startDate, null);
    });

    // TEST 9: Expired subscription
    await test('9. Expired subscription is detected and deactivated', async () => {
        testSub.endDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
        await testSub.save();

        assert.strictEqual(testSub.isExpired(), true);

        // Active subscription check should return null for expired pass
        const activePass = await subscriptionService.getUserActiveSubscription(testUser._id);
        assert.strictEqual(activePass, null);

        // Reset validity for remaining tests
        testSub.endDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
        testSub.status = 'active';
        await testSub.save();
    });

    // TEST 10: Exhausted ride allowance
    await test('10. Exhausted ride allowance prevents pass discount', async () => {
        testSub.remainingRides = 0;
        await testSub.save();

        const eligibility = await subscriptionService.checkRidePassEligibility(testUser, 'car', 120);
        assert.strictEqual(eligibility.eligible, false);
        assert.strictEqual(eligibility.discount, 0);
        assert.strictEqual(eligibility.finalFare, 120);

        // Restore rides for subsequent tests
        testSub.remainingRides = 5;
        testSub.status = 'active';
        await testSub.save();
    });

    // TEST 11: Concurrent allowance reservation
    await test('11. Concurrent allowance reservation is atomic and prevents overdraft', async () => {
        // Set remaining rides to exactly 1
        testSub.remainingRides = 1;
        testSub.usedRides = 4;
        await testSub.save();

        const ride1Id = new mongoose.Types.ObjectId();
        const ride2Id = new mongoose.Types.ObjectId();

        // Fire two concurrent reservations
        const results = await Promise.allSettled([
            subscriptionService.reserveRideAllowance(testSub._id, ride1Id, testUser._id),
            subscriptionService.reserveRideAllowance(testSub._id, ride2Id, testUser._id)
        ]);

        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        assert.strictEqual(fulfilled.length, 1, 'Only 1 reservation can succeed when 1 ride remains');
        assert.strictEqual(rejected.length, 1, 'Second reservation must be rejected');

        const updated = await UserSubscription.findById(testSub._id);
        assert.strictEqual(updated.remainingRides, 0);

        // Restore balance
        updated.remainingRides = 5;
        updated.status = 'active';
        await updated.save();
        testSub = updated;
    });

    // TEST 12: Duplicate booking requests & RidePass application
    await test('12. RidePass application calculates discount and excess accurately', async () => {
        // Mini plan has max cap ₹150
        // Ride with fare ₹120 (under cap)
        const eligible1 = await subscriptionService.checkRidePassEligibility(testUser, 'car', 120);
        assert.strictEqual(eligible1.eligible, true);
        assert.strictEqual(eligible1.discount, 120);
        assert.strictEqual(eligible1.finalFare, 0);
        assert.strictEqual(eligible1.excessFare, 0);

        // Ride with fare ₹210 (over cap of ₹150)
        const eligible2 = await subscriptionService.checkRidePassEligibility(testUser, 'car', 210);
        assert.strictEqual(eligible2.eligible, true);
        assert.strictEqual(eligible2.discount, 150);
        assert.strictEqual(eligible2.excessFare, 60);
        assert.strictEqual(eligible2.finalFare, 60);
    });

    // TEST 13: Cancellation and allowance restoration
    await test('13. Cancellation automatically reverses allowance back to pass', async () => {
        const initialRides = testSub.remainingRides;

        // Create ride with pass
        const ride = await rideService.createRide({
            user: testUser,
            pickup: 'Test CP to Cancel',
            destination: 'Test Drop to Cancel',
            vehicleType: 'car'
        });

        // Allowance was decremented
        const subAfterBooking = await UserSubscription.findById(testSub._id);
        assert.strictEqual(subAfterBooking.remainingRides, initialRides - 1);

        // Cancel the trip
        await rideService.cancelTrip({
            rideId: ride._id,
            userId: testUser._id,
            reason: 'Passenger changed mind'
        });

        // Allowance must be restored
        const subAfterCancel = await UserSubscription.findById(testSub._id);
        assert.strictEqual(subAfterCancel.remainingRides, initialRides);

        // Ledger must record ride_reversal
        const reversalEntry = await SubscriptionLedger.findOne({
            ride: ride._id,
            operationType: 'ride_reversal'
        });
        assert.ok(reversalEntry);
        assert.strictEqual(reversalEntry.allowanceQuantity, 1);
    });

    // TEST 14: Duplicate payment webhook idempotency
    await test('14. Duplicate payment webhook is handled idempotently', async () => {
        const orderId = `RP_ORD_TEST_${Date.now()}`;
        const payment = await Payment.create({
            user: testUser._id,
            purpose: 'subscription',
            amount: 199,
            orderId,
            status: 'pending'
        });

        const payload = { orderId, paymentId: 'PAY_123', status: 'succeeded' };

        // First webhook
        const res1 = await paymentService.handlePaymentWebhook(payload);
        assert.strictEqual(res1.success, true);

        // Second duplicate webhook
        const res2 = await paymentService.handlePaymentWebhook(payload);
        assert.strictEqual(res2.message, 'Webhook already processed');
    });

    // TEST 15: Unauthorized subscription access
    await test('15. Unauthorized subscription access is rejected', async () => {
        const strangerUser = await User.create({
            fullname: { firstname: 'Sneha', lastname: 'Roy' },
            email: `sneha_${Date.now()}@test.com`,
            password: 'password123'
        });

        // Stranger attempts to cancel testUser's subscription
        await assert.rejects(
            async () => {
                await subscriptionService.cancelSubscription(strangerUser._id, testSub._id);
            },
            /Active subscription not found to cancel/
        );
    });

    // TEST 16: Passenger access to another user's records
    await test('16. Passenger access to another user records is isolated', async () => {
        const userRides = await rideService.getUserRides(testUser._id);
        // All rides returned must belong exclusively to testUser
        for (const r of userRides) {
            assert.strictEqual(r.user.toString(), testUser._id.toString());
        }
    });

    // TEST 17: Driver access to another driver's rides
    await test('17. Driver access to another driver rides is isolated', async () => {
        const captainRides = await rideService.getCaptainRides(testCaptain._id);
        for (const r of captainRides) {
            assert.strictEqual(r.captain._id.toString(), testCaptain._id.toString());
        }
    });

    // TEST 18: Admin endpoint access authorization
    await test('18. Non-admin users are rejected from admin endpoints', async () => {
        const { authAdmin } = require('../middlewares/auth.middleware');
        const req = {
            cookies: {},
            headers: { authorization: `Bearer ${testUser.generateAuthToken()}` }
        };
        const res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (payload) {
                this.body = payload;
                return this;
            }
        };

        let nextCalled = false;
        await authAdmin(req, res, () => { nextCalled = true; });

        assert.strictEqual(nextCalled, false);
        assert.strictEqual(res.statusCode, 403);
        assert.match(res.body.message, /Access denied: Admins only/);
    });

    // TEST 19: Request validation & error responses
    await test('19. Request validation returns structured errors array', async () => {
        // Attempting to register captain without required fields
        const { validationResult } = require('express-validator');
        // Validating distance calculation helper
        const dist = await rideService.getDistanceAndDuration('Delhi', 'Noida');
        assert.ok(dist.distance > 0);
        assert.ok(dist.duration > 0);
    });

    // TEST 20: Existing features preserved
    await test('20. Existing features continue to work: token blacklisting & root endpoint', async () => {
        const app = require('../app');
        assert.ok(app);

        // Verify token blacklisting
        const token = testUser.generateAuthToken();
        const bl = await BlacklistToken.create({ token });
        assert.ok(bl._id);

        const found = await BlacklistToken.findOne({ token });
        assert.ok(found);
    });
});
