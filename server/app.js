require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const problemRoutes = require('./routes/problems');
const adminRoutes = require('./routes/admin');
const proposalRoutes = require('./routes/proposals');
const impactRoutes = require('./routes/impact');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SamasyaSetu API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Also support paths without /api prefix when proxied through serverless functions
app.use('/auth', authRoutes);
app.use('/problems', problemRoutes);
app.use('/admin', adminRoutes);
app.use('/proposals', proposalRoutes);
app.use('/impact', impactRoutes);
app.use('/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SamasyaSetu API',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static build if in production
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/.netlify')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Catch-all 404 handler to debug pathing issues
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Route not found in Express',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

module.exports = app;
