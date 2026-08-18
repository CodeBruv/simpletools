import type { FaqItem } from '@/components/tools/ToolShell'

export const HELP = (
  <>
    <p>
      Paste or type JSON in the input, choose an indentation, then select Format. The formatted result
      stays separate from your source so you can review it before copying or downloading it. Validate
      checks the same input without changing either textarea.
    </p>
    <p>
      The tool uses the browser's standard JSON parser. Valid JSON may be an object, array, string,
      number, boolean, or null. When parsing fails, the error includes the parser location when the
      browser provides one.
    </p>
    <p>
      Minify parses the JSON and serializes it again without formatting whitespace. It preserves the
      parsed data and key order, and all processing happens locally in this browser tab. Number
      handling follows standard JavaScript JSON parsing semantics.
    </p>
  </>
)

export const FAQ: readonly FaqItem[] = [
  {
    question: 'How do I format JSON?',
    answer:
      'Paste JSON into the input, choose 2 spaces, 4 spaces, or tabs, and select Format. Review the formatted output, then copy it or download it as formatted.json.',
  },
  {
    question: 'What does JSON validation check?',
    answer:
      'Validation uses the browser standard JSON parser to check syntax. Invalid input is reported without changing your source, with a parser position or line and column when the browser provides one.',
  },
  {
    question: 'What does minifying JSON do?',
    answer:
      'Minifying removes formatting whitespace by parsing and serializing the value again. It does not reorder object keys or intentionally alter the parsed data.',
  },
  {
    question: 'Does valid JSON have to be an object?',
    answer:
      'No. Objects, arrays, strings, numbers, booleans, and null are all valid top-level JSON values.',
  },
  {
    question: 'Is my JSON uploaded or stored?',
    answer:
      'No. Formatting, validation, minification, copying, and download preparation happen in your browser. This tool does not send or store the JSON contents.',
  },
] as const
