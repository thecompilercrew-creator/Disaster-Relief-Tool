# 🚀 Complete Deployment Guide - Disaster Relief Tool

## Prerequisites
- Node.js installed (v16 or higher)
- Git installed
- MongoDB Atlas account (free)
- Code editor (VS Code recommended)

---

## Part 1: Local Setup & Testing (30 minutes)

### Step 1: Create Project Structure
```bash
# Create project folder
mkdir disaster-relief-app
cd disaster-relief-app

# Create backend folder
mkdir backend
cd backend

# Initialize Node.js project
npm init -y
```

### Step 2: Install Backend Dependencies
```bash
npm install express mongoose bcrypt jsonwebtoken cors helmet express-rate-limit dotenv
npm install --save-dev nodemon
```

### Step 3: Setup Backend Files
1. Create `server.js` - Copy the backend server code
2. Create `package.json` - Copy the package.json code
3. Create `.env` file - Copy the .env configuration
4. Create `.gitignore`:
```
node_modules/
.env
.DS_Store
```

### Step 4: Setup MongoDB Database

**Option A: Local MongoDB (for testing)**
```bash
# Install MongoDB locally
# macOS: brew install mongodb-community
# Windows: Download from mongodb.com
# Linux: sudo apt-get install mongodb

# Start MongoDB
mongod
```

**Option B: MongoDB Atlas (recommended for deployment)**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a free cluster (M0 Sandbox)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database password
7. Update `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/disaster_relief?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-change-this-12345
PORT=5000
```

### Step 5: Test Backend Locally
```bash
# Start the backend server
npm run dev

# You should see: "Server running on port 5000"
```

### Step 6: Setup Frontend
```bash
# Go back to project root
cd ..

# Create frontend folder
mkdir frontend
cd frontend

# Create index.html - Copy the frontend HTML code
```

### Step 7: Test Frontend Locally
```bash
# Option A: Using Python
python -m http.server 8000

# Option B: Using Node.js http-server
npx http-server -p 8000

# Open browser: http://localhost:8000
```

### Step 8: Update Frontend API URL
In `index.html`, update the API_URL:
```javascript
// For local testing
const API_URL = 'http://localhost:5000/api';

// For production (update after backend deployment)
const API_URL = 'https://your-backend-url.com/api';
```

---

## Part 2: Deploy Backend (Railway - Easiest)

### Step 1: Prepare Backend for Deployment
```bash
cd backend

# Initialize git repository
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Connect your GitHub account
6. Create new repository and push code:

```bash
# Create GitHub repository (on github.com)
# Then push your code:
git remote add origin https://github.com/yourusername/disaster-relief-backend.git
git branch -M main
git push -u origin main
```

### Step 3: Configure Railway
1. Select your repository
2. Railway will auto-detect Node.js
3. Add environment variables:
   - Click "Variables" tab
   - Add `MONGODB_URI` (your MongoDB Atlas connection string)
   - Add `JWT_SECRET` (generate a secure random string)
   - Add `PORT` (Railway provides this automatically, but you can set 5000)

### Step 4: Deploy
1. Railway automatically deploys
2. Wait 2-3 minutes
3. Click "Settings" → Copy the deployment URL
4. Your backend is live! (e.g., `https://disaster-relief-backend-production.up.railway.app`)

### Alternative: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect repository
5. Configure:
   - Name: disaster-relief-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables (same as Railway)
7. Click "Create Web Service"

---

## Part 3: Deploy Frontend (Netlify - Easiest)

### Step 1: Update Frontend API URL
In `index.html`, replace:
```javascript
const API_URL = 'https://your-railway-url.up.railway.app/api';
```

### Step 2: Deploy to Netlify
1. Go to [netlify.com](https://www.netlify.com)
2. Sign up with GitHub
3. Drag and drop your `frontend` folder
4. Or click "New site from Git":
   - Connect GitHub
   - Select repository
   - Build settings: Leave empty (static HTML)
   - Publish directory: `frontend`
5. Click "Deploy site"
6. Your app is live! (e.g., `https://disaster-relief-app.netlify.app`)

### Alternative: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import repository
5. Configure:
   - Framework Preset: Other
   - Root Directory: `frontend`
6. Click "Deploy"

### Alternative: Deploy to GitHub Pages
```bash
cd frontend

# Create gh-pages branch
git checkout -b gh-pages

# Push to GitHub
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages

# Enable GitHub Pages in repository settings
# Select gh-pages branch
# Your site: https://yourusername.github.io/disaster-relief-app
```

---

## Part 4: Configure CORS for Production

Update `server.js` CORS configuration:

```javascript
// Replace the CORS line with:
app.use(cors({
  origin: [
    'http://localhost:8000',
    'https://your-netlify-url.netlify.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

Redeploy backend after this change.

---

## Part 5: Custom Domain (Optional)

### For Frontend (Netlify)
1. Buy domain from Namecheap/GoDaddy ($10-15/year)
2. In Netlify: "Domain settings" → "Add custom domain"
3. Follow DNS configuration instructions
4. Enable HTTPS (automatic)

### For Backend (Railway)
1. Railway supports custom domains on paid plan ($5/month)
2. Or use the provided Railway URL

---

## Part 6: Post-Deployment Checklist

### ✅ Test Everything
1. Visit your frontend URL
2. Sign up with test account
3. Login successfully
4. Submit help request
5. View requests (verify data masking)
6. Volunteer for a request
7. Verify full contact details appear
8. Add a resource
9. View resources list
10. Test on mobile phone

### ✅ Monitor Your App
- **Railway Dashboard**: Monitor logs, resource usage
- **MongoDB Atlas**: Check database connections
- **Netlify Analytics**: View visitor statistics

### ✅ Security Checks
- [ ] `.env` file is in `.gitignore`
- [ ] JWT secret is strong and unique
- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0 for Railway)
- [ ] HTTPS is enabled (automatic on Railway/Netlify)
- [ ] CORS is properly configured

---

## Cost Summary

### Free Tier (First 3 months)
- **Railway**: $5 free credit/month (enough for small app)
- **MongoDB Atlas**: Free 512MB database
- **Netlify**: Free unlimited bandwidth
- **Total**: $0/month

### After Free Credits
- **Railway**: $5-10/month (pay as you go)
- **MongoDB Atlas**: $0 (free tier sufficient)
- **Netlify**: $0 (free tier sufficient)
- **Domain** (optional): $10-15/year
- **Total**: $5-10/month + domain

---

## Troubleshooting

### Backend won't start
```bash
# Check logs in Railway/Render dashboard
# Common issues:
# 1. MongoDB connection string incorrect
# 2. Environment variables not set
# 3. Port already in use (locally)
```

### Frontend can't connect to backend
```bash
# Check:
# 1. API_URL is correct in index.html
# 2. CORS is configured properly
# 3. Backend is actually running
# 4. Check browser console for errors (F12)
```

### Database connection fails
```bash
# MongoDB Atlas:
# 1. Whitelist IP: 0.0.0.0/0 (allow all)
# 2. Verify username/password
# 3. Check connection string format
# 4. Ensure database user has read/write permissions
```

### "Token invalid" errors
```bash
# Clear browser localStorage:
# In browser console (F12):
localStorage.clear()
# Then refresh and login again
```

---

## Quick Deploy Commands Reference

### Backend (Railway via CLI)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
railway add
railway variables set MONGODB_URI="your-uri"
railway variables set JWT_SECRET="your-secret"
```

### Frontend (Netlify via CLI)
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=frontend
```

---

## Next Steps After Deployment

### Week 2 Enhancements
1. Add email notifications (SendGrid)
2. Add SMS alerts (Twilio)
3. Integrate maps (Leaflet.js)
4. Add real-time updates (Socket.io)
5. Create admin dashboard
6. Add photo uploads (Cloudinary)

### Marketing Your App
1. Share on social media
2. Contact local disaster relief organizations
3. Create demo video
4. Write blog post about the project
5. Submit to disaster preparedness forums

---

## Support Resources

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Stack Overflow**: Tag questions with `node.js`, `mongodb`, `express`
- **Discord Communities**: The Programmer's Hangout, Reactiflux

---

## Emergency Rollback

If something breaks in production:

### Railway
```bash
# In Railway dashboard:
# 1. Click "Deployments"
# 2. Find last working deployment
# 3. Click "Redeploy"
```

### Netlify
```bash
# In Netlify dashboard:
# 1. Click "Deploys"
# 2. Find last working deploy
# 3. Click "Publish deploy"
```

---

## You're Done! 🎉

Your disaster relief coordination tool is now live and helping people!

**Your URLs:**
- Frontend: `https://your-app.netlify.app`
- Backend: `https://your-app.up.railway.app`

**Next:** Share your app URL with friends, test thoroughly, and gather feedback!

Good luck with your deployment! 🚀