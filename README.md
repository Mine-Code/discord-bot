# MineCode Discord Bot

MineCode Discord Bot for general purpose use.

## Features

- **TeX Renderer**: LaTeX math rendering using KaTeX + Sharp
- **VC Observer**: Voice channel activity monitoring
- **System Controller**: Server management commands
- **Reaction Forwarder**: Forward messages with specific reactions to designated channels

## Development

### Local Development

```bash
# Initial setup
pnpm install

# Development with hot reload
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Format code
pnpm format
```

### Development Running

1. Copy `.env.example` to `.env` and configure your tokens and settings.
2. Run the bot in development mode:

```bash
pnpm dev
```

## Production Deployment (Ubuntu)

```bash
# Run setup script (installs Node.js, pnpm, creates .env, builds project, configures systemd)
sudo ./setup.sh

# Edit .env file to configure production tokens

# Start service
sudo systemctl start discord-bot

# Enable auto-start on boot
sudo systemctl enable discord-bot
```

### Environment Configuration

The `.env` file is created from `.env.example` when running `./setup.sh`. Configure it with your settings:

```env
# Discord Bot Configuration
BOT_TOKEN="your_discord_bot_token"
BOT_ID="your_bot_id"
GUILD_ID="your_guild_id"
OBSERVER_CHANNEL_ID="your_channel_id"
REACTION_FORWARDER_CHANNEL_ID="your_reaction_forwarder_channel_id"
REACTION_FORWARDER_REACTIONS="emoji_id_1,emoji_id_2,emoji_id_3"
REACTION_FORWARDER_THRESHOLD="3"
```

#### How to Get Each Environment Variable

**BOT_TOKEN**:

- Go to [Discord Developer Portal](https://discord.com/developers/applications)
- Create/select your application → Bot → Reset Token

**BOT_ID**:

- Discord Developer Portal → Your Application → General Information → Application ID

**GUILD_ID**:

- Enable Developer Mode in Discord → Right-click your server → Copy Server ID

**OBSERVER_CHANNEL_ID**:

- Right-click the channel where vc-observer notification should be sent → Copy Channel ID

**REACTION_FORWARDER_CHANNEL_ID**:

- Right-click the channel where reaction-forwarder should send forwarded messages → Copy Channel ID

**REACTION_FORWARDER_REACTIONS**:

- Right-click the custom emoji you want to monitor → Copy ID
- For multiple emojis, separate with commas: `emoji_id_1,emoji_id_2,emoji_id_3`
- Example: `1183455310992638113,1392815819540533400`

**REACTION_FORWARDER_THRESHOLD**:

- Number of reactions required to forward a message (excluding message author and bots)
- Example: `3` (requires 3 or more reactions to forward)
