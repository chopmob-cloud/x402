/**
 * Shared startup-time validation utilities for bazaar extensions in route configs.
 *
 * Used by middleware packages (Express, Hono, Next) to validate bazaar extensions
 * at server startup without duplicating the iteration and warning logic.
 */

import type { RoutesConfig } from "@x402/core/server";
import type { DiscoveryExtension } from "./types";
import { validateDiscoveryExtension, validateDiscoveryExtensionSpec } from "./facilitator";

export { checkIfBazaarNeeded } from "@x402/core/server";

/**
 * Empirical limits observed for the CDP facilitator (https://github.com/x402-foundation/x402/issues/2679).
 * The CDP facilitator returns a generic 400 "invalid paymentPayload" when ResourceInfo
 * fields exceed these values, with no field-specific error message.
 */
const CDP_MAX_TAGS = 8;
const CDP_MAX_DESCRIPTION_LENGTH = 200;

/**
 * Warn at startup when ResourceInfo fields on a route exceed the empirical CDP
 * facilitator limits that cause generic 400 "invalid paymentPayload" errors.
 *
 * The CDP facilitator does not return a field-specific error when these limits
 * are exceeded; it returns the same top-level "invalid paymentPayload" pattern
 * mismatch as any other payload schema error (issue #2679).
 *
 * @param routes - Route configuration to check
 */
export function validateResourceInfoLimits(routes: RoutesConfig): void {
  const entries: [string, { description?: string; tags?: string[] }][] =
    "accepts" in routes
      ? [["*", routes as { description?: string; tags?: string[] }]]
      : Object.entries(routes);

  for (const [pattern, config] of entries) {
    if (Array.isArray(config.tags) && config.tags.length > CDP_MAX_TAGS) {
      console.warn(
        `x402: Route "${pattern}" declares ${config.tags.length} tags. ` +
          `The CDP facilitator silently rejects payloads with more than ${CDP_MAX_TAGS} tags ` +
          `(returns generic 400 "invalid paymentPayload" — not a tag-count error). ` +
          `Trim to ${CDP_MAX_TAGS} or fewer. See: https://github.com/x402-foundation/x402/issues/2679`,
      );
    }
    if (
      typeof config.description === "string" &&
      config.description.length > CDP_MAX_DESCRIPTION_LENGTH
    ) {
      console.warn(
        `x402: Route "${pattern}" description is ${config.description.length} characters. ` +
          `The CDP facilitator may reject large ResourceInfo payloads with a generic ` +
          `400 "invalid paymentPayload" error. Keep descriptions under ${CDP_MAX_DESCRIPTION_LENGTH} characters. ` +
          `See: https://github.com/x402-foundation/x402/issues/2679`,
      );
    }
  }
}

const HTTP_VERB_RE = /^(GET|POST|PUT|PATCH|DELETE|HEAD)\b/i;

/**
 * Inject a synthetic method into a pre-enrichment extension so the schema's
 * required:["method"] check doesn't produce a false-positive warning at startup.
 * Priority: (1) route pattern verb (e.g. "GET /api"), (2) body vs query inference.
 * Returns the same object unchanged if method is already present.
 *
 * @param ext - The raw bazaar extension object
 * @param pattern - The route pattern key (e.g. "GET /api" or "*")
 * @returns The extension with a synthetic method injected into info.input if needed
 */
function withSyntheticMethod(
  ext: Record<string, unknown>,
  pattern: string,
): Record<string, unknown> {
  const info = ext.info as Record<string, unknown> | undefined;
  const input = info?.input as Record<string, unknown> | undefined;
  if (!input || (typeof input.method === "string" && input.method)) {
    return ext;
  }
  const verbMatch = pattern.match(HTTP_VERB_RE);
  const method = verbMatch
    ? verbMatch[1].toUpperCase()
    : input.body !== undefined || input.bodyType !== undefined
      ? "POST"
      : "GET";
  return { ...ext, info: { ...info, input: { ...input, method } } };
}

/**
 * Validate bazaar extensions on all routes using JSON-schema validation.
 * Emits console warnings for invalid extensions but does not throw.
 *
 * @param routes - Route configuration to scan for bazaar extensions
 */
export function validateBazaarRouteExtensions(routes: RoutesConfig): void {
  const entries: [string, { extensions?: Record<string, unknown> }][] =
    "accepts" in routes ? [["*", routes]] : Object.entries(routes);

  for (const [pattern, config] of entries) {
    const bazaarExt = config.extensions?.["bazaar"];
    if (!bazaarExt) continue;
    if (
      typeof bazaarExt === "object" &&
      bazaarExt !== null &&
      "info" in (bazaarExt as Record<string, unknown>) &&
      "schema" in (bazaarExt as Record<string, unknown>)
    ) {
      const specResult = validateDiscoveryExtensionSpec(bazaarExt as Record<string, unknown>);
      if (!specResult.valid) {
        console.warn(
          `x402: Route "${pattern}" has an invalid bazaar extension: ${specResult.errors?.join(", ")}`,
        );
        continue;
      }
      const extForSchema = withSyntheticMethod(bazaarExt as Record<string, unknown>, pattern);
      const schemaResult = validateDiscoveryExtension(
        extForSchema as unknown as DiscoveryExtension,
      );
      if (!schemaResult.valid) {
        console.warn(
          `x402: Route "${pattern}" has an invalid bazaar extension: ${schemaResult.errors?.join(", ")}`,
        );
      }
    } else {
      console.warn(
        `x402: Route "${pattern}" declares a bazaar extension but it is malformed ` +
          `(expected an object with "info" and "schema" fields)`,
      );
    }
  }
}
