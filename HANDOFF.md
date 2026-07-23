# HANDOFF — @sam.govhunter Instagram program

Last updated: 2026-07-22. Read this first at the start of any new session.

This repo is the content system + public image host for the Instagram account
**@sam.govhunter** (SAM.gov Hunter — matches small businesses to live US federal contract
opportunities; app at https://www.samgov-hunter.com). Goal of the account: **free signups.**

---

## 1. What is already LIVE

- **Account:** @sam.govhunter, IG Business account id `17841427565194788`, published through the
  Zapier **"Instagram for Business"** connection (Graph API, `graph.facebook.com` only).
- **Posted so far (Day 1, 2026-07-22, 6 live)** — tracked in `posted.json`. The scheduled Routine
  is already publishing autonomously (it posted items 4-6 on its own and pushed state each time):
  1. `set-asides` (infographic) — first post, `/p/DbFK1rdjXyl/`.
  2. `myth-sam-registration-fee` (infographic, myth).
  3. `rule-of-two` (Reel / MP4, silent).
  4. `small-business-lane-2026` (infographic) `/p/DbGXz7niQGp/`.
  5. `sam-registration-checklist` (infographic) `/p/DbGzJ6KktvZ/`.
  6. `myth-wosb-self-certify` (infographic) `/p/DbG6L37kS9Z/`.
  (`rule-of-two-reel` in launchBatch is the same topic as the posted `rule-of-two` video, so it is
  correctly marked posted, no duplicate.)
- **Publishing cadence:** a Claude **Routine** ("Instagram auto-post") fires **5x/day** —
  8am / 11am / 1pm / 4pm / 7pm ET (`0 12,15,17,20,23 * * *` UTC). It has the Zapier Instagram
  connector attached (only connectors attached via the Routines UI carry into scheduled runs;
  agent-created triggers do NOT).

## 2. THE ONE THING THE OPERATOR STILL OWES

The Routine currently holds the **short** instructions. It must be swapped for the hardened
prompt in **`AUTOMATION.md`** (the "PASTE THIS as the Routine's instructions" block). The short
version does not clone the repo, host the image, handle Reels, strip AI tells, or run the guide
mechanic. Open the Routine, delete its instructions, paste the block from `AUTOMATION.md`.
Until that swap happens, scheduled runs will likely fail or post degraded content.

**Also owed (manual, one-time):** set the account's **bio link** to `https://www.samgov-hunter.com`
in the Instagram app. Feed captions cannot carry a clickable link (only the bio link, Story link
stickers, and paid Ads can). Every caption points to "samgov-hunter.com" as text; the bio link is
what makes it tappable. This cannot be done via the API.

## 3. How publishing actually works (the hosting trick)

The environment is network-locked (proxy 403s everything except npm/pypi/anthropic + GitHub via
the session git proxy). Vercel Blob and general web are unreachable. So:

- Rendered images/videos are committed to **this public repo** under `posts/`.
- Instagram fetches them from the raw URL:
  `https://raw.githubusercontent.com/JJG1488/samgovhunter-social/main/posts/<slug>.<ext>`
  (works for both `.jpg` and `.mp4` — IG's servers pull the media by URL).
- Publish = Zapier mutating POST to `.../17841427565194788/media` (image_url or video_url +
  caption) → creation id → `.../media_publish`. Reels need `media_type=REELS`, `share_to_feed=true`,
  and a poll of `?fields=status_code` until `FINISHED` before publish.

**RESOLVED (2026-07-22):** scheduled Routine fires CAN clone, render, push images, and push
`posted.json` state — proven by the 3 posts the schedule published on its own (items 4-6 above,
each with its own `post:` + `state:` commits on `origin/main`). No hosting/state workaround needed.
The paste-in prompt still tells a run to STOP and report if a push ever fails, as a safety net.

## 4. Render pipeline (reproducible)

Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Brand fonts in `pipeline/fonts/`
(Inter Tight Bold/Medium, JetBrains Mono SemiBold, base64-embedded at render). Brand system:
obsidian background, green `#34e27a` accent, radar BrandMark. In a scratch dir install ALL deps in
ONE command (a second `npm i --no-save` prunes earlier ones):

```
npm i playwright-core pngjs h264-mp4-encoder
```

- **Image (1080x1080):** `node pipeline/render-card.mjs <post.json> <outbase>` → `.png` (2x preview)
  + `.jpg` (IG). Post JSON supports:
  - `rows[]` → numbered infographic list (`{tag,name,desc}`).
  - `points[]` → bullets: plain string = green dot; `{kind:"x",text}` = red ✕; `{kind:"check",text}`
    = green ✓; `{kind:"dot",text}` = green dot.
  - `kicker`, `title` (use `<span class="g">word</span>` for the green word), `titleSize`,
    `subtitle`, `cta` (default "Start free at samgov-hunter.com"), `pointSize`.
  - **Always view the rendered PNG before publishing — confirm nothing overflows the 1080 canvas.**
- **Reel (720x1280, ~16-22s, SILENT):** `pipeline/reel.mjs` — a `RAW` scene array where each scene
  has `t` seconds on screen, CLAMPED to `MIN_SCENE` (2.8s) so a scene can never read too fast (this
  is the 2026-07-22 pacing fix; the old reels were 6.4s total and flew by). `window.setFrame` drives
  a gentle fade; frames are screenshotted by Chromium, decoded with `pngjs`, encoded to H.264 MP4
  with `h264-mp4-encoder` (WASM). Run `node pipeline/reel.mjs preview` to write `preview_*.png`
  frames and eyeball readability BEFORE the full render. Keep each scene to ~8 words. No audio (see §7).

The canonical `pipeline/` files live in this repo; the interactive session also keeps working
copies in its scratchpad (`.../scratchpad/ig/render-card.mjs`, `reel.mjs`). If they diverge, the
repo `pipeline/` copies are the source of truth.

## 5. Voice rules (the account must never read as AI-written)

The operator was explicit: no AI tells. Enforced in the paste-in prompt and in every caption:
- **No em dashes, no en dashes, no arrow characters (the → glyph).** Rewrite with periods, commas,
  or parentheses. NOTE: the 9 pre-written `launchBatch` captions in `content-plan.json` DO still
  contain em dashes and → arrows on purpose — the Routine strips them at post time. If you ever
  pre-clean them in the file, keep them clean.
- No "it's not X, it's Y". No forced three-part parallel lists.
- Banned words: delve, leverage, seamless, robust, elevate, unlock, harness, navigate, landscape,
  realm, testament, crucial, pivotal, game-changer.
- Contractions on. Short direct sentences. One soft CTA per caption.

## 6. The Guide mechanic (ManyChat) — on EVERY post, three ways

The operator set up **ManyChat**: anyone who comments or DMs the word **GUIDE** on any post gets
the free federal-contracting starter guide auto-sent. The operator was explicit that EVERY post,
reel, and carousel must mention it. It is now guaranteed structurally, not left to the runtime:
1. **Caption** — every launchBatch, reelScript, and standingPost caption in `content-plan.json`
   has a "comment GUIDE" line baked directly into the text.
2. **Image** — `pipeline/render-card.mjs` renders a "Comment GUIDE for the free starter guide"
   line in the footer of every card automatically (skipped only when the CTA already says GUIDE,
   e.g. the free-guide post, or when a post sets `"guideBar": false`, e.g. the ad creative).
3. **Reel** — `pipeline/reel.mjs` draws a persistent "Comment GUIDE for the free guide" line in
   the bottom chrome of every reel (the `.gtag` div), independent of scene content.
- `content-plan.json → standingPosts` also has a dedicated **free-guide** post
  (`posts/free-guide.jpg`) whose whole purpose is the guide offer. Rotate it in ~twice a week.
- `content-plan.json → guideMechanic` documents the mechanic; `appendToEveryCaption` is a spare
  clean line for any ad-hoc caption that somehow lacks one.

### 6a. Content cleanup done 2026-07-22 (captions + on-image text) — and the live-post caveat
- All published-content text in `content-plan.json` (captions AND on-image subtitle/points/rows/
  scenes) was rewritten to remove every em dash, en dash, and arrow character, plus the banned
  "not X, it's Y" inversion and banned AI words. A 13-agent adversarial GovCon fact-check ran over
  the captions: 10 passed clean; 3 were fixed (see below). `ideaBank`/`hookBank` still contain
  dashes on purpose — they are internal brainstorm notes the Routine rewrites, never posted verbatim.
- **Fact fix:** `sam-registration-checklist` claimed "new registrations still require a notarized
  Entity Administrator letter." GSA dropped that requirement around April 2022 (UEI transition), so
  the claim was removed and the shaky 6th "Notary" row was deleted — the card is now 5 rows, which
  also matches its "5 things" headline. Replaced with an accurate entity-validation note.
- **⚠️ LIVE-POST CAVEAT:** every post published BEFORE this 2026-07-22 cleanup (the ones in §1,
  plus any the Routine keeps posting until the operator swaps in the hardened prompt) predates the
  clean content, so some of those live images carry em dashes in their on-image text and none carry
  the on-image GUIDE line, and the live `sam-registration-checklist` post still shows the outdated
  "Notary / notarized Entity Admin letter" row. They are not auto-fixable via the API (no caption or
  image edit after publish). `posted.json` is the live list of what has gone out.
  If the operator cares, the fix is to delete + repost those specific ones from the now-clean plan;
  otherwise they age out of the grid naturally. All NEW posts from here are clean.

## 7. Reel audio — DONE (2026-07-23, reels now have a synthesized AAC music bed)

Reels used to ship SILENT because the environment has **no WebCodecs** (VideoEncoder/AudioEncoder are
`undefined`, even with flags) and the only ffmpeg (`/opt/pw-browsers/ffmpeg-1011`) is
`--disable-everything` VP8/WebM only (no AAC, no H.264, no MP4 muxer). Solved with **ffmpeg.wasm**,
which DOES run in Node (the handoff's old "crashes in Node" note was the multithreaded build; the
single-threaded `@ffmpeg/core@0.11.0` + `@ffmpeg/ffmpeg@0.11.6` works with a tiny `fetch` shim so its
loader can read local core files — see `pipeline/mux-audio.mjs`).
- `pipeline/audio-bed.mjs` — synthesizes a **royalty-free** bed from pure math (a warm ambient pad
  chord loop + soft pulse + shimmer, mixed quiet). No samples, no copyright, no external file. Matches
  the reel's exact duration.
- `pipeline/mux-audio.mjs` — ffmpeg.wasm muxes the silent H.264 video (stream-copied, no re-encode) +
  the bed encoded to **AAC-LC 160k** into an MP4 with `+faststart`. Verified: output has `avc1` +
  `mp4a` tracks, moov before mdat.
- `pipeline/reel.mjs` calls both automatically after the silent encode (best-effort: any failure keeps
  the silent video; `REEL_AUDIO_DISABLED=1` renders silent). Needs `@ffmpeg/ffmpeg@0.11.6` +
  `@ffmpeg/core@0.11.0` installed and the two helper files next to reel.mjs (AUTOMATION.md updated).
- **Tune the bed** in `audio-bed.mjs`: `padGain` / `pulseGain` / `shimmerGain` (volumes), `chordDur`
  (pace), `PROG` (the chord progression). The operator should ear-check it and say if it needs to be
  quieter / warmer / different — it was designed tasteful-and-subtle but was not audibly reviewed here.
- **Note vs IG trending audio:** API-published reels cannot use IG's in-app licensed music (app-only),
  and IG's algorithm favors trending sounds. The baked-in bed is the right call for AUTO-posted reels;
  if a specific reel is posted manually, IG trending audio would reach further. Both are valid.

## 8. Facebook / Instagram AD creative (the original ask)

The account's very first request was a **Facebook ad asset** (first-time advertiser). Built:
- `posts/ad-find-contracts.jpg` (1080x1080). This is a **paid ad creative, NOT an organic feed
  post** — do not publish it to the feed via the Routine.
- Ad copy is in `content-plan.json → adCreatives[0]`: primaryText, headline, description,
  CTA button = **Sign Up**, URL = https://www.samgov-hunter.com.
- Operator uses this in Meta Ads Manager (Facebook/Instagram placements). Unlike feed posts, an ad
  DOES get a real clickable button + destination URL — this is the only way to put a true "learn
  more / sign up" button on a scroll. Recommend 1080x1080 (feed) plus a 1080x1920 version for
  Stories/Reels ad placements (that vertical version is not built yet).

## 8a. Story graphics (built 2026-07-23)

Three 1080x1920 Story graphics are in `stories/`, rendered by `pipeline/render-story.mjs`:
- `story-start-free.jpg` — signups CTA ("Find contracts that fit your business" + Start free).
- `story-guide.jpg` — lead capture ("Grab the free starter guide" + Reply GUIDE).
- `story-rule-of-two.jpg` — an educational tip (recycled from a feed topic).

Design: brand system; top ~250px kept clear (profile UI); bottom ~340px kept clear for the link
sticker + reply bar, with a green chevron cue marking where the sticker goes.

**Publishing (important limitation):** the Graph API can publish a Story (`media_type=STORIES`) but
**cannot add a tappable link sticker** — that is an interactive element only addable in the IG app.
Two modes:
- **Manual (recommended, gives the clickable link):** download the JPG from `stories/`, post it as a
  Story in the IG app, and drop a **link sticker to https://www.samgov-hunter.com** in the clear
  bottom band where the chevron points. Closest thing to a clickable button on organic.
- **Auto (Routine, no tappable link):** a Story posted via the API shows the image only. If you ever
  auto-post Stories, render them with `"linkCue": false` so the "tap the link" cue is not misleading,
  and rely on the bio link. The guide Story still works auto-posted because "Reply GUIDE" is a DM,
  which ManyChat catches.

**Render more:** `node pipeline/render-story.mjs <story.json> stories/<slug>`. JSON supports `kicker`,
`title` (with `<span class="g">word</span>`), `titleSize`, `subtitle`, optional `points` (2-3),
`ctaKind` ("link" | "guide"), `cta`, `linkCue`, `guideLine`. Any of the 311 content-plan topics can
become a Story.

## 9. NEXT SESSION — priority order

Nothing here is required or blocking. Reel audio (§7), reel pacing, the content bank, stories, GUIDE
everywhere, and the ad creative are all DONE. These are optional/future:

1. **True swipeable carousels** (multi-slide posts) if wanted — the pipeline does single images,
   reels, and stories today, not multi-image carousels (the Routine renders carousel-format ideas as
   a single infographic). Only build if the operator wants real swipeable carousels.
2. **Vertical (1080x1920) ad creative** for Stories/Reels ad placements (§8) — `render-story.mjs` is
   a good base for it. The square 1080x1080 ad already exists.
3. **More Story graphics** as needed (§8a) — any of the 311 topics can become a Story.
4. **Optional cleanup of pre-2026-07-22 live posts** (§6a caveat) — a handful of early posts predate
   the AI-tell/GUIDE cleanup; delete+repost only if the operator cares, else they age out.
5. Content is stocked: 298-topic `ideaBank` / 311 distinct topics (§10a), ~90-day runway. Regenerate
   more via the `govcon-content-bank` workflow pattern when it thins out (~2 months).

## 10. Asset inventory (repo `posts/`)

| file | type | status |
|---|---|---|
| `set-asides.jpg` | infographic | POSTED |
| `myth-sam-registration-fee.jpg` | infographic | POSTED |
| `rule-of-two.mp4` | reel (silent) | POSTED |
| `free-guide.jpg` | infographic | ready, standing post (guide offer) |
| `ad-find-contracts.jpg` | paid ad creative | ready, for Meta Ads (NOT a feed post) |

## 10a. Content runway (built 2026-07-22)

`content-plan.json` holds **311 distinct topics**: 9 finished launchBatch posts + 3 finished
reelScripts + 1 evergreen standingPost + a **298-topic `ideaBank`**. The ideaBank was expanded from
30 to 298 via two adversarial fact-check workflows (269 net-new GovCon topics, each independently
verified against 2026 FAR/SBA/GSA rules, deduped, and scrubbed of AI-tells). Each ideaBank entry is
a one-line seed in the form `"<Format>: <topic> and <key fact>"`; the Routine renders it into a full
post at post time (and must re-confirm any specific date/threshold/FAR cite while composing).
- **Runway at 5 posts/day:** ~62 days with zero repeats, or ~90+ days with light, spaced,
  format-varied reuse (which is normal and good — new followers have not seen older posts).
- When the ideaBank starts to feel thin (~2 months out), regenerate more with the same workflow
  pattern (see `workflows/scripts/govcon-content-bank*.js`), pointing the exclusion list at the
  then-current topics. GovCon has roughly 350-400 solid distinct angles before quality drops.
- Format mix in the bank: infographic / myth / tips / spotlight / reel / carousel. The Routine
  rotates pillars + formats so consecutive posts differ.

## 11. Kill switch

Disable the Routine, or revoke the Zapier Instagram connection in Zapier.
