# SimpleTools — Technology Stack

**Status:** Locked. Changes require explicit instruction from the project owner.

This document defines the official technology stack for SimpleTools. Everything listed here is
approved and is the default for the entire platform. Anything not listed here is not approved.

A technology may be introduced only with the explicit approval of the project owner. Absence from
this document is a refusal, not an omission.

This document names technologies and states what each is responsible for. It contains no setup
instructions, no configuration, no installation commands, and no implementation guidance.

Structure is owned by `architecture.md`. Code conventions are owned by `coding-standards.md`. Visual
language is owned by `design-system.md`. Data structure is owned by `database.md`. Privacy controls
are owned by `security.md`. Release process is owned by `deployment.md`. Content strategy is owned by
`seo.md`. Plan definitions are owned by `pricing.md`. This document must not contradict any of them,
and must not contradict `vision.md` or `product-principles.md`.

---

## 1. Technology Selection Philosophy

The stack is chosen to be **boring, durable, and small**. This product intends to be maintained for a
very long time by a small team, and to contain tools that become finished and then stay correct for
years. That ambition is incompatible with a fashionable stack.

Every choice below was made against the following criteria, in this order of priority.

### 1.1 Privacy By Structure

No technology may be adopted that requires user content to leave the device for a browser-capable
utility. Every utility that can reasonably execute inside a modern browser processes user data
locally, and browser-capable utilities never upload user files.

This constraint outranks every other criterion in this document. It is not tradeable, and no
performance, convenience, or capability argument overrides it.

### 1.2 Stability Over Hype

We choose technologies that are already proven at scale and are unlikely to change shape. A
technology's age and dullness are assets here.

New and exciting tools impose a migration cost that is invisible at selection time and enormous three
years later. We are not compensated for being early. If a technology's principal advantage is that it
is new, that is a reason to decline it.

### 1.3 Mature Ecosystems

A large, active ecosystem means the problems we will hit have already been hit, answered, and
indexed. It means hiring is easier, replacement is possible, and we are never the first to encounter
a defect.

### 1.4 Excellent Documentation

Documentation quality is a direct proxy for the maintenance cost we will pay. A technology whose
answers exist only in forum threads and issue comments is a technology that will consume time
indefinitely.

### 1.5 Strong Type Support

Everything in the stack must work well under static typing. Types are how a codebase of hundreds of
small, rarely-visited modules stays safe to change by someone unfamiliar with it. A technology that
resists typing, or whose types are an afterthought, undermines the maintainability the architecture
depends on.

### 1.6 Discoverability As A Requirement

Search is the product's primary acquisition path. A person arrives at a specific tool from a search
result, mid-task, and expects to use it immediately. Technology that makes tool pages hard to index,
slow to first render, or dependent on client execution before content exists is therefore
disqualifying rather than merely inconvenient.

This is why the frontend framework is chosen for its rendering capability first.

### 1.7 Long-Term Maintainability

We prefer technologies that will still be a reasonable choice in five years, and whose exit path is
clear if they are not. Every dependency is a bet on someone else's continued attention.

### 1.8 Small Dependency Footprint

The work happens on the user's device, so every dependency is paid for by the user in load time and
by us in security and maintenance burden. Fewer, larger, well-maintained dependencies are preferred
over many small ones. The default answer to a new dependency is no.

### 1.9 Low Operational Overhead

Because processing happens on the device, the platform is deliberately thin. We choose managed
services over operated ones, and we choose not to run infrastructure wherever that is possible.
Attention spent keeping the platform alive is attention not spent on the tools.

---

## 2. Official Technology Stack

| Concern | Approved Technology |
| --- | --- |
| Language | TypeScript |
| Application framework | Next.js |
| User interface library | React |
| Routing | Next.js — built-in |
| Build tooling | Next.js — built-in |
| Styling | Tailwind CSS |
| Component foundation | shadcn/ui |
| Client data and caching | TanStack Query |
| Form state | React Hook Form |
| Schema validation | Zod |
| Backend platform | Supabase |
| Database | PostgreSQL |
| Authentication | Supabase Auth |
| Payments | Stripe |
| Transactional email | Resend |
| Analytics | Plausible |
| Error monitoring | Sentry |
| DNS, CDN, edge, security | Cloudflare |
| Hosting and deployment | Vercel |
| Package manager | pnpm |
| Version control | Git |
| Code hosting | GitHub |

This table is the whole of the approved stack.

### 2.1 Removed From The Approved Stack

Recorded so the removals are traceable and are not reintroduced by assumption.

**Vite — removed.** Superseded by Next.js, which provides the build tooling and development server.
Retaining a second build system would mean two ways to build the same application.

**Supabase Storage — removed.** The platform does not store user files. For browser-capable
utilities, user content never reaches the platform at all, which leaves object storage with no
approved purpose. Removing it eliminates the possibility by eliminating the capability.

**React Router — removed.** Next.js provides routing. Two routing systems in one application is a
duplicate capability, and duplicate capability is forbidden by section 4.4. Routing, and the mapping
of stable public addresses to tools, is owned by Next.js.

### 2.2 Not Yet Approved: Processing Libraries

The stack above contains **no libraries for performing the actual work of any tool** — nothing for
document manipulation, format conversion, encoding, or parsing.

This is deliberate and is stated so it is not mistaken for an oversight. No processing library is
approved during the handbook phase, and none is selected or recommended here. Those choices will be
made after the engineering handbook is complete and recorded in a dedicated approved-libraries
document.

Until that document exists, no processing library is approved for any phase.

---

## 3. Technology Responsibilities

Each entry states what the technology is responsible for and, where it matters, what it is explicitly
not responsible for. The boundaries are as binding as the choices.

### 3.1 Language And Framework

**TypeScript**
*Responsibility.* The single language of the platform. All application code is written in it, with
types treated as a correctness tool rather than as documentation.
*Boundary.* There is no second language. Escaping the type system is a deliberate, justified
exception, never a convenience.

**Next.js**
*Responsibility.* The application framework. It owns rendering strategy, routing, and build tooling.
Its rendering capability is the reason it was chosen: tool pages must exist as content before any
client execution occurs, so that they are indexable, immediately readable, and fast on arrival.
Static generation is the default for tool pages; server rendering is used where a page genuinely
cannot be static.
*Boundary — this matters more than it appears.* Next.js renders **pages**, never **user content**.
Its server-side capabilities exist for the shell, the catalogue, and platform concerns only. No user
file, and no data derived from one, is ever sent to a server-rendered path, a server action, or any
server-side handler for a browser-capable utility. The framework brings server capability with it;
the presence of that capability is not permission to use it for processing.
*Boundary.* Page delivery may depend on the server. **Task completion may not.** Once a tool page has
loaded, the utility completes entirely on the device, consistent with the architectural rule that no
platform service sits on the critical path of a core task.

**React**
*Responsibility.* The component model for the presentation layer.
*Boundary.* React belongs to the presentation layer only. Domain logic stays pure and
framework-free, so that a tool's problem-solving code has no knowledge of how it is displayed and
remains verifiable on its own. No tool's core logic may require React to run.

### 3.2 Styling And Components

**Tailwind CSS**
*Responsibility.* All styling. The token system defined by `design-system.md` is expressed through
its configuration.
*Boundary.* It is the only styling mechanism. No parallel styling approach is introduced alongside
it, because two styling systems means every contributor must learn both and choose between them
forever.

**shadcn/ui**
*Responsibility.* The starting point for shared interface components.
*Boundary.* These components are copied into the codebase and owned by us — they are source, not a
runtime dependency, and they are not tracked against upstream. Once adapted, a component belongs to
the Shared Foundation described in `architecture.md` and is governed by `design-system.md`. Tool
modules consume shared components; they do not each reach for upstream components independently.

### 3.3 Application Plumbing

**TanStack Query**
*Responsibility.* Fetching, caching, and synchronising **platform data only** — subscription status,
entitlements, usage counters, preferences, and feature availability on the client.
*Boundary.* It has no role whatsoever in the tool lifecycle. User content is never fetched, cached,
or transmitted by it. If this library appears anywhere near the processing stage of a tool, something
has gone badly wrong.

**React Hook Form**
*Responsibility.* Form state for tool options and account screens.
*Boundary.* Form state is presentation-layer state. It never becomes the place where a tool's rules
live.

**Zod**
*Responsibility.* Runtime schema validation and the types derived from it. Used for tool option
validation, platform data boundaries, and anywhere untrusted shape enters the system.
*Boundary.* It validates **shape**. It does not validate **content** — whether a user's file is
structurally sound and processable is domain logic belonging to the tool, per the validation stage
defined in `architecture.md`.

### 3.4 Platform Services

**Supabase**
*Responsibility.* The platform backend, and nothing more. Its responsibilities are limited to:
authentication, user accounts, subscription status, billing metadata, usage tracking, feature flags,
and user preferences.
*Boundary — the most important boundary in the stack.* **Supabase is a platform backend only. It is
not a file-processing backend and never becomes one.** The platform never stores user files for
browser-capable utilities. Supabase may know that a person ran a tool; it must never know what they
ran it on.

**PostgreSQL**
*Responsibility.* The relational store beneath Supabase, holding account, subscription, billing
metadata, usage, feature flag, and preference data.
*Boundary.* It stores platform metadata. It does not store user content, and it does not store
derived data from which user content could be reconstructed or inferred. Table structure and
ownership are governed by `database.md`.

**Supabase Auth**
*Responsibility.* Establishing identity for people who hold, or are purchasing, a Pro subscription.
*Boundary.* Authentication is never required to use a tool. It exists to attach a subscription to a
person, and for no other purpose. Anonymous use is the default path through the entire product, and
no tool may be gated behind sign-in.

### 3.5 Commercial Services

**Stripe**
*Responsibility.* Subscription billing, payment collection, and the source of truth for payment
status.
*Boundary.* Payment credentials are handled entirely by Stripe and never touch our systems. Our
database holds subscription state, not payment instruments. Plan definitions are owned by
`pricing.md`.

**Resend**
*Responsibility.* Transactional email tied to an account: authentication, receipts, subscription
changes, and service notices.
*Boundary.* Transactional only. It is not a marketing channel, and addresses collected for account
purposes are not repurposed. No email address is required to use a tool.

### 3.6 Observability

**Plausible**
*Responsibility.* Aggregate, anonymous understanding of which tools are used and whether they
succeed.
*Boundary.* Chosen specifically because it does not track individuals, requires no consent banner,
and cannot build a profile. It may record that a tool was used; it must remain structurally
incapable of recording what it was used on. No user content, no file names, no input values, ever.

**Sentry**
*Responsibility.* Error and exception reporting sufficient to diagnose and fix defects.
*Boundary.* This carries the highest privacy risk in the stack, because error reporting captures
context by default. Reports must be useful without carrying user content: no file contents, no file
names, no input values, no derived samples. Any diagnostic that would only be meaningful with user
content attached is not collected. The obligation is to configure it into compliance, not to assume
it defaults there.

### 3.7 Delivery

**Cloudflare**
*Responsibility.* DNS, content delivery, edge caching, security, and performance at the network
edge.
*Boundary.* It owns the network layer. It does not host the application and does not process user
content.

**Vercel**
*Responsibility.* Frontend deployments, preview deployments, and production hosting.
*Boundary.* It owns the application runtime and the release surface. It serves pages; it does not
process user content for browser-capable utilities.

The division between these two is deliberate and must stay sharp: **Cloudflare owns the network,
Vercel owns the application.** Neither absorbs the other's responsibility. Release process and the
mechanics of that boundary are owned by `deployment.md`.

### 3.8 Engineering Infrastructure

**pnpm**
*Responsibility.* Package and workspace management for the repository.
*Boundary.* It is the only package manager. A repository with competing lockfiles is a repository
with non-reproducible builds.

**Git and GitHub**
*Responsibility.* Version control, code review, issue tracking, and automation.
*Boundary.* Standard tooling, deliberately unremarkable.

---

## 4. Dependency Policy

Every dependency is a permanent liability: in load time paid by the user, in security exposure, in
upgrade work, and in the risk that its maintainer stops caring. The policy is restrictive by default.

### 4.1 The Default Is No

A new dependency must be justified. The absence of justification is sufficient grounds for refusal.

### 4.2 Order Of Preference

Before adding anything, work through these in order and stop at the first that suffices:

1. A capability the browser already provides natively.
2. A capability already present in the approved stack.
3. Code we write ourselves, where the need is small and well understood.
4. A new dependency.

Most requests are answered at step one or two. Writing fifty lines is frequently better than adopting
a dependency that brings ten thousand.

### 4.3 Evaluation Criteria

A candidate dependency is assessed on:

- **Maintenance.** Recent activity, responsive maintainers, a real release history. An unmaintained
  dependency is a defect we have not discovered yet.
- **Weight.** What it costs the user to load. Weight matters more here than in most products, because
  speed is a stated product principle.
- **Footprint.** Its own dependency tree. A small package that drags in thirty others is not small.
- **Types.** First-class type support, not a community afterthought.
- **Licence.** Compatible and unambiguous.
- **Substitutability.** How hard it would be to remove. A dependency that cannot be replaced is a
  dependency that owns us.
- **Determinism.** For anything in the processing path: identical input must produce identical
  output. Anything relying on inference or a remote service is refused outright.

### 4.4 Standing Rules

- **No duplicate capability.** Two libraries doing the same job is forbidden. If a better option
  appears, it replaces the incumbent everywhere or it is not adopted.
- **No dependency for a trivial capability.** Convenience alone does not justify a permanent
  liability.
- **No dependency that requires transmitting user content.** Non-negotiable, and not subject to
  approval.
- **No dependency that reaches a network during processing.** Tools must complete without one.
- **Shared dependencies live in shared material.** A tool module does not privately adopt a
  dependency for a need the platform already meets.
- **Removal is part of adoption.** A dependency that is no longer used is removed in the same change
  that stops using it.

### 4.5 Approval

Adding a dependency not already in use requires the project owner's explicit approval. Approving one
for one purpose does not approve it for others.

Processing libraries are governed by section 2.2 and are not approved by this policy or by this
document.

---

## 5. Upgrade Policy

Upgrades are maintenance, not progress. They are done deliberately, in small pieces, and on our
schedule rather than the ecosystem's.

### 5.1 Principles

- **Current, not bleeding-edge.** We stay on supported versions. We do not adopt a major release in
  its first months, and we do not let a version fall out of support.
- **Small and separate.** Upgrades are isolated changes, never bundled with feature work. When
  something breaks, the cause must be obvious.
- **Nothing upgrades itself.** Automation may propose an upgrade; a person decides and reviews it.

### 5.2 By Change Type

**Security patches** are applied promptly and take precedence over planned work.

**Patch and minor upgrades** are routine, batched, verified, and applied on a regular cadence.

**Major upgrades** are treated as projects. Each requires a stated reason to move, a reading of the
migration path, an assessment of what breaks, and the project owner's approval. "It is the latest
version" is not a reason.

**Deprecations** are addressed while the old path still works, not after it stops.

### 5.3 Constraints

- An upgrade that degrades performance for users is not an upgrade. It is reverted or deferred.
- An upgrade must never quietly alter the output of a tool. Determinism survives version changes; if
  it cannot, the change is a product decision rather than a maintenance one.
- An upgrade must never weaken the privacy guarantee. A version that introduces transmission,
  telemetry, or remote execution touching user content is not adopted, regardless of what else it
  offers.
- Framework upgrades must preserve the rendering behaviour that tool pages depend on for
  discoverability. A regression there is a product regression.
- shadcn/ui components are owned by us once adapted. Upstream changes are reviewed for ideas, never
  applied wholesale.
- A tool finished years ago must remain buildable and correct after platform upgrades. If an upgrade
  would break finished tools, its cost includes fixing every one of them.

---

## 6. Excluded Technologies

Deliberately excluded. Each is a reasonable technology that is wrong for **this** product. Exclusion
applies for the entire locked roadmap unless the project owner says otherwise.

**Vite and alternative build tooling.** Next.js owns building. A second build system means two ways
to produce the same application and two things to keep working.

**React Router and alternative routers.** Next.js owns routing. Public addresses are the product's
primary acquisition surface, and they must be produced by exactly one system.

**Object storage for user files.** Excluded by product definition. Browser-capable utilities never
upload user files, which leaves no purpose for it. The capability is removed rather than merely
restricted, because a capability that exists will eventually be used.

**Electron and desktop wrappers.** The product is browser-first by definition. A desktop application
means an install, a release channel, an update mechanism, and platform-specific defects — each
contradicting the requirement that a tool be immediately usable by someone who arrives once and never
returns.

**React Native and native mobile applications.** The same reasoning, plus app-store gatekeeping and
review cycles standing between us and our users. The web experience serves mobile.

**Microservices.** The platform is thin and account-scoped. Distributing something this small adds
network boundaries, deployment coordination, and failure modes in exchange for nothing. This is a
filing system with strong rules, not a distributed system.

**Kubernetes and self-managed infrastructure.** Managed services were chosen precisely to avoid
operating anything. Running orchestration would recreate the operational overhead the architecture
exists to avoid.

**Additional frontend frameworks.** One framework, one component model, one styling system. A second
of any doubles what every contributor must know and halves the value of everything shared.

**Alternative state management libraries.** Platform data is handled by TanStack Query, form state by
React Hook Form, and everything else is local. A global state container solves a problem this
architecture is specifically designed not to have.

**Alternative styling approaches.** Tailwind is the styling system. No parallel approach is
introduced beside it.

**Server-side processing of user content.** Excluded as a matter of product definition, not
technology. Permitted only where a utility is genuinely impossible in the browser, and only with the
project owner's explicit approval.

**AI and machine-learning services.** Excluded outright. Every tool must be deterministic, and no
result may depend on inference or on a remote model.

**Alternative analytics, monitoring, payment, or email providers.** One of each. Multiple providers
for the same concern means duplicated data collection, duplicated privacy surface, and no single
source of truth.

**Content management systems.** Content structure is owned by `seo.md`. A separate content system is
an additional dependency, an additional cost, and an additional privacy surface.

**Consent-requiring trackers and advertising technology.** Excluded permanently. Attention is not the
product, and any technology requiring a consent banner has already violated the experience the
product exists to provide.

---

## Boundaries And Change Control

This document owns technology selection and the responsibility boundaries between the technologies
named above.

It does not own structure, code convention, visual language, data structure, security controls,
release process, content strategy, or plan definitions. Each of those documents inherits the
constraints stated here.

Where this document conflicts with `vision.md`, `product-principles.md`, or `architecture.md`, those
documents are correct and this one is amended.

Anything not named in section 2 is not approved. Nothing here changes without explicit instruction
from the project owner.
