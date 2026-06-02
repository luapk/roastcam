// POST /api/voice  { text }  ->  audio/mpeg
// If the ElevenLabs env vars are not set, this returns 503 and the client
// quietly falls back to the browser's own voice, so the app works either way.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const key = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!key || !voiceId) {
    // Not an error the user needs to see. The client treats this as "use browser voice".
    res.status(503).json({ error: "ElevenLabs not configured." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const text = body && body.text;
    if (!text) {
      res.status(400).json({ error: "No text supplied." });
      return;
    }

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        // turbo_v2_5 is fast + cheap, good for Relentless mode and low latency.
        // Swap for eleven_multilingual_v2 for higher fidelity.
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: "ElevenLabs error", detail: detail.slice(0, 300) });
      return;
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buf);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
