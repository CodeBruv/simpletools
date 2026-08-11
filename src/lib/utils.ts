/**
 * Minimal class-name joiner. Deliberately not `clsx` + `tailwind-merge`:
 * nothing in the MVP needs conflict resolution, and this keeps the
 * dependency count at zero for a five-line utility.
 */
export type ClassValue = string | number | null | undefined | false | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = []

  for (const input of inputs) {
    if (!input && input !== 0) continue
    if (Array.isArray(input)) {
      const nested = cn(...input)
      if (nested) out.push(nested)
    } else {
      out.push(String(input))
    }
  }

  return out.join(' ')
}
