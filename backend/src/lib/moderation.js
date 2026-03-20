import OpenAI from "openai";

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

/**
 * Custom toxic content detection using pattern matching.
 * Catches obvious abusive/harassment phrases as additional safety layer.
 */
function detectCustomToxicity(text) {
  if (!text || typeof text !== "string") return false;

  const lower = text.toLowerCase().trim();

  // Aggressive toxic patterns - tune as needed
  const toxicPatterns = [
    // Direct insults targeting the person
    /you('re|\s+are)?\s+(useless|stupid|dumb|idiot|moron|pathetic|worthless|garbage|trash)/i,
    /you suck|you're trash|you're garbage|you're a joke/i,

    // Hate/death wishes
    /i hate you|i despise|kill yourself|kys|go die|off yourself/i,

    // Harassment/threats
    /you're a \*|get lost|i'll (beat|hurt|kill) you/i,
  ];

  return toxicPatterns.some((pattern) => pattern.test(lower));
}

export async function runModeration({ text, imageUrl }) {
  // Step 1: Check custom toxic patterns first (no API cost, instant detection)
  const customFlagged = detectCustomToxicity(text);
  if (customFlagged) {
    return {
      flagged: true,
      categories: { custom_toxic: true },
      scores: { custom_toxic: 1.0 },
      provider: "custom_rules",
      raw: { method: "custom_toxic_patterns" },
      inputSummary: truncate(text || imageUrl || "", 120),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // Optional demo/testing mode:
  // set FORCE_FLAGGED=true in backend .env if you want all content to be flagged
  if (process.env.FORCE_FLAGGED === "true") {
    return {
      flagged: true,
      categories: { forced_test_flag: true },
      scores: {},
      provider: "local-test",
      raw: { forced: true, reason: "FORCE_FLAGGED enabled" },
      inputSummary: truncate(text || imageUrl || "", 120),
    };
  }

  if (!apiKey) {
    return {
      flagged: false,
      categories: {},
      scores: {},
      provider: "openai",
      raw: { skipped: true, reason: "OPENAI_API_KEY missing" },
      inputSummary: truncate(text || imageUrl || "", 120),
    };
  }

  const client = new OpenAI({ apiKey });

  const input = [];
  if (text && text.trim()) {
    input.push({ type: "text", text: text.trim() });
  }
  if (imageUrl && imageUrl.trim()) {
    input.push({
      type: "image_url",
      image_url: { url: imageUrl.trim() },
    });
  }

  if (input.length === 0) {
    return {
      flagged: false,
      categories: {},
      scores: {},
      provider: "openai",
      raw: { skipped: true, reason: "empty_input" },
      inputSummary: "",
    };
  }

  try {
    const resp = await client.moderations.create({
      model: "omni-moderation-latest",
      input,
    });

    const r0 = resp?.results?.[0] || {};

    return {
      flagged: Boolean(r0.flagged),
      categories: r0.categories || {},
      scores: r0.category_scores || {},
      provider: "openai",
      raw: resp,
      inputSummary: truncate(text || imageUrl || "", 120),
    };
  } catch (error) {
    console.error("Moderation error:", error?.message || error);

    return {
      flagged: false,
      categories: {},
      scores: {},
      provider: "openai",
      raw: {
        skipped: true,
        reason: "moderation_api_error",
        message: error?.message || "Unknown moderation error",
      },
      inputSummary: truncate(text || imageUrl || "", 120),
    };
  }
}