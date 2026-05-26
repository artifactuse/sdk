// ArtifactuseInlineWidget.jsx
// Inline iframe renderer for registered widget artifacts

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useArtifactuse } from './index';
import {
  clampWidgetHeight,
  getWidgetContainerStyle,
  getWidgetIframeStyle,
  getWidgetSizing,
} from '../core/widgetSizing.js';

function appendWidgetParams(url, params = {}) {
  if (!url) return '';
  try {
    const parsed = new URL(url, window.location.href);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        parsed.searchParams.set(key, value);
      }
    });
    return parsed.toString();
  } catch {
    return url;
  }
}

export default function ArtifactuseInlineWidget({
  artifact,
  theme = 'dark',
  onAction,
  onStateChange,
  onHeightChange,
  onFollowUp,
  pending = false,
  className = '',
}) {
  const { instance } = useArtifactuse();
  const iframeRef = useRef(null);
  const stateRef = useRef(artifact?.widgetState || {});
  const sizing = useMemo(() => getWidgetSizing(artifact?.widget || {}), [artifact?.widget]);
  const [height, setHeight] = useState(sizing.height);
  const [ready, setReady] = useState(false);
  const containerStyle = useMemo(() => getWidgetContainerStyle(sizing), [sizing]);
  const iframeStyle = useMemo(() => getWidgetIframeStyle(height, sizing), [height, sizing]);

  const widgetUrl = artifact?.widget?.url || '';
  const validation = artifact?.validation || { valid: true, errors: [] };

  const iframeSrc = useMemo(() => {
    return appendWidgetParams(widgetUrl, {
      theme,
      template: artifact?.template,
      artifactId: artifact?.id,
    });
  }, [widgetUrl, theme, artifact?.template, artifact?.id]);

  const targetOrigin = '*';

  const payload = useMemo(() => ({
    artifactId: artifact?.id,
    template: artifact?.template,
    props: artifact?.props || {},
    state: stateRef.current,
    actions: artifact?.actions || [],
    permissions: artifact?.permissions || [],
    theme,
    inline: true,
    validation,
  }), [artifact, theme, validation]);

  const postToWidget = useCallback((action, data) => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    iframeWindow.postMessage({
      type: 'artifactuse',
      action,
      data,
      timestamp: Date.now(),
    }, targetOrigin);
  }, [targetOrigin]);

  const loadWidget = useCallback(() => {
    postToWidget('widget:load', payload);
  }, [payload, postToWidget]);

  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;

    function handleMessage(event) {
      if (iframeWindow && event.source !== iframeWindow) return;

      const { type, action, data } = event.data || {};
      if (type !== 'artifactuse') return;

      if (action === 'widget:ready' || action === 'ready') {
        setReady(true);
        loadWidget();
        return;
      }

      if (action === 'widget:height') {
        const nextHeight = clampWidgetHeight(data?.height || height, sizing);
        setHeight(nextHeight);
        instance.emit('widget:height', { artifactId: artifact.id, template: artifact.template, height: nextHeight });
        onHeightChange?.({ artifactId: artifact.id, template: artifact.template, height: nextHeight });
        return;
      }

      if (action === 'widget:state') {
        stateRef.current = data?.state || {};
        const eventData = { artifactId: artifact.id, template: artifact.template, state: stateRef.current };
        instance.emit('widget:state', eventData);
        onStateChange?.(eventData);
        return;
      }

      if (action === 'widget:action') {
        const eventData = {
          artifactId: artifact.id,
          template: artifact.template,
          action: data?.action || data?.actionId,
          payload: data?.payload || {},
          props: artifact.props || {},
          state: stateRef.current,
          timestamp: Date.now(),
        };
        instance.emit('widget:action', eventData);
        onAction?.(eventData);
        return;
      }

      if (action === 'widget:followup') {
        const eventData = {
          artifactId: artifact.id,
          template: artifact.template,
          ...data,
        };
        instance.emit('widget:followup', eventData);
        onFollowUp?.(eventData);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [artifact, height, instance, loadWidget, onAction, onFollowUp, onHeightChange, onStateChange, sizing]);

  useEffect(() => {
    if (ready) loadWidget();
  }, [loadWidget, ready]);

  if (pending && (!validation.valid || !iframeSrc)) {
    return (
      <div className={`artifactuse-inline-widget artifactuse-inline-widget--loading ${className}`.trim()} style={containerStyle}>
        <div className="artifactuse-inline-widget__loading-line" />
        <div className="artifactuse-inline-widget__loading-line artifactuse-inline-widget__loading-line--short" />
      </div>
    );
  }

  if (!validation.valid) {
    return (
      <div className={`artifactuse-inline-widget artifactuse-inline-widget--error ${className}`.trim()} style={containerStyle}>
        <div className="artifactuse-inline-widget__error-title">Widget cannot be rendered</div>
        <ul className="artifactuse-inline-widget__error-list">
          {(validation.errors || []).map(error => <li key={error}>{error}</li>)}
        </ul>
      </div>
    );
  }

  if (!iframeSrc) {
    return (
      <div className={`artifactuse-inline-widget artifactuse-inline-widget--error ${className}`.trim()} style={containerStyle}>
        <div className="artifactuse-inline-widget__error-title">Widget template is not registered</div>
        <div className="artifactuse-inline-widget__error-text">{artifact?.template || 'Unknown template'}</div>
      </div>
    );
  }

  return (
    <div className={`artifactuse-inline-widget ${className}`.trim()} data-widget-template={artifact?.template} style={containerStyle}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title={artifact?.title || artifact?.template || 'Artifactuse widget'}
        className="artifactuse-inline-widget__iframe"
        style={iframeStyle}
        sandbox="allow-scripts allow-forms allow-popups allow-downloads"
        onLoad={() => window.setTimeout(loadWidget, 50)}
      />
    </div>
  );
}
