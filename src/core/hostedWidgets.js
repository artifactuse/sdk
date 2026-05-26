function cloneJson(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function ensureTrailingSlash(value) {
  return String(value || '').replace(/\/?$/, '/');
}

function toAbsoluteUrl(value, baseUrl) {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return new URL(value, ensureTrailingSlash(baseUrl)).toString();
}

function hostedWidgetToRegistryEntry(widget, baseUrl) {
  const url = toAbsoluteUrl(widget?.url || widget?.path, baseUrl);
  if (!widget?.id || !url) return null;

  const size = widget.size && typeof widget.size === 'object' ? widget.size : {};

  return {
    id: widget.id,
    url,
    version: widget.version,
    width: size.width ?? widget.width,
    preferredWidth: size.preferredWidth ?? widget.preferredWidth,
    minWidth: size.minWidth ?? widget.minWidth,
    maxWidth: size.maxWidth ?? widget.maxWidth,
    height: size.height ?? widget.height,
    minHeight: size.minHeight ?? widget.minHeight,
    maxHeight: size.maxHeight ?? widget.maxHeight,
    propsSchema: cloneJson(widget.propsSchema || { type: 'object' }),
    actions: Array.isArray(widget.actions) ? [...widget.actions] : [],
    permissions: Array.isArray(widget.permissions) ? [...widget.permissions] : [],
    allowedOrigins: Array.isArray(widget.allowedOrigins) ? [...widget.allowedOrigins] : undefined,
    csp: cloneJson(widget.csp),
  };
}

/**
 * Convert a hosted widgets manifest into an SDK widget registry.
 *
 * Hosted manifests are served by the widget CDN/Worker as `widgets.json` or
 * `manifest.json`. Each widget entry should include an id, path/url, and any
 * sizing/schema/action metadata needed by the host SDK.
 */
export function createWidgetRegistryFromHostedManifest(manifest, options = {}) {
  const baseUrl = options.baseUrl || options.url || '';
  const widgets = Array.isArray(manifest?.widgets) ? manifest.widgets : [];

  return widgets.reduce((registry, widget) => {
    const entry = hostedWidgetToRegistryEntry(widget, baseUrl);
    if (entry) {
      registry[entry.id] = entry;
    }
    return registry;
  }, {});
}

/**
 * Fetch and convert a hosted widget manifest.
 */
export async function fetchHostedWidgetRegistry(manifestUrl, options = {}) {
  const fetchImpl = options.fetch || globalThis.fetch;

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is required to load a hosted widget registry');
  }

  const response = await fetchImpl(manifestUrl, {
    cache: options.cache || 'no-store',
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load widget registry: ${response.status}`);
  }

  const manifest = await response.json();
  return createWidgetRegistryFromHostedManifest(manifest, {
    baseUrl: options.baseUrl || manifestUrl,
  });
}
