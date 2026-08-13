import type { FaqItem } from '@/components/tools/ToolShell'

export const HELP = (
  <>
    <p>
      PDF compression is not one operation, so this tool offers two and lets you pick. Both run
      entirely in your browser.
    </p>
    <p>
      <strong>Keep text selectable</strong> rebuilds the file's internal structure: objects are
      packed into compressed streams and anything left over from previous edits is dropped. Text,
      links, bookmarks and form fields survive untouched. The catch is that it can only remove
      structural waste, so a PDF that was already well built may come back barely smaller, or
      occasionally larger. The tool tells you either way.
    </p>
    <p>
      <strong>Stronger compression</strong> draws every page as an image and builds a new PDF from
      those pictures. It reliably produces a much smaller file, which is what most online PDF
      compressors actually do. It also means the text becomes a picture of text: no longer
      selectable, searchable, or readable by a screen reader. Use it when the goal is getting under
      an upload limit and the document is going to be looked at rather than worked with.
    </p>
    <p>
      If the result comes out bigger than what you started with, the tool says so plainly and you
      should keep your original.
    </p>
  </>
)

export const FAQ: readonly FaqItem[] = [
  {
    question: 'Why did my PDF barely get smaller?',
    answer:
      "Most PDF bulk is the images inside it. In the lossless mode this tool only reorganises the file's structure, so if your PDF was exported cleanly by a modern program there is very little waste left to remove. Scanned documents and heavily edited files have far more to gain. If you need a real reduction on an image-heavy PDF, use the stronger compression option.",
  },
  {
    question: 'Why would the compressed file be larger than the original?',
    answer:
      'Rebuilding a PDF means re-serialising every object, and the browser library used here does not always reproduce the exact compression choices the original writer made. On an already-optimised file that can add a little weight rather than remove it. When that happens the result panel shows the increase instead of a saving, so you can keep the file you already have.',
  },
  {
    question: 'Will compression ruin the quality?',
    answer:
      'Not in the lossless mode: nothing is re-encoded, so the pages are pixel-for-pixel what they were. The stronger mode does reduce quality, because pages are re-drawn as JPEG images at the quality and resolution you choose. Check the page count and the size, then look at the downloaded file before sending it anywhere important.',
  },
  {
    question: 'Can it open a password-protected PDF?',
    answer:
      'No. An encrypted PDF cannot be parsed without its password, and this tool never asks for one. Remove the password in whatever program you normally use, then compress the result.',
  },
  {
    question: 'Does compressing break a digital signature?',
    answer:
      'Yes. A signature certifies an exact sequence of bytes, and compression rewrites the file, so any existing signature will no longer validate. Do not compress a PDF you need to stay signed.',
  },
  {
    question: 'Are my documents uploaded anywhere?',
    answer:
      'No. The file is read into your browser\'s memory, processed there, and offered back to you as a download. There is no server involved, nothing is stored on your device after you leave the page, and the tool makes no network requests while it works.',
  },
] as const
