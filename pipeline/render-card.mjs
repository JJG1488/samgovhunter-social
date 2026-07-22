import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

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

function markerHtml(kind) {
  if (kind === 'x') return `<span class="mk mkx">✕</span>`
  if (kind === 'check') return `<span class="mk mkc">✓</span>`
  return `<span class="mk mkd"></span>`
}

function body(post) {
  if (post.rows) {
    return `<div class="list">` + post.rows.map((r, i) => `
      <div class="row"><div class="tag">${r.tag}</div>
      <div class="rtext"><div class="rname">${r.name}</div><div class="rdesc">${r.desc}</div></div>
      <div class="rnum">${String(i + 1).padStart(2, '0')}</div></div>`).join('') + `</div>`
  }
  return `<div class="points">` + post.points.map((p) => {
    const kind = typeof p === 'string' ? 'dot' : p.kind
    const text = typeof p === 'string' ? p : p.text
    return `<div class="pt">${markerHtml(kind)}<div class="pttext">${text}</div></div>`
  }).join('') + `</div>`
}

const post = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const outBase = process.argv[3]

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'IT';src:url(data:font/woff;base64,${FONT.bold}) format('woff');font-weight:700}
@font-face{font-family:'ITM';src:url(data:font/woff;base64,${FONT.med}) format('woff');font-weight:500}
@font-face{font-family:'JB';src:url(data:font/woff;base64,${FONT.mono}) format('woff');font-weight:600}
*{margin:0;padding:0;box-sizing:border-box}
.canvas{width:1080px;height:1080px;position:relative;overflow:hidden;color:#f4f8f6;font-family:'ITM',system-ui,sans-serif;
 background:radial-gradient(1100px 700px at 80% -8%, rgba(34,197,94,.16), transparent 60%),radial-gradient(900px 900px at -12% 108%, rgba(34,197,94,.10), transparent 55%),linear-gradient(160deg,#07130f 0%,#0a1a16 55%,#081512 100%)}
.canvas::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(120,200,150,.08) 1.2px,transparent 1.2px);background-size:34px 34px;opacity:.55;mask-image:linear-gradient(180deg,#000,transparent 70%)}
.deco{position:absolute;right:-150px;top:-150px;width:640px;height:640px}
.pad{position:absolute;inset:0;padding:74px 74px 62px;display:flex;flex-direction:column}
.head{display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px}
.mark{width:66px;height:66px;filter:drop-shadow(0 6px 18px rgba(34,197,94,.28))}
.word{font-family:'IT';font-weight:700;font-size:30px;letter-spacing:.14em}
.word b{color:#34e27a}
.kicker{font-family:'JB';font-weight:600;font-size:19px;letter-spacing:.16em;color:#0a1512;background:#34e27a;padding:9px 16px;border-radius:999px}
.rule{height:3px;width:100%;margin-top:26px;border-radius:2px;background:linear-gradient(90deg,#34e27a, rgba(52,226,122,.05))}
.title{font-family:'IT';font-weight:700;font-size:${post.titleSize || 66}px;line-height:1.03;letter-spacing:-.02em;margin-top:36px}
.title .g{color:#34e27a;text-shadow:0 0 34px rgba(52,226,122,.35)}
.sub{font-family:'ITM';font-weight:500;font-size:27px;line-height:1.32;color:#a7bdb4;margin-top:20px;max-width:900px}
/* list (infographic) */
.list{margin-top:24px;display:flex;flex-direction:column}
.row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:24px;padding:15px 4px;border-top:1px solid rgba(120,200,150,.14)}
.row:first-child{border-top:none}
.tag{font-family:'JB';font-weight:600;font-size:22px;color:#34e27a;background:rgba(52,226,122,.12);border:1px solid rgba(52,226,122,.38);padding:11px 14px;border-radius:14px;min-width:128px;text-align:center}
.rname{font-family:'IT';font-weight:700;font-size:29px;line-height:1.1}
.rdesc{font-family:'ITM';font-weight:500;font-size:22px;line-height:1.28;color:#9db3ab;margin-top:3px}
.rnum{font-family:'JB';font-weight:600;font-size:25px;color:rgba(120,200,150,.30)}
/* points */
.points{margin-top:30px;display:flex;flex-direction:column;gap:22px}
.pt{display:flex;align-items:flex-start;gap:22px}
.mk{flex:0 0 auto;width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:'IT';font-weight:700;font-size:26px;margin-top:2px}
.mkx{background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.45);color:#f87171}
.mkc{background:rgba(52,226,122,.14);border:1px solid rgba(52,226,122,.5);color:#34e27a}
.mkd{background:#34e27a;width:14px;height:14px;border-radius:50%;margin:12px 16px 0 16px;box-shadow:0 0 14px rgba(52,226,122,.5)}
.pttext{font-family:'ITM';font-weight:500;font-size:${post.pointSize || 31}px;line-height:1.3;color:#e7efec}
.foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:16px}
.handle{font-family:'JB';font-weight:600;font-size:23px;color:#8fa7a0}
.cta{font-family:'IT';font-weight:700;font-size:24px;color:#06110d;background:#34e27a;padding:15px 24px;border-radius:16px;box-shadow:0 10px 30px rgba(52,226,122,.28)}
</style></head><body><div class="canvas">${DECO}<div class="pad">
<div class="head"><div class="brand">${MARK}<div class="word">SAM.GOV <b>HUNTER</b></div></div><div class="kicker">${post.kicker}</div></div>
<div class="rule"></div>
<div class="title">${post.title}</div>
<div class="sub">${post.subtitle}</div>
${body(post)}
<div class="foot"><div class="handle">@sam.govhunter</div><div class="cta">${post.cta || 'Free at samgov-hunter.com'}</div></div>
</div></div></body></html>`

const htmlPath = `${outBase}.html`
writeFileSync(htmlPath, html)
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] })
// 2x preview PNG
let ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 2 })
let page = await ctx.newPage()
await page.goto('file://' + resolve(htmlPath)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(120)
await page.screenshot({ path: `${outBase}.png`, clip: { x: 0, y: 0, width: 1080, height: 1080 } })
await ctx.close()
// 1x JPEG for IG
ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 })
page = await ctx.newPage()
await page.goto('file://' + resolve(htmlPath)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(120)
await page.screenshot({ path: `${outBase}.jpg`, type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1080, height: 1080 } })
await browser.close()
const buf = readFileSync(`${outBase}.png`)
console.log('rendered', `${outBase}.png/.jpg`, `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`)
