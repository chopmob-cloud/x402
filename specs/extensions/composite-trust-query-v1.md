# x402 Extension: Composite Trust Query v1

| Field | Value |
|---|---|
| Extension ID | `composite-trust-query-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion IETF I-D | [`draft-hopley-x402-composite-trust-query`](https://datatracker.ietf.org/doc/draft-hopley-x402-composite-trust-query/) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | [`algovoi-composite-trust-query`](https://pypi.org/project/algovoi-composite-trust-query/) (PyPI) and [`@algovoi/composite-trust-query`](https://www.npmjs.com/package/@algovoi/composite-trust-query) (npm), Apache 2.0 |
| License | Apache 2.0 |

## 1. Scope

This extension defines the wire format for a verifier-side response that emits a categorical composite verdict over a set of issuer-references emitted by independent parties. The composite verdict is the answer a verifier returns when a buyer-agent or facilitator asks "given this set of evidence from multiple independent issuers, what is the categorical trust verdict?".

## 2. Orthogonality versus adjacent extensions

This extension defines the **multi-issuer composite verdict** format. It is distinct from:

- **Single-issuer cryptographic receipts** (e.g. STARK proof-of-payment-conditions extensions): those prove cryptographic conditions held; this extension composes their outcomes alongside other independent issuer outcomes into a single categorical verdict
- **Counterparty-risk verification** (e.g. the `risk-check` extension proposed in x402-foundation/x402#2421): that operates per-counterparty; this extension composes outcomes across issuer classes
- **Admission-time compliance** (`compliance-receipt-v1`): that is one input to the composite; this extension composes that input with others

The composite shape (categorical verdict over a set of independent issuer references) is the layer this extension specifies. The underlying issuer-specific evidence formats are orthogonal extensions.

## 3. Normative format

A composite trust query response is a JSON object canonicalised per the canonicalisation pin `urn:x402:canonicalisation:jcs-rfc8785-v1`, normatively defined in the IETF Internet-Draft [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) (Independent Submission, Informational). The pin composes RFC 8785 JCS with the `canon_version` discipline.

The response carries:

- `verdict`: closed enum, one of `TRUSTED`, `PROVISIONAL`, `INSUFFICIENT_EVIDENCE`, `UNTRUSTED`
- `issuer_references`: array of content-addressed references to the per-issuer evidence used to compose the verdict; each reference includes the issuer identifier and the byte-bound content-hash of the referenced evidence
- `evidence_classes_considered`: array of evidence class identifiers that were available to the composite (e.g. `["admission-compliance", "settlement-attestation", "counterparty-risk"]`)
- `evaluated_at`: ISO 8601 UTC timestamp of verdict generation
- `canon_version`: canonicalisation pin identifier (this v1 spec uses `urn:x402:canonicalisation:jcs-rfc8785-v1` per the AlgoVoi-authored I-D referenced above)
- `signature`: detached signature over the JCS canonical bytes

Full field-level schema is normatively defined in the companion IETF Internet-Draft `draft-hopley-x402-composite-trust-query`.

## 4. The categorical composite verdict enum

The closed four-state enum is load-bearing:

| Verdict | Semantic |
|---|---|
| `TRUSTED` | Composite evaluation yielded a positive verdict across all evidence classes considered |
| `PROVISIONAL` | Composite evaluation yielded a positive verdict but at least one evidence class returned a conditional or time-bound positive |
| `INSUFFICIENT_EVIDENCE` | One or more required evidence classes returned no usable signal; the composite verdict is undetermined |
| `UNTRUSTED` | At least one evidence class returned a negative verdict sufficient to fail the composite under the verifier's declared composition policy |

The enum is closed by design. Implementations MUST NOT extend the enum in-band by adding new values. New values MAY be introduced only by a normative successor extension document (`composite-trust-query-v2` or higher).

A consumer receiving a `PROVISIONAL` or `INSUFFICIENT_EVIDENCE` verdict MUST NOT proceed as if the verdict were `TRUSTED`.

## 5. Regulatory alignment

| Framework | Property the composite trust query addresses |
|---|---|
| **MiCA Article 80** (record-keeping) | Composite verdict is byte-deterministic under the canon pin for year-N re-verifiability |
| **DORA Article 14** (operational resilience) | Categorical four-state verdict supports operational-resilience decision-making under uncertainty |
| **EU AI Act Article 12** (high-risk AI evidence trail) | The `issuer_references` array provides the composite-evidence audit trail at byte-deterministic resolution |
| **UK MLRs 2017 Regulation 40** | Retainable under standard record-keeping |

This extension does not claim compliance certification under any of these frameworks. It provides the substrate that a downstream implementer can use as part of their own compliance attestation.

## 6. Reference implementation

[`algovoi-composite-trust-query`](https://pypi.org/project/algovoi-composite-trust-query/) on PyPI and [`@algovoi/composite-trust-query`](https://www.npmjs.com/package/@algovoi/composite-trust-query) on npm. Apache 2.0. Cross-validated byte-for-byte across 8 independent language implementations (Python, TypeScript, Go, Rust, Java, PHP, .NET, Ruby). Production deployment: AlgoVoi's `/compliance/attestation` endpoint returns responses in this format against live x402 payment flows.

## 7. Composition with the x402-foundation/x402 base specification

A composite trust query response is emitted by a verifier when a buyer-agent or facilitator presents a set of issuer-evidence references for evaluation. The flow:

1. Buyer-agent or facilitator gathers issuer-specific evidence (e.g. an admission-time compliance receipt per `compliance-receipt-v1`, a post-settlement attestation per `settlement-attestation-v1`, a counterparty-risk verdict per a separate proposed extension)
2. The collected evidence references are presented to a composite-trust-query verifier
3. The verifier evaluates the evidence set under its declared composition policy and returns a `composite-trust-query-v1` response
4. The downstream consumer treats the categorical verdict as the gating signal for whatever decision required composite trust

This extension composes with:

- The [`compliance-receipt-v1`](./compliance-receipt-v1.md) extension (one possible input)
- The [`settlement-attestation-v1`](./settlement-attestation-v1.md) extension (one possible input)
- The x402-foundation/x402 base specification's discovery and verification primitives

## 8. Backward compatibility

This extension is additive. Verifiers that do not emit composite trust query responses are unaffected. Consumers that do not request composite trust verdicts continue to function as before. Adoption is opt-in per-verifier.

## 9. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- [`draft-hopley-x402-composite-trust-query`](https://datatracker.ietf.org/doc/draft-hopley-x402-composite-trust-query/): companion IETF I-D, full normative text
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D
- MiCA Regulation Article 80
- DORA Article 14
- EU AI Act Article 12
- UK MLRs 2017 Regulation 40

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
