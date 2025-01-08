#!/bin/bash

echo "Setting up to EC2..."

# generate .env
if [ ! -e .env ]; then
    echo "Generating .env file..."
    cp .env.example .env
    echo ".envファイルを作成しました、環境変数を設定してください"
fi

# Setup nvm
echo "Setting up nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
. ~/.nvm/nvm.sh

# Install node lts
echo "Installing node lts..."
nvm install --lts

# Install node dependencies
echo "Installing node dependencies..."
npm ci

# Set Systemd
echo "Setting up Systemd..."
sudo cp ./discord-bot.service /etc/systemd/system/discord-bot.service
sudo systemctl daemon-reload
sudo systemctl enable discord-bot.service
sudo systemctl start discord-bot.service
