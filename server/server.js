require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

console.log('🔍 Starting server initialization...');
console.log('📝 Environment variables:');
console.log('- PORT:', process.env.PORT);
console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('- CLOUDINARY_NAME exists:', !!process.env.CLOUDINARY_NAME);
console.log('- CLOUDINARY_API_KEY exists:', !!process.env.CLOUDINARY_API_KEY);
console.log('- CLOUDINARY_API_SECRET exists:', !!process.env.CLOUDINARY_API_SECRET);

const app = express();

// Trust proxy for production deployments
app.set('trust proxy', 1);

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 ${timestamp} - ${req.method} ${req.url}`);
  
  // Log body for POST/PUT requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '[HIDDEN]';
    if (logBody.token) logBody.token = '[HIDDEN]';
    console.log('📥 Body:', JSON.stringify(logBody, null, 2));
  }
  
  // Log auth header presence
  const authHeader = req.header('Authorization') || req.header('x-auth-token');
  console.log('🔐 Auth header present:', !!authHeader);
  
  next();
});

// Health check route
app.get('/', (req, res) => {
  console.log('✅ Root route hit');
  res.json({ 
    message: 'NoVeg API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Load routes with enhanced error handling
let authRoutes, productRoutes, userRoutes, cartRoutes, orderRoutes;

try {
  authRoutes = require('./routes/authRoutes');
  console.log('✅ authRoutes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load authRoutes:', error.message);
  process.exit(1);
}

try {
  productRoutes = require('./routes/productRoutes');
  console.log('✅ productRoutes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load productRoutes:', error.message);
  process.exit(1);
}

try {
  userRoutes = require('./routes/userRoutes');
  console.log('✅ userRoutes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load userRoutes:', error.message);
  process.exit(1);
}

try {
  cartRoutes = require('./routes/cartRoutes');
  console.log('✅ cartRoutes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load cartRoutes:', error.message);
  process.exit(1);
}

// Load order routes
try {
  orderRoutes = require('./routes/orderRoutes');
  console.log('✅ orderRoutes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load orderRoutes:', error.message);
  process.exit(1);
}

const createIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes...');
    
    // Product indexes
    await mongoose.connection.db.collection('products').createIndex({ category: 1 });
    await mongoose.connection.db.collection('products').createIndex({ shopId: 1 });
    await mongoose.connection.db.collection('products').createIndex({ createdAt: -1 });
    await mongoose.connection.db.collection('products').createIndex({ category: 1, createdAt: -1 });
    await mongoose.connection.db.collection('products').createIndex({ shopId: 1, createdAt: -1 });
    
    // User indexes (email already exists from unique: true)
    await mongoose.connection.db.collection('users').createIndex({ role: 1 });
    await mongoose.connection.db.collection('users').createIndex({ isActive: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
};

// Rate limiting for API endpoints
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// 🛣️ Setup API routes with proper order (specific routes before parameterized ones)
app.use('/api/auth', (req, res, next) => {
  console.log('🔐 Auth route hit:', req.method, req.url);
  next();
}, authRoutes);

app.use('/api/products', (req, res, next) => {
  console.log('🛍️ Products route hit:', req.method, req.url);
  next();
}, productRoutes);

app.use('/api/user', (req, res, next) => {
  console.log('👤 User route hit:', req.method, req.url);
  next();
}, userRoutes);

app.use('/api/cart', (req, res, next) => {
  console.log('🛒 Cart route hit:', req.method, req.url);
  next();
}, cartRoutes);

// Add order routes
app.use('/api/orders', (req, res, next) => {
  console.log('📦 Orders route hit:', req.method, req.url);
  next();
}, orderRoutes);

// Catch-all route for undefined API endpoints
app.use('/api/*', (req, res) => {
  console.log('❌ Unmatched API route:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: 'API endpoint not found',
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/products',
      'POST /api/products',
      'GET /api/products/:id',
      'GET /api/products/similar',
      'GET /api/products/more-from-shop',
      'GET /api/user/profile',
      'PUT /api/user/update-address',
      'PUT /api/user/update-profile',
      'GET /api/user/orders',
      'GET /api/user/stats',
      'POST /api/cart/add',
      'GET /api/cart',
      'PUT /api/cart/update',
      'DELETE /api/cart/remove',
      'DELETE /api/cart/clear',
      'POST /api/cart/checkout',
      'POST /api/orders',
      'GET /api/orders',
      'GET /api/orders/:orderId',
      'PUT /api/orders/:orderId/status',
      'PUT /api/orders/:orderId/cancel',
      'GET /api/orders/stats'
    ]
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Global error handler:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      error: error.message
    });
  }
  
  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      message: `${field} already exists`,
      error: 'DUPLICATE_VALUE'
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired',
      error: 'TOKEN_EXPIRED'
    });
  }
  
  // Default server error
  res.status(error.status || 500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  });
});

// ✅ FIXED MongoDB connection - Removed deprecated options
console.log('🔌 Connecting to MongoDB...');

const connectDB = async () => {
  try {
    // ✅ Clean connection without deprecated options
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Connected to: ${conn.connection.host}`);
    
    // Create indexes after connection
    await createIndexes();
    
    // Start server after successful DB connection
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`🌐 Local: http://localhost:${PORT}`);
      console.log(`🌐 API Health: http://localhost:${PORT}/api/health`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Start the application
connectDB();

const path = require("path");

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/dist")));

// Serve index.html for all unknown routes (SPA fallback)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err);
  mongoose.connection.close(() => {
    process.exit(1);
  });
});