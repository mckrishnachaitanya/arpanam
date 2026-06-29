import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Find Noto Sans Telugu font on the system
function findTeluguFont() {
  try {
    const result = execSync('fc-list :lang=te', { encoding: 'utf8' })
    const lines = result.trim().split('\n').filter(Boolean)
    for (const line of lines) {
      const path = line.split(':')[0].trim()
      if (path && existsSync(path)) {
        console.log(`  ✓ Found Telugu font: ${path}`)
        return path
      }
    }
  } catch {}

  // Fallback paths
  const fallbacks = [
    '/usr/share/fonts/truetype/noto/NotoSansTelugu-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansTelugu-Regular.otf',
    '/usr/share/fonts/noto/NotoSansTelugu-Regular.ttf',
  ]
  for (const p of fallbacks) {
    if (existsSync(p)) {
      console.log(`  ✓ Found Telugu font (fallback): ${p}`)
      return p
    }
  }

  console.warn('  ⚠ Telugu font not found — will use fallback A')
  return null
}

function buildSVG(fontPath) {
  let fontFace = ''
  let textEl = `<text x="256" y="295" text-anchor="middle" font-size="148" font-weight="900"
      font-family="serif" fill="#78350f" opacity="0.85">A</text>`

  if (fontPath) {
    const fontData = readFileSync(fontPath)
    const base64 = fontData.toString('base64')
    const ext = fontPath.endsWith('.otf') ? 'opentype' : 'truetype'
    fontFace = `<style>
      @font-face {
        font-family: 'NotoTelugu';
        src: url('data:font/${ext};base64,${base64}') format('${ext}');
      }
    </style>`
    textEl = `<text x="256" y="300" text-anchor="middle" font-size="148" font-weight="700"
      font-family="NotoTelugu, sans-serif" fill="#78350f" opacity="0.85">అ</text>`
  }

  return `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="coin" cx="45%" cy="38%" r="60%" gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="#fff7c2"/>
      <stop offset="30%"  stop-color="#fde047"/>
      <stop offset="70%"  stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#78350f"/>
    </radialGradient>
    <radialGradient id="rim" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
      <stop offset="0%"  stop-color="#92400e"/>
      <stop offset="100%" stop-color="#451a03"/>
    </radialGradient>
  </defs>
  ${fontFace}
  <rect width="512" height="512" fill="#0a0800"/>
  <ellipse cx="260" cy="278" rx="118" ry="22" fill="#000" opacity="0.5"/>
  <ellipse cx="258" cy="262" rx="122" ry="122" fill="url(#rim)"/>
  <ellipse cx="256" cy="256" rx="116" ry="116" fill="url(#coin)"/>
  <ellipse cx="256" cy="256" rx="94" ry="94" stroke="#92400e" stroke-width="5" fill="none" opacity="0.5"/>
  <ellipse cx="256" cy="256" rx="94.5" ry="94.5" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.3"/>
  <path d="M148 196 Q163 136 224 120" stroke="#fef9c3" stroke-width="5" fill="none" opacity="0.2" stroke-linecap="round"/>
  ${textEl}
</svg>`
}

console.log('Generating PWA icons...')
console.log('Looking for Telugu font...')

const fontPath = findTeluguFont()
const svgContent = buildSVG(fontPath)

writeFileSync(join(root, 'public/icons/icon.svg'), svgContent)

const svgBuffer = Buffer.from(svgContent)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(root, `public/icons/icon-${size}.png`))
  console.log(`  ✓ icon-${size}.png`)
}

await sharp(svgBuffer).resize(180, 180).png().toFile(join(root, 'public/icons/apple-touch-icon.png'))
console.log('  ✓ apple-touch-icon.png')

await sharp(svgBuffer).resize(32, 32).png().toFile(join(root, 'public/favicon.png'))
console.log('  ✓ favicon.png')

console.log('Done!')
