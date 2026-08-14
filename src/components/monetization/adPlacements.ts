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
 * Reserved height per placement, in pixels, matched to standard display sizes
 * so introducing a real unit later does not reflow the page. Mobile first: the
 * narrow value is a 320x100 large mobile banner, the wide one a 728x90
 * leaderboard.
 */
export const AD_SIZES: Record<AdPlacement, { narrow: number; wide: number }> = {
  'tool-top': { narrow: 100, wide: 90 },
  'tool-bottom': { narrow: 100, wide: 90 },
  'page-bottom': { narrow: 100, wide: 90 },
}

/**
 * Whether any advertising is configured. Hardwired false: there is no provider,
 * no script and no network call in this build.
 *
 * Keeping this as a single named constant rather than scattering `false` means
 * the day advertising is switched on there is exactly one place to look, and
 * every slot inherits the same off switch. Tests assert it is false so that
 * enabling ads is a deliberate, visible change rather than a side effect.
 */

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
