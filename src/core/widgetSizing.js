const DEFAULT_WIDGET_SIZING = {
  width: 'content',
  preferredWidth: 520,
  minWidth: null,
  maxWidth: 520,
  height: 280,
  minHeight: 120,
  maxHeight: 1200,
};

const COMPACT_WIDGET_SIZING = {
  preferredWidth: 320,
  maxWidth: 360,
};

const WIDTH_MODES = new Set(['content', 'compact', 'full']);

function toNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeWidthMode(value) {
  return WIDTH_MODES.has(value) ? value : DEFAULT_WIDGET_SIZING.width;
}

export function normalizeWidgetSizing(entry = {}) {
  const size = entry.size && typeof entry.size === 'object' ? entry.size : {};
  const width = normalizeWidthMode(entry.width || size.width);

  const modeDefaults = width === 'compact' ? COMPACT_WIDGET_SIZING : DEFAULT_WIDGET_SIZING;
  const minHeight = toNumber(entry.minHeight ?? size.minHeight, DEFAULT_WIDGET_SIZING.minHeight);
  const maxHeight = Math.max(minHeight, toNumber(entry.maxHeight ?? size.maxHeight, DEFAULT_WIDGET_SIZING.maxHeight));

  return {
    width,
    preferredWidth: width === 'full'
      ? null
      : toNumber(entry.preferredWidth ?? size.preferredWidth, modeDefaults.preferredWidth),
    minWidth: width === 'full'
      ? null
      : toNumber(entry.minWidth ?? size.minWidth, DEFAULT_WIDGET_SIZING.minWidth),
    maxWidth: width === 'full'
      ? null
      : toNumber(entry.maxWidth ?? size.maxWidth, modeDefaults.maxWidth),
    height: Math.max(minHeight, Math.min(maxHeight, toNumber(entry.height ?? size.height, DEFAULT_WIDGET_SIZING.height))),
    minHeight,
    maxHeight,
  };
}

export function getWidgetSizing(widget = {}) {
  return widget.sizing || normalizeWidgetSizing(widget);
}

export function clampWidgetHeight(height, sizing = DEFAULT_WIDGET_SIZING) {
  const minHeight = toNumber(sizing.minHeight, DEFAULT_WIDGET_SIZING.minHeight);
  const maxHeight = Math.max(minHeight, toNumber(sizing.maxHeight, DEFAULT_WIDGET_SIZING.maxHeight));
  return Math.max(minHeight, Math.min(maxHeight, toNumber(height, sizing.height || DEFAULT_WIDGET_SIZING.height)));
}

export function getWidgetContainerStyle(sizing = DEFAULT_WIDGET_SIZING) {
  if (sizing.width === 'full') {
    return {
      width: '100%',
      maxWidth: '100%',
    };
  }

  const preferredWidth = toNumber(sizing.preferredWidth, sizing.maxWidth || DEFAULT_WIDGET_SIZING.preferredWidth);
  const maxWidth = toNumber(sizing.maxWidth, preferredWidth);
  const style = {
    width: `min(100%, ${preferredWidth}px)`,
    maxWidth: `min(100%, ${maxWidth}px)`,
  };

  const minWidth = toNumber(sizing.minWidth);
  if (minWidth) {
    style.minWidth = `min(100%, ${minWidth}px)`;
  }

  return style;
}

export function getWidgetIframeStyle(height, sizing = DEFAULT_WIDGET_SIZING) {
  return {
    height: `${clampWidgetHeight(height, sizing)}px`,
  };
}
