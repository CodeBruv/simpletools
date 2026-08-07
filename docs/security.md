# SimpleTools — Security

**Status:** Locked. Changes require explicit instruction from the project owner.

This document defines the permanent security philosophy of SimpleTools: what is being protected,
from whom, what the platform guarantees, and the standards every change is held to.

Security here is not a layer applied over the product. It is a consequence of how the product is
built. Browser-capable utilities process user files entirely on the user's own device, those files
are never transmitted to platform services, and the platform stores only the minimum required to
operate accounts and subscriptions. Everything below either preserves that arrangement or protects
the small amount of data that remains.

`architecture.md` establishes the constraints this document enforces — user content never crosses the
device boundary, no platform service ever receives user content, and no platform service sits on the
critical path of a core task. `database.md` establishes what may be stored and states the security
goals of the data layer; this document owns the controls that achieve them. `tech-stack.md` owns the
technology and the dependency policy. `coding-standards.md` owns how secure code is written and
reviewed.

This document states goals and standards. It contains no configuration, no headers, no policies
expressed as settings, no algorithms, no infrastructure, and no code.

---

## 1. Security Philosophy

### 1.1 Security Exists To Protect Users, Not To Protect Us From Users

The person on the other side of the screen is handling something they care about — a contract, an
invoice, a medical record, unreleased work. They arrived from a search result, they have no
relationship with us, and they are deciding in the first few seconds whether to hand it over.

Security's job is to make that decision correct. Every control in this document exists so that the
answer to "what could go wrong for this person" is as close to nothing as the design can make it.

Controls that protect the business at the user's expense — surveillance framed as fraud prevention,
identification framed as abuse control, retention framed as diligence — are not security. They are
the thing security is protecting people from.

### 1.2 Structure Before Controls

`product-principles.md` states that privacy is achieved by ensuring there is nothing to expose, not
by promising to behave well with what is collected. The same reasoning governs security.

**A control can be misconfigured. Absence cannot.** The strongest protection over a user's document
is that it was never transmitted, never stored, and never present in any system we operate. No access
policy, encryption scheme, or monitoring regime is equivalent, because all of them can fail and
absence cannot.

The order of preference is fixed:

1. **Eliminate.** Do not collect it, do not transmit it, do not store it.
2. **Constrain.** Where something must exist, minimise it, scope it, and bound its lifetime.
3. **Control.** Protect what remains with deliberate, reviewable mechanisms.
4. **Detect.** Record enough to know what happened afterwards.

A proposal that reaches step three without seriously attempting steps one and two has not been
designed; it has been decorated.

### 1.3 What Is Actually At Risk

Being specific matters more than being comprehensive. The realistic threats, in order of consequence:

- **Compromise of code delivered to the browser.** This is the most serious risk the product has. Any
  script running in a tool page can read what the user is working on. A supply-chain compromise, a
  third-party script with page access, or an injection defect defeats every other protection at once,
  because it operates inside the boundary rather than crossing it. Section 6 is written around this.
- **Compromise of account data.** Bounded by how little is stored. Exposes account existence,
  contact detail, plan state, and preferences. Serious, and survivable specifically because
  `database.md` keeps it small.
- **Account takeover.** An individual losing control of their account. Consequence is limited —
  there is no stored material to steal — but it is the failure a user experiences most directly.
- **Compromise of a third-party service.** Authentication, payments, monitoring, analytics. Bounded
  by giving each the minimum it needs and nothing more.
- **Hostile or malformed user files.** Every file a tool receives is untrusted input, and it is
  processed on the user's own machine. The risk is to that user's browser session, and it is ours to
  contain.
- **Denial of the platform.** Consequence is deliberately limited: because no platform service sits
  on the critical path, the platform being unavailable must not stop a tool from working.

### 1.4 What Is Deliberately Not Defended Against

Stating this honestly is part of the philosophy. `product-principles.md` requires failing honestly,
and that applies to our own claims.

- **A compromised user device.** If the machine, browser, or extensions are hostile, no property of
  this product helps. We do not claim otherwise.
- **Users doing what they intend.** A person may download their own result and do anything with it.
  There is no restriction on the user's own output, and none will be added.
- **Enterprise threat models.** `vision.md` excludes organisations, administration, and compliance
  programmes. This document defends individuals; it is not a control framework for a customer's
  audit.

Claiming protection we do not provide is worse than the gap, because a user makes decisions on the
claim.

### 1.5 Security Failures Are Handled Honestly

The obligation to fail honestly does not become optional when the failure is ours.

- Users are told what happened, in plain language, without minimising it.
- We do not describe an incident in language designed to make it sound smaller than it is.
- Where we do not yet know, we say so, rather than issuing a reassurance that has to be retracted.
- A security defect is a defect. It is not renamed or deferred because acknowledging it is
  uncomfortable.

### 1.6 Security Is Never Traded For Convenience

Convenience is not a sufficient reason to weaken any control in this document, and neither is
schedule, cost, or a feature request.

Where a genuine conflict exists between a security property and something else, it escalates to the
project owner. It is never resolved locally, and it is never resolved by an undocumented exception
that becomes precedent.

---

## 2. Privacy By Design

### 2.1 Data Minimisation

Minimisation is settled by `database.md`, which defines what may be stored and applies a four-part
test to every field. This section states its security consequence: **the minimisation rules are
security controls, and weakening them is a security change.**

- Data not collected cannot be breached, subpoenaed, sold after an acquisition, or leaked by a
  defect.
- Every proposal to store something new expands the blast radius of every future compromise. That
  cost is weighed at the point of collection, where it can still be avoided.
- The exclusions in `database.md` — no user content, no derivations, no behavioural records, no
  profiling, no identification of people without accounts — are treated as security boundaries, not
  as privacy preferences.
- Minimisation follows the data everywhere it travels: diagnostics, monitoring, analytics, backups,
  exports, support, and third parties. A copy inherits every restriction of the original.

### 2.2 Least Privilege

Everything — every person, service, credential, dependency, and piece of code — operates with the
narrowest access that permits its function.

- Access is granted for a stated purpose, to a named recipient, for a defined duration.
- No broadly-privileged ambient credential exists because it was convenient.
- Third-party services receive the minimum required to perform their function. A monitoring service
  does not need account data; a payment provider does not need preferences; an analytics service does
  not need identity.
- Privilege is reviewed and revoked when the reason for it ends. Accumulated access is the mechanism
  by which a small compromise becomes a large one.
- Client-delivered code holds no privilege that its function does not require, and holds no secret at
  all.

### 2.3 Secure Defaults

The safe configuration is the default, and the unsafe one requires a deliberate act.

- Access is denied until explicitly granted, at every layer.
- Nothing is exposed, enabled, or permitted because it was left on.
- Anything optional and security-relevant defaults to off.
- A user who changes nothing is fully protected. Security is never something the user has to opt
  into, discover, or configure, and there is no security-relevant setting whose default we would not
  want a user to have.
- Failure states are safe by default — with one deliberate, documented exception, defined in section
  4.4, where failing open serves the user and protects nothing of consequence.

### 2.4 Defence In Depth Without Depending On It

Multiple independent controls protect the same property, so that one failing does not expose it. But
no control is permitted to exist only because another one is expected to catch its failures.

- Client-side validation is a usability feature. It is never a security control, because the client
  is under the user's control.
- Application-layer authorisation is a control, and it is not the only one — ownership is enforced at
  the data layer as well, per `database.md`.
- Every layer is written as though it is the last one.

---

## 3. Identity And Authentication

Goals only. The authentication service is named in `tech-stack.md`, and no mechanism is specified
here.

### 3.1 Identity Is Optional By Design

**No account is required to use SimpleTools.** Most people who use the product are never
authenticated, are never identified, and leave no record. An account exists for exactly one purpose —
to hold a Pro subscription.

This is a security property before it is a product one. The majority of users cannot have their
account compromised, because they do not have one. The authentication surface protects a minority,
and it is kept small accordingly.

The platform does not attempt to recognise, fingerprint, or correlate people who have no account.
Building an identity for someone who declined to create one is prohibited regardless of what it is
called or what it is for.

### 3.2 Credentials Are Not Ours To Hold

Secret material — passwords, tokens, keys, recovery codes — belongs to the authentication service and
never enters the platform's own data model, in any form, including hashed, encoded, truncated, or
partial. `database.md` states this and it is restated here because it is a security boundary.

The platform holds the association between an account and its authenticated identity, and nothing
that would be valuable to steal.

### 3.3 Goals For Authentication

- Authentication is resistant to guessing, reuse, and automated attack.
- Stronger authentication is available to anyone who wants it, and is never withheld from a plan.
  Security is not a paid feature. Selling protection to the users who can afford it is precisely the
  monetisation `product-principles.md` prohibits.
- Sessions expire, can be ended by the user, and can be ended everywhere at once.
- A session cannot be extended indefinitely by an attacker who obtained it once.
- Authentication state is verified server-side on every privileged operation. A client's claim about
  who it is carries no weight.
- Authentication is not required to complete a task, ever, so an authentication failure never blocks
  someone's work.

### 3.4 Account Recovery

Recovery is the most commonly attacked part of any authentication system, because it is designed to
work for someone who has lost something.

- Recovery is as strong as authentication. A weaker recovery path replaces the strength of the
  primary one.
- Recovery does not depend on information an attacker could research or a support agent could be
  persuaded to accept.
- Recovery is self-service. A path that runs through a human being is a path that can be socially
  engineered.
- Recovery events are audited, and the account holder is told when one occurs.

### 3.5 The User Is Told What Happens To Their Account

- Security-relevant changes — authentication from an unfamiliar context, credential changes, recovery
  events, plan changes, deletion — are visible to the account holder.
- Notifications state what happened and what to do about it, in plain language, without alarm and
  without jargon.
- Nothing security-relevant happens to an account silently.

### 3.6 Enumeration And Disclosure

- The system does not reveal whether an account exists to someone who is guessing. Whether a person
  has an account with us is information about them.
- Error responses in authentication flows are uniform and unhelpful to an attacker while remaining
  honest to a user, per `design-system.md`.
- Timing and response differences that would disclose account existence are treated as defects.

---

## 4. Authorization

### 4.1 Two Categories That Must Never Be Confused

The platform makes two structurally different kinds of authorisation decision, and conflating them is
the primary error available in this section.

**Access decisions** — may this request read or change this record. These protect data belonging to
someone. They are server-authoritative, enforced at multiple layers, and **fail closed**. If it
cannot be established that a request is entitled to a record, the answer is no.

**Entitlement decisions** — what does this account's plan permit. These govern ceilings on work the
user performs on their own device. They protect nothing belonging to anyone else, and per section 4.4
they **fail open**.

The distinction is deliberate. It is stated once here so that no future change accidentally applies
one category's rules to the other.

### 4.2 Access Decisions

- Every request is authorised server-side against the authenticated identity. The client's assertion
  of who it is or what it may do is never trusted.
- Authorisation is evaluated per request, on current state. A prior decision is not reused, and a
  privilege granted at sign-in is not assumed to still hold.
- **An account's data is accessible only to that account**, and the restriction is enforced at the
  data layer as well as in application code, per `database.md`. A query written incorrectly must not
  be able to return another person's record.
- Deny by default. A request for something no rule covers is refused.
- Authorisation is evaluated in one place per operation, not scattered through code where a caller
  can bypass it by choosing a different route.
- Identifiers are opaque and unguessable, but obscurity is not the control. Knowing an identifier
  never confers access.
- Administrative access to account data is exceptional, individually attributable, justified, and
  audited. It is never routine, never shared, and never anonymous.

### 4.3 Entitlement Decisions

- Entitlements are derived from subscription state and evaluated server-side when they matter for
  billing or for account operations.
- The client is informed of an entitlement so it can present the interface honestly. It is not
  trusted to enforce one, because a user controls their own device and always can bypass a
  client-side check.
- A client-side limit is an interface courtesy, not a security control, and is never described as
  one.
- Entitlement state may be stale. The system is designed so that staleness is harmless.

### 4.4 Entitlement Checks Never Gate Local Processing

**This is an architectural constraint, and it is absolute.** `architecture.md` states that no platform
service sits on the critical path of a core task. An entitlement check performed before a tool is
allowed to run would make the platform exactly that.

Therefore:

- **A tool completes its task without consulting any platform service.** Processing begins, proceeds,
  and finishes on the device, whether or not the platform is reachable, whether or not the user has
  an account, and whether or not their entitlement could be determined.
- Where entitlement cannot be established — the platform is unreachable, the record is stale, the
  check errors, the user is anonymous — **the work proceeds.** The platform fails open, in the user's
  favour, every time.
- This is a considered trade. The asset protected by a hard entitlement gate is a ceiling on a
  low-cost subscription. The asset protected by failing open is the guarantee that the product works.
  The second is worth immeasurably more, and `vision.md` exists in opposition to products that refuse
  to finish someone's work for commercial reasons.
- Some limit evasion is therefore possible. That is accepted, deliberately, at this level of the
  document, and it is not a defect to be closed later by moving processing to a server.
- **What does not fail open:** identity, access to account data, subscription state with the payment
  provider, and billing itself. Those are server-authoritative and fail closed. A user cannot obtain
  a paid subscription, alter their plan, or reach another person's data by manipulating a client.
- No future change may reverse this by making processing conditional on a check. A tool that will not
  run because an entitlement could not be read is a defect, and it is a violation of
  `architecture.md`.

---

## 5. Data Protection

`database.md` defines what exists to be protected and states the data layer's security goals. This
section states the standards that meet them.

### 5.1 The Protected Set Is Small By Design

What the platform holds: that an account exists, how to reach its holder, what plan it is on,
entitlement counters, preferences, feature configuration, and an immutable record of changes to those
things.

What it does not hold — user files, outputs, derivations, file names, behavioural histories, profiles
— cannot be protected because it does not exist, and that is the intended arrangement rather than a
gap.

The scope of any breach is bounded by that list. Every proposal to extend it reduces the bound, which
is why `database.md` gates additions and why this document treats those gates as security controls.

### 5.2 Data In Transit

- All communication with platform services is encrypted, without exception and without a downgrade
  path.
- Encryption is not optional, not configurable by the user, and not disabled in any environment.
- Content delivered to the browser is served over encrypted transport, and its integrity matters as
  much as its confidentiality — see section 6.6.

### 5.3 Data At Rest

- Account and platform data are encrypted at rest. This is a baseline expectation, not an
  achievement.
- Backups are protected to exactly the standard of the live data. A backup with weaker protection is
  the weakest point in the system and is where data is actually lost.
- Secret material is never a field in the data model, per `database.md`. It is managed as a secret,
  under section 8.1.

### 5.4 Data In Use

- Sensitive values are never written to logs, diagnostics, error reports, monitoring, or
  crash captures.
- **No user content appears in any diagnostic artefact, ever** — not file contents, not file names,
  not input values, not samples, not derived fragments. `coding-standards.md` states this as an
  absolute; it is restated here because diagnostics are the most common route by which content
  escapes a system that was otherwise designed correctly.
- The obligation is to actively prevent capture, not to assume a tool's defaults are safe. Any
  monitoring capability that records page content, replays sessions, or captures form input is
  disabled deliberately and verified, not trusted to be off.
- Data displayed to a user is scoped to that user. Aggregate views never leak individual records.

### 5.5 Environment Separation

- Production data exists only in production. It is never copied into development, testing,
  demonstration, or analysis environments, in whole or in part, for any reason.
- Non-production environments use synthetic data owned by us.
- Environments have separate credentials, separate secrets, and separate access. A credential valid
  in one is invalid in the others.

### 5.6 Third Parties

- Every external service receives the minimum required for its function, and its access is scoped to
  exactly that.
- No third party receives user content. There is no arrangement, contract, or feature under which
  this becomes acceptable.
- A third party's compromise is assumed to be possible, and the data given to it is limited so that
  the assumption is survivable.
- Adding a service that would process personal data is a decision for the project owner, not an
  implementation choice.

### 5.7 Deletion Is A Security Control

Data removed is data that cannot be exposed. Retention limits, expiry, and user-initiated deletion
under `database.md` are security controls, and failing to enforce them is a security defect rather
than a housekeeping oversight.

Deletion propagates to every copy, including backups within their defined lifetime. Data that
survives deletion in a backup indefinitely has not been deleted.

---

## 6. Browser Security

The browser is where the product actually runs and where the user's material actually is. This is the
most security-critical section in the document, because everything the platform protects is small and
everything the browser touches is not.

### 6.1 The Governing Threat

**Any code executing in a tool page can read what the user is working on.**

No transport protection, storage policy, or access control addresses this, because such code operates
inside the boundary rather than crossing it. Consequently, what is permitted to execute in a tool
page is the single most important security decision the product makes, and it is treated with more
suspicion than anything else in this document.

### 6.2 Processing Is Local, Isolated, And Offline

- Tool processing occurs entirely on the user's device. No user content is transmitted to any
  platform service, at any stage, for any purpose.
- **No dependency used in processing may reach a network during processing.** `tech-stack.md` states
  this as a standing rule of the dependency policy; here it is a security control, and it is
  verifiable rather than assumed.
- Substantial processing runs in the most isolated execution context available and off the rendering
  path, per `coding-standards.md`. Isolation is a security benefit as well as a performance one.
- Tool modules are isolated from one another, per `architecture.md`. No tool can observe or reach
  another tool's state or material.
- A tool functions with no network connection at all once its page has loaded. If it cannot, it is
  either doing something it should not or depending on something it should not.

### 6.3 Every User File Is Untrusted Input

A file arriving from a user may be malformed, truncated, hostile, or crafted specifically to attack a
parser. Tools are written on that assumption.

- Input is validated at the boundary before processing begins, per the lifecycle in
  `architecture.md`, and validation is a security control as well as a usability one.
- No user content is ever evaluated as code, interpreted as markup, or executed in any form.
- Content extracted from a file is treated as untrusted when displayed, and cannot alter the page it
  is rendered into.
- Embedded active content within a user's file — scripts, macros, external references, automatic
  actions — is never executed and never followed. A file may not cause a network request by being
  opened.
- Processing is bounded. Malformed input must fail cleanly rather than exhausting memory, blocking
  the interface indefinitely, or crashing the tab.
- A parsing failure is a handled outcome with an honest message, never an unhandled crash.

### 6.4 Temporary Memory And Browser Storage

**Browser-managed execution space** is the environment the browser gives a tool while it runs on the
user's device. It comprises the browser runtime holding the tool's working state, together with any
browser-managed temporary storage permitted by the standing rule set out below. It does not include
platform services, permanent platform storage, or any external system. Wherever this handbook says
that user content exists in browser-managed execution space, it means precisely this and nothing
wider. This section is the single authority for the term.

- User content exists in browser-managed execution space for the duration of the task and no longer.
  It is released when the task completes, when it is cancelled, and when it is abandoned.
- **User content is not written to durable browser storage.** Not to local storage, not to a database
  in the browser, not to a cache, not to any mechanism intended to outlive the task. The promise made
  to the user is that their material exists for as long as their work does and no longer. The single
  exception is browser-managed temporary storage, governed by the standing rule immediately below.
- Durable browser storage is used only for preferences and platform state, which by definition
  contain no user content.

**Browser-managed temporary storage.** Some workloads — large files in particular — genuinely cannot
complete entirely in memory. Where that is the case, browser-managed temporary storage is permitted.
It is permitted only when **all** of the following are true:

1. The workload cannot reasonably complete entirely in memory.
2. The temporary data remains on the user's device.
3. No temporary data is uploaded to any platform service.
4. No temporary data becomes permanent platform data.
5. Temporary data is removed automatically when the task completes.
6. Temporary data is removed automatically when the task is cancelled.
7. Temporary data expires automatically if the task is abandoned.

This is a standing architectural rule. Individual project-owner approval is not required, and none is
sought. What is required is that every condition holds, and that this is verified rather than
assumed:

- **The conditions are conjunctive.** Six out of seven is a failure. A workload that satisfies most
  of them is not permitted to proceed while the remainder are addressed later.
- **Condition one is a real test, not a formality.** Temporary storage is used because the work cannot
  be done without it, never because it is more convenient, simpler to write, or faster to build. A
  workload that would fit in memory uses memory.
- **Removal is automatic, not requested.** Conditions five, six, and seven are properties of the
  system, not instructions to the user and not actions a user must remember to take.
- **Condition seven exists because tabs are closed, crash, and are navigated away from.** Expiry must
  not depend on the page still running when the task ends. A cleanup step that only executes on an
  orderly exit does not satisfy it.
- **Temporary storage is scoped to the single task that created it.** It never becomes a cache shared
  across tasks, across tools, across tabs, or across visits, and nothing is retained on the theory
  that it might be useful again.
- The data placed there is subject to every other rule in this document without exception. It is
  never transmitted, never logged, never described in a diagnostic, and never reaches any platform
  service in any form, including derived or summarised.
- Cancellation genuinely stops work and releases what it held. `product-principles.md` requires that
  the user is returned exactly to where they started.
- No user content is retained across tools, across tabs, or across visits.

### 6.5 Downloads And Output

- Results are produced on the device and delivered from the device. A download never involves a round
  trip to a server, and there is no server-generated link to a user's result because no server has
  one.
- Output is not logged, counted by content, or described in any diagnostic.
- File names derived from user input are treated as untrusted: they cannot escape the intended
  location, cannot inject control characters, and cannot cause anything to be interpreted rather than
  saved.
- Output has the correct type declared and is never delivered in a form that could be executed or
  interpreted by the receiving system.
- The user is told plainly what they are getting before they get it. A download is never a surprise.
- What the user does with their own output afterwards is their business, and no restriction is placed
  on it.

### 6.6 What May Execute In A Tool Page

The strictest rules in the document, because section 6.1 is the governing threat.

- **No third-party script has access to a tool page's processing context.** Not analytics, not
  monitoring, not tag managers, not advertising, not experimentation platforms, not support widgets,
  not embedded media.
- **Session replay, page-content capture, form-input capture, and DOM recording are prohibited
  outright**, in every environment including development against real use. These technologies exist
  to record exactly what this product promises never to observe.
- Analytics and error monitoring operate under the constraints in `tech-stack.md` and section 5.4:
  they never carry file contents, file names, input values, or derived samples. This is enforced
  deliberately, not left to a default.
- Every dependency that runs in the browser is part of the trusted computing base for user content. A
  compromised dependency reads everything, silently. `tech-stack.md` sets the dependency policy at
  default-no; this section is the reason it is set there.
- The integrity of delivered code is protected, and the browser is instructed to restrict what may
  execute and where content may be sent. The mechanisms are implementation; the requirement that they
  exist is not.
- Content injected into a page from any source is escaped or rejected. Injection defects are treated
  as the most severe class of defect in the product, because they convert into unrestricted access to
  the user's material.

### 6.7 Session And Client State

- Session material is protected against theft and misuse by the browser's own strongest available
  mechanisms.
- Privileged actions are protected against being triggered by another origin.
- Client state is never trusted as authoritative for any access or billing decision.
- A tool page holds no secret, no privileged credential, and nothing that would be valuable to an
  attacker who read it.

---

## 7. Platform Security

Backend services are small by design, which is itself the principal control. No infrastructure,
configuration, or provider setting is described here.

### 7.1 A Small Surface Is The Primary Defence

The platform does authentication, subscriptions, entitlements, preferences, and feature
configuration. It does not process files, does not store user content, and does not sit on the
critical path of any task.

That narrowness means there is little to attack, little to misconfigure, and little to compromise.
Every proposal that widens the backend's responsibilities widens the attack surface, and is evaluated
as a security change as well as an architectural one.

### 7.2 Trust Boundaries

- The client is outside the trust boundary, always. Nothing it sends is trusted and nothing it
  asserts is believed.
- Every request crossing into the platform is authenticated, authorised, and validated
  independently of any prior request.
- Input is validated at the boundary against an expected shape before it reaches anything else, per
  `coding-standards.md`. Validation inside the boundary is not a substitute for validation at it.
- Callbacks and notifications from third-party services — payment events in particular — are verified
  as genuine before they are acted upon. An unverified notification that changes billing state is a
  serious defect.

### 7.3 Isolation Between Accounts

- One account can never read, infer, or affect another's data. This is enforced in application logic
  and independently at the data layer, per `database.md`.
- Identifiers are opaque and confer no access.
- Aggregate or administrative views never leak individual records.
- This property is verified deliberately rather than assumed from correct-looking code, because it is
  the failure that matters most and the one least likely to be noticed.

### 7.4 Availability And Abuse

- Platform services are protected against abuse and exhaustion.
- **Abuse controls must never affect a tool's ability to complete a task.** A rate limit that
  prevents someone from finishing their work is a violation of `architecture.md` and of
  `product-principles.md`.
- Abuse controls operate on platform operations — authentication, account changes, billing — where
  they protect a real asset.
- Abuse control never becomes a justification for identifying anonymous users, building profiles, or
  fingerprinting devices. If a control requires identifying people who chose not to have an account,
  the control is not adopted.
- The platform being unavailable degrades account operations only. Tools continue to work.

### 7.5 Error Behaviour

- Errors returned to a client disclose nothing about internal structure, technology, data, or other
  accounts.
- Internal diagnostic detail stays internal, per the two-audience rule in `coding-standards.md`.
- Failure is safe: an operation that cannot complete leaves no partially applied state.

### 7.6 Administrative Access

- Administrative capability is minimal, exists only where genuinely required, and is not built for
  convenience.
- Access to account data by anyone is exceptional, justified, individually attributable, and audited
  immutably.
- There is no administrative capability to view user content, because there is no user content. This
  is a property to preserve, not a limitation to work around.

---

## 8. Operational Security

### 8.1 Secrets Management

- Secrets never appear in source control, in code, in the data model, in logs, in diagnostics, in
  error reports, in build artefacts, or in anything delivered to a browser.
- **A secret that reaches the client is not a secret.** It is disclosed, and it is rotated
  immediately rather than reasoned about.
- Secrets are scoped to the narrowest purpose and environment. One secret does not span environments,
  services, or purposes.
- Secrets are rotatable without downtime, and rotation is exercised rather than assumed to work.
- Any secret suspected of exposure is rotated first and investigated second. There is no threshold of
  doubt below which rotation is skipped.
- A secret committed to history is compromised permanently, regardless of whether the commit was
  removed.
- Access to secrets follows least privilege and is revoked when the reason for it ends.

### 8.2 Dependency Management

Every dependency is code we did not write, running with our privileges, and — for anything in the
browser — inside the boundary that protects user content. Section 6.6 explains why this is the most
consequential supply-chain risk the product has.

- `tech-stack.md` sets the policy: the default answer is no, native capability is preferred,
  duplicate capability is refused, and no dependency may transmit user content or reach a network
  during processing. Those are security rules, not merely architectural ones.
- Dependencies are evaluated before adoption on maintenance, provenance, transitive weight, and what
  they would have access to. A widely-used package is not thereby a safe one.
- The full dependency tree is known. Transitive dependencies are part of the trusted computing base
  whether or not anyone chose them.
- Exact versions are pinned and reproducible. A build that could resolve differently tomorrow is a
  build nobody has verified.
- **Nothing upgrades itself.** Automatic updates are a mechanism by which unreviewed third-party code
  enters the product, per `tech-stack.md`.
- Advisories are monitored continuously, and known vulnerabilities are triaged under section 8.3
  rather than accumulating.
- Unused dependencies are removed. An unused dependency is pure risk.
- The smallest dependency tree that does the job is the most secure one available.

### 8.3 Vulnerability Response

- Vulnerabilities are triaged by realistic impact on users, not by an external score alone.
- Priority order follows section 1.3: anything affecting code that executes in a tool page ranks
  above anything affecting the platform, because it reaches user content.
- Response time scales with severity. Severe issues interrupt other work; the definition of severe is
  written down and applied consistently rather than negotiated per incident.
- Fixing is preferred to mitigating. A mitigation is a temporary measure with a tracked path to a
  fix, not a resolution.
- A vulnerability that cannot be fixed promptly is recorded, with its exposure and its mitigation
  stated explicitly, and it is escalated rather than quietly carried.
- Security fixes ship separately from feature work, so they can be reviewed, released, and reverted
  independently.
- **Responsible disclosure is welcomed.** A clear, monitored channel exists for reporting a problem,
  reports are acknowledged and acted on, and no reporter acting in good faith is treated as an
  adversary.

### 8.4 Incident Handling

- **Prepare.** Roles, decisions, and communication paths are decided before an incident, not during
  one.
- **Detect.** Audit records and monitoring are sufficient to notice a problem and to reconstruct what
  happened, per `database.md`.
- **Contain.** Stopping ongoing harm takes priority over understanding the cause. Credentials are
  rotated and access revoked early rather than after certainty.
- **Eradicate and recover.** The cause is removed, not the symptom, and recovery is verified rather
  than assumed.
- **Communicate honestly.** Affected users are told what happened, what it means for them, and what
  to do, in plain language, promptly, without minimising. Section 1.5 governs the tone. We do not wait
  for complete information to say that something has happened.
- **Review blamelessly.** Every incident produces a written review that examines the system rather
  than the person, and produces changes rather than resolutions.
- Incidents are recorded even when nothing was exposed. Near misses are the cheapest information
  available.

### 8.5 People And Access

- Access to production systems and account data is granted individually, for a stated reason, and
  reviewed.
- Access is removed promptly when someone's role changes or ends. Delayed removal is a common and
  entirely avoidable exposure.
- Shared accounts and shared credentials are not used. Attribution is impossible without individual
  identity.
- Every action taken against production account data is attributable to a person and audited.

### 8.6 Change Safety

- Changes are small, reviewed, and reversible, per `coding-standards.md`. Security depends on changes
  being comprehensible.
- Every change is reviewed by someone other than its author. This includes changes generated by AI
  coding agents, which are held to exactly the same standard and are subject to the specific scrutiny
  `coding-standards.md` requires — fluent, plausible code is precisely the kind that carries a
  violation through review.
- No change reaches production without review, regardless of urgency. Urgency is when review matters
  most.
- A change that cannot be explained is not approved.

---

## 9. Security Review Checklist

Applied to every change before approval, alongside the code review checklist in `coding-standards.md`
and the design review checklist in `design-system.md`. Where a check cannot be answered confidently,
it has not passed.

### 9.1 Blocking Checks

Any of these fails, the change does not ship.

- **User content boundary.** Does anything transmit, store, cache, or persist user content, in any
  form, including derivations, file names, and measurements taken from a file?
- **Diagnostics.** Could any log, error report, analytics event, monitoring breadcrumb, or crash
  capture contain user content or unnecessary personal data?
- **Page execution.** Does this add anything that executes in a tool page? Does any third-party
  script gain access to the processing context? Is any content capture, session replay, or input
  recording introduced?
- **Dependencies.** Does this add a dependency? Was it explicitly approved? Is its full tree known,
  pinned, and free of known vulnerabilities? Could it reach a network during processing?
- **Critical path.** Does completing a core task now depend on a platform service, an entitlement
  check, or a network request?
- **Fail-open preserved.** Where entitlement cannot be determined, does the user's work still
  complete?
- **Fail-closed preserved.** Do identity, access to account data, and billing state still fail closed
  and remain server-authoritative?
- **Authorisation.** Is every privileged operation authorised server-side against current state, with
  ownership also enforced at the data layer? Can any path reach a record belonging to another
  account?
- **Client trust.** Does any decision rely on something the client asserted?
- **Untrusted input.** Is every user file and every external input validated at the boundary? Is any
  user content evaluated, interpreted, executed, or rendered without escaping?
- **Injection.** Can any input alter the structure of a page, a query, a command, a file path, or a
  file name?
- **Secrets.** Does this introduce a secret into source, logs, the data model, a build artefact, or
  anything delivered to a browser?
- **Data minimisation.** Does this store, transmit, or collect anything new? Does it pass the tests
  in `database.md`? Was it approved?
- **Anonymity.** Does this identify, fingerprint, correlate, or count people who have no account?
- **Browser storage.** Does any user content reach durable browser storage? Where browser-managed
  temporary storage is used, does it satisfy every one of the seven conditions in section 6.4?
- **Content lifecycle.** Is user content released when the task completes, when it is cancelled, and
  when it is abandoned?
- **Downloads.** Is output produced and delivered locally, with untrusted file names handled safely
  and a correct declared type?
- **Environment separation.** Does any production data reach a non-production environment?
- **Deletion.** Does user-initiated removal remain complete, propagating to every copy?
- **Honest failure.** Does every security-relevant failure produce an honest, non-disclosing message
  and leave no partial state?

### 9.2 Ordinary Review

Not automatically blocking, but each requires an answer.

- **Least privilege.** Does anything here have more access than its function requires?
- **Secure default.** Is the safe configuration the default? Does a user who changes nothing remain
  fully protected?
- **Surface.** Does this widen the backend's responsibilities or add a new externally reachable
  operation?
- **Third parties.** Does any external service receive more than it needs?
- **Audit.** Are security-relevant and money-relevant events recorded immutably, and is anything
  unnecessary being recorded?
- **Enumeration.** Does any response, timing difference, or error disclose whether an account exists?
- **Session handling.** Are sessions bounded, revocable, and protected against cross-origin
  triggering?
- **Resource bounds.** Can malformed input exhaust memory, block the interface, or crash the tab?
- **Reversibility.** Can this be reverted quickly if it turns out to be wrong?
- **Comprehensibility.** Can the reviewer explain what this does? If not, it cannot be approved.
- **Claims.** Does anything user-facing claim protection this change does not actually provide?

### 9.3 Review Conduct

- Security objections cite the property at risk and the realistic path to harm, not a general unease.
- Blocking objections are distinguished from suggestions, explicitly.
- Uncertainty about a security property is resolved before approval, not after release.
- Approving a change is accepting shared responsibility for its security consequences.
- Where a change is genuinely blocked by a limitation of the platform's design, that escalates to the
  project owner rather than being resolved with a local exception. Security exceptions become
  precedent faster than any other kind.

---

## 10. Out Of Scope

### 10.1 What This Document Does Not Define

This document states security goals, standards, and expectations. It deliberately does not define:

- **Infrastructure configuration.** No provider settings, network configuration, edge rules, service
  configuration, or environment setup.
- **Cloud provider settings.** No account structure, permission configuration, or platform-specific
  arrangement for any provider named in `tech-stack.md`.
- **Implementation details.** No headers, no content policies expressed as settings, no encryption
  algorithms or key sizes, no protocol versions, no authentication mechanisms, no library choices, no
  code.
- **Runbooks and procedures.** The operational steps for deployment, rotation, and incident execution
  belong with the operations they describe.
- **Specific tooling.** Scanners, monitors, and analysis tools are implementation choices bound by
  the policies above.

These exist and matter. They are produced by implementation and operations work, constrained by this
document, and they change on a different timescale than the philosophy does. Recording them here
would guarantee this document becomes inaccurate, and an inaccurate security document is worse than
none because it is trusted.

### 10.2 What This Document Does Not Attempt To Secure

Stated plainly, per section 1.4:

- **The user's own device**, browser, extensions, or network. Outside our control, and we do not
  claim otherwise.
- **The user's own output.** No restriction is placed on what someone does with their own result.
- **Enterprise and organisational threat models.** `vision.md` excludes organisations, seats,
  administration, and compliance programmes. This document defends individuals.
- **Legal and regulatory compliance programmes.** Obligations that genuinely apply are met, but this
  is a security philosophy, not a compliance framework, and it is not written to satisfy an audit.

### 10.3 Where Related Concerns Live

`architecture.md` owns the structural constraints this document enforces. `database.md` owns what may
be stored and the data layer's security goals. `tech-stack.md` owns technology selection, the
dependency policy, and the upgrade policy. `coding-standards.md` owns how secure code is written,
reviewed, and logged. `design-system.md` owns how security-relevant states are presented to users.
`deployment.md` owns release and environment operations.

---

## Boundaries And Change Control

This document owns the security philosophy: what is protected and from what, privacy by design,
identity, authorisation, data protection, browser security, platform security, operational security,
and security review.

Where this document conflicts with `vision.md`, `product-principles.md`, `architecture.md`,
`tech-stack.md`, `coding-standards.md`, `design-system.md`, or `database.md`, those documents are
correct and this one is amended.

The constraints in sections 4.4, 6.2, 6.4, and 6.6 restate architectural guarantees. They are not
relaxable by implementation, by review, or by convenience. A change that would weaken one is
escalated to the project owner and, if approved, is recorded here before it is built.

Nothing here changes without explicit instruction from the project owner.
