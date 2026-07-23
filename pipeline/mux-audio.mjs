// Mux an audio bed into a silent H.264 MP4 using ffmpeg.wasm (the environment has no usable native
// ffmpeg and no WebCodecs, but ffmpeg.wasm runs in Node with a small fetch shim so it can read its
// own core files). Video is stream-copied (no re-encode); audio (WAV) is encoded to AAC.
//   import { muxAudio } from './mux-audio.mjs'
//   const finalMp4 = await muxAudio(silentMp4Buffer, wavBuffer)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// ffmpeg.wasm's loader calls fetch() with a local path; Node's fetch can't parse that. Shim it to
// read local files (scoped to file:// and absolute paths only; everything else hits real fetch).
let shimmed = false
function installFetchShim() {
  if (shimmed) return
  shimmed = true
  const orig = globalThis.fetch
  globalThis.fetch = async (u, opts) => {
    const s = typeof u === 'string' ? u : (u && u.url) || ''
    if (s.startsWith('file://')) return new Response(readFileSync(fileURLToPath(s)))
    if (s.startsWith('/')) return new Response(readFileSync(s))
    return orig ? orig(u, opts) : Promise.reject(new Error('no fetch for ' + s))
  }
}

export async function muxAudio(silentMp4, wav) {
  installFetchShim()
  const { createFFmpeg } = require('@ffmpeg/ffmpeg')
  const ffmpeg = createFFmpeg({ log: false, corePath: require.resolve('@ffmpeg/core') })
  await ffmpeg.load()
  ffmpeg.FS('writeFile', 'v.mp4', silentMp4)
  ffmpeg.FS('writeFile', 'a.wav', wav)
  await ffmpeg.run(
    '-i', 'v.mp4', '-i', 'a.wav',
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart', 'out.mp4'
  )
  const out = ffmpeg.FS('readFile', 'out.mp4')
  try { ffmpeg.exit() } catch {}
  return Buffer.from(out)
}
