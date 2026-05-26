import { describe, expect, it } from 'vitest';
import {
  createWidgetRegistryFromHostedManifest,
  fetchHostedWidgetRegistry,
} from './hostedWidgets.js';

describe('hosted widget registry helpers', () => {
  it('converts hosted widgets.json entries into SDK registry entries', () => {
    const registry = createWidgetRegistryFromHostedManifest({
      version: '1.0.0',
      widgets: [
        {
          id: 'approval-card',
          version: '1.0.0',
          path: '/approval-card/v1/index.html',
          size: {
            width: 'content',
            preferredWidth: 360,
            minWidth: 280,
            maxWidth: 520,
            height: 220,
            minHeight: 140,
            maxHeight: 420,
          },
          propsSchema: {
            type: 'object',
            required: ['title'],
          },
          actions: ['approve', 'reject'],
          permissions: ['state', 'actions'],
        },
      ],
    }, {
      baseUrl: 'https://widgets.example.com/widgets.json',
    });

    expect(registry).toEqual({
      'approval-card': {
        id: 'approval-card',
        url: 'https://widgets.example.com/approval-card/v1/index.html',
        version: '1.0.0',
        width: 'content',
        preferredWidth: 360,
        minWidth: 280,
        maxWidth: 520,
        height: 220,
        minHeight: 140,
        maxHeight: 420,
        propsSchema: {
          type: 'object',
          required: ['title'],
        },
        actions: ['approve', 'reject'],
        permissions: ['state', 'actions'],
        allowedOrigins: undefined,
        csp: undefined,
      },
    });
  });

  it('fetches a hosted registry with an injectable fetch implementation', async () => {
    const registry = await fetchHostedWidgetRegistry('https://widgets.example.com/widgets.json', {
      fetch: async () => ({
        ok: true,
        async json() {
          return {
            widgets: [
              {
                id: 'hello-widget',
                path: '/hello-widget/v1/index.html',
                actions: ['hello'],
                permissions: ['state'],
              },
            ],
          };
        },
      }),
    });

    expect(registry['hello-widget']).toMatchObject({
      id: 'hello-widget',
      url: 'https://widgets.example.com/hello-widget/v1/index.html',
      actions: ['hello'],
      permissions: ['state'],
    });
  });
});
