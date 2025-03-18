# Telegram Bot Tester

A Node.js web application for testing Telegram bots with custom scripts, specifically designed for running the dice game script.

## Features

- Web interface for bot token management
- Telegram bot integration
- Dice game script execution
- Real-time status updates via Telegram
- Logging and analysis of game results

## Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Get your Telegram Bot Token:
   - Open Telegram and search for @BotFather
   - Send `/newbot` command
   - Follow the instructions to create your bot
   - Copy the API token provided by BotFather

3. Run the application:
```bash
npm start
```

4. Open your web browser and navigate to `http://localhost:3000`

## Usage

1. Enter your bot token in the web interface
2. Click "Start Bot" to initialize your bot
3. Open Telegram and find your bot
4. Use the following commands:
   - `/start` - Get started with the bot
   - `/run` - Start the dice game script
   - `/stop` - Stop the dice game script

## Bot Commands

- `/start` - Initializes the bot and shows welcome message
- `/run` - Starts the dice game script
- `/stop` - Stops the dice game script

## Logging

The application creates two log files:
- `responsecoco2.txt` - Contains raw API responses
- `analysiscoco2.txt` - Contains formatted analysis of each game result

## Note

Make sure to keep your bot token secure and never share it publicly. 