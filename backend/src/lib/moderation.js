import OpenAI from "openai";

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export async function runModeration({ text, imageUrl }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Dev-friendly fallback: no key => never flag, but still return a shaped object.
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
  if (text && text.trim()) input.push({ type: "text", text });
  if (imageUrl && imageUrl.trim()) input.push({ type: "image_url", image_url: { url: imageUrl } });

  // If nothing to moderate, allow.
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
}

