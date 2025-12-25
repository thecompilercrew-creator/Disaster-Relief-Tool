# 🆘 Disaster Relief Coordination Tool

A privacy-focused web application for coordinating disaster relief efforts, connecting people who need help with volunteers and resources.

## ✨ Features

- **🔐 Privacy Protection**: Automatic data masking for contact information
- **📋 Help Requests**: Submit and browse requests for assistance
- **🤝 Volunteer Coordination**: Connect volunteers with people in need
- **📦 Resource Tracking**: Donate and track available supplies
- **📱 Mobile-Friendly**: Fully responsive design
- **🔒 Secure Authentication**: JWT-based user authentication

## 🛠️ Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT authentication with bcrypt
- Security: Helmet.js, CORS, Rate limiting

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design
- No framework dependencies

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/disaster-relief-app.git
cd disaster-relief-app
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

3. **Setup Frontend**
```bash
cd ../frontend
# Open index.html in browser or use:
python -m http.server 8000
# Visit http://localhost:8000
```

## 📝 Environment Variables

Create a `.env` file in the backend folder:

```env
MONGODB_URI=mongodb://localhost:27017/disaster_relief
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

## 🔒 Privacy Features

The application implements two-tier data storage:
- **Public Data**: Masked information visible to all users
- **Private Data**: Full contact details only accessible to authorized volunteers

### Data Masking Examples
- Phone: `555-123-4567` → `555-***-**67`
- Name: `John Doe` → `John D.`
- Address: `123 Main St, Boston` → `Main St area, Boston`
- Email: `john@email.com` → `jo***@email.com`

## 📖 Usage

### For People Needing Help
1. Sign up / Login
2. Click "Request Help"
3. Fill in your information (will be automatically masked)
4. Select help type and urgency
5. Submit request

### For Volunteers
1. Browse help requests (contact info is masked)
2. Click "I Can Help" on any request
3. Full contact details are revealed
4. Contact the person directly

### For Donors
1. Click "Donate Resource"
2. Enter resource details
3. Resources are listed for those who need them

## 🗂️ Project Structure

```
disaster-relief-app/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Dependencies
│   ├── .env              # Environment variables (not in git)
│   └── .gitignore
├── frontend/
│   └── index.html        # Complete frontend app
└── README.md
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Help Requests
- `GET /api/requests` - Get all help requests
- `POST /api/requests` - Create help request
- `POST /api/volunteer` - Volunteer for request
- `GET /api/my-volunteers` - Get requests you're helping with

### Resources
- `GET /api/resources` - Get available resources
- `POST /api/resources` - Add new resource
- `PATCH /api/resources/:id` - Update resource status

## 🚀 Deployment

### Backend (Railway)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Frontend (Netlify)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=frontend
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🔐 Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Rate limiting on API endpoints
- Helmet.js for security headers
- CORS protection
- Input sanitization
- Environment variables for secrets

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/yourusername/disaster-relief-app/issues) page
2. Create a new issue with detailed information
3. Contact: your-email@example.com

## 🙏 Acknowledgments

- Built for disaster relief coordination
- Inspired by real-world emergency response needs
- Privacy-first design principles

## 📊 Roadmap

### Phase 2 (Coming Soon)
- [ ] Email notifications (SendGrid)
- [ ] SMS alerts (Twilio)
- [ ] Map integration (Leaflet.js)
- [ ] Real-time updates (Socket.io)
- [ ] Photo uploads
- [ ] Admin dashboard
- [ ] Multi-language support

### Phase 3 (Future)
- [ ] Mobile apps (React Native)
- [ ] AI-powered matching
- [ ] Analytics dashboard
- [ ] Resource optimization
- [ ] Integration with emergency services

## 💰 Cost

- **Development**: Free (open source)
- **Hosting**: $0-10/month (using free tiers)
  - Railway: $5 free credit/month
  - MongoDB Atlas: Free 512MB
  - Netlify: Free hosting

## 📱 Screenshots

![Help Requests](screenshots/requests.png)
![Resource Tracking](screenshots/resources.png)
![Mobile View](screenshots/mobile.png)

---

**Made with ❤️ for disaster relief efforts**
