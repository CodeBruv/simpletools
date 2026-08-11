import { cn } from '@/lib/utils'
import {
  DEFAULT_QUALITY,
  MIN_QUALITY,
  MAX_QUALITY,
} from '@/tools/image-compressor/compressImage'

interface QualitySliderProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export default function QualitySlider({ value, onChange, disabled = false }: QualitySliderProps) {
  const percent = Math.round(value * 100)

  return (
    <div className={cn(disabled && 'opacity-50')}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="quality-slider" className="text-sm font-medium text-ink">
          Compression quality
        </label>
        <output
          htmlFor="quality-slider"
          aria-live="polite"
          className="font-mono text-sm tabular-nums text-accent"
        >
          {percent}%
        </output>
      </div>

      <div className="mt-1">
        <input
          id="quality-slider"
          type="range"
          min={MIN_QUALITY}
          max={MAX_QUALITY}
          step={0.01}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(parseFloat(event.target.value))}
          className={cn(
            // The element is a full 44px tall so it is comfortably draggable on
            // a phone; the visible 8px track is drawn by the track pseudo-element
            // rather than the input's own box.
            'block h-11 w-full appearance-none bg-transparent',
            '[&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full',
            '[&::-webkit-slider-runnable-track]:bg-line-strong',
            '[&::-webkit-slider-thumb]:-mt-1.5 [&::-webkit-slider-thumb]:size-5',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-100',
            '[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full',
            '[&::-moz-range-track]:bg-line-strong',
            '[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:appearance-none',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:transition-transform',
            '[&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-100',
            !disabled && 'cursor-pointer',
          )}
        />
      </div>

      <div className="flex justify-between text-xs text-faint">
        <span>Smaller file</span>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_QUALITY)}
          disabled={disabled}
          className={cn(
            'rounded px-1 underline decoration-dotted underline-offset-2',
            'hover:text-muted disabled:cursor-not-allowed',
          )}
        >
          Reset to {Math.round(DEFAULT_QUALITY * 100)}%
        </button>
        <span>Better quality</span>
      </div>
    </div>
  )
}
