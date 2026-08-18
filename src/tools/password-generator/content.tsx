import type { FaqItem } from '@/components/tools/ToolShell'

export const HELP = (
  <>
    <p>
      Choose a password length from 8 to 128 characters, select the character types you need, then
      select Generate password. Each enabled character type appears at least once. Copy the result
      when you are ready, or generate another without changing your options.
    </p>
    <p>
      Longer, randomly generated passwords are generally harder to guess. Using several character
      types increases the available character pool, while excluding ambiguous characters can make a
      password easier to read or enter by hand. Follow any length and character rules set by the
      service or your organization.
    </p>
    <p>
      Randomness comes from the browser's Web Crypto API. Generation and copying happen in this
      browser tab: no account is required, the password is not uploaded, and SimpleTools does not
      store it. Use a different password for every account and keep passwords in a trusted password
      manager rather than reusing them.
    </p>
  </>
)

export const FAQ: readonly FaqItem[] = [
  {
    question: 'How are passwords generated?',
    answer:
      'The tool uses crypto.getRandomValues from the browser Web Crypto API. It includes at least one character from every enabled group, fills the remaining positions from the combined pool, and securely shuffles the result.',
  },
  {
    question: 'Is a generated password secure?',
    answer:
      'The generator uses cryptographically strong browser randomness, but suitability depends on the service policy and how the password is handled. A longer unique password is generally preferable, and a trusted password manager can store it safely.',
  },
  {
    question: 'Does SimpleTools store my password?',
    answer:
      'No. The generated password exists only in the current page state. It is not uploaded, saved to browser storage, placed in the URL, or stored by SimpleTools.',
  },
  {
    question: 'Can I choose the length and character types?',
    answer:
      'Yes. Choose a length from 8 to 128 characters and independently include or exclude uppercase letters, lowercase letters, numbers, and symbols. At least one character type must remain selected.',
  },
  {
    question: 'What does excluding ambiguous characters do?',
    answer:
      'It removes 0, O, o, 1, l, and I from the available character sets. This can reduce mistakes when reading or typing a password, while slightly reducing the character pool.',
  },
  {
    question: 'Can I generate another password?',
    answer:
      'Yes. Select Generate password again to create a fresh result with the current options. Reset restores the default options and clears the current password.',
  },
  {
    question: 'Should I reuse a generated password?',
    answer:
      'No. Use a unique password for each account so that a password exposed by one service cannot be used to access another.',
  },
] as const
