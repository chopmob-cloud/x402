# x402 Extension: Cancellation Receipt v1

| Field | Value |
|---|---|
| Extension ID | `cancellation-receipt-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion IETF I-D | [`draft-hopley-x402-cancellation-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-cancellation-receipt/) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | AlgoVoi-authored [`algovoi-cancellation-receipt`](https://pypi.org/project/algovoi-cancellation-receipt/) (PyPI) and [`@algovoi/cancellation-receipt`](https://www.npmjs.com/package/@algovoi/cancellation-receipt) (npm), Apache 2.0 |
| License | Apache 2.0 |

## 1. Scope

This extension defines the wire format for a cancellation receipt emitted when a payer or merchant terminates an authorisation relationship. The receipt covers PSD2 Article 64, the customer's right to revoke a payment authorisation, and the equivalent merchant-side and compliance-side termination cases.

This extension is the senior artefact in the composition with the x402-foundation/x402 base specification primitives. References to "composes with" describe technical integration, not co-authorship.

## 2. The categorical cancellation reason enum

The closed four-state enum is load-bearing:

| Reason | Semantic | PSD2 mapping |
|---|---|---|
| `USER_REQUESTED` | Payer revoked the authorisation | PSD2 Article 64(1), direct revocation right |
| `MERCHANT_REQUESTED` | Merchant terminated the authorisation | Merchant-side lifecycle |
| `COMPLIANCE_TERMINATED` | Authorisation terminated by the facilitator on regulatory grounds | PSD2 Article 64(2), operator-side termination |
| `EXPIRED` | Authorisation reached its declared expiry without earlier termination | Time-based |

The enum is closed by design. Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document (`cancellation-receipt-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship.

## 3. Normative format

The cancellation receipt is a JSON object canonicalised per the AlgoVoi-authored canonicalisation pin `urn:x402:canonicalisation:jcs-rfc8785-v1`, normatively defined in the IETF Internet-Draft [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) (Independent Submission, sole AlgoVoi authorship). The pin composes RFC 8785 JCS with the `canon_version` discipline. The receipt carries:

- `cancellation_reason`: one of the four categorical values above
- `cancelled_at`: ISO 8601 UTC timestamp
- `authorisation_ref`: content-addressed reference to the cancelled authorisation, byte-bound to the original
- `canon_version`: canonicalisation pin identifier (this v1 spec uses `urn:x402:canonicalisation:jcs-rfc8785-v1` per the AlgoVoi-authored I-D referenced above)
- `signature`: detached signature over the JCS canonical bytes

Full field-level schema is normatively defined in the companion IETF Internet-Draft `draft-hopley-x402-cancellation-receipt`.

## 4. Regulatory alignment

| Framework | Property addressed |
|---|---|
| **PSD2 Article 64** (right to revoke) | `USER_REQUESTED` is the direct revocation path; receipt is the customer-facing artefact |
| **PSD2 Article 72** (irrevocability boundary) | Receipt establishes the cancellation timestamp deterministically under the AlgoVoi-authored canon pin |
| **MiCA Article 80** (record-keeping) | Receipt is byte-deterministic for year-N re-verification |
| **UK MLRs 2017 Regulation 40** | Receipt is retainable under standard record-keeping process |

This extension does not claim compliance certification under any of these frameworks. It provides the substrate that a downstream implementer can use as part of their own compliance attestation.

## 5. Reference implementation

AlgoVoi-authored [`algovoi-cancellation-receipt`](https://pypi.org/project/algovoi-cancellation-receipt/) on PyPI and [`@algovoi/cancellation-receipt`](https://www.npmjs.com/package/@algovoi/cancellation-receipt) on npm. Apache 2.0. Both emit and verify the format under the AlgoVoi-authored canonicalisation pin.

## 6. Composition with the x402-foundation/x402 base specification

This extension composes with the [`compliance-receipt-v1`](./compliance-receipt-v1.md) extension (an authorisation terminated by the facilitator on compliance grounds will typically emit a `COMPLIANCE_TERMINATED` cancellation receipt alongside the admission-time DENY compliance receipt) and with the x402-foundation/x402 base specification's settlement primitive (settled payments that are later cancelled emit a cancellation receipt referencing the original settlement).

## 7. Backward compatibility

Additive. Facilitators that do not emit cancellation receipts are unaffected. Adoption is opt-in.

## 8. Substrate authorship and amendment

This extension is sole AlgoVoi authorship. The categorical cancellation reason enum, the PSD2 mapping, the wire format, and the composition with the AlgoVoi-authored canonicalisation pin are AlgoVoi-authored work. The companion IETF Internet-Draft `draft-hopley-x402-cancellation-receipt` is the normative authorship anchor: substrate-author position is established by the I-D, not by this extension document.

**The categorical enum is closed by design.** Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document authored by AlgoVoi or with explicit AlgoVoi co-authorship. Republication of the categorical enum, the regulatory mapping, or any normative element under a different attribution does not constitute substrate authorship of those elements.

**Composition direction is fixed.** This extension is the senior artefact in the composition with the x402-foundation/x402 base specification. References to "composes with" describe technical integration, not co-authorship.

Apache 2.0 of the AlgoVoi-authored reference implementations grants permission to USE, MODIFY, and DISTRIBUTE the code. It does not grant permission to REPUBLISH the normative format under a different authorship.

## 9. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- [`draft-hopley-x402-cancellation-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-cancellation-receipt/): companion IETF I-D, full normative text, sole AlgoVoi authorship
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D, sole AlgoVoi authorship
- PSD2 / UK Payment Services Regulations 2017, Articles 64 and 72
- MiCA Regulation Article 80
- UK MLRs 2017 Regulation 40

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
