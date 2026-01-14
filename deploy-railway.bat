@echo off
REM Railway Deployment Script for Video Processor Backend (Windows)
REM This script automates the deployment process

echo.
echo ========================================
echo Railway Video Processor Deployment
echo ========================================
echo.

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Railway CLI not found. Installing...
    npm install -g @railway/cli
    echo [OK] Railway CLI installed
) else (
    echo [OK] Railway CLI found
)

echo.
echo Step 1: Login to Railway
railway login

echo.
echo Step 2: Navigate to backend directory
cd backend
if %ERRORLEVEL% NEQ 0 (
    echo [X] Backend directory not found
    pause
    exit /b 1
)

echo.
echo Step 3: Initialize Railway project
railway init

echo.
echo Step 4: Setting environment variables
railway variables set ROBOFLOW_API_KEY=4b8afa69-5426-44dd-b2af-3977e26d6b5f
railway variables set ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pothole-detection-model/1

echo.
echo Step 5: Deploying to Railway
railway up

echo.
echo ========================================
echo [OK] Deployment complete!
echo ========================================
echo.
echo Next steps:
echo 1. Copy your Railway URL from the output above
echo 2. Update src/config/videoProcessorConfig.js with your Railway URL
echo 3. Test the health endpoint: YOUR_RAILWAY_URL/api/health
echo.
echo Happy coding!
echo.
pause
