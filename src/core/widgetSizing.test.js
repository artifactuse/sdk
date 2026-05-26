import { describe, expect, it } from 'vitest';
import {
  clampWidgetHeight,
  getWidgetContainerStyle,
  normalizeWidgetSizing,
} from './widgetSizing.js';

describe('widget sizing', () => {
  it('normalizes content-width widgets from registry fields', () => {
    const sizing = normalizeWidgetSizing({
      width: 'content',
      preferredWidth: 360,
      minWidth: 280,
      maxWidth: 520,
      height: 220,
      minHeight: 140,
      maxHeight: 420,
    });

    expect(sizing).toEqual({
      width: 'content',
      preferredWidth: 360,
      minWidth: 280,
      maxWidth: 520,
      height: 220,
      minHeight: 140,
      maxHeight: 420,
    });
    expect(getWidgetContainerStyle(sizing)).toEqual({
      width: 'min(100%, 360px)',
      minWidth: 'min(100%, 280px)',
      maxWidth: 'min(100%, 520px)',
    });
  });

  it('lets full-width widgets fill the host inline lane', () => {
    const sizing = normalizeWidgetSizing({ width: 'full' });

    expect(sizing.width).toBe('full');
    expect(getWidgetContainerStyle(sizing)).toEqual({
      width: '100%',
      maxWidth: '100%',
    });
  });

  it('clamps reported widget heights to registry limits', () => {
    const sizing = normalizeWidgetSizing({
      height: 220,
      minHeight: 140,
      maxHeight: 420,
    });

    expect(clampWidgetHeight(80, sizing)).toBe(140);
    expect(clampWidgetHeight(260, sizing)).toBe(260);
    expect(clampWidgetHeight(900, sizing)).toBe(420);
  });
});
