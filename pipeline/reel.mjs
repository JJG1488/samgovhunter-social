import { chromium } from 'playwright-core'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'
import HME from 'h264-mp4-encoder'

const W = 720, H = 1280, FPS = 24, DUR = 6.0
const N = Math.round(FPS * DUR)
const FONT_DIR = new URL('./fonts', import.meta.url).pathname
const b64 = (f) => readFileSync(`${FONT_DIR}/${f}`).toString('base64')
const FB = b64('InterTight-Bold.woff'), FM = b64('InterTight-Medium.woff'), FJ = b64('JetBrainsMono-SemiBold.woff')

const MARK = `<svg viewBox="0 0 100 100" width="52" height="52" xmlns="http://www.w3.org/2000/svg"><defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16203a"/><stop offset="1" stop-color="#1d2942"/></linearGradient>
<linearGradient id="arm" x1="0.15" y1="1" x2="0.95" y2="0.05"><stop offset="0" stop-color="#15a34a"/><stop offset="1" stop-color="#5bf08a"/></linearGradient>
<radialGradient id="halo" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#22c55e" stop-opacity="0.16"/><stop offset="0.72" stop-color="#22c55e" stop-opacity="0"/></radialGradient></defs>
<rect width="100" height="100" rx="22" fill="url(#bg)"/><circle cx="50" cy="50" r="46" fill="url(#halo)"/>
<circle cx="50" cy="50" r="42" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.32"/><circle cx="50" cy="50" r="30" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.5"/><circle cx="50" cy="50" r="18" fill="none" stroke="#43b06b" stroke-width="2" opacity="0.7"/>
<line x1="50" y1="50" x2="84.64" y2="30" stroke="url(#arm)" stroke-width="3.6" stroke-linecap="round"/><circle cx="72.5" cy="37" r="5" fill="#5bf08a"/><circle cx="50" cy="50" r="4.6" fill="#f8fafc"/></svg>`

const scenes = [
  { s: 0.0, e: 1.5, html: `<div class="big">One FAR clause decides who you actually <span class="g">compete against</span>.</div>` },
  { s: 1.5, e: 3.0, html: `<div class="huge g">The Rule of Two</div><div class="mono">FAR 19.502-2</div>` },
  { s: 3.0, e: 4.3, html: `<div class="big">If two or more small businesses can do the work at a fair price...</div>` },
  { s: 4.3, e: 5.2, html: `<div class="big">...it's set aside for small business <span class="g">only</span>. Big primes are out.</div>` },
  { s: 5.2, e: 6.0, html: `<div class="big">Find the set-asides that fit your business.</div><div class="chip">Free at samgov-hunter.com</div>` },
]
const sceneDivs = scenes.map((sc, i) => `<div class="scene" id="s${i}">${sc.html}</div>`).join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'IT';src:url(data:font/woff;base64,${FB}) format('woff')}
@font-face{font-family:'ITM';src:url(data:font/woff;base64,${FM}) format('woff')}
@font-face{font-family:'JB';src:url(data:font/woff;base64,${FJ}) format('woff')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
.stage{width:${W}px;height:${H}px;position:relative;overflow:hidden;color:#f4f8f6;font-family:'ITM',sans-serif;
 background:radial-gradient(700px 500px at 78% 8%, rgba(34,197,94,.18), transparent 60%),radial-gradient(600px 700px at 0% 100%, rgba(34,197,94,.12), transparent 55%),linear-gradient(165deg,#07130f 0%,#0a1a16 55%,#081512 100%)}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(120,200,150,.09) 1.3px,transparent 1.3px);background-size:38px 38px;opacity:.5;mask-image:linear-gradient(180deg,#000,transparent 78%)}
.rings{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);width:900px;height:900px;border-radius:50%;
 background:repeating-radial-gradient(circle, rgba(47,125,84,.16) 0 2px, transparent 2px 92px)}
.sweep{position:absolute;left:50%;top:40%;width:900px;height:900px;transform-origin:0 0;
 background:conic-gradient(from 0deg, rgba(34,197,94,.30), rgba(34,197,94,0) 32%);border-radius:50%;
 -webkit-mask:radial-gradient(circle, #000 0 450px, transparent 450px);mask:radial-gradient(circle,#000 0 450px,transparent 450px)}
.brand{position:absolute;top:64px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:14px}
.word{font-family:'IT';font-weight:700;font-size:26px;letter-spacing:.14em}
.word b{color:#34e27a}
.scene{position:absolute;left:64px;right:64px;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:22px;opacity:0;will-change:opacity,transform}
.big{font-family:'IT';font-weight:700;font-size:60px;line-height:1.1;letter-spacing:-.02em}
.huge{font-family:'IT';font-weight:700;font-size:82px;line-height:1.02;letter-spacing:-.03em;text-shadow:0 0 40px rgba(52,226,122,.4)}
.mono{font-family:'JB';font-weight:600;font-size:32px;letter-spacing:.14em;color:#a7bdb4}
.g{color:#34e27a}
.chip{font-family:'IT';font-weight:700;font-size:34px;color:#06110d;background:#34e27a;padding:18px 30px;border-radius:18px;box-shadow:0 12px 40px rgba(52,226,122,.35)}
.handle{position:absolute;bottom:70px;left:0;right:0;text-align:center;font-family:'JB';font-weight:600;font-size:24px;color:#9fb6ad;letter-spacing:.03em}
.barwrap{position:absolute;bottom:44px;left:64px;right:64px;height:5px;border-radius:3px;background:rgba(120,200,150,.16)}
.bar{height:100%;border-radius:3px;background:#34e27a;width:0%;box-shadow:0 0 14px rgba(52,226,122,.6)}
</style></head><body>
<div class="stage">
 <div class="rings"></div>
 <div class="sweep" id="sweep"></div>
 <div class="dots"></div>
 <div class="brand">${MARK}<div class="word">SAM.GOV <b>HUNTER</b></div></div>
 ${sceneDivs}
 <div class="handle">@sam.govhunter</div>
 <div class="barwrap"><div class="bar" id="bar"></div></div>
</div>
<script>
const SC = ${JSON.stringify(scenes.map(s => ({ s: s.s, e: s.e })))};
window.setFrame = (i, N, D) => {
  const t = (i/(N-1))*D;
  document.getElementById('sweep').style.transform = 'rotate(' + (t*55) + 'deg)';
  document.getElementById('bar').style.width = Math.min(100, (t/D)*100) + '%';
  for (let k=0;k<SC.length;k++){
    const sc = SC[k], el = document.getElementById('s'+k);
    let op = 0, ty = 26;
    if (t >= sc.s && t <= sc.e){
      const inp = Math.min(1, (t - sc.s)/0.35);
      const outp = Math.min(1, (sc.e - t)/0.25);
      op = inp * outp; ty = (1-inp)*26;
    }
    el.style.opacity = op; el.style.transform = 'translateY(' + ty + 'px)';
  }
};
</script>
</body></html>`

const htmlPath = '/tmp/claude-0/-home-user-samgov-hunter/e5b04139-b149-5843-b4bd-e91f3f4c2cc3/scratchpad/ig/reel.html'
writeFileSync(htmlPath, html)

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--force-color-profile=srgb'] })
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto('file://' + resolve(htmlPath))
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(150)

const enc = await HME.createH264MP4Encoder()
enc.width = W; enc.height = H; enc.frameRate = FPS; enc.quantizationParameter = 24; enc.outputFilename = 'reel.mp4'
enc.initialize()
for (let i = 0; i < N; i++) {
  await page.evaluate(([i, N, D]) => window.setFrame(i, N, D), [i, N, DUR])
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } })
  const png = PNG.sync.read(buf)
  enc.addFrameRgba(new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length))
  if (i % 24 === 0) console.log('frame', i, '/', N)
}
enc.finalize()
const out = enc.FS.readFile(enc.outputFilename)
writeFileSync('/tmp/claude-0/-home-user-samgov-hunter/e5b04139-b149-5843-b4bd-e91f3f4c2cc3/scratchpad/ig/reel.mp4', Buffer.from(out))
enc.delete()
await browser.close()
console.log('REEL DONE', W + 'x' + H, N + ' frames', (out.length/1024).toFixed(0) + 'KB')
