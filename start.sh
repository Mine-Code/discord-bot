#!/bin/bash

# Load environment variables
if [ -f ~/.bashrc ]; then
    source ~/.bashrc
fi

if [ -f ~/.profile ]; then
    source ~/.profile
fi

# Load nvm if available
if [ -f ~/.nvm/nvm.sh ]; then
    source ~/.nvm/nvm.sh
fi

# Get script directory
FILE_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$FILE_DIR"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please run ./setup.sh first."
    exit 1
fi

# Check if pnpm is available
if ! command -v pnpm >/dev/null 2>&1; then
    echo "Error: pnpm is not installed. Please run ./setup.sh first."
    exit 1
fi

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Production deployment: Build if needed, install production dependencies, and start
echo "Production deployment: Preparing application..."

# Check if build is needed
if [ ! -d "dist" ]; then
    echo "dist directory not found. Building project..."

    # Install all dependencies for building
    echo "Installing all dependencies for build..."
    pnpm install

    # Build the project
    echo "Building project..."
    pnpm build

    if [ ! -d "dist" ]; then
        echo "Error: Build failed. dist directory was not created."
        exit 1
    fi

    echo "Build completed successfully."
fi

# Install production dependencies only
echo "Installing production dependencies..."
pnpm install --prod --frozen-lockfile

# Start the application
echo "Starting Discord Bot in production mode..."
pnpm start
