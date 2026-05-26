import { fetchHostedWidgetRegistry } from '../../src/core/hostedWidgets.js';

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export const playgroundWidgetCdnUrl = trimTrailingSlash(
  import.meta.env?.VITE_ARTIFACTUSE_WIDGET_CDN_URL || 'http://localhost:8788'
);

export async function loadHostedPlaygroundWidgets(options = {}) {
  return fetchHostedWidgetRegistry(`${playgroundWidgetCdnUrl}/widgets.json`, options);
}

export async function registerHostedPlaygroundWidgets(registerWidget, options = {}) {
  if (typeof registerWidget !== 'function') return { ok: false };

  try {
    const widgets = await loadHostedPlaygroundWidgets(options);
    Object.entries(widgets).forEach(([template, widget]) => {
      registerWidget(template, widget);
    });
    return { ok: true, widgets };
  } catch (error) {
    console.error(`Could not load hosted widgets from ${playgroundWidgetCdnUrl}/widgets.json.`, error);
    return { ok: false, error };
  }
}
