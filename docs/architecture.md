# SimpleTools — Architecture

**Status:** Locked. Changes require explicit instruction from the project owner.

This document describes **how the platform is organised**. It defines logical layers, module
boundaries, the standard shape of a utility, and the permanent rules that keep a collection of
hundreds of small tools comprehensible.

It deliberately names no technology. Technology choices are owned by `tech-stack.md`. Code
conventions are owned by `coding-standards.md`. Visual and component rules are owned by
`design-system.md`. This document constrains all three without describing any of them.

`vision.md` decides whether a tool should exist. `product-principles.md` decides how a tool must
behave. This document decides where a tool lives and what it may touch.

---

## 1. Architecture Philosophy

The architecture is not an independent creation. It is the direct consequence of four product facts
that are already settled, and it exists to make those facts cheap to honour and expensive to
violate.

Those facts: the work happens on the user's device; each tool solves one problem; the tool count
grows for five phases and then stops growing in kind but not in number; and the product must remain
maintainable by a small team for a very long time.

### 1.1 Simplicity Over Complexity

The correct architecture here is the least architecture that supports the constraints. Every layer,
abstraction, and indirection must earn its place by preventing a specific, identified problem.

Complexity is not neutral. It is a permanent tax paid by everyone who reads the codebase
afterwards, and it compounds faster than the functionality it enables. A structure that is
sophisticated but requires explanation is worse than a plain one that does not.

We are building many small things, not one large thing. The architecture should reflect that: it is
a filing system with strong rules, not an engine.

### 1.2 Modular Growth

Growth happens by addition, never by modification. Adding the hundredth tool must be the same act,
of the same size and risk, as adding the second.

This is the single most important property of the system. If the cost of adding a tool rises with
the number of tools already present, the architecture has failed, regardless of any other quality
it has.

### 1.3 Long-Term Maintainability

The product's ambition is that tools become finished and then stay correct for years. That makes
the reader, not the writer, the primary audience of the codebase — and the likely reader is someone
who has not seen this tool before and will not stay in it long.

Every structural decision is therefore judged by a single question: how quickly can someone
unfamiliar with a tool understand it completely, change it safely, and leave. Optimising for the
speed of writing at the expense of that is always the wrong trade.

### 1.4 Low Operational Overhead

Because processing happens on the user's device, the platform is deliberately thin. There is very
little running, very little to fail, and very little to attend to.

This is a deliberate strategic position, not an accident of scale. A thin platform is what makes a
small subscription price viable, what keeps the privacy guarantee structural, and what allows the
team's attention to go into the tools themselves rather than into keeping the lights on. Any
proposal that thickens the platform is spending something scarce and must justify itself in those
terms.

---

## 2. High-Level Platform Structure

The system is organised into five logical layers. These are responsibilities, not directories, and
not deployable units.

```
  ┌──────────────────────────────────────────────────┐
  │  Presentation Layer                              │
  │  what the user sees and operates                 │
  ├──────────────────────────────────────────────────┤
  │  Application Layer                               │
  │  orchestration of a single task, in one session  │
  ├──────────────────────────────────────────────────┤
  │  Domain Layer                                    │
  │  the actual problem-solving logic. pure.         │
  └──────────────────────────────────────────────────┘
       ▲                                    ▲
       │                                    │
  ┌────┴──────────────────┐    ┌────────────┴─────────┐
  │  Platform Services    │    │  Shared Foundation   │
  │  cross-cutting,       │    │  common components   │
  │  account-scoped,      │    │  and utilities       │
  │  never sees content   │    │                      │
  └───────────────────────┘    └──────────────────────┘
```

### 2.1 Presentation Layer

**Responsibility.** Everything the user sees and operates: the surface of each tool, the shell that
surrounds it, navigation, and the presentation of results, limits, and failures.

**It must.** Render state and capture intent. Present errors in the user's language. Remain fully
operable under the accessibility requirements this product has already committed to.

**It must not.** Contain problem-solving logic. Decide what is valid. Know how any transformation is
performed. If a rule about the user's data lives in this layer, it is in the wrong place — it will
be duplicated, it will drift, and it cannot be verified.

### 2.2 Application Layer

**Responsibility.** Orchestrating one user task from beginning to end. It sequences the tool
lifecycle, holds the transient state of the current session, decides when to advance or stop, and
translates domain outcomes into something the presentation layer can show.

**It must.** Own the flow. Enforce the ordering of the lifecycle stages. Handle cancellation. Ensure
that a failure at any stage leaves the user exactly where they started.

**It must not.** Render anything. Implement transformations. Persist anything beyond the session.
This layer is where a task's *choreography* lives, and nothing else.

### 2.3 Domain Layer

**Responsibility.** The actual work. For each tool, this is the logic that solves its one problem —
the part that has genuine value and the part most worth protecting.

**It must.** Be pure and deterministic: identical input produces identical output, always. Be
completely independent of how it is presented, who is using it, what plan they hold, and whether
they are signed in. Be verifiable in isolation, without a user interface and without any platform
service present.

**It must not.** Know that accounts exist. Know that plans exist. Read preferences. Report
analytics. Touch navigation. Reach for anything outside itself.

**Why this is strict.** The purity of this layer is what makes tools deterministic, testable,
finishable, and cheap to reason about. The moment entitlement or presentation concerns leak into the
domain, a tool's behaviour becomes conditional on context, and every guarantee the product makes
about predictability becomes unverifiable. This is the most important boundary in the system.

### 2.4 Platform Services

**Responsibility.** The cross-cutting concerns shared by every tool: identity, subscription state,
usage limits, preferences, feature availability, navigation, aggregate analytics, and error
reporting.

**It must.** Be usable by the presentation and application layers. Be entirely optional to the
completion of a core task. Be capable of being unavailable without preventing anyone from finishing
what they came to do.

**It must not.** Ever receive, hold, or observe the content of a user's work. This layer is
account-scoped and metadata-scoped only. It may know that a person performed an operation; it must
never know what they performed it on.

Detailed treatment of these responsibilities is in section 4.

### 2.5 Shared Foundation

**Responsibility.** The common material every tool is built from: shared interface components,
shared presentation patterns, and genuinely general-purpose helpers.

**It must.** Be the mechanism by which consistency is achieved rather than merely requested. If
every tool must present results the same way, that sameness lives here, once.

**It must not.** Accumulate anything tool-specific. The moment a shared component acquires a
condition naming a particular tool, it has stopped being shared and has become a hidden coupling
between unrelated things.

### 2.6 The Dependency Rule

Dependencies point in one direction only:

**Presentation → Application → Domain**

The domain depends on nothing. The application layer does not depend on presentation. Nothing
depends upward, and there are no cycles anywhere.

Platform Services and the Shared Foundation may be consumed by the presentation and application
layers. **Neither may be consumed by the domain layer.**

This single rule is what allows any tool's logic to be understood, tested, and trusted on its own.
It is not a guideline. A violation of it is an architectural defect regardless of how convenient the
violation is.

---

## 3. Module Organization

### 3.1 The Tool Module

Every utility exists as one self-contained module. A tool module owns its own slice of the
presentation, application, and domain layers, and everything that is unique to that tool lives
inside its boundary.

The boundary is the unit of everything: understanding, ownership, review, testing, change, failure,
and deletion.

### 3.2 Isolation Is Absolute

**No tool module may depend on another tool module. There is no exception to this.**

If two tools need the same capability, that capability moves down into the Shared Foundation and
both depend on it there. Code is promoted **downward** into shared material; it never travels
**sideways** between tools.

The reason is that sideways dependencies are invisible. A change to one tool silently alters another
that nobody thought to check, and this failure compounds: after a hundred tools, nobody can predict
the consequence of any change. The isolation rule is what keeps the blast radius of a mistake equal
to exactly one tool, permanently.

A tool module may depend only on: the Shared Foundation, Platform Services, and itself.

### 3.3 Adding a Utility

Adding a tool is an additive act. It consists of creating the module and registering it in the
catalogue. **It must not require modifying any existing tool.**

If adding a tool requires touching one that already exists, that is a signal that something
tool-specific has leaked into shared material, and the leak is fixed before the new tool proceeds.

### 3.4 The Catalogue

Tools describe themselves through declared metadata — what the tool is called, what problem it
solves, which phase category it belongs to, what it needs from the environment, and which limits
apply to it. Discovery, navigation, and presentation of the collection are derived from these
declarations.

Nothing that enumerates tools is maintained by hand. A hand-maintained list is a list that will be
wrong, and its wrongness grows with the number of tools.

### 3.5 Deletion Must Be Clean

A tool must be removable by deleting its module and its catalogue entry, leaving no residue
anywhere else in the system.

This is a design test, not a plan to remove tools. If deleting a tool would break something outside
it, the isolation rule has already been violated somewhere and the violation is simply not visible
yet.

### 3.6 Promotion To Shared

Shared material is earned, not anticipated.

A capability moves into the Shared Foundation when a genuine third tool needs it — not the second,
and never the first. Two similar things are a coincidence; three are a pattern.

Premature sharing is more damaging than duplication. A wrong abstraction couples unrelated tools
together, accumulates conditional branches for each caller, and is far harder to unwind than
duplicated code is to consolidate. Duplication is a visible cost. The wrong abstraction is an
invisible one.

---

## 4. Shared Platform Responsibilities

These responsibilities are shared by all tools and belong to Platform Services. What follows is the
boundary of each, not how any of them work.

**Identity.** Establishing who someone is, when they have chosen to be known. Never required to use
a tool. It exists to attach a subscription to a person, and for no other purpose.

**Subscription and entitlement.** Determining what limits currently apply. Entitlement is evaluated
at the boundary of a task and never inside the domain layer — a tool's logic must not know that
plans exist.

**Usage limits.** Tracking and applying the ceilings that distinguish plans. Limits are always
disclosed before a user invests effort, never after. A limit is a property of the platform, never
of the tool's logic.

**User preferences.** Remembering stated choices so they do not have to be restated. Preferences may
influence defaults and presentation. They must never influence a result: the same input produces the
same output regardless of who holds which preferences.

**Navigation and discovery.** The shell surrounding every tool, and the means by which someone finds
the one they need. Derived from the catalogue.

**Analytics.** Aggregate, anonymous understanding of which tools are used and where people
struggle. Never the content of anyone's work — not sampled, not inspected, not for debugging.
Analytics answers *which tool* and *did it succeed*; it must be structurally incapable of answering
*on what*.

**Error handling and reporting.** Consistent presentation of failure to the user, and diagnostics
sufficient to fix defects. A diagnostic must be useful without carrying user content. If it would
only be meaningful with user content attached, it is not collected.

### 4.1 The Two Standing Constraints

**No platform service ever receives user content.** For any tool a browser can perform, the user's
material stays with the user. This is the product's foundational guarantee and the architecture
enforces it structurally: the layer that could transmit is the layer that never holds.

**No platform service sits on the critical path of a core task.** Every one of these must be able to
be slow, degraded, or entirely absent while a person still completes what they came to do. A tool
that cannot finish because a platform service is unavailable is a defect, not a degraded state.

---

## 5. Tool Architecture

Every browser-capable tool follows the same four-stage lifecycle. Not most tools. Every tool.

```
      Input
        │
        ▼
    Validation
        │
        ▼
    Processing
        │
        ▼
      Output
```

Uniformity here is what makes the rest of the architecture possible. It is why a person who has read
one tool has effectively read all of them, why consistency across the collection is achievable
rather than aspirational, and why the hundredth tool costs the same to add as the second.

### 5.1 Input

The user supplies their material and any options the task requires.

- Material is acquired on the device and stays there.
- The most common case requires no configuration; options are genuinely optional.
- Nothing is asked for that is not required to produce the result.
- Nothing begins until the user has indicated they are ready.

### 5.2 Validation

Everything that can be checked is checked **before** any work begins.

- Fail fast and fail early. The user learns a task is impossible before investing in it, never
  after.
- Every constraint that could cause a failure is applied here — supportability, structural
  integrity, and applicable limits.
- Failure at this stage produces a specific, plain-language explanation of what is wrong and what
  to do about it, and leaves the user's material untouched.
- Validation never partially proceeds. Either the task is viable and continues, or it stops
  completely.

### 5.3 Processing

The domain layer performs the actual work.

- Pure and deterministic. The same input yields the same output, on any device, on any day.
- The user's original is never altered. Processing produces something new.
- Interruptible. A user may abandon the task at any point and be left exactly where they started.
- Progress is reported only when work is genuinely occurring. Waiting is never manufactured.
- No inference, estimation, or dependency on any external service to determine the result.
- If an operation is inherently lossy, that was disclosed during validation, not discovered here.

### 5.4 Output

The result is delivered to the user.

- Complete and unmodified. Never watermarked, truncated, or quality-reduced as a sales tactic.
- The user's original remains exactly as they provided it.
- The result belongs to the user, and delivery is under their control.
- Nothing is retained once the session ends. The tool forgets, by design and by default.
- Partial results are never presented as complete ones.

### 5.5 Properties of the Lifecycle

The stages are strictly ordered and independently verifiable. Each has one responsibility, one
failure mode, and one clear boundary with its neighbours.

Failure at any stage returns the user to their starting position with their material intact and an
honest explanation. There is no state in which a tool has done half of something.

---

## 6. Scalability Principles

Scale here means catalogue size and comprehensibility, not traffic. The question this architecture
must answer is: what happens when there are hundreds of tools.

**Constant marginal cost.** The effort, risk, and review burden of adding a tool must not increase
with the number of tools that already exist. This is the primary measure of whether the architecture
is working.

**Uniformity over cleverness.** Every tool has the same shape, the same lifecycle, and the same
boundaries. A hundred predictable tools are navigable; ten individually brilliant and mutually
inconsistent ones are not. Novelty in structure is a cost paid by every future reader.

**Bounded blast radius.** A defect in one tool can affect only that tool. This is a direct
consequence of absolute isolation and is what makes the collection safe to grow.

**The user's cost must not grow with the catalogue.** Someone who opens one tool must not pay — in
time, in what their device must load, or in interface complexity — for the existence of tools they
will never open. A collection that grows must not become slower for the person using one part of it.

**Sub-linear shared growth.** As the tool count rises, the Shared Foundation should grow far more
slowly and eventually stabilise. Shared material that grows in proportion to the tool count is
absorbing tool-specific concerns and is being misused.

**Discovery scales through structure.** Navigation and search derive from declared metadata.
Categories map to the five locked phases and that taxonomy is closed.

**Comprehension in isolation.** Any tool can be fully understood without reading any other tool.
This is what keeps the codebase understandable at any size, and it is the reason the isolation rule
is not negotiable.

---

## 7. Maintainability Principles

These are structural standards. Naming, formatting, and code-level convention are owned by
`coding-standards.md`.

### 7.1 Separation of Concerns

Every unit has one reason to exist and one reason to change. Presentation, orchestration, and
problem-solving are never mixed within a single unit.

*The test:* can you state what this unit is responsible for in one sentence, without using "and"?

### 7.2 Modularity

Boundaries are explicit and enforced. What a module exposes is deliberately chosen and deliberately
small; everything else is internal and may change freely without consulting anyone.

*The test:* can this module be understood, verified, and deleted on its own?

### 7.3 Reusability

Shared material is genuinely general. It is discovered from three real cases, never designed in
advance for imagined ones, and it must not accumulate conditions naming its callers.

*The test:* does this shared thing know anything about who is calling it? If yes, it is not shared —
it is coupled.

### 7.4 Readability

The codebase is optimised for the person who arrives unfamiliar, needs to make one safe change, and
leaves. Structure that requires explanation is a defect in the structure, not a gap in the reader.

*The test:* can someone who has never seen this tool locate the logic that solves its problem within
a minute?

### 7.5 Extensibility

The system is extended by adding, not by modifying. Extension points exist where growth is genuinely
expected — new tools, new shared components — and nowhere else.

*The test:* does the next tool require changing anything that already works?

Extensibility is not generality. Speculative flexibility built for futures that never arrive is one
of the most expensive forms of complexity, and it is explicitly not wanted here.

---

## 8. Architectural Constraints

Permanent rules. These are binding on every current and future tool, and none may be traded away for
convenience or speed of delivery.

1. **Utilities are independent.** No tool module may depend on another tool module, in any
   direction, for any reason.
2. **Shared logic lives in shared modules.** Code is promoted downward into the Shared Foundation.
   It never travels sideways between tools.
3. **Dependencies point one way.** Presentation → Application → Domain. Nothing depends upward.
   There are no cycles.
4. **The domain layer stays pure.** No tool's problem-solving logic may know about accounts, plans,
   preferences, navigation, analytics, or presentation.
5. **Determinism is required.** The same input produces the same output, always. No result depends
   on inference, estimation, or any external service.
6. **User content never crosses the device boundary** for any tool a browser can perform. Server-side
   processing is permitted only where a utility is genuinely impossible in the browser, and only
   with the project owner's explicit approval.
7. **Platform services never touch user content.** They are account-scoped and metadata-scoped, and
   structurally incapable of observing what a user is working on.
8. **No platform service is on the critical path.** Every core task completes with platform services
   degraded or absent.
9. **Entitlement is evaluated at the boundary.** Limits are applied before a task begins, never
   inside the logic that performs it.
10. **Every tool follows the standard lifecycle.** Input, validation, processing, output — in that
    order, without exception.
11. **Adding a tool modifies no existing tool.** If it must, something has leaked and the leak is
    fixed first.
12. **Every tool is cleanly deletable,** leaving no residue elsewhere in the system.
13. **Minimise coupling; make necessary coupling explicit.** Implicit dependencies — shared mutable
    state, hidden ordering requirements, action at a distance — are defects.
14. **Avoid unnecessary dependencies.** Every external dependency is a permanent liability in
    security, performance, and maintenance. The default answer is no.
15. **Prefer composition over duplication — and duplication over the wrong abstraction.** Small
    pieces assembled beat large configurable ones. When the shape is not yet clear, duplicate and
    wait.
16. **Optimise for the device the user actually has.** The user's cost must never grow with the size
    of the catalogue.
17. **A tool may be finished.** Structure must allow a tool to remain untouched for years and still
    be correct, understandable, and safe to change.

---

## Boundaries Of This Document

This document owns logical structure, layering, module boundaries, the tool lifecycle, and the
constraints above.

It does not own technology selection, code convention, visual language, data structure, security
controls, or release process. Those belong to their respective documents, each of which inherits the
constraints stated here and may not contradict them.

Where another document conflicts with this one on a matter of structure, this document is correct
and the other is amended. Where this document conflicts with `vision.md` or `product-principles.md`,
those are correct and this one is amended.

Nothing here changes without explicit instruction from the project owner.
