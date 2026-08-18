import type { FaqItem } from '@/components/tools/ToolShell'

export const HELP = (
  <>
    <p>
      The converter decodes your image in the browser, draws it at the same dimensions, and encodes
      it in the format you select. The image contents never leave your device.
    </p>
    <p>
      PNG and WebP preserve transparency. JPG does not support transparency, so transparent areas
      are placed on a white background when you choose JPG. The converter never crops, rotates,
      stretches, or silently resizes an image.
    </p>
    <p>
      Only JPG, PNG, and WebP are supported. HEIC is not listed because browser support is not
      consistent enough to promise a reliable conversion. Very large decoded images are rejected
      before drawing when the browser canvas safety limit would make preserving their dimensions
      unsafe.
    </p>
  </>
)

export const FAQ: readonly FaqItem[] = [
  {
    question: 'Are my images uploaded?',
    answer:
      'No. The file is decoded and converted using browser APIs on your device. No image contents are sent to a server or stored by this tool.',
  },
  {
    question: 'Which image formats are supported?',
    answer:
      'The converter supports JPG, PNG, and WebP as inputs and outputs. HEIC is intentionally not claimed because native browser decoding is not reliable across browsers.',
  },
  {
    question: 'Will the dimensions change?',
    answer:
      'No. The image is drawn at its decoded width and height. Images above the browser-safe pixel limit are rejected with an explanation instead of being silently resized.',
  },
  {
    question: 'What happens to transparent pixels?',
    answer:
      'PNG and WebP keep transparency. JPG cannot store an alpha channel, so transparent pixels are composited over white in the JPG output.',
  },
] as const
