/**
 * Browser checks for the Image Compressor.
 *
 * These run against the real compressImage / validateFile source (inlined above
 * by scripts/build-verify-harness.mjs) using real image bytes and this
 * browser's real canvas encoder. Everything a fake canvas cannot prove lives
 * here: that a photograph actually gets smaller, that transparency survives,
 * that a JPEG matte is applied, and that nothing touches the network.
 */

const CHECKS = []
const check = (group, name, fn) => CHECKS.push({ group, name, fn })

/* ---------- helpers ---------- */

function fileFromBase64(entry) {
  const binary = atob(entry.base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], entry.name, { type: entry.type })
}

const fixture = (name) => fileFromBase64(FIXTURES.find((f) => f.name === name))

const RULES = {
  acceptedMimeTypes: ACCEPTED_MIME_TYPES,
  acceptedExtensions: ACCEPTED_EXTENSIONS,
  maxBytes: MAX_BYTES,
  acceptedLabel: ACCEPTED_LABEL,
}

/** Re-encode a fixture through canvas to build a derived test file. */
async function reencode(file, type, quality, size) {
  const bitmap = await createImageBitmap(file)
  const width = size?.width ?? bitmap.width
  const height = size?.height ?? bitmap.height
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  canvas.width = canvas.height = 0
  const extension = type.split('/')[1]
  return new File([blob], `derived.${extension}`, { type: blob.type })
}

/** Read the alpha value of a single pixel of a blob. */
async function alphaAt(blob, x, y) {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  context.drawImage(bitmap, 0, 0)
  const pixel = context.getImageData(x, y, 1, 1).data
  bitmap.close()
  canvas.width = canvas.height = 0
  return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] }
}

const assert = (condition, detail) => {
  if (!condition) throw new Error(detail || 'assertion failed')
  return detail
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const saved = (result) =>
  `${kb(result.originalBytes)} → ${kb(result.compressedBytes)} (${result.reductionPercent.toFixed(1)}%)`

/* ---------- 1. real compression ---------- */

check('Compression', 'JPG gets smaller', async () => {
  const result = await compressImage(fixture('photo.jpg'), { quality: 0.6, format: 'auto' })
  assert(result.didHelp, 'result was not smaller')
  assert(result.mimeType === 'image/jpeg', `stayed JPEG, got ${result.mimeType}`)
  return saved(result)
})

check('Compression', 'WebP gets smaller', async () => {
  const result = await compressImage(fixture('screenshot.webp'), { quality: 0.6, format: 'auto' })
  assert(result.didHelp, 'result was not smaller')
  assert(result.mimeType === 'image/webp', `expected WebP, got ${result.mimeType}`)
  return saved(result)
})

check('Compression', 'photographic PNG becomes a much smaller WebP', async () => {
  // The common "screenshot saved as PNG" case, built from real photo data.
  const png = await reencode(fixture('photo.jpg'), 'image/png')
  const result = await compressImage(png, { quality: 0.75, format: 'auto' })
  assert(result.mimeType === 'image/webp', `expected WebP, got ${result.mimeType}`)
  assert(result.didHelp, 'PNG → WebP did not shrink')
  return saved(result)
})

check('Compression', 'PNG → PNG would have been pointless', async () => {
  // Justifies routing PNG to WebP: canvas PNG encoding ignores quality.
  const png = await reencode(fixture('photo.jpg'), 'image/png')
  const asPng = await compressImage(png, { quality: 0.2, format: 'image/png' })
  const asWebp = await compressImage(png, { quality: 0.75, format: 'auto' })
  assert(
    asWebp.compressedBytes < asPng.compressedBytes,
    'WebP was not smaller than a lossless PNG re-encode',
  )
  return `PNG ${kb(asPng.compressedBytes)} at q0.2 vs WebP ${kb(asWebp.compressedBytes)} at q0.75`
})

check('Compression', 'lower quality produces a smaller file', async () => {
  const file = fixture('photo.jpg')
  const high = await compressImage(file, { quality: 0.9, format: 'auto' })
  const low = await compressImage(file, { quality: 0.3, format: 'auto' })
  assert(low.compressedBytes < high.compressedBytes, 'the quality slider changed nothing')
  return `q0.9 ${kb(high.compressedBytes)} vs q0.3 ${kb(low.compressedBytes)}`
})

check('Compression', 'an already-tiny file is reported honestly, not faked', async () => {
  const result = await compressImage(fixture('logo-transparent.png'), {
    quality: 0.9,
    format: 'auto',
  })
  const consistent = result.didHelp === result.compressedBytes < result.originalBytes
  assert(consistent, 'didHelp disagrees with the byte counts')
  return `${saved(result)} — didHelp reported as ${result.didHelp}`
})

/* ---------- 2. correctness of the output ---------- */

check('Output', 'transparency survives PNG → WebP', async () => {
  const result = await compressImage(fixture('logo-transparent.png'), {
    quality: 0.9,
    format: 'auto',
  })
  const corner = await alphaAt(result.blob, 2, 2)
  assert(corner.a < 250, `corner alpha was ${corner.a}, expected it to stay transparent`)
  return `corner alpha ${corner.a}`
})

check('Output', 'transparency becomes white, not black, when target is JPEG', async () => {
  const result = await compressImage(fixture('logo-transparent.png'), {
    quality: 0.9,
    format: 'image/jpeg',
  })
  const corner = await alphaAt(result.blob, 2, 2)
  assert(corner.r > 230 && corner.g > 230 && corner.b > 230, `corner was rgb(${corner.r},${corner.g},${corner.b})`)
  return `corner rgb(${corner.r},${corner.g},${corner.b})`
})

check('Output', 'the download filename matches the real output format', async () => {
  const result = await compressImage(fixture('logo-transparent.png'), {
    quality: 0.8,
    format: 'auto',
  })
  const expected = result.mimeType === 'image/webp' ? '.webp' : '.png'
  assert(result.filename.endsWith(expected), `filename was ${result.filename}`)
  return result.filename
})

check('Output', 'the blob is a real, decodable image', async () => {
  const result = await compressImage(fixture('photo.jpg'), { quality: 0.6, format: 'auto' })
  const bitmap = await createImageBitmap(result.blob)
  const ok = bitmap.width === result.width && bitmap.height === result.height
  bitmap.close()
  assert(ok, 'the output did not decode at the reported dimensions')
  return `${result.width}×${result.height} decodes cleanly`
})

/* ---------- 3. oversized input ---------- */

check('Limits', 'an image beyond the canvas ceiling is downscaled, not silently blanked', async () => {
  // 5000 × 4000 = 20,000,000 px, past the 16,777,216 mobile Safari limit.
  const huge = await reencode(fixture('photo.jpg'), 'image/jpeg', 0.9, { width: 5000, height: 4000 })
  const result = await compressImage(huge, { quality: 0.7, format: 'auto' })

  assert(result.wasDownscaled, 'wasDownscaled was not reported')
  assert(result.width * result.height <= MAX_PIXELS, 'still over the pixel budget')

  // A blank canvas is the failure mode being guarded against, so confirm pixels.
  const pixel = await alphaAt(result.blob, Math.floor(result.width / 2), Math.floor(result.height / 2))
  assert(pixel.a > 0, 'the output was fully transparent — canvas allocation likely failed')
  return `${result.originalWidth}×${result.originalHeight} → ${result.width}×${result.height}`
})

check('Limits', 'a file over the size limit is rejected before any decoding', () => {
  const oversized = new File([new Uint8Array(26 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' })
  const validation = validateFile(oversized, RULES)
  assert(validation.ok === false, 'a 26 MB file was accepted')
  return validation.message
})

/* ---------- 4. bad input ---------- */

check('Bad input', 'a non-image file type is rejected', () => {
  const validation = validateFile(fixture('notes.pdf'), RULES)
  assert(validation.ok === false, 'a PDF was accepted')
  return validation.message
})

check('Bad input', 'an empty file is rejected', () => {
  const validation = validateFile(new File([], 'nothing.png', { type: 'image/png' }), RULES)
  assert(validation.ok === false, 'an empty file was accepted')
  return validation.message
})

check('Bad input', 'a corrupt image fails with a readable message, not a crash', async () => {
  // Passes validation — correct extension and MIME — then fails to decode.
  const validation = validateFile(fixture('corrupt.png'), RULES)
  assert(validation.ok === true, 'validation rejected it before the decoder could be tested')

  try {
    await compressImage(fixture('corrupt.png'), { quality: 0.8, format: 'auto' })
  } catch (error) {
    assert(error instanceof Error && error.message.length > 0, 'threw something unreadable')
    return error.message
  }
  throw new Error('a corrupt file compressed successfully, which it should not')
})

/* ---------- 5. privacy ---------- */

check('Privacy', 'compression issues no network request of any kind', async () => {
  const attempts = []
  const trap = (label) =>
    function () {
      attempts.push(label)
      throw new Error(`blocked: ${label}`)
    }

  const originals = {
    fetch: window.fetch,
    XMLHttpRequest: window.XMLHttpRequest,
    WebSocket: window.WebSocket,
    EventSource: window.EventSource,
  }
  const originalSendBeacon = navigator.sendBeacon

  // Anything the browser actually puts on the wire shows up here.
  const observed = []
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) observed.push(entry.name)
  })
  observer.observe({ type: 'resource', buffered: false })

  try {
    window.fetch = trap('fetch')
    window.XMLHttpRequest = trap('XMLHttpRequest')
    window.WebSocket = trap('WebSocket')
    window.EventSource = trap('EventSource')
    navigator.sendBeacon = trap('sendBeacon')

    await compressImage(fixture('photo.jpg'), { quality: 0.6, format: 'auto' })
    await compressImage(fixture('logo-transparent.png'), { quality: 0.6, format: 'auto' })
    await compressImage(fixture('screenshot.webp'), { quality: 0.6, format: 'auto' })
  } finally {
    Object.assign(window, originals)
    navigator.sendBeacon = originalSendBeacon
    await new Promise((resolve) => setTimeout(resolve, 60))
    observer.disconnect()
  }

  assert(attempts.length === 0, `attempted: ${attempts.join(', ')}`)
  assert(observed.length === 0, `network resources loaded: ${observed.join(', ')}`)
  return 'no fetch, XHR, WebSocket, EventSource, sendBeacon or resource entry'
})

check('Privacy', 'nothing is written to browser storage', async () => {
  const before = { local: localStorage.length, session: sessionStorage.length }
  await compressImage(fixture('photo.jpg'), { quality: 0.6, format: 'auto' })
  const cookiesAfter = document.cookie

  assert(localStorage.length === before.local, 'localStorage grew')
  assert(sessionStorage.length === before.session, 'sessionStorage grew')
  assert(cookiesAfter === '', `cookies were set: ${cookiesAfter}`)

  const databases = indexedDB.databases ? await indexedDB.databases() : []
  assert(databases.length === 0, `IndexedDB databases exist: ${databases.map((d) => d.name).join(', ')}`)
  return 'localStorage, sessionStorage, cookies and IndexedDB all untouched'
})

/* ---------- 6. memory ---------- */

check('Memory', 'repeated compression does not grow the heap without bound', async () => {
  if (!performance.memory) return 'skipped — this browser does not expose heap size (Chrome only)'

  const file = fixture('photo.jpg')
  for (let i = 0; i < 3; i += 1) await compressImage(file, { quality: 0.6, format: 'auto' })

  const before = performance.memory.usedJSHeapSize
  for (let i = 0; i < 12; i += 1) await compressImage(file, { quality: 0.6, format: 'auto' })
  await new Promise((resolve) => setTimeout(resolve, 400))
  const after = performance.memory.usedJSHeapSize

  const growthMb = (after - before) / (1024 * 1024)
  // 12 runs of a 1400×1050 image would hold ~70 MB of pixel buffers if nothing
  // were released, so a small number here means release() is doing its job.
  assert(growthMb < 25, `heap grew ${growthMb.toFixed(1)} MB across 12 runs`)
  return `heap moved ${growthMb.toFixed(1)} MB across 12 runs`
})
