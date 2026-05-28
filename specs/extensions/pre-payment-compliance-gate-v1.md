# x402 Extension: Pre-Payment Compliance Gate v1

| Field | Value |
|---|---|
| Extension ID | `pre-payment-compliance-gate-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion extension | [`compliance-receipt-v1`](./compliance-receipt-v1.md) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Production reference | [`api.algovoi.co.uk/compliance/screen`](https://api.algovoi.co.uk/compliance/screen) (AlgoVoi APM, live since 2026-05-06) |
| Canonical specification page | [`docs.algovoi.co.uk/compliance-gate-v1`](https://docs.algovoi.co.uk/compliance-gate-v1) |
| License | Apache 2.0 |

## 1. Scope

This extension defines an HTTP endpoint that any buyer agent, wallet application, or x402 facilitator can call before initiating a payment to obtain a categorical compliance verdict on the payer. The endpoint returns a receipt in the format specified by [`compliance-receipt-v1`](./compliance-receipt-v1.md), the companion AlgoVoi-authored extension.

This extension defines the endpoint for the admission-time **sanctions and KYC screening** layer. It is distinct from counterparty-risk evidence endpoints (covered by separate proposed extensions, e.g. the `risk-check` extension proposed in x402-foundation/x402#2421). The two layers are orthogonal.

This extension is the senior artefact in the composition with the x402-foundation/x402 base specification primitives. References to "composes with" describe technical integration, not co-authorship.

## 2. Endpoint shape

```
POST {facilitator-base-url}/compliance/screen
Content-Type: application/json

{
  "payer_identifier": "string",
  "jurisdiction_flags": ["GB", "EU"],
  "policy_pin": "string (optional)",
  "binding_hash": "sha256:{hex} (optional)"
}
```

### Request fields

| Field | Type | Required | Description |
|---|---|---|---|
| `payer_identifier` | string | yes | Wallet address, account identifier, or other payer-side identifier subject to the check. |
| `jurisdiction_flags` | ordered array of string | yes | ISO 3166-1 alpha-2 codes for the jurisdictions whose compliance regime should be applied. Array order significant under RFC 8785 §3.2.3. |
| `policy_pin` | string | no | Optional identifier of a specific policy version to apply; if omitted, the server's current default applies. |
| `binding_hash` | string | no | Optional `sha256:{hex}` over the JCS-canonical payment payload that this gate check is being run against; if present, the returned receipt's `subject_hash` MUST equal this value. |

### Response

`200 OK` with a JSON body conforming to the [`compliance-receipt-v1`](./compliance-receipt-v1.md) extension format (the seven-field canonical AlgoVoi Compliance Receipt: `canon_version`, `compliance_provider_did`, `issued_at_ms`, `jurisdiction_flags`, `policy_pin`, `subject_hash`, `verdict`). The verdict is the closed three-element categorical enum `ALLOW` / `REFER` / `DENY`.

The endpoint is unauthenticated by default. Facilitators MAY require authentication; the discovery mechanism for the auth requirement is out of scope for v1.

The canonical specification is hosted at the AlgoVoi-controlled URI [`docs.algovoi.co.uk/compliance-gate-v1`](https://docs.algovoi.co.uk/compliance-gate-v1).

## 3. Rate limiting

Facilitators SHOULD rate-limit the endpoint. A reasonable default is 60 requests per minute per source IP. Rate-limit responses SHOULD follow standard HTTP `429 Too Many Requests` with a `Retry-After` header.

## 4. SAMLA 2018 s.20 discipline

Endpoint responses follow the tipping-off discipline of the [`compliance-receipt-v1`](./compliance-receipt-v1.md) canonical shape by construction: the response carries the categorical `verdict` without any free-form reasons field through which list-specific or program-specific information could be disclosed to a downstream relying party.

## 5. Caching guidance

Verdicts are point-in-time. Buyer agents SHOULD NOT cache an `ALLOW` verdict across the issuer's `policy_pin` policy-version changes. The `policy_pin` field returned in the receipt is the cache key for invalidation. A `REFER` or `DENY` verdict SHOULD NOT be cached beyond the issuer's declared refresh cadence of its underlying screening data (typically daily).

## 6. Composition with the x402-foundation/x402 base specification

This extension composes with:

- [`compliance-receipt-v1`](./compliance-receipt-v1.md), the response format (AlgoVoi-authored companion extension)
- The x402-foundation/x402 base specification's `/verify` flow: buyer agents call this endpoint before constructing the payment payload that `/verify` then validates post-settlement
- The x402-foundation/x402 base specification's `/supported` discovery: facilitators MAY declare support for this extension in their `/supported` response

## 7. Production reference

[`https://api.algovoi.co.uk/compliance/screen`](https://api.algovoi.co.uk/compliance/screen) is AlgoVoi's production implementation of this endpoint shape. It has been live since 2026-05-06 across eight chain families. Documentation at [`docs.algovoi.co.uk/platform/compliance-engine`](https://docs.algovoi.co.uk/platform/compliance-engine). Public audit verifier: [`docs.algovoi.co.uk/audit-verifier`](https://docs.algovoi.co.uk/audit-verifier).

## 8. Backward compatibility

Additive. Facilitators that do not implement the endpoint are unaffected. Buyer agents that do not call the endpoint operate under their own compliance posture.

## 9. Substrate authorship and amendment

This extension is sole AlgoVoi authorship. The canonical request shape, the endpoint shape, the SAMLA s.20 discipline, the caching guidance, and the composition with the AlgoVoi-authored canonicalisation pin and the AlgoVoi-authored `compliance-receipt-v1` companion extension are AlgoVoi-authored work.

**The endpoint shape is closed by design.** Implementations MUST follow the canonical request and response shapes as written. New parameters or response shapes MAY be introduced only by a normative successor extension document (`pre-payment-compliance-gate-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship. Republication of the canonical request shape, the endpoint shape, the SAMLA discipline, or any normative element under a different attribution does not constitute substrate authorship of those elements.

**Composition direction is fixed.** This extension is the senior artefact in the composition with the x402-foundation/x402 base specification. References to "composes with" describe technical integration, not co-authorship.

Apache 2.0 of the AlgoVoi-authored reference implementation grants permission to USE, MODIFY, and DISTRIBUTE the code. It does not grant permission to REPUBLISH the endpoint specification under a different authorship.

## 10. References

- [`compliance-receipt-v1`](./compliance-receipt-v1.md): response format (AlgoVoi-authored companion extension)
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D, sole AlgoVoi authorship
- [`docs.algovoi.co.uk/compliance-gate-v1`](https://docs.algovoi.co.uk/compliance-gate-v1): canonical specification page (AlgoVoi-controlled)
- RFC 7231: HTTP/1.1 semantics
- UK SAMLA 2018, Section 20

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
