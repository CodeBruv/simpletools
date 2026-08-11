/**
 * Test-only stand-in for `lucide-react`. Icons are inert data in the registry
 * and category tables, so a named marker per icon is sufficient.
 */
const icon = (name) => Object.assign(() => null, { displayName: name })

export const Briefcase = icon('Briefcase')
export const FileArchive = icon('FileArchive')
export const FileText = icon('FileText')
export const Image = icon('Image')
export const ImageDown = icon('ImageDown')
export const Percent = icon('Percent')
export const PiggyBank = icon('PiggyBank')
export const QrCode = icon('QrCode')
export const ReceiptText = icon('ReceiptText')
export const Sparkles = icon('Sparkles')
