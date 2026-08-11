import { ShieldCheck } from 'lucide-react'

/**
 * The privacy note shown next to a file input.
 *
 * Only render this for tools whose processing genuinely never leaves the
 * browser. The claim has to stay true, so it is tied to the registry's
 * `clientOnly` flag rather than being decorative copy.
 */
export default function PrivacyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
      <ShieldCheck
        className="mt-px size-4 shrink-0 text-accent"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span>{children}</span>
    </p>
  )
}
