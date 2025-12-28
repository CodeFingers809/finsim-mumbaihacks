#!/bin/bash

# Startup script for BSE Announcements Monitor with Qdrant

echo "🚀 Starting BSE Announcements Monitor with Qdrant integration"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please configure it with your credentials."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Run the monitor
echo ""
echo "✅ Starting monitor (Polling every 2 minutes)..."
echo "   Press Ctrl+C to stop"
echo ""
python monitor_qdrant.py
