# Canonicalisation discipline (normative, shared)

> **Status**: v3 — three-voice coalition sign-off (AlgoVoi + Vauban Pay + FeedOracle, 2026-05-21)
>
> Extensions referencing this section MUST cite a specific `canon_version` value.
> Current version: `jcs-rfc8785-v1`.

Extensions that produce a content-bound digest over an attestation, receipt,
or work-binding object MUST use the following derivation:

```
JCS_hash = SHA-256( JCS(RFC 8785)( object ) ), lowercase hex.
```

Schema normalisation MUST be applied BEFORE canonicalisation. In particular:

- **Timestamps**: the `timestamp_ms` field MUST be a JSON integer (milliseconds
  since Unix epoch). RFC 3339 string forms are NOT acceptable as the canonical
  preimage form — they admit multiple lexically distinct encodings of the same
  semantic instant which produce different `JCS_hash` values.

- **Field names**: are load-bearing opaque bytes under RFC 8785. Renaming a
  field while preserving its value produces a different `JCS_hash`. Schemas
  MUST pin field names exactly; aliases at the wire layer MUST be normalised
  to the canonical name before canonicalisation.

- **Arrays**: element order is preserved under RFC 8785. Arrays are NOT sorted
  during canonicalisation. `["EU","UK"]` and `["UK","EU"]` produce different
  canonical bytes and different `JCS_hash` values. Schemas that require a
  canonical array order MUST specify it at the schema level, not rely on
  JCS to impose one.

- **Type validation**: occurs before canonicalisation. Verifiers MUST reject
  non-conforming inputs (wrong scalar type, missing required fields,
  duplicate keys, non-normalised Unicode where the schema pins a normalisation
  form) at the parse or schema-validation step — NOT by coercing to canonical
  form before computing `JCS_hash`. Producer-side violations fail loudly at
  conformance test; verifier-side coercion fails silently as cross-observer
  disagreement months later, AND breaks re-verifiability at audit time
  because the coercion step is verifier-local and will not be replayed
  identically by a supervisor running the canonical rule against the raw
  retained object.

## Retention property

Canonicalisation determinism is a retention obligation as well as a
cross-observer property. Objects produced for frameworks with retention
obligations (MiCA Art. 80, AMLR Art. 56, DORA Art. 14) MUST be
re-verifiable against the canonicalisation rule version under which they were
emitted. A supervisor re-verifying at year 5 against a retained off-VM manifest
needs identical canonical bytes across that gap; the rule version must be
determinable without reference to the emitting system's current configuration.

Producers SHOULD include the `canon_version` field they emitted under.
Producers emitting objects under a framework with a statutory retention
obligation (e.g. MiCA Art. 80, AMLR Art. 56, DORA Art. 14) MUST include
`canon_version`, since re-verifiability against the contemporaneous rule is
constitutive of the retention obligation rather than optional. Verifier-side
coercion (rather than rejection) of non-conforming inputs breaks
re-verifiability at audit time and is non-conforming.

## Versioning

This section is versioned independently of the core x402 specification.
The `canon_version` field is semver-pinned at section-file revisions.
A revision that changes any normative rule above MUST increment the
`canon_version`; downstream extensions referencing this section MUST
cite a specific version. The current version is `jcs-rfc8785-v1`.

## Conformance vectors

Conformance vectors documenting the above invariants are published in
`fixtures/canonicalisation-substrate/v0/` in this repository (PR #2412).
The canonical sources are retained as auditor-pinnable references:

| Layer | Set | Vectors | Pair invariants | Source |
|---|---|---|---|---|
| Attestation | `privacy_class_v0.1` | 13 | 12 | `fixtures/canonicalisation-substrate/v0/` |
| Work-receipt | `ctef_aps_v1` | 14 | 12 | `fixtures/canonicalisation-substrate/v0/` |
| Mandate | `ap2_omh_v0` | 7 | 4 | `fixtures/canonicalisation-substrate/v0/` |
| Chain-envelope | `per_chain_envelope_v0` | 19 | 9 | `fixtures/canonicalisation-substrate/v0/` |
| **Cumulative** | | **53** | **37** | |

All 53 vectors are cross-validated byte-for-byte across five reference JCS
implementations: Python (`rfc8785@0.1.4`), JavaScript (`canonicalize@3.0.0`),
Go (`gowebpki/jcs v1.0.1`), Java (`cyberphone/json-canonicalization`),
Rust (`serde_jcs@0.2.0`) — four non-overlapping library author sets.
265 byte-for-byte agreements. Single-file runners for all five languages
are available in `tests/cross-impl/` in
[agentgraph-co/agentgraph](https://github.com/agentgraph-co/agentgraph)
(PR #21, targeting `v0.3.3-cross-extension-matrix`).

A conforming implementation in any of the five listed languages produces
canonical bytes that match every other listed implementation byte-for-byte.

## Cross-protocol applicability

The same canonicalisation discipline applies to:

- x402 payment receipts (`receipt_format` extension, `fixtures/action-ref-verify/v0/` per PR #2398)
- AP2 open mandate hash (`google-agentic-commerce/AP2#265`, fixtures at `code/sdk/schemas/ap2/conformance/open_mandate_hash/`)
- Hybrid-PQC receipt cores (`fixtures/hybrid-pqc/v0/` per PR #2411)

A downstream library consuming both AP2 mandate receipts and x402 payment
receipts derives identical canonical bytes under the same rule. Single
canonicalisation discipline across protocol surfaces.

## URI

Extensions referencing this section SHOULD use the stable URI:

```
urn:x402:canonicalisation:jcs-rfc8785-v1
```

---

*Section co-authored by AlgoVoi (@chopmob-cloud), Vauban Pay (@seritalien),
and FeedOracle (@feedoracle). Retention-property clause owned by FeedOracle;
substrate Rust runner + IETF I-D track (`draft-vauban-x402-stark-receipts-00`)
owned by Vauban Pay; architectural skeleton + JCS discipline + per-chain
anchor owned by AlgoVoi. Pull requests to revise any normative rule, bump
the version, or extend the conformance set MUST tag all three authors.*
