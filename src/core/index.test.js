import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import createArtifactuse from './index.js';

describe('createArtifactuse widget processing', () => {
  beforeEach(() => {
    globalThis.window = {
      addEventListener() {},
      removeEventListener() {},
      matchMedia() {
        return {
          matches: false,
          addEventListener() {},
          removeEventListener() {},
        };
      },
      location: { href: 'https://host.example' },
    };
    globalThis.document = {
      documentElement: {
        setAttribute() {},
        style: { setProperty() {} },
      },
    };
  });

  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
  });

  it('embeds resolved widget registry data in inline widget placeholders', () => {
    const sdk = createArtifactuse({
      widgets: {
        'approval-card': {
          url: '/widgets/approval-card/v1/index.html',
          actions: ['approve', 'reject'],
          permissions: ['state', 'actions'],
        },
      },
      inlinePreview: { languages: true },
    });

    const result = sdk.processMessage(`Here is a widget:

\`\`\`widget
{
  "type": "widget",
  "template": "approval-card",
  "props": { "title": "Deploy" },
  "actions": [{ "id": "approve", "label": "Approve" }],
  "permissions": ["state", "actions"]
}
\`\`\`
`, 'msg-widget');

    const encoded = result.html.match(/data-artifact="([^"]+)"/)?.[1];
    const placeholderArtifact = JSON.parse(decodeURIComponent(escape(atob(encoded))));

    expect(placeholderArtifact).toMatchObject({
      type: 'widget',
      template: 'approval-card',
      isInline: true,
      isPanelArtifact: false,
      validation: { valid: true, errors: [] },
      widget: {
        id: 'approval-card',
        url: '/widgets/approval-card/v1/index.html',
        sizing: {
          width: 'content',
          preferredWidth: 520,
          minWidth: null,
          maxWidth: 520,
          height: 280,
          minHeight: 120,
          maxHeight: 1200,
        },
      },
    });
    expect(result.html).toContain('artifactuse-inline-widget');
    expect(result.html).not.toContain('artifactuse-inline-preview');
  });

  it('togglePanel opens the most recent artifact instead of an empty panel', () => {
    const sdk = createArtifactuse();

    sdk.state.addArtifact({ id: 'a1', type: 'code', language: 'javascript', code: 'a', title: 'First' });
    sdk.state.addArtifact({ id: 'a2', type: 'code', language: 'javascript', code: 'b', title: 'Second' });
    sdk.closePanel();

    sdk.togglePanel();

    const state = sdk.state.getState();
    expect(state.isPanelOpen).toBe(true);
    expect(state.activeArtifactId).toBe('a2');
    expect(state.forceEmptyView).toBe(false);
  });

  it('togglePanel falls back to the empty view when there are no artifacts', () => {
    const sdk = createArtifactuse();

    sdk.togglePanel();

    const state = sdk.state.getState();
    expect(state.isPanelOpen).toBe(true);
    expect(state.activeArtifactId).toBe(null);
    expect(state.forceEmptyView).toBe(true);
  });
});
