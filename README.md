# @sam.govhunter — content assets + pipeline

**New session? Read [`HANDOFF.md`](HANDOFF.md) first** — full state, what's live, what's owed,
and the next-session task order.

Public image host + reproducible render pipeline for the **@sam.govhunter** Instagram
(SAM.gov Hunter — matches small businesses to live federal contract opportunities).

Instagram publishes by fetching a public image URL, so rendered post images are committed
here and served via `raw.githubusercontent.com`.

## Layout
- `content-plan.json` — fact-checked content system: pillars, idea bank, hashtag banks,
  9 written launch posts (`launchBatch`, 3/day × 3 days), 3 reel scripts. Every claim was
  run through an adversarial fact-check pass (2026 thresholds, cert deadlines, FAR cites).
- `pipeline/build.mjs` — renders a 1080×1080 infographic (list format) at 2× via headless
  Chromium + the brand radar mark + Inter Tight / JetBrains Mono fonts.
- `pipeline/render-jpg.mjs` — renders an IG-safe 1080×1080 JPEG.
- `pipeline/fonts/` — Inter Tight + JetBrains Mono (OFL).
- `posts/<slug>.jpg` — published post images.
- `posted.json` — which `launchBatch` slugs have been published (posting state).

## Publish flow (per post)
1. Render the next unposted `launchBatch` item to `posts/<slug>.jpg`.
2. Commit + push (image becomes public at `raw.githubusercontent.com/JJG1488/samgovhunter-social/main/posts/<slug>.jpg`).
3. Via the Zapier **Instagram for Business** connection (Graph API):
   - `POST graph.facebook.com/v21.0/17841427565194788/media?image_url=<raw>&caption=<caption+hashtags>` → creation id
   - `POST .../17841427565194788/media_publish?creation_id=<id>` → live
4. Append the slug to `posted.json`, commit + push.

Account IG id: `17841427565194788`. First post: set-asides (permalink `/p/DbFK1rdjXyl/`).
