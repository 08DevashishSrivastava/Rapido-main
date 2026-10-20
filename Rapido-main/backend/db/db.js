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

        const dbName = mongoose.connection.db.databaseName;

        console.log('\n\x1b[32m╔══════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[32m║   ✅  MongoDB Connected Successfully!         ║\x1b[0m');
        console.log('\x1b[32m╠══════════════════════════════════════════════╣\x1b[0m');
        console.log(`\x1b[36m║   📦  Database : \x1b[1m${dbName.padEnd(28)}\x1b[0m\x1b[36m║\x1b[0m`);
        console.log(`\x1b[36m║   🌐  Host     : MongoDB Atlas (Cloud)       ║\x1b[0m`);
        console.log('\x1b[32m╚══════════════════════════════════════════════╝\x1b[0m\n');

    } catch (error) {
        console.error('\n\x1b[31m╔══════════════════════════════════════════════╗\x1b[0m');
        console.error('\x1b[31m║   ❌  MongoDB Connection Failed!              ║\x1b[0m');
        console.error(`\x1b[31m║   Error: ${error.message.substring(0, 36).padEnd(36)}║\x1b[0m`);
        console.error('\x1b[31m╚══════════════════════════════════════════════╝\x1b[0m\n');
        throw error;
    }
}

mongoose.connection.on('disconnected', () => {
    console.warn('\x1b[33m⚠️  MongoDB connection disconnected.\x1b[0m');
});

mongoose.connection.on('reconnected', () => {
    console.log('\x1b[32m🔄  MongoDB connection restored.\x1b[0m');
});

module.exports = connectToDb;