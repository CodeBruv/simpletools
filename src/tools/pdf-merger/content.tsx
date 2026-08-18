import type { FaqItem } from '@/components/tools/ToolShell'

export const HELP = (
  <>
    <p>
      Add two or more PDFs, put them in the order you want, then choose <strong>Merge PDFs</strong>.
      Every page from the first file is followed by every page from the second, and so on.
    </p>
    <p>
      The merger copies the existing PDF pages into a new document. It does not turn pages into
      images, resize them, crop them, or deliberately reduce their quality, so documents with
      different page sizes keep those page dimensions.
    </p>
    <p>
      Files are read and combined in your browser. They are not uploaded or stored. Selected files
      may total up to 50 MB, the same browser-memory safety boundary used by the PDF Compressor.
    </p>
    <p>
      Password-protected PDFs are not supported. Remove the password in the program that created the
      document, then add the unlocked copy. Merging rewrites the PDF structure, so existing digital
      signatures should not be expected to remain valid.
    </p>
  </>
)

export const FAQ: readonly FaqItem[] = [
  {
    question: 'Does merging change the order of my pages?',
    answer:
      'No. The numbered list on screen is the source of truth. All pages from file 1 are copied first, followed by all pages from file 2, and so on. Use the arrow buttons to change that order before merging.',
  },
  {
    question: 'Will pages with different sizes be resized?',
    answer:
      'No. Pages are copied structurally rather than rendered as pictures, so their existing dimensions are retained. A merged document can contain a mixture of portrait, landscape, A4, Letter, and other page sizes.',
  },
  {
    question: 'Can I merge a password-protected PDF?',
    answer:
      'No. This tool does not ask for passwords or attempt to bypass encryption. Remove the password using software you trust, then add the unlocked PDF.',
  },
  {
    question: 'Will digital signatures still be valid?',
    answer:
      'No. A digital signature covers the exact bytes of a document. Merging creates a new PDF and therefore changes those bytes, even though the visible pages are copied faithfully.',
  },
  {
    question: 'Why is there a 50 MB limit?',
    answer:
      'The source files and growing output can exist in browser memory at the same time. The limit avoids starting work that is likely to freeze or close a memory-constrained browser tab. Files are never uploaded as a fallback.',
  },
  {
    question: 'Are my PDFs uploaded anywhere?',
    answer:
      'No. The files are read into browser memory, combined locally, and returned as a download. The merger does not send or store their contents.',
  },
] as const
