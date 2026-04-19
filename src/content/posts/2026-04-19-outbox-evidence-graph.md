---
title: 'The Outbox Pattern and the Evidence Graph'
description: 'How a reliable event delivery mechanism becomes the foundation for incremental SOX audit evidence — correlating reconciliations, documents, and approvals as they arrive.'
date: 2026-04-19
tags: [distributed-systems, patterns, fintech, sox]
slug: 2026-04-19-outbox-evidence-graph
---

SOX compliance is fundamentally an evidence problem.

Every financial control — every reconciliation, every approval, every exception resolution — needs to be provably evidenced for the audit period. Not eventually. Not approximately. Completely. Auditors pull samples, trace them back through your control framework, and if a link in the chain is missing, it's a finding. Enough findings and you have a deficiency. A bad enough deficiency and you have a material weakness, which is a very bad day for a public company's finance team.

At Bluecopa, we build tooling for exactly this layer — the post-reconciliation evidence that underpins SOX Section 404 compliance. What we kept running into was a fundamental mismatch between how financial close processes work in practice and what audit evidence systems expect.

## Evidence Arrives in Pieces

When a company closes its books, what follows isn't a single event — it's a sequence spread across days.

A preparer submits a balance sheet reconciliation on Day 3 post-close. The supporting document gets uploaded on Day 5. The first-level reviewer signs off on Day 7. An exception gets raised, then resolved with a journal entry by Day 10. The CFO-level approver certifies the control on Day 12. An external auditor samples that recon during fieldwork on Day 30.

Each of those steps happens in a different system: the ERP, a document management platform, an approval workflow, a GRC tool. Each step is independently meaningful. But the audit evidence for a given control is the complete chain — not any single step.

The question the system needs to answer at any moment is: _for this control, for this period, how complete is the evidence?_ And that question changes as each new step arrives.

## The Evidence Graph

We model this as a graph where nodes are entities — Controls, Reconciliations, Periods, Documents, Users, Exceptions, Journal Entries — and edges are the relationships between them.

A reconciliation is evidence for a control. It covers a period. It's supported by a document. It was prepared by a user and reviewed by another. An exception raised within it was resolved by a journal entry. The graph looks roughly like:

```
Control ← IS_EVIDENCED_BY ← Reconciliation
Reconciliation → COVERS → Period
Reconciliation ← SUPPORTS ← Document
Reconciliation ← REVIEWED_BY ← User (reviewer)
Reconciliation ← PREPARED_BY ← User (preparer)
Reconciliation → RAISED → Exception
Exception → RESOLVED_BY → JournalEntry
```

As each step completes in the underlying systems, a new node or edge is added to the graph. At any point, you can traverse from a Control node and ask: what's the evidence coverage for Q1? Which recons are missing approvals? Which exceptions are unresolved heading into the audit window?

The graph doesn't answer those questions at close time or at audit time. It answers them continuously, as evidence accumulates.

## The Outbox Problem

For this to work, the graph needs a complete and reliable stream of events from every upstream system. And here's where things get difficult in practice.

The naive approach — write to your database, then publish an event to the message broker — is not atomic. If the reconciliation service records a recon submission and then crashes before emitting the event, the graph never learns about it. That reconciliation exists in the ERP, but the evidence graph has a gap. During an audit, a gap isn't a minor inconsistency. It means manually hunting down documentation to prove something happened that the system has no record of.

The outbox pattern solves this by treating event publication as part of the same transaction as the business operation. When a preparer submits a reconciliation, the recon service writes both the reconciliation record and an outbox event in a single atomic commit:

```sql
BEGIN;

INSERT INTO reconciliations (id, control_id, period, prepared_by, status)
  VALUES ('recon-001', 'ctrl-cash-01', '2026-Q1', 'user-42', 'submitted');

INSERT INTO outbox (aggregate_id, event_type, payload, published)
  VALUES (
    'recon-001',
    'reconciliation.submitted',
    '{"control_id": "ctrl-cash-01", "period": "2026-Q1", "prepared_by": "user-42"}',
    false
  );

COMMIT;
```

A relay process reads unpublished outbox rows and publishes them to the event bus, marking each row published only after the broker confirms receipt. The reconciliation service never touches the broker directly. Either both the recon record and the outbox event land, or neither does.

Every upstream system — ERP, document store, approval workflow — follows the same pattern. The relay becomes a single, reliable event stream. The evidence graph consumes from it.

## Building the Graph Incrementally

The graph processor subscribes to the relay's event stream. When `reconciliation.submitted` arrives:

1. Find or create the `Control` node for `ctrl-cash-01`
2. Create the `Reconciliation` node for `recon-001`
3. Draw `Reconciliation → IS_EVIDENCE_FOR → Control`
4. Draw `Reconciliation → COVERS → Period(2026-Q1)`
5. Draw `User(user-42) → PREPARED → Reconciliation`
6. Update the control's evidence coverage signal: one recon submitted, awaiting document and approval

When `document.attached` arrives two days later:

1. Find the `Reconciliation` node
2. Create the `Document` node
3. Draw `Document → SUPPORTS → Reconciliation`
4. Coverage signal updates: document present, still awaiting approval

When `reconciliation.approved` arrives:

1. Find the `Reconciliation` and the approver's `User` node
2. Draw the approval edge
3. Check: is the approver's authority level sufficient for this control's risk rating?
4. Coverage signal updates again

At no point does any of this require re-querying the source systems. The graph has accumulated context from each event as it arrived. By the time an auditor pulls a sample, the traversal from the Control node to its complete evidence chain is already built.

## What This Changes

The usual framing of the outbox pattern is reliability: it's how you guarantee at-least-once delivery when your application database and your message broker don't share a transaction boundary. That framing is accurate but incomplete in this context.

For a SOX evidence system, the outbox is what makes completeness guarantees possible. Audit evidence is only trustworthy if the event stream that builds it is complete. A dropped event isn't a performance problem — it's a gap in the evidentiary record. That gap might surface three weeks later when an auditor traces a control and finds a missing approval in the system that the finance team insists happened.

By routing every domain event through the outbox relay, you get a single ordered stream that the evidence graph consumes on its own schedule. New events extend the graph. New edges might retroactively satisfy conditions that were pending — a document uploaded late but still within the audit window. The graph reflects what actually happened and when, not what a point-in-time query of the ERP happens to show at the moment the auditor asks.

SOX compliance requires proving that controls operated effectively over an entire period. An evidence graph built on a complete event stream is how you make that proof systematic rather than a spreadsheet scramble every audit cycle. The outbox is what keeps the stream complete enough to trust.
