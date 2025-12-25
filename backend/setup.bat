@echo off
REM Disaster Relief Backend Setup Script for Windows
REM Run this script to quickly set up your backend

echo ========================================
echo    Disaster Relief Backend Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm version:
npm --version
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed successfully
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env >nul
    
    REM Generate JWT secret using Node.js
    for /f "delims=" %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i
    
    REM Create temporary PowerShell script to update .env
    echo $content = Get-Content .env > update_env.ps1
    echo $content = $content -replace 'JWT_SECRET=.*', 'JWT_SECRET=%JWT_SECRET%' >> update_env.ps1
    echo Set-Content -Path .env -Value $content >> update_env.ps1
    
    REM Run PowerShell script
    powershell -ExecutionPolicy Bypass -File update_env.ps1
    del update_env.ps1
    
    echo [OK] .env file created with secure JWT secret
    echo.
    echo [IMPORTANT] Please update the following in .env file:
    echo    1. MONGODB_URI - Add your MongoDB connection string
    echo    2. Review other settings as needed
    echo.
) else (
    echo [OK] .env file already exists
    echo.
)

REM Create .gitignore if it doesn't exist
if not exist .gitignore (
    echo Creating .gitignore file...
    (
        echo node_modules/
        echo .env
        echo .env.local
        echo .env.production
        echo npm-debug.log*
        echo yarn-debug.log*
        echo .DS_Store
        echo *.swp
        echo *.swo
        echo logs/
        echo *.log
    ) > .gitignore
    echo [OK] .gitignore created
    echo.
)

echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file and add your MongoDB URI
echo 2. Run "npm run dev" to start development server
echo 3. Server will run on http://localhost:5000
echo.
echo For MongoDB Atlas setup:
echo 1. Visit https://cloud.mongodb.com
echo 2. Create a free cluster
echo 3. Get connection string and update .env
echo.
echo Happy coding! 
echo.
pause