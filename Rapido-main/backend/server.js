// const http = require('https');
// const app = require('./app');
// const port = process.env.PORT || 3000;

// const server = http.createServer(app);



// server.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });


// require('dotenv').config();

// const http = require('http');
// const app = require('./app');
// const connectToDb = require('./config/db');

// const port = process.env.PORT || 4000;

// async function startServer() {
//     try {
//         await connectToDb();

//         const server = http.createServer(app);

//         server.listen(port, () => {
//             console.log(`Server is running on port ${port}`);
//         });
//     } catch (err) {
//         console.error('Database connection failed:', err.message);
//     }
// }

// startServer();


// const http = require('http');
// const app = require('./app');
// const port = process.env.PORT || 4000;

// const server = http.createServer(app);

// server.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
// });



require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectToDb = require('./db/db');

const port = process.env.PORT || 4000;

async function startServer() {
    try {
        await connectToDb();

        http.createServer(app).listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exitCode = 1;
    }
}

startServer();
