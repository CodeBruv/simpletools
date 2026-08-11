/**
 * Trigger a browser download for an in-memory Blob.
 *
 * The object URL is created and revoked here so callers can't leak it. The
 * revoke is deferred by a tick because Safari cancels the download if the URL
 * disappears in the same frame as the click.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
