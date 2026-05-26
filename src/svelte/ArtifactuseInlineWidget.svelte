<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { getArtifactuseContext } from './index.js';
  import {
    clampWidgetHeight,
    getWidgetContainerStyle,
    getWidgetIframeStyle,
    getWidgetSizing,
  } from '../core/widgetSizing.js';

  export let artifact;
  export let theme = 'dark';
  export let pending = false;

  const dispatch = createEventDispatcher();
  const { instance } = getArtifactuseContext();

  let iframeRef;
  let height = getWidgetSizing(artifact?.widget || {}).height;
  let ready = false;
  let widgetState = artifact?.widgetState || {};

  $: validation = artifact?.validation || { valid: true, errors: [] };
  $: isValid = validation.valid !== false;
  $: validationErrors = validation.errors || [];
  $: sizing = getWidgetSizing(artifact?.widget || {});
  $: containerStyle = styleObjectToString(getWidgetContainerStyle(sizing));
  $: iframeStyle = styleObjectToString(getWidgetIframeStyle(height, sizing));
  $: iframeSrc = appendWidgetParams(artifact?.widget?.url || '', {
    theme,
    template: artifact?.template,
    artifactId: artifact?.id,
  });
  $: targetOrigin = '*';
  $: payload = {
    artifactId: artifact?.id,
    template: artifact?.template,
    props: artifact?.props || {},
    state: widgetState,
    actions: artifact?.actions || [],
    permissions: artifact?.permissions || [],
    theme,
    inline: true,
    validation,
  };

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

  function styleObjectToString(style = {}) {
    return Object.entries(style)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}: ${value}`)
      .join('; ');
  }

  function postToWidget(action, data) {
    const iframeWindow = iframeRef?.contentWindow;
    if (!iframeWindow) return;

    iframeWindow.postMessage({
      type: 'artifactuse',
      action,
      data,
      timestamp: Date.now(),
    }, targetOrigin);
  }

  function loadWidget() {
    postToWidget('widget:load', payload);
  }

  function handleLoad() {
    window.setTimeout(loadWidget, 50);
  }

  function handleMessage(event) {
    const iframeWindow = iframeRef?.contentWindow;
    if (iframeWindow && event.source !== iframeWindow) return;

    const { type, action, data } = event.data || {};
    if (type !== 'artifactuse') return;

    if (action === 'widget:ready' || action === 'ready') {
      ready = true;
      loadWidget();
      return;
    }

    if (action === 'widget:height') {
      const nextHeight = clampWidgetHeight(data?.height || height, sizing);
      height = nextHeight;
      const eventData = { artifactId: artifact.id, template: artifact.template, height: nextHeight };
      instance.emit('widget:height', eventData);
      dispatch('height-change', eventData);
      return;
    }

    if (action === 'widget:state') {
      widgetState = data?.state || {};
      const eventData = { artifactId: artifact.id, template: artifact.template, state: widgetState };
      instance.emit('widget:state', eventData);
      dispatch('state-change', eventData);
      return;
    }

    if (action === 'widget:action') {
      const eventData = {
        artifactId: artifact.id,
        template: artifact.template,
        action: data?.action || data?.actionId,
        payload: data?.payload || {},
        props: artifact.props || {},
        state: widgetState,
        timestamp: Date.now(),
      };
      instance.emit('widget:action', eventData);
      dispatch('action', eventData);
      return;
    }

    if (action === 'widget:followup') {
      const eventData = {
        artifactId: artifact.id,
        template: artifact.template,
        ...data,
      };
      instance.emit('widget:followup', eventData);
      dispatch('follow-up', eventData);
    }
  }

  onMount(() => {
    window.addEventListener('message', handleMessage);
  });

  onDestroy(() => {
    window.removeEventListener('message', handleMessage);
  });
</script>

{#if pending && (!isValid || !iframeSrc)}
  <div class="artifactuse-inline-widget artifactuse-inline-widget--loading" style={containerStyle}>
    <div class="artifactuse-inline-widget__loading-line"></div>
    <div class="artifactuse-inline-widget__loading-line artifactuse-inline-widget__loading-line--short"></div>
  </div>
{:else if !isValid}
  <div class="artifactuse-inline-widget artifactuse-inline-widget--error" style={containerStyle}>
    <div class="artifactuse-inline-widget__error-title">Widget cannot be rendered</div>
    <ul class="artifactuse-inline-widget__error-list">
      {#each validationErrors as error}
        <li>{error}</li>
      {/each}
    </ul>
  </div>
{:else if !iframeSrc}
  <div class="artifactuse-inline-widget artifactuse-inline-widget--error" style={containerStyle}>
    <div class="artifactuse-inline-widget__error-title">Widget template is not registered</div>
    <div class="artifactuse-inline-widget__error-text">{artifact?.template || 'Unknown template'}</div>
  </div>
{:else}
  <div class="artifactuse-inline-widget" data-widget-template={artifact?.template} style={containerStyle}>
    <iframe
      bind:this={iframeRef}
      src={iframeSrc}
      title={artifact?.title || artifact?.template || 'Artifactuse widget'}
      class="artifactuse-inline-widget__iframe"
      style={iframeStyle}
      sandbox="allow-scripts allow-forms allow-popups allow-downloads"
      on:load={handleLoad}
    ></iframe>
  </div>
{/if}
