# SimpleTools — Product Principles

**Status:** Locked. Changes require explicit instruction from the project owner.

These are the permanent operating principles that every tool in SimpleTools must follow — the ones
already built and every one built afterwards.

`vision.md` establishes why SimpleTools exists and who it serves, and decides *whether* a tool
should exist at all. This document takes that as settled and governs a different question: given
that a tool exists, how must it behave. It is a decision-making instrument. When a product question
arises that nobody anticipated, the answer is derived from these principles rather than invented.

A principle here is not an aspiration. It is a constraint. A tool that violates one is not
finished, regardless of how useful it is.

---

## 1. One Tool, One Problem

**Principle.** Each tool solves a single, nameable problem completely, and nothing else.

**Why it exists.** A tool that does one thing can be understood instantly, named accurately, found
by someone searching for exactly that need, and finished. The moment a tool acquires a second
purpose it becomes something the user must learn rather than simply use, and it loses the only
advantage it had over the bloated alternatives.

**In practice.**
- If a tool's description requires the word "and", it is probably two tools.
- Adjacent capability is not automatically the same problem. Related is not identical.
- Two focused tools are always preferred over one tool with a mode switch.
- A tool is allowed to be small. Small is the point, not a limitation to grow out of.

---

## 2. Depth Over Breadth

**Principle.** Solving one problem completely always outranks solving several partially. Feature
count is never a measure of quality.

**Why it exists.** Competitors compete on the length of their feature list. That is a race that
produces worse products, and it is not a race we are in. Our advantage comes from a user finishing
their task on the first attempt, which depends entirely on the one thing they came for working
properly — including its awkward edge cases.

**In practice.**
- The correct response to "this tool is too simple" is usually to verify it handles its own edge
  cases, not to add capability.
- Effort goes to the unglamorous parts of an existing tool before it goes to a new one.
- Any feature added to a tool must serve that tool's single problem. If it serves a different
  problem, it belongs elsewhere or nowhere.
- A capability that would be used rarely, but complicates the experience for everyone else, is
  declined.

---

## 3. Browser-First Experience

**Principle.** The browser is the product, not a delivery mechanism for one. Every tool is
complete, immediate, and self-contained in the page the user opens.

**Why it exists.** People arrive at a small task from a search result or a link, mid-work, wanting
it over with. Anything that interrupts that moment — an install, a download, a redirect, a handoff
elsewhere — costs more than the task was worth and sends them back to the alternatives.

**In practice.**
- Arriving at a tool means being able to use it. There is no intermediate step.
- Nothing is ever required to be installed to complete a core task.
- A tool must be usable in a single visit by someone who will never return, with no setup and no
  persistent state.
- Each tool must stand alone. It cannot depend on the user having visited another tool first.

---

## 4. Privacy By Structure, Not By Promise

**Principle.** Privacy is achieved by ensuring there is nothing to expose, not by promising to
behave well with what we collect.

**Why it exists.** Every privacy policy is a promise about future conduct, and users have learned
that such promises are worth very little. A structural guarantee is different in kind: it survives
a change of ownership, a bad quarter, a breach, and a subpoena, because the data was never
gathered. This is the most durable advantage the product has, and it is the easiest to lose
permanently — once for any reason is enough.

**In practice.**
- Where a browser can do the work, the user's content stays with the user.
- We do not measure, sample, log, or inspect the contents of what a user is working on. Not for
  analytics, not for quality, not for debugging.
- Diagnostics and error reports must be capable of being useful without carrying user content. If
  a diagnostic requires user content to be meaningful, it is not shipped.
- Convenience is never a sufficient reason to move user content off the device.
- Any proposal that would weaken this is escalated to the project owner, never decided locally.

---

## 5. Fast By Default

**Principle.** Speed is a feature of every tool, not a property of some of them. The expected
experience is that the result appears effectively at once.

**Why it exists.** These are small tasks. The user's patience is proportional to the size of the
job they think they are asking for, and they are right to judge us that way. Slowness also
signals, correctly, that something unnecessary is happening.

**In practice.**
- Waiting is never manufactured. Progress is shown because work is genuinely occurring, never to
  suggest effort or importance.
- A tool must be usable the moment it appears, not after it settles, shifts, or finishes preparing
  itself.
- When work genuinely takes time, the interface says so honestly and stays responsive throughout.
- Performance regressions are treated as defects, not as acceptable trade-offs for new capability.
- If a feature makes a tool meaningfully slower for everyone in order to help a few, it is declined.

---

## 6. No Unnecessary Friction

**Principle.** Nothing stands between arriving and finishing except the task itself.

**Why it exists.** Every interruption is a place to lose someone who came with a genuine need and
would have been happy. Most of these interruptions exist to serve the business, not the user, and
they are exactly what makes the existing alternatives unpleasant.

**In practice.**
- No account, sign-in, or identifying information is required to complete a task.
- Nothing is asked of the user that is not required to produce their result.
- No interstitial, prompt, tour, banner, or invitation may interrupt work in progress.
- Optional things stay optional and stay quiet. Dismissal is remembered and respected.
- Defaults are chosen so that the most common case requires no configuration at all.

---

## 7. Predictable Behaviour

**Principle.** The same input produces the same result, every time. A tool behaves the way a
reasonable person would expect before they used it.

**Why it exists.** Trust in a utility is built entirely on repeatability. A tool that is usually
right is worse than useless for anything that matters, because its output must be checked every
time — which costs more than doing the task manually. Surprise, however clever, is a defect.

**In practice.**
- No result depends on inference, estimation, or anything that could return a different answer for
  the same input tomorrow.
- The tool does not silently improve, reinterpret, or correct the user's input. If it changes
  something, it says so.
- No hidden state. What the user sees on screen is the complete truth of what will happen.
- Behaviour does not vary by who is using it, when, or how often — except for openly stated limits.
- Identical operations across different tools produce identical results.

---

## 8. Never Damage the User's Work

**Principle.** The user's original is sacred. Every operation is additive, and nothing is lost,
overwritten, or degraded without a deliberate, informed instruction.

**Why it exists.** A person handing us a document is trusting us with something they may not be
able to recreate. A single instance of destroyed work is remembered permanently and shared widely,
and it is the one failure a utility cannot apologise its way out of.

**In practice.**
- Producing a result never alters the source the user provided.
- Quality is never reduced silently. If an operation is inherently lossy, that is stated before it
  runs, not discovered afterwards.
- Destructive actions require deliberate confirmation and, wherever possible, are reversible.
- Partial results are never presented as complete ones.
- When a tool cannot finish safely, it stops and leaves the user exactly where they started.

---

## 9. Fail Honestly

**Principle.** When something cannot be done, the tool says so immediately, in plain language, and
explains what to do next.

**Why it exists.** Failure is inevitable — malformed inputs, unsupported cases, genuine limits. How
a tool fails is a larger part of its reputation than how it succeeds, because success is expected
and failure is remembered. Vagueness in failure reads as either incompetence or concealment.

**In practice.**
- Errors state what happened and what the user can do, in the user's language, not in ours.
- Limitations are disclosed before work begins, never after the user has invested effort.
- A tool never blames the user for a case it should have anticipated.
- Silent failure is the worst outcome available and is always treated as a defect.
- If a case is genuinely unsupported, the tool says so plainly rather than producing an approximate
  result.

---

## 10. Self-Evident Without Instruction

**Principle.** A tool must be usable, correctly and on the first attempt, by someone who reads no
documentation and receives no explanation.

**Why it exists.** Nobody reads instructions for a task they expect to take ten seconds, and they
are right not to. Needing to explain a tool is evidence that the tool is wrong, not that the user
is unprepared. Documentation is a patch over a design failure.

**In practice.**
- The purpose of a tool must be obvious from its name and its first screen.
- The primary action is unmistakable. There is one obvious next step at every point.
- Help text is a signal to redesign, not a solution to ship.
- Terminology matches what the user already calls the thing, not what is technically precise.
- If a tool needs a tutorial, it is not finished.

---

## 11. Consistency Across Every Tool

**Principle.** Learning one tool teaches the user how to use all of them. Shared concepts look,
read, and behave identically everywhere.

**Why it exists.** Consistency is what turns a collection of unrelated utilities into a single
trustworthy product. It also compounds: each consistent tool makes the next one easier, while each
inconsistent one imposes a small permanent tax on everybody who encounters it.

**In practice.**
- Common actions use the same words, in the same places, with the same outcomes, in every tool.
- Results, errors, and limits are presented the same way throughout.
- A tool does not invent its own pattern for something the product already solves.
- Deviating from an established pattern requires a reason that survives scrutiny; novelty is not
  one.
- Visual and component-level rules are owned by `design-system.md`; this principle governs the
  behavioural expectation that they exist and are followed.

---

## 12. Accessible To Everyone

**Principle.** Accessibility is a requirement of every tool, not an enhancement applied to some.

**Why it exists.** A utility that solves a common problem is used by people with varied vision,
motor control, attention, devices, and circumstances. Excluding any of them from a task this
ordinary is indefensible. It is also far cheaper to build in from the start than to retrofit, and
retrofits are rarely completed.

**In practice.**
- Every tool is fully operable without a pointing device.
- Meaning is never carried by colour alone.
- Content remains usable when text is enlarged, and layouts do not trap or truncate it.
- Motion is never required to understand what happened, and stated preferences for reduced motion
  are respected.
- Interactive elements are announced accurately to assistive technology.
- Accessibility defects are ordinary defects with ordinary priority, not a separate backlog.
- The specific conformance target is owned by `design-system.md`; that a target is met is
  non-negotiable here.

---

## 13. Progressive Enhancement Where Appropriate

**Principle.** The core function of a tool works in the most limited capable environment. Anything
beyond that is an addition that improves the experience without ever being required.

**Why it exists.** Users arrive on old devices, constrained browsers, restricted machines, and poor
connections. A tool that only works under ideal conditions fails precisely the people with the
least ability to work around it. Building the plain path first also produces a simpler, faster tool
for everyone.

**In practice.**
- The essential task is completable without the conveniences layered on top of it.
- Enhancements are additive. Their absence degrades the experience; it never prevents the task.
- No convenience becomes the only route to a core action.
- Capability is detected, never assumed from the identity of a device or browser.
- Where the environment genuinely cannot support a tool, that is stated clearly on arrival rather
  than discovered through failure.

---

## 14. Stability Over Trends

**Principle.** A tool that someone learned once should still work the way they learned it. Change
is justified by user benefit, never by fashion or by our own boredom.

**Why it exists.** The value of a utility accumulates through familiarity. Every redesign spends
that accumulated value, and most redesigns buy nothing with it. Users of small tools do not want
novelty; they want the thing to be where they left it. A tool that stops changing because it is
correct is a success, not neglect.

**In practice.**
- A tool may be finished. Finished tools are maintained, not revised for the sake of activity.
- Redesigns require a demonstrated user problem, not a stylistic preference.
- Familiar behaviour is preserved through visual change wherever possible.
- Established behaviour is not altered to match a prevailing trend.
- Removing something people rely on requires the same justification as adding something new.

---

## 15. Trust Over Short-Term Monetisation

**Principle.** No revenue is worth reducing the trustworthiness of the product. Where the two
conflict, trust wins, permanently and without debate.

**Why it exists.** Trust is the entire product. It takes years to build, converts directly into
people returning and recommending, and is destroyed in a single incident. Every deceptive practice
in this category — the watermark, the surprise paywall, the ad, the harvested address — was a
rational short-term decision that permanently capped what the product could become.

**In practice.**
- The free experience is never deliberately degraded in order to sell the paid one.
- Results are never watermarked, truncated, or quality-reduced as a sales tactic.
- Any limit is disclosed before the user invests effort, never after.
- Upgrade prompts do not interrupt, block, obstruct, or arrive at the moment of frustration.
- Attention and personal data are never sold, and no tool exists to collect either.
- Plan definitions and limits are owned by `pricing.md`; this principle governs conduct, and it
  binds regardless of what those definitions become.

---

## Applying These Principles

**They are cumulative.** A tool must satisfy all of them. Excelling at one does not purchase an
exception to another.

**They apply to changes, not just to new tools.** Every modification to an existing tool is
assessed the same way.

**When principles conflict**, resolve in this order, highest authority first:

1. Privacy by structure (4)
2. Never damage the user's work (8)
3. Predictable behaviour (7)
4. Fail honestly (9)
5. No unnecessary friction (6)
6. Fast by default (5)
7. Everything else

A lower principle never overrides a higher one. Where the conflict is genuine and this ordering
does not settle it, the decision escalates to the project owner rather than being resolved by
assumption.

**Absence of a principle is not permission.** A situation these principles do not cover is decided
by reasoning from the closest ones, and the outcome is brought back here only on the project
owner's instruction.

Nothing in this document changes without explicit instruction from the project owner.
