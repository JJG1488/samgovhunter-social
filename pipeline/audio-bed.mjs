// Royalty-free music bed, synthesized from scratch (pure math -> PCM -> WAV). No samples, no
// copyright, no external file. A calm, modern ambient pad + a soft pulse, mixed quiet so it sits
// under the reel without competing. Exported for reel.mjs; also runnable standalone for a preview.
//   import { synthBedWav } from './audio-bed.mjs'; const wav = synthBedWav(19.9)
import { writeFileSync } from 'node:fs'

const SR = 48000
// Equal-temperament frequency for a MIDI note (A4=69=440Hz).
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)
// Chord voicings as MIDI notes (calm, hopeful loop: Cmaj7, Am7, Fmaj7, G).
const PROG = [
  [48, 52, 55, 59], // Cmaj7
  [45, 48, 52, 55], // Am7
  [41, 45, 48, 52], // Fmaj7
  [43, 47, 50, 53], // G
]

// One mellow pad voice: fundamental + a couple of soft partials, slight stereo detune for width.
function padSample(freq, t, detune) {
  const f = freq * detune
  const w = 2 * Math.PI * f * t
  return (Math.sin(w) + 0.32 * Math.sin(2 * w) + 0.12 * Math.sin(3 * w)) / 1.44
}

export function synthBed(durSec, opts = {}) {
  const n = Math.round(durSec * SR)
  const L = new Float32Array(n)
  const R = new Float32Array(n)
  const chordDur = opts.chordDur ?? 4.6      // seconds per chord
  const xfade = 0.9                          // crossfade between chords
  const pulse = opts.pulse ?? true
  const beat = 0.6                           // ~100 bpm
  const padGain = opts.padGain ?? 0.5
  const pulseGain = opts.pulseGain ?? 0.11
  const shimmerGain = opts.shimmerGain ?? 0.05

  for (let i = 0; i < n; i++) {
    const t = i / SR
    // which chord (looping), with a crossfade weight into the next
    const pos = t / chordDur
    const idx = Math.floor(pos) % PROG.length
    const nextIdx = (idx + 1) % PROG.length
    const frac = pos - Math.floor(pos)
    const into = frac * chordDur
    const w = into > chordDur - xfade ? (chordDur - into) / xfade : 1 // fade out tail of this chord
    const wNext = into > chordDur - xfade ? 1 - (chordDur - into) / xfade : 0

    let l = 0, r = 0
    const chord = PROG[idx], nchord = PROG[nextIdx]
    for (let v = 0; v < chord.length; v++) {
      const f = mtof(chord[v])
      l += padSample(f, t, 0.9985) * w
      r += padSample(f, t, 1.0015) * w
      if (wNext > 0) {
        const nf = mtof(nchord[v])
        l += padSample(nf, t, 0.9985) * wNext
        r += padSample(nf, t, 1.0015) * wNext
      }
    }
    l = (l / chord.length) * padGain
    r = (r / chord.length) * padGain

    // soft sub pulse on the beat for gentle momentum
    if (pulse) {
      const bt = t % beat
      const env = Math.exp(-bt * 9)
      const root = mtof(chord[0] - 12)
      const p = Math.sin(2 * Math.PI * root * t) * env * pulseGain
      l += p; r += p
    }

    // sparse high shimmer (adds air), every 2 beats, quiet, panned gently
    const sh = t % (beat * 2)
    if (sh < 0.5) {
      const env = Math.exp(-sh * 5) * Math.min(1, sh / 0.02)
      const note = mtof(chord[3] + 12)
      const s = Math.sin(2 * Math.PI * note * t) * env * shimmerGain
      l += s * 0.8; r += s
    }

    L[i] = l; R[i] = r
  }

  // master: fade in/out + soft clip
  const fin = Math.round(0.4 * SR), fout = Math.round(0.9 * SR)
  for (let i = 0; i < n; i++) {
    let g = 1
    if (i < fin) g = i / fin
    if (i > n - fout) g = Math.min(g, (n - i) / fout)
    L[i] = Math.tanh(L[i] * g * 1.1)
    R[i] = Math.tanh(R[i] * g * 1.1)
  }
  return { L, R, sampleRate: SR }
}

export function toWav({ L, R, sampleRate }) {
  const n = L.length, ch = 2, bps = 2
  const dataLen = n * ch * bps
  const buf = Buffer.alloc(44 + dataLen)
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write('WAVE', 8)
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22)
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate * ch * bps, 28); buf.writeUInt16LE(ch * bps, 32); buf.writeUInt16LE(16, 34)
  buf.write('data', 36); buf.writeUInt32LE(dataLen, 40)
  let o = 44
  const clamp = (x) => Math.max(-32768, Math.min(32767, Math.round(x * 32767)))
  for (let i = 0; i < n; i++) { buf.writeInt16LE(clamp(L[i]), o); o += 2; buf.writeInt16LE(clamp(R[i]), o); o += 2 }
  return buf
}

export function synthBedWav(durSec, opts) { return toWav(synthBed(durSec, opts)) }

// standalone: node audio-bed.mjs <seconds> <out.wav>
if (import.meta.url === `file://${process.argv[1]}`) {
  const dur = parseFloat(process.argv[2] || '19.9')
  const out = process.argv[3] || 'bed.wav'
  const wav = synthBedWav(dur)
  writeFileSync(out, wav)
  console.log('wrote', out, wav.length, 'bytes', dur + 's')
}
