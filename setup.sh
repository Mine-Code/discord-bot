#!/bin/bash

set -e  # Exit on error

echo "=== Discord Bot Setup for Ubuntu ==="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "This script should not be run as root. Please run as a regular user."
    exit 1
fi

# Get current user and path
CURRENT_USER=$(whoami)
CURRENT_PATH=$(pwd)

echo "Current user: $CURRENT_USER"
echo "Installation path: $CURRENT_PATH"

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get install -y curl wget git build-essential

# Generate .env file
if [ ! -e .env ]; then
    echo "📝 Generating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your Discord bot token."
    echo "   You can edit it with: vim .env"
fi

# Setup nvm
if [ ! -d "$HOME/.nvm" ]; then
    echo "🟢 Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
else
    echo "nvm already installed"
    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Install and use Node.js LTS
echo "🟢 Installing Node.js LTS..."
nvm install --lts
nvm use --lts

# Install pnpm globally
echo "🟢 Installing pnpm..."
npm install -g pnpm

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --

# Build the project
echo "🔨 Building project..."
pnpm build

# Make scripts executable
chmod +x start.sh

# Setup systemd service
echo "⚙️  Setting up systemd service..."
# Create service file with current user and path
sed -e "s|%USER%|$CURRENT_USER|g" -e "s|%INSTALL_PATH%|$CURRENT_PATH|g" discord-bot.service > /tmp/discord-bot.service

# Install service
sudo cp /tmp/discord-bot.service /etc/systemd/system/discord-bot.service
sudo systemctl daemon-reload

# Create log directory
sudo mkdir -p /var/log/discord-bot
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/discord-bot

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Discord bot token:"
echo "   vim .env"
echo ""
echo "2. Test the bot manually:"
echo "   ./start.sh"
echo ""
echo "3. Enable and start the systemd service:"
echo "   sudo systemctl enable discord-bot.service"
echo "   sudo systemctl start discord-bot.service"
echo ""
echo "4. Check service status:"
echo "   sudo systemctl status discord-bot.service"
echo ""
echo "5. View logs:"
echo "   sudo journalctl -u discord-bot.service -f"
