# x402 Extension: Cancellation Receipt v1

| Field | Value |
|---|---|
| Extension ID | `cancellation-receipt-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion IETF I-D | [`draft-hopley-x402-cancellation-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-cancellation-receipt/) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | AlgoVoi-authored [`algovoi-cancellation-receipt`](https://pypi.org/project/algovoi-cancellation-receipt/) (PyPI) and [`@algovoi/cancellation-receipt`](https://www.npmjs.com/package/@algovoi/cancellation-receipt) (npm), Apache 2.0 |
| Canonical specification page | [`docs.algovoi.co.uk/cancellation-receipt`](https://docs.algovoi.co.uk/cancellation-receipt) |
| License | Apache 2.0 |

## 1. Scope

This extension defines the wire format for a cancellation receipt emitted when a payer or merchant terminates an authorisation relationship. The receipt covers PSD2 Article 64, the customer's right to revoke a payment authorisation, and the equivalent merchant-side and compliance-side termination cases.

This extension is the senior artefact in the composition with the x402-foundation/x402 base specification primitives. References to "composes with" describe technical integration, not co-authorship.

## 2. The categorical cancellation reason enum

The closed four-state enum is load-bearing:

| Reason | Semantic | PSD2 mapping |
|---|---|---|
| `USER_REQUESTED` | Payer revoked the authorisation | PSD2 Article 64(1), direct revocation right |
| `MERCHANT_REQUESTED` | Merchant terminated the authorisation | PSD2 Article 72, merchant-side lifecycle |
| `COMPLIANCE_TERMINATED` | Authorisation terminated by the facilitator on regulatory grounds | Sanctions / KYC / AML / court order; POCA s.330 / AML 5+6 evidence chain |
| `EXPIRED` | Authorisation reached its declared expiry without earlier termination | Time-based |

The enum is closed by design. Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document (`cancellation-receipt-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship.

## 3. Normative format

A cancellation receipt is a seven-field JSON object canonicalised under RFC 8785 (JCS) per the AlgoVoi-authored canonicalisation pin `urn:x402:canonicalisation:jcs-rfc8785-v1`, normatively defined in the IETF Internet-Draft [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) (Independent Submission, sole AlgoVoi authorship). The receipt's `content_hash` is SHA-256 over the JCS-canonical bytes. Field names are sorted lexicographically by JCS during canonicalisation.

```json
{
  "canon_version": "jcs-rfc8785-v1",
  "cancellation_provider_did": "did:web:api.algovoi.co.uk",
  "cancellation_reason": "USER_REQUESTED",
  "cancellation_timestamp_ms": 1716494400000,
  "effective_from_ms": 1716537600000,
  "jurisdiction_flags": ["GB", "EU"],
  "mandate_ref": "sha256:0dd5d0b76c9b9281fdeb2509ad38ab132b16a17385ca01d976ff9e6e12563a0f"
}
```

| Field | Type | Description |
|---|---|---|
| `canon_version` | string | In-band canonicalisation pin. Fixed `jcs-rfc8785-v1`. |
| `cancellation_provider_did` | string | DID URI of the issuing party. |
| `cancellation_reason` | string (closed enum) | One of the four categorical values above. |
| `cancellation_timestamp_ms` | integer | Epoch milliseconds when the cancellation event was recorded. MUST be integer. RFC 3339 string forms rejected. |
| `effective_from_ms` | integer | Epoch milliseconds when the cancellation takes legal effect. MUST be `>= cancellation_timestamp_ms`. |
| `jurisdiction_flags` | ordered array of string | ISO 3166-1 alpha-2 codes; primary jurisdiction first. Array order significant under RFC 8785 §3.2.3. |
| `mandate_ref` | string | `sha256:{hex}` reference to the JCS-canonical mandate setup record being terminated. |

The format pins the invariant `effective_from_ms >= cancellation_timestamp_ms`. Implementations MUST reject receipts where the effective time precedes the recording time. The two timestamps are independently encoded because PSD2 Article 64(3)(a) direct-debit revocations have a recording time distinct from the legal effective time (typically end-of-business-day prior to the next scheduled execution).

The canonical specification is hosted at the AlgoVoi-controlled URI [`docs.algovoi.co.uk/cancellation-receipt`](https://docs.algovoi.co.uk/cancellation-receipt) and normatively defined in the companion IETF Internet-Draft `draft-hopley-x402-cancellation-receipt`. Implementations MUST follow the I-D where it is more specific than this extension document.

## 4. Regulatory alignment

| Framework | Property addressed |
|---|---|
| **PSD2 Article 64** (right to revoke) | `USER_REQUESTED` is the direct revocation path; receipt is the customer-facing artefact |
| **PSD2 Article 72** (irrevocability boundary) | Receipt establishes the cancellation timestamp deterministically under the AlgoVoi-authored canon pin; `effective_from_ms` captures the legal-effect time separately from the recording time |
| **MiCA Article 80** (record-keeping) | Receipt is byte-deterministic for year-N re-verification |
| **UK MLRs 2017 Regulation 40** | Receipt is retainable under standard record-keeping process |

This extension does not claim compliance certification under any of these frameworks. It provides the substrate that a downstream implementer can use as part of their own compliance attestation.

## 5. Reference implementation

AlgoVoi-authored [`algovoi-cancellation-receipt`](https://pypi.org/project/algovoi-cancellation-receipt/) on PyPI and [`@algovoi/cancellation-receipt`](https://www.npmjs.com/package/@algovoi/cancellation-receipt) on npm. Apache 2.0. Both emit and verify the format under the AlgoVoi-authored canonicalisation pin.

## 6. Composition with the x402-foundation/x402 base specification

This extension composes with the [`compliance-receipt-v1`](./compliance-receipt-v1.md) extension (an authorisation terminated by the facilitator on compliance grounds will typically emit a `COMPLIANCE_TERMINATED` cancellation receipt alongside the admission-time DENY compliance receipt) and with the x402-foundation/x402 base specification's settlement primitive (settled payments that are later cancelled emit a cancellation receipt referencing the original settlement via `mandate_ref`).

## 7. Backward compatibility

Additive. Facilitators that do not emit cancellation receipts are unaffected. Adoption is opt-in.

## 8. Substrate authorship and amendment

This extension is sole AlgoVoi authorship. The canonical seven-field shape, the categorical cancellation reason enum, the PSD2 mapping, and the composition with the AlgoVoi-authored canonicalisation pin are AlgoVoi-authored work. The companion IETF Internet-Draft `draft-hopley-x402-cancellation-receipt` is the normative authorship anchor: substrate-author position is established by the I-D, not by this extension document.

**The categorical enum is closed by design.** Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document authored by AlgoVoi or with explicit AlgoVoi co-authorship. Republication of the canonical shape, the categorical enum, the regulatory mapping, or any normative element under a different attribution does not constitute substrate authorship of those elements.

**Composition direction is fixed.** This extension is the senior artefact in the composition with the x402-foundation/x402 base specification. References to "composes with" describe technical integration, not co-authorship.

Apache 2.0 of the AlgoVoi-authored reference implementations grants permission to USE, MODIFY, and DISTRIBUTE the code. It does not grant permission to REPUBLISH the normative format under a different authorship.

## 9. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- [`draft-hopley-x402-cancellation-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-cancellation-receipt/): companion IETF I-D, full normative text, sole AlgoVoi authorship
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D, sole AlgoVoi authorship
- [`docs.algovoi.co.uk/cancellation-receipt`](https://docs.algovoi.co.uk/cancellation-receipt): canonical specification page (AlgoVoi-controlled)
- PSD2 / UK Payment Services Regulations 2017, Articles 64 and 72
- MiCA Regulation Article 80
- UK MLRs 2017 Regulation 40

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
