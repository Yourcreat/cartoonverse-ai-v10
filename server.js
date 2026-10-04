require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ CartoonVerse AI V10 is running");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing");
  process.exit(1);
}

if (!GEMINI_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: GEMINI_KEY
});

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

console.log("🤖 CartoonVerse AI V10 Telegram Bot Started");

bot.onText(/^\/start$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `🎬 Welcome to CartoonVerse AI V10!

Your AI Content Studio is ready.

Commands:

/story football
/movie lion

More AI modules will be added next. 🚀`
  );
});

bot.onText(/^\/help$/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    `📚 CartoonVerse AI V10 Help

/story <topic>
Generate an AI story.

/movie <topic>
Generate an AI movie structure.

/help
Show this help.`
  );
});

async function generateAI(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  });

  return response.text;
}

bot.onText(/^\/story\s+(.+)$/i, async (msg, match) => {
  const topic = match[1].trim();

  try {
    await bot.sendMessage(
      msg.chat.id,
      "✍️ Story generate ho rahi hai..."
    );

    const prompt = `
Create a Hindi cartoon story for YouTube.

Topic: ${topic}

Requirements:
- Simple Hindi
- Kids-friendly
- Strong opening hook
- Main characters
- Beginning
- Problem
- Adventure
- Climax
- Happy ending
- Moral
- 3 to 5 minutes
`;

    const story = await generateAI(prompt);

    await bot.sendMessage(
      msg.chat.id,
      `🎬 CARTOONVERSE AI V10

📖 STORY

${story}`
    );
  } catch (error) {
    console.error("Story error:", error);

    await bot.sendMessage(
      msg.chat.id,
      "❌ Story generate nahi ho saki. Logs check karo."
    );
  }
});

bot.onText(/^\/movie\s+(.+)$/i, async (msg, match) => {
  const topic = match[1].trim();

  try {
    await bot.sendMessage(
      msg.chat.id,
      "🎥 Movie structure generate ho raha hai..."
    );

    const prompt = `
Create a Hindi kids cartoon movie concept.

Topic: ${topic}

Create:
1. Movie title
2. Characters
3. Story summary
4. 10 scenes
5. Each scene's narration
6. Dialogue
7. Image prompt
8. Video prompt
9. Ending
10. Moral
`;

    const movie = await generateAI(prompt);

    await bot.sendMessage(
      msg.chat.id,
      `🎥 CARTOONVERSE AI V10

${movie}`
    );
  } catch (error) {
    console.error("Movie error:", error);

    await bot.sendMessage(
      msg.chat.id,
      "❌ Movie generate nahi ho saki. Logs check karo."
    );
  }
});

bot.on("polling_error", (error) => {
  console.error("❌ Telegram polling error:", error.message);
});

bot.on("error", (error) => {
  console.error("❌ Telegram bot error:", error.message);
});
