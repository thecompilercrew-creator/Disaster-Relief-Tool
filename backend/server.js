const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
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
  urgency: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'open' },
  volunteerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const volunteerResponseSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'HelpRequest', required: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const resourceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  quantity: { type: Number, required: true },
  location: { type: String, required: true },
  description: String,
  status: { type: String, default: 'available' },
  expirationDate: Date,
  createdAt: { type: Date, default: Date.now }
});

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
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return `${name.slice(0, -1)}*`;
};

const maskAddress = (address) => {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length > 1) {
    return `${parts[0].split(' ').slice(1).join(' ')}, ${parts.slice(-1)[0].trim()}`;
  }
  return 'General area';
};

const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskData = (data) => ({
  name: maskName(data.name),
  address: maskAddress(data.address),
  phone: maskPhone(data.phone),
  email: maskEmail(data.email)
});

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { name, address, phone, email, helpType, urgency, description } = req.body;
    
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
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { status, helpType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (helpType) filter.helpType = helpType;
    
    const requests = await HelpRequest.find(filter).sort({ urgency: -1, createdAt: -1 });
    
    const responses = await VolunteerResponse.find({ volunteerId: req.userId });
    const authorizedRequestIds = responses.map(r => r.requestId.toString());
    
    const processedRequests = requests.map(req => {
      const isAuthorized = authorizedRequestIds.includes(req._id.toString()) || 
                          req.userId.toString() === req.userId;
      
      return {
        ...req.toObject(),
        displayData: isAuthorized ? req.privateData : req.publicData,
        isAuthorized
      };
    });
    
    res.json(processedRequests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/volunteer', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.body;
    
    const existing = await VolunteerResponse.findOne({ requestId, volunteerId: req.userId });
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
    
    res.json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/my-volunteers', authMiddleware, async (req, res) => {
  try {
    const responses = await VolunteerResponse.find({ volunteerId: req.userId })
      .populate('requestId');
    
    const requests = responses.map(r => ({
      ...r.requestId.toObject(),
      displayData: r.requestId.privateData,
      isAuthorized: true
    }));
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', authMiddleware, async (req, res) => {
  try {
    const { type, quantity, location, description, expirationDate } = req.body;
    
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
    res.json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/resources', authMiddleware, async (req, res) => {
  try {
    const resources = await Resource.find({ status: 'available' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/resources/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    res.json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
