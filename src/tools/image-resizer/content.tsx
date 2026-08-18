import type { FaqItem } from '@/components/tools/ToolShell'

export const HELP = (
  <>
    <p>Resize JPG, PNG, and WebP images locally in your browser. Choose exact dimensions, a percentage, or maximum dimensions to fit within.</p>
    <p>Exact resizing keeps the aspect ratio locked by default. Unlock it only when independent width and height are intentional; otherwise the image is never cropped or distorted.</p>
    <p>JPG, PNG, and WebP can be selected as output formats. PNG and WebP preserve transparency. JPG uses a white background because it cannot store transparent pixels.</p>
    <p>Target file size is an optional maximum for JPG and WebP. The tool keeps your requested dimensions and makes a bounded quality search. Encoding is approximate, so a target may be impossible at those dimensions.</p>
  </>
)

export const FAQ: readonly FaqItem[] = [
  { question: 'Are my images uploaded?', answer: 'No. The image is decoded, resized, and encoded using browser APIs on your device. Its contents are not sent to a server or stored by this tool.' },
  { question: 'Can I resize by percentage?', answer: 'Yes. Choose Percentage and enter a value such as 50% or 200%. The resulting dimensions are shown before you process the image.' },
  { question: 'What does Fit within do?', answer: 'It scales the image proportionally until neither dimension is larger than the maximum width or height. It never crops the image.' },
  { question: 'Can I guarantee an exact file size?', answer: 'No. A target is treated as a maximum for JPG and WebP, using a bounded quality search. The actual output size is reported, and very small targets may be impossible at the requested dimensions.' },
  { question: 'What happens to transparent pixels?', answer: 'PNG and WebP preserve transparency. JPG cannot store it, so transparent areas are placed on a white background.' },
  { question: 'Which formats are supported?', answer: 'JPG, PNG, and WebP are supported as inputs and outputs. HEIC is not claimed because browser support is not reliable enough.' },
] as const
