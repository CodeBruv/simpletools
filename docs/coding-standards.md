# SimpleTools — Coding Standards

**Status:** Locked. Changes require explicit instruction from the project owner.

This document defines the engineering standards for SimpleTools. It binds every contributor and
every AI coding agent equally. Code that does not meet these standards is not merged, regardless of
whether it works.

`architecture.md` decides where code lives and what it may touch. This document decides how that code
is written. Where a rule here restates an architectural constraint, it does so in engineering terms;
`architecture.md` remains the authority on the constraint itself.

Technology selection is owned by `tech-stack.md`. Visual language and conformance targets are owned by
`design-system.md`. This document assumes both and does not revisit either.

This document contains no installation instructions, no configuration, no code examples, and no
tutorials. It states expectations, not syntax.

---

## 1. Engineering Philosophy

The product intends to contain hundreds of small utilities and to be maintained for many years by a
small team. Most code here will be read far more often than it is written, usually by someone who has
never seen it before, is not planning to stay, and needs to make one safe change.

Everything below follows from that.

### 1.1 Code Is Written For Humans First

The compiler will accept almost anything. The next person will not. When a choice exists between
what is convenient to write and what is obvious to read, the reader wins every time.

The relevant reader is not you, and not today. It is someone unfamiliar, two years from now, working
under time pressure, in a tool they did not build.

### 1.2 Clarity Over Cleverness

Clever code is code that requires the reader to reconstruct the author's reasoning before they can
change anything safely. That reconstruction cost is paid on every future visit and is never
recovered.

A longer, plainer solution is better than a shorter, denser one. If something is genuinely subtle,
the subtlety is explained in a comment — but the first attempt should be to remove the subtlety.

### 1.3 Simplicity Beats Abstraction

Abstraction is not free. It buys reuse and pays in indirection, and indirection is the primary reason
unfamiliar code is hard to follow.

Abstract only in response to a demonstrated, repeated need. Speculative generality — flexibility
built for futures that never arrive — is one of the most expensive mistakes available here, and it is
explicitly unwanted. When the shape is not yet clear, duplicate and wait.

### 1.4 Optimise Only After Measuring

Performance matters and is a stated product requirement. Guessing about performance is still
guessing.

Write the clear version first. Measure. Optimise what measurement identifies, and leave a note
explaining what was measured and why the clear version was insufficient. Optimisation without
evidence is complexity without benefit.

### 1.5 Every Change Leaves The Codebase Easier To Maintain

The measure of a change is not only whether it works. It is whether the next person has an easier
time than they would have had before.

A change that adds capability while degrading clarity has a cost that will be paid repeatedly by
people who never saw the benefit.

### 1.6 Consistency Outranks Personal Preference

Where a pattern already exists, follow it. A codebase where every module reflects its author's taste
forces every reader to learn each author before they can read anything.

Disagreement with an established pattern is resolved by changing the pattern everywhere, or not at
all. It is never resolved locally.

### 1.7 Deletion Is A Contribution

Unused code is not free. It is read, maintained, upgraded, searched, and mistakenly trusted. Removing
it is real work with real value.

Code that is no longer used is deleted in the same change that stops using it, not marked and left.

### 1.8 Write For Code That May Never Change Again

A tool may be finished. Its code should be written on the assumption that nobody will revisit it for
years and that when they do, it will be because something outside it changed.

That means: no hidden assumptions, no reliance on tribal knowledge, no dependence on how something
adjacent currently behaves.

### 1.9 Standards For AI Coding Agents

These apply in addition to everything above, and are not optional.

- **Do exactly what was asked.** Do not add capability, refactor adjacent code, or improve things
  that were not part of the request. Unrequested scope is rejected on sight.
- **Match the surrounding code.** Its conventions, naming, structure, and comment density are the
  specification. Do not import patterns from elsewhere.
- **Do not invent abstraction.** Generated code tends toward premature generality. Section 1.3 applies
  with full force.
- **Do not add dependencies.** Dependencies require explicit approval under `tech-stack.md`.
- **Verify against the handbook, not against plausibility.** Fluent, confident, well-structured code
  that violates an architectural constraint is the specific failure mode to guard against.
- **Fluency is not correctness.** Generated code that reads well and is wrong is more dangerous than
  code that reads badly, because it survives review.

---

## 2. Project Organization

### 2.1 Organise By Feature, Never By Kind

Code is grouped by what it is for, not by what type of thing it is. A tool's presentation,
orchestration, domain logic, types, and tests live together inside that tool's module.

Grouping by kind — all components in one place, all hooks in another — scatters every tool across the
repository and makes the boundaries that `architecture.md` depends on invisible. Co-location is what
makes a tool comprehensible and cleanly deletable.

### 2.2 The Tool Module Is The Unit

Everything unique to a tool lives inside its module. Everything shared lives in shared material. There
is no third place.

A tool module may depend on the Shared Foundation, on Platform Services, and on itself. It may not
depend on another tool module, for any reason, in any direction.

### 2.3 Module Boundaries Are Real

Each module exposes a single, deliberate public surface. Everything else is internal.

- Reaching past a module's public surface into its internals is forbidden, even when it works.
- Internal structure may be reorganised freely without consulting anyone. That freedom is the entire
  point of the boundary and is lost the moment deep imports appear.
- Public surfaces are small by default. Exporting something is a commitment.

Aggregating entry points are used only at a module's boundary. They are never used internally, where
they obscure real dependencies, create import cycles, and defeat the removal of unused code.

### 2.4 File Organisation

- One primary concern per file. A file should have one reason to exist.
- A file that requires scrolling to understand its shape is a candidate for splitting — but split
  along meaningful lines, never to satisfy a line count.
- Related things stay adjacent. A type used by exactly one thing lives beside it, not in a distant
  types file.
- No general-purpose dumping grounds. A file named for a category rather than a purpose will
  accumulate unrelated code indefinitely. If something does not have an obvious home, that is a signal
  about the structure, not a reason to create a miscellaneous file.
- Tests live beside the code they verify.

### 2.5 Naming Consistency

Names are the primary documentation. They are chosen carefully and changed when they stop being
accurate.

- Directories and non-component files use lowercase with hyphens. Component files use the component's
  name, capitalised as the component is.
- Names describe purpose and domain meaning, not implementation or pattern. Naming something after
  the pattern it uses tells the reader nothing about why it exists.
- Functions are named as actions. Values are named as what they are. Booleans read as assertions.
- Abbreviations are avoided unless they are more widely understood than the full word. Saved
  characters are not worth lost meaning.
- The same concept uses the same word everywhere in the codebase. Synonyms for one idea are a defect —
  the reader cannot tell whether the difference is meaningful.
- Names do not encode their location or layer. The structure already says that.

### 2.6 Shared Code

Shared material is earned, not anticipated.

- A capability moves into shared material when a genuine third tool needs it. Two similar things are a
  coincidence; three are a pattern.
- Shared code must not know anything about its callers. A shared unit containing a condition that
  names a particular tool has stopped being shared and has become a hidden coupling between unrelated
  things. This is a defect, not a shortcut.
- Promotion is downward only. Code moves from a tool into shared material. It never travels sideways
  between tools.
- Shared material grows far more slowly than the tool count. Shared code that grows in proportion to
  the number of tools is absorbing tool-specific concerns and is being misused.

### 2.7 Feature Isolation

Adding a tool consists of creating its module and registering it in the catalogue. It must not require
modifying any existing tool.

If it does, something tool-specific has leaked into shared material. The leak is fixed before the new
work proceeds, not after.

---

## 3. TypeScript Standards

Types are a correctness tool, not documentation. In a codebase of hundreds of rarely-visited modules,
the type system is the main mechanism by which a stranger can change something safely.

### 3.1 Strong Typing Is The Default

- The strictest available compiler settings are enabled and are not relaxed for convenience, per
  module or otherwise.
- Everything crossing a module's public surface is explicitly annotated. Inference is preferred inside
  a function body, where it reduces noise without reducing clarity.
- Type errors are fixed, never suppressed. A suppression comment is an admission that requires a
  stated reason on the same line and, in practice, should be rare enough to be notable.

### 3.2 Avoiding `any`

`any` disables the type system silently and infectiously. It is not permitted.

- Untyped or untrusted input is typed as unknown and narrowed immediately at the boundary where it
  enters. Narrowing is not deferred.
- Type assertions are not a substitute. Asserting a shape does not establish it; it only stops the
  compiler from asking. Assertions are permitted only where a fact is genuinely known to the author
  and unavailable to the compiler, and each requires a comment stating why it holds.
- Non-null assertions are treated the same way. Habitual use means the model of what can be absent is
  wrong, and the model is what should be fixed.
- Where an escape hatch is genuinely necessary, it is isolated to the smallest possible surface and
  never allowed to propagate into the domain layer.

### 3.3 Interfaces And Type Aliases

Consistency matters more here than the merits of either.

- Object shapes that describe a contract use interfaces.
- Unions, intersections, function types, mapped and conditional types, and simple aliases use type
  aliases, which are the only option for most of these.
- The choice is made by category, not by preference. Two developers describing the same kind of thing
  should reach for the same construct.

### 3.4 Enumerations

Language-level enums are avoided. They generate runtime output, interact awkwardly with the rest of
the type system, and their numeric form is not type-safe.

Fixed sets of values are expressed as unions of string literals, paired with a constant object where
the values are needed at runtime. This is more transparent, produces less output, and narrows
correctly.

### 3.5 Utility Types

- Prefer the language's built-in utility types over hand-written equivalents.
- Derive types from a single source of truth rather than declaring the same shape twice. Two
  independent declarations of one concept will diverge.
- Type-level programming is subject to the same clarity standard as runtime code. A type that requires
  study before it can be understood is a defect. If expressing a constraint in the type system costs
  more clarity than it buys in safety, express it plainly and verify it at runtime instead.

### 3.6 Null Handling

- One representation of absence is used throughout: absent values are undefined. Null is used only
  where an external system requires it, and is converted at the boundary.
- Optionality is modelled deliberately. A field that is optional because nobody decided is a defect.
- Optional chaining is used to handle genuine, expected absence. It is not used to move past values
  whose presence the author has not reasoned about — that converts a crash into silent wrongness,
  which is worse.
- Where a value must exist, the type says so, and the check happens once at the boundary rather than
  repeatedly downstream.

### 3.7 Error Handling In Types

- Expected failure is modelled as a value and appears in the signature. A caller must be able to see,
  from the type alone, that something can fail and what the failure means.
- Exceptions are reserved for genuinely exceptional conditions — programming errors and states from
  which recovery is not sensible.
- Domain-layer failures are domain values. The domain layer does not throw framework, transport, or
  platform errors; it does not know those exist.
- Errors carry structured, typed information rather than free-form strings. A caller should not have
  to interpret a message to decide what happened.
- Original causes are preserved when errors are wrapped. Discarding a cause discards the only
  information that would have explained the failure.
- Failures are never silently absorbed. An empty catch is a defect.

### 3.8 Validation At Boundaries

Data entering the system from anywhere untrusted is validated against a schema at the boundary, and
the resulting types are derived from that schema rather than declared separately.

Inside the boundary, types are trusted. That trust is only justified because the boundary is enforced,
so the boundary is not skipped for convenience.

### 3.9 Immutability

Data is treated as immutable by default. Inputs are not mutated; new values are produced.

This is not stylistic. Non-destruction is a product promise, and shared mutable state is the most
common source of behaviour that cannot be reasoned about locally.

---

## 4. React Standards

React belongs to the presentation layer. Nothing here applies to the domain layer, which stays pure
and framework-free.

### 4.1 Component Size And Responsibility

- A component does one thing. If describing it requires "and", it is likely two components.
- A component that needs internal section comments to be navigable is too large.
- Split along meaningful boundaries — a distinct responsibility, a distinct piece of state, a distinct
  part of the interface. Never split to satisfy a line count, which produces fragments that must be
  reassembled mentally.

### 4.2 Composition Over Configuration

- Prefer composing smaller components over adding options to a larger one.
- Boolean props that change what a component fundamentally is are a signal that two components are
  hiding inside one. Accumulated flags produce components nobody can reason about.
- Prefer passing content over passing instructions for producing content.
- Variants are declared deliberately and named meaningfully. They are not improvised at the call site.

### 4.3 Client And Server Boundaries

- Rendering on the server is the default. Interactivity is opted into deliberately, at the smallest
  scope that needs it, and never higher in the tree than necessary.
- The boundary is chosen consciously, because everything below it becomes code the user must load. A
  boundary placed carelessly high is a permanent, invisible cost to every visitor.
- Server-rendered paths handle pages, the shell, and the catalogue. They never handle user content.

### 4.4 Hooks

- Custom hooks exist to reuse stateful logic. Logic that is not stateful is a plain function and
  should stay one — wrapping pure logic in a hook makes it harder to test and harder to reuse.
- A hook does one thing, is named for what it provides, and does not conceal side effects a caller
  needs to know about.
- Hooks belong to the presentation and application layers. The domain layer never contains one.
- Effects are a last resort, used for genuine synchronisation with something outside the component.
  They are not used for deriving values, for reacting to prop changes, or for orchestrating flow that
  belongs in the application layer.
- Effects that must clean up, do. Effects whose dependencies are inaccurate are defects, not warnings
  to be silenced.

### 4.5 State Ownership

- State lives at the lowest point that needs it, and is lifted only when genuinely shared.
- Anything derivable is derived, never stored. Duplicated state diverges; it is only a matter of when.
- Platform data — subscription status, entitlements, usage, preferences, feature availability — is
  owned by the query layer named in `tech-stack.md`. It is never copied into local state, where it
  becomes a second, stale source of truth.
- Transient state for the current task belongs to the application layer, is scoped to the session, and
  does not outlive it.
- No global mutable state. It is the fastest way to couple tools that must remain independent.

### 4.6 Props

- Props are explicit, minimal, and fully typed. Passing an entire object where one field is needed
  creates a dependency on a shape the component does not use.
- Prop drilling through several layers indicates the structure is wrong. Restructure or compose;
  reaching for a global container is not the answer.
- Components do not mutate what they receive.
- Defaults are chosen so the common case requires no configuration at all.

### 4.7 Reusability

- Shared components serve every caller equally and know none of them. A shared component containing a
  condition naming a specific tool is a defect, not a convenience.
- A component is promoted to shared material on the third genuine use, not the second, and never the
  first.
- Accessibility is part of a shared component's contract, not something applied by its callers.

### 4.8 Rendering Performance

- Correctness and clarity first. Memoisation and similar techniques are applied in response to
  measurement, not anticipation. Applied speculatively, they add complexity, obscure data flow, and
  frequently cost more than they save.
- List identity is stable and derived from the data. Positional identity is a defect wherever the list
  can change.
- Work is not repeated on every render where it can be done once.
- **Substantial computation never blocks the interface.** Processing work is moved off the rendering
  path so that the page stays responsive and cancellable throughout. An interface that freezes while
  working violates a stated product principle, however fast the underlying work is.
- Interfaces are usable the moment they appear, not after they settle. Layout that shifts after arrival
  is a defect.
- Progress is reported only when work is genuinely occurring.

---

## 5. Styling Standards

### 5.1 One Styling System

The styling system named in `tech-stack.md` is the only one. No parallel approach is introduced beside
it, in any module, for any reason.

### 5.2 Utility Class Organisation

- Class ordering is consistent and applied automatically. It is never a matter of individual habit and
  never a subject of review comments.
- Long class lists are a signal to extract a component, not to build class strings by concatenation.
  Conditional styling is expressed through declared variants rather than assembled at the call site.
- Class names are not composed dynamically from fragments. A class that cannot be read literally in
  the source cannot be found by anyone searching for it.

### 5.3 Design Tokens

- Colour, spacing, typography, radius, and elevation come from the token system defined by
  `design-system.md`.
- One-off values that bypass the token system are a defect by default. Where one is genuinely
  necessary, it carries a comment explaining why the token set was insufficient — and that is usually
  a signal the token set needs extending, which is a `design-system.md` decision.

### 5.4 Component Styling

- Shared components own their appearance. Tools consume them; they do not restyle them from outside.
- A tool needing a shared component to look different asks for a variant, declared in shared material.
  Overriding from a distance produces components whose appearance cannot be predicted from their
  source.
- No tool invents its own visual pattern for something the product already solves.

### 5.5 Responsive Design

- Layouts are built for the smallest viewport first and enhanced upward.
- Every tool is fully usable on a small screen. Mobile is not a degraded mode.
- Layouts remain correct when text is enlarged. Content must not be trapped, clipped, or truncated.
- Interactive targets are large enough to be used comfortably on a touch device.

### 5.6 Accessibility

Accessibility is a requirement of every component, not a pass applied later. These are minimums; the
conformance target is owned by `design-system.md`.

- Semantic elements are used for their meaning. Supplementary accessibility attributes are added only
  where semantics genuinely cannot express the intent — they are a supplement, never a replacement.
- Everything is operable without a pointing device, in a logical order.
- Focus is always visible. Focus indication is never removed without an equal or better replacement.
- Meaning is never carried by colour alone.
- Every meaningful image or icon has a text equivalent; decorative ones are hidden from assistive
  technology.
- State changes that matter are announced, not merely rendered.
- Motion is never required to understand what happened, and stated preferences for reduced motion are
  respected.
- Accessibility defects are ordinary defects with ordinary priority.

### 5.7 Consistency

Identical concepts look and behave identically across every tool. Deviation from an established
pattern requires a reason that survives scrutiny. Novelty is not one.

---

## 6. Error Handling

Failure is a normal path, not an exception to design for later. How a tool fails is a larger part of
its reputation than how it succeeds.

### 6.1 Two Audiences, Never Confused

User-facing and developer-facing errors are different artefacts with different content. A technical
message shown to a user is a defect. A user-friendly message in a diagnostic is useless.

### 6.2 User-Facing Errors

- Plain language. What happened, and what the person can do about it.
- No jargon, no internal terminology, no raw technical detail, no bare codes.
- The tool never blames the user for a case it should have anticipated.
- Anything predictable is disclosed during validation, before the user invests effort — never after.
- Failure never leaves work in an unclear state. The user is returned to where they started with their
  material untouched.
- Silent failure is the worst available outcome and is always a defect.
- Where a case is genuinely unsupported, the tool says so plainly rather than producing an approximate
  result.

### 6.3 Developer-Facing Errors

- Precise, specific, and actionable. An error should let someone locate the problem without
  reproducing it.
- Typed and structured, carrying the information needed to distinguish causes.
- Original causes are preserved when errors are wrapped.
- Errors are never swallowed. An empty catch, or one that discards context, is a defect.
- Errors are handled where there is enough information to handle them, and propagated where there is
  not.

### 6.4 Logging

**No log, diagnostic, error report, or analytics event may contain user content.** Not file contents,
not file names, not input values, not samples, not derived fragments. This is inherited from
`architecture.md` and `tech-stack.md` and is not subject to local judgement.

- A diagnostic that would only be meaningful with user content attached is not collected.
- Diagnostics record what happened and where — the operation, the kind of failure, the location. Never
  the material.
- Reporting goes through the sanctioned path. Ad-hoc console output is not shipped.
- The obligation is to actively prevent content capture, not to assume tooling defaults are safe.

### 6.5 Recovery

- Cancellation is a first-class path, designed for rather than retrofitted. A user may abandon any
  task at any point and be left exactly where they started.
- There is no state in which a tool has done half of something. Either the task completed or it did
  not.
- Failure of a platform service never prevents completion of a core task. A tool that cannot finish
  because a platform service is unavailable is a defect, not a degraded state.
- Failures are contained. One tool failing must never take down the shell or affect another tool.
- Retries are offered only where retrying could plausibly succeed, and never automatically in a way
  that repeats work invisibly.

---

## 7. Performance Standards

Speed is a stated product requirement, not a quality attribute to trade away. Performance regressions
are defects and are treated as such.

### 7.1 The Governing Constraint

**A user who opens one tool must not pay for the existence of tools they will never open.** As the
catalogue grows toward hundreds of utilities, the cost to any individual visitor must stay flat.

Every rule in this section serves that constraint.

### 7.2 Weight Awareness

- The cost of code is known before it is added, not discovered afterwards.
- A tool's weight is that tool's responsibility. Weight added to shared material is paid by every
  visitor to every tool and is scrutinised accordingly.
- Shared material stays small. Something used by three tools out of two hundred does not belong in the
  shared path.
- Weight is reviewed as part of review. A change that meaningfully increases what users load must say
  so and justify it.

### 7.3 Loading And Splitting

- Tool code loads when the tool is opened, never before.
- Heavyweight capability loads at the point of genuine need — after validation has passed, not
  speculatively on arrival.
- Splitting follows real boundaries: the shell, shared material, and each tool. Splitting is not
  applied arbitrarily; excessive fragmentation has its own cost.
- Content that must be indexable and readable exists without waiting for client execution.

### 7.4 Rendering Efficiency

- Interfaces are usable on arrival. Content does not shift after it appears.
- The main thread stays responsive. Long-running work is moved off the rendering path and yields
  rather than blocking.
- Repeated work in render paths is eliminated where measurement shows it matters, and not before.
- Assets are sized appropriately for their use. Oversized media is a common and avoidable regression.

### 7.5 Dependencies

- The default answer to a new dependency is no. The full policy is owned by `tech-stack.md` and is not
  restated or relaxed here.
- Native browser capability is preferred over a dependency wherever it suffices.
- A dependency is never added for a trivial capability. Writing a small amount of code is frequently
  better than adopting a permanent liability.
- No dependency may reach the network during processing. Tools complete without one.

### 7.6 Measurement

- Performance claims are supported by measurement, in both directions. "This is faster" and "this is
  fine" both require evidence.
- Optimisation carries a note explaining what was measured and why the clear version was insufficient.
- A change that regresses performance is reverted or fixed. It is not accepted as a trade for new
  capability.

---

## 8. Testing Expectations

Tests exist for one reason: to make change safe in code that nobody remembers. That is the entire
justification, and it is a strong one here, because this product intends to contain tools that are
finished and then left alone for years.

A tool can only be considered finished if there is a mechanism proving it still works. Tests are that
mechanism.

### 8.1 What Gets Tested, In Priority Order

**1. Domain logic — the heaviest coverage, without exception.** This is where a tool's actual value
lives. It is pure, deterministic, free of interface and platform concerns, and therefore both the most
important thing to verify and the cheapest thing to verify. Every tool's problem-solving logic must be
verifiable without a browser, without an interface, and without any platform service present. If it
cannot be, the layering has been violated and that is the defect to fix first.

**2. Validation rules, including every rejection path.** Failing honestly and early is a product
promise. A validation rule that has never been exercised is a promise nobody has checked.

**3. Edge cases and malformed input.** The awkward cases are the product. Anyone can handle the
well-formed input; the reason to use a tool at all is that it handles the input that broke everything
else.

**4. Determinism.** Known inputs produce known outputs, and continue to across dependency and
framework upgrades. This is the guard that lets the platform be upgraded without silently altering
what tools produce.

**5. Non-destruction.** The user's original is never altered, and failure at any stage leaves it
untouched.

**6. Shared material.** Anything used by many tools carries the risk of many tools, including its
accessibility behaviour.

**7. Critical paths end to end — thin and few.** Enough to know the tool works when assembled. These
are the most expensive and most brittle tests, so there are only as many as genuinely needed.

### 8.2 What Is Not Tested

- Implementation details. A test asserting how something works, rather than what it does, blocks
  refactoring while proving nothing.
- Framework behaviour and third-party libraries. They are not ours to verify.
- Trivial code with no logic.
- Assertions that pass regardless of whether the code is correct. A test that cannot fail is worse than
  no test, because it produces false confidence.

### 8.3 Standards For Tests

- Tests are read more than they are written and meet the same clarity standard as everything else.
- A test states what behaviour is expected and under what conditions. Its name should explain the
  failure without opening it.
- Tests are independent, and do not depend on ordering or on shared mutable state.
- A flaky test is fixed or deleted, immediately. Tolerating one teaches everybody to ignore failures,
  which destroys the value of the whole suite.
- Every defect gets a test that reproduces it, written before the fix. Otherwise there is no evidence
  the fix works and nothing preventing its return.
- No user content is embedded in test material. Fixtures are synthetic and owned by us.

### 8.4 Coverage

Coverage is a diagnostic, not a target. High coverage of trivial code alongside untested domain logic
is worse than an honest lower number, because it hides the gap that matters.

The question is never "what percentage" but "if this broke, would something fail".

---

## 9. Documentation Standards

The handbook is the source of truth. Code documentation exists to explain what code cannot say about
itself.

### 9.1 Comments

- Comments explain **why**, never **what**. The code states what it does; if it does not, the code is
  the problem and a comment is not the fix.
- A comment that restates the line beneath it is deleted.
- Comment the non-obvious: a constraint that is not visible locally, a trade-off deliberately made, an
  approach rejected for a reason, a workaround and the condition that would allow its removal, a
  subtlety in a format or specification.
- Comments are maintained with the code. An inaccurate comment is worse than none, because it is
  trusted.
- No commented-out code. History is owned by version control.
- No change logs, authorship notes, or dates in file headers. Version control owns all of it.
- Markers for future work carry a reference to a tracked item. An unattributed marker is a wish, and
  wishes accumulate forever.

### 9.2 Function And Module Documentation

- Everything on a module's public surface is documented: what it does, what it requires, what it
  guarantees, and how it can fail.
- Domain functions state their determinism assumptions and their behaviour on invalid input
  explicitly, because callers depend on both.
- Internal functions are documented only where genuinely non-obvious. Documenting the obvious trains
  readers to skip documentation.
- Each tool module carries a short note stating the single problem it solves, what it deliberately does
  not do, and any known limits. The deliberate exclusions are the most valuable part — they prevent
  the same rejected idea being re-proposed indefinitely.

### 9.3 Repository Documentation

- The repository README explains how to work in the project and stays current. A stale README is worse
  than an absent one.
- README changes accompany the change that makes them necessary, in the same submission.
- Documentation that has drifted from reality is corrected or removed, not left as a trap.

### 9.4 Change Records

- User-visible changes are recorded in terms of what changed for the user, not what changed in the
  code.
- A finished tool's record should stop growing. Continued churn in a tool that is supposedly complete
  is a signal worth examining.

### 9.5 Architectural Notes

- Decisions that shape the codebase belong in the handbook, not in code comments. A constraint
  recorded only in a comment is a constraint nobody will find.
- Where code must deviate from the handbook, that is escalated to the project owner, not documented
  locally as an exception. Local exceptions become precedent.
- Where code and handbook disagree, the handbook is correct and the code is wrong, until the project
  owner says otherwise.

---

## 10. Code Review Standards

Review exists to protect correctness, comprehensibility, and conformance — in that order. It is not a
formality and not a style argument.

### 10.1 Blocking Checks

Any of these means the change does not merge, regardless of its quality otherwise.

- **Privacy.** Does anything log, transmit, persist, or expose user content, in any form, including
  diagnostics and analytics?
- **Local processing.** Does any browser-capable utility send user files anywhere?
- **Tool isolation.** Does this create a dependency between two tool modules, in either direction?
- **Layer purity.** Has anything about accounts, plans, preferences, navigation, analytics, or
  presentation leaked into the domain layer?
- **Determinism.** Could this produce a different result for the same input?
- **Lifecycle.** Does the tool follow input, validation, processing, output, in order?
- **Critical path.** Does completing a core task now depend on a platform service being available?
- **Non-destruction.** Can the user's original be altered or lost, on any path including failure?
- **Approved dependencies.** Does this add a dependency, and was it explicitly approved?
- **Handbook conformance.** Does this violate any constraint in `architecture.md` or any principle in
  `product-principles.md`?

### 10.2 Ordinary Review

- **Scope.** Does the change do only what it claims? Unrelated work is split out.
- **Clarity.** Could someone unfamiliar understand this in a minute? If the reviewer could not, that is
  a readability defect in the code, not a gap in the reviewer.
- **Naming.** Do the names still mean what they say?
- **Types.** Any use of `any`, any assertion, any suppression — and is each justified in place?
- **Abstraction.** Is this abstracted before the third real case? Is it duplicated where an abstraction
  is genuinely warranted?
- **Error handling.** Both audiences addressed, nothing swallowed, failure leaves a clean state.
- **Accessibility.** Keyboard operability, focus, semantics, contrast, motion.
- **Performance.** What does this add to what users load, and does it block the main thread?
- **Tests.** Is domain logic covered? Does a defect fix include a reproducing test?
- **Documentation.** Are the why-comments present, and is the module note accurate?
- **Deletion.** Has everything this change obsoletes been removed?

### 10.3 Conduct

- Review the code, not the person.
- Distinguish blocking objections from suggestions, explicitly. A reviewer who does not separate them
  forces the author to guess.
- State reasoning. "This violates constraint X" is reviewable; "I would do it differently" is not.
- Anything automated — formatting, ordering, lint — is not a review comment. Tooling handles it.
- Approval is shared responsibility for the change. Approving something not understood is not a
  neutral act.

### 10.4 Change Size

Changes are small and single-purpose. A change too large to review carefully will not be reviewed
carefully; it will be approved instead. Size is the reviewer's business, and asking for a split is
always legitimate.

### 10.5 AI-Generated Code

Code produced by an AI agent is held to exactly these standards, with no allowance made for its
origin.

- The person submitting it owns it completely and is accountable for every line.
- Submitting code that its author does not understand is not acceptable.
- The specific risk is fluency: generated code is confident, idiomatic, and plausible, which means
  violations survive review that clumsier code would not. Reviewers verify against the handbook
  explicitly rather than trusting that well-formed code is conformant.
- Watch particularly for: unrequested scope, invented abstraction, added dependencies, patterns
  imported from other codebases, and confident handling of edge cases that was never actually
  verified.

---

## Boundaries And Change Control

This document owns engineering practice: how code is written, organised, typed, styled, tested,
documented, and reviewed.

It does not own structure (`architecture.md`), technology (`tech-stack.md`), visual language and
conformance targets (`design-system.md`), data structure (`database.md`), security controls
(`security.md`), or release process (`deployment.md`).

Where this document conflicts with `vision.md`, `product-principles.md`, `architecture.md`, or
`tech-stack.md`, those documents are correct and this one is amended.

Nothing here changes without explicit instruction from the project owner.
