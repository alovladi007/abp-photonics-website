require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { WebSocketServer } = require('ws');
const http = require('http');

// Import routers
const authRouter = require('./api/auth/auth.router');
const patentRouter = require('./api/patent/patent.router');
const biotensorRouter = require('./api/biotensor/biotensor.router');
const cybersecurityRouter = require('./api/cybersecurity/cybersecurity.router');

// Import WebSocket handlers
const { setupBioTensorWS } = require('./websocket/biotensor.ws');
const { setupCybersecurityWS } = require('./websocket/cybersecurity.ws');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/patent', patentRouter);
app.use('/api/biotensor', biotensorRouter);
app.use('/api/cybersecurity', cybersecurityRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      auth: 'operational',
      patent: 'operational',
      biotensor: 'operational',
      cybersecurity: 'operational',
      websocket: 'operational'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ABP Photonics Unified Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      patent: '/api/patent',
      biotensor: '/api/biotensor',
      cybersecurity: '/api/cybersecurity'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      status: 404
    }
  });
});

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// Setup WebSocket handlers
setupBioTensorWS(wss);
setupCybersecurityWS(wss);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 ABP Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔒 CORS enabled for: ${process.env.ALLOWED_ORIGINS}`);
  console.log(`🛡️  Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS} requests per ${process.env.RATE_LIMIT_WINDOW_MS}ms`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server };