#!/bin/bash

# Railway Deployment Script for Video Processor Backend
# This script automates the deployment process

echo "🚂 Railway Video Processor Deployment Script"
echo "=============================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI found"
fi

echo ""
echo "📋 Step 1: Login to Railway"
railway login

echo ""
echo "📋 Step 2: Navigate to backend directory"
cd backend || { echo "❌ Backend directory not found"; exit 1; }

echo ""
echo "📋 Step 3: Initialize Railway project"
railway init

echo ""
echo "📋 Step 4: Setting environment variables"
railway variables set ROBOFLOW_API_KEY=4b8afa69-5426-44dd-b2af-3977e26d6b5f
railway variables set ROBOFLOW_MODEL_ENDPOINT=https://detect.roboflow.com/pothole-detection-model/1

echo ""
echo "📋 Step 5: Deploying to Railway"
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy your Railway URL from the output above"
echo "2. Update src/config/videoProcessorConfig.js with your Railway URL"
echo "3. Test the health endpoint: YOUR_RAILWAY_URL/api/health"
echo ""
echo "🎉 You're all set! Happy coding!"
