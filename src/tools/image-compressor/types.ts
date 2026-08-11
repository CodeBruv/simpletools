/** Output container the user can ask for. */
export type OutputFormat = 'auto' | 'image/jpeg' | 'image/webp' | 'image/png'

export interface CompressOptions {
  /** 0.1–1.0. Ignored by PNG encoding, which is lossless. */
  quality: number
  /**
   * 'auto' keeps lossy inputs in their own format and moves PNG to WebP,
   * because canvas cannot quality-compress a PNG.
   */
  format: OutputFormat
}

export interface CompressionResult {
  blob: Blob
  /** The MIME type the browser actually produced, which may differ from the request. */
  mimeType: string
  filename: string
  originalBytes: number
  compressedBytes: number
  /** Negative when the encoder produced a larger file than the original. */
  reductionPercent: number
  /** True when the output is genuinely smaller than the input. */
  didHelp: boolean
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  /** True when the image had to be scaled down to stay inside canvas limits. */
  wasDownscaled: boolean
}

/** Minimal canvas surface used by the compressor, so tests can substitute a fake. */
export interface CanvasLike {
  width: number
  height: number
  getContext(contextId: '2d'): CanvasRenderingContext2DLike | null
  toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number): void
}

export interface CanvasRenderingContext2DLike {
  fillStyle: string
  imageSmoothingEnabled: boolean
  imageSmoothingQuality: 'low' | 'medium' | 'high'
  fillRect(x: number, y: number, w: number, h: number): void
  drawImage(source: DecodedSource, dx: number, dy: number, dw: number, dh: number): void
}

/** Whatever the decoder hands back that a canvas can draw. */
export type DecodedSource = CanvasImageSource

export interface DecodedImage {
  source: DecodedSource
  width: number
  height: number
  /** Releases the decoded pixels. Always called, even when encoding fails. */
  release(): void
}

export interface CompressDeps {
  decode(file: File): Promise<DecodedImage>
  createCanvas(width: number, height: number): CanvasLike
}
