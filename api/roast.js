import { buildPrompt } from "../lib/brief.js";

// POST /api/roast  { image: "<base64 jpeg, no data: prefix>", usedTargets?: string[] }  ->  { line, target }
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "Missing ANTHROPIC_API_KEY on the server." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const image = body && body.image;
    if (!image) {
      res.status(400).json({ error: "No image supplied." });
      return;
    }

    const usedTargets = Array.isArray(body.usedTargets) ? body.usedTargets : [];
    const prompt = buildPrompt(usedTargets);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 300,
        temperature: 1,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
              { type: "text", text: prompt + "\n\nWrite this person's Valentine now. Output only the JSON object." },
            ],
          },
        ],
      }),
    });

    const data = await r.json();
    if (data.error) {
      res.status(502).json({ error: data.error.message || "Anthropic error" });
      return;
    }

    let text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let line, target;
    try {
      const parsed = JSON.parse(text);
      line = parsed.line;
      target = parsed.target;
    } catch (_) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try { const parsed = JSON.parse(m[0]); line = parsed.line; target = parsed.target; } catch (__) {}
      }
      if (!line) line = text.replace(/^["']|["']$/g, "");
    }

    res.status(200).json({
      line: line || "Words fail me. Which, looking at you, is a mercy.",
      target: target || null,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
