const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Environment validation - CRITICAL for production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL ERROR: JWT_SECRET must be set in production!');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI not set, using default local MongoDB');
}

// Middleware
app.use(helmet());

// CORS Configuration - Supports multiple origins
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:8000', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('[OK] MongoDB connected successfully');
    console.log('[INFO] Database:', mongoose.connection.name);
  })
  .catch((err) => {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    process.exit(1);
  });

// MongoDB connection error handling
mongoose.connection.on('error', (err) => {
  console.error('[ERROR] MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[WARNING] MongoDB disconnected');
});

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const helpRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  publicData: {
    name: String,
    address: String,
    phone: String,
    email: String
  },
  privateData: {
    name: String,
    address: String,
    phone: String,
    email: String
  },
  helpType: { type: String, required: true },
  urgency: { type: String, required: true, enum: ['Critical', 'High', 'Medium', 'Low'] },
  description: { type: String, required: true },
  status: { type: String, default: 'open', enum: ['open', 'in-progress', 'closed'] },
  volunteerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const volunteerResponseSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', required: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'accepted', enum: ['pending', 'accepted', 'completed', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});

const resourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  location: { type: String, required: true },
  description: String,
  status: { type: String, default: 'available', enum: ['available', 'allocated', 'depleted'] },
  expirationDate: Date,
  createdAt: { type: Date, default: Date.now }
});

// Create indexes for better performance
userSchema.index({ email: 1 });
helpRequestSchema.index({ status: 1, urgency: 1, createdAt: -1 });
volunteerResponseSchema.index({ volunteerId: 1, requestId: 1 });
resourceSchema.index({ status: 1, type: 1 });

const User = mongoose.model('User', userSchema);
const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);
const VolunteerResponse = mongoose.model('VolunteerResponse', volunteerResponseSchema);
const Resource = mongoose.model('Resource', resourceSchema);

// Privacy Functions
const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 3)}-***-**${cleaned.slice(-2)}`;
  }
  return '***-***-****';
};

const maskName = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return `${name.slice(0, -1)}*`;
};

const maskAddress = (address) => {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length > 1) {
    const streetParts = parts[0].trim().split(' ');
    const street = streetParts.length > 1 ? streetParts.slice(1).join(' ') : 'Street';
    return `${street} area, ${parts.slice(-1)[0].trim()}`;
  }
  return 'General area';
};

const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskData = (data) => ({
  name: maskName(data.name),
  address: maskAddress(data.address),
  phone: maskPhone(data.phone),
  email: maskEmail(data.email)
});

// Validation Functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters for better security
  return password && password.length >= 8;
};

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Rate limiting configurations
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Root endpoint (no rate limiting)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Disaster Relief API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/signup, /api/auth/login',
      requests: '/api/requests',
      volunteer: '/api/volunteer',
      resources: '/api/resources'
    }
  });
});

// Auth Routes - with stricter rate limiting
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Input validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      phone: phone.trim(), 
      password: hashedPassword 
    });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'your-secret-key', 
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Apply general rate limiting to all other API routes
app.use('/api/', apiLimiter);

// Request Routes
app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { name, address, phone, email, helpType, urgency, description } = req.body;
    
    // Input validation
    if (!name || !address || !phone || !email || !helpType || !urgency || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!['Critical', 'High', 'Medium', 'Low'].includes(urgency)) {
      return res.status(400).json({ error: 'Invalid urgency level' });
    }
    
    const privateData = { name, address, phone, email };
    const publicData = maskData(privateData);
    
    const request = new HelpRequest({
      userId: req.userId,
      publicData,
      privateData,
      helpType,
      urgency,
      description,
      status: 'open'
    });
    
    await request.save();
    res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: 'Server error creating request' });
  }
});

app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { status, helpType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (helpType) filter.helpType = helpType;
    
    // Custom urgency sort order
    const urgencyOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    const requests = await HelpRequest.find(filter).sort({ createdAt: -1 });
    
    // Sort by urgency manually
    requests.sort((a, b) => {
      const urgencyDiff = (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    const responses = await VolunteerResponse.find({ volunteerId: req.userId });
    const authorizedRequestIds = responses.map(r => r.requestId.toString());
    
    const processedRequests = requests.map(requestObj => {
      const isAuthorized = authorizedRequestIds.includes(requestObj._id.toString()) || 
                          requestObj.userId.toString() === req.userId.toString();
      
      return {
        ...requestObj.toObject(),
        displayData: isAuthorized ? requestObj.privateData : requestObj.publicData,
        isAuthorized
      };
    });
    
    res.json(processedRequests);
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Server error fetching requests' });
  }
});

// Volunteer Routes
app.post('/api/volunteer', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }
    
    // Check if request exists
    const request = await HelpRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Check if already volunteered
    const existing = await VolunteerResponse.findOne({ 
      requestId, 
      volunteerId: req.userId 
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Already volunteered for this request' });
    }
    
    const response = new VolunteerResponse({
      requestId,
      volunteerId: req.userId,
      status: 'accepted'
    });
    
    await response.save();
    await HelpRequest.findByIdAndUpdate(requestId, { $inc: { volunteerCount: 1 } });
    
    res.status(201).json({ success: true, response });
  } catch (err) {
    console.error('Volunteer error:', err);
    res.status(500).json({ error: 'Server error volunteering for request' });
  }
});

app.get('/api/my-volunteers', authMiddleware, async (req, res) => {
  try {
    const responses = await VolunteerResponse.find({ volunteerId: req.userId })
      .populate('requestId');
    
    const requests = responses
      .filter(r => r.requestId !== null)
      .map(r => ({
        ...r.requestId.toObject(),
        displayData: r.requestId.privateData,
        isAuthorized: true
      }));
    
    res.json(requests);
  } catch (err) {
    console.error('Get my volunteers error:', err);
    res.status(500).json({ error: 'Server error fetching volunteer commitments' });
  }
});

// Resource Routes
app.post('/api/resources', authMiddleware, async (req, res) => {
  try {
    const { type, quantity, location, description, expirationDate } = req.body;
    
    // Input validation
    if (!type || !quantity || !location) {
      return res.status(400).json({ error: 'Type, quantity, and location are required' });
    }
    
    if (quantity < 0) {
      return res.status(400).json({ error: 'Quantity must be positive' });
    }
    
    const resource = new Resource({
      userId: req.userId,
      type,
      quantity,
      location,
      description,
      expirationDate,
      status: 'available'
    });
    
    await resource.save();
    res.status(201).json({ success: true, resource });
  } catch (err) {
    console.error('Create resource error:', err);
    res.status(500).json({ error: 'Server error creating resource' });
  }
});

app.get('/api/resources', authMiddleware, async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'available' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(resources);
  } catch (err) {
    console.error('Get resources error:', err);
    res.status(500).json({ error: 'Server error fetching resources' });
  }
});

app.patch('/api/resources/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'allocated', 'depleted'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const resource = await Resource.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    // Authorization check - user must own the resource
    if (resource.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this resource' });
    }
    
    resource.status = status;
    await resource.save();
    
    res.json({ success: true, resource });
  } catch (err) {
    console.error('Update resource error:', err);
    res.status(500).json({ error: 'Server error updating resource' });
  }
});

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[INFO] Server running on port ${PORT}`);
  console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[INFO] API URL: http://localhost:${PORT}`);
  console.log(`[INFO] Allowed origins: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[INFO] HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('[INFO] MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('[INFO] HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('[INFO] MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;