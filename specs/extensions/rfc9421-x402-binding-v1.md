# x402 Extension: RFC 9421 Binding for x402 v1

| Field | Value |
|---|---|
| Extension ID | `rfc9421-x402-binding-v1` |
| Status | Proposal |
| Author | AlgoVoi (chopmob-cloud) |
| Companion canonicalisation I-D | [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/) |
| Reference impl | [`algovoi-rfc9421-verifier`](https://pypi.org/project/algovoi-rfc9421-verifier/) (PyPI) and [`@algovoi/rfc9421-verifier`](https://www.npmjs.com/package/@algovoi/rfc9421-verifier) (npm), Apache 2.0, current version 0.2.1 |
| Conformance fixture | [`chopmob-cloud/algovoi-jcs-conformance-vectors`](https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors), proxy-chain set `rfc9421_proxy_chain_v0` |
| License | Apache 2.0 |

## 1. Scope

This extension defines how RFC 9421 (HTTP Message Signatures) and RFC 9530 (Digest Fields for HTTP) compose with the x402-foundation/x402 base specification to provide transport-layer cryptographic signing of x402 challenge and response messages.

This extension specifies the **x402-message binding** for RFC 9421: which RFC 9421 components are signed on a 402 challenge response, which on a payment proof, the keyid resolution discipline, and the multi-hop proxy-chain survival property that the x402 transport requires.

This extension is distinct from message-signing extensions for agent-to-agent protocols (e.g. the Envoys signature/v1 extension proposed on the a2aproject/A2A repo in a2aproject/A2A#1829, which targets A2A task envelopes, not x402 HTTP requests). The two layers are orthogonal: A2A messages have a different envelope shape than x402 HTTP challenge/response and require their own composition. This extension covers only the x402 HTTP request and response shape.

This extension is complementary to the existing [`http-message-signatures`](./http-message-signatures.md) extension, which specifies agent identity/registration (registrationUrl, signatureSchemes, tags). This extension specifies the normative binding: which components MUST be covered, how Content-Digest is handled, and how signatures survive multi-hop proxy chains. The two compose cleanly in a deployment that uses both.

## 2. Normative format

An x402 challenge or response that adopts this extension carries:

- `Signature-Input` header per RFC 9421, with covered components from the closed set defined in Section 3
- `Signature` header per RFC 9421 carrying the detached signature
- `Content-Digest` header per RFC 9530, carrying a digest of the message body
- Optional `Signature-Algorithm` extension parameter, when the verifier needs to know the algorithm class at admission time

The signing base is constructed per RFC 9421 Section 2.5 with the canonicalisation pin treatment defined in [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/). Component identifiers are quoted per RFC 9421 Section 2.5. The `@signature-params` line is the canonical Inner List from the `Signature-Input` header, present in the signing base by RFC 9421 mandate.

## 3. Covered components for x402 messages

Implementations MUST cover the following RFC 9421 components on an x402 challenge response:

| Component | Source | Rationale |
|---|---|---|
| `@method` | HTTP method of the request that triggered the 402 | Binds the signature to the request method |
| `@authority` | HTTP authority of the resource being challenged | Binds the signature to the resource origin |
| `@path` | HTTP path of the resource being challenged | Binds the signature to the resource path |
| `content-digest` | RFC 9530 Content-Digest of the response body | Binds the signature to the body integrity |

Implementations MAY additionally cover RFC 9421 derived components per facilitator-specific need. The minimum covered set above is normative.

The covered set on a payment proof submission MUST include:

| Component | Source |
|---|---|
| `@method` | HTTP method of the proof submission |
| `@path` | HTTP path of the proof submission |
| `content-digest` | RFC 9530 Content-Digest of the proof body |
| `created` | RFC 9421 created parameter |

## 4. RFC 9530 Content-Digest discipline

Implementations MUST emit Content-Digest using `sha-256` (RFC 9530 mandatory) and SHOULD emit `sha-512` for bodies at or above 4096 bytes (per RFC 9530 implementation guidance). Verifiers MUST accept both `sha-256` and `sha-512`. Verifiers MUST NOT silently skip when only an unsupported algorithm is present in the header; instead, verifiers MUST treat such a Content-Digest as if no usable digest were present and reject the message.

## 5. Multi-hop proxy-chain survival

The signature MUST survive byte-identically across multi-hop proxy chains (e.g. CDN edge to reverse proxy to application server) provided each hop performs TLS re-termination only and does not modify any covered component or the Content-Digest header. The conformance fixture set `rfc9421_proxy_chain_v0` in [`chopmob-cloud/algovoi-jcs-conformance-vectors`](https://github.com/chopmob-cloud/algovoi-jcs-conformance-vectors) provides the byte-level proof of this property.

Verifiers SHOULD re-derive the signing base from the as-received headers without normalising them; the signature verifies byte-for-byte against the bytes the original signer covered.

## 6. Keyid resolution

The `keyid` parameter on the `Signature-Input` header MUST be a stable identifier for the signing key. Implementations MAY use either of the following resolution patterns:

- **DID-based**: `keyid` is a DID (e.g. `did:web:...`), and the verifier resolves the DID document to obtain the public key
- **HTTPS-URL-based**: `keyid` is an HTTPS URL that returns a JSON object containing the public key, per the Envoys signature/v1 convention

Both patterns MUST be supported by conformant verifiers.

## 7. Reference implementation

[`algovoi-rfc9421-verifier`](https://pypi.org/project/algovoi-rfc9421-verifier/) on PyPI and [`@algovoi/rfc9421-verifier`](https://www.npmjs.com/package/@algovoi/rfc9421-verifier) on npm, Apache 2.0, current version 0.2.1. Python and TypeScript with byte-for-byte parity (20 internal unit tests in Python, 18 in TypeScript, all passing).

Cross-validated against external fixture sets: 7 of 7 verifiable vectors PASS across `envoys-rfc9421` (jschoemaker/Envoys-public, 5 positive verifiable + 2 manifest-declared non-verifiable) and `hippo-rfc9421` (opena2a-org/a2a-idf-conformance, 2 composition vectors).

## 8. Composition with the x402-foundation/x402 base specification

This extension composes with the x402 challenge/response flow:

1. Resource server emits a 402 challenge per the x402 base specification
2. With this extension, the challenge response carries `Signature-Input`, `Signature`, and `Content-Digest` headers per Section 2
3. Buyer-agent verifies the signature on the challenge before constructing a payment proof
4. Payment proof submission carries the same header set, signed by the buyer-agent
5. Resource server verifies the payment proof signature before accepting

The signature property is additive to the existing x402 payment-payload validation. Existing x402 payload signatures (which sign the payment proof content) are unchanged; this extension adds transport-layer message-integrity signing on the HTTP request/response envelope.

This extension composes with the [`compliance-receipt-v1`](./compliance-receipt-v1.md), [`settlement-attestation-v1`](./settlement-attestation-v1.md), and [`composite-trust-query-v1`](./composite-trust-query-v1.md) extensions: those define payload-level receipt formats; this extension defines transport-level signing.

## 9. Backward compatibility

This extension is additive. Resource servers that do not adopt RFC 9421 signing on x402 messages are unaffected. Buyer-agents that do not verify transport-layer signatures continue to function as before, subject to their own signature-discipline. Adoption is opt-in per-deployment.

## 10. Minimum covered-components note

The covered-components minimum set defined in Section 3 is normative. Implementations MUST include the minimum set. Implementations MAY add additional components; they MUST NOT remove components from the minimum set. New mandatory components MAY be introduced only by a normative successor extension document (`rfc9421-x402-binding-v2` or higher).

## 11. References

- RFC 9421: HTTP Message Signatures
- RFC 9530: Digest Fields for HTTP
- RFC 8785: JSON Canonicalization Scheme (JCS)
- RFC 8032: Edwards-Curve Digital Signature Algorithm (EdDSA)
- [`draft-hopley-x402-canonicalisation-jcs-v1`](https://datatracker.ietf.org/doc/draft-hopley-x402-canonicalisation-jcs-v1/): canonicalisation pin I-D

-- AlgoVoi (chopmob-cloud)
https://docs.algovoi.co.uk/acquisition
