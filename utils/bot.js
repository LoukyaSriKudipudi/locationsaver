const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

if (bot) {
  try {
    console.log("✅ bot is running");
  } catch (err) {
    console.log("Bot Error:" + err.message);
  }
}

module.exports = bot;
