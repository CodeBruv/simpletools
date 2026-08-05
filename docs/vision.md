# SimpleTools — Vision

**Status:** Locked. Changes require explicit instruction from the project owner.

This document states why SimpleTools exists, who it serves, what it is trying to fix, and what it
is meant to become. It is the first document in the handbook and every other document inherits
from it. It contains no implementation detail by design.

---

## 1. What SimpleTools Is

SimpleTools is a browser-first web application containing a growing collection of small,
single-purpose productivity utilities for individual users.

Each utility solves exactly one problem, completely, in the browser, on the user's own device.

That is the entire product. It is not a suite, a platform, a workspace, or a service that grows
into one.

---

## 2. Why SimpleTools Exists

Everyday work is full of small, unavoidable tasks. Split a PDF. Convert an image. Strip formatting
from pasted text. Reformat a block of data. None of these tasks are hard. All of them are frequent.

The tools that exist to serve them are, with few exceptions, hostile to the person using them.
They demand an upload before they show any value. They interrupt with advertising. They stamp the
result with a watermark and then sell the removal of that watermark. They require an account to do
something that takes two seconds of computation. They queue a trivial job behind a progress bar to
manufacture the impression of effort.

The result is a daily indignity that most people have simply accepted: to remove one page from one
private document, you must first hand that document to a stranger.

SimpleTools exists because this is a solved problem that nobody has bothered to solve well.

A modern browser is a capable computer. The overwhelming majority of these tasks can be performed
on the user's own machine, instantly, without the file ever travelling anywhere. When the work
happens locally, four things follow at once:

- The privacy question disappears, because there is nothing to trust us with.
- The waiting disappears, because there is no upload, no queue, and no download.
- The cost of serving a user approaches zero, which makes an honest, cheap subscription viable.
- The incentive to monetise through advertising and manipulation disappears with it.

The last point is the important one. Most tool sites behave badly because their economics require
it. Ours do not. SimpleTools is built so that treating people well and running a sustainable
business are the same decision, not competing ones.

---

## 3. The Problems We Are Solving

These are the specific failures SimpleTools exists to correct. Every utility we ship must improve
on at least one of them and must not regress any of the others.

**Problem 1 — Privacy is surrendered by default.**
Existing tools require the user to upload private material — contracts, invoices, medical records,
identity documents, unreleased work — to an unknown operator with unknown retention, for a task
that never needed to leave the device. SimpleTools performs the work locally. For any utility that
a browser can perform, user files are never uploaded.

**Problem 2 — Friction arrives before value.**
Signup walls, email capture, cookie negotiations, and interstitials all sit between the user and a
task that should take seconds. A person arriving with a problem should be solving it immediately.

**Problem 3 — Monetisation is deceptive.**
"Free" tools that watermark the output, silently cap the result, or reveal a paywall only after
the work is done are lying about what they are. If a plan is free, the tool must actually work.

**Problem 4 — Simple tools are buried in complexity.**
Utilities are bundled into sprawling editors and suites where the single needed function is four
menus deep behind features the user did not want. Focus is the feature.

**Problem 5 — Slowness is manufactured.**
Uploads, queues, and artificial progress bars turn instant operations into minute-long ones.
Speed is not a nice-to-have here; it is the product.

**Problem 6 — Every task means finding another untrusted site.**
People keep a mental list of one disposable site per task, none of them trusted, all of them
re-evaluated each time. SimpleTools is meant to end that search permanently.

---

## 4. Who SimpleTools Is For

**Individual users.** One person, solving their own problem, on their own device. Not teams, not
departments, not organisations.

**Tier 1 markets, English-first.** The United States, the United Kingdom, Canada, Australia, and
Western Europe. These users have a high willingness to pay a small amount for something that
respects them. The interface is English for the entire roadmap.

Concretely, the person we are building for is someone who:

- Hits a small, specific task during real work and wants it finished now, not learned.
- Handles material they would rather not upload anywhere.
- Recognises a watermark-and-upsell trap and resents it.
- Will pay a small monthly amount to stop hitting limits, and will pay nothing for features they
  did not ask for.

### Who SimpleTools Is Not For

Stating this plainly is what protects the product. SimpleTools is not built for:

- Teams, organisations, or any use requiring shared accounts, seats, or collaboration.
- Enterprises requiring administration, compliance programmes, or procurement.
- Developers seeking a programmatic service to build on top of.
- Users needing a non-English interface or regional pricing.
- Users wanting a single application that does everything.
- Automated, unattended, or high-volume machine processing.

Requests from these groups are not opportunities. They are the beginning of a different product,
and answering them would destroy this one.

---

## 5. What SimpleTools Is Not

A permanent list of things this product will never become:

- Not an all-in-one suite. Utilities stay separate and stay small.
- Not a collaboration product. There is nothing to share, no team, no workspace.
- Not a storage product. We are not a place where files live.
- Not an advertising business. Attention is not the product.
- Not a data business. Usage is not harvested, brokered, or resold.
- Not dependent on artificial intelligence. Every tool is deterministic, and the same input
  produces the same output, every time, forever.
- Not a platform for others to build on.
- Not a product that ships a feature because a competitor has one.

---

## 6. The Long-Term Vision

The roadmap is permanently locked at five phases, delivered in order:

| Phase | Scope |
| ----- | ----- |
| Phase 1 | PDF Utilities |
| Phase 2 | File Conversion |
| Phase 3 | Text Utilities |
| Phase 4 | Developer Utilities |
| Phase 5 | Browser Productivity Utilities |

No phase is added, removed, reordered, or reinterpreted to admit work it was not meant to contain.

**The end state.** When Phase 5 has shipped, SimpleTools is the place an individual goes by reflex
for a small computing task. Not because it is the only option, but because it is the one that is
faster than the alternatives, does not ask for anything, does not put their files at risk, and has
never once wasted their time.

At that point the product is finished in the way a good hand tool is finished. Success is not a
sixth phase. Success is a collection of utilities that have each stopped changing because they are
correct, maintained indefinitely, and still opening instantly a decade later.

We are trying to build something small that lasts, not something large that grows.

---

## 7. How We Pay For It

Two plans exist. There will not be a third.

**Free** is fully functional. Every tool is available. No tool is ever locked behind payment, and
no output is ever degraded, watermarked, or truncated to advertise an upgrade. No account is
required to use SimpleTools.

**Pro** raises ceilings only — the volume, size, and convenience limits of work already possible on
Free. It grants no exclusive tools. An account exists for exactly one purpose: to hold a Pro
subscription.

The upgrade must always be an obvious convenience to a satisfied user, never a ransom on a
frustrated one. If we ever need to make the free experience worse to sell the paid one, the paid
one is not worth selling.

Plan definitions and limits are owned by `pricing.md`.

---

## 8. What Success Looks Like

**A tool is done** when it solves its single problem completely, works on the first attempt without
instruction, and has no remaining reason to change. Finished tools are a goal, not a stalled
backlog.

**The product is succeeding** when:

- People return by preference rather than by lock-in, because nothing holds them.
- The reason they return is speed and trust, not accumulated data.
- Users can explain what any tool does from its name alone.
- Nobody has to be told their files are safe, because nothing is ever sent.
- The list of phases has not grown.

**The product is failing** if it becomes slower, broader, harder to explain, or dependent on the
user's data — regardless of what the revenue is doing.

---

## 9. How We Decide

Every proposed tool, feature, or change must pass all six tests. Failing one is a rejection, and a
strong result on the others does not compensate.

1. **One problem.** Does it solve exactly one problem, completely? A tool that solves two problems
   partially is two tools, or none.
2. **Local.** Can it run on the user's device? If a browser can do this work, it does, and the
   file never leaves.
3. **In scope.** Does it belong to one of the five locked phases, as that phase was originally
   meant? A generous reinterpretation of a phase is a new phase.
4. **Individual.** Does it serve one person working alone, with no shared, team, or organisational
   assumption anywhere in it?
5. **Deterministic.** Does it produce the same output for the same input, always, with no reliance
   on artificial intelligence or any external service to decide the result?
6. **Subtraction.** Does it make the product simpler or faster for someone who will never use it?
   If it slows down, complicates, or clutters the experience of an uninterested user, the answer
   is no.

When a proposal is genuinely valuable but fails a test, the answer is still no. The tests exist
precisely for the proposals that are tempting; the weak ones never needed defending against.

When these tests conflict with each other or do not settle the question, the decision escalates to
the project owner. It is never resolved by assumption.

---

## 10. Terms

Fixed meanings, used consistently across the handbook.

- **Tool** — a single user-facing utility that solves one problem. The unit we ship.
- **Utility** — interchangeable with Tool.
- **Phase** — one of the five locked roadmap stages. A closed set of five.
- **Individual user** — one person acting for themselves. Never a team, seat, or organisation.
- **Tier 1** — the United States, United Kingdom, Canada, Australia, and Western Europe.
  English-first, no localisation.
- **Browser-capable** — describes a tool whose work a modern browser can perform on the user's own
  device. Every browser-capable tool processes locally and uploads nothing.
- **Free** — the plan requiring no account and no payment, with every tool fully functional.
- **Pro** — the paid plan, which raises limits only and unlocks no exclusive tools.
- **Done** — a tool that solves its problem completely and has no remaining reason to change.

---

## 11. Authority

This document explains **why** SimpleTools exists. It deliberately says nothing about how it is
built.

Where another handbook document contradicts this one, this document is correct and the other is
amended.

Nothing here changes without explicit instruction from the project owner.
