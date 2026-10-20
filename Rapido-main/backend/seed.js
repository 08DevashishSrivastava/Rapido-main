const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const connectToDb = require('./db/db');
const SubscriptionPlan = require('./models/subscriptionPlan.model');

const defaultPlans = [
    {
        name: 'RidePass Mini',
        slug: 'mini',
        tagline: 'Ideal for weekly commuters & light travel',
        description: 'Enjoy 5 heavily discounted or free rides up to ₹150 each, valid for 7 days.',
        price: 199,
        currency: 'INR',
        validityDays: 7,
        rideAllowance: 5,
        maxFarePerRide: 150,
        allowedVehicleTypes: ['car', 'motorcycle', 'auto'],
        excessFarePolicy: 'pay_difference',
        features: [
            '5 Included Rides up to ₹150 each',
            'Valid for 7 days across Car, Auto & Bike',
            'Pay only the excess fare if ride exceeds ₹150',
            'Priority driver matching & surge immunity'
        ],
        badge: 'Weekly Pack',
        isPopular: false,
        isActive: true
    },
    {
        name: 'RidePass Student',
        slug: 'student',
        tagline: 'Budget-friendly daily campus commuting',
        description: 'Designed for college and university students with 20 rides up to ₹200 each for 30 days.',
        price: 499,
        currency: 'INR',
        validityDays: 30,
        rideAllowance: 20,
        maxFarePerRide: 200,
        allowedVehicleTypes: ['car', 'motorcycle', 'auto'],
        excessFarePolicy: 'pay_difference',
        features: [
            '20 Rides included (up to ₹200 each)',
            'Valid for 30 days',
            'Zero peak-hour pricing up to cap',
            'Free instant cancellations'
        ],
        badge: 'Student Special',
        isPopular: true,
        isActive: true
    },
    {
        name: 'RidePass Pro',
        slug: 'pro',
        tagline: 'Maximum savings for frequent corporate commuters',
        description: 'Our premier pass with 50 rides up to ₹300 each, VIP matching, and zero surge pricing.',
        price: 999,
        currency: 'INR',
        validityDays: 30,
        rideAllowance: 50,
        maxFarePerRide: 300,
        allowedVehicleTypes: ['car', 'motorcycle', 'auto'],
        excessFarePolicy: 'pay_difference',
        features: [
            '50 Rides included (up to ₹300 each)',
            'Valid for 30 days on all vehicle categories',
            'Guaranteed zero surge charges',
            'Dedicated 24/7 priority customer support',
            'Up to ₹15,000 in monthly travel value'
        ],
        badge: 'Best Value',
        isPopular: false,
        isActive: true
    }
];

async function seed() {
    try {
        await connectToDb();

        console.log('\n\x1b[36m📦  Seeding database...\x1b[0m\n');

        // Subscription Plans
        const existing = await SubscriptionPlan.countDocuments();
        if (existing === 0) {
            await SubscriptionPlan.insertMany(defaultPlans);
            console.log('\x1b[32m✅  Subscription Plans inserted:\x1b[0m');
            defaultPlans.forEach(p => console.log(`   - ${p.name} (₹${p.price})`));
        } else {
            console.log(`\x1b[33m⚠️  Subscription Plans already exist (${existing} found), skipping...\x1b[0m`);
        }

        console.log('\n\x1b[32m╔══════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[32m║   ✅  Database Seeding Complete!              ║\x1b[0m');
        console.log('\x1b[32m║   📦  Database : ridepass_pro                ║\x1b[0m');
        console.log('\x1b[32m╚══════════════════════════════════════════════╝\x1b[0m\n');

        process.exit(0);
    } catch (err) {
        console.error('\x1b[31m❌  Seeding failed:\x1b[0m', err.message);
        process.exit(1);
    }
}

seed();
