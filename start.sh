#!/bin/bash

echo "🎅 Secret Santa - Quick Start Script"
echo "====================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Copying .env.example to .env..."
    cp .env.example .env
    echo "✅ Please edit .env file with your credentials"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi
echo "✅ Prisma Client generated"
echo ""

# Initialize database
echo "🗄️  Initializing database..."
npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi
echo "✅ Database initialized"
echo ""

# Start development server
echo "🚀 Starting development server..."
echo ""
echo "📱 Access the application at: http://localhost:3000"
echo "👨‍💼 Admin panel at: http://localhost:3000/admin"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
