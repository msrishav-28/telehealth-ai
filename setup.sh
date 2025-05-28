#!/bin/bash

# TeleHealth AI Setup Script
# This script helps you quickly set up the project

echo "🏥 Welcome to TeleHealth AI Setup!"
echo "================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo ""
    echo "📋 Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ .env.local created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your API keys:"
    echo ""
    echo "   Required API Keys:"
    echo "   - GEMINI_API_KEY (Get free key at: https://makersuite.google.com)"
    echo "   - PERPLEXITY_API_KEY (Get at: https://perplexity.ai)"
    echo "   - CLERK_SECRET_KEY (Get at: https://clerk.dev)"
    echo "   - DATABASE_URL (Use Supabase or Neon)"
    echo ""
    echo "   Press Enter after you've added your API keys..."
    read -p ""
else
    echo "✅ .env.local already exists"
fi

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npx prisma generate

# Ask about database setup
echo ""
echo "📊 Database Setup"
echo "Have you set up your PostgreSQL database? (y/n)"
read -p "" db_setup

if [ "$db_setup" = "y" ] || [ "$db_setup" = "Y" ]; then
    echo ""
    echo "🚀 Pushing database schema..."
    npx prisma db push
    echo "✅ Database schema pushed!"
else
    echo ""
    echo "⚠️  Skipping database setup. Remember to run 'npx prisma db push' after setting up your database."
fi

# Final instructions
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Make sure all API keys are added to .env.local"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For deployment:"
echo "- Run 'vercel' to deploy to Vercel"
echo "- See docs/DEPLOYMENT.md for detailed instructions"
echo ""
echo "Happy coding! 🚀"