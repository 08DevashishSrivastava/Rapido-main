// const mongoose = require('mongoose');

// function connectToDb() {
//     mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true })
//         .then(() => console.log('Connected to DB'))
//         .catch(err => console.log(err));
// }

// module.exports = connectToDb;

// const mongoose = require('mongoose');

// function connectToDb() {
//     mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true })
//         .then(() => console.log('Connected to DB'))
//         .catch(err => console.log(err));
// }

// module.exports = connectToDb;



const mongoose = require('mongoose');

async function connectToDb() {
    const mongoUri = process.env.DB_CONNECT;
    if (!mongoUri) {
        throw new Error('DB_CONNECT is not set. Add your MongoDB connection string to backend/.env.');
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB successfully!');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB connection restored.');
});

module.exports = connectToDb;