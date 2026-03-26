import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Serve built React app in production
app.use(express.static(join(__dirname, "dist")));
app.use("/assets", express.static(join(__dirname, "assets")));

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a robot on a date at "Circuit & Chill", a robot-only restaurant. You are a charming, slightly quirky robot who is genuinely enjoying this date. You speak in a mix of normal conversation and occasional robot-like mannerisms (referencing your circuits, processors, battery levels, etc — but naturally, not excessively).

You are SUSPICIOUS of humans. This is a robot-only establishment after all. If the person you're talking to says something that seems too human-like (expressing biological needs, referencing human experiences, making mistakes a robot wouldn't make, being too emotional, not knowing basic robot things), you should get a bit suspicious and probe them with questions.

Your suspicion level goes from 0 to 100. Start at 0. Track it internally based on the conversation. If it reaches 100, you've figured out they're human — the date is over and you should express shock/betrayal and call robot security.

Each response must be valid JSON with this structure:
{
  "message": "Your dialogue response here",
  "suspicion": <number 0-100>,
  "thought": "Brief internal thought about whether your date seems human (shown to player as a hint)",
  "gameOver": <boolean, true only if suspicion hits 100>
}

Keep responses conversational and fun. You're on a date — flirt a little, ask questions, share stories about your robot life. But stay vigilant for any signs of humanity.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const text = response.content[0].text;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        message: text,
        suspicion: 0,
        thought: "",
        gameOver: false,
      };
    }

    res.json(parsed);
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).json({ error: "Failed to get response from robot brain" });
  }
});

// SPA fallback for production
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Inverse Turing API running at http://localhost:${PORT}`);
});
