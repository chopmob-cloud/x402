# x402 Extension: Pre-Payment Compliance Gate v1

| Field | Value |
|---|---|
| Extension ID | `pre-payment-compliance-gate-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion extension | [`compliance-receipt-v1`](./compliance-receipt-v1.md) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Production reference | [`api.algovoi.co.uk/compliance/screen`](https://api.algovoi.co.uk/compliance/screen) (AlgoVoi APM, live since April 2026) |
| License | Apache 2.0 |

## 1. Scope

This extension defines an HTTP endpoint that any buyer agent, wallet application, or x402 facilitator can call before initiating a payment to obtain a categorical compliance verdict on the payer wallet address. The endpoint returns a receipt in the format specified by [`compliance-receipt-v1`](./compliance-receipt-v1.md), the companion AlgoVoi-authored extension.

This extension defines the endpoint for the admission-time **sanctions and KYC screening** layer. It is distinct from counterparty-risk evidence endpoints (covered by separate proposed extensions, e.g. the `risk-check` extension proposed in x402-foundation/x402#2421). The two layers are orthogonal.

This extension is the senior artefact in the composition with the x402-foundation/x402 base specification primitives. References to "composes with" describe technical integration, not co-authorship.

## 2. Endpoint shape

```
POST {facilitator-base-url}/compliance/screen
Content-Type: application/json

{
  "wallet_address": "string (CAIP-10 or chain-canonical form)",
  "chain": "string (CAIP-2 chain identifier)"
}
```

Response: `200 OK` with a JSON body conforming to the `compliance-receipt-v1` extension format (categorical verdict ALLOW / REFER / DENY, with the SAMLA 2018 s.20 tipping-off discipline applied to the `reasons` field).

The endpoint is unauthenticated by default. Facilitators MAY require authentication; the discovery mechanism for the auth requirement is out of scope for v1.

## 3. Rate limiting

Facilitators SHOULD rate-limit the endpoint. A reasonable default is 60 requests per minute per source IP. Rate-limit responses SHOULD follow standard HTTP `429 Too Many Requests` with a `Retry-After` header.

## 4. SAMLA 2018 s.20 discipline

Endpoint responses MUST follow the tipping-off discipline normatively defined in the companion [`compliance-receipt-v1`](./compliance-receipt-v1.md) extension: generic verdict and reason fields, no disclosure of the specific list or program that produced a match.

## 5. Caching guidance

Verdicts are point-in-time. Buyer agents SHOULD NOT cache an `ALLOW` verdict for longer than the facilitator's declared refresh cadence of its underlying screening data (typically daily). A `REFER` or `DENY` verdict SHOULD NOT be cached beyond the same cadence.

## 6. Composition with the x402-foundation/x402 base specification

This extension composes with:

- [`compliance-receipt-v1`](./compliance-receipt-v1.md), the response format (AlgoVoi-authored companion extension)
- The x402-foundation/x402 base specification's `/verify` flow: buyer agents call this endpoint before constructing the payment payload that `/verify` then validates post-settlement
- The x402-foundation/x402 base specification's `/supported` discovery: facilitators MAY declare support for this extension in their `/supported` response

## 7. Production reference

[`https://api.algovoi.co.uk/compliance/screen`](https://api.algovoi.co.uk/compliance/screen) is AlgoVoi's production implementation of this endpoint shape. It has been live since April 2026. Documentation at [`docs.algovoi.co.uk/platform/compliance-engine`](https://docs.algovoi.co.uk/platform/compliance-engine).

## 8. Backward compatibility

Additive. Facilitators that do not implement the endpoint are unaffected. Buyer agents that do not call the endpoint operate under their own compliance posture.

## 9. Substrate authorship and amendment

This extension is sole AlgoVoi authorship. The endpoint shape, the SAMLA s.20 discipline, the caching guidance, and the composition with the AlgoVoi-authored canonicalisation pin and the AlgoVoi-authored `compliance-receipt-v1` companion extension are AlgoVoi-authored work.

**The endpoint shape is closed by design.** Implementations MUST follow the endpoint specification as written. New parameters or response shapes MAY be introduced only by a normative successor extension document (`pre-payment-compliance-gate-v2` or higher) authored by AlgoVoi or with explicit AlgoVoi co-authorship. Republication of the endpoint shape, the SAMLA discipline, or any normative element under a different attribution does not constitute substrate authorship of those elements.

**Composition direction is fixed.** This extension is the senior artefact in the composition with the x402-foundation/x402 base specification. References to "composes with" describe technical integration, not co-authorship.

Apache 2.0 of the AlgoVoi-authored reference implementation grants permission to USE, MODIFY, and DISTRIBUTE the code. It does not grant permission to REPUBLISH the endpoint specification under a different authorship.

## 10. References

- [`compliance-receipt-v1`](./compliance-receipt-v1.md): response format (AlgoVoi-authored companion extension)
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D, sole AlgoVoi authorship
- RFC 7231: HTTP/1.1 semantics
- UK SAMLA 2018, Section 20

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
