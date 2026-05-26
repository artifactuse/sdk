import { describe, expect, it } from 'vitest';
import { manifestToWidgetRegistryEntry } from './widgetManifest.js';

describe('widget manifest helpers', () => {
  it('converts manifest size and trust fields into a registry entry', () => {
    const entry = manifestToWidgetRegistryEntry({
      id: 'hello-widget',
      name: 'Hello Widget',
      version: '1.0.0',
      entry: 'index.html',
      size: {
        width: 'content',
        preferredWidth: 340,
        minWidth: 260,
        maxWidth: 480,
        height: 180,
        minHeight: 120,
        maxHeight: 320,
      },
      propsSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      },
      actions: ['hello'],
      permissions: ['state', 'actions'],
    }, {
      url: '/widgets/hello-widget/v1/index.html',
    });

    expect(entry).toEqual({
      id: 'hello-widget',
      url: '/widgets/hello-widget/v1/index.html',
      version: '1.0.0',
      width: 'content',
      preferredWidth: 340,
      minWidth: 260,
      maxWidth: 480,
      height: 180,
      minHeight: 120,
      maxHeight: 320,
      propsSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      },
      actions: ['hello'],
      permissions: ['state', 'actions'],
    });
  });

  it('requires a deployment-specific registry URL', () => {
    expect(() => manifestToWidgetRegistryEntry({
      id: 'hello-widget',
      version: '1.0.0',
      entry: 'index.html',
    })).toThrow(/URL is required/);
  });

  it('omits content width fields for full-width widgets', () => {
    const entry = manifestToWidgetRegistryEntry({
      id: 'full-widget',
      version: '1.0.0',
      entry: 'index.html',
      size: {
        width: 'full',
        height: 240,
      },
      actions: [],
      permissions: [],
    }, '/widgets/full-widget/v1/index.html');

    expect(entry.width).toBe('full');
    expect(entry.preferredWidth).toBeUndefined();
    expect(entry.minWidth).toBeUndefined();
    expect(entry.maxWidth).toBeUndefined();
    expect(entry.height).toBe(240);
  });
});
