# SimpleTools — Database

**Status:** Locked. Changes require explicit instruction from the project owner.

This document defines the long-term data architecture of SimpleTools: why persistent storage exists,
what may be kept in it, what may never be, and the rules that govern its shape over the life of the
product.

The governing fact is stated once here and repeated throughout because everything else follows from
it: **SimpleTools is a browser-first platform. Browser-capable utilities process user files entirely
on the user's own device. User files are never stored by the platform. The database exists to
operate the platform, not to run the utilities.**

`architecture.md` establishes the layer structure, the isolation of tool modules, and the two
standing constraints on platform services — that no platform service ever receives user content, and
that no platform service sits on the critical path of a core task. This document works within those
constraints and does not soften them. `tech-stack.md` owns the choice of platform backend and the
scope of its responsibilities. `security.md` owns operational security controls. `pricing.md` owns
what the plans are and what their limits contain.

This document contains no schema, no tables, no fields, no queries, no migrations, and no
technology. It states what the data model must be true of, not what it looks like.

---

## 1. Database Philosophy

### 1.1 Why A Database Exists At All

The product's central design decision is that the work happens on the user's device. Files are not
uploaded, results are not stored, and nothing the user is working on ever reaches us. For the
majority of what SimpleTools does, there is no data to persist and no database involved.

Persistent storage exists for one reason: **a subscription cannot exist without an account, and an
account cannot exist without a record.** `vision.md` states this plainly — an account exists for
exactly one purpose, to hold a Pro subscription.

Everything the database holds is downstream of that single requirement. Authentication exists because
an account must be reachable by the person who owns it. Billing metadata exists because a
subscription must be reconciled with a payment. Entitlements exist because a plan must be
distinguishable from another plan. Preferences and feature flags exist because they make the platform
operable. That is the whole justification, and it is deliberately narrow.

### 1.2 The Database Serves The Platform, Never The Utilities

A tool's work is performed in the browser, on the user's device, and completes without any server
involvement. The database is not part of any tool's operation.

This has a consequence that must be designed for rather than hoped for: **a tool must complete its
task correctly while the database is unavailable.** Persistent storage is not a dependency of
correctness, only of account services. A tool that cannot finish because a record could not be read
is a defect, not a degraded state.

### 1.3 The Default Answer Is Not To Store It

Every category of data begins outside the database and must argue its way in. The argument must be
operational — something specific and necessary breaks without it — and it must survive the question
that follows: can this be derived, defaulted, kept on the device, or simply not known.

"It might be useful later" is not an argument and never becomes one. Data collected speculatively is
never removed, because nobody can prove it is unused, and it accumulates permanently.

### 1.4 What Belongs In Persistent Storage

Only these categories, and only the minimum within each:

- The existence of an account and the means to authenticate to it.
- The state of a subscription and the minimum required to reconcile it with the payment provider.
- Entitlements — what a given account is currently permitted.
- Counts required to enforce a limit that genuinely requires counting.
- Preferences an account holder has chosen to persist across devices.
- Feature availability controlled by the platform.
- An immutable record of security-relevant and money-relevant events.

### 1.5 What Never Belongs In Persistent Storage

Absolute, and not subject to local judgement:

- Any file a user provides, in whole or in part, in any format, at any stage.
- Any output a tool produces.
- Any intermediate or temporary artefact of processing.
- Anything derived from user content — extracted text, thumbnails, previews, page or record counts
  from a specific file, checksums, statistical summaries, samples, or representations of any kind.
- File names, which are user content and frequently disclose more than the file.
- Any record of what an identified person did with a specific piece of material.
- Any behavioural profile, inferred attribute, or scored characteristic of a user.
- Anything collected because it might have future value.

### 1.6 Privacy By Structure Applies To Storage

`product-principles.md` establishes that privacy is achieved by ensuring there is nothing to expose,
not by promising to behave well with what is collected. Applied to storage, this is the strongest
security control the platform has: a breach of the database exposes account existence, plan state,
and preferences. It cannot expose a single user's document, because no such thing was ever written.

That property is worth more than any control that could be built on top of stored content, and it is
lost permanently the first time an exception is made.

---

## 2. Data Ownership

Every fact in the system has exactly one system of record. Where a fact originates outside the
platform, the platform holds a reference and treats the external system as authoritative. A fact
stored authoritatively in two places will diverge; it is only a question of when.

### 2.1 User Accounts

**Owner:** the platform.

An account records only that a person has one and how to reach them about it. It is created when
someone chooses to create one, never automatically and never as a precondition of using a tool.

No account is required to use SimpleTools. Anyone who has not created one is not recorded, not
counted individually, and not identified. **The platform does not attempt to recognise, fingerprint,
or track people who have no account.**

Personal information is limited to what is genuinely required to operate an account and correspond
with its holder. Demographic detail, professional detail, and profile content of any kind are not
collected, because nothing in the product uses them.

### 2.2 Authentication Metadata

**Owner:** the authentication service named in `tech-stack.md`.

The platform does not hold credentials. Secret material — passwords, tokens, keys, recovery codes —
is the authentication service's responsibility and never appears in the platform's own data model in
any form, including hashed, encoded, or partial.

What the platform holds is the minimum required to associate an account with its authenticated
identity, plus the security-relevant state that account recovery and session integrity depend on.
Authentication events are recorded as audit metadata under section 2.9, not as a behavioural history.

### 2.3 Subscription Status

**Owner:** the payment provider is authoritative for whether a subscription is paid. The platform is
authoritative for what that subscription entitles.

The platform stores the current state of the subscription and the minimum reference required to
reconcile it. It does not attempt to recompute or predict billing state independently, because two
authorities produce contradictions and contradictions in billing are experienced by users as being
overcharged.

Where the platform's view of a subscription is stale or unavailable, that is a recoverable condition
handled under section 2.6, not a reason to interrupt a task.

### 2.4 Billing Metadata

**Owner:** the payment provider, absolutely.

**The platform never stores payment instruments.** No card numbers, no partial card numbers, no bank
details, no payment credentials, in any form, for any reason, ever. This is not a policy that can be
revisited for convenience.

The platform stores only what is required to link an account to its subscription with the provider,
to display the plan state a user is entitled to see, and to meet obligations that genuinely require a
record. Invoices, receipts, and payment history are the provider's records; where the platform must
reference one, it references it rather than copying it.

Billing data is the one category with a genuine external retention obligation, and it is minimised
accordingly — the requirement is a record of a transaction, not a record of a person's activity.

### 2.5 Feature Flags

**Owner:** the platform.

Feature flags control the availability of platform capability. They describe the platform's
configuration, not the user's characteristics.

A flag is never used to build a profile, to segment people, to differentiate the experience of one
individual from another arbitrarily, or to run behavioural experiments on users without their
knowledge. `product-principles.md` requires that behaviour does not vary by who is using it, and that
constraint binds here.

Flags are short-lived by intent. A flag that has fully rolled out is removed along with the branch it
controlled. Flags that outlive their rollout become permanent hidden configuration that nobody
understands.

### 2.6 Usage Quotas

**Owner:** the platform, and this is the most carefully constrained category in the model.

`pricing.md` owns what the limits are. This document owns what may be stored in order to enforce
them, and the rules are strict.

- **Counters, never histories.** Where a limit requires counting, the platform stores a count against
  an entitlement for a period. It does not store a log of individual events, what was processed,
  when each occurred, or anything about the material involved. A count is a number; it is not a
  record of activity, and it must never become one.
- **Never content-derived.** A count is of operations. It is never of file sizes, page counts,
  record counts, durations, or anything else extracted from what the user provided, because
  measuring the material means inspecting it.
- **Only for accounts.** Anonymous use is not counted, because counting an unidentified person
  requires identifying them. Any limit that applies without an account is enforced on the device or
  is inherent to the tool, never by recognising a returning visitor.
- **Never on the critical path.** A quota check must not block a task from completing. Where
  entitlement cannot be determined — the platform is unreachable, the record is stale, the check
  fails — **the task proceeds.** The platform fails open, in the user's favour, always. Refusing to
  finish someone's work because we could not read our own database is precisely the behaviour
  `vision.md` exists to oppose.
- **Retained no longer than the period it governs.** A count for a concluded period has no remaining
  purpose and is not kept as history.

### 2.7 User Preferences

**Owner:** the device by default; the account only when the holder chooses.

Preferences must work for someone with no account, so the device is the primary home for them. An
account holder may choose to have preferences follow them across devices; that is a convenience and
is opted into.

Preferences describe interface choices. They are not a behavioural record, they are never derived
from what the user has done, and they never contain anything about the user's material.

The absence of a preference is always valid. Every preference has a sensible default,
`architecture.md` requires the domain layer to be unaware that preferences exist, and no task
anywhere depends on one being readable.

### 2.8 Platform Analytics

**Owner:** the analytics service named in `tech-stack.md`. **Not the database.**

This is a deliberate structural decision. Per-user behavioural analytics are not stored by the
platform because there is nowhere for them to go and no purpose for them to serve.

- Analytics are aggregate and anonymous. There is no per-person record, no identifier linking one
  visit to another, and no linkage between analytics and an account.
- Analytics measure the platform — which pages are reached, whether tools complete, whether errors
  occur. They never measure the user's material, and never carry file contents, file names, input
  values, or anything derived from them.
- `vision.md` states that SimpleTools is not a data business. Usage is not harvested, brokered, or
  resold. There is no internal exception to that for product research.
- If a question can only be answered by tracking individuals, the question goes unanswered.

### 2.9 Audit Metadata

**Owner:** the platform. Append-only and immutable.

The audit record exists to answer, after the fact, what happened to an account and its entitlements.
It protects the user — evidence in a billing dispute, evidence of unauthorised access — and it
protects us.

**Recorded:** account creation and closure; authentication events relevant to security; changes of
plan or entitlement; payment state transitions; requests for data export or deletion and their
completion; administrative access to account data.

**Never recorded:** what tools a person used, what they processed, when they worked, how often, or
anything about their material. The audit trail concerns the account, not the person's activity. A
complete history of what someone did with the product is exactly the asset this product exists not to
hold.

Audit entries are written once and never edited. Correction is made by appending, never by rewriting,
because a record that can be revised proves nothing.

### 2.10 Browser-Generated Files And Processing Outputs Are Not Persisted

**No file a user provides, and no output any tool produces, is persisted by the platform. There is no
partial exception, no temporary exception, and no diagnostic exception.**

Input, intermediate state, and results exist on the user's device for the duration of the task, in
browser-managed execution space, and may use browser-managed temporary storage only under the
conditions defined in `security.md`. They are removed automatically when the task completes, when it
is cancelled, and when it is abandoned. They are not transmitted to any platform service, not queued,
not cached server-side, never become permanent platform data, and are not retained for convenience,
recovery, quality, or support.

This is reinforced structurally rather than by policy. `tech-stack.md` removed object storage from
the approved stack, and recorded that the capability is removed rather than merely restricted — there
is no approved place for such data to be written. Section 9 states the exclusion in full.

---

## 3. Entity Design Principles

These govern the shape of the model. They do not define it. No table, field, key, or relationship is
specified here or anywhere in the handbook; that is implementation work bound by these rules.

### 3.1 Clear Ownership

- Every entity has one owner and one reason to exist. An entity that serves two unrelated purposes
  is two entities.
- Every fact is authoritative in exactly one place. Duplication for convenience is prohibited;
  duplication for measured performance requires a named authoritative source, a defined
  synchronisation path, and an explanation of what happens when the copies disagree.
- Where an external system is authoritative, the platform holds a reference and does not attempt to
  hold a second opinion.
- Every record that belongs to an account is unambiguously attributable to it. Ownership is
  represented explicitly and is never inferred.

### 3.2 Normalization

- Normalised by default. A well-normalised model makes contradictory states difficult to express,
  which is the point.
- Denormalisation is a performance decision requiring measurement, not a convenience. It carries the
  obligations in 3.1 and is documented where it occurs.
- No general-purpose containers. A field, bag, or blob holding arbitrary structure has no
  constraints, cannot be validated, cannot be indexed meaningfully, and becomes the place where
  everything nobody wanted to model properly ends up. Structure is explicit.
- Enumerated states are constrained sets, not free text. An open field for a closed concept will
  accumulate variants.

### 3.3 Referential Integrity

- Relationships are enforced by the data layer, not assumed by application code. Application code is
  not the last line of defence; it is one of several, and it is the one most easily bypassed.
- Every relationship states what happens when the thing it points at goes away, and that decision is
  deliberate rather than inherited from a default.
- Orphaned records are impossible by construction, not cleaned up afterwards by a routine somebody
  has to remember to run.
- Invariants that must always hold are expressed as constraints. An invariant enforced only in code
  is an invariant that has already been violated somewhere.
- Uniqueness that matters is enforced where the data lives.

### 3.4 Identifiers

- Identifiers are opaque and carry no meaning. An identifier that encodes information couples
  everything that reads it to that encoding, permanently.
- Identifiers never contain personal information, and never reveal ordering, volume, or growth to
  anyone who sees one.
- Identifiers are stable for the life of the record. A changing identifier is not an identifier.

### 3.5 Temporal Fields

- Every record carries when it was created and when it last changed. This is the minimum required to
  diagnose anything after the fact.
- Time is recorded absolutely and unambiguously, in one representation throughout the model. Mixed
  representations produce errors that appear only under specific conditions and are found by users.
- Where the time of an event matters, the time of the event is recorded rather than the time it
  happened to be written.

### 3.6 Soft Deletes, Applied Deliberately

Soft deletion is a tool with a narrow purpose and a well-known failure mode. It is used where
reversibility genuinely matters and refused everywhere else.

- **Appropriate** where a record must remain referable after removal — most commonly where financial
  or audit integrity requires that a historical reference still resolve.
- **Never appropriate** as a substitute for real deletion of personal data. When a user asks for
  their data to be removed, marking it hidden is not removal; it is retention with a flag, and it is
  a breach of the promise made in section 5.5.
- Where a record is soft-deleted, it is genuinely inaccessible everywhere except the narrow context
  that requires it. A soft-deleted record that still appears in an ordinary query is a defect.
- Soft-deleted records have a defined end. They are not kept indefinitely because deleting them
  properly was never scheduled.
- The distinction between hidden, deactivated, closed, and deleted is explicit in the model. Where
  these are conflated, at least one of them is being handled incorrectly.

### 3.7 Immutable Audit History

- Audit records are append-only. They are never updated and never deleted in the ordinary course of
  operation.
- Corrections are appended. A history that can be rewritten has no evidential value, which is the
  only value it has.
- Audit history is structurally separate from operational data, so that operational change cannot
  alter it and operational deletion cannot remove it.
- The immutability of the audit trail is not a licence to record more in it. It is subject to the
  same minimisation as everything else, and section 2.9 defines its limits precisely because it is
  the category most likely to expand.

### 3.8 Future Extensibility

- The model is extended by adding, never by reinterpreting. An existing field acquiring a second
  meaning is the most common way a data model becomes unmaintainable, and it is prohibited.
- New concepts are modelled explicitly. They are not encoded into an existing structure that
  approximately fits.
- The model is not built for futures that have not been decided. `coding-standards.md` prohibits
  speculative generality, and it is more expensive here than anywhere else, because unused structure
  in a data model is permanent and is eventually filled with something it was not designed for.
- `vision.md` locks the product to individual users and five phases. The model therefore does not
  anticipate teams, seats, organisations, sharing, or collaboration, and must not be pre-built for
  them. Building for those futures would be building a different product.
- Extensibility does not extend to what may be stored. The exclusions in sections 1.5 and 9 are not
  a starting position to be relaxed as the product matures.

---

## 4. Privacy Principles

### 4.1 Data Minimisation Is The Design, Not A Setting

Minimisation here is not a configuration applied to a system that could collect more. It is the
reason the system is shaped the way it is. The product processes on the device specifically so that
there is nothing to minimise afterwards.

The database is the one place where the product does hold information about people, which is why
its contents are constrained more tightly than anything else in the handbook.

### 4.2 The Test For Storing Anything

Every field must pass all four before it exists:

1. **Necessity.** What specifically breaks if this is absent? An answer that describes an
   inconvenience is a rejection.
2. **Purpose.** What operational function consumes this, today, by name? Data with no current
   consumer is not collected.
3. **Minimality.** Is this the least that satisfies the purpose? A count instead of a history. A
   flag instead of a value. A reference instead of a copy. Absence instead of a default recorded.
4. **Alternative.** Can this be derived, defaulted, kept on the device, or simply not known?

A field that passes is added with its purpose recorded. A field that fails is not added, and the
absence of that field is not revisited because someone later finds a use for it.

### 4.3 Standing Prohibitions

- **No user content, in any form.** Not files, not fragments, not derivations, not file names, not
  measurements taken from them.
- **No behavioural record of individuals.** Not what tools were used, not when, not how often, not
  in what sequence.
- **No profiling or inference.** The platform does not derive attributes about people, score them,
  segment them, or predict their behaviour.
- **No collection for potential value.** Every field has a present purpose or it does not exist.
- **No third-party trackers, advertising identifiers, or data brokerage.** `vision.md` excludes the
  advertising and data business permanently, and there is no internal equivalent.
- **No enrichment.** Information about a user is never augmented from external sources.
- **No identification of people who have no account.** Anonymous use stays anonymous, structurally.

### 4.4 Minimisation Applies Everywhere Data Travels

The constraint follows the data rather than living in the database.

- Diagnostics, error reports, and monitoring carry no user content and no personal information beyond
  what is strictly required to investigate a platform fault. `coding-standards.md` states this as an
  absolute and it is restated here because the data model is where the temptation to relax it
  originates.
- Backups, exports, and any copy of the data inherit every restriction that applies to the original.
  A copy is not a lesser artefact.
- Production data is never copied into development, testing, demonstration, or analysis
  environments. Where realistic data is needed, it is synthetic and owned by us.
- Third parties receive the minimum required to perform their function and nothing beyond it.

### 4.5 The User Should Be Able To Predict What We Hold

An account holder asking what SimpleTools knows about them should find the answer short, complete,
and unsurprising: that they have an account, how to reach them, what plan they are on, what they have
chosen, and a record of changes to those things.

If the honest answer would ever be longer or more interesting than that, something has gone wrong
that a policy cannot fix.

---

## 5. Data Lifecycle

### 5.1 Creation

- Nothing is created until it is genuinely needed. No account is created for someone who has not
  asked for one, and no record is pre-provisioned in anticipation.
- Records are created valid and complete. Partially initialised records that other code is expected
  to finish later are a defect, because the intermediate state is representable and will occur.
- Creation is validated at the boundary before it reaches storage, and the constraints of section 3.3
  are the second line, not the first.
- Creation of anything security-relevant or money-relevant is audited.

### 5.2 Updates

- Updates are deliberate and complete. Partial updates that leave a record in a contradictory state
  are prevented by construction.
- Where a change matters — plan, entitlement, payment state, access — the change is audited. Where it
  does not, it is not, and the audit trail stays small enough to be useful.
- State transitions are explicit and validated. Not every state can be reached from every other, and
  the model says which.
- Concurrent modification is handled deterministically. Where two changes conflict, the outcome is
  defined rather than whichever arrived last.
- An update never silently reinterprets what a field previously meant. Reinterpretation is a schema
  change with a migration path, not an update.

### 5.3 Retention

- **Nothing is retained by default.** Every category has a defined retention period and a stated
  reason. A category with no stated period is not retained.
- Retention periods are the minimum that satisfies the purpose. Where an external obligation sets a
  period — as it does for financial records — that period is the ceiling and the data is reduced to
  the minimum that satisfies it.
- Counters are retained only as long as the period they govern. Concluded periods are not kept as
  history.
- Expiry is enforced automatically. Retention that depends on someone remembering to run something
  is not retention policy; it is indefinite retention with an intention attached.
- Backups have a defined lifetime and are not a route by which deleted data survives indefinitely.
- The specific periods are recorded where they are operationally enforced and are stated to users.
  They are not invented in this document.

### 5.4 Deletion

- Deletion is real. Where a record is deleted, it is gone from live storage and, within the defined
  backup lifetime, from every copy.
- Deletion propagates. Related records are removed or anonymised deterministically, per the
  relationship rules in section 3.3. Fragments left behind are a defect.
- Where something genuinely must survive deletion — the minimum financial record an external
  obligation requires — it survives reduced to that minimum, severed from personal information
  wherever severance is possible, and the fact that it survives is disclosed rather than discovered.
- Deletion is audited: that it was requested, and that it completed.

### 5.5 User-Controlled Data Removal

An account holder can remove their account and their data, and the process is designed to be easy
rather than survivable.

- **Self-service.** No support ticket, no email exchange, no negotiation, no explanation required.
- **No dark patterns.** No retention offer, no discount at the point of leaving, no repeated
  confirmation, no guilt, no path that ends where it started. `product-principles.md` places trust
  above short-term monetisation, and the moment a user leaves is where that principle is actually
  tested.
- **Clear before it happens.** The user is told exactly what will be removed, what will survive and
  why, and whether it is reversible — before they confirm, not after.
- **Complete.** Removal means removal, not deactivation, not a hidden flag, not a record marked
  closed. Section 3.6 exists specifically to prevent soft deletion being used to avoid this.
- **Within a defined and stated period**, propagated to every copy including backups within their
  defined lifetime.
- **Confirmed.** The user is told when it is done.
- **Export first.** A user can obtain what we hold before removing it, in a form they can actually
  read. Given how little is held, this should be a small and unremarkable file — which is the
  intended outcome, not a limitation.
- Cancelling a subscription and deleting an account are different actions with different
  consequences, and the difference is stated plainly rather than assumed.

---

## 6. Security Expectations

These are goals for the data layer. `security.md` owns the controls that achieve them, and
`tech-stack.md` owns the technology that implements them. No mechanism is specified here.

### 6.1 The Strongest Control Is Structural

The most effective protection over user material is that it was never stored. No access policy,
encryption scheme, or monitoring regime is as strong as absence, and none of them can be
misconfigured into failure.

Every control below protects account and platform data. None of them is protecting user files,
because there are none, and the value of that property is the reason section 1.5 is absolute.

### 6.2 Access Is Denied By Default

- No access exists until it is explicitly granted for a stated purpose.
- Every account's data is accessible only to that account, and the restriction is enforced at the
  data layer rather than relying on application code to remember to filter. A query written
  incorrectly must not be able to return another person's record.
- Least privilege throughout. Every credential, service, and person has the narrowest access that
  permits their function, and no broadly-privileged ambient credential exists for convenience.
- Administrative access to account data is exceptional, justified, individually attributable, and
  audited. It is never routine and never anonymous.
- Access grants are reviewed and revoked when no longer required. Accumulated access is how a small
  compromise becomes a large one.

### 6.3 Data Is Protected In Transit And At Rest

- Everything is encrypted in transit, without exception and without a downgrade path.
- Data is encrypted at rest, and this is treated as a baseline rather than an achievement.
- Secret material never lives in the data model. Credentials, keys, and tokens are managed as secrets
  and are not fields.
- Sensitive values are never written to logs, diagnostics, error reports, or monitoring.

### 6.4 Environments Are Separated

- Production data exists only in production. It is never copied into development, testing,
  demonstration, or analysis environments, in whole or in part.
- Non-production environments use synthetic data owned by us.
- Access to production is separately controlled and separately audited.

### 6.5 Integrity And Recoverability

- Backups exist, are protected to exactly the standard of the live data, and are restorable. A backup
  that has never been restored is a hypothesis.
- Backups have a defined lifetime and do not become the route by which deleted data persists.
- The data layer is the last line of defence for correctness, not the first. Constraints exist so
  that an application defect cannot write an invalid state.
- Changes to structure are reversible or have a stated forward path. A change that can only go
  forward and might be wrong is not applied.

### 6.6 Detection And Response

- Security-relevant events are audited immutably, per section 3.7.
- The audit trail is sufficient to reconstruct what happened to an account, and is protected from
  modification by the systems it records.
- The blast radius of any compromise is bounded by how little is stored. That bound is a design
  outcome, and every proposal to store more reduces it.

---

## 7. Performance Principles

Stated without reference to any particular database technology, which is owned by `tech-stack.md`.

### 7.1 Performance Here Never Affects Whether A Tool Works

Because no platform service sits on the critical path of a core task, database performance affects
account, billing, and preference operations only. A slow database makes signing in slow. It does not
make splitting a document slow, and it must never be permitted to.

This is a design property to be preserved, not an assumption. Any change that would make a tool's
completion depend on a query is a violation of `architecture.md` and is rejected.

### 7.2 Efficient Queries

- Access patterns are understood before the model is shaped. A model designed without reference to
  how it will be read produces queries that cannot be made fast afterwards.
- Every query is bounded. No query returns an unbounded result set, and pagination is the default for
  anything that can grow.
- No query on a user-facing path has a cost that grows with the total size of the platform. A single
  account's operations cost the same whether the platform has a thousand accounts or a million.
- Repeated queries in loops are a defect, not an optimisation opportunity.
- Queries are written to be understood. `coding-standards.md` applies here without modification: a
  query nobody can read is a query nobody can safely change.

### 7.3 Index Planning

- Indexes are planned deliberately against real access patterns, not added in response to a slow
  query without understanding why it is slow.
- Every index is justified, and its justification is recorded. Indexes are not free — they cost write
  performance, storage, and maintenance on every change to the data they cover.
- Redundant and unused indexes are removed. An index nothing uses is pure cost.
- Uniqueness that matters is expressed as a constraint, which is a correctness decision that happens
  to have a performance consequence, not the reverse.

### 7.4 Scalability

- **Platform data scales with accounts, not with tools and not with work performed.** Because no user
  content is stored, shipping the two-hundredth tool adds nothing to the database. A user processing
  a thousand files adds nothing beyond a counter increment where a limit requires one. This is the
  single most important scalability property the platform has, and it is a direct consequence of
  processing on the device.
- Growth is therefore predictable and slow, and the model must not introduce any category whose size
  grows with usage rather than with accounts.
- High-frequency writes must not contend. Where counting is required, it must not require a write on
  a path the user is waiting on.
- Nothing in the model requires coordination that would prevent it from being operated simply.
  `architecture.md` requires low operational overhead, and a data model that demands constant
  attention violates it regardless of how well it performs.

### 7.5 Data Integrity

- Correctness outranks performance. An optimisation that admits an invalid state is not an
  optimisation.
- Invariants live in the data layer as constraints. Application code enforces them too; it does not
  enforce them alone.
- Operations that must succeed or fail together do so atomically. Partially applied changes are
  representable only if the model permits them, and it should not.
- Any denormalised copy has a defined authoritative source and a defined reconciliation path.
- Measurement precedes optimisation, in both directions. "This is fast enough" requires evidence just
  as "this is too slow" does.

---

## 8. Future Expansion

The product is expected to run for many years. The data model must be able to change without
breaking, while remaining incapable of drifting into holding what it must not.

### 8.1 Expansion Is Additive

- New capability adds new structure. It does not reinterpret existing structure.
- An existing field never acquires a second meaning, a special value, or a context-dependent
  interpretation. This is the most common route to an unmaintainable model and it is prohibited
  outright.
- New structure is optional on arrival. Existing records remain valid without it, and code that
  predates it continues to work.
- Removal is a separate, deliberate step taken after nothing depends on the thing being removed —
  never combined with the change that stops using it.

### 8.2 Change Is Backward Compatible And Reversible

- Old and new coexist during transition. Nothing requires everything to change at once.
- Every structural change has a stated forward path and, where possible, a way back. A change that
  can only go forward and might be wrong is not applied.
- Structural change is small and separate, per the upgrade discipline in `tech-stack.md`. Several
  changes bundled together cannot be reasoned about or reversed independently.
- A change that would invalidate existing data is not a change; it is a migration, and it is planned
  as one.

### 8.3 What Expansion May Never Do

These are not defaults to be relaxed as the product matures. They are the boundaries of the model.

- **It may never introduce user content.** Not files, not fragments, not derivations, not file names.
  No future capability justifies it, and any proposal that requires it is a proposal for a different
  product.
- **It may never place the database on the critical path of a core task.** Tools complete without it,
  permanently.
- **It may never introduce per-individual behavioural tracking**, however it is labelled.
- **It may never add a category that grows with usage rather than with accounts.**
- **It may never build structure for teams, seats, organisations, sharing, or collaboration.**
  `vision.md` excludes them, and pre-building for them is both speculative generality and an
  invitation to the product this one is not.

### 8.4 How A Genuine New Requirement Is Handled

When a future capability genuinely requires something the model does not hold, the sequence is fixed:

1. State what breaks without it, specifically.
2. Apply the four tests in section 4.2 in full.
3. Confirm it violates nothing in section 8.3.
4. Take it to the project owner.
5. Amend this document.
6. Then implement.

The document is amended before the model is, not after. A model that has drifted ahead of its
documentation is a model nobody can reason about, and `vision.md` establishes that the documentation
is the source of truth.

### 8.5 The Model Should Stay Small

A data model that grows as fast as the product is a data model absorbing things that belong
elsewhere. Because the utilities are self-contained and store nothing, adding tools should leave the
model untouched for long stretches.

A period of no change to this model is a sign of health, not of neglect. `vision.md` states that a
tool may be finished; the same is true here.

---

## 9. Out Of Scope

The following are **never persisted by the platform** for browser-capable utilities. This list is
absolute, has no temporary exception, no diagnostic exception, and no support exception.

- **Uploaded documents** — of any kind, in any format.
- **PDF files** — in whole, in part, or page by page.
- **Images** — originals, converted versions, thumbnails, or previews.
- **Videos** — including frames, stills, or extracted tracks.
- **Audio** — including clips, samples, or waveforms.
- **Temporary processing data** — intermediate state, working buffers, queues, caches, or anything
  produced between input and output.
- **Generated outputs** — results, exports, downloads, or archives, whether or not the user retrieved
  them.

Equally excluded, because they are the same information in a different form:

- File names, paths, and any metadata read from a user's file.
- Text, values, or records extracted from user content.
- Measurements taken from user content — sizes, page counts, record counts, durations, dimensions.
- Checksums, hashes, fingerprints, embeddings, or any representation derived from user content.
- Samples retained for quality, debugging, testing, support, or research.
- Any record associating an identified person with a specific piece of material.

**Where this data lives.** On the user's device, in browser-managed execution space, for the duration
of the task. Where a workload genuinely cannot complete there, it may use browser-managed temporary
storage, permitted only under the conditions set by `security.md`. In either case the data is not
transmitted, not queued, not cached by any platform service, and never becomes permanent platform
data. It is removed automatically when the task completes, when it is cancelled, and when it is
abandoned. That is the entire lifecycle, and it is the product's central promise.

**Why this holds structurally.** `architecture.md` states that no platform service ever receives user
content. `tech-stack.md` removed object storage from the approved stack and recorded that the
capability is removed rather than restricted. There is therefore no approved location for this data
to be written and no approved dependency capable of transmitting it. The prohibition is enforced by
the absence of the means, not only by this rule.

**Server-side processing.** Should a future utility be genuinely impossible to implement in the
browser, it requires explicit approval from the project owner before it exists. Approval of such a
tool is not approval to persist anything, and nothing in this section is relaxed by it. Any retention
whatsoever would require this document to be amended first, deliberately and in writing.

---

## Boundaries And Change Control

This document owns the data architecture: why persistence exists, what may and may not be stored,
who owns each category, how entities are shaped, how data is minimised, how it lives and dies, what
the data layer must guarantee about security and performance, and how the model may grow.

It does not own the technology (`tech-stack.md`), the schema or any implementation of it, operational
security controls (`security.md`), release and environment operations (`deployment.md`), plan
definitions and limits (`pricing.md`), or the interface through which users manage their data
(`design-system.md`).

Where this document conflicts with `vision.md`, `product-principles.md`, `architecture.md`,
`tech-stack.md`, `coding-standards.md`, or `design-system.md`, those documents are correct and this
one is amended.

Nothing here changes without explicit instruction from the project owner.
