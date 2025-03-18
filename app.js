const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Store active bot instances and their running scripts
const activeBots = new Map();
const runningScripts = new Map();

// Dice game configuration
const DICE_CONFIG = {
    url: "https://api-dice.goatsbot.xyz/dice/action",
    headers: {
        "accept": "application/json, text/plain, a*/*",
        "accept-language": "en-US,en;q=0.9,fa;q=0.8",
        "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjc0YmI1ZGE5NGE4ZjI3NmQxMGMyN2E4IiwiaWF0IjoxNzQyMjE3NTQ5LCJleHAiOjE3NDIzMDM5NDksInR5cGUiOiJhY2Nlc3MifQ.J2eEtkBLNKgTi2D-jjKHwortCi2_XqddjctkdeR9SbY",
        "content-type": "application/json",
        "origin": "https://dev.goatsbot.xyz",
        "referer": "https://dev.goatsbot.xyz/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    },
    payloads: [
        {
            point_milestone: 97,
            is_upper: true,
            bet_amount: 3,
            currency: "goat"
        }
    ]
};

async function writeAnalysis(responseData) {
    const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
    const realBalance = responseData.user.real_balance;
    const isWin = responseData.dice.is_win;
    
    const analysisText = `[${timestamp}] Balance: ${realBalance.toFixed(2)} | Win: ${isWin}\n`;
    await fs.appendFile("analysiscoco2.txt", analysisText);
}

async function runDiceScript(bot, chatId, scriptId) {
    let requestCounter = 0;
    let i = 0;
    let isRunning = true;

    // Store the running state
    runningScripts.set(scriptId, { isRunning });

    try {
        while (isRunning) {
            const payload = DICE_CONFIG.payloads[i % DICE_CONFIG.payloads.length];
            const response = await axios.post(DICE_CONFIG.url, payload, { headers: DICE_CONFIG.headers });
            const responseData = response.data;
            
            requestCounter++;
            if (requestCounter % 100 === 0) {
                const statusMessage = `Requests sent: ${requestCounter} | Balance: ${responseData.user.real_balance.toFixed(2)} | Win: ${responseData.dice.is_win}`;
                console.log(statusMessage);
                await bot.sendMessage(chatId, statusMessage);
            }
            
            await fs.appendFile("responsecoco2.txt", JSON.stringify(response.data) + "\n");
            await writeAnalysis(responseData);
            
            i++;

            // Check if script should continue running
            const scriptState = runningScripts.get(scriptId);
            if (!scriptState || !scriptState.isRunning) {
                isRunning = false;
                break;
            }
        }
    } catch (error) {
        console.error("Error in dice script:", error);
        await bot.sendMessage(chatId, `Script stopped due to error: ${error.message}`);
    } finally {
        // Clean up the script state
        runningScripts.delete(scriptId);
    }
}

function createBot(token) {
    const bot = new TelegramBot(token, { polling: true });
    const scriptId = `bot_${token}`;
    
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        await bot.sendMessage(chatId, 'Hello! I am your dice game bot. Use /run to start the dice game script.');
    });

    bot.onText(/\/run/, async (msg) => {
        const chatId = msg.chat.id;
        const scriptState = runningScripts.get(scriptId);
        
        if (scriptState && scriptState.isRunning) {
            await bot.sendMessage(chatId, 'Script is already running!');
            return;
        }
        
        await bot.sendMessage(chatId, 'Starting the dice game script...');
        runDiceScript(bot, chatId, scriptId);
    });

    bot.onText(/\/stop/, async (msg) => {
        const chatId = msg.chat.id;
        const scriptState = runningScripts.get(scriptId);
        
        if (scriptState && scriptState.isRunning) {
            scriptState.isRunning = false;
            await bot.sendMessage(chatId, 'Stopping the dice game script...');
        } else {
            await bot.sendMessage(chatId, 'No script is currently running.');
        }
    });

    return bot;
}

async function disconnectBot(token) {
    const bot = activeBots.get(token);
    if (bot) {
        // Stop any running scripts
        const scriptId = `bot_${token}`;
        const scriptState = runningScripts.get(scriptId);
        if (scriptState && scriptState.isRunning) {
            scriptState.isRunning = false;
        }
        
        // Stop the bot polling
        await bot.stopPolling();
        
        // Remove from active bots
        activeBots.delete(token);
        return true;
    }
    return false;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/start_bot', async (req, res) => {
    const { bot_token } = req.body;
    
    if (!bot_token) {
        return res.status(400).json({ error: 'Bot token is required' });
    }

    try {
        // If a bot is already running with this token, disconnect it first
        if (activeBots.has(bot_token)) {
            await disconnectBot(bot_token);
        }
        
        const bot = createBot(bot_token);
        activeBots.set(bot_token, bot);
        res.json({ message: 'Bot started successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/disconnect_bot', async (req, res) => {
    const { bot_token } = req.body;
    
    if (!bot_token) {
        return res.status(400).json({ error: 'Bot token is required' });
    }

    try {
        const disconnected = await disconnectBot(bot_token);
        if (disconnected) {
            res.json({ message: 'Bot disconnected successfully!' });
        } else {
            res.status(404).json({ error: 'No active bot found with this token' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 