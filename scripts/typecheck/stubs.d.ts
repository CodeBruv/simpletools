/**
 * Minimal ambient stubs for the third-party packages used by SimpleTools'
 * logic core.
 *
 * WHY THIS EXISTS: this sandbox cannot reach the npm registry, so node_modules
 * (and therefore @types/react) does not exist and `tsc -b` cannot run. These
 * declarations let a real `tsc --noEmit --strict` type-check the modules that
 * carry the actual processing logic — src/lib, the registry, and the image
 * compressor — instead of shipping them entirely unchecked.
 *
 * SCOPE: this is deliberately NOT a re-implementation of React's types. Only
 * the handful of symbols the logic core imports are declared. Component files
 * (.tsx) are parse-checked separately and are NOT type-checked by this config.
 * Once `npm install` succeeds, `npm run typecheck` supersedes all of this and
 * this directory can be deleted.
 */

declare module 'react' {
  export type ComponentType<P = Record<string, unknown>> = (props: P) => unknown
  export interface LazyExoticComponent<T> {
    readonly _brand: unique symbol
    readonly _result?: T
  }
  export function lazy<T extends ComponentType<never>>(
    loader: () => Promise<{ default: T }>,
  ): LazyExoticComponent<T>
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
}

declare module 'lucide-react' {
  export type LucideIcon = (props: Record<string, unknown>) => unknown
  export const Briefcase: LucideIcon
  export const FileArchive: LucideIcon
  export const FileText: LucideIcon
  export const Image: LucideIcon
  export const ImageDown: LucideIcon
  export const Percent: LucideIcon
  export const PiggyBank: LucideIcon
  export const QrCode: LucideIcon
  export const ReceiptText: LucideIcon
  export const Sparkles: LucideIcon
}

/**
 * The registry lazy-imports tool components. Those are .tsx files, which this
 * config does not type-check, so their module shape is declared here instead.
 * Add one line per tool as tools are built.
 */
declare module '@/tools/image-compressor/ImageCompressor' {
  import type { ToolComponentProps } from '@/tools/registry'
  const ImageCompressor: (props: ToolComponentProps) => unknown
  export default ImageCompressor
}
