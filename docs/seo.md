# SimpleTools — Search And Discoverability

**Status:** Locked. Changes require explicit instruction from the project owner.

This document defines how people find SimpleTools, how the platform is organised so that hundreds of
utilities remain discoverable, and the permanent standards that govern content and page structure.

Search is the product's primary distribution channel. There is no advertising, no sales function, and
no social mechanic in the plan. `vision.md` describes a product that succeeds by being genuinely the
best available answer to a narrow, specific problem, and this document is the discipline that makes
that answer findable by the person who has that problem.

`vision.md` and `product-principles.md` establish what the product is and what it will not do to its
users. `architecture.md` establishes that the catalogue is generated from metadata declared by each
tool module. `design-system.md` owns page structure, navigation surfaces, and the requirement that
every screen communicates its purpose within five seconds. `tech-stack.md` owns the technology.
`security.md` constrains what may execute in a page. This document is bound by all of them.

This document states goals, structure, and standards. It contains no markup, no metadata, no
framework detail, no implementation, and no tactics.

---

## 1. SEO Philosophy

### 1.1 The Product Strategy And The Search Strategy Are The Same Strategy

`vision.md` requires that every tool solve exactly one problem extremely well. A person searching for
help does the same thing from the other direction: they describe one problem, in their own words, and
look for the thing that solves it.

**One tool, one problem. One page, one intent.** These are the same sentence. The discipline that
makes the product good — refusing to bundle, refusing to broaden, refusing feature creep — is also
what makes each page an unambiguous, complete answer to a specific question.

This means discoverability is not a separate workstream layered on top of the product. It is what
happens when the product is built as specified. Nothing in this document asks the product to be
different in order to be found.

### 1.2 We Optimise For The Person, Not For The Mechanism

We do not model, speculate about, or design against the internal mechanics of any search engine.
Those mechanics are outside our knowledge, outside our control, and change without notice. A strategy
built on them is a strategy with an expiry date.

What we design for is the person: someone with a specific job, limited patience, and a reasonable
suspicion of the internet. If a page is the fastest, clearest, most trustworthy way for that person
to finish their task, we have done our part. The rest is technical hygiene — making sure the page can
actually be reached, read, and understood by a machine as well as a human — and that is covered in
section 5.

Where the two ever appear to conflict, the person wins. Every time, without discussion.

### 1.3 Most Users Arrive At A Tool, Not At A Home Page

`design-system.md` states this as a layout fact. It is a strategic fact as well, and it drives most
of this document.

A typical visitor has never heard of SimpleTools. They searched for a specific task, landed directly
on the page that performs it, and are deciding within seconds whether to trust it. They did not pass
through a homepage, did not read an introduction, and have no idea what else exists here.

Consequently:

- **Every page is an entrance.** No page may assume prior context, prior navigation, or prior
  knowledge of the brand.
- **Every tool page must stand entirely alone.** It explains what it does, does it immediately, and
  earns trust without help from anything the user did not see.
- **The homepage is not the main door.** It matters, but it is not where the audience is, and it must
  never be optimised at the expense of the pages where they actually land.
- **Breadth is the growth mechanism.** The product grows by adding more correct answers to more
  specific questions, not by driving more traffic to a small number of pages.

### 1.4 Privacy Is A Genuine Differentiator, Stated Honestly

People actively search for tools that do not upload their files. They are right to. Contracts,
medical records, financial statements, and unreleased work should not be handed to a stranger's
server.

SimpleTools can answer that search truthfully because of how it is built, not because of how it is
described. `architecture.md` guarantees local processing; `security.md` explains why the guarantee
holds structurally.

That advantage is stated plainly and never exaggerated:

- We say what is true: browser-capable utilities process files on the user's device, and those files
  are never transmitted to us.
- We do not imply guarantees the architecture does not provide, and we do not describe a browser-based
  utility in language that suggests more protection than it has.
- Where a capability could not be built locally, that is stated rather than obscured.

`product-principles.md` requires failing honestly. Overstating a privacy claim to win a search is the
same failure as overstating a tool's capability, and it is treated identically.

### 1.5 What Search Visibility Must Never Cost

These are permanent. Traffic is never a reason to violate them.

- **Never the five-second test.** `design-system.md` requires that a page's purpose is obvious
  immediately. Content added for search reasons may never push the tool below the point where a user
  can see and start it.
- **Never speed.** `coding-standards.md` sets performance as a product requirement. Nothing is added
  to a page for discoverability that measurably slows it.
- **Never the user's attention.** No interstitials, no modal prompts before the task, no newsletter
  capture, no consent theatre, no content that exists to keep someone on the page longer than their
  job requires. Getting a user finished and gone quickly is the product working correctly.
- **Never privacy.** `security.md` prohibits third-party scripts with access to a tool page. No
  marketing, attribution, tag-management, or personalisation script is exempt, regardless of what it
  would tell us.
- **Never honesty.** No page claims a capability, a result, or a guarantee that the tool does not
  deliver.
- **Never the catalogue's integrity.** No page exists solely to rank. Every page corresponds to a
  real tool or a real question a real person has.

### 1.6 Tactics Are Not Strategy

The following are prohibited, permanently and without exception: keyword stuffing; pages generated to
capture query variants without a distinct tool or answer behind them; near-duplicate pages
differentiated only by substituted words; text hidden from users but present for machines; reciprocal
or purchased linking arrangements; content produced at volume without review; any practice whose
justification is what a search engine might reward rather than what a user actually needs.

The test is simple and it is applied literally: **if this page were seen only by humans, and never by
a search engine, would we still build it exactly this way?** If the answer is no, it does not ship.

### 1.7 Rankings Are A Lagging Indicator, Not A Target

Position and traffic are observed, not chased. They are the consequence of the work, measured after
the fact, and they are noisy, delayed, and largely outside our control.

No decision in this handbook is made to move a ranking. No page is degraded, padded, or restructured
because a number moved. Where traffic data suggests something, the question asked is always "what is
this telling us about how people describe their problem" — never "how do we recover the number."

Measurement is aggregate and anonymous, under the constraints in `database.md` and `tech-stack.md`.
No visitor is identified, profiled, or followed to produce it.

---

## 2. Information Architecture

### 2.1 The Structure Must Survive Hundreds Of Tools

The organising problem is scale. A dozen tools organise themselves; several hundred do not. The
structure defined here is chosen because it stays comprehensible as the catalogue grows by an order
of magnitude, and because it requires no manual curation to stay correct.

`architecture.md` establishes that each tool module declares its own metadata and that the catalogue
is generated from those declarations. **Every structure in this section is generated from that same
source.** Nothing is hand-maintained, because a hand-maintained index of hundreds of items is an index
that is wrong.

This has a direct consequence: adding a tool automatically places it in its category, adds it to the
catalogue, includes it in navigation and internal links, and makes it discoverable — with no separate
step that can be forgotten. Removing a tool removes all of it. `architecture.md` requires clean
deletability, and the information architecture must not be the thing that breaks it.

### 2.2 Categories

- **Categories exist for users, not for us.** They are named in the language people use to describe
  their own problem, never in internal or organisational terms. A category is not a phase, a team, a
  codebase boundary, or a release.
- **Categories are few and stable.** A small number of broad, obvious groupings is more useful than a
  precise taxonomy nobody can hold in their head. Adding a category is a significant decision, not a
  filing convenience.
- **Every tool belongs to exactly one primary category.** A tool that plausibly belongs to two
  suggests either an unclear category boundary or a tool trying to do two things. Both are resolved
  before the tool ships, not by placing it twice.
- **Categories do not change once published.** A category is part of a page's address and part of how
  people describe where they found something. Reorganising them retroactively breaks links, breaks
  bookmarks, and breaks trust.
- **A category must be able to hold many tools without becoming useless.** If a category would need
  subdivision at fifty tools, it was drawn wrongly at five.
- The categories correspond naturally to the domains in `roadmap.md`, but they are user-facing groupings
  in their own right and are named accordingly.

### 2.3 Tool Organisation

- **A tool's address is a promise.** It is chosen once, describes the task in plain language, and
  does not change. People bookmark it, share it, and link to it. Changing it destroys accumulated
  reputation and breaks somebody's saved link.
- Where an address must change despite this, the old one continues to work permanently and directs to
  the new one. Nothing is ever simply removed and left broken.
- **Addresses are readable by a human.** Someone should be able to look at one and know exactly what
  the page does.
- **The hierarchy is shallow.** Tools sit within their category and no deeper. Deep nesting makes
  pages harder to find, harder to describe, and harder to link to, and it buys nothing.
- **Naming describes the task, not the brand.** Tools are named for what the user wants to accomplish,
  in the words they would use to ask for it. Invented product names for individual utilities are not
  used — they are unsearchable, unmemorable, and serve only us.
- **One tool, one page.** A tool does not have a set of near-identical pages for variations of the
  same job. If a variation is genuinely a different job, it is a different tool with its own page. If
  it is not, it is an option within one tool.

### 2.4 Navigation

`design-system.md` owns how navigation looks and where it sits. This section governs what it must
connect.

- **From any tool page, a user must be able to reach the category it belongs to and the full
  catalogue.** Someone who arrived from a search result and found what they needed should be able to
  discover that there is more here, without effort and without being pushed.
- **Navigation is generated, never curated.** It derives from declared tool metadata, so it cannot
  drift out of date, cannot omit a new tool, and cannot retain a removed one.
- **Navigation is quiet.** It is available to someone looking for it and invisible to someone who is
  not. A visitor who came to do one task and leave must never be obstructed, prompted, or
  redirected.
- **Search across the catalogue is a first-class way to move.** With hundreds of tools, browsing
  stops scaling long before search does. Search must handle the words people actually use, including
  the name of the format, the task, and the problem — not only exact tool names.
- **Discovery happens after completion, never before.** `design-system.md` fixes the vertical order
  of the page; suggestions of other tools sit below the finished work. Nothing about other tools may
  appear between a user and the task they came to do.

### 2.5 Internal Linking

- **A link exists because it helps this reader now.** That is the only justification. Links placed to
  distribute authority around the site, rather than to help someone, are prohibited under section
  1.6.
- **Linking is generated and bounded.** Relationships between tools are declared as metadata and
  rendered consistently, so linking scales without manual work and without becoming noise.
- **No exhaustive link dumps.** A footer or sidebar listing every tool in the catalogue is useless to
  a human at any real scale, and it exists only for machines. The full catalogue is one page, reached
  by one link.
- **Link text describes the destination.** It says what the user will get, not "click here" and not
  the raw address. This is also an accessibility requirement under section 4.5.
- **Links between tools respect module isolation.** A link is a reference to another page; it never
  implies a runtime dependency between tool modules, which `architecture.md` prohibits absolutely.
- **Every page is reachable.** No tool exists that can only be found through search. If the generated
  structure cannot reach a page, that is a defect in the structure.

### 2.6 Related Tools

- **Relatedness means "plausibly the user's next step," not "shares a keyword."** The useful
  relationship is the one that anticipates what the person will need after they finish, or offers the
  right tool if they landed on the wrong one.
- **A small, deliberate set.** A handful of genuinely relevant suggestions is useful; a long list is
  a list nobody reads.
- **Positioned after the work, always.** Per section 2.4 and `design-system.md`, suggestions never
  precede or interrupt the task.
- **Presented as help, not as promotion.** Related tools are offered plainly, without urgency,
  persuasion, or upsell.
- **Relationships are declared, not inferred from behaviour.** They come from tool metadata, which
  means they are deliberate, reviewable, and require no observation of what users do — consistent
  with `database.md`, which prohibits behavioural profiling.

### 2.7 Breadcrumbs

- Breadcrumbs exist because most visitors arrive mid-structure with no idea where they are. They
  answer "where am I and what else is around here" in a single glance.
- **Breadcrumbs reflect the real hierarchy** and match the page's address exactly. A trail that
  claims a structure the site does not have is worse than none.
- **One path per page.** A page reachable several ways still has exactly one canonical location, and
  the trail shows that one.
- Breadcrumbs are consistent everywhere they appear, on every page type, without exception.
- Their appearance and placement are owned by `design-system.md`.

---

## 3. Page Strategy

Every page type below has one job. A page that cannot state its job in a sentence should not exist.

### 3.1 The Homepage

**Job:** explain what SimpleTools is to someone who arrived deliberately, establish that it is
trustworthy, and route them onward quickly.

- It is not the primary entrance and is not optimised as though it were. Most visitors will never see
  it.
- It states plainly what the product does and how it treats the user's files. For a first-time
  visitor, that second point is the one that decides whether they stay.
- It routes to categories and to search. It does not attempt to present the full catalogue.
- **It is not a marketing page.** No hero claims, no testimonials, no urgency, no persuasion
  architecture. `design-system.md` prohibits the product feeling commercial, and the homepage is
  where that pressure will be strongest.
- It does not chase broad, generic queries. Competing for the widest possible term is a strategy for
  a different kind of company, and losing it slowly would cost effort that belongs on tool pages.
- It must be fast and complete on first load, like every other page.

### 3.2 Category Pages

**Job:** help someone who knows the general area but not which specific tool they need.

- A category page is not a list of links with a heading. Its value is in helping the reader decide,
  and a page that only enumerates does not do that.
- It states, briefly, what each tool in the category is for, so the choice can be made without
  visiting several pages.
- It answers the questions common to the whole category once, rather than repeating them on every
  tool page.
- It is generated from declared metadata, so it is always complete and never stale.
- It orders its contents helpfully — by what people most often need, not alphabetically by accident.
- It scales: a category with many tools must remain scannable, which is a constraint on how
  categories are drawn (section 2.2) as much as on the page itself.

### 3.3 Tool Pages

**Job:** let the user complete one specific task immediately, and demonstrate in seconds that doing
so is safe.

These are the most important pages in the product. Everything else exists to support them.

- **The tool is the content.** The working utility appears immediately, ready to use, above anything
  written about it. A visitor should be able to start their task without scrolling and without
  reading.
- **One page, one intent.** The page corresponds to exactly one job, described the way the user would
  describe it.
- **It is self-explanatory.** It says what it does in plain language, in one line, before anything
  else. `design-system.md` makes this a reviewable requirement.
- **It answers the trust question early.** Where processing happens locally, that is stated near the
  top, briefly and without ceremony, because it is the single fact that decides whether a stranger
  proceeds.
- **Supporting content sits below the work.** Explanation, format notes, limitations, and common
  questions come after the tool, in the fixed page order `design-system.md` defines. They are there
  for the person who needs them and invisible to the person who does not.
- **Supporting content is genuinely specific to that tool.** Generic paragraphs repeated across many
  pages with a word swapped are prohibited under section 4.2.
- **Limitations are stated honestly**, including what the tool deliberately does not do.
  `product-principles.md` requires this, and a user who discovers a limitation after uploading their
  attention has been failed.
- A page must load and be usable regardless of anything else on the platform. `architecture.md`
  guarantees this and search reinforces it: an entrance that depends on the rest of the site is not
  an entrance.

### 3.4 Documentation Pages

**Job:** answer, in depth, how something works, for the reader who wants to understand before they
trust.

- Documentation explains behaviour: what a tool does, what it supports, what it does not, how the
  platform handles files, what happens to data, what the plans include.
- It is written for a curious individual, not for an implementer or an administrator. `vision.md`
  excludes organisational and technical-integration audiences.
- It is the correct home for detail that would clutter a tool page — supported formats, edge-case
  behaviour, precise wording of a guarantee.
- **It is kept true.** Stale documentation is a form of dishonesty, and a page that describes
  behaviour the product no longer has is a defect. Documentation is updated in the same change as the
  behaviour it describes.
- It is linked from where the question arises, not filed somewhere and forgotten.
- Documentation is not a keyword surface. Its length is determined by what needs explaining.

### 3.5 Help Pages

**Job:** answer the question a person actually typed, when the answer is not simply "use this tool."

- Help content is task-shaped: it addresses "how do I..." and "why did..." questions in the reader's
  words.
- **It answers first.** The answer appears at the top; context follows. A reader who found it through
  search wants the resolution, not an introduction.
- Where the answer is a tool, help links directly to it — but the help page exists only if the
  question genuinely needs explaining beyond the tool page itself.
- **Help pages are not created to occupy queries.** One page per real question. A question nobody
  asks does not get a page, and a question already answered on a tool page does not get a duplicate.
- Help content is reviewed against reality on the same terms as documentation.

### 3.6 Rules Applying To Every Page

- Every page states its purpose in its first line of content.
- Every page is complete on arrival — no prior context, no prior navigation, no assumed knowledge.
- Every page has exactly one canonical address.
- Every page is reachable through the generated structure.
- No page exists whose only justification is search visibility.
- No page carries anything that interrupts, delays, or obstructs the reason the user came.

---

## 4. Content Principles

### 4.1 Helpful Content

- **Content earns its place by answering a question the reader has at that moment.** Text that exists
  to add length, cover a term, or fill a template is removed.
- Written for someone in the middle of a task, not for someone reading for pleasure. They are busy,
  they have a file open, and they want to finish.
- **The shortest version that fully answers is the correct version.** `design-system.md` describes
  the system as subtractive; the same applies to words.
- Content anticipates the genuine questions — can I trust this, what does it support, what will the
  result look like, what if it fails — and answers them where they arise.
- Content is never persuasive. It informs a decision; it does not push one.
- Content does not sell. Plan differences are stated factually where they are relevant, per
  `pricing.md`, and nowhere else.

### 4.2 Originality

- **Everything is written specifically for the page it appears on**, by someone who understands what
  that tool actually does.
- **Templated content is the defining failure mode at this scale**, and it is prohibited. Producing
  hundreds of pages from one paragraph with substituted nouns creates hundreds of pages that are
  individually worthless. If the only difference between two pages is a word, one of them should not
  exist.
- Content generated at volume without review does not ship. `coding-standards.md` names fluency as
  the specific risk of AI-assisted work: text that reads correctly while saying nothing true. That
  risk is higher in prose than in code, because nothing fails visibly.
- Content is not copied, paraphrased, or assembled from elsewhere.
- Where two tools genuinely share an explanation, it is written once in the place that owns it and
  linked, rather than restated. This is the same rule `architecture.md` applies to code.

### 4.3 User Intent

Every page serves one of a small number of intents, and its content is shaped by which:

- **Do the task now.** The overwhelming majority. The tool is present, obvious, and immediately
  usable. Words are minimal.
- **Decide whether to trust this.** Answered early, briefly, factually: what happens to the file,
  where processing occurs, what is stored.
- **Choose between options.** Served by category pages and by clear, distinguishing descriptions.
- **Understand how something works.** Served by documentation and help, in depth, after the reader
  has chosen to go there.

A page that tries to serve every intent at once serves none of them. Where a page's content and its
intent do not match — an explanatory essay wrapped around a tool someone wanted to use immediately —
the content is wrong, not the intent.

### 4.4 Readability

- **Plain English.** Short sentences. Ordinary words. No jargon where a common word exists, and no
  term used without explanation where one is unavoidable.
- Written to be understood by a competent adult who is not a specialist and who may not be reading in
  their first language. Section 6 depends on this being true from the start.
- Structured for scanning: meaningful headings, short paragraphs, lists where a list is genuinely
  clearer.
- **Headings describe content, not decorate it.** They form the document's structure and are used in
  order.
- No marketing register: no exclamation, no superlatives, no urgency, no invented statistics. This
  matches the voice `design-system.md` requires of the interface.
- Numbers, claims, and capabilities are stated only when true and verifiable.

### 4.5 Accessibility

Accessible content is discoverable content. The same properties that let a screen reader convey a
page let any non-visual consumer understand it, and `design-system.md` already requires WCAG 2.2
Level AA. Content obligations specifically:

- Heading structure is real and hierarchical, used for meaning rather than appearance.
- **Link text is meaningful in isolation.** A link read out of context must still describe where it
  goes.
- Images that carry meaning are described in text; images that are decorative are marked as such.
  Meaning is never carried by an image alone.
- No information is conveyed by colour, position, or visual styling alone.
- Language is declared, and content is written in the language it declares.
- Text is text. Words that matter are never baked into images — this also makes section 6 possible.
- Content remains readable when zoomed, reflowed, or rendered at a different size.

---

## 5. Technical SEO Goals

Goals only. Mechanisms, formats, configuration, and framework behaviour are implementation, governed
by `tech-stack.md` and `deployment.md`.

### 5.1 Content Is Present In What The Server Delivers

The meaningful content of every public page — its purpose, its explanation, its structure, its links
— is present in what the server sends, not assembled afterwards by the browser.

`architecture.md` fixes the boundary and it is worth restating precisely: **page delivery may depend
on the server; task completion may not.** Delivering a fully-formed page is exactly what the server
is for. Performing the user's work is not.

### 5.2 Every Public Page Is Reachable And Indexable By Default

- Public pages are open to being found. Nothing that should be discoverable requires an account,
  interaction, or client-side execution to be seen.
- Anything that should not be indexed — account areas, transactional pages, anything specific to a
  single user — is excluded deliberately and explicitly.
- **No user content is ever indexable, because no user content ever exists on a server.**
  `security.md` and `database.md` guarantee this structurally; there is no accidental exposure path
  because there is nothing to expose.

### 5.3 One Canonical Address Per Page

- Each page has exactly one authoritative address, and every alternative route to it points there.
- Addresses are stable for the life of the page.
- Where an address must change, the previous one continues to resolve permanently to the new one.
- Two pages never compete to answer the same intent. Where near-duplication appears, it is a
  structural error to be corrected, not a coverage strategy.

### 5.4 The Machine-Readable Structure Is Generated From The Same Source As The Human One

- The set of canonical pages is published in machine-readable form, generated from the declared tool
  metadata that already drives the catalogue.
- Because there is one source, the two cannot drift apart. A published index maintained separately
  from the catalogue is guaranteed to be wrong eventually.
- A page's purpose, category, and relationships are describable to a machine as accurately as to a
  person, and the description always matches what the page actually contains. Describing a page as
  something it is not is prohibited under section 1.6.

### 5.5 Speed Is A Discoverability Requirement, Not Only A Product One

- Pages are fast on first load, on ordinary devices and ordinary connections. `coding-standards.md`
  sets the governing constraint: a user who opens one tool must not pay for tools they never open.
- The visible, usable content of a page arrives quickly, and the page does not move, reflow, or
  reorganise itself after the user has started reading.
- Nothing is added to a page for discoverability that measurably slows it. That trade is never
  available.
- Delivery is cached at the network edge under the responsibilities set in `tech-stack.md`. Caching
  serves pages; it never touches user work, which does not leave the device.

### 5.6 Mobile And Desktop Are The Same Product

`design-system.md` requires absolute capability parity. Discoverability inherits it: the content, the
structure, the links, and the tool itself are identical on every device. There is no reduced mobile
version, no separate address, and no content withheld on small screens.

### 5.7 Nothing Third-Party Runs In A Tool Page

`security.md` prohibits third-party scripts with access to a tool page. This applies without
exception to anything motivated by marketing, attribution, personalisation, or tag management,
regardless of what insight it would provide.

The consequence is accepted deliberately: we will know less about our visitors than a
conventionally-instrumented product does. That is the correct trade, and it is the same trade
`vision.md` makes everywhere else.

### 5.8 Failures Are Honest And Correct

- A page that does not exist says so clearly and helps the reader get somewhere useful.
- A page that has moved directs permanently to where it went.
- Errors are never disguised as content, and a broken page never returns something that looks
  successful.
- `design-system.md` owns how these pages look; the requirement that they behave correctly is
  permanent.

### 5.9 Structural Correctness Is Verified, Not Assumed

Reachability, canonical uniqueness, index-state correctness, and the accuracy of the generated
structure are checked as part of ordinary review, per section 7. These properties fail silently — a
page can be unreachable or wrongly excluded for months with no visible symptom — which is exactly why
they are checked rather than trusted.

---

## 6. International Growth

### 6.1 Current Position

**SimpleTools is English-only, and internationalisation is not a current requirement.** `vision.md`
sets a Tier 1, English-first audience, and `roadmap.md` is permanently fixed at five phases, none of
which is localisation.

This section does not add work, does not create a commitment, and does not imply a timeline. It
exists so that when the decision is eventually taken, it is a decision about translation rather than
a rebuild.

### 6.2 The Obligation Now Is Only To Avoid Barriers

The whole of the present requirement is: **do not build things that would have to be undone.** Each
item below costs nothing today and would cost a great deal to retrofit across hundreds of pages.

- **Text is never baked into images.** Words that matter exist as text. This is already required by
  section 4.5.
- **Layout tolerates text of different lengths.** The same phrase can be substantially longer or
  shorter in another language, and a layout that only works at English lengths breaks silently.
  `design-system.md` requires content-driven adaptation, which produces this for free.
- **Sentences are never assembled from fragments.** Concatenating pieces with values inserted between
  them assumes English word order and English grammar. Meaningful units of text stay whole.
- **Formatting is not assumed.** Dates, numbers, units, and sizes are formatted according to a
  locale rather than hard-coded to one convention.
- **The address structure can accommodate a language without disturbing existing addresses.** Section
  5.3 makes stability a promise; adding a language must not break it.
- **Content is written plainly**, per section 4.4. Plain English translates cleanly; idiom, wordplay,
  and cultural reference do not.
- Where a tool's behaviour depends on language or character handling, that is a property of the tool
  and belongs in its domain logic, unaffected by which language the interface is in.

### 6.3 Standards For When A Language Is Added

- **A language is added because there is evidence people need it**, not because more languages seems
  better. Each one is a permanent maintenance obligation across every page.
- **A language is complete or it is absent.** A partially translated experience — interface in one
  language, help in another, errors in a third — is worse than a consistent English one, because it
  breaks trust at the moment something goes wrong.
- **Machine translation is not published unreviewed.** Section 4.2 requires content written by
  someone who understands it; a translation nobody competent has read is exactly the templated
  worthlessness that section prohibits.
- **Each language has its own canonical addresses**, and the relationship between equivalent pages is
  declared explicitly. Section 5.3 applies per language.
- **Language is never guessed and never forced.** No visitor is redirected based on their location or
  connection. The choice is offered, respected, and remembered as a preference, per `database.md`.
- **Localisation is more than translation.** Examples, formats, units, and terminology are adapted to
  be genuinely natural, not transliterated.
- Adding a language changes nothing structural. It uses the same generated catalogue, the same
  metadata, and the same page types, or it has been done wrongly.

### 6.4 What Internationalisation Never Becomes

- It never becomes a mechanism for generating pages to occupy more queries. Prohibited under section
  1.6.
- It never produces machine-translated pages at volume.
- It never fragments the product into differently-capable regional versions. Capability parity
  applies across languages exactly as it applies across devices.
- It never changes the roadmap, and it never justifies adding data about users to support it beyond a
  stated preference.

---

## 7. SEO Review Checklist

Applied to any change that adds or alters a public page, its content, or the structure connecting
pages. It sits alongside the checklists in `coding-standards.md`, `design-system.md`, and
`security.md`, and does not replace any of them.

### 7.1 Blocking Checks

Any of these fails, the change does not ship.

- **Reason to exist.** Does this page correspond to a real tool or a real question a real person has?
  Would we build it exactly this way if no search engine existed?
- **One intent.** Does the page serve exactly one intent, stated in its first line?
- **The tool comes first.** On a tool page, is the working utility immediately visible and usable
  without scrolling or reading? Has content added for any reason pushed it down?
- **Five-second test.** Is the page's purpose obvious within five seconds, per `design-system.md`?
- **Standalone entrance.** Does the page work completely for someone who arrived from a search result
  with no prior context?
- **Honesty.** Does every claim about capability, privacy, local processing, or results match what the
  product actually does? Is any limitation concealed?
- **Originality.** Is this content written specifically for this page? Is it a template with
  substituted words? Was it generated at volume without review?
- **No duplication.** Does another page already answer this intent? Does this create near-duplicate
  pages differentiated only by wording?
- **Canonical address.** Does the page have exactly one authoritative address? Is it readable,
  descriptive, and stable?
- **Nothing breaks.** If an address changed, does the old one still resolve permanently to the new
  one?
- **Reachable.** Is the page reachable through the generated structure, not only through search?
- **Generated, not curated.** Do the catalogue, navigation, category listing, and machine-readable
  index all derive from declared tool metadata rather than a hand-maintained list?
- **Server-delivered content.** Is the page's meaningful content present in what the server sends?
- **No user content exposed.** Does anything indexable contain, reference, or derive from user
  content? Does the page create any path by which user content could reach a server?
- **No third-party scripts.** Does this add anything third-party to a page, for any
  marketing, attribution, or measurement purpose?
- **Speed.** Does anything added here measurably slow the page?
- **No obstruction.** Does anything interrupt, delay, gate, or distract from the task — interstitial,
  modal, prompt, capture, or promotion placed before the work?
- **Order preserved.** Do related tools, suggestions, and supporting content sit after the workspace,
  per `design-system.md`?
- **Accessibility.** Real heading structure, meaningful link text, described images, no
  meaning carried by colour or image alone?
- **No prohibited tactics.** Anything from section 1.6 present in any form?

### 7.2 Ordinary Review

Not automatically blocking, but each requires an answer.

- **Length.** Is this the shortest version that fully answers? What could be removed without loss?
- **Language.** Plain, specific, free of jargon, marketing register, superlatives, and invented
  numbers?
- **Naming.** Does the tool's name describe the task in the user's words rather than a brand?
- **Category fit.** Does it sit in exactly one obvious category? Does that category still hold
  together with this addition?
- **Related tools.** Are the suggestions genuinely a plausible next step, declared rather than
  inferred, and few enough to read?
- **Breadcrumbs.** Do they reflect the real hierarchy and match the address?
- **Trust answered early.** Is the local-processing fact stated near the top, briefly?
- **Documentation currency.** Does any existing documentation or help page now describe behaviour
  that changed?
- **Localisation readiness.** Text baked into an image? Sentences assembled from fragments? Layout
  that assumes English length? Hard-coded formatting?
- **Internal links.** Does each one help this reader now?
- **Scale.** Does this structure still work at ten times the number of tools?

### 7.3 Review Conduct

- Objections cite the principle and the reader affected, not a preference about wording.
- A reviewer who cannot state what job a page does cannot approve it.
- "It might help us rank" is not an argument and does not answer any check above.
- Where a genuine conflict arises between discoverability and any principle in `vision.md`,
  `product-principles.md`, or `design-system.md`, the change stops and escalates to the project
  owner. It is never resolved locally in favour of traffic.

---

## 8. Out Of Scope

### 8.1 What This Document Does Not Define

- **Implementation.** No markup, no metadata fields or examples, no structured-data formats, no
  framework behaviour, no routing detail, no configuration, and no code.
- **Search engine mechanics.** No discussion of ranking factors, algorithm behaviour, or how any
  specific search engine works internally. Section 1.2 explains why: it is unknowable, unstable, and
  irrelevant to how the product should be built.
- **Tactics.** No techniques whose purpose is to influence a machine rather than serve a person.
  Section 1.6 prohibits them outright rather than leaving them undocumented.
- **Paid acquisition.** No advertising, sponsorship, paid placement, or promotional spend. These are
  not part of the strategy and are not planned.
- **Link acquisition programmes.** No outreach, exchange, guest-posting, or directory schemes. Links
  are earned by the pages being worth linking to, or they are not wanted.
- **Editorial programmes.** No content calendar, publishing cadence, or blog. If a written piece is
  ever genuinely useful, it is documentation or help, and section 3 governs it.
- **Ranking targets and traffic goals.** No numbers are set here. Section 1.7 explains why they are
  observed rather than pursued, and inventing targets would immediately corrupt the checklist in
  section 7.

### 8.2 Where Related Concerns Live

`vision.md` owns the audience and the product's purpose. `product-principles.md` owns the principles
this document defers to. `architecture.md` owns the catalogue, declared tool metadata, and module
isolation. `design-system.md` owns page structure, navigation surfaces, layout order, voice, and
accessibility conformance. `roadmap.md` owns which tools exist and when. `pricing.md` owns how plans
are described. `tech-stack.md` owns technology, hosting, and caching responsibilities.
`security.md` owns what may execute in a page. `deployment.md` owns delivery and environments.

---

## Boundaries And Change Control

This document owns the discoverability philosophy, information architecture, page strategy, content
standards, technical goals for search, the position on international growth, and the review checklist
that enforces them.

Where this document conflicts with `vision.md`, `product-principles.md`, `architecture.md`,
`tech-stack.md`, `coding-standards.md`, `design-system.md`, `database.md`, or `security.md`, those
documents are correct and this one is amended.

Sections 1.5, 1.6, and 5.7 restate guarantees made elsewhere in the handbook. They are not relaxable
by review, by campaign, by experiment, or by evidence that relaxing them would increase traffic.

Nothing here changes without explicit instruction from the project owner.
