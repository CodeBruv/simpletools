import type { FaqItem } from '@/components/tools/ToolShell'

export const HELP = (
  <>
    <p>
      The compressor loads your image into the browser's memory, draws it once to a canvas at the
      quality you chose, and hands back the result. Nothing leaves your device.
    </p>
    <p>
      JPG and WebP compression discard detail to shrink the file, which is why the quality slider
      exists. PNG compression is lossless, so re-encoding a PNG as PNG produces a <em>larger</em>{' '}
      file, not a smaller one. That's why the tool saves PNGs as WebP instead: WebP keeps the alpha
      channel and allows you to control how much quality you keep.
    </p>
    <p>
      Extremely large images are scaled down before encoding so they fit within the canvas size your
      browser allows. If that happens, the result readout says so.
    </p>
  </>
)

export const FAQ: readonly FaqItem[] = [
  {
    question: 'Does the compressed image look worse?',
    answer:
      'At high quality settings (above 80%), most images look identical to the original when viewed normally. At lower settings you trade sharpness for size. The preview lets you judge the trade before downloading.',
  },
  {
    question: 'What if the compressed file is bigger?',
    answer:
      'That happens when the original is already efficiently compressed. The tool tells you when the result grew rather than shrank, so you can keep what you started with instead of downloading the larger version.',
  },
  {
    question: 'Why did my PNG become a WebP?',
    answer:
      'Canvas PNG encoding is lossless and ignores the quality slider, so most PNGs come back larger than they went in. Moving PNG to WebP keeps transparency and lets you control the trade between quality and size.',
  },
  {
    question: 'Is this safe for print?',
    answer:
      'Probably, but check the output yourself before sending it to press. Compression that looks fine on screen can show up as banding or artifact in large printed output, especially in gradients and low-contrast areas.',
  },
] as const
