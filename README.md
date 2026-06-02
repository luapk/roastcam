# HEARTBURN

Compliments that don't sit right.

A webcam looks at you. Claude looks back, finds something specifically, visibly true about how you've presented yourself, and writes you a single backhanded Valentine. Then it reads it aloud in a voice of your choosing. Devotion on the surface, a needle underneath.

The needle is aimed at choices and vibe (your lighting, the angle you chose, the room behind you, the gap between the look you were going for and the one you landed), never at the body. It's a Valentine, not a verdict.

---

## Stack

- **Static frontend** (`index.html`) — vanilla, no build step.
- **Two serverless functions** (`api/`) — Node, zero dependencies (native `fetch`).
  - `api/roast.js` — image → Claude vision → one line.
  - `api/voice.js` — text → ElevenLabs → audio. Returns 503 if no keys, and the client falls back to the browser voice.
- **The creative engine** (`lib/brief.js`) — the prompt that does all the work. Server-side so it stays out of the client.

```
heartburn/
├── api/
│   ├── roast.js
│   └── voice.js
├── lib/
│   └── brief.js
├── index.html
├── package.json
├── vercel.json
├── .env.example
├── .gitignore
├── README.md
└── CLAUDE.md
```

---

## Deploy (GitHub → Vercel)

1. **Push to GitHub.**
   ```bash
   git init && git add . && git commit -m "HEARTBURN"
   git branch -M main
   git remote add origin git@github.com:YOU/heartburn.git
   git push -u origin main
   ```

2. **Import to Vercel.** Go to vercel.com/new, pick the repo. Framework preset: **Other**. Leave build command and output directory blank. Vercel serves `index.html` statically and turns `api/*.js` into functions automatically.

3. **Add environment variables** (Project → Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` — **required**.
   - `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` — optional. Skip them and the app uses the browser voice; add them later and the ElevenLabs voice switches on with no code change.

4. **Deploy.** Vercel gives you HTTPS, which the camera needs. Done.

---

## Local dev

The `/api` routes only run under the Vercel runtime, so don't open `index.html` directly off disk.

```bash
npm i -g vercel
vercel link        # once
vercel env pull    # pulls your env vars into .env.local
vercel dev         # http://localhost:3000
```

Camera works on `localhost` and on HTTPS. It will not work over plain `http://` on a LAN IP.

---

## ElevenLabs setup

1. Grab your API key from the ElevenLabs dashboard.
2. Pick or clone a voice, copy its **Voice ID**.
3. Set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in Vercel.
4. `eleven_turbo_v2_5` is the default: fast and cheap, good for Relentless mode. Switch `ELEVENLABS_MODEL_ID` to `eleven_multilingual_v2` for higher fidelity at higher latency.

A dry, slightly amused read sells the joke far better than a sneer. Clone something deadpan.

---

## Tuning the tone

Everything that matters is in `lib/brief.js`. Two sections marked `[DIAL]` control the cruelty:

- **THE LINE OF DECENCY** — where the floor sits. Loosen it for savage, tighten it for gently barbed.
- **THE BAR** — five worked examples that set the register. Rewrite these and the model follows.

The mechanic itself (genuine double meaning, anchored to what's visible, AI tells banned) should stay. That's what keeps the lines sharp instead of generic.

Model lives in `api/roast.js` (`ANTHROPIC_MODEL` env override). Latest model strings: https://docs.claude.com

---

## Cost

Each line is one small vision call (a 640px JPEG in, ~20 words out) plus one short TTS call. Cheap per line. **Relentless mode fires every ~9s**, so it multiplies both. Fine for a party; meter it for a public kiosk.

---

## Notes

- Images are downscaled to 640px client-side before upload to keep calls fast and within serverless body limits.
- The browser mirrors the live preview for comfort; the frame sent to Claude is the true (un-mirrored) orientation.
- No image or line is stored anywhere. It's request-in, line-out.
