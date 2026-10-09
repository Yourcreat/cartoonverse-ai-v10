require("dotenv").config();

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const { GoogleGenAI } = require("@google/genai");

// ==========================================
// EXPRESS SERVER
// ==========================================

const app = express();

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("✅ CartoonVerse AI V10 is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    bot: "CartoonVerse AI V10",
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN) {
  console.error("❌ BOT_TOKEN is missing in Render Environment Variables");
  process.exit(1);
}

if (!GEMINI_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in Render Environment Variables");
  process.exit(1);
}

// ==========================================
// GEMINI
// ==========================================

const ai = new GoogleGenAI({
  apiKey: GEMINI_KEY
});

// ==========================================
// GEMINI AI GENERATOR WITH RETRY
// ==========================================

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

      console.log(
        `✅ Gemini response received (${text.length} characters)`
      );

      return text.trim();

    } catch (error) {
      const message = error?.message || String(error);

      console.error(
        `❌ Gemini attempt ${attempt}/${maxAttempts}:`,
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
        `⏳ Gemini temporarily unavailable. ` +
        `Retrying in ${waitTime / 1000}s...`
      );

      await new Promise((resolve) => {
        setTimeout(resolve, waitTime);
      });
    }
  }

  throw new Error("Gemini generation failed.");
}

// ==========================================
// TELEGRAM BOT
// ==========================================

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

console.log("🤖 CartoonVerse AI V10 Telegram Bot Started");

// ==========================================
// LONG MESSAGE SENDER
// ==========================================
// Telegram messages have a length limit.
// We keep each chunk below the limit.

async function sendLongMessage(chatId, text) {
  const MAX_LENGTH = 4000;

  if (!text) {
    return;
  }

  const cleanText = String(text);

  const chunks = [];

  for (let i = 0; i < cleanText.length; i += MAX_LENGTH) {
    chunks.push(
      cleanText.substring(i, i + MAX_LENGTH)
    );
  }

  console.log(
    `📤 Sending ${chunks.length} Telegram message(s)`
  );

  for (let i = 0; i < chunks.length; i++) {
    await bot.sendMessage(
      chatId,
      chunks[i]
    );

    // Small delay between chunks
    if (i < chunks.length - 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    }
  }
}

// ==========================================
// /START
// ==========================================

bot.onText(/^\/start$/, async (msg) => {
  try {
    await bot.sendMessage(
      msg.chat.id,
      `🎬 Welcome to CartoonVerse AI V10!

Your AI Content Studio is ready.

Commands:

/story football
Generate a Hindi cartoon story.

/movie lion
Generate a cartoon movie structure.

/help
Show all commands.

🚀 More AI modules coming soon.`
    );

  } catch (error) {
    console.error(
      "❌ START ERROR:",
      error?.message || error
    );
  }
});

// ==========================================
// /HELP
// ==========================================

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

Example:
/story football

/movie <topic>
Generate a cartoon movie structure.

Example:
/movie magic pencil`
    );

  } catch (error) {
    console.error(
      "❌ HELP ERROR:",
      error?.message || error
    );
  }
});

// ==========================================
// /STORY
// ==========================================

bot.onText(/^\/story\s+(.+)$/i, async (msg, match) => {

  const chatId = msg.chat.id;
  const topic = match[1].trim();

  try {

    console.log(`📖 Story topic: ${topic}`);

    await bot.sendMessage(
      chatId,
      "✍️ Story generate ho rahi hai..."
    );

    const prompt = `
You are CartoonVerse AI V10 Story Engine.

Create an original Hindi cartoon story for YouTube.

TOPIC:
${topic}

IMPORTANT REQUIREMENTS:

- Write in simple Hindi.
- Kids-friendly.
- Original story.
- Strong opening hook.
- Interesting characters.
- Beginning.
- Problem.
- Adventure.
- Climax.
- Happy ending.
- Moral at the end.
- Approximately 3 to 5 minutes.
- Entertaining and emotional.
- Use natural Hindi dialogue.
- Do not explain your instructions.
- Directly write the finished story.

FORMAT:

TITLE:
[Story title]

CHARACTERS:
[List main characters]

HOOK:
[Strong opening]

STORY:
[Complete story with narration and dialogue]

CLIMAX:
[Climax]

ENDING:
[Happy ending]

MORAL:
[Moral]
`;

    const story = await generateAI(prompt);

    console.log(
      `📖 Story generated: ${story.length} characters`
    );

    await sendLongMessage(
      chatId,
      `🎬 CARTOONVERSE AI V10

📖 STORY

${story}`
    );

  } catch (error) {

    console.error(
      "❌ STORY ERROR:",
      error?.message || error
    );

    try {
      await bot.sendMessage(
        chatId,
        `❌ Story Error:

${error?.message || String(error)}`
      );
    } catch (sendError) {
      console.error(
        "❌ STORY ERROR MESSAGE FAILED:",
        sendError?.message || sendError
      );
    }
  }
});

// ==========================================
// /MOVIE
// ==========================================

bot.onText(/^\/movie\s+(.+)$/i, async (msg, match) => {

  const chatId = msg.chat.id;
  const topic = match[1].trim();

  try {

    console.log(`🎥 Movie topic: ${topic}`);

    await bot.sendMessage(
      chatId,
      "🎥 Movie structure generate ho raha hai..."
    );

    const prompt = `
You are CartoonVerse AI V10 Movie Engine.

Create an original Hindi kids cartoon movie.

TOPIC:
${topic}

Create:

1. Movie title
2. Main characters
3. Character descriptions
4. Story summary

Then create 10 scenes.

For every scene include:

- Scene description
- Hindi narration
- Hindi dialogue
- Image generation prompt
- Video generation prompt

Scenes:

Scene 1
Scene 2
Scene 3
Scene 4
Scene 5
Scene 6
Scene 7
Scene 8
Scene 9
Scene 10

Also include:

- Climax
- Happy ending
- Moral
- YouTube title
- YouTube description

Keep everything original and kids-friendly.

Return the finished movie structure directly.
`;

    const movie = await generateAI(prompt);

    console.log(
      `🎥 Movie generated: ${movie.length} characters`
    );

    await sendLongMessage(
      chatId,
      `🎥 CARTOONVERSE AI V10

${movie}`
    );

  } catch (error) {

    console.error(
      "❌ MOVIE ERROR:",
      error?.message || error
    );

    try {
      await bot.sendMessage(
        chatId,
        `❌ Movie Error:

${error?.message || String(error)}`
      );
    } catch (sendError) {
      console.error(
        "❌ MOVIE ERROR MESSAGE FAILED:",
        sendError?.message || sendError
      );
    }
  }
});

/ ==========================================
// /CHARACTER
// ==========================================

bot.onText(/^\/character(?:@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const name = (match[1] || "").trim();

  if (!name) {
    await bot.sendMessage(
      chatId,
      "🎨 Character બનાવવા માટે નામ આપો.\n\nExample: /character Riya"
    );
    return;
  }

  try {
    await bot.sendMessage(
      chatId,
      `🎨 ${name} character design થઈ રહ્યું છે...`
    );

    const prompt = `
You are CartoonVerse AI V10 Character Design Engine.

Create a detailed, original, reusable character sheet for a Hindi kids cartoon.

CHARACTER NAME: ${name}

Write the complete result in simple Hindi, with English image prompts.

Include:
1. Character name and role.
2. Apparent age.
3. Face and head shape.
4. Hair style and exact hair color.
5. Eye shape and color.
6. Skin tone.
7. Outfit with exact colors and details.
8. Shoes and accessories.
9. Height and body proportions in cartoon style.
10. Personality and expressions.
11. Signature pose and distinctive features.
12. Fixed color palette.
13. A detailed, family-friendly image-generation prompt.
14. A negative prompt to avoid unwanted variations.
15. Character consistency rules for future scenes.

IMPORTANT:
- Make the design original.
- Choose specific visual details, not vague descriptions.
- Keep the same face, hairstyle, eye color, outfit, shoes,
  accessories, proportions and colors in every future scene.
- The image prompt should show the full character clearly.
- Do not claim an image has been generated; provide text prompts only.

Return the finished character sheet directly.
`;

    const character = await generateAI(prompt);

    await sendLongMessage(
      chatId,
      `🎨 CARTOONVERSE AI V10\n\nCHARACTER SHEET: ${name}\n\n${character}`
    );

  } catch (error) {
    console.error(
      "❌ CHARACTER ERROR:",
      error?.message || error
    );

    try {
      await bot.sendMessage(
        chatId,
        `❌ Character Error:\n${error?.message || String(error)}`
      );
    } catch (sendError) {
      console.error(
        "❌ CHARACTER ERROR MESSAGE FAILED:",
        sendError?.message || sendError
      );
    }
  }
});


// ==========================================
// TELEGRAM ERRORS
// ==========================================

bot.on("polling_error", (error) => {

  console.error(
    "❌ Telegram polling error:",
    error?.message || error
  );

});

bot.on("error", (error) => {

  console.error(
    "❌ Telegram bot error:",
    error?.message || error
  );

});

// ==========================================
// NODE.JS ERRORS
// ==========================================

process.on("unhandledRejection", (error) => {

  console.error(
    "❌ UNHANDLED REJECTION:",
    error
  );

});

process.on("uncaughtException", (error) => {

  console.error(
    "❌ UNCAUGHT EXCEPTION:",
    error
  );

});

// ==========================================
// READY
// ==========================================

console.log("🚀 CartoonVerse AI V10 Ready");
