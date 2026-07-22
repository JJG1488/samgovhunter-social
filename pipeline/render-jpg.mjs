import { chromium } from 'playwright-core'
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const DIR = '/tmp/claude-0/-home-user-samgov-hunter/e5b04139-b149-5843-b4bd-e91f3f4c2cc3/scratchpad/ig'
const slug = process.argv[2] || 'set-asides'
const quality = Number(process.argv[3] || 92)
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] })
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
await page.goto('file://' + `${DIR}/${slug}.html`)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(120)
await page.screenshot({ path: `${DIR}/${slug}.jpg`, type: 'jpeg', quality, clip: { x: 0, y: 0, width: 1080, height: 1080 } })
await browser.close()
console.log('jpg ready:', `${DIR}/${slug}.jpg`)
