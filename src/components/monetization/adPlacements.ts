/**
 * Where an advertisement is allowed to appear.
 *
 * No advertising provider exists yet, and none is referenced here. This module
 * exists so the *layout* decision is made once, in the open, before money is
 * involved — because the pressure to slide a unit next to a download button
 * arrives with the first revenue report, not before it.
 *
 * The rule these names encode: a slot may sit before the tool or after the
 * user's work is finished, never inside it. There is deliberately no placement
 * between input and result, none inside the result card, and none adjacent to a
 * download control. A future placement cannot be added by passing a string —
 * it has to be declared here, which makes it reviewable.
 */
export const AD_PLACEMENTS = [
  /** Above the tool, below the title and description. Before any control. */
  'tool-top',
  /**
   * Below the whole tool block, above related tools. Past the finish line: the
   * user has their file before this is reached. Held one clear band away from
   * the download button, since a unit tight under it is the accidental-tap case.
   */
  'tool-bottom',
  /** The foot of any page, after all content. */
  'page-bottom',
] as const

export type AdPlacement = (typeof AD_PLACEMENTS)[number]

/**
 * Reserved height for an active placement, in pixels. Mobile first: the narrow
 * value fits a 320x100 unit and the wide value fits a 728x90 unit. An inactive
 * placement renders no host element and therefore reserves no height.
 */
export const AD_SIZES: Record<AdPlacement, { narrow: number; wide: number }> = {
  'tool-top': { narrow: 100, wide: 90 },
  'tool-bottom': { narrow: 100, wide: 90 },
  'page-bottom': { narrow: 100, wide: 90 },
}

/**
 * Placements that must never be rendered inside a tool's working area.
 *
 * Exported for the regression test that walks the tool components: if someone
 * later drops a slot between the dropzone and the result, the test names the
 * file. A comment alone would not have stopped it.
 */
export const PLACEMENTS_FORBIDDEN_INSIDE_TOOL_UI: readonly string[] = [
  'tool-inline',
  'tool-result',
  'tool-download',
  'tool-preview',
  'tool-modal',
]

export function isAdPlacement(value: unknown): value is AdPlacement {
  return typeof value === 'string' && (AD_PLACEMENTS as readonly string[]).includes(value)
}
