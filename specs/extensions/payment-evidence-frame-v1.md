# x402 Extension: Payment Evidence Frame v1

| Field | Value |
|---|---|
| Extension ID | `payment-evidence-frame-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Normative I-D | [`draft-hopley-x402-payment-evidence-frame`](https://datatracker.ietf.org/doc/draft-hopley-x402-payment-evidence-frame/) |
| Reference impl (Python) | [`algovoi-pef`](https://pypi.org/project/algovoi-pef/), Apache 2.0 |
| Reference impl (TypeScript) | [`@algovoi/pef`](https://www.npmjs.com/package/@algovoi/pef), Apache 2.0 |
| License | Apache 2.0 |

## 1. Scope

PEF (Payment Evidence Frame) is a transport-agnostic JSON envelope that wraps any x402 payment lifecycle receipt under a named `claim_type` and a deterministic `frame_id`. It solves three problems the inner receipt formats do not individually solve: a stable cross-system identifier, a taxonomy label for routing without inner parsing, and an integrity check without full deserialisation.

This extension defines how PEF composes with the x402 protocol: where the frame appears in x402 responses, how `frame_id` is used as a stable payment reference, and how the optional `signature` field binds the frame to an RFC 9421 transport identity.

PEF is a transport shape only -- it does not define new receipt formats. It envelopes existing x402 extension receipt formats (see Section 7).

## 2. claim_type Taxonomy

Each PEF frame carries a `claim_type` that identifies the lifecycle stage the inner receipt represents. The closed set of `claim_type` values and their corresponding `receipt_format` strings is:

| claim_type | receipt_format | Inner receipt defined by |
|---|---|---|
| `payment_admission` | `compliance-receipt-v1` | Pre-payment compliance screen |
| `payment_settlement` | `settlement-attestation-v1` | Post-settlement confirmation |
| `payment_cancellation` | `cancellation-receipt-v1` | Mandate or order termination |
| `payment_refund` | `refund-receipt-v1` | Post-settlement refund |
| `composite_verdict` | `composite-trust-query-v1` | Verifier-of-verifier conclusion |

Implementations MUST NOT use `claim_type` values outside this closed set without a successor extension document.

## 3. Frame Format

A PEF frame is a flat JSON object. All fields are REQUIRED except `signature`.

| Field | Type | Description |
|---|---|---|
| `pef_version` | string | Fixed value `"1"` for this extension version |
| `claim_type` | string | Closed enum; MUST be a value from Section 2 |
| `receipt_format` | string | Closed mapping per Section 2; MUST match the `claim_type` |
| `receipt` | object | Inner receipt object verbatim, without modification |
| `receipt_hash` | string | `sha256:<hex>` -- SHA-256 of the JCS canonicalisation of `receipt` |
| `frame_id` | string | `sha256:<hex>` -- SHA-256 of the JCS preimage (see Section 4) |
| `frame_provider_did` | string | DID URI of the issuing party |
| `frame_timestamp_ms` | integer | Epoch milliseconds at frame issuance |
| `canon_version` | string | Fixed value `urn:x402:canonicalisation:jcs-rfc8785-v1` |
| `signature` | string | OPTIONAL -- RFC 9421 signature string (see Section 5) |

## 4. frame_id Derivation

The `frame_id` is a stable, deterministic identifier for the frame content. It is derived as follows:

1. **Build the preimage**: take the complete frame object and remove the `frame_id` and `signature` fields. The remaining object is the preimage.
2. **Canonicalise**: apply JCS (RFC 8785) to the preimage to obtain a deterministic byte sequence.
3. **Hash**: compute SHA-256 of the canonical byte sequence.
4. **Encode**: represent the hash as `sha256:<lowercase-hex-64>`.

The `frame_id` is stable with respect to the optional `signature` field: adding or updating `signature` after frame issuance does not change the `frame_id`. This allows signatures to be attached to or updated on a frame without invalidating downstream references to the frame.

## 5. Composition with x402 /verify

This extension adds a `settlement_evidence` field to the POST /verify response body when the facilitator supports PEF framing. The field carries a complete PEF frame with `claim_type` of `payment_settlement`.

```json
{
  "x402Version": 1,
  "settlement_evidence": {
    "pef_version": "1",
    "claim_type": "payment_settlement",
    "receipt_format": "settlement-attestation-v1",
    "frame_id": "sha256:3c4f1e2a...",
    "receipt_hash": "sha256:a1b2c3d4...",
    "frame_provider_did": "did:web:api.algovoi.co.uk",
    "frame_timestamp_ms": 1780144012000,
    "canon_version": "urn:x402:canonicalisation:jcs-rfc8785-v1",
    "receipt": {
      "settlement_result": "SETTLED",
      "settlement_chain": "base_mainnet",
      "settlement_timestamp_ms": 1780144010000,
      "...": "..."
    }
  }
}
```

The `frame_id` is the stable reference a merchant backend can store and pass downstream without embedding the full receipt bytes.

Resource servers that support this extension MAY also emit the frame identifier as an HTTP header, allowing receivers to retrieve the full frame from a content-addressed endpoint without re-parsing the response body:

```
X-Payment-Evidence: sha256:3c4f1e2a...
```

The header value is the bare `frame_id` string. The retrieval endpoint and its protocol are deployment-specific and outside the normative scope of this extension.

## 6. Live Example (payment_admission)

The following is a real PEF frame returned by `api.algovoi.co.uk/compliance/screen`, with `claim_type` of `payment_admission`:

```json
{
  "canon_version": "urn:x402:canonicalisation:jcs-rfc8785-v1",
  "claim_type": "payment_admission",
  "frame_id": "sha256:9badca886409ed26d09adfe6ce133a53100909dd4544d4ad160e130b6a755f29",
  "frame_provider_did": "did:key:z6MkgExzvcpvxrghf4Q3285xqSdenhRZHcP6wc5UvY6VVaz5",
  "frame_timestamp_ms": 1780143974835,
  "pef_version": "1",
  "receipt": {
    "canon_version": "jcs-rfc8785-v1",
    "jurisdiction_flags": ["UK", "EU"],
    "payer_ref": "sha256:e0f023d54479255752bac099d0565984b5884afec0f1a1ebe27e0eaf70a205ba",
    "screen_provider_did": "did:key:z6MkgExzvcpvxrghf4Q3285xqSdenhRZHcP6wc5UvY6VVaz5",
    "screen_result": "ALLOW",
    "screen_timestamp_ms": 1780143974835
  },
  "receipt_format": "compliance-receipt-v1",
  "receipt_hash": "sha256:bc7a68b64925b8a76109d35e89cca4c7ae04073fa686844975a5b5f4410afa27"
}
```

The `frame_id` and `receipt_hash` are independently verifiable: a receiver with only the `receipt` object can recompute `receipt_hash` by JCS-canonicalising the receipt and SHA-256 hashing the result. A receiver with the full frame (minus `frame_id` and `signature`) can recompute `frame_id` by the same procedure.

## 7. Relationship to Other Extensions

PEF is an envelope layer that composes above the following x402 extension receipt formats:

| Extension | Role under PEF |
|---|---|
| [`compliance-receipt-v1`](./compliance-receipt-v1.md) | Inner receipt for `payment_admission` frames; pre-payment compliance gate |
| [`settlement-attestation-v1`](./settlement-attestation-v1.md) | Inner receipt for `payment_settlement` frames |
| [`cancellation-receipt-v1`](./cancellation-receipt-v1.md) | Inner receipt for `payment_cancellation` frames |
| [`refund-receipt-v1`](./refund-receipt-v1.md) | Inner receipt for `payment_refund` frames |
| [`composite-trust-query-v1`](./composite-trust-query-v1.md) | Inner receipt for `composite_verdict` frames |
| [`rfc9421-x402-binding-v1`](./rfc9421-x402-binding-v1.md) | The optional `signature` field uses the RFC 9421 signing discipline defined there |

PEF does not modify or replace the inner receipt formats. It adds the outer envelope fields (`pef_version`, `claim_type`, `receipt_format`, `receipt_hash`, `frame_id`, `frame_provider_did`, `frame_timestamp_ms`, `canon_version`) around an unchanged inner receipt.

## 8. Security Considerations

**Tamper detection via frame_id**: any change to any field of the preimage (including the inner receipt) produces a different `frame_id`. Receivers storing the `frame_id` as a reference can detect substitution attacks by recomputing the id from a received frame.

**Integrity without full deserialisation**: `receipt_hash` allows a receiver to verify the inner receipt has not been modified without deserialising the `receipt` object. This is useful in routing and logging pipelines that carry the frame but do not parse inner receipt schemas.

**Optional signature**: the `signature` field is optional at the frame level. Deployments that require transport-layer identity binding SHOULD require the `signature` field to be present and SHOULD verify it per the `rfc9421-x402-binding-v1` extension. Deployments that do not require transport-layer identity MAY omit the field.

**DID resolution**: `frame_provider_did` identifies the issuing party. Receivers that require issuer identity SHOULD resolve the DID document to verify the `signature` field and SHOULD reject frames where the signing key does not match the `frame_provider_did`.

## 9. References

- RFC 8785: JSON Canonicalization Scheme (JCS)
- RFC 9421: HTTP Message Signatures
- [`draft-hopley-x402-payment-evidence-frame`](https://datatracker.ietf.org/doc/draft-hopley-x402-payment-evidence-frame/): normative I-D for the PEF envelope format
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation discipline referenced by `canon_version`

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
