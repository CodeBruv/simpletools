# SimpleTools — Design System

**Status:** Locked. Changes require explicit instruction from the project owner.

This document defines the permanent design language for SimpleTools. It governs how the interface
looks, how it is laid out, how it behaves, and how it stays coherent as the catalogue grows from a
handful of utilities to hundreds.

Its purpose is not to make an attractive website. Its purpose is to make hundreds of independent
tools feel like one product built by one team with one opinion — so that learning any tool teaches
the user every other tool, and so that the thousandth tool costs no more design effort than the
tenth.

`product-principles.md` establishes the behavioural obligations of every tool and delegates visual
and component-level rules here. `architecture.md` establishes that the presentation layer is a
consumer of shared material and that tool modules are isolated from each other; this document works
within that structure and does not alter it. `coding-standards.md` governs how interface code is
written and delegates the token system and the accessibility conformance target here.

This document defines the system. It does not contain the values. Concrete colour, typography,
spacing, and iconography values, and the components that implement them, are produced by
implementation work under the rules set out here.

This document contains no code, no class names, no colour values, no font names, no icon
selections, no token values, and no mockups.

---

## 1. Design Philosophy

### 1.1 The Problem This System Solves

The product intends to ship a large number of small, unrelated utilities over many years. Every one
of them is built separately, most are finished and never revisited, and a user typically encounters
them one at a time from a search result rather than by browsing.

That creates a specific risk: a collection of tools that are individually reasonable and
collectively incoherent — each one a slightly different product, each requiring the user to
re-orient. A user who arrives at their second SimpleTools page should recognise it instantly, not
evaluate it fresh.

The design system exists to make coherence automatic rather than negotiated. Every rule here is
chosen because it holds at scale, without a design review per tool and without anyone remembering
what the last tool did.

### 1.2 The Interface Is Not The Product

The user did not come to see an interface. They came with a task and want it finished. The interface
is what stands between them and the result, and its job is to be as thin as it can be while still
being obvious.

This is the root of everything else in this document. The design succeeds when the user does not
notice it, and fails the moment it asks for attention it did not need.

### 1.3 Simplicity Over Decoration

Nothing is added for visual interest alone. Every element on a screen earns its place by doing one
of three things: telling the user what this is, letting them act, or telling them what happened.

Anything else — ornament, illustration for its own sake, gradients and shadows applied for texture,
sections that exist to fill space — is removed. Decoration is not neutral: it costs weight, it costs
rendering, it competes for attention with the thing the user actually needs, and it accumulates
faster than anyone removes it.

Restraint is the default state, not a style choice. The product's visual character comes from
discipline, clarity, and generous space, not from applied treatment.

### 1.4 Speed Is A Visual Property

Speed is a stated product requirement, and it is felt visually before it is measured. An interface
is perceived as fast when it appears complete on arrival, does not shift after it lands, responds to
the first interaction immediately, and never makes the user wait to find out whether something
worked.

Consequently, visual complexity is a performance decision. Every heavyweight visual element is a
tax paid by every visitor to every tool. The design does not spend weight on appearance, because
that weight is charged against the thing users actually value.

An interface that arrives instantly and looks plain is correct. An interface that looks refined and
settles into place is a defect.

### 1.5 Familiar Over Novel

Interactions behave the way the user already expects. Buttons look like buttons. Links look like
links and go somewhere. Forms behave like forms. Standard controls are used for standard purposes.

Novelty in a utility has no upside. The user has no interest in learning our interpretation of a
file picker; they have a task. Every invented interaction is a small tax on everybody who encounters
it, paid forever, in exchange for nothing.

Where a convention exists, we follow it. Where conventions conflict, we choose the one most users
will already know, not the one that is most elegant.

### 1.6 Minimal Cognitive Load

At any moment the user should have one obvious thing to do and no unanswered questions about what
will happen when they do it.

- One primary action per screen, unmistakably the primary one.
- Choices are presented only when the user genuinely must choose. Anything with a sensible default
  is defaulted.
- Options that most users never change are not given equal prominence to those they do.
- Nothing is disclosed before it is relevant.
- Language is plain and matches what the user calls the thing.

Every additional element on a screen is a small decision imposed on the user. The count is kept low
deliberately.

### 1.7 The Five-Second Test

**Any screen must communicate its purpose within five seconds to someone who has never seen it, read
nothing about it, and arrived directly from a search result.**

Within that time the user must be able to answer three questions: what is this, what do I do first,
and can I trust it with what I am holding.

This is a hard requirement, not an aspiration. It is checked in review, and a screen that fails it is
redesigned rather than explained. If a screen needs help text to pass, it has already failed —
`product-principles.md` is explicit that help text is a signal to redesign, not a solution to ship.

### 1.8 The System Is A Constraint, Not A Palette

The design system is not a set of materials from which each tool composes its own look. It is a set
of decisions already made, which tools inherit.

A tool does not get to choose its layout, its spacing, its type treatment, its component set, or its
tone. Those questions are already answered. This is what makes the marginal cost of a new tool
approximately zero, and it is what makes two hundred tools feel like one product.

Where a genuine need is not served by the system, the system is extended — once, centrally, for
everyone. It is never worked around locally.

---

## 2. Brand Experience

This section defines how the product should feel. It concerns interface behaviour and presentation
only. Logos, marketing assets, and campaign material are outside this document and outside this
handbook phase.

The intended experience is that of a good hand tool: unremarkable in appearance, immediately
understood, precisely made, and completely dependable.

Six qualities define it. Each is stated with what produces it and what destroys it, because the
failure modes are more actionable than the adjectives.

### 2.1 Calm

**Produced by:** generous space, a quiet visual range, one thing asking for attention at a time,
stillness unless something is genuinely happening.

**Destroyed by:** competing emphasis, motion the user did not initiate, notifications, badges,
countdowns, anything that pulses or attracts the eye without cause.

The user is mid-task and slightly impatient. The interface should lower their pulse rather than
raise it.

### 2.2 Reliable

**Produced by:** the same input producing the same result, every element behaving the way it did
last time, states that are always accurate, errors that explain themselves.

**Destroyed by:** any inconsistency between tools, any operation whose outcome is uncertain, any
message the user cannot act on, any moment where the interface's state does not match reality.

Reliability is felt as an absence of doubt. The user should never need to verify our output.

### 2.3 Fast

**Produced by:** immediate arrival, immediate response to input, honest progress only when work is
occurring, no artificial delay of any kind.

**Destroyed by:** layout that settles after loading, spinners for instant operations, transitions
that gate the next action, anything that manufactures the appearance of effort.

Perceived speed is the product's most visible promise. It is broken by presentation as easily as by
computation.

### 2.4 Professional

**Produced by:** precision, correct alignment, consistent spacing, careful language, complete
handling of edge cases.

**Destroyed by:** playful copy, jokes, mascots, casual error messages, informality where accuracy is
expected, and by small imprecisions — misaligned edges, inconsistent gaps, mixed terminology — which
read as carelessness and undermine trust in the processing itself.

The user is often handling something that matters to them. The interface should look like it was
made by people who take that seriously.

### 2.5 Trustworthy

**Produced by:** stating plainly what happens to the user's material, asking for nothing that is not
required, disclosing limits before work begins, never surprising the user with a cost or a
restriction.

**Destroyed by:** any request for information without an obvious reason, any prompt that appears at
the moment of frustration, any pattern the user recognises from the sites this product exists to
replace.

Trust is the product. It is established in the first five seconds, mostly by what is absent: no
advertising, no account demand, no upload, no interruption.

### 2.6 Lightweight

**Produced by:** few elements, plain presentation, small pages, nothing loaded that is not needed for
what is on screen.

**Destroyed by:** heavy imagery, elaborate visual treatment, and accumulated interface that nobody
removed.

The product should feel like it costs the user nothing to open — no commitment, no weight, no
consequence to closing the tab.

### 2.7 What The Product Must Never Feel Like

Permanently excluded, because each is characteristic of the products SimpleTools exists to replace:

- Commercial. Nothing may resemble advertising, promotion, or a sales surface.
- Urgent. No scarcity, countdowns, or manufactured pressure.
- Playful at the user's expense. No humour in failure states, no cheerful messages about problems.
- Bureaucratic. No process, no steps that exist for our benefit, no confirmation of the obvious.
- Clever. No interface that draws attention to its own design.
- Corporate. No language about journeys, experiences, empowerment, or solutions.

---

## 3. Layout Principles

### 3.1 One Skeleton For The Entire Product

Every page in SimpleTools uses the same structural skeleton. It does not vary by tool, by phase, or
by category. The regions below are the complete set; there is no other region and no per-tool
variation on this structure.

The skeleton is what a returning user recognises before they have read anything. Its stability is
worth more than any local improvement a single tool might gain by deviating.

### 3.2 Regions And Their Responsibilities

**Header.** Identity and orientation. It tells the user where they are and gives them a route to the
catalogue and to search. It is present on every page, is consistent everywhere, and is the same
height everywhere. It carries no tool-specific controls, no promotional content, and nothing that
changes as the user works.

**Main content.** Everything the current page is for. On a tool page this is the workspace. On a
catalogue page this is the listing. It is the only region that varies between page types.

**Tool workspace.** The working area of a tool page, and the reason the user is there. It is
responsible for the entire task and follows the four-stage lifecycle defined in `architecture.md` —
input, validation, processing, output — presented in that order, top to bottom, as a single
continuous flow on one page.

The workspace is the visual and hierarchical centre of the page. It begins in the initial viewport
on every screen size. Nothing is permitted to sit above it that is not required to understand it.
A user must be able to start their task without scrolling and without dismissing anything.

The workspace never becomes a multi-step wizard, never spans multiple pages, and never navigates
away mid-task. Stages appear in place as they become relevant.

**Help section.** Optional supporting content, positioned **after** the workspace and never before
it. It exists for the minority who want context — what the tool does, how it handles unusual cases,
what its limits are, why the file is not uploaded — and for search discoverability, whose strategy is
owned by `seo.md`.

Its position is a hard rule. Help below the tool is available to anyone who wants it. Help above the
tool is an obstacle for everyone, and a tool that requires it has failed the Five-Second Test.
Explanatory content never delays or obscures the task.

**Footer.** Secondary navigation and obligations — catalogue links, legal, contact, account. It is
identical across the product, carries nothing time-sensitive, and is never used to surface anything
the user needs during a task.

### 3.3 Vertical Order Is Fixed

Header, then main content with the workspace at its top, then help, then footer. In that order,
always, on every page and every screen size.

Nothing is inserted between the header and the workspace. This is the single most important layout
rule in the document, because it is the one every commercial competitor breaks.

### 3.4 Space, Rhythm, And Density

- Space is the primary structural device. Grouping is expressed through proximity before it is
  expressed through borders, boxes, or background changes.
- Spacing comes from one fixed scale used across the entire product. Arbitrary values are a defect.
- Related things are close, unrelated things are far apart, and the difference is obvious without
  inspection.
- Vertical rhythm is consistent between tools. Two different tools should have visibly identical
  spacing between comparable elements.
- Content is constrained to a readable measure. Text does not stretch to the width of a large
  display.
- Density is moderate and uniform. No tool is visibly tighter or looser than another.

### 3.5 Hierarchy

Every screen has exactly one clear primary element, and the hierarchy below it is unambiguous.

Hierarchy is created by position, size, and space before it is created by colour or weight, so that
it survives without colour and at any zoom level. If everything is emphasised, nothing is; emphasis
is spent sparingly and deliberately.

### 3.6 What May Never Appear In The Layout

Permanent exclusions, binding on every page:

- Advertising, sponsored content, or any surface resembling either.
- Interstitials, modal interruptions on arrival, tours, or onboarding overlays.
- Consent negotiations for tracking the product does not perform.
- Anything obscuring the workspace or delaying access to it.
- Persistent banners, floating promotional elements, or anything that follows the user down the
  page.
- Cross-selling of other tools inside a workspace during a task.
- Regions that exist to fill space.

---

## 4. Navigation Principles

### 4.1 Most Users Arrive At A Tool, Not At A Home Page

The dominant path into SimpleTools is a search result leading directly to a single tool page. The
user has no context, no history with the product, and no interest in the rest of it until their task
is done.

Navigation is designed for that reality. Every tool page is a complete, self-sufficient entry point
that works for a first-time visitor who will never see any other page.

Discovery of the wider product is offered after the task, never before it, and never as an obstacle.

### 4.2 Discoverability

- A tool page is understandable and usable in isolation, with no prior context.
- The catalogue is reachable from the header of every page, in the same place.
- Related tools may be surfaced after the workspace, presented as availability rather than
  suggestion, and never during a task.
- Surfacing a related tool must never imply a dependency between tools. Each remains independently
  complete, as `architecture.md` requires.
- The catalogue is generated from tool metadata declared by each module. It is never a hand-curated
  list that must be edited when a tool is added — that would make the catalogue a shared file every
  new tool must modify, which violates the isolation the architecture depends on.

### 4.3 Search

Search is the primary means of finding a tool within the product, because at scale browsing stops
working.

- Search is reachable from the header on every page and behaves identically everywhere.
- It searches the tool catalogue. It never searches, indexes, or transmits the user's content — no
  exception, and this is a privacy obligation before it is a design one.
- It matches on the words users actually use, including common alternatives for the same task, not
  only on our official tool names.
- Results state what each tool does, not only its name.
- Empty results are honest: they say plainly that no tool exists for this and do not offer unrelated
  results to appear helpful.
- Search never becomes a general query interface, a command surface, or an assistant.

### 4.4 Categories

- Categories organise the catalogue for browsing. They exist for the user's benefit, not as a mirror
  of the internal roadmap.
- Every tool belongs to exactly one primary category. Multiple homes make the catalogue ambiguous
  and make position meaningless.
- Category names describe the user's task domain in the user's language.
- The set of categories grows only when a genuinely new domain of tools exists, and never as a
  workaround for a category that has become crowded.
- Categories are a navigational aid, never a gate. No tool is reachable only by traversing them.

### 4.5 Breadcrumbs

- Every tool page shows its position in the product's structure, in a consistent place and format.
- Breadcrumbs orient the user and give an unambiguous route upward. They are particularly important
  for the search visitor who has no history to go back to.
- They reflect the catalogue's actual structure. They never show a fabricated path or the user's
  session history.
- They are navigational only. They are not a step indicator and never represent progress through a
  task.

### 4.6 Internal Navigation

- Navigation is consistent in position, wording, and behaviour across the entire product.
- Links go somewhere and look like links. Buttons perform actions and look like buttons. The two are
  never visually interchanged.
- Navigating away is never required to complete a task. A tool is finished on the page it started
  on.
- Navigation never interrupts work in progress. Where leaving would lose work, the user is told
  before it happens, not after.
- The browser's own controls — back, forward, refresh, bookmark, share — behave as the user expects.
  A tool page's address identifies that tool.
- Nothing is hidden behind hover alone, because that excludes touch and keyboard users entirely.

### 4.7 Returning Users

- A returning user finds everything exactly where they left it. Familiarity is the reward for
  returning, and rearranging the interface spends it.
- Return is by preference, never by lock-in. Nothing is retained to make leaving inconvenient.
- Recognition is never assumed. The interface does not change based on whether it believes it has
  seen the user before, and a first-time visitor and a hundredth-time visitor see the same page.
- Any convenience for returning users is additive and silent. It never becomes the only route to an
  action, and its absence never blocks anything.

---

## 5. Component Philosophy

### 5.1 The Component Set Is Closed And Shared

Every interface element in SimpleTools comes from one shared component set. Tools consume
components; they do not create their own versions of solved problems, and they do not restyle shared
components from outside.

This is what makes the system hold at scale. Two hundred tools each making one small local variation
produces two hundred inconsistencies that nobody can ever reconcile.

- Where a tool needs a genuinely different appearance or behaviour, it requests a variant, declared
  once in shared material and available to everyone.
- Components are promoted into the shared set on the third genuine use, per `coding-standards.md`.
  A tool-specific element that only one tool will ever need stays in that tool.
- A shared component never contains a condition naming a particular tool. That is a hidden coupling
  between tools, and it is a defect.
- Accessibility is part of every shared component's contract, delivered by the component rather than
  applied by its callers. This is the only way accessibility survives hundreds of tools.

### 5.2 Every Component Owns All Of Its States

A component is not complete until every state it can occupy is designed: default, hover, focus,
active, disabled, loading, error, empty, and success where applicable.

States are designed with the component, never retrofitted. The overwhelming majority of interface
defects in a product like this are unconsidered states, and they are always discovered by users
rather than by us.

### 5.3 Buttons

- A button performs an action. Something that navigates is a link, not a button, regardless of
  appearance.
- One primary button per screen or per distinct step. If two things are equally primary, the
  hierarchy has not been decided.
- Labels state the action in the user's words. Vague labels such as submit, continue, or OK are
  avoided where a specific verb exists.
- Destructive actions are visually distinct from ordinary ones and are never placed where a
  confirming action is expected.
- A button that has been pressed shows that it was pressed, immediately, and cannot be pressed twice
  by accident.
- Disabled buttons explain why they are disabled. A dead control with no explanation is a defect.

### 5.4 Forms And Inputs

- Every input has a persistent visible label. Placeholder text is not a label; it disappears when
  needed most and is frequently invisible to assistive technology.
- Only what is genuinely required is asked. Optional fields are marked as optional rather than
  required fields being marked as required, because the common case should carry no annotation.
- Requirements are stated before the user enters anything, not revealed by rejection.
- Validation is helpful rather than punitive: it does not interrupt while the user is typing, it
  reports on completion, and it explains what is expected rather than only that something is wrong.
- Errors appear next to the field they concern, with the field's state indicated by more than
  colour.
- Input is never silently transformed, corrected, or reinterpreted. Where the tool changes something,
  it says so.
- Entered work is never discarded by an error, a validation failure, or a navigation the user did not
  intend.

### 5.5 Cards

- A card groups related content into a single scannable unit. It is used for the catalogue and for
  comparable repeated items.
- Cards are not used to compartmentalise a single flow. A workspace divided into boxes reads as
  several unrelated things and adds visual noise without adding structure.
- Cards in a set are uniform. Ragged heights and inconsistent content between comparable cards make
  a listing harder to scan than a plain list.
- If a card is interactive, the entire card is the target, and it is obvious that it is interactive.

### 5.6 Dialogs

- Dialogs interrupt. They are used only for a decision that genuinely cannot proceed without the
  user, and are never used for information the page could simply show.
- No dialog appears unbidden. Every dialog is a direct consequence of an action the user just took.
- Dialogs are never used for promotion, onboarding, or announcements.
- A dialog states the consequence plainly, labels its actions with the specific verbs of the
  consequence, and never relies on generic confirmation labels.
- Dismissal is always available and always obvious, and dismissing is never the destructive choice.
- Focus moves into a dialog on open and returns to where it came from on close. Content behind a
  dialog is inert to keyboard and assistive technology while it is open.

### 5.7 Alerts And Inline Messages

- Messages appear where the thing they concern is, not in a corner of the screen.
- Severity is expressed through more than colour, and severity is honest. Everything cannot be
  urgent.
- Messages that require action persist until it is taken. Messages that merely confirm may fade.
- Nothing important disappears on a timer before it can be read.
- Alerts never carry promotional content.

### 5.8 Progress Indicators

- Progress is shown only when work is genuinely occurring. Manufactured waiting is prohibited by
  `product-principles.md` and is not a design decision available here.
- Instant operations show nothing at all. An indicator that appears and vanishes reads as slowness
  where there was none.
- Where progress is genuinely measurable, it is measured. Where it is not, an indeterminate
  indicator is used honestly rather than a fabricated percentage.
- Progress never moves backwards, and never stalls at completion.
- Long-running work states what is happening and remains cancellable throughout, with cancellation
  leaving the user exactly where they started.

### 5.9 Empty States

An empty state is the first thing a user sees, so it is a design opportunity rather than an
oversight. There is no blank region anywhere in the product.

- An empty state explains what belongs here and how to begin.
- It contains the primary action for getting started.
- It is calm and factual. It does not apologise, celebrate, or attempt humour.
- It distinguishes clearly between nothing yet, nothing found, and nothing available — three
  different situations that require three different responses.

### 5.10 Error States

Error presentation carries more weight than success presentation, because failure is remembered and
success is expected.

- Plain language stating what happened and what the user can do next.
- No technical detail, no internal terminology, no bare codes.
- The tool never blames the user for a case it should have anticipated.
- Errors appear as close as possible to their cause.
- Recovery is always offered where recovery is possible, and the user's material is untouched
  either way.
- Failure is never silent. Silence is the worst available outcome.
- Errors are never dramatised. Alarming presentation of a recoverable problem is itself a defect.

### 5.11 Success States

- Success is confirmed clearly and briefly, and then gets out of the way.
- The result is the emphasis, not the announcement of it.
- The next obvious action is immediately available.
- Success is not celebrated. Completing a small task is expected, and congratulating the user on it
  is condescending.
- Success is never used as an opportunity to sell, prompt, request feedback, or interrupt. The moment
  of completion is precisely where the products this one replaces become manipulative.

---

## 6. Interaction Principles

### 6.1 Feedback

- Every interaction is acknowledged immediately and visibly. The user must never wonder whether
  their input registered.
- Acknowledgement is immediate even when the result is not. The gap between action and response is
  where users click twice.
- Feedback is proportional. A small action gets a small acknowledgement.
- The interface's state always matches reality. A control that appears active but is not is a defect.

### 6.2 Loading

- The interface arrives complete. Content does not appear in stages, and layout does not shift after
  arrival.
- Space for content that is coming is reserved before it arrives, so nothing moves when it does.
- Loading indication for genuinely brief work is omitted; it draws attention to a wait that would
  otherwise pass unnoticed.
- The interface remains responsive during work. A frozen page is a defect regardless of how quickly
  the work completes.
- Loading never blocks the whole page for work affecting only part of it.

### 6.3 Errors

- Errors are surfaced the moment they are known, never after the user has invested further effort.
- Anything predictable is caught during validation, before work begins.
- An error never leaves work in an ambiguous state. Either the task completed or it did not.
- Where the user can fix the problem, the interface says exactly how.
- Errors do not move focus unexpectedly or reset what the user has entered.

### 6.4 Success

- Confirmation is immediate and unambiguous.
- The result is presented, not merely announced.
- Nothing follows a success except the next thing the user might reasonably want.

### 6.5 Animation

Motion is functional only. Its sole purposes are explaining a change of state, maintaining continuity
between two arrangements, and directing attention to something that genuinely changed.

- Motion is never decorative, never introductory, and never a reward.
- Animation never delays an action. The user must be able to proceed through or past any transition
  immediately.
- Duration is short enough not to be waited for. Anything the user perceives as waiting is too long.
- Nothing moves on the page unless the user caused it.
- No animation loops indefinitely, other than an honest indeterminate progress indicator.
- Stated preferences for reduced motion are respected everywhere, and the reduced version is a
  complete experience rather than a degraded one. No meaning is ever carried by motion alone.

### 6.6 Keyboard Accessibility

Full keyboard operability is a requirement of every tool, not a feature of some.

- Every interactive element is reachable and operable by keyboard alone.
- Tab order follows the visual order of the page and matches the task's logical sequence.
- Standard keys behave in the standard way. We do not reinterpret them.
- Focus is never trapped anywhere except an open dialog, where it is deliberate and always
  escapable.
- Focus is managed deliberately across state changes: it moves to newly revealed content, returns to
  its origin when that content closes, and never resets to the top of the page during a task.
- Custom keyboard shortcuts are avoided. Where one exists it is discoverable, never conflicts with
  browser or assistive-technology bindings, and is never the only route to an action.
- Skip navigation is available on every page so that keyboard users are not required to traverse the
  header to reach the workspace.

---

## 7. Responsive Design Principles

### 7.1 Mobile-First, Desktop-Excellent

Layouts are designed for the smallest supported viewport first and enhanced upward. This is not only
an implementation order; it is a design discipline. Designing small first forces the hierarchy to be
decided honestly, because there is no room to avoid the decision.

Enhancement upward is genuine improvement, not stretching. A large display is used to reduce
scrolling, present more context, and give content room — never to spread a small design across a
wide area or to add elements that exist only because there is space.

### 7.2 One Design That Adapts

There is one design per page, which reflows. There are not two designs maintained in parallel.

Parallel designs diverge, double the review burden, and guarantee that one of them will be forgotten
when a tool changes. Where a component must present differently at different sizes, it is one
component with responsive behaviour, not two components chosen by viewport.

### 7.3 Capability Parity Is Absolute

**Every tool is fully functional at every supported viewport size.** No capability, option, or action
is available on one screen size and absent on another.

Mobile is not a degraded mode, a preview, or a promotion for the desktop experience. A user
completing a task on a phone must be able to complete all of it.

What may change across sizes is arrangement, disclosure, and density. What may never change is what
the user can do.

### 7.4 Adaptation Is Driven By Content

Layout changes where the content requires it, not at sizes chosen to match particular devices. Device
dimensions change constantly; the point at which a layout stops working does not.

The number of adaptation points is kept small. Each one is a permutation that must be designed,
built, tested, and reviewed for every tool, forever.

### 7.5 Rules That Hold At Every Size

- The vertical order of regions never changes.
- The workspace is reachable without scrolling past anything, on every size.
- Content constrains to a readable measure rather than filling the available width.
- Text remains legible without zooming, and the layout reflows correctly when text is enlarged —
  content is never clipped, trapped, or truncated.
- Horizontal scrolling of the page is never required.
- Nothing is positioned where a browser's own interface elements are likely to obscure it.
- Interactive targets are comfortably sized and adequately separated on every size, not only where
  space is scarce.

### 7.6 Input Modality

Capability is detected, never inferred from screen size or from the identity of a device or browser.

Both pointer and touch input are supported at every size. Nothing depends on hover, which does not
exist on touch and is unavailable by keyboard. Hover may reveal convenience; it may never be the only
route to information or to an action.

---

## 8. Accessibility Principles

### 8.1 The Conformance Target

**The platform's conformance target is WCAG 2.2 Level AA, applied to every page and every tool.**

`product-principles.md` delegates the specific target to this document and makes meeting it
non-negotiable. This is a floor, not a goal: where doing better is straightforward, we do better.

Accessibility is a requirement of every change, not a phase that follows one. Accessibility defects
are ordinary defects with ordinary priority. Retrofits are expensive, are rarely completed, and are
not the plan.

Conformance is a property of the delivered interface, not of the component set alone. A page composed
entirely of accessible components can still fail on order, focus, structure, or contrast.

### 8.2 Keyboard Navigation

The requirements in section 6.6 are accessibility requirements and are restated here as such: full
operability by keyboard alone, visual tab order, standard key behaviour, no traps outside dialogs,
deliberate focus management, and a skip link to the workspace on every page.

Any element operable by pointer is operable by keyboard. There is no exception.

### 8.3 Screen Readers

- Semantic structure carries meaning. Elements are chosen for what they mean, not for how they look.
  Supplementary accessibility attributes are used only where semantics genuinely cannot express the
  intent, never as a replacement for correct elements.
- Every page has a correct, hierarchical heading structure that describes the page rather than
  styling it. Headings are never chosen for size.
- Regions are identifiable, so that a user can move directly to the workspace.
- Every control has an accessible name that describes what it does. Icon-only controls always carry a
  text equivalent.
- Every form control is programmatically associated with its label, and errors are associated with
  their fields.
- Meaningful images have text equivalents; decorative ones are hidden from assistive technology.
- Changes that matter are announced, not merely rendered — validation results, processing state,
  completion, and errors. Announcements are used for consequence, not for every change, because an
  interface that announces everything is as unusable as one that announces nothing.
- Page titles identify the specific tool, so that tabs and history are distinguishable.

### 8.4 Focus States

- Focus is always visible. There is no state anywhere in the product in which a keyboard user cannot
  see where they are.
- A focus indicator is never removed without an equal or better replacement. Removing it because it
  is visually inconvenient is prohibited.
- The indicator is consistent across the entire product and clearly visible against every surface it
  can appear on.
- Focus indication does not depend on colour alone, and remains visible at high zoom.
- Focused elements are scrolled into view.

### 8.5 Colour And Contrast

- All text and meaningful non-text elements meet the contrast requirements of the conformance target
  — the AA thresholds for text and for user interface components and graphical objects. This applies
  to every state, including disabled controls where they convey information, placeholder text, and
  text over any background.
- **Meaning is never carried by colour alone.** Every state distinguished by colour is also
  distinguished by text, shape, position, or an accompanying indicator. This covers validation
  states, severity, availability, selection, and status of every kind.
- The interface remains fully usable in the absence of colour perception. This is verified, not
  assumed.
- The design does not depend on a single light or dark presentation. Contrast obligations apply
  equally to every presentation the product offers.

### 8.6 Touch Targets

- Interactive targets meet at least the minimum size of the conformance target, and the platform's
  own floor is larger. The specific dimension is recorded with the spacing scale in implementation.
- Targets are adequately separated, so that adjacent actions cannot be triggered by an imprecise
  tap. Separation matters as much as size.
- Destructive actions are never placed adjacent to frequently used ones.
- The target area matches what looks interactive. An area larger than its visual affordance is
  acceptable; smaller is a defect.
- Target sizing applies at every viewport, not only on small screens.

### 8.7 Additional Obligations

- Content reflows correctly at high zoom without loss of content or function, and without requiring
  horizontal scrolling.
- The interface functions with user stylesheets, increased text spacing, and forced-colour modes.
- Nothing depends on a precise gesture, a drag, or a timed interaction where a simple alternative can
  exist.
- Nothing flashes at a rate capable of causing harm.
- Time limits are avoided. Where one is unavoidable, it is disclosed and extendable.
- The interface declares its language.

---

## 9. Visual Consistency Rules

These are the permanent rules that keep the product coherent as it grows toward hundreds of
utilities. They are written to be enforceable by someone who has never seen the rest of the
catalogue, because at scale nobody will have.

Each is binding. Violating one is a defect, not a stylistic disagreement.

**1. One skeleton.** Every page uses the structure in section 3, in the order given, without
exception or per-tool variation.

**2. No tool has a visual identity.** No tool has its own colour, its own type treatment, its own
layout convention, its own iconography, or its own personality. Tools are distinguished by what they
do, never by how they look. A user landing on any tool page must be unable to tell from its
appearance which phase it belongs to or when it was built.

**3. One way to do each thing.** For each interface problem the product solves, there is exactly one
approved solution, and it is used everywhere. A second solution is not an alternative; it is a
defect in the first.

**4. Everything comes from the token system.** Colour, typography, spacing, sizing, radius,
elevation, border treatment, and motion timing are drawn exclusively from fixed, finite scales
defined centrally. Arbitrary or one-off values are prohibited. Where the scale is genuinely
insufficient, the scale is extended centrally for everyone; it is never bypassed locally.

**5. The scales stay small.** Each scale has few enough steps that the difference between adjacent
steps is meaningful and the choice between them is obvious. A scale with many similar options
guarantees inconsistent use, because nobody can choose correctly and everybody chooses differently.

**6. One typographic system.** One family, one fixed size scale, one set of weights, one set of line
heights, used throughout. Type expresses hierarchy, never decoration. Heading levels reflect document
structure and are never chosen for their size.

**7. Colour is functional.** Colour communicates state, hierarchy, and interactivity. It does not
decorate, it does not brand individual tools, and it never carries meaning alone. The palette is
small and every entry has a defined job.

**8. One iconography system.** One coherent set, used consistently, at consistent sizes, with
consistent meaning across the entire product. The same icon never means two things and the same thing
never has two icons. Icons support labels; outside a small set of universally understood controls,
they do not replace them, and an icon-only control always carries a text equivalent.

**9. Identical concepts are identical everywhere.** The same action uses the same word, in the same
place, with the same appearance and the same outcome, in every tool. Synonyms for one concept are a
defect, because the user cannot tell whether the difference is meaningful.

**10. One voice.** Interface copy is plain, direct, consistent in tense and person, and uses the
user's vocabulary rather than ours. Terminology is fixed product-wide.

**11. Shared components only.** Interface elements come from the shared set. Tools do not build local
versions of solved problems and do not override shared appearance from outside. Variants are declared
centrally.

**12. New patterns are centralised or refused.** A tool needing something the system does not provide
either extends the system for everyone or does without. Local invention is prohibited, because it is
invisible to everyone except the person who wrote it and is never reconciled afterwards.

**13. Consistency outranks local improvement.** A change that improves one tool while diverging from
the system is rejected. Improvements are made to the system, applied everywhere, or not made.

**14. Every state is designed.** Default, hover, focus, active, disabled, loading, empty, error, and
success are part of every component's definition, not additions discovered later.

**15. Accessibility conformance is part of the visual definition.** Contrast, focus visibility, and
target sizing are properties of the design, not adjustments applied afterwards.

**16. New tools inherit; they do not decide.** Adding a tool is composing existing components inside
the existing skeleton. If a new tool requires a design decision, that decision belongs to the system
and is made once, centrally.

**17. Deviation escalates.** A genuine need the system cannot meet is raised with the project owner
and resolved by changing the system. It is never resolved locally, and an accepted local exception
never becomes precedent.

**18. The system is subtractive.** Elements, patterns, variants, and scale steps that are no longer
used are removed. An accumulating design system stops being a system and becomes a catalogue of
options, which is the failure state this document exists to prevent.

---

## 10. Design Review Checklist

Every interface change is reviewed against this checklist before approval. It complements the code
review standards in `coding-standards.md`; both apply.

The reviewer checks the delivered result, not the intention. Where a check cannot be answered
confidently, it has not passed.

### 10.1 Blocking Checks

Any of these fails, the change does not ship.

- **Five-Second Test.** Can a first-time visitor tell what this is, what to do first, and whether it
  is safe, within five seconds and without reading help text?
- **Skeleton.** Does the page use the standard structure, in the standard order, with nothing
  inserted between the header and the workspace?
- **Workspace priority.** Can the user begin the task in the initial viewport, on the smallest
  supported size, without scrolling and without dismissing anything?
- **Consistency.** Does every element already exist in the system, used as the system intends? Is
  anything invented locally?
- **Tokens.** Is every colour, type, spacing, sizing, radius, elevation, and timing value drawn from
  the defined scales, with no arbitrary values?
- **Keyboard.** Is every interactive element reachable and operable by keyboard, in visual order,
  with no unintended trap?
- **Focus.** Is focus visible at all times, consistent, and correctly managed across every state
  change?
- **Contrast.** Does everything meet the conformance target in every state and every presentation?
- **Colour independence.** Is any meaning carried by colour alone?
- **Semantics.** Are elements chosen for meaning, is the heading structure correct, does every
  control have an accessible name, and is every input labelled?
- **Touch targets.** Are targets adequately sized and separated at every viewport?
- **Capability parity.** Is the tool fully functional at the smallest supported size, with nothing
  omitted?
- **States.** Are default, hover, focus, active, disabled, loading, empty, error, and success all
  designed and correct?
- **Error quality.** Do errors state what happened and what to do, in plain language, without
  technical detail, near their cause, without discarding the user's work?
- **No manufactured waiting.** Is progress shown only where work genuinely occurs, with no artificial
  delay and no indicator on instant operations?
- **Layout stability.** Does anything shift, resize, or reposition after the page arrives?
- **Motion.** Is all motion functional, uninterruptive, non-blocking, and fully respectful of reduced
  motion preferences?
- **Privacy surface.** Does any part of the interface display, transmit, log, or reflect user content
  anywhere it should not, including in analytics, diagnostics, page titles, and addresses?
- **Nothing prohibited.** Is there any advertising, interstitial, unbidden dialog, promotional
  banner, mid-task upsell, or interruption at the moment of completion?

### 10.2 Ordinary Review

Not automatically blocking, but each requires an answer.

- **Necessity.** Does every element on the screen earn its place? What can be removed?
- **Hierarchy.** Is there exactly one clear primary action, and is the order below it unambiguous?
- **Space.** Is spacing consistent with comparable screens elsewhere in the product, and does
  grouping read correctly by proximity alone?
- **Language.** Is the copy plain, consistent with product terminology, and free of jargon, humour,
  and marketing tone?
- **Labels.** Do action labels state the specific action rather than a generic one?
- **Defaults.** Does the most common case require no configuration?
- **Weight.** What does this add to what every visitor loads, and is it justified?
- **Reuse.** Is this the third occurrence of something that should now be promoted into shared
  material? Is it the first occurrence of something being generalised too early?
- **Recovery.** Can the user cancel, undo, or retreat at every point, with their material untouched?
- **Emptiness.** Is every region that can be empty designed for it?
- **Cross-tool comparison.** Placed beside an unrelated existing tool, does this look and behave like
  the same product?
- **Drift.** Does this normalise a deviation that would be difficult to reverse once other tools copy
  it?

### 10.3 Review Conduct

- Objections cite the rule they rest on. "This violates rule 4" is reviewable; personal preference is
  not.
- Blocking objections are distinguished from suggestions, explicitly.
- Consistency is not a matter of taste and is not negotiated per change.
- Approval is shared responsibility for the result.
- Where a change is genuinely blocked by a limitation of the system itself, that is escalated to the
  project owner rather than resolved with a local exception.

---

## Boundaries And Change Control

This document owns the design language: philosophy, brand experience, layout, navigation, component
expectations, interaction, responsive behaviour, accessibility conformance, visual consistency, and
design review.

It does not own why tools exist (`vision.md`), how tools must behave (`product-principles.md`),
system structure (`architecture.md`), technology selection (`tech-stack.md`), how interface code is
written (`coding-standards.md`), search strategy (`seo.md`), or plan definitions and limits
(`pricing.md`).

It defines the design system. It does not define the values that instantiate it. Concrete colour,
typography, spacing, sizing, iconography, and motion values, and the components implementing them,
are produced by implementation work and are bound by the rules stated here.

Where this document conflicts with `vision.md`, `product-principles.md`, `architecture.md`,
`tech-stack.md`, or `coding-standards.md`, those documents are correct and this one is amended.

Nothing here changes without explicit instruction from the project owner.
