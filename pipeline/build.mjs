import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const FONT_DIR = '/home/user/samgov-hunter/app/_og/fonts'
const OUT_DIR = '/tmp/claude-0/-home-user-samgov-hunter/e5b04139-b149-5843-b4bd-e91f3f4c2cc3/scratchpad/ig'

const b64 = (f) => readFileSync(`${FONT_DIR}/${f}`).toString('base64')
const FONT = {
  interBold: b64('InterTight-Bold.woff'),
  interMed: b64('InterTight-Medium.woff'),
  mono: b64('JetBrainsMono-SemiBold.woff'),
}

// Brand radar mark (matches app/components/BrandMark.tsx)
const MARK = `
<svg viewBox="0 0 100 100" class="mark" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16203a"/><stop offset="1" stop-color="#1d2942"/></linearGradient>
    <linearGradient id="arm" x1="0.15" y1="1" x2="0.95" y2="0.05"><stop offset="0" stop-color="#15a34a"/><stop offset="1" stop-color="#5bf08a"/></linearGradient>
    <linearGradient id="sweep" x1="0.3" y1="0.05" x2="1" y2="0.75"><stop offset="0" stop-color="#22c55e" stop-opacity="0"/><stop offset="1" stop-color="#22c55e" stop-opacity="0.5"/></linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#22c55e" stop-opacity="0.16"/><stop offset="0.72" stop-color="#22c55e" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100" height="100" rx="22" fill="url(#bg)"/>
  <circle cx="50" cy="50" r="46" fill="url(#halo)"/>
  <circle cx="50" cy="50" r="42" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.32"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.5"/>
  <circle cx="50" cy="50" r="18" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.7"/>
  <path d="M50 50 L50 8 A42 42 0 0 1 86.37 29 Z" fill="url(#sweep)"/>
  <line x1="50" y1="50" x2="84.64" y2="30" stroke="url(#arm)" stroke-width="3.6" stroke-linecap="round"/>
  <circle cx="72.5" cy="37" r="8" fill="none" stroke="#5bf08a" stroke-width="1.4" opacity="0.45"/>
  <circle cx="72.5" cy="37" r="5" fill="#5bf08a"/>
  <circle cx="50" cy="50" r="4.6" fill="#f8fafc"/>
</svg>`

// Large decorative radar in the corner
const DECO = `
<svg class="deco" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#2f7d54" stroke-width="1.5">
    <circle cx="300" cy="300" r="290" opacity="0.10"/>
    <circle cx="300" cy="300" r="220" opacity="0.13"/>
    <circle cx="300" cy="300" r="150" opacity="0.16"/>
    <circle cx="300" cy="300" r="80" opacity="0.20"/>
  </g>
  <line x1="300" y1="300" x2="300" y2="10" stroke="#2f7d54" stroke-width="1.5" opacity="0.14"/>
  <line x1="300" y1="300" x2="590" y2="300" stroke="#2f7d54" stroke-width="1.5" opacity="0.14"/>
  <defs><linearGradient id="ds" x1="0.5" y1="0" x2="1" y2="0.5"><stop offset="0" stop-color="#22c55e" stop-opacity="0"/><stop offset="1" stop-color="#22c55e" stop-opacity="0.22"/></linearGradient></defs>
  <path d="M300 300 L300 10 A290 290 0 0 1 505 95 Z" fill="url(#ds)"/>
</svg>`

function card({ slug, kicker, title, subtitle, rows, cta }) {
  const rowHtml = rows.map((r, i) => `
    <div class="row">
      <div class="tag">${r.tag}</div>
      <div class="rtext">
        <div class="rname">${r.name}</div>
        <div class="rdesc">${r.desc}</div>
      </div>
      <div class="rnum">${String(i + 1).padStart(2, '0')}</div>
    </div>`).join('')

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:'IT';src:url(data:font/woff;base64,${FONT.interBold}) format('woff');font-weight:700}
  @font-face{font-family:'ITM';src:url(data:font/woff;base64,${FONT.interMed}) format('woff');font-weight:500}
  @font-face{font-family:'JB';src:url(data:font/woff;base64,${FONT.mono}) format('woff');font-weight:600}
  *{margin:0;padding:0;box-sizing:border-box}
  .canvas{width:1080px;height:1080px;position:relative;overflow:hidden;
    background:
      radial-gradient(1100px 700px at 80% -8%, rgba(34,197,94,.16), transparent 60%),
      radial-gradient(900px 900px at -12% 108%, rgba(34,197,94,.10), transparent 55%),
      linear-gradient(160deg,#07130f 0%,#0a1a16 55%,#081512 100%);
    color:#f4f8f6;font-family:'ITM',system-ui,sans-serif}
  .canvas::before{content:"";position:absolute;inset:0;
    background-image:radial-gradient(rgba(120,200,150,.08) 1.2px,transparent 1.2px);
    background-size:34px 34px;opacity:.55;mask-image:linear-gradient(180deg,#000,transparent 70%)}
  .deco{position:absolute;right:-150px;top:-150px;width:640px;height:640px}
  .pad{position:absolute;inset:0;padding:72px 74px 60px;display:flex;flex-direction:column}
  .head{display:flex;align-items:center;justify-content:space-between}
  .brand{display:flex;align-items:center;gap:18px}
  .mark{width:66px;height:66px;filter:drop-shadow(0 6px 18px rgba(34,197,94,.28))}
  .word{font-family:'IT';font-weight:700;font-size:30px;letter-spacing:.14em}
  .word b{color:#34e27a}
  .kicker{font-family:'JB';font-weight:600;font-size:19px;letter-spacing:.16em;color:#0a1512;
    background:#34e27a;padding:9px 16px;border-radius:999px}
  .rule{height:3px;width:100%;margin-top:26px;border-radius:2px;
    background:linear-gradient(90deg,#34e27a, rgba(52,226,122,.05))}
  .title{font-family:'IT';font-weight:700;font-size:66px;line-height:1.03;letter-spacing:-.02em;margin-top:34px}
  .title .g{color:#34e27a;text-shadow:0 0 34px rgba(52,226,122,.35)}
  .sub{font-family:'ITM';font-weight:500;font-size:26px;line-height:1.32;color:#a7bdb4;margin-top:20px;max-width:900px}
  .list{margin-top:24px;display:flex;flex-direction:column}
  .row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:24px;
    padding:15px 4px;border-top:1px solid rgba(120,200,150,.14)}
  .row:first-child{border-top:none}
  .tag{font-family:'JB';font-weight:600;font-size:22px;color:#34e27a;letter-spacing:.02em;
    background:rgba(52,226,122,.12);border:1px solid rgba(52,226,122,.38);
    padding:11px 14px;border-radius:14px;min-width:128px;text-align:center}
  .rname{font-family:'IT';font-weight:700;font-size:29px;line-height:1.1}
  .rdesc{font-family:'ITM';font-weight:500;font-size:22px;line-height:1.28;color:#9db3ab;margin-top:3px}
  .rnum{font-family:'JB';font-weight:600;font-size:25px;color:rgba(120,200,150,.30)}
  .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:14px}
  .handle{font-family:'JB';font-weight:600;font-size:23px;color:#8fa7a0;letter-spacing:.02em}
  .cta{font-family:'IT';font-weight:700;font-size:24px;color:#06110d;background:#34e27a;
    padding:15px 24px;border-radius:16px;box-shadow:0 10px 30px rgba(52,226,122,.28)}
  </style></head>
  <body><div class="canvas">${DECO}
    <div class="pad">
      <div class="head">
        <div class="brand">${MARK}<div class="word">SAM.GOV <b>HUNTER</b></div></div>
        <div class="kicker">${kicker}</div>
      </div>
      <div class="rule"></div>
      <div class="title">${title}</div>
      <div class="sub">${subtitle}</div>
      <div class="list">${rowHtml}</div>
      <div class="foot">
        <div class="handle">@sam.govhunter</div>
        <div class="cta">${cta}</div>
      </div>
    </div>
  </div></body></html>`
}

const POST = {
  slug: 'set-asides',
  kicker: 'GOVCON 101',
  title: `5 federal set-asides that can win you a <span class="g">contract</span>`,
  subtitle: `The government <b style="color:#c9d8d2;font-weight:500">reserves</b> billions in contracts for small businesses. Here are the programs worth checking your eligibility for.`,
  rows: [
    { tag: 'WOSB', name: 'Women-Owned Small Business', desc: 'Industries where women-owned firms are underrepresented.' },
    { tag: 'SDVOSB', name: 'Service-Disabled Veteran-Owned', desc: 'Owned & controlled by service-disabled veterans.' },
    { tag: '8(a)', name: 'SBA 8(a) Business Development', desc: '9-year SBA program for disadvantaged business owners.' },
    { tag: 'HUBZone', name: 'HUBZone Small Business', desc: 'Based in & hiring from designated HUBZone areas.' },
    { tag: 'VOSB', name: 'Veteran-Owned Small Business', desc: 'Priority on many VA contract opportunities.' },
  ],
  cta: 'Find yours → samgov-hunter.com',
}

const html = card(POST)
const htmlPath = `${OUT_DIR}/${POST.slug}.html`
writeFileSync(htmlPath, html)

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] })
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto('file://' + htmlPath)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(120)
const outPng = `${OUT_DIR}/${POST.slug}.png`
await page.screenshot({ path: outPng, clip: { x: 0, y: 0, width: 1080, height: 1080 } })
await browser.close()

const buf = readFileSync(outPng)
console.log('rendered', outPng, `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}px`, (buf.length / 1024).toFixed(0) + 'KB')
