# 🚀 Quick Start Guide

Get your Disaster Relief app running in **10 minutes**!

## Step 1: Setup Backend (5 minutes)

### Option A: Using Setup Script (Easiest)
```bash
# Navigate to backend folder
cd backend

# Make setup script executable (Mac/Linux)
chmod +x setup.sh

# Run setup script
./setup.sh

# Edit .env file with your MongoDB URI
nano .env  # or use any text editor
```

### Option B: Manual Setup
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Edit .env file - paste the generated secret and add MongoDB URI
nano .env
```

## Step 2: Get MongoDB Connection String (3 minutes)

### For Quick Testing (Local MongoDB)
```bash
# In .env file, use:
MONGODB_URI=mongodb://localhost:27017/disaster_relief
```

### For Production (MongoDB Atlas - Free)
1. Go to https://cloud.mongodb.com
2. Sign up/Login
3. Click "Build a Database" → "Free" (M0)
4. Choose cloud provider and region
5. Click "Create"
6. Create database user:
   - Username: `admin`
   - Password: Generate secure password
   - Click "Create User"
7. Add IP Address:
   - Click "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
8. Get connection string:
   - Go back to "Database"
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your actual password
   - Paste into `.env` file as `MONGODB_URI`

**Example:**
```env
MONGODB_URI=mongodb+srv://admin:MySecurePass123@cluster0.abc123.mongodb.net/disaster_relief?retryWrites=true&w=majority
```

## Step 3: Start Backend (1 minute)

```bash
# Development mode (auto-restart on changes)
npm run dev

# Or production mode
npm start
```

You should see:
```
Server running on port 5000
```

## Step 4: Setup Frontend (2 minutes)

```bash
# Open new terminal, navigate to frontend folder
cd frontend

# Option A: Using Python
python3 -m http.server 8000

# Option B: Using Node.js
npx http-server -p 8000

# Option C: Just open index.html in browser
# (Right-click index.html → Open with → Chrome/Firefox)
```

## Step 5: Test the App! (2 minutes)

1. Open browser: http://localhost:8000
2. Click "Sign up"
3. Create account with:
   - Name: Test User
   - Email: test@example.com
   - Phone: 555-123-4567
   - Password: password123
4. Click "Sign Up"
5. You're in! Try:
   - Click "Request Help" → Fill form → Submit
   - View the request (notice masked contact info 🔒)
   - Click "I Can Help" (full info revealed! ✅)

## ✅ Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend accessible in browser
- [ ] Can sign up new account
- [ ] Can login
- [ ] Can create help request
- [ ] Can see masked data
- [ ] Can volunteer and see full data
- [ ] Can add resources

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is already in use
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process or change PORT in .env
```

### MongoDB connection fails
```bash
# Error: "MongoNetworkError" or "Authentication failed"
# Solution: Double-check:
# 1. Connection string is correct
# 2. Password has no special characters that need encoding
# 3. IP whitelist includes 0.0.0.0/0
# 4. User has read/write permissions
```

### Frontend can't connect to backend
```javascript
// In index.html, check API_URL is correct:
const API_URL = 'http://localhost:5000/api';

// Clear browser cache and localStorage:
// Press F12 → Console tab → Type:
localStorage.clear();
// Then refresh page
```

### "Token invalid" error
```javascript
// Clear stored token
localStorage.clear();
// Refresh and login again
```

## 📝 Your .env File Should Look Like This

```env
MONGODB_URI=mongodb+srv://admin:YourPassword@cluster0.xxxxx.mongodb.net/disaster_relief?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
PORT=5000
NODE_ENV=development
```

## 🎉 Next Steps

Now that it's working locally:
1. Read [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy online
2. Share with friends and test thoroughly
3. Add more features (see README.md roadmap)

## 💡 Quick Tips

### Start both backend and frontend together:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && python3 -m http.server 8000
```

### View database data:
1. MongoDB Atlas: Use built-in "Browse Collections"
2. Local MongoDB: Install MongoDB Compass
3. Or use mongoose queries in Node.js

### Generate test data:
```bash
# In browser console (F12):
// Sign up 5 test users and create requests
```

## 📞 Need Help?

- Check backend logs in terminal
- Check browser console (F12) for frontend errors
- Read full [README.md](./README.md)
- See detailed [DEPLOYMENT.md](./DEPLOYMENT.md)

**Common Issues:**
- Port 5000 in use → Change PORT in .env
- MongoDB connection → Check connection string
- CORS errors → Backend must be running

---

**You should be up and running in 10 minutes! 🚀**

If something doesn't work, check the Troubleshooting section above.