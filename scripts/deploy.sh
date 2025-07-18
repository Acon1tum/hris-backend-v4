#!/bin/bash

# HRIS Backend Deployment Script for Render
# This script helps prepare your application for deployment

echo "🚀 Preparing HRIS Backend for Render deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please create it first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed. dist directory not found."
    exit 1
fi

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
fi

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️  Warning: .env file not found. Make sure to set environment variables in Render."
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "⚠️  Warning: Git repository not initialized. Please run:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push"
echo ""
echo "2. Deploy to Render:"
echo "   - Go to https://render.com"
echo "   - Create a new Blueprint"
echo "   - Connect your GitHub repository"
echo "   - Render will automatically deploy using render.yaml"
echo ""
echo "3. Or deploy manually:"
echo "   - Create PostgreSQL database in Render"
echo "   - Create Web Service in Render"
echo "   - Set environment variables"
echo "   - Deploy"
echo ""
echo "📖 For detailed instructions, see: RENDER_DEPLOYMENT.md" 