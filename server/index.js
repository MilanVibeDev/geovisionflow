const dotenv = require('dotenv');
dotenv.config();

// Global error handlers to catch boot-time crashes
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION:', reason);
});

console.log('🚀 Server is starting...');

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const argPort = (() => {
    const idx = process.argv.indexOf('--port');
    if (idx !== -1 && process.argv[idx + 1]) return Number(process.argv[idx + 1]);
    return null;
})();

const PORT = process.env.PORT ? Number(process.env.PORT) : (argPort || 5000);

// Explicit CORS configuration for production environments
const allowedOrigins = [
  'https://geovisionflow.com',
  'https://www.geovisionflow.com',
  'https://geovisionflow-api.onrender.com',
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
console.log('📦 Loading API routes...');
app.use('/api', require('./routes/api'));

// Serve Static Files from React App
const distPath = path.join(__dirname, '../client/dist');
console.log(`📂 Checking static files path: ${distPath}`);
app.use(express.static(distPath));

// Handle SPA routing (redirect all non-API requests to index.html)
app.get(/(.*)/, (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Mode: ${process.env.NODE_ENV || 'development'}`);
});
