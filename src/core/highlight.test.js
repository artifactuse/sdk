import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { normalizeLanguage, syncPrismColors } from './highlight.js';

/**
 * Stub just enough DOM for syncPrismColors: a documentElement that records
 * style/attribute writes, and a <pre> whose computed colors we control.
 */
function stubDom({ preBackground, preColor } = {}) {
  const props = {};
  const attrs = {};

  const pre = { tag: 'pre' };

  globalThis.document = {
    documentElement: {
      style: {
        setProperty(name, value) { props[name] = value; },
        removeProperty(name) { delete props[name]; },
      },
      setAttribute(name, value) { attrs[name] = value; },
    },
    querySelector: (sel) => (sel.includes('language-') && preBackground !== undefined ? pre : null),
  };

  globalThis.window = {
    getComputedStyle: () => ({ backgroundColor: preBackground, color: preColor }),
  };

  return { props, attrs };
}

afterEach(() => {
  delete globalThis.document;
  delete globalThis.window;
});

describe('normalizeLanguage', () => {
  it('aliases astro to markup, since Prism ships no astro grammar', () => {
    expect(normalizeLanguage('astro')).toBe('markup');
    expect(normalizeLanguage('Astro')).toBe('markup');
  });

  it('leaves unknown languages untouched', () => {
    expect(normalizeLanguage('gleam')).toBe('gleam');
  });
});

describe('syncPrismColors', () => {
  it('publishes a dark Prism theme as code-bg plus a dark scheme', () => {
    const { props, attrs } = stubDom({ preBackground: 'rgb(45, 45, 45)', preColor: 'rgb(204, 204, 204)' });

    expect(syncPrismColors()).toBe(true);
    expect(props['--artifactuse-code-bg']).toBe('rgb(45, 45, 45)');
    expect(props['--artifactuse-code-fg']).toBe('rgb(204, 204, 204)');
    expect(attrs['data-artifactuse-code-scheme']).toBe('dark');
  });

  it('detects a light Prism theme', () => {
    const { props, attrs } = stubDom({ preBackground: 'rgb(246, 248, 250)', preColor: 'rgb(36, 41, 46)' });

    expect(syncPrismColors()).toBe(true);
    expect(props['--artifactuse-code-bg']).toBe('rgb(246, 248, 250)');
    expect(attrs['data-artifactuse-code-scheme']).toBe('light');
  });

  it('treats a fully transparent background as "no Prism"', () => {
    const { props, attrs } = stubDom({ preBackground: 'rgba(0, 0, 0, 0)' });

    expect(syncPrismColors({ sdkTheme: 'light' })).toBe(false);
    // Variables must be absent so the CSS falls through to the SDK tokens
    expect(props['--artifactuse-code-bg']).toBeUndefined();
    expect(attrs['data-artifactuse-code-scheme']).toBe('light');
  });

  it('falls back to the SDK theme when there is no highlighted block', () => {
    const { props, attrs } = stubDom({});

    expect(syncPrismColors({ sdkTheme: 'dark' })).toBe(false);
    expect(props['--artifactuse-code-bg']).toBeUndefined();
    expect(attrs['data-artifactuse-code-scheme']).toBe('dark');
  });

  it('clears a stale code-bg when Prism disappears between runs', () => {
    const first = stubDom({ preBackground: 'rgb(45, 45, 45)' });
    syncPrismColors();
    expect(first.props['--artifactuse-code-bg']).toBe('rgb(45, 45, 45)');

    // Same style object, but Prism's CSS is now gone
    globalThis.document.querySelector = () => null;
    syncPrismColors({ sdkTheme: 'light' });
    expect(first.props['--artifactuse-code-bg']).toBeUndefined();
  });

  it('keeps the background when only the text color is unreadable', () => {
    const { props } = stubDom({ preBackground: 'rgb(45, 45, 45)', preColor: 'rgba(0, 0, 0, 0)' });

    expect(syncPrismColors()).toBe(true);
    expect(props['--artifactuse-code-bg']).toBe('rgb(45, 45, 45)');
    expect(props['--artifactuse-code-fg']).toBeUndefined();
  });

  it('handles the modern rgb(r g b / a) syntax getComputedStyle may return', () => {
    const { attrs } = stubDom({ preBackground: 'rgb(246 248 250 / 1)' });

    expect(syncPrismColors()).toBe(true);
    expect(attrs['data-artifactuse-code-scheme']).toBe('light');
  });
});
