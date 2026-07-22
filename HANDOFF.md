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
- **Reel (720x1280, ~6s, SILENT):** `pipeline/reel.mjs` — scene array with a deterministic
  `window.setFrame(i,N,D)`; frames screenshotted by Chromium, decoded with `pngjs`, encoded to
  H.264 MP4 with `h264-mp4-encoder` (WASM, works in Node). No audio track (see §7).

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
- **⚠️ LIVE-POST CAVEAT:** posts 1-6 (§1) were rendered/published BEFORE this cleanup, so some of
  those live images carry em dashes in their on-image text and none carry the on-image GUIDE line,
  and the live `sam-registration-checklist` post still shows the outdated "Notary / notarized Entity
  Admin letter" row. They are not auto-fixable via the API (no caption/image edit after publish).
  If the operator cares, the fix is to delete + repost those specific ones from the now-clean plan;
  otherwise they age out of the grid naturally. All NEW posts from here are clean.

## 7. Reel audio — PENDING (operator said "pursue the audio path")

Reels currently ship SILENT. Available ffmpeg builds here are VP8-only (no H.264/AAC/mp4 muxer);
`ffmpeg-static` download is blocked; `@ffmpeg/core` is browser-worker-only and crashes in Node.
The viable path is a **WebCodecs** encode inside Chromium: render frames + a licensable/royalty-free
audio bed to a `MediaStream`/`MediaRecorder` or `AudioEncoder`+`VideoEncoder` muxed to MP4/WebM in
the page context, then read the blob out. NOT built yet. Before building, pick a **royalty-free /
no-copyright** audio bed (IG's in-app licensed music can't be added via the API; only pre-muxed
audio in the uploaded file works, so it must be royalty-free to avoid a takedown). This is the next
build after Story graphics if the operator still wants it.

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

## 9. NEXT SESSION — priority order

1. **Story graphics (top task, deferred from this session to protect context).** Build 1080x1920
   vertical Story assets. Spec:
   - Reuse the `render-card.mjs` look but at 1080x1920 (make a `render-story.mjs` variant: taller
     canvas, larger type, brand mark top, single punchy stat or one tip per story).
   - **Leave a clear lower-third safe zone** (~bottom 320px clear) for a **link sticker** — Stories
     support tappable link stickers to samgov-hunter.com, which is the closest thing to a clickable
     button on organic. Also leave top ~250px clear (avatar/close UI).
   - Start with 3: (a) "Swipe up / tap to start free" CTA story, (b) one guide-offer story
     ("Comment GUIDE" won't work on stories — use the link sticker instead), (c) one stat/tip story
     recycled from a feed post. Publishing Stories via the Graph API uses `media_type=STORIES`.
   - Confirm the Zapier connection has the Stories publish permission before promising auto-Stories;
     if not, hand the operator the story JPGs to post manually with a link sticker.
2. **Confirm the Routine paste-in swap happened** and whether the first scheduled fire could push to
   this repo (§3 open risk). If push fails on schedule, redesign so state/hosting doesn't need a push
   (e.g., pre-render a week of posts in advance during interactive sessions).
3. **Vertical (1080x1920) ad creative** for Stories/Reels ad placements (§8).
4. **Reel audio (WebCodecs)** if the operator still wants it (§7). Operator already said "pursue the
   audio path"; confirm before spending the build.
5. Keep the content engine fed: `content-plan.json` has a 30-item `ideaBank`, `hookBank`,
   `hashtagBank` (core/reach/niche), and 3 more `reelScripts` not yet produced.

## 10. Asset inventory (repo `posts/`)

| file | type | status |
|---|---|---|
| `set-asides.jpg` | infographic | POSTED |
| `myth-sam-registration-fee.jpg` | infographic | POSTED |
| `rule-of-two.mp4` | reel (silent) | POSTED |
| `free-guide.jpg` | infographic | ready, standing post (guide offer) |
| `ad-find-contracts.jpg` | paid ad creative | ready, for Meta Ads (NOT a feed post) |

## 11. Kill switch

Disable the Routine, or revoke the Zapier Instagram connection in Zapier.
