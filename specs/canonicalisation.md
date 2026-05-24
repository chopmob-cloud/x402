# Canonicalisation discipline (normative)

> **Status**: AlgoVoi-authored sole-author submission, 2026-05-24.
> Anchors to IETF Internet-Draft
> [`draft-hopley-x402-canonicalisation-jcs-v1-00`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/)
> (Independent Submission, Informational, POSTED 2026-05-24) as the
> canonical normative source.
>
> Extensions referencing this section MUST cite a specific
> `canon_version` value. Current version: `jcs-rfc8785-v1`.

Extensions that produce a content-bound digest over an attestation,
receipt, or work-binding object MUST use the following derivation:

```
JCS_hash = SHA-256( JCS(RFC 8785)( object ) ), lowercase hex.
```

Schema normalisation MUST be applied BEFORE canonicalisation. In
particular:

- **Timestamps**: the `timestamp_ms` field MUST be a JSON integer
  (milliseconds since Unix epoch). RFC 3339 string forms are NOT
  acceptable as the canonical preimage form — they admit multiple
  lexically distinct encodings of the same semantic instant which
  produce different `JCS_hash` values. This rule is referred to as
  **Substrate Rule 2**.

- **Field names**: are load-bearing opaque bytes under RFC 8785.
  Renaming a field while preserving its value produces a different
  `JCS_hash`. Schemas MUST pin field names exactly; aliases at the
  wire layer MUST be normalised to the canonical name before
  canonicalisation.

- **Arrays**: element order is preserved under RFC 8785. Arrays are
  NOT sorted during canonicalisation. `["EU","UK"]` and `["UK","EU"]`
  produce different canonical bytes and different `JCS_hash` values.
  Schemas that require a canonical array order MUST specify it at
  the schema level, not rely on JCS to impose one.

- **Type validation**: occurs before canonicalisation. Verifiers MUST
  reject non-conforming inputs (wrong scalar type, missing required
  fields, duplicate keys, non-normalised Unicode where the schema
  pins a normalisation form) at the parse or schema-validation step
  — NOT by coercing to canonical form before computing `JCS_hash`.
  Producer-side violations fail loudly at conformance test;
  verifier-side coercion fails silently as cross-observer
  disagreement months later, AND breaks re-verifiability at audit
  time because the coercion step is verifier-local and will not be
  replayed identically by a supervisor running the canonical rule
  against the raw retained object.

## Retention property

Canonicalisation determinism is a retention obligation as well as a
cross-observer property. Objects produced for frameworks with
retention obligations (MiCA Art. 80, AMLR Art. 56, DORA Art. 14)
MUST be re-verifiable against the canonicalisation rule version
under which they were emitted. A supervisor re-verifying at year 5
against a retained off-VM manifest needs identical canonical bytes
across that gap; the rule version must be determinable without
reference to the emitting system's current configuration.

Producers SHOULD include the `canon_version` field they emitted
under. Producers emitting objects under a framework with a statutory
retention obligation (e.g. MiCA Art. 80, AMLR Art. 56, DORA Art. 14)
MUST include `canon_version`, since re-verifiability against the
contemporaneous rule is constitutive of the retention obligation
rather than optional. Verifier-side coercion (rather than rejection)
of non-conforming inputs breaks re-verifiability at audit time and
is non-conforming.

## Versioning

This section is versioned independently of the core x402
specification. The `canon_version` field is semver-pinned at
section-file revisions. A revision that changes any normative rule
above MUST increment the `canon_version`; downstream extensions
referencing this section MUST cite a specific version. The current
version is `jcs-rfc8785-v1`.

## Cross-implementation reproducibility

The canonicalisation discipline has been byte-for-byte cross-validated
across **eight independent JCS implementations in eight programming
languages** per the AlgoVoi attestation dated 2026-05-24:

| Language | Library | Version |
|---|---|---|
| Python | `rfc8785` | 0.1.4 |
| TypeScript | `canonicalize` | 3.0.0 |
| Go | `gowebpki/jcs` | v1.0.1 |
| Rust | `serde_jcs` | 0.2.0 |
| Java | `cyberphone/json-canonicalization` | 1.1 (RFC 8785 author) |
| PHP | `root23/php-json-canonicalization` | 1.0.1 |
| C# / .NET | `Baqhub.Packages.JsonCanonicalization` | 1.0.1 |
| Ruby | `json-canonicalization` | 1.0.0 |

The matrix validates 24 conformance vectors across three anchor sets,
producing 192 byte-for-byte agreements. Attestation record:

```
https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors/
    blob/main/_attestations/2026-05-24-8-impl-cross-validation.md
```

A conforming implementation in any of the eight listed languages
produces canonical bytes that match every other listed
implementation byte-for-byte.

## Cross-protocol applicability

The same canonicalisation discipline applies to:

- x402 payment receipts and receipt-format extensions
- AP2 open mandate hash
- Hybrid-PQC receipt cores
- AlgoVoi compliance receipts
  ([`draft-hopley-x402-compliance-receipt-00`](https://datatracker.ietf.org/doc/draft-hopley-x402-compliance-receipt/))
- AlgoVoi refund receipts
  ([`draft-hopley-x402-refund-receipt-00`](https://datatracker.ietf.org/doc/draft-hopley-x402-refund-receipt/))

A downstream library consuming receipts across any of these protocols
derives identical canonical bytes under the same rule. Single
canonicalisation discipline across protocol surfaces.

## Scope conventions for `action_ref` (non-normative)

The `action_ref` atomic primitive is defined as:

```
action_ref = SHA-256( JCS( { agent_id, action_type, scope, timestamp_ms } ) )
```

At the canonicalisation layer the `scope` field is typed as a
non-empty string with no closed enum. The cross-impl matrix
validates byte-equivalence of the canonical form across the eight
reference implementations, not the value-space.

A convention is observed across the AlgoVoi emitter set. This
section records it as a **non-normative** recommendation for
downstream adopters. Spec-level closure of the value-space would
lock out future emitters arriving with valid new scopes and is
intentionally avoided.

**Recommended portable form**: `<emitter>:<scope>` namespace-prefixing.

AlgoVoi-emitter `scope` values:

| `scope` value | Emitter surface |
| --- | --- |
| `algovoi:compliance_screen` | AlgoVoi `/compliance/screen` |
| `algovoi:refund` | AlgoVoi refund receipt issuer |

Additional emitters using this discipline are expected to namespace
their own `scope` values under a `<emitter>:<scope>` convention.

The namespaced value is hashed into `action_ref` like any other
string, so the dedup / idempotency property of the primitive is
preserved. The recommendation gives reputation consumers and
downstream verifiers an unambiguous mapping target where multiple
emitters would otherwise collide on unprefixed short-form scopes.

Byte-level reference digests for the AlgoVoi emitter scopes plus
unprefixed equivalents and pair invariants asserting the namespace
prefix is byte-load-bearing are pinned in the
[`action_ref_namespace_v0`](https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors/tree/main/vectors/action_ref_namespace_v0/)
conformance vector set.

## Transactional `action_ref` lifecycle (non-normative)

For transactional flows that traverse multiple state transitions
(authorisation → settlement → refund; issuance → execution →
revocation; admission → review → close), the `action_ref` primitive
serves as a **stable identity anchor across the full lifecycle**.
The four-field preimage `{ agent_id, action_type, scope, timestamp_ms }`
is fixed at the moment the action is first declared and does not
change as the action progresses through state transitions.

Per-transition lifecycle metadata (settlement-proof timestamps,
refund-window expiry, authority-verification timestamps,
revocation-check timestamps, and similar) lives **outside** the
`action_ref` preimage. These are separate claims that may evolve as
the action moves through its states. Keeping them outside the
preimage preserves the invariant: the `action_ref` digest is stable
across every state transition; the identity of the action does not
change when the authority state, settlement state, or refund state
does.

This is the load-bearing property that makes `action_ref`
composable. A downstream verifier auditing a single transition (e.g.
the settlement step of a payment) does not need to replay the full
chain to bind the action; the `action_ref` digest alone is
sufficient. Per-transition timestamp claims at each step provide the
temporal proof that the transition was valid at that moment,
independently verifiable.

The integer `timestamp_ms` requirement (Section "Schema normalisation"
above) applies to the preimage timestamp as well as to any
per-transition timestamps emitted alongside it.

## Conformance vectors

Conformance vectors documenting the above invariants are published at:

```
https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors
```

Anchor sets cross-validated under this discipline as of 2026-05-24:

| Layer | Set | Vectors | Pair invariants |
|---|---|---|---|
| Attestation | `privacy_class_v0.1` | 13 | 12 |
| Work-receipt | `ctef_aps_v1` | 14 | 12 |
| Mandate | `ap2_omh_v0` | 7 | 4 |
| Chain-envelope | `per_chain_envelope_v0` | 19 | 9 |
| Action-ref namespace | `action_ref_namespace_v0` | 8 | 4 |
| Action-ref transactional | `action_ref_transactional_v0` | 8 | 5 |
| Compliance receipt | `compliance_receipt_v1` | 8 | 5 |
| Refund receipt | `refund_receipt_v1` | 8 | 5 |

A conforming implementation in any of the eight listed languages
produces canonical bytes that match every other listed implementation
byte-for-byte across these vector sets.

## Canonical normative source

The full normative specification of this discipline is published as
IETF Internet-Draft
[`draft-hopley-x402-canonicalisation-jcs-v1-00`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/)
(Independent Submission, Informational, sole AlgoVoi authorship,
POSTED on the IETF datatracker 2026-05-24). The Internet-Draft is
the canonical normative source; this section is the matching
in-repository specification for downstream x402 receipt-format
extensions that need to cite the discipline locally.

## Authorship

AlgoVoi work under sole AlgoVoi authorship. Substrate authorship
history is catalogued at
<https://docs.algovoi.co.uk/substrate-authorship-provenance>.
