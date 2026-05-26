import { normalizeWidgetSizing } from './widgetSizing.js';

function cloneJson(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function assertManifestField(manifest, field) {
  if (!manifest?.[field]) {
    throw new Error(`Widget manifest is missing ${field}`);
  }
}

/**
 * Convert a widget manifest into an SDK widget registry entry.
 *
 * The manifest remains the source of truth for schema, actions, permissions,
 * and sizing. The caller supplies the public URL because it is deployment
 * specific.
 */
export function manifestToWidgetRegistryEntry(manifest, options = {}) {
  const resolvedOptions = typeof options === 'string' ? { url: options } : options;
  const url = resolvedOptions.url || manifest?.url;

  assertManifestField(manifest, 'id');
  assertManifestField(manifest, 'version');
  assertManifestField(manifest, 'entry');

  if (manifest.entry !== 'index.html') {
    throw new Error(`Widget manifest entry must be "index.html" for ${manifest.id}`);
  }

  if (!url || typeof url !== 'string') {
    throw new Error(`Widget registry URL is required for ${manifest.id}`);
  }

  const sizing = normalizeWidgetSizing(manifest);
  const entry = {
    id: manifest.id,
    url,
    version: manifest.version,
    width: sizing.width,
    height: sizing.height,
    minHeight: sizing.minHeight,
    maxHeight: sizing.maxHeight,
    propsSchema: cloneJson(manifest.propsSchema || { type: 'object' }),
    actions: Array.isArray(manifest.actions) ? [...manifest.actions] : [],
    permissions: Array.isArray(manifest.permissions) ? [...manifest.permissions] : [],
  };

  if (sizing.width !== 'full') {
    entry.preferredWidth = sizing.preferredWidth;
    entry.minWidth = sizing.minWidth;
    entry.maxWidth = sizing.maxWidth;
  }

  if (manifest.allowedOrigins) {
    entry.allowedOrigins = [...manifest.allowedOrigins];
  }

  if (manifest.csp) {
    entry.csp = cloneJson(manifest.csp);
  }

  return entry;
}
