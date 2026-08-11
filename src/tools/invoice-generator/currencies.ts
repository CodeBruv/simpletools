/**
 * Currencies the invoice can be issued in.
 *
 * Deliberately a curated list rather than the full ISO 4217 set: a picker with
 * 180 entries is worse than a short one, and the rows here cover the places
 * SimpleTools is actually used. Adding one is a matter of adding a row —
 * nothing in the calculation engine knows about any particular currency.
 *
 * There is no conversion anywhere in this tool. Choosing a currency changes how
 * amounts are *labelled*, never what they are worth: 250000 stays 250000 when
 * the user switches from NGN to USD. Converting would need a live rate, which
 * would need a network call, which this product does not make.
 */

export interface Currency {
  /** ISO 4217 code, used as the stable identifier. */
  code: string
  name: string
  /** What gets printed next to the amount. */
  symbol: string
  /**
   * Minor-unit digits. Most currencies use 2; the yen and won use 0. This
   * drives both rounding and display, so a yen invoice never shows ¥1,000.00.
   */
  decimals: 0 | 2
}

export const CURRENCIES: readonly Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimals: 2 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', decimals: 0 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', decimals: 0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
] as const

export const DEFAULT_CURRENCY_CODE = 'USD'

/** Falls back to the default rather than throwing: a bad code must not blank the invoice. */
export function getCurrency(code: string): Currency {
  return (
    CURRENCIES.find((currency) => currency.code === code) ??
    CURRENCIES.find((currency) => currency.code === DEFAULT_CURRENCY_CODE) ??
    // Unreachable while the list above is non-empty; keeps the return type honest.
    { code, name: code, symbol: '', decimals: 2 }
  )
}

/**
 * Groups the integer part in threes.
 *
 * Written by hand rather than delegating to `Intl.NumberFormat` because Intl
 * would also decide the symbol, its position and the separators from a locale —
 * so the same invoice would render differently on two machines, and a printed
 * document would not match what the sender saw. An invoice has to be
 * deterministic, so grouping is fixed here and the symbol comes from the table.
 */
function groupThousands(digits: string): string {
  let out = ''

  for (let i = 0; i < digits.length; i += 1) {
    // Insert a separator before every third digit counted from the right.
    if (i > 0 && (digits.length - i) % 3 === 0) out += ','
    out += digits[i]
  }

  return out
}

/**
 * Formats a number of *major* units for display, e.g. 250000 → "₦250,000.00".
 *
 * Non-finite input formats as zero. The alternative — letting NaN through —
 * puts "NaN" on a document someone is about to send a customer.
 */
export function formatMoney(amount: number, currency: Currency): string {
  const safe = Number.isFinite(amount) ? amount : 0
  const negative = safe < 0
  const absolute = Math.abs(safe)

  const fixed = absolute.toFixed(currency.decimals)
  const [whole = '0', fraction] = fixed.split('.')

  const body = fraction ? `${groupThousands(whole)}.${fraction}` : groupThousands(whole)

  return `${negative ? '-' : ''}${currency.symbol}${body}`
}

/** The numeric part alone, for places where the symbol is already shown in a column header. */
export function formatAmount(amount: number, currency: Currency): string {
  return formatMoney(amount, currency).replace(currency.symbol, '')
}
