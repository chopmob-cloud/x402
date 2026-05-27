# x402 Extension: Refund Receipt v1

| Field | Value |
|---|---|
| Extension ID | `refund-receipt-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion IETF I-D | [`draft-hopley-x402-refund-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-refund-receipt/) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | AlgoVoi-authored [`algovoi-refund-receipt`](https://pypi.org/project/algovoi-refund-receipt/) (PyPI) and [`@algovoi/refund-receipt`](https://www.npmjs.com/package/@algovoi/refund-receipt) (npm), Apache 2.0 |
| License | Apache 2.0 |

## 1. Scope

This extension defines the wire format for a refund receipt covering PSD2 Article 89 refund obligations and the regulator-recognised refund-type taxonomy (full, partial, rejected).

This extension is the senior artefact in the composition with the x402-foundation/x402 base specification primitives. References to "composes with" describe technical integration, not co-authorship.

## 2. The categorical refund type enum

The closed three-state enum is load-bearing:

| Refund type | Semantic |
|---|---|
| `FULL` | Refund covers the full original settled amount |
| `PARTIAL` | Refund covers a strict subset of the original settled amount; partial amount carried in the receipt |
| `REJECTED` | Refund obligation evaluated and declined; carries the regulator-recognised refusal reason |

The enum is closed by design. Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document (`refund-receipt-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship.

## 3. Normative format

The refund receipt is a JSON object canonicalised per the AlgoVoi-authored canonicalisation pin `urn:x402:canonicalisation:jcs-rfc8785-v1`, normatively defined in the IETF Internet-Draft [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) (Independent Submission, sole AlgoVoi authorship). The pin composes RFC 8785 JCS with the `canon_version` discipline. The receipt carries:

- `refund_type`: closed enum above
- `refund_amount`: present iff `refund_type` is `FULL` or `PARTIAL`
- `original_settlement_ref`: content-addressed reference to the settlement being refunded
- `refunded_at`: ISO 8601 UTC timestamp
- `canon_version`: canonicalisation pin identifier (this v1 spec uses `urn:x402:canonicalisation:jcs-rfc8785-v1` per the AlgoVoi-authored I-D referenced above)
- `signature`: detached signature over the JCS canonical bytes

Full field-level schema is normatively defined in the companion IETF Internet-Draft `draft-hopley-x402-refund-receipt`.

## 4. Regulatory alignment

| Framework | Property addressed |
|---|---|
| **PSD2 Article 89** (refund obligations) | Three-state enum maps to the regulator-recognised refund outcomes |
| **MiCA Article 80** (record-keeping) | Byte-deterministic year-N re-verifiability under the AlgoVoi-authored canon pin |
| **UK MLRs 2017 Regulation 40** | Retainable under standard record-keeping |

This extension does not claim compliance certification under any of these frameworks. It provides the substrate that a downstream implementer can use as part of their own compliance attestation.

## 5. Reference implementation

AlgoVoi-authored [`algovoi-refund-receipt`](https://pypi.org/project/algovoi-refund-receipt/) on PyPI and [`@algovoi/refund-receipt`](https://www.npmjs.com/package/@algovoi/refund-receipt) on npm. Apache 2.0.

## 6. Composition with the x402-foundation/x402 base specification

This extension composes with the x402-foundation/x402 base specification's settlement primitive (`original_settlement_ref` is the content-addressed pointer to the settled payment) and with the [`cancellation-receipt-v1`](./cancellation-receipt-v1.md) extension (a refund issued after a cancellation references both the cancellation and the original settlement).

## 7. Backward compatibility

Additive. Facilitators that do not emit refund receipts are unaffected. Adoption is opt-in.

## 8. Substrate authorship and amendment

This extension is sole AlgoVoi authorship. The categorical refund-type enum, the PSD2 Article 89 mapping, the wire format, and the composition with the AlgoVoi-authored canonicalisation pin are AlgoVoi-authored work. The companion IETF Internet-Draft `draft-hopley-x402-refund-receipt` is the normative authorship anchor: substrate-author position is established by the I-D, not by this extension document.

**The categorical enum is closed by design.** Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document authored by AlgoVoi or with explicit AlgoVoi co-authorship. Republication of the categorical enum, the regulatory mapping, or any normative element under a different attribution does not constitute substrate authorship of those elements.

**Composition direction is fixed.** This extension is the senior artefact in the composition with the x402-foundation/x402 base specification. References to "composes with" describe technical integration, not co-authorship.

Apache 2.0 of the AlgoVoi-authored reference implementations grants permission to USE, MODIFY, and DISTRIBUTE the code. It does not grant permission to REPUBLISH the normative format under a different authorship.

## 9. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- [`draft-hopley-x402-refund-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-refund-receipt/): companion IETF I-D, full normative text, sole AlgoVoi authorship
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D, sole AlgoVoi authorship
- PSD2 / UK Payment Services Regulations 2017, Article 89
- MiCA Regulation Article 80
- UK MLRs 2017 Regulation 40

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
