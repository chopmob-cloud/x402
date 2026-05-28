# x402 Extension: Refund Receipt v1

| Field | Value |
|---|---|
| Extension ID | `refund-receipt-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion IETF I-D | [`draft-hopley-x402-refund-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-refund-receipt/) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | AlgoVoi-authored [`algovoi-refund-receipt`](https://pypi.org/project/algovoi-refund-receipt/) (PyPI) and [`@algovoi/refund-receipt`](https://www.npmjs.com/package/@algovoi/refund-receipt) (npm), Apache 2.0 |
| Canonical specification page | [`docs.algovoi.co.uk/refund-receipt`](https://docs.algovoi.co.uk/refund-receipt) |
| License | Apache 2.0 |

## 1. Scope

This extension defines the wire format for a refund receipt covering PSD2 Article 89 refund obligations and the regulator-recognised refund-outcome taxonomy (full, partial, rejected).

This extension is the senior artefact in the composition with the x402-foundation/x402 base specification primitives. References to "composes with" describe technical integration, not co-authorship.

## 2. The categorical refund result enum

The closed three-state enum is load-bearing:

| Refund result | Semantic | Regulatory significance |
|---|---|---|
| `FULL` | Refund covers the full original settled amount | Closes the consumer's right to further remedy under UK Consumer Rights Act 2015 and EU Consumer Rights Directive 2011/83/EU Article 9 |
| `PARTIAL` | Refund covers a strict subset of the original settled amount; refunded value carried in the receipt | Does not close consumer-rights remedies; further refund obligations may remain |
| `REJECTED` | Refund obligation evaluated and declined; the receipt records the denial event so downstream dispute chains can reference it | Required under PSD2 Article 89 for unauthorised-payment refund disputes; documented denial obligation |

The enum is closed by design. Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document (`refund-receipt-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship.

## 3. Normative format

A refund receipt is a seven-field JSON object canonicalised under RFC 8785 (JCS) per the AlgoVoi-authored canonicalisation pin `urn:x402:canonicalisation:jcs-rfc8785-v1`, normatively defined in the IETF Internet-Draft [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) (Independent Submission, sole AlgoVoi authorship). The receipt's `content_hash` is SHA-256 over the JCS-canonical bytes. Field names are sorted lexicographically by JCS during canonicalisation.

```json
{
  "canon_version": "jcs-rfc8785-v1",
  "jurisdiction_flags": ["GB", "EU"],
  "original_payment_ref": "sha256:0dd5d0b76c9b9281fdeb2509ad38ab132b16a17385ca01d976ff9e6e12563a0f",
  "refund_amount": {"amount_minor": "100000", "asset_id": "USDC.6"},
  "refund_provider_did": "did:web:api.algovoi.co.uk",
  "refund_result": "FULL",
  "refund_timestamp_ms": 1716494400000
}
```

| Field | Type | Description |
|---|---|---|
| `canon_version` | string | In-band canonicalisation pin. Fixed `jcs-rfc8785-v1`. |
| `jurisdiction_flags` | ordered array of string | ISO 3166-1 alpha-2 codes; primary jurisdiction first. Array order significant under RFC 8785 §3.2.3. |
| `original_payment_ref` | string | `sha256:{hex}` reference to the original payment record (compliance receipt `content_hash`, settlement attestation, or operator-specific reference). |
| `refund_amount` | object | `{amount_minor: string, asset_id: string}`. String `amount_minor` avoids float-precision and JS-integer-overflow concerns. |
| `refund_provider_did` | string | DID URI identifying the refund-issuing party. |
| `refund_result` | string (closed enum) | `FULL` / `PARTIAL` / `REJECTED`. |
| `refund_timestamp_ms` | integer | Epoch milliseconds. MUST be integer. RFC 3339 string forms rejected. |

The canonical specification is hosted at the AlgoVoi-controlled URI [`docs.algovoi.co.uk/refund-receipt`](https://docs.algovoi.co.uk/refund-receipt) and normatively defined in the companion IETF Internet-Draft `draft-hopley-x402-refund-receipt`. Implementations MUST follow the I-D where it is more specific than this extension document.

## 4. Regulatory alignment

| Framework | Property addressed |
|---|---|
| **PSD2 Article 89** (refund obligations) | Three-state enum maps to the regulator-recognised refund outcomes |
| **UK Consumer Rights Act 2015** + **EU Consumer Rights Directive 2011/83/EU Article 9** | `FULL` closes the consumer's right to further remedy within the statutory window |
| **MiCA Article 80** (record-keeping) | Byte-deterministic year-N re-verifiability under the AlgoVoi-authored canon pin |
| **UK MLRs 2017 Regulation 40** | Retainable under standard record-keeping |

This extension does not claim compliance certification under any of these frameworks. It provides the substrate that a downstream implementer can use as part of their own compliance attestation.

## 5. Reference implementation

AlgoVoi-authored [`algovoi-refund-receipt`](https://pypi.org/project/algovoi-refund-receipt/) on PyPI and [`@algovoi/refund-receipt`](https://www.npmjs.com/package/@algovoi/refund-receipt) on npm. Apache 2.0.

## 6. Composition with the x402-foundation/x402 base specification

This extension composes with the x402-foundation/x402 base specification's settlement primitive (`original_payment_ref` is the content-addressed pointer to the settled payment) and with the [`cancellation-receipt-v1`](./cancellation-receipt-v1.md) extension (a refund issued after a cancellation references both the cancellation and the original settlement via `original_payment_ref`).

## 7. Backward compatibility

Additive. Facilitators that do not emit refund receipts are unaffected. Adoption is opt-in.

## 8. Substrate authorship and amendment

This extension is sole AlgoVoi authorship. The canonical seven-field shape, the categorical refund-result enum, the PSD2 Article 89 mapping, and the composition with the AlgoVoi-authored canonicalisation pin are AlgoVoi-authored work. The companion IETF Internet-Draft `draft-hopley-x402-refund-receipt` is the normative authorship anchor: substrate-author position is established by the I-D, not by this extension document.

**The categorical enum is closed by design.** Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document authored by AlgoVoi or with explicit AlgoVoi co-authorship. Republication of the canonical shape, the categorical enum, the regulatory mapping, or any normative element under a different attribution does not constitute substrate authorship of those elements.

**Composition direction is fixed.** This extension is the senior artefact in the composition with the x402-foundation/x402 base specification. References to "composes with" describe technical integration, not co-authorship.

Apache 2.0 of the AlgoVoi-authored reference implementations grants permission to USE, MODIFY, and DISTRIBUTE the code. It does not grant permission to REPUBLISH the normative format under a different authorship.

## 9. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- [`draft-hopley-x402-refund-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-refund-receipt/): companion IETF I-D, full normative text, sole AlgoVoi authorship
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D, sole AlgoVoi authorship
- [`docs.algovoi.co.uk/refund-receipt`](https://docs.algovoi.co.uk/refund-receipt): canonical specification page (AlgoVoi-controlled)
- PSD2 / UK Payment Services Regulations 2017, Article 89
- UK Consumer Rights Act 2015
- EU Consumer Rights Directive 2011/83/EU Article 9
- MiCA Regulation Article 80
- UK MLRs 2017 Regulation 40

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
