# Extension: `bazaar`

## Summary

The `bazaar` extension enables **resource discovery and cataloging** for x402-enabled endpoints and MCP tools. Resource servers declare their endpoint specifications (HTTP method or MCP tool name, input parameters, and output format) so that facilitators can catalog and index them in a discovery service.

---

## `PaymentRequired`

A resource server advertises its endpoint specification by including the `bazaar` extension in the `extensions` object of the **402 Payment Required** response.

The extension follows the standard v2 pattern:
- **`info`**: Contains the actual discovery data (HTTP method or MCP tool name, input parameters, and output format)
- **`schema`**: JSON Schema that validates the structure of `info`

The `info.input` object uses a discriminated union type, distinguished by the `type` field:
- `input.type: "http"` — HTTP endpoints (further discriminated by `method` into query parameter methods vs body methods)
- `input.type: "mcp"` — MCP (Model Context Protocol) tools

### Example: GET Endpoint

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "https://api.example.com/weather",
    "description": "Weather data endpoint",
    "mimeType": "application/json",
    "serviceName": "Example Weather",
    "tags": ["weather", "forecast"],
    "iconUrl": "https://api.example.com/icon.png"
  },
  "accepts": [ ... ],
  "extensions": {
    "bazaar": {
      "info": {
        "input": {
          "type": "http",
          "method": "GET",
          "queryParams": {
            "city": "San Francisco"
          }
        },
        "output": {
          "type": "json",
          "example": {
            "city": "San Francisco",
            "weather": "foggy",
            "temperature": 60
          }
        }
      },
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "input": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "const": "http" },
              "method": { "type": "string", "enum": ["GET", "HEAD", "DELETE"] },
              "queryParams": {
                "type": "object",
                "properties": {
                  "city": { "type": "string" }
                },
                "required": ["city"]
              },
              "headers": {
                "type": "object",
                "additionalProperties": {
                  "type": "string"
                }
              }
            },
            "required": ["type", "method"],
            "additionalProperties": false
          },
          "output": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "example": { "type": "object" }
            },
            "required": ["type"]
          }
        },
        "required": ["input"]
      }
    }
  }
}
```

### Example: POST Endpoint

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "https://api.example.com/search",
    "description": "Search endpoint",
    "mimeType": "application/json"
  },
  "accepts": [ ... ],
  "extensions": {
    "bazaar": {
      "info": {
        "input": {
          "type": "http",
          "method": "POST",
          "bodyType": "json",
          "body": {
            "query": "example"
          }
        },
        "output": {
          "type": "json",
          "example": {
            "results": []
          }
        }
      },
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "input": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "const": "http" },
              "method": { "type": "string", "enum": ["POST", "PUT", "PATCH"] },
              "bodyType": { "type": "string", "enum": ["json", "form-data", "text"] },
              "body": { "type": "object" },
              "queryParams": {
                "type": "object",
                "additionalProperties": {
                  "type": "string"
                }
              },
              "headers": {
                "type": "object",
                "additionalProperties": {
                  "type": "string"
                }
              }
            },
            "required": ["type", "method", "bodyType", "body"],
            "additionalProperties": false
          },
          "output": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "example": { "type": "object" }
            },
            "required": ["type"]
          }
        },
        "required": ["input"]
      }
    }
  }
}
```

### Example: MCP Tool

```json
{
  "x402Version": 2,
  "error": "Payment required",
  "resource": {
    "url": "https://api.example.com/mcp",
    "description": "Advanced AI-powered financial tools",
    "mimeType": "application/json"
  },
  "accepts": [ ... ],
  "extensions": {
    "bazaar": {
      "info": {
        "input": {
          "type": "mcp",
          "toolName": "financial_analysis",
          "description": "Advanced AI-powered financial analysis",
          "inputSchema": {
            "type": "object",
            "properties": {
              "ticker": { "type": "string" },
              "analysis_type": { "type": "string", "enum": ["quick", "deep"] }
            },
            "required": ["ticker"]
          },
          "example": {
            "ticker": "AAPL",
            "analysis_type": "deep"
          }
        },
        "output": {
          "type": "json",
          "example": {
            "summary": "Strong fundamentals...",
            "score": 8.5
          }
        }
      },
      "schema": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "input": {
            "type": "object",
            "properties": {
              "type": { "type": "string", "const": "mcp" },
              "toolName": { "type": "string" },
              "description": { "type": "string" },
              "transport": { "type": "string", "enum": ["streamable-http", "sse"] },
              "inputSchema": { "type": "object" },
              "example": { "type": "object" }
            },
            "required": ["type", "toolName", "inputSchema"],
            "additionalProperties": false
          },
          "output": {
            "type": "object",
            "properties": {
              "type": { "type": "string" },
              "example": { "type": "object" }
            },
            "required": ["type"]
          }
        },
        "required": ["input"]
      }
    }
  }
}
```

---

## Discovery Info Structure

### Input Types

The `info.input` object describes how to call the endpoint or tool.

#### Query Parameter Methods (GET, HEAD, DELETE)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Always `"http"` |
| `method` | string | Yes | One of `"GET"`, `"HEAD"`, `"DELETE"` |
| `queryParams` | object | No | Query parameter examples |
| `headers` | object | No | Custom header examples |

#### Body Methods (POST, PUT, PATCH)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Always `"http"` |
| `method` | string | Yes | One of `"POST"`, `"PUT"`, `"PATCH"` |
| `bodyType` | string | Yes | One of `"json"`, `"form-data"`, `"text"` |
| `body` | object/string | Yes | Request body example |
| `queryParams` | object | No | Query parameter examples |
| `headers` | object | No | Custom header examples |

#### MCP Tools

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Always `"mcp"` |
| `toolName` | string | Yes | MCP tool name (matches what's passed to `tools/call`) |
| `description` | string | No | Human-readable description of the tool |
| `inputSchema` | object | Yes | JSON Schema for the tool's `arguments`, following the MCP [`Tool.inputSchema`](https://spec.modelcontextprotocol.io/) format (a JSON Schema subset with `type: "object"`, `properties`, and `required`). Servers should reuse the same schema their MCP tool already declares. |
| `transport` | string | No | MCP transport protocol. One of `"streamable-http"` or `"sse"`. Defaults to `"streamable-http"` if omitted. |
| `example` | object | No | Example `arguments` object |

> **Note:** For MCP tools, the unique resource identifier is the tuple (`resource.url`, `input.toolName`). Since MCP multiplexes multiple tools over a single server endpoint, `resource.url` alone may not be unique. Facilitators **must** use both fields when cataloging MCP tools.

### Output Types

The `info.output` object (optional) describes the expected response format:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Response content type (e.g., `"json"`, `"text"`) |
| `format` | string | No | Additional format information |
| `example` | any | No | Example response value |

> **Note:** For MCP tools, if `output` is omitted, facilitators should assume arbitrary text content (MCP's default response type).

### Input Type Discriminator

The `input.type` field acts as a discriminator for the discovery info structure:

| `input.type` | Structure | Description |
|--------------|-----------|-------------|
| `"http"` | QueryDiscoveryInfo | HTTP GET/HEAD/DELETE with query parameters |
| `"http"` | BodyDiscoveryInfo | HTTP POST/PUT/PATCH with request body (has `bodyType`) |
| `"mcp"` | MCPDiscoveryInfo | MCP tool invocation |

Facilitators should use `input.type` to determine which validation rules apply. For HTTP inputs, the presence of `bodyType` further distinguishes between query and body methods.

---

## Schema Validation

The `schema` field contains a JSON Schema (Draft 2020-12) that validates the structure of `info`.

**Requirements:**
- Must use JSON Schema Draft 2020-12
- Must define an `input` property (required)
- May define an `output` property (optional)
- Must validate that `input.type` equals `"http"` (for HTTP endpoints) or `"mcp"` (for MCP tools)
- For HTTP endpoints: Must validate the appropriate `method` enum based on operation type
- For MCP tools: Must require `toolName` and `inputSchema` fields

Facilitators **must** validate `info` against `schema` before cataloging.

### MCP Schema Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "input": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "const": "mcp" },
        "toolName": { "type": "string" },
        "description": { "type": "string" },
        "transport": { "type": "string", "enum": ["streamable-http", "sse"] },
        "inputSchema": { "type": "object" },
        "example": { "type": "object" }
      },
      "required": ["type", "toolName", "inputSchema"],
      "additionalProperties": false
    },
    "output": {
      "type": "object",
      "properties": {
        "type": { "type": "string" },
        "example": {}
      },
      "required": ["type"]
    }
  },
  "required": ["input"]
}
```

---

## Service Metadata on `resource`

Resource servers MAY publish provider-level metadata describing the service that
hosts the resource. Facilitators use these fields to enrich Bazaar search results
with a human-readable name, topical tags, and an icon, without any out-of-band
admin step. The fields live on the **top-level `resource` object** of the
`PaymentRequired` response (alongside `url`, `description`, `mimeType`) and are
echoed by clients in the `PaymentPayload.resource` exactly like `description`
and `mimeType`.

All fields are optional and purely additive. Servers that omit them produce
byte-identical 402 bodies; clients that don't recognize them ignore them.

| Field         | Type            | Required | Description                                                                                  |
|---------------|-----------------|----------|----------------------------------------------------------------------------------------------|
| `serviceName` | string          | No       | Human-readable name for the service (the authority that hosts the resource).                 |
| `tags`        | array of string | No       | Short topical tags describing the service. Used for facilitator-side filtering and search.   |
| `iconUrl`     | string          | No       | Absolute `https`/`http` URL to an icon image representing the service.                       |

### Validation Rules

The facilitator is a trust boundary: clients echo the `resource` block from
`PaymentRequired` into `PaymentPayload`, so a malicious client could submit
hostile metadata to poison the catalog. SDKs and facilitators MUST apply the
following soft-drop rules during extraction. A field that fails its rule is
discarded; the surrounding metadata is preserved.

| Field         | Rule                                                                                                                                                                                                                  | On violation                                                            |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `serviceName` | Non-empty string of printable ASCII (U+0020–U+007E), length ≤ 32 characters; contains no Unicode control characters (category Cc).                                                                                   | Drop the field.                                                         |
| `tags`        | Array of strings; at most 5 entries; each entry non-empty, printable ASCII (U+0020–U+007E), length ≤ 32 characters, no Unicode control characters; entries deduplicated case-insensitively (first occurrence wins). | Truncate to the first 5 valid entries; drop individual invalid entries. |
| `iconUrl`     | String of length ≤ 2048; parses as an absolute `http://` or `https://` URL; no `data:` / `file:` / other non-http schemes; no userinfo (`user@`); host is IDN-normalized (UTS #46) before checks; not an IP literal (v4 or v6), not in the loopback set (`localhost`, `localhost.localdomain`, `ip6-localhost`, `ip6-loopback`), not an all-digit hostname (decimal IP encodings like `2130706433`), and not a hex literal (`0x7f000001`); contains no control characters. | Drop the field.                                                         |

Implementations MUST percent-decode the iconUrl host before applying the IP /
`localhost` checks (parallel to how `routeTemplate` is decoded before its `..`
and `://` checks).

The `serviceName` and `tags` ASCII restriction follows the same convention as
`paymentidentifier.id`: bounding the character set to printable ASCII keeps
length checks identical across all three SDKs (where `len()` semantics
otherwise diverge — UTF-16 code units in TypeScript, code points in Python,
bytes in Go) and avoids non-ASCII display ambiguity in catalog UIs. Providers
that need to display localized names should rely on the consuming UI for
internationalization rather than encoding non-ASCII characters in this field.

All SDK implementations expose helpers that apply these rules identically:
`isValidServiceName`, `sanitizeTags`, `isValidIconUrl`, and a combined
`sanitizeResourceServiceMetadata` (TypeScript, Go) or `_is_valid_service_name`,
`_sanitize_tags`, `_is_valid_icon_url`, `_sanitize_resource_service_metadata`
(Python). **All three copies must stay in sync.**

> **SDK implementers:** If you add a fourth SDK, copy these validation rules
> exactly, including the percent-decoding step before the IP / `localhost`
> checks for `iconUrl`.

Hard rejection only happens at the JSON envelope level (handled by existing
extraction error paths). Image content-type, size, and dimension validation
are out of scope for the SDK helpers and remain the facilitator's
responsibility (e.g. via Cloudinary at serve time).

---

## Facilitator Behavior

When a facilitator receives a `PaymentPayload` containing the `bazaar` extension, it should:

1. **Validate** the `info` field against the provided `schema`
2. **Extract** the discovery information (resource URL, HTTP method or MCP tool name, input/output specs)

How a facilitator stores, indexes, and exposes discovered resources is an implementation detail. Facilitators may choose to catalog resources in a database, expose them via a discovery API, or process them in any manner they see fit.

### Optional Discovery Endpoints

Facilitators that implement Bazaar discovery may expose discovery APIs to let clients browse and search cataloged resources.

#### `GET /discovery/resources`

Lists discoverable x402 resources.

| Parameter | Type     | Required | Description                                 |
| --------- | -------- | -------- | ------------------------------------------- |
| `type`    | `string` | Optional | Filter by resource type (for example, `http` or `mcp`) |
| `payTo`   | `string` | Optional | Filter by payment recipient address |
| `scheme`  | `string` | Optional | Filter by payment scheme (for example, `exact`) |
| `network` | `string` | Optional | Filter by payment network (for example, `eip155:8453`) |
| `extensions` | `string` | Optional | Filter by extension key present on each resource (for example, `bazaar`) |
| `limit`   | `number` | Optional | Maximum number of results to return |
| `offset`  | `number` | Optional | Number of results to skip for pagination |

#### `GET /discovery/search`

Searches discoverable x402 resources using a natural-language query. Response shape mirrors the list endpoint with a `resources` array and optional `pagination`.

| Parameter | Type     | Required | Description                                 |
| --------- | -------- | -------- | ------------------------------------------- |
| `query`   | `string` | Yes      | Natural-language search query |
| `type`    | `string` | Optional | Filter by resource type (for example, `http` or `mcp`) |
| `payTo`   | `string` | Optional | Filter by payment recipient address |
| `scheme`  | `string` | Optional | Filter by payment scheme (for example, `exact`) |
| `network` | `string` | Optional | Filter by payment network (for example, `eip155:8453`) |
| `extensions` | `string` | Optional | Filter by extension key present on each resource (for example, `bazaar`) |
| `limit`   | `number` | Optional | Advisory maximum number of results; facilitator may return fewer or ignore |
| `cursor`  | `string` | Optional | Advisory continuation cursor from a previous page |

Search responses may include:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `partialResults` | `boolean` | No | `true` when additional matches were truncated |
| `pagination` | `object` or `null` | No | Pagination details for a paginated response |
| `pagination.limit` | `number` | Yes (when `pagination` is an object) | Number of results in this page |
| `pagination.cursor` | `string` or `null` | Yes (when `pagination` is an object) | Cursor for the next page, or `null` if unavailable |

### Verify and Settlement Response Header

After processing a `PaymentPayload`, a facilitator **MAY** append an `EXTENSION-RESPONSES` HTTP header to the verify or settlement response to communicate extension-specific outcomes to the client.

**Header name:** `EXTENSION-RESPONSES`

**Header value:** A base64-encoded JSON object keyed by extension name. The `bazaar` key contains the bazaar extension's response:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bazaar.status` | string | Yes | One of `"success"`, `"processing"`, or `"rejected"` |
| `bazaar.rejectedReason` | string | No | Human-readable explanation. Only present when `status` is `"rejected"` |

**Status values:**

| Value | Meaning |
|-------|---------|
| `"success"` | The discovery info was validated and successfully cataloged |
| `"processing"` | The discovery info was accepted and is being cataloged asynchronously |
| `"rejected"` | The discovery info was rejected (e.g., failed schema validation). See `rejectedReason` for details |

**Example (success):**

```
EXTENSION-RESPONSES: eyJiYXphYXIiOnsic3RhdHVzIjoic3VjY2VzcyJ9fQ==
```
*(base64 of `{"bazaar":{"status":"success"}}`)*

**Example (rejected):**

```
EXTENSION-RESPONSES: eyJiYXphYXIiOnsic3RhdHVzIjoicmVqZWN0ZWQiLCJyZWplY3RlZFJlYXNvbiI6ImluZm8gZmFpbGVkIHNjaGVtYSB2YWxpZGF0aW9uIn19
```
*(base64 of `{"bazaar":{"status":"rejected","rejectedReason":"info failed schema validation"}}`)*

Clients that understand the `bazaar` extension SHOULD read the `bazaar` key of this header to confirm cataloging succeeded and surface any rejection reason for debugging.

---

## Client Behavior

Clients are expected to echo the `bazaar` extension from `PaymentRequired` into their `PaymentPayload`. If the extension is omitted, discovery cataloging will not occur.

---

## Dynamic Routes and `routeTemplate`

HTTP endpoints can use parameterized route patterns (e.g. `/users/[userId]`). When a route has
parameter segments, the server extension enriches the extension with two additional fields:

- **`info.input.pathParams`** — concrete parameter values for this specific request (e.g. `{ "userId": "123" }`)
- **`routeTemplate`** — the canonical template with `:param` syntax (e.g. `/users/:userId`)

The `routeTemplate` field at the **top level** of the extension object is the catalog key contract between
server and facilitator. Facilitators use it to map all concrete requests (e.g. `/users/123`, `/users/456`)
to a single canonical catalog entry.

### `routeTemplate` Wire Format

- The server writes patterns using `[paramName]` syntax internally (matches the route framework convention).
- The extension delivers `routeTemplate` externally using `:paramName` syntax, consistent with REST conventions.
- The field is **absent** for static routes; facilitators MUST treat an absent `routeTemplate` as "use the concrete URL path".

Example of an enriched extension for a dynamic route:

```json
{
  "info": {
    "input": {
      "type": "http",
      "method": "GET",
      "pathParams": { "userId": "123" }
    }
  },
  "schema": { ... },
  "routeTemplate": "/users/:userId"
}
```

### `routeTemplate` Validation Rules

The facilitator MUST validate `routeTemplate` before using it as a catalog key. The expected format
uses colon-prefixed parameter identifiers (e.g. `/users/:userId`, `/weather/:country/:city`).
All SDK implementations use the function `isValidRouteTemplate` (TypeScript, Go) or
`_is_valid_route_template` (Python) which applies the following rules identically.
**All three copies must stay in sync.**

| Rule | Reason |
|------|--------|
| Must be a non-empty string | Empty/absent means "no template" |
| Must start with `/` | Prevents relative paths and external URLs |
| Must match `^/[a-zA-Z0-9_/:.\-~%]+$` | Only allows safe URL path characters and `:param` identifiers |
| Must not contain `..` | Prevents path traversal (`/users/../admin`) |
| Must not contain `://` | Prevents URL injection (`http://evil.com`) |

All implementations decode percent-encoding (e.g. `%2e%2e` -> `..`) before applying the traversal
and scheme checks. A value that fails any rule is discarded; the facilitator falls back to the
concrete URL path for cataloging.

> **SDK implementers:** If you add a fourth SDK, copy these validation rules exactly, including
> the percent-decoding step before the `..` and `://` checks.

---

## Backwards Compatibility

The `bazaar` extension was formalized in x402 v2. Discovery functionality unofficially existed in x402 v1 through the `outputSchema` field.

Facilitators are **not expected** to support v1. If v1 support is desired:

| V1 Location | V2 Location |
|-------------|-------------|
| `accepts[0].outputSchema` | `extensions.bazaar` |
| `accepts[0].resource` | `resource.url` |
| `accepts[0].description` | `description` (top-level) |
| `accepts[0].mimeType` | `mimeType` (top-level) |

V1 had no formal schema validation.

---

## Settlement Visibility: `privacy_class`

### Overview

The `privacy_class` field declares the **settlement-plane visibility** of a Bazaar-listed service — specifically, how visible the underlying x402 settlement is to the measurement and compliance layers. It is an optional field on `extensions.bazaar` and is **orthogonal** to `evidenceType` (which describes the receipt shape of the evidence the service produces, not the settlement itself).

| Field | Type | Required | Description |
|---|---|---|---|
| `privacy_class` | string | No | Settlement-plane visibility intent. See enumeration below. Facilitators MUST treat unrecognised values as `null`. |

### Values

| Value | Description |
|---|---|
| `"public-settlement"` | Settlement is readable on chain. Fully visible to the observational layer. Default for all existing Bazaar services; assumed when `privacy_class` is absent. |
| `"attested-private"` | Settlement details are hidden, but a non-revealing proof-of-occurrence is anchored publicly. The observational layer counts the attestation artifact, not the individual settlement. Aligns with MiCA Art. 80 (5y record-keeping), AMLR Art. 56 (retention), GDPR Art. 5(1)(c) (data minimisation), ISO 20022 sanctions screening without transaction-graph leakage. |
| `"fully-private"` | No public artifact emitted. Explicitly outside the measurement plane. Regulatory implementors generally cannot operate here under AMLR Art. 22 (PEP enhanced CDD requires verifiable trails) or DORA Art. 17 (incident reporting). Declaring this value lets observers and policy routers route around the service rather than appear to miscount. |

The enumeration is **open**: future values MAY be added via spec PR without invalidating existing entries.

### Orthogonality with `evidenceType`

`privacy_class` and `evidenceType` are independent axes. `evidenceType` describes what a service produces and attests to; `privacy_class` describes what the underlying settlement reveals on chain. Any combination is valid:

| Example | `evidenceType` | `privacy_class` |
|---|---|---|
| Bank settling stablecoin under MiCA, hiding transaction graph | `regulatory` | `attested-private` |
| ZK proof emitter on a transparent chain | `cryptographic` | `public-settlement` |
| Behavioral gateway with fully public settlement | `behavioral` | `public-settlement` |
| ZK-shielded endpoint with no public artifact | `cryptographic` | `fully-private` |

### Cardinality counting for `attested-private` batches

A single Merkle-root anchor may commit to N individual settlements. Without an explicit count, the observational layer cannot distinguish a 1-settlement anchor from a 1,000-settlement batch — making public and batched-private rails permanently compare-incomparable at the aggregate level.

**Rule (MUST):** When `privacy_class` is `"attested-private"`, the emitter MUST include `settlement_count` inside the JCS-canonicalised, signed attestation object:

```json
{
  "attestation": {
    "settlement_count": 47,
    "merkle_root": "0xabc...",
    "framework": "MiCA",
    "issuer_did": "did:web:tooloracle.io",
    "timestamp": "2026-05-15T20:00:00Z"
  },
  "signature": "es256k(JCS(attestation))"
}
```

`settlement_count` MUST be inside the signed `attestation` object, not published as a separate adjacent field. This binds the batch size to the attestation under MiCA Art. 80 / AMLR Art. 56 retention — a regulator holding the signed object can verify the count without trusting an out-of-band assertion.

Emitters MAY replace or augment `settlement_count` with a succinct batch-size proof (format implementation-defined under `evidenceType: cryptographic`). Observers that cannot verify the proof MUST fall back to the `settlement_count` integer; observers that encounter neither MUST count 1 per anchor event (explicit declared fallback, not silent undercount).

### Cross-observer determinism

Two observational implementors measuring the same `attested-private` rail MUST produce identical per-class aggregates for the same time window. Deduplication rule:

> An attestation event is counted if and only if `(JCS_hash(attestation), anchor_chain, block_number)` is unique within the observer's declared observation window. `JCS_hash` is defined as the SHA-256 digest of the JCS (RFC 8785) serialisation of the attestation object, encoded as lowercase hex.

SHA-256 is the mandatory floor. Future algorithm agility MAY be added behind a version field without breaking v1 consumers.

The **observation window** is the contiguous time range over which the observer asserts complete coverage, as declared in its own registry entry. Counts from different observers with different windows may legitimately differ; the window is part of the count's identity, not a hidden parameter. Observers MUST declare their window in their registry entry.

### Regulatory emitter behaviour for `fully-private` payers

Regulatory checks under AMLR Art. 22 (PEP enhanced CDD), MiCA Art. 35 (reserve attestation), and PSD2 Art. 97 (SCA) require verifiable trails as a constitutive element of the check — not as auxiliary evidence. A fully-private settlement produces no verifiable trail; any attestation issued against it is legally void under these frameworks while appearing identical to a genuine determination at the protocol layer.

**Rule (MUST NOT / SHOULD):** A regulatory emitter receiving a `TrustQuery` with `payer.privacy_class: "fully-private"` MUST NOT return `decision: ALLOW` or `decision: BLOCK` without an `evidence_unverifiable` flag. The emitter SHOULD either:

- **(a) Refuse:** Return `decision: "REFUSE"` with `reason_code: "EVIDENCE_UNVERIFIABLE"`.
- **(b) Degrade:** Return the closest applicable determination with `evidence_unverifiable: true` appended inside the signed attestation payload.

Implementors with different risk appetites MAY choose either path; the spec requires one of the two. Silent acceptance is not compliant.

**Per-band regulatory feasibility (informative):**

| Check | `public-settlement` | `attested-private` | `fully-private` |
|---|---|---|---|
| AMLR Art. 16 (sanctions screen) | ✓ direct | ✓ on commitment | ✗ |
| AMLR Art. 22 (PEP enhanced CDD) | ✓ | ⚠ commitment + reveal-on-trigger | ✗ |
| AMLR Art. 44 (STR filing) | ✓ | ✓ trigger reveals to FIU only | ✗ |
| MiCA Art. 35 (reserve attestation) | ✓ | ✓ Merkle root of reserves | ✗ |
| MiCA Art. 80 (5y retention) | ✓ | ✓ encrypted-at-rest acceptable | ✓ private-but-retained |
| PSD2 Art. 97 (SCA) | ✓ | ✓ | ✗ |
| DORA Art. 17 (incident report) | ✓ | ✓ party reveals to NCA | ✗ |
| ISO 20022 pacs.008 (sanctions) | ✓ on plaintext | ✓ on commitment | ✗ |

Pattern: most regulatory checks compose with `attested-private` if the commitment scheme supports the right disclosure primitive. Almost none compose with `fully-private` because verifiable trails are constitutive of the check under EU AMLR, MiCA, DORA, and PSD2/3. `fully-private` is effectively an opt-out from regulatory applicability for most frameworks.

### `disclosure_policy` sub-field (optional)

For `privacy_class: "attested-private"` services, an optional `disclosure_policy` sub-field MAY be declared on `extensions.bazaar` to distinguish the selective-disclosure pattern from the non-revealing pattern:

| Value | Description |
|---|---|
| `"non-revealing"` | The commitment is final. No disclosure path exists after anchoring. Default when `disclosure_policy` is absent on an `attested-private` service. |
| `"reveal-on-authority-request"` | The commitment can be selectively disclosed to a named authority class (e.g. FIU, NCA) under a defined trigger (e.g. court order, suspicious transaction report). The disclosure mechanism is implementation-defined. |

The `disclosure_policy` enum is open. Implementors MAY declare other `disclosure_policy` values (for example `"reveal-on-court-order"`, where the trigger is specifically a judicial order rather than an administrative FIU/NCA request — a distinction with subtly different semantics in some EU jurisdictions). Facilitators MUST treat unknown `disclosure_policy` values as opaque (no policy-based routing) rather than rejecting the registry entry, for the same maintenance-pressure reason the `framework` enum in #2322 is open: jurisdictional disclosure mechanics evolve faster than spec PR cycles.

Facilitators MUST treat `disclosure_policy` as informative metadata; they MUST NOT gate payment processing on its value.

### Manifest anchoring for `attested-private` × regulatory emitters

For `attested-private` services with `evidenceType: regulatory` operating under MiCA Art. 80 / AMLR Art. 56 retention obligations, auditor-only Object Lock reconciliation is structurally weaker than third-party-verifiable count monotonicity. An emitter retaining its own off-VM manifest can prune the manifest and keep the on-chain attestation count consistent with the redacted bundle; auditor reconciliation passes but the count assertion remains uncontested by any party without disclosure authority.

**Rule (MUST):** For `privacy_class: "attested-private"` with `evidenceType: "regulatory"`, the emitter MUST anchor the off-VM manifest's Merkle root on chain at each commitment epoch. The on-chain anchor MUST be a JCS-canonical attestation carrying `(manifest_root, epoch, settlement_count)` inside the signed object. Any third party (not only an auditor with `disclosure_policy` authority) MUST be able to verify count monotonicity against the on-chain anchor sequence.

**Rule (MUST) — auditor-availability independence:** The on-chain Merkle root commits to the manifest's content, so manifest integrity MUST be verifiable against the on-chain root independently of the auditor's availability. If the auditor service is unreachable, a client that obtains the manifest content from any source (mirror, cache, alternative manifest host) MUST be able to verify that content against the on-chain root by content-hash equality, without the auditor in the path. The auditor's role is therefore narrowed to "publish the root + serve the manifest content"; it is not a verification bottleneck. An auditor outage MUST NOT stall integrity verification of an already-anchored manifest.

Pattern reference: `audit_chain.off_vm_shipment` rows anchored on chain at each commitment epoch (tested-against: AlgoVoi `/compliance/attestation` `audit_chain` schema as live on 2026-05-19, `evidence_provider.identity_reference` populated), with off-VM Object Lock COMPLIANCE 7y retention sitting underneath the on-chain anchor. The on-chain anchor is the primary third-party-verifiable denominator; auditor reconciliation against retention storage remains the secondary path. Live implementation surfaced at `/compliance/attestation` under `audit_chain.head`. Downstream readers SHOULD treat the cited pattern as version-pinned: conformance is asserted against the schema shape at the tested-against date, not an unversioned reference.

### Attestation cadence floor (`attestation_cadence`)

A self-declared cadence with no upper bound is gameable: an emitter declaring `heartbeat: 24h` under DORA produces an undetectable 24-hour silent-stop window even though DORA Art. 14 requires major-incident notification within 4 hours of classification. The spec MUST bind cadence to the strictest declared regulatory framework.

**Rule (MUST):** When `evidenceShape.framework` declares one or more regulatory regimes, `attestation_cadence` MUST be `≤` the strictest incident-timing requirement of any declared framework:

| Framework | Cadence floor |
|---|---|
| DORA Art. 14 (major ICT-related incidents) | `attestation_cadence` ≤ 4 hours (initial notification window) |
| AMLR Art. 56 (retention bundle freshness) | `attestation_cadence` ≤ 24 hours |
| MiCA Art. 80 (record-keeping) | `attestation_cadence` ≤ 24 hours |
| ISO 20022 sanctions screening (pacs.008) | `attestation_cadence` ≤ commitment_epoch (real-time at settlement) |
| PSD2/3 Art. 97 (SCA) | `attestation_cadence` ≤ commitment_epoch (per-settlement) |

Observers MUST reject `attestation_cadence` values that exceed the framework-derived floor. Emitters with multiple declared frameworks bind to the **strictest** value (intersection, not union).

`attestation_cadence` MUST be declared in the registry entry alongside `framework`. Observers compute coverage as `observed_attestations / expected_attestations` over the declared cadence window. Coverage below 100% is a positive observer signal that silent-stops are detectable, not a defect.

### Privacy class mutability and append-only declaration history

A service that flips `public-settlement` → `fully-private` mid-flight creates a window where in-flight observations sit in the wrong bucket. A service that declares `fully-private` retroactively could escape measurement of behavior already observed on chain. Without an append-only declaration history, the `privacy_class` field is a coverage hint rather than a compliance primitive.

**Rule (MUST) — per-attestation binding:** The `privacy_class` value at the time of attestation emission MUST be bound to the attestation, not derived from the current registry value. The signed attestation object MUST carry `(privacy_class, effective_block_height)` inside the JCS-canonicalised payload:

```json
{
  "attestation": {
    "privacy_class": "attested-private",
    "effective_block_height": 19847230,
    "settlement_count": 47,
    "manifest_root": "0xabc...",
    "framework": "MiCA",
    "issuer_did": "did:web:tooloracle.io",
    "timestamp": "2026-05-19T06:00:00Z"
  },
  "signature": "ed25519(JCS(attestation))"
}
```

This binds the declared class to the block height at which the attestation was emitted, closing the retroactive-declaration path identified in #2326.

**Rule (SHOULD) — append-only registry log:** `privacy_class` declaration history SHOULD land in an append-only transparency-log substrate, with `(class, effective_block_height)` pairs the canonical observable. RFC 9162-shaped transparency logs (Foxbook, CT, Sigsum) are the recommended primitive; the registry-entry history becomes third-party-observable without per-emitter trust.

Reference implementation: `did:foxbook:01KRXTMK3Z20J7V7MMD17W6T59` (Foxbook leaf 7) carries an AlgoVoi registry-entry history at https://transparency.foxbook.dev/leaf/7, where each `privacy_class` declaration pairs with its `effective_block_height` and the leaf inclusion proof is observable independently of the emitter.

### Related

- [#2322](https://github.com/x402-foundation/x402/pull/2322) — `category: Compliance` taxonomy, `evidenceType`/`evidenceShape` fields, and constraint rules. `privacy_class` is additive to that taxonomy.
- [#2326](https://github.com/x402-foundation/x402/issues/2326) — Working group discussion that produced this spec text.
- [a2aproject/A2A#1786](https://github.com/a2aproject/A2A/issues/1786) — JCS canonicalization alignment on the behavioral side.
