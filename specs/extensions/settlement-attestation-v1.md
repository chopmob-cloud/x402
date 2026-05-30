# x402 Extension: Settlement Attestation v1

| Field | Value |
|---|---|
| Extension ID | `settlement-attestation-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion IETF I-D | [`draft-hopley-x402-settlement-attestation`](https://datatracker.ietf.org/doc/draft-hopley-x402-settlement-attestation/) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | [`algovoi-settlement-attestation`](https://pypi.org/project/algovoi-settlement-attestation/) (PyPI) and [`@algovoi/settlement-attestation`](https://www.npmjs.com/package/@algovoi/settlement-attestation) (npm), Apache 2.0 |
| License | Apache 2.0 |

## 1. Scope

This extension defines the wire format for a settlement attestation emitted by a facilitator after settlement is confirmed on-chain. The attestation is the categorical post-settlement record: did the on-chain transaction settle as expected, is it still awaiting finality, or was it reversed?

This extension is distinct from cryptographic-soundness receipt extensions that prove payment-condition validity (which are covered by separate proposed extensions). The two layers are orthogonal: a STARK receipt proves cryptographic conditions held; this extension records the categorical settlement status the facilitator observed on-chain.

## 2. Normative format

A settlement attestation is a JSON object canonicalised per the canonicalisation pin `urn:x402:canonicalisation:jcs-rfc8785-v1`, normatively defined in the IETF Internet-Draft [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) (Independent Submission, Informational). The pin composes RFC 8785 JCS with the `canon_version` discipline.

The attestation carries:

- `settlement_status`: closed enum, one of `SETTLED`, `PENDING_FINALITY`, `REVERSED`
- `settled_payment_ref`: content-addressed reference to the settled payment, byte-bound to the canonical preimage
- `tx_id`: chain-native transaction identifier as confirmed on-chain
- `chain`: CAIP-2 chain identifier
- `asset_id`: CAIP-19 asset identifier
- `amount_microunits`: bigint settled amount
- `settled_at`: ISO 8601 UTC timestamp of facilitator-side settlement confirmation
- `canon_version`: canonicalisation pin identifier (this v1 spec uses `urn:x402:canonicalisation:jcs-rfc8785-v1` per the AlgoVoi-authored I-D referenced above)
- `signature`: detached signature over the JCS canonical bytes

Full field-level schema is normatively defined in the companion IETF Internet-Draft `draft-hopley-x402-settlement-attestation`.

## 3. The categorical settlement status enum

The closed three-state enum is load-bearing:

| Status | Semantic |
|---|---|
| `SETTLED` | Transaction confirmed on-chain at or beyond the chain-specific finality threshold |
| `PENDING_FINALITY` | Transaction observed on-chain but has not yet reached the required confirmation depth |
| `REVERSED` | Transaction was previously SETTLED or PENDING_FINALITY but has subsequently been reorganised out, refunded, or otherwise reversed |

The enum is closed by design. Implementations MUST NOT extend the enum in-band by adding new values. New values MAY be introduced only by a normative successor extension document (`settlement-attestation-v2` or higher).

A `PENDING_FINALITY` attestation MAY be superseded by a later `SETTLED` or `REVERSED` attestation referencing the same `tx_id`. Implementations MUST treat the latest attestation as authoritative for the given `tx_id`.

## 4. Regulatory alignment

| Framework | Property the settlement attestation addresses |
|---|---|
| **MiCA Article 80** (crypto-asset transaction record-keeping) | Categorical settlement status with byte-deterministic year-N re-verifiability under the canon pin |
| **AMLR Article 56** (record-keeping) | Same byte-deterministic property |
| **DORA Article 14** (operational resilience) | The categorical reversal state allows downstream parties to handle post-settlement reversal events deterministically |
| **UK MLRs 2017 Regulation 40** (transaction record retention) | Attestation is retainable under standard record-keeping process |
| **FATF Recommendation 16** (transaction record obligations) | Per-transaction attestation with chain-canonical transaction identifier |

This extension does not claim compliance certification under any of these frameworks. It provides the substrate that a downstream implementer can use as part of their own compliance attestation.

## 5. Reference implementation

[`algovoi-settlement-attestation`](https://pypi.org/project/algovoi-settlement-attestation/) on PyPI and [`@algovoi/settlement-attestation`](https://www.npmjs.com/package/@algovoi/settlement-attestation) on npm. Apache 2.0. The package emits and verifies settlement attestations under the canonicalisation pin. Cross-validated byte-for-byte across 8 independent language implementations (Python, TypeScript, Go, Rust, Java, PHP, .NET, Ruby). Conformance corpus: [`chopmob-cloud/algovoi-jcs-conformance-vectors`](https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors).

## 6. Composition with the x402-foundation/x402 base specification

The settlement attestation sits after the x402 settle/verify flow:

1. Buyer pays on-chain via the existing x402 base flow
2. Facilitator confirms the transaction via the x402 base specification's `/verify` primitive
3. Once confirmed at the chain-specific finality threshold, facilitator emits a `settlement-attestation-v1` attestation carrying `settlement_status: SETTLED`
4. If the transaction is observed on-chain but not yet at finality, the facilitator MAY emit an interim attestation with `settlement_status: PENDING_FINALITY`
5. If a previously-attested transaction is later reorganised out or reversed, the facilitator MUST emit a follow-on attestation with `settlement_status: REVERSED` referencing the same `tx_id`

The attestation is independently citable. A downstream consumer verifying year-N retention reproduces the canonical bytes by applying the pinned `canon_version` rule to the retained attestation object.

This extension composes with the [`compliance-receipt-v1`](./compliance-receipt-v1.md), [`cancellation-receipt-v1`](./cancellation-receipt-v1.md), and [`refund-receipt-v1`](./refund-receipt-v1.md) extensions: the compliance receipt covers admission-time decisions, the settlement attestation covers post-settlement status, and the cancellation and refund receipts cover post-settlement lifecycle events.

## 7. Backward compatibility

This extension is additive. Facilitators that do not emit settlement attestations are unaffected. Buyer agents that ignore settlement attestations continue to function as before, subject to their own settlement-status discipline. Adoption is opt-in per-facilitator.

## 8. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- [`draft-hopley-x402-settlement-attestation`](https://datatracker.ietf.org/doc/draft-hopley-x402-settlement-attestation/): companion IETF I-D, full normative text
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D
- CAIP-2: Blockchain ID specification
- CAIP-19: Asset Type and Asset ID Specification
- MiCA Regulation Article 80
- AMLR Regulation Article 56
- DORA Article 14
- UK MLRs 2017 Regulation 40
- FATF Recommendation 16

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
