/** How the file should be processed. */
export type CompressionMode = 'lossless' | 'rasterise'

export interface CompressPdfOptions {
  mode: CompressionMode
  /**
   * JPEG quality for `rasterise`, 0.3–0.95. Ignored by `lossless`, which does
   * not re-encode anything.
   */
  quality: number
  /**
   * Render scale for `rasterise`, as a multiple of the page's natural size.
   * 1 renders at 72 DPI, 2 at 144 DPI. Higher looks better and weighs more.
   */
  scale: number
  signal?: AbortSignal
  /** Called after each page is rendered, so long documents can show progress. */
  onProgress?: (pagesDone: number, pageCount: number) => void
}

export interface PdfCompressionResult {
  blob: Blob
  filename: string
  mode: CompressionMode
  originalBytes: number
  compressedBytes: number
  /** Negative when the output grew. */
  reductionPercent: number
  /** True only when the output is genuinely smaller than the input. */
  didHelp: boolean
  pageCount: number
  /**
   * False when pages were flattened to images, meaning text is no longer
   * selectable, searchable or accessible to a screen reader.
   */
  textPreserved: boolean
}

/** What a pre-flight read can tell us about the file before compressing it. */
export interface PdfInspection {
  pageCount: number
  encrypted: boolean
}

export interface EngineOutput {
  bytes: Uint8Array
  pageCount: number
}

export interface RasteriseOptions {
  quality: number
  scale: number
  signal?: AbortSignal
  onProgress?: (pagesDone: number, pageCount: number) => void
}

/**
 * The PDF operations this tool needs, behind an interface.
 *
 * Two reasons this is injected rather than imported directly:
 * the real implementation pulls in ~1.5 MB of library code that must never
 * reach a page that isn't compressing a PDF, and tests can substitute a fake
 * so the compression logic is verifiable without a DOM or a PDF library.
 */
export interface PdfEngine {
  inspect(bytes: Uint8Array): Promise<PdfInspection>
  /** Structural re-save. Keeps text, links, forms and bookmarks intact. */
  optimise(bytes: Uint8Array, signal?: AbortSignal): Promise<EngineOutput>
  /** Renders each page to a JPEG and rebuilds the file around them. Lossy. */
  rasterise(bytes: Uint8Array, options: RasteriseOptions): Promise<EngineOutput>
}
