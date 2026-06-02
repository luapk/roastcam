# CLAUDE.md

Continuity notes for HEARTBURN. Read before changing anything.

## What it is

A webcam-fed novelty app that writes one backhanded Valentine about the person on screen and reads it aloud. Sweet surface, sharp underneath. Built fast as a toy / potential activation.

## Architecture

- Static `index.html` (vanilla JS, no framework, no build). All UI, camera capture, render, audio playback.
- `api/roast.js` — POST `{ image: base64 jpeg }` → `{ line }`. Calls Anthropic `/v1/messages` with vision. Holds `ANTHROPIC_API_KEY`.
- `api/voice.js` — POST `{ text }` → `audio/mpeg`. Calls ElevenLabs TTS. Holds `ELEVENLABS_*`. Returns 503 when unconfigured; the client treats that as "use browser voice."
- `lib/brief.js` — the system brief. The actual product. Imported by `roast.js`. Kept server-side deliberately.

Zero npm dependencies. Native `fetch` (Vercel Node 18+). ESM throughout (`"type":"module"`).

## Conventions

- Palette in `:root` CSS vars: oxblood `#5c0f1b`, gold `#b8954a`, aged cream `#f3e9d6`, wax `#8e1c2a`. Anti-Valentine / poisoned love letter, not bubblegum pink.
- Fonts: Cinzel Decorative (display), Cormorant Garamond (the line, italic), Jost (UI). Via Google Fonts `<link>`.
- Model: `claude-sonnet-4-6`, overridable via `ANTHROPIC_MODEL`. Check docs.claude.com for the current string before assuming.

## The creative engine (lib/brief.js)

The non-negotiable mechanic: a **genuine double meaning** (compliment to a careless ear, insult to a careful one, both true), **anchored to what is visibly true** in the frame, with AI tells banned (no em dashes, no "imagine", no "it's not just X it's Y", no adspeak). Do not soften this into generic niceness; that kills the whole thing.

The cruelty floor is the two `[DIAL]` sections (THE LINE OF DECENCY, THE BAR). Aim at choices/vibe, never the body, never immutable traits. This is both the ethical floor and where the better writing lives.

## Known constraints

- Camera needs HTTPS or localhost. Vercel gives HTTPS. Plain http on a LAN IP will fail.
- Serverless body limit (~4.5MB Hobby). Frames are downscaled to 640px client-side, well under.
- `vercel dev` for local; opening index.html off disk won't reach `/api`.
- No persistence. Nothing is stored.

## Next-iteration backlog (not built)

- **Capture-to-share**: render the locket photo + the line as a downloadable/shareable card (canvas composite). Obvious social hook for an activation.
- **Printed receipt**: thermal-printer endpoint for a kiosk ("take home your worst Valentine").
- **Meanness toggle in the UI**: pass a `tone` param to `/api/roast`, branch the brief between "card-shop passive-aggressive" and "Cannes-cruel".
- **Rate limiting / a meter**: before any public/kiosk deployment, cap calls per session and watch the Anthropic + ElevenLabs spend, especially with Relentless mode.
- **Voice warm-up**: pre-clone a deadpan ElevenLabs voice; the read sells the joke.
