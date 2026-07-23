import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Instagram Story = 1080x1920. Safe zones: keep the top ~250px clear (profile row + close X)
// and the bottom ~340px clear (reply bar + where the operator drops the tappable LINK STICKER).
// Link stickers CANNOT be added via the API, so a Story published through the Routine shows the
// image only. For a tappable link, post the Story manually in the app and add a link sticker to
// samgov-hunter.com in the clear bottom band (the down-chevron cue marks the spot).
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const FONT_DIR = new URL('./fonts', import.meta.url).pathname
const b64 = (f) => readFileSync(`${FONT_DIR}/${f}`).toString('base64')
const FONT = { bold: b64('InterTight-Bold.woff'), med: b64('InterTight-Medium.woff'), mono: b64('JetBrainsMono-SemiBold.woff') }

const MARK = `<svg viewBox="0 0 100 100" class="mark" xmlns="http://www.w3.org/2000/svg"><defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16203a"/><stop offset="1" stop-color="#1d2942"/></linearGradient>
<linearGradient id="arm" x1="0.15" y1="1" x2="0.95" y2="0.05"><stop offset="0" stop-color="#15a34a"/><stop offset="1" stop-color="#5bf08a"/></linearGradient>
<linearGradient id="sweep" x1="0.3" y1="0.05" x2="1" y2="0.75"><stop offset="0" stop-color="#22c55e" stop-opacity="0"/><stop offset="1" stop-color="#22c55e" stop-opacity="0.5"/></linearGradient>
<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#22c55e" stop-opacity="0.16"/><stop offset="0.72" stop-color="#22c55e" stop-opacity="0"/></radialGradient></defs>
<rect width="100" height="100" rx="22" fill="url(#bg)"/><circle cx="50" cy="50" r="46" fill="url(#halo)"/>
<circle cx="50" cy="50" r="42" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.32"/>
<circle cx="50" cy="50" r="30" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.5"/>
<circle cx="50" cy="50" r="18" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.7"/>
<path d="M50 50 L50 8 A42 42 0 0 1 86.37 29 Z" fill="url(#sweep)"/>
<line x1="50" y1="50" x2="84.64" y2="30" stroke="url(#arm)" stroke-width="3.6" stroke-linecap="round"/>
<circle cx="72.5" cy="37" r="8" fill="none" stroke="#5bf08a" stroke-width="1.4" opacity="0.45"/>
<circle cx="72.5" cy="37" r="5" fill="#5bf08a"/><circle cx="50" cy="50" r="4.6" fill="#f8fafc"/></svg>`

const DECO = `<svg class="deco" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
<g fill="none" stroke="#2f7d54" stroke-width="1.5"><circle cx="300" cy="300" r="290" opacity="0.10"/><circle cx="300" cy="300" r="220" opacity="0.13"/><circle cx="300" cy="300" r="150" opacity="0.16"/><circle cx="300" cy="300" r="80" opacity="0.20"/></g>
<line x1="300" y1="300" x2="300" y2="10" stroke="#2f7d54" stroke-width="1.5" opacity="0.14"/><line x1="300" y1="300" x2="590" y2="300" stroke="#2f7d54" stroke-width="1.5" opacity="0.14"/>
<defs><linearGradient id="ds" x1="0.5" y1="0" x2="1" y2="0.5"><stop offset="0" stop-color="#22c55e" stop-opacity="0"/><stop offset="1" stop-color="#22c55e" stop-opacity="0.22"/></linearGradient></defs>
<path d="M300 300 L300 10 A290 290 0 0 1 505 95 Z" fill="url(#ds)"/></svg>`

const post = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const outBase = process.argv[3]
const isGuide = post.ctaKind === 'guide'
const ctaText = post.cta || (isGuide ? "Reply GUIDE and I'll send it over" : 'Start free at samgov-hunter.com')
const pointsHtml = post.points ? `<div class="points">` + post.points.map((p) => `<div class="pt"><span class="dot"></span><div>${p}</div></div>`).join('') + `</div>` : ''
// GUIDE line: shown on non-guide stories (the guide story already IS the guide ask). Stories have
// no public comments, so the mechanic is a DM: "Reply GUIDE".
const guideLine = (!isGuide && post.guideLine !== false) ? `<div class="guideline">Reply <b>GUIDE</b> for the free starter guide</div>` : ''
const linkCue = post.linkCue !== false ? `<div class="cue"><svg class="chev" width="72" height="42" viewBox="0 0 72 42"><path d="M9 9 L36 32 L63 9" fill="none" stroke="#34e27a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="cuetext">${isGuide ? 'or tap the link below' : 'Tap the link below'}</div></div>` : ''

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'IT';src:url(data:font/woff;base64,${FONT.bold}) format('woff');font-weight:700}
@font-face{font-family:'ITM';src:url(data:font/woff;base64,${FONT.med}) format('woff');font-weight:500}
@font-face{font-family:'JB';src:url(data:font/woff;base64,${FONT.mono}) format('woff');font-weight:600}
*{margin:0;padding:0;box-sizing:border-box}
.canvas{width:1080px;height:1920px;position:relative;overflow:hidden;color:#f4f8f6;font-family:'ITM',system-ui,sans-serif;
 background:radial-gradient(1200px 900px at 82% 2%, rgba(34,197,94,.18), transparent 60%),radial-gradient(1000px 1100px at -12% 104%, rgba(34,197,94,.11), transparent 55%),linear-gradient(165deg,#07130f 0%,#0a1a16 55%,#081512 100%)}
.canvas::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(120,200,150,.08) 1.3px,transparent 1.3px);background-size:40px 40px;opacity:.5;mask-image:linear-gradient(180deg,#000,transparent 72%)}
.deco{position:absolute;right:-170px;top:60px;width:760px;height:760px}
.pad{position:absolute;inset:0;padding:250px 96px 340px;display:flex;flex-direction:column}
/* top clear zone = 250px padding (profile row). bottom clear zone = 340px (reply bar + link sticker). */
.brand{display:flex;align-items:center;gap:20px}
.mark{width:76px;height:76px;filter:drop-shadow(0 6px 18px rgba(34,197,94,.28))}
.word{font-family:'IT';font-weight:700;font-size:34px;letter-spacing:.14em}
.word b{color:#34e27a}
.kicker{display:inline-block;align-self:flex-start;margin-top:64px;font-family:'JB';font-weight:600;font-size:24px;letter-spacing:.16em;color:#0a1512;background:#34e27a;padding:12px 20px;border-radius:999px}
.title{font-family:'IT';font-weight:700;font-size:${post.titleSize || 96}px;line-height:1.02;letter-spacing:-.02em;margin-top:34px}
.title .g{color:#34e27a;text-shadow:0 0 38px rgba(52,226,122,.4)}
.sub{font-family:'ITM';font-weight:500;font-size:38px;line-height:1.34;color:#b3c7be;margin-top:34px}
.points{margin-top:52px;display:flex;flex-direction:column;gap:34px}
.pt{display:flex;align-items:flex-start;gap:26px;font-family:'ITM';font-weight:500;font-size:42px;line-height:1.28;color:#e7efec}
.dot{flex:0 0 auto;width:18px;height:18px;border-radius:50%;background:#34e27a;margin-top:16px;box-shadow:0 0 16px rgba(52,226,122,.6)}
.spacer{flex:1 1 auto;min-height:40px}
.ctawrap{display:flex;flex-direction:column;align-items:center;gap:26px}
.cta{font-family:'IT';font-weight:700;font-size:44px;color:#06110d;background:#34e27a;padding:30px 46px;border-radius:24px;box-shadow:0 16px 46px rgba(52,226,122,.34);text-align:center;line-height:1.08}
.guideline{font-family:'ITM';font-weight:500;font-size:30px;color:#9db3ab}
.guideline b{font-family:'IT';font-weight:700;color:#34e27a;letter-spacing:.02em}
.cue{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:6px}
.chev{opacity:.92;filter:drop-shadow(0 0 10px rgba(52,226,122,.45))}
.cuetext{font-family:'JB';font-weight:600;font-size:26px;letter-spacing:.06em;color:#8fbfa4}
</style></head><body><div class="canvas">${DECO}<div class="pad">
<div class="brand">${MARK}<div class="word">SAM.GOV <b>HUNTER</b></div></div>
<div class="kicker">${post.kicker}</div>
<div class="title">${post.title}</div>
${post.subtitle ? `<div class="sub">${post.subtitle}</div>` : ''}
${pointsHtml}
<div class="spacer"></div>
<div class="ctawrap"><div class="cta">${ctaText}</div>${guideLine}${linkCue}</div>
</div></div></body></html>`

const htmlPath = `${outBase}.html`
writeFileSync(htmlPath, html)
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] })
let ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
let page = await ctx.newPage()
await page.goto('file://' + resolve(htmlPath)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(120)
await page.screenshot({ path: `${outBase}.png`, clip: { x: 0, y: 0, width: 1080, height: 1920 } })
await ctx.close()
ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
page = await ctx.newPage()
await page.goto('file://' + resolve(htmlPath)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(120)
await page.screenshot({ path: `${outBase}.jpg`, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1920 } })
await browser.close()
const buf = readFileSync(`${outBase}.png`)
console.log('rendered story', `${outBase}.png/.jpg`, `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`)
