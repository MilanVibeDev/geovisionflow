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
const PORT = process.env.PORT || 5000;

app.use(cors());
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
