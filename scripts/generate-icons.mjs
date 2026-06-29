import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function fetchFont() {
  try {
    // Download Noto Sans Telugu from Google Fonts CDN
    const urls = [
      'https://fonts.gstatic.com/s/notosanstelugu/v20/0pkhp9tiero83OgifNG7sW6MiAUBnGl9-0o.woff2',
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu&display=swap',
    ]
    
    // Use the direct TTF from Google APIs
    const response = await fetch(
      'https://fonts.gstatic.com/s/notosanstelugu/v20/0pkhp9tiero83OgifNG7sW6MiAUBnGl9-0o.woff2'
    )
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    console.log('  ✓ Font downloaded')
    return base64
  } catch (err) {
    console.warn('  ⚠ Could not download font:', err.message)
    return null
  }
}

async function buildSVG(fontBase64) {
  const fontFace = fontBase64
    ? `<style>
        @font-face {
          font-family: 'NotoTelugu';
          src: url('data:font/woff2;base64,${fontBase64}') format('woff2');
        }
      </style>`
    : ''

  const textEl = fontBase64
    ? `<text x="256" y="295" text-anchor="middle" font-size="148" font-weight="700"
        font-family="NotoTelugu, serif" fill="#78350f" opacity="0.85">అ</text>`
    : `<!-- Font unavailable - fallback to A -->
       <text x="256" y="295" text-anchor="middle" font-size="148" font-weight="900"
        font-family="serif" fill="#78350f" opacity="0.85">A</text>`

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
console.log('Fetching Telugu font...')

const fontBase64 = await fetchFont()
const svgContent = await buildSVG(fontBase64)

// Write the resolved SVG
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
