
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
  res.send("CartoonVerse AI V10 is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    bot: "CartoonVerse AI V10",
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!BOT_TOKEN || !GEMINI_KEY) {
  console.error("Missing BOT_TOKEN or GEMINI_API_KEY.");
  process.exit(1);
}

// ==========================================
// GEMINI AI
// ==========================================

const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

async function generateAI(prompt) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const result = response.text;

      if (!result || !result.trim()) {
        throw new Error("Gemini returned an empty response.");
      }

      return result.trim();
    } catch (error) {
      const message = error?.message || String(error);
      console.error(`Gemini attempt ${attempt}: ${message}`);

      const temporary =
        /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|500|INTERNAL|overloaded/i
          .test(message);

      if (!temporary || attempt === maxAttempts) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }

  throw new Error("AI generation failed.");
}

// ==========================================
// TELEGRAM BOT
// ==========================================

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log("CartoonVerse AI V10 bot started");

// ==========================================
// SEND LONG RESPONSES
// ==========================================

async function sendLongMessage(chatId, text) {
  const MAX_LENGTH = 3800;
  const cleanText = String(text || "").trim();

  if (!cleanText) {
    await bot.sendMessage(chatId, "AI તરફથી ખાલી જવાબ મળ્યો.");
    return;
  }

  for (let i = 0; i < cleanText.length; i += MAX_LENGTH) {
    await bot.sendMessage(
      chatId,
      cleanText.substring(i, i + MAX_LENGTH)
    );

    if (i + MAX_LENGTH < cleanText.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

async function handleError(chatId, label, error) {
  console.error(`${label} ERROR:`, error?.message || error);

  try {
    await bot.sendMessage(
      chatId,
      `❌ ${label} બનાવવામાં ભૂલ થઈ.\nથોડી વાર પછી ફરી પ્રયાસ કરો.\n\n` +
      String(error?.message || error).slice(0, 500)
    );
  } catch (sendError) {
    console.error("Could not send error message:", sendError.message);
  }
}

// ==========================================
// /START
// ==========================================

bot.onText(/^\/start(?:@\w+)?$/i, async msg => {
  try {
    await bot.sendMessage(
      msg.chat.id,
      `🎬 Welcome to CartoonVerse AI V10!

📖 /story football
હિન્દી cartoon story બનાવો.

🎥 /movie magic pencil
10 scenes સાથે movie plan બનાવો.

🎨 /character Riya
Reusable character sheet બનાવો.

📚 /help
બધા commands જુઓ.

નોંધ: આ bot text અને prompts બનાવે છે.
આ code પોતે image કે video file બનાવતું નથી.`
    );
  } catch (error) {
    console.error("START ERROR:", error.message);
  }
});

// ==========================================
// /HELP
// ==========================================

bot.onText(/^\/help(?:@\w+)?$/i, async msg => {
  try {
    await bot.sendMessage(
      msg.chat.id,
      `📚 CARTOONVERSE AI V10

/start
Bot શરૂ કરો.

/help
Commands જુઓ.

/story <topic>
હિન્દી cartoon story બનાવો.
Example: /story football

/movie <topic>
10-scene movie plan બનાવો.
Example: /movie magic pencil

/character <name>
Character sheet અને image prompt બનાવો.
Example: /character Riya`
    );
  } catch (error) {
    console.error("HELP ERROR:", error.message);
  }
});

// ==========================================
// /STORY
// ==========================================

bot.onText(/^\/story(?:@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const topic = (match[1] || "").trim();

  if (!topic) {
    await bot.sendMessage(
      chatId,
      "Story topic આપો.\nExample: /story football"
    );
    return;
  }

  try {
    await bot.sendMessage(chatId, "✍️ Story બની રહી છે...");

    const prompt = `
You are CartoonVerse AI V10 Story Engine.

Write an original Hindi cartoon story for YouTube.
Topic: ${topic}

Requirements:
- Simple Hindi, suitable for children aged 5-10.
- Strong opening hook.
- Interesting characters.
- Clear problem and adventure.
- Natural Hindi dialogue.
- Exciting climax and happy ending.
- Moral at the end.
- About 3-5 minutes of narration.
- No graphic violence.

Format:
TITLE:
CHARACTERS:
HOOK:
STORY:
CLIMAX:
ENDING:
MORAL:
`;

    const story = await generateAI(prompt);

    await sendLongMessage(
      chatId,
      `🎬 CARTOONVERSE AI V10\n\n📖 STORY\n\n${story}`
    );
  } catch (error) {
    await handleError(chatId, "STORY", error);
  }
});

// ==========================================
// /MOVIE
// ==========================================

bot.onText(/^\/movie(?:@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const topic = (match[1] || "").trim();

  if (!topic) {
    await bot.sendMessage(
      chatId,
      "Movie topic આપો.\nExample: /movie magic pencil"
    );
    return;
  }

  try {
    await bot.sendMessage(chatId, "🎥 Movie plan બની રહ્યો છે...");

    const prompt = `
You are CartoonVerse AI V10 Movie Engine.

Create an original Hindi kids cartoon movie plan.
Topic: ${topic}

Write the story and dialogue in simple Hindi.
Write image and video generation prompts in English.

Include:
1. Movie title and story summary.
2. Main characters and detailed visual descriptions.
3. Character consistency guide.
4. Exactly 10 numbered scenes.

For EACH scene provide:
- Scene description.
- Hindi narration.
- Hindi dialogue.
- English image-generation prompt.
- English video-generation prompt.
- Camera movement and action.

Finish with:
- Climax.
- Happy ending.
- Moral.
- YouTube title.
- YouTube description.

Keep character designs consistent across all scenes.
Keep content original and suitable for children.
Return the completed movie plan directly.
`;

    const movie = await generateAI(prompt);

    await sendLongMessage(
      chatId,
      `🎥 CARTOONVERSE AI V10\n\n${movie}`
    );
  } catch (error) {
    await handleError(chatId, "MOVIE", error);
  }
});

// ==========================================
// /CHARACTER
// ==========================================

bot.onText(/^\/character(?:@\w+)?(?:\s+([\s\S]+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const name = (match[1] || "").trim();

  if (!name) {
    await bot.sendMessage(
      chatId,
      "Character નું નામ આપો.\nExample: /character Riya"
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

Create a detailed, original, reusable cartoon character sheet.

Character name: ${name}

Explain in simple Hindi:
1. Character name and role.
2. Apparent age.
3. Face and head shape.
4. Hairstyle and exact hair color.
5. Eye shape and color.
6. Skin tone.
7. Outfit with exact colors and details.
8. Shoes and accessories.
9. Cartoon body proportions and height.
10. Personality and facial expressions.
11. Signature pose and distinctive features.
12. Fixed color palette.
13. Front-view full-body English image-generation prompt.
14. English negative prompt.
15. Consistency rules for future scenes.

IMPORTANT:
- Make the character original and child-friendly.
- Choose specific visual details.
- Keep face, hair, eye color, clothing, shoes,
  accessories and proportions consistent in future scenes.
- The image prompt must clearly describe a full-body character.
- Do not claim an image file has been generated.
- Return text and prompts only.
`;

    const character = await generateAI(prompt);

    await sendLongMessage(
      chatId,
      `🎨 CARTOONVERSE AI V10\n\nCHARACTER SHEET: ${name}\n\n${character}`
    );
  } catch (error) {
    await handleError(chatId, "CHARACTER", error);
  }
});

// ==========================================
// TELEGRAM AND NODE.JS ERRORS
// ==========================================

bot.on("polling_error", error => {
  console.error("Telegram polling error:", error?.message || error);
});

bot.on("error", error => {
  console.error("Telegram bot error:", error?.message || error);
});

process.on("unhandledRejection", error => {
  console.error("Unhandled rejection:", error);
});

console.log("🚀 CartoonVerse AI V10 Ready");
