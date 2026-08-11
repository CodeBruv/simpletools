/**
 * Test-only stand-in for `react`. The registry uses `lazy()` as data — the
 * import callback is never invoked during tests — so recording it is enough.
 */
export function lazy(loader) {
  return { $$typeof: Symbol.for('react.lazy'), _loader: loader }
}
