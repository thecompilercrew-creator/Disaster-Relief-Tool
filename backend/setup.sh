#!/bin/bash

# ===========================================
# Disaster Relief Backend Setup Script
# For Mac/Linux Systems
# ===========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "==========================================="
    echo "  🆘 Disaster Relief Backend Setup"
    echo "==========================================="
    echo -e "${NC}"
}

# Start setup
clear
print_header

# Check if Node.js is installed
print_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  • Mac: brew install node"
    echo "  • Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "  • Or download from: https://nodejs.org"
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js version: $NODE_VERSION"

# Check if npm is installed
print_info "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    echo "Please install npm and try again."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm version: $NPM_VERSION"
echo ""

# Install dependencies
print_info "Installing npm dependencies..."
echo "This may take a minute..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    echo "Try running: npm cache clean --force && npm install"
    exit 1
fi
echo ""

# Check if .env file exists
if [ -f .env ]; then
    print_warning ".env file already exists"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Keeping existing .env file"
        SKIP_ENV=true
    else
        SKIP_ENV=false
    fi
else
    SKIP_ENV=false
fi

if [ "$SKIP_ENV" = false ]; then
    # Check if .env.example exists
    if [ ! -f .env.example ]; then
        print_warning ".env.example not found, creating from template..."
        
        # Create .env.example
        cat > .env.example << 'EOF'
# MongoDB Connection String
# For local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/disaster_relief

# For MongoDB Atlas (Production):
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/disaster_relief?retryWrites=true&w=majority

# JWT Secret Key (Generate a strong random key)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
EOF
        print_success ".env.example created"
    fi
    
    # Copy .env.example to .env
    print_info "Creating .env file from template..."
    cp .env.example .env
    
    # Generate secure JWT secret
    print_info "Generating secure JWT secret..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Replace JWT_SECRET in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    fi
    
    print_success ".env file created with secure JWT secret"
    echo ""
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    print_info "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.*.local

# OS files
.DS_Store
Thumbs.db
.DS_Store?
._*
.Spotlight-V100
.Trashes

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
*.sublime-project
*.sublime-workspace

# Build outputs
dist/
build/
out/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.temp/
*.pid
*.seed
*.pid.lock
EOF
    print_success ".gitignore created"
    echo ""
else
    print_success ".gitignore already exists"
    echo ""
fi

# Check if MongoDB is installed locally (optional)
print_info "Checking for local MongoDB installation..."
if command -v mongod &> /dev/null; then
    MONGO_VERSION=$(mongod --version | head -n 1)
    print_success "MongoDB installed: $MONGO_VERSION"
    echo ""
    print_info "You can use local MongoDB with:"
    echo "  MONGODB_URI=mongodb://localhost:27017/disaster_relief"
    echo ""
else
    print_warning "MongoDB not installed locally"
    echo ""
    print_info "No problem! You can use MongoDB Atlas (free):"
    echo "  1. Go to https://cloud.mongodb.com"
    echo "  2. Sign up for free"
    echo "  3. Create a cluster"
    echo "  4. Get connection string"
    echo "  5. Update MONGODB_URI in .env"
    echo ""
fi

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
    print_info "Initializing git repository..."
    if git init; then
        print_success "Git repository initialized"
        git add .gitignore
        git commit -m "Initial commit: Add .gitignore" > /dev/null 2>&1 || true
    else
        print_warning "Git not installed or initialization failed"
    fi
    echo ""
fi

# Create a simple test script
print_info "Creating test script..."
cat > test-connection.js << 'EOF'
// Simple script to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('URI:', process.env.MONGODB_URI ? 'Configured ✓' : 'NOT SET ✗');

if (!process.env.MONGODB_URI) {
    console.error('\n❌ MONGODB_URI is not set in .env file!');
    console.log('\nPlease update your .env file with a valid MongoDB URI.');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('\n✅ MongoDB connection successful!');
        console.log('Database:', mongoose.connection.name);
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ MongoDB connection failed!');
        console.error('Error:', err.message);
        console.log('\nPlease check your MONGODB_URI in .env file.');
        process.exit(1);
    });

// Timeout after 10 seconds
setTimeout(() => {
    console.error('\n❌ Connection timeout!');
    process.exit(1);
}, 10000);
EOF

print_success "Test script created (test-connection.js)"
echo ""

# Print final instructions
echo -e "${GREEN}"
echo "==========================================="
echo "  ✅ Setup Complete!"
echo "==========================================="
echo -e "${NC}"
echo ""
print_warning "IMPORTANT NEXT STEPS:"
echo ""
echo "1️⃣  Update MongoDB Connection:"
echo "   Edit .env file and set your MONGODB_URI"
echo "   "
echo "   For local MongoDB:"
echo "   ${BLUE}MONGODB_URI=mongodb://localhost:27017/disaster_relief${NC}"
echo "   "
echo "   For MongoDB Atlas (free):"
echo "   ${BLUE}MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/disaster_relief${NC}"
echo ""
echo "2️⃣  Edit .env file:"
echo "   ${BLUE}nano .env${NC}  or  ${BLUE}vim .env${NC}  or  ${BLUE}code .env${NC}"
echo ""
echo "3️⃣  Test MongoDB connection:"
echo "   ${BLUE}node test-connection.js${NC}"
echo ""
echo "4️⃣  Start development server:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "5️⃣  Server will run on:"
echo "   ${BLUE}http://localhost:5000${NC}"
echo ""
echo "==========================================="
echo ""
print_info "Need help with MongoDB Atlas?"
echo "   Visit: https://cloud.mongodb.com"
echo "   • Create free account (M0 Sandbox)"
echo "   • Create cluster"
echo "   • Database Access → Add user"
echo "   • Network Access → Allow 0.0.0.0/0"
echo "   • Connect → Get connection string"
echo ""
print_info "Useful commands:"
echo "   ${BLUE}npm run dev${NC}      - Start development server"
echo "   ${BLUE}npm start${NC}        - Start production server"
echo "   ${BLUE}npm test${NC}         - Run tests (when available)"
echo ""
print_success "Happy coding! 🚀"
echo ""