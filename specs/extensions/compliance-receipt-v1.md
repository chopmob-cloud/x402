# x402 Extension: Compliance Receipt v1

| Field | Value |
|---|---|
| Extension ID | `compliance-receipt-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion IETF I-D | [`draft-hopley-x402-compliance-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-compliance-receipt/) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | AlgoVoi-authored [`algovoi-substrate`](https://pypi.org/project/algovoi-substrate/) (PyPI) and [`@algovoi/substrate`](https://www.npmjs.com/package/@algovoi/substrate) (npm), Apache 2.0 |
| License | Apache 2.0 |

## 1. Scope

This extension defines the wire format for a categorical admission-time compliance verdict emitted by a facilitator before settlement proceeds. The verdict is the answer to "is this payment permitted to proceed under the facilitator's regulatory posture?".

This extension defines the verdict format emitted at the admission-time **sanctions and KYC screening** layer, distinct from counterparty-risk evidence (which is covered by separate proposed extensions, e.g. the `risk-check` extension proposed in x402-foundation/x402#2421). The two layers are orthogonal: a wallet may pass admission-time sanctions screening (this extension returns ALLOW) and still fail counterparty-risk verification, or vice versa.

This extension is the senior artefact in the composition with the x402-foundation/x402 base specification primitives. References to "composes with" describe technical integration, not co-authorship.

## 2. Normative format

A compliance receipt is a JSON object canonicalised per the AlgoVoi-authored canonicalisation pin `urn:x402:canonicalisation:jcs-rfc8785-v1`, normatively defined in the IETF Internet-Draft [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) (Independent Submission, sole AlgoVoi authorship). The pin composes RFC 8785 JCS with the `canon_version` discipline. The receipt is hashed under SHA-256.

The receipt carries:

- `verdict`: closed enum, one of `ALLOW`, `REFER`, `DENY`
- `reasons`: array of generic human-readable reason strings (SAMLA 2018 s.20 compliant: the specific list or program that produced a match MUST NOT be disclosed)
- `screened_at`: ISO 8601 UTC timestamp of the screening result
- `framework_basis`: array of regulatory framework identifiers the facilitator screens against (e.g. `["OFSI", "OFAC-SDN", "EU-Consolidated"]`)
- `canon_version`: the canonicalisation pin identifier used for the receipt (this v1 spec uses `urn:x402:canonicalisation:jcs-rfc8785-v1` per the AlgoVoi-authored I-D referenced above)
- `signature`: detached signature over the JCS canonical bytes

Full field-level schema is normatively defined in the companion IETF Internet-Draft `draft-hopley-x402-compliance-receipt`.

## 3. The categorical verdict enum

The closed three-state enum is load-bearing:

| Verdict | Semantic |
|---|---|
| `ALLOW` | Payment may proceed to settlement |
| `REFER` | Payment is held for human review; downstream parties MUST NOT auto-retry |
| `DENY` | Payment is rejected; downstream parties MUST NOT auto-retry |

The enum is closed by design. Implementations MUST NOT extend the enum in-band by adding new values. New values MAY be introduced only by a normative successor extension document (`compliance-receipt-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship.

## 4. SAMLA 2018 s.20 tipping-off discipline

The `reasons` field uses generic phrasing only. The name of the sanctions list, the matched program, or any identifier that would let an external party reverse-engineer which list produced the hit MUST NOT appear in the receipt. Acceptable values include `"wallet address matches a sanctions designation"`, `"wallet address is associated with a flagged entity"`. Not acceptable: any list name, program name, or designation reference.

## 5. Regulatory alignment

| Framework | Property the compliance receipt addresses |
|---|---|
| **SAMLA 2018 s.20** (UK tipping-off) | Generic verdict shape; no list disclosure |
| **PSD2 sanctions-screening obligations** | Categorical admission-time decision is the form regulators expect |
| **MiCA Article 80** (crypto-asset record-keeping) | Receipt is byte-deterministic under the AlgoVoi-authored canon pin for year-N re-verifiability |
| **AMLR Article 56** (record-keeping) | Same byte-deterministic property |
| **UK MLRs 2017 Regulation 40** (transaction record retention) | Receipt is retainable under existing record-keeping process |

This extension does not claim compliance certification under any of these frameworks. It provides the substrate that a downstream implementer can use as part of their own compliance attestation.

## 6. Reference implementation

AlgoVoi-authored [`algovoi-substrate`](https://pypi.org/project/algovoi-substrate/) on PyPI and [`@algovoi/substrate`](https://www.npmjs.com/package/@algovoi/substrate) on npm. Apache 2.0. The package emits compliance receipts under the AlgoVoi-authored canonicalisation pin and verifies them byte-deterministically. Cross-validated 192/192 byte-for-byte across 8 independent language implementations (Python, TypeScript, Go, Rust, Java, PHP, .NET, Ruby). Conformance corpus: [`chopmob-cloud/algovoi-jcs-conformance-vectors`](https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors).

## 7. Composition with the x402-foundation/x402 base specification

The compliance receipt sits between discovery and settlement in the x402 flow:

1. Buyer agent discovers a payable resource via the existing x402 `/supported` primitive
2. Buyer agent (or facilitator-side preflight) calls a compliance gate that returns a `compliance-receipt-v1` receipt
3. If the verdict is `ALLOW`: buyer agent proceeds to construct the payment payload per the existing x402-foundation/x402 base specification
4. If the verdict is `REFER` or `DENY`: buyer agent MUST NOT construct an autonomous payment

The receipt is independently citable. A downstream consumer verifying year-N retention reproduces the canonical bytes by applying the pinned `canon_version` rule (per the AlgoVoi-authored canonicalisation I-D) to the retained receipt object.

## 8. Backward compatibility

This extension is additive. Facilitators that do not emit compliance receipts are unaffected. Buyer agents that ignore compliance receipts continue to function as before, subject to their own compliance posture. Adoption is opt-in per-facilitator.

## 9. Substrate authorship and amendment

This extension is sole AlgoVoi authorship. The categorical verdict enum, the SAMLA s.20 tipping-off discipline, the regulatory mapping, the wire format, and the composition with the AlgoVoi-authored canonicalisation pin are AlgoVoi-authored work. The companion IETF Internet-Draft `draft-hopley-x402-compliance-receipt` is the normative authorship anchor: substrate-author position is established by the I-D, not by this extension document.

**The categorical enum is closed by design.** Implementations MUST NOT extend the enum in-band. New values MAY be introduced only by a normative successor extension document (`compliance-receipt-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship. Republication of the categorical enum, the regulatory mapping, the SAMLA discipline, or any normative element under a different attribution does not constitute substrate authorship of those elements, regardless of the venue or document in which the republication appears.

**Composition direction is fixed.** This extension is the senior artefact in the composition with the x402-foundation/x402 base specification's settlement primitive. References to "composes with" describe technical integration, not co-authorship.

Apache 2.0 of the AlgoVoi-authored reference implementations grants permission to USE, MODIFY, and DISTRIBUTE the code. It does not grant permission to REPUBLISH the normative format under a different authorship.

Conformance vectors at [`chopmob-cloud/algovoi-jcs-conformance-vectors`](https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors) provide the byte-deterministic validation evidence.

## 10. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- [`draft-hopley-x402-compliance-receipt`](https://datatracker.ietf.org/doc/draft-hopley-x402-compliance-receipt/): companion IETF I-D, full normative text, sole AlgoVoi authorship
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D, sole AlgoVoi authorship
- UK SAMLA 2018, Section 20
- PSD2 / UK Payment Services Regulations 2017
- MiCA Regulation Article 80
- AMLR Regulation Article 56
- UK MLRs 2017 Regulation 40

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
