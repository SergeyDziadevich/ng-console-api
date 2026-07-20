import { ToolAction } from 'genkit';

/**
 * Recursively patch a JSON Schema object so it is compatible with the Gemini
 * API's stricter schema requirements (400 Bad Request, "missing field").
 *
 * Two rules are enforced:
 *  1. Every `type:"array"` node must have an `items` field with a `type`.
 *  2. Every schema node that uses only JSON-Schema combiners
 *     (anyOf / oneOf / allOf) or `properties` without a top-level `type` gets
 *     `type:"object"` added as a fallback. The Gemini schema converter
 *     (`toGeminiSchemaProperty`) returns `undefined` for typeless nodes, which
 *     causes the API to report "items: missing field" even when the `items`
 *     key is present in the Genkit-internal schema.
 *
 * Mutates in place.
 */
export function patchJsonSchema(schema: Record<string, unknown>): void {
  if (!schema || typeof schema !== 'object') return;

  // Rule 1 – arrays must have items with a concrete type.
  if (schema['type'] === 'array' && !schema['items']) {
    schema['items'] = { type: 'object' };
  }

  // Rule 2 – nodes that use combiners or properties but have no `type` field
  // are silently dropped by toGeminiSchemaProperty(). Give them a fallback.
  if (
    !schema['type'] &&
    (schema['anyOf'] ||
      schema['oneOf'] ||
      schema['allOf'] ||
      schema['properties'])
  ) {
    schema['type'] = 'object';
  }

  if (schema['items'])
    patchJsonSchema(schema['items'] as Record<string, unknown>);

  if (schema['properties']) {
    for (const prop of Object.values(
      schema['properties'] as Record<string, unknown>,
    )) {
      patchJsonSchema(prop as Record<string, unknown>);
    }
  }

  for (const combiner of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (Array.isArray(schema[combiner])) {
      for (const sub of schema[combiner]) {
        patchJsonSchema(sub as Record<string, unknown>);
      }
    }
  }
}

/**
 * Patch the raw `inputJsonSchema` on each Genkit ToolAction so that every
 * array-type parameter has the required `items` field before the tool
 * definition is forwarded to the Gemini API.
 */
export function sanitizeToolSchemas(tools: ToolAction[]): ToolAction[] {
  for (const tool of tools) {
    const action = (
      tool as unknown as {
        __action?: { name?: string; inputJsonSchema?: Record<string, unknown> };
      }
    ).__action;

    if (action?.inputJsonSchema) patchJsonSchema(action.inputJsonSchema);

    // Gemini does not allow dashes in tool names and silently replaces them with underscores.
    // If the tool name has dashes, we preemptively rename it to use underscores
    // so Genkit can successfully resolve it when the model calls it back.
    const originalName = tool.name || action?.name || '';
    if (originalName.includes('-')) {
      const newName = originalName.replace(/-/g, '_');
      Object.defineProperty(tool, 'name', { value: newName });
      if (action) {
        action.name = newName;
      }
    }
  }
  return tools;
}
