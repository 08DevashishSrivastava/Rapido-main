const mongoose = require('mongoose');

const subscriptionLedgerSchema = new mongoose.Schema({
    userSubscription: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userSubscription',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        default: null
    },
    operationType: {
        type: String,
        enum: ['purchase_credit', 'ride_reservation', 'ride_consumption', 'ride_reversal', 'admin_adjustment', 'expiry_forfeit'],
        required: true
    },
    allowanceQuantity: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    reason: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('subscriptionLedger', subscriptionLedgerSchema);
