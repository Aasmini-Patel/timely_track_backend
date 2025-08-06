import express from 'express';
import dotEnv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import { databaseConnect } from './database/connection.js';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// routes import
import authRoutes from "./routes/authRoute.js";
import taskRoutes from "./routes/taskRoute.js";

// Load environment variables from .env file
dotEnv.config({ path: "./.env" });

// Create an instance of an Express application
const app = express();

// Middleware for security headers
app.use(helmet());

// Middleware to parse incoming JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev'));

// Middleware to enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));


// rate limit
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Root Route
app.get('/', (req, res) => {
    res.json({ message: `🚀 Server running on PORT - ${PORT}` });
});

// routers
app.use("/api", [ authRoutes, taskRoutes ]);

// error handling middlewares
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const server = http.createServer(app);

// database connection
databaseConnect();

// Define the port (use .env file or fallback to 5000)
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on PORT - ${PORT}`);
});