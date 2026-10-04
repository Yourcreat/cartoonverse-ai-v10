require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenAI } = require("@google/genai");

// ===============================
// EXPRESS SERVER
// ===============================

const app = express();

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ CartoonVerse AI V10 is running");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ===============================
// ENVIRONMENT VARIABLES
// ===============================

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

// ===============================
// GEMINI AI
// ===============================

const ai = new GoogleGenAI({
  apiKey: GEMINI_KEY
});

async function generateAI(prompt) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🤖 Gemini attempt ${attempt}/${maxAttempts}`);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const text = response.text;

      if (!text || text.trim() === "") {
        throw new Error("Gemini returned an empty response.");
      }

      console.log("✅ Gemini response received");

      return text;

    } catch (error) {

      const message = error?.message || String(error);

      console.error(
        `❌ Gemini attempt ${attempt}:`,
        message
      );

      const isTemporary =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes("RESOURCE_EXHAUSTED") ||
        message.includes("500") ||
        message.includes("INTERNAL");

      if (!isTemporary || attempt === maxAttempts) {
        throw error;
      }

      const waitTime = Math.pow(2, attempt) * 1000;

      console.log(
        `⏳ Gemini temporarily unavailable. Retrying in ${waitTime / 1000}s...`
      );

      await new Promise(resolve =>
        setTimeout(resolve, waitTime)
      );
    }
  }

  throw new Error("Gemini generation failed.");
}

// ===============================
// TELEGRAM BOT
// ===============================

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

console.log("🤖 CartoonVerse AI V10 Telegram Bot Started");

// ===============================
// /START
// ===============================

bot.onText(/^\/start$/, async (msg) => {

  try {

    await bot.sendMessage(
      msg.chat.id,
      `🎬 Welcome to CartoonVerse AI V10!

Your AI Content Studio is ready.

Commands:

/story football
/movie lion

🚀 More AI modules coming soon.`
    );

  } catch (error) {

    console.error("❌ START ERROR:", error.message);

  }

});

// ===============================
// /HELP
// ===============================

bot.onText(/^\/help$/, async (msg) => {

  try {

    await bot.sendMessage(
      msg.chat.id,
      `📚 CartoonVerse AI V10

Available commands:

/start
Start the bot.

/help
Show commands.

/story <topic>
Generate a Hindi cartoon story.

/movie <topic>
Generate a cartoon movie structure.`
    );

  } catch (error) {

    console.error("❌ HELP ERROR:", error.message);

  }

});

// ===============================
// /STORY
// ===============================

bot.onText(/^\/story\s+(.+)$/i, async (msg, match) => {

  const topic = match[1].trim();

  try {

    await bot.sendMessage(
      msg.chat.id,
      "✍️ Story generate ho rahi hai..."
    );

    console.log(`📖 Story topic: ${topic}`);

    const prompt = `
You are CartoonVerse AI V10 Story Engine.

Create an original Hindi cartoon story for YouTube.

Topic:
${topic}

Requirements:

- Simple Hindi
- Kids-friendly
- Strong opening hook
- Interesting main characters
- Beginning
- Problem
- Adventure
- Climax
- Happy ending
- Moral
- Approximately 3 to 5 minutes
- Make the story entertaining
- Use natural Hindi dialogue
`;

    const story = await generateAI(prompt);

    await bot.sendMessage(
      msg.chat.id,
      `🎬 CARTOONVERSE AI V10

📖 STORY

${story}`
    );

  } catch (error) {

    console.error("❌ STORY ERROR:", error);

    await bot.sendMessage(
      msg.chat.id,
      `❌ Story Error:

${error?.message || String(error)}`
    );

  }

});

// ===============================
// /MOVIE
// ===============================

bot.onText(/^\/movie\s+(.+)$/i, async (msg, match) => {

  const topic = match[1].trim();

  try {

    await bot.sendMessage(
      msg.chat.id,
      "🎥 Movie structure generate ho raha hai..."
    );

    console.log(`🎥 Movie topic: ${topic}`);

    const prompt = `
You are CartoonVerse AI V10 Movie Engine.

Create an original Hindi kids cartoon movie.

Topic:
${topic}

Create:

1. Movie title
2. Main characters
3. Character descriptions
4. Story summary
5. Scene 1
6. Scene 2
7. Scene 3
8. Scene 4
9. Scene 5
10. Scene 6
11. Scene 7
12. Scene 8
13. Scene 9
14. Scene 10

For every scene include:

- Scene description
- Hindi narration
- Hindi dialogue
- Image generation prompt
- Video generation prompt

Also include:

- Climax
- Ending
- Moral
- YouTube title
- YouTube description
`;

    const movie = await generateAI(prompt);

    await bot.sendMessage(
      msg.chat.id,
      `🎥 CARTOONVERSE AI V10

${movie}`
    );

  } catch (error) {

    console.error("❌ MOVIE ERROR:", error);

    await bot.sendMessage(
      msg.chat.id,
      `❌ Movie Error:

${error?.message || String(error)}`
    );

  }

});

// ===============================
// TELEGRAM ERRORS
// ===============================

bot.on("polling_error", (error) => {

  console.error(
    "❌ Telegram polling error:",
    error.message
  );

});

bot.on("error", (error) => {

  console.error(
    "❌ Telegram bot error:",
    error.message
  );

});

// ===============================
// PROCESS ERRORS
// ===============================

process.on("unhandledRejection", (error) => {

  console.error(
    "❌ Unhandled rejection:",
    error
  );

});

process.on("uncaughtException", (error) => {

  console.error(
    "❌ Uncaught exception:",
    error
  );

});

console.log("🚀 CartoonVerse AI V10 Ready");
