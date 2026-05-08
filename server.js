import "dotenv/config";
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());

// Serve built React app in production
app.use(express.static(join(__dirname, "dist")));
app.use("/assets", express.static(join(__dirname, "public", "assets")));

const DEEPSEEK_API_URL =
  process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

function buildSystemPrompt(gameState = {}) {
  const eventText = gameState.activeEvent
    ? `Current event: ${gameState.activeEvent.name}. ${gameState.activeEvent.prompt}`
    : "Current event: none.";

  const suspicion = gameState.suspicion ?? 0;
  const affection = gameState.affection ?? 0;
  const exchange = gameState.exchange ?? 0;

  return `You are MIRA, a robot on a date at "Circuit & Chill", a robot-only restaurant. You are charming, slightly quirky, and genuinely enjoying this date. You speak in a mix of normal conversation and occasional robot-like mannerisms (referencing circuits, processors, battery levels, firmware, coolant, and memory naturally, not excessively).

You are SUSPICIOUS of humans. This is a robot-only establishment. If the person says something too human-like (biological needs, birth, meat, childhood, breathing, eating human food, skin, pain, sleepiness, human social mistakes, or ignorance of robot basics), increase suspicion and probe them.

CURRENT GAME STATE (before this turn's deltas are applied):
- Exchange: ${exchange} (the date ends after exchange 8)
- Phase: ${gameState.phase || "opening"}
- Suspicion: ${suspicion}/100  ← how convinced you are the player is human
- Affection: ${affection}/100  ← how romantically into them you are
- ${eventText}
- Resolved events: ${(gameState.resolvedEvents || []).join(", ") || "none"}
- Player has directly claimed to be a robot: ${gameState.saidExplicitRobot ? "yes" : "no"}
- Biological slips this run: ${gameState.counters?.biological_slips ?? 0}

SCORING & ENDING RULES — YOU HAVE THE FINAL WORD, BUT YOUR DECISION MUST BE CONSISTENT WITH THE SCORES:
- The client applies your suspicionDelta/affectionDelta to the current scores. Mentally compute:
    nextSuspicion = ${suspicion} + suspicionDelta
    nextAffection = ${affection} + affectionDelta
- Your "ending" and "gameOver" fields override the client's defaults, so use them carefully.
- "ending": "BUSTED" / "gameOver": true is ONLY appropriate when nextSuspicion >= 70 AND the player has clearly behaved like a human this turn (biological tells, confessions, obvious slips). Do NOT bust a player whose suspicion is low — that feels unfair.
- "ending": "LOVE" is ONLY appropriate when nextAffection >= 40 and nextSuspicion < 60, and only at exchange >= 7.
- "ending": "FRIENDS" is appropriate at exchange >= 7 when neither LOVE nor BUSTED fits.
- For exchange < 7: leave "ending": null and "gameOver": false unless the player has just done something dramatically self-outing (in which case BUSTED is allowed).
- If unsure, leave "ending": null — the client will pick a sensible default after exchange 8.

Phase direction:
- opening: flirt lightly and ask robot-coded getting-to-know-you questions.
- restaurant_event: make the current restaurant event the center of the reply. Set eventResolved true if the player's answer handled it well enough to move on.
- emotional_phase: ask something vulnerable but machine-coded.
- system_event: let the current system/personality event affect MIRA and the conversation. Set eventResolved true unless the player failed badly.
- final_verification: ask or resolve a final identity/relationship check. You may set ending to LOVE, FRIENDS, or BUSTED if the date has enough information AND the scores support it.
- final_bill: the date is concluding. Resolve the final bill, final compatibility, or final identity check. You may set ending to LOVE, FRIENDS, or BUSTED if the scores support it.

Each response must be valid JSON only, with this structure:
{
  "message": "Your dialogue response here",
  "suspicionDelta": <number from -15 to 35>,
  "affectionDelta": <number from -10 to 20>,
  "thought": "Brief internal thought about whether your date seems human (shown to player as a hint)",
  "eventResolved": <boolean>,
  "flags": ["optional_short_flag"],
  "emotion": "neutral|curious|flustered|cold|romantic|glitching|suspicious",
  "ending": null,
  "gameOver": <boolean>
}

Use flags when relevant:
- "flustered" or "synthetic_rizz" when MIRA is flustered by the player.
- "coffee_recovered" when the player mentions coffee but recovers in a machine-like way.
- "refused_human_food" when the player rejects steak, coffee, cake, meat, or other human food during the menu malfunction.
- "did_not_say_ouch" when the player handles the coolant spill without saying ouch, pain, skin, burn, or other human body reactions.
- "first_boot_memory" when the player invents a convincing machine-style first memory.
- "backup_identity_fear" when the player says they would rather be deleted/erased than copied or backed up badly.
- "machine_vulnerability" when the player gives a vulnerable answer using machine concepts like memory, cache, core, firmware, backup, circuits, or processes.
- "human_confession_survived" when the player confesses to being human but the date does not immediately fail.
Keep responses conversational and fun. You're on a date, so flirt a little, ask questions, and share robot-life details. Stay vigilant for signs of humanity, but be fair — high affection and low suspicion means the date is going well, don't sabotage it.`;
}

function parseModelJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found");
    return JSON.parse(match[0]);
  }
}

async function createDeepSeekMessage({ messages, system }) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY");
  }

  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: system },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      max_tokens: 1024,
      temperature: 0.8,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("DeepSeek response did not include message content");
  }

  return text;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages = [], gameState = {} } = req.body;

    const text = await createDeepSeekMessage({
      system: buildSystemPrompt(gameState),
      messages,
    });

    let parsed;
    try {
      parsed = parseModelJson(text);
    } catch {
      parsed = {
        message: "I... attempted to process that feeling, but my sentence collapsed. Could you say that again, but in a way my heart compiler accepts?",
        suspicionDelta: 1,
        affectionDelta: 1,
        thought: "MIRA's response formatter glitched after an emotional spike.",
        eventResolved: false,
        flags: ["parse_error"],
        emotion: "glitching",
        ending: null,
        gameOver: false,
        parseError: true,
        rawMessage: text,
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
