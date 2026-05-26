<template>
  <div
    v-if="pending && (!isValid || !iframeSrc)"
    class="artifactuse-inline-widget artifactuse-inline-widget--loading"
    :style="containerStyle"
  >
    <div class="artifactuse-inline-widget__loading-line"></div>
    <div class="artifactuse-inline-widget__loading-line artifactuse-inline-widget__loading-line--short"></div>
  </div>

  <div
    v-else-if="!isValid"
    class="artifactuse-inline-widget artifactuse-inline-widget--error"
    :style="containerStyle"
  >
    <div class="artifactuse-inline-widget__error-title">Widget cannot be rendered</div>
    <ul class="artifactuse-inline-widget__error-list">
      <li v-for="error in validationErrors" :key="error">{{ error }}</li>
    </ul>
  </div>

  <div
    v-else-if="!iframeSrc"
    class="artifactuse-inline-widget artifactuse-inline-widget--error"
    :style="containerStyle"
  >
    <div class="artifactuse-inline-widget__error-title">Widget template is not registered</div>
    <div class="artifactuse-inline-widget__error-text">{{ artifact && artifact.template || 'Unknown template' }}</div>
  </div>

  <div
    v-else
    class="artifactuse-inline-widget"
    :data-widget-template="artifact && artifact.template"
    :style="containerStyle"
  >
    <iframe
      ref="iframeRef"
      :src="iframeSrc"
      :title="(artifact && (artifact.title || artifact.template)) || 'Artifactuse widget'"
      class="artifactuse-inline-widget__iframe"
      :style="iframeStyle"
      sandbox="allow-scripts allow-forms allow-popups allow-downloads"
      @load="handleLoad"
    ></iframe>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useArtifactuse } from './composables.js';
import {
  clampWidgetHeight,
  getWidgetContainerStyle,
  getWidgetIframeStyle,
  getWidgetSizing,
} from '../core/widgetSizing.js';

export default {
  name: 'ArtifactuseInlineWidget',

  props: {
    artifact: { type: Object, required: true },
    theme: { type: String, default: 'dark' },
    pending: { type: Boolean, default: false },
  },

  emits: ['action', 'state-change', 'height-change', 'follow-up'],

  setup(props, { emit }) {
    const { instance } = useArtifactuse();
    const iframeRef = ref(null);
    const sizing = computed(() => getWidgetSizing(props.artifact?.widget || {}));
    const height = ref(sizing.value.height);
    const ready = ref(false);
    const widgetState = ref(props.artifact?.widgetState || {});
    const containerStyle = computed(() => getWidgetContainerStyle(sizing.value));
    const iframeStyle = computed(() => getWidgetIframeStyle(height.value, sizing.value));

    const validation = computed(() => props.artifact?.validation || { valid: true, errors: [] });
    const isValid = computed(() => validation.value.valid !== false);
    const validationErrors = computed(() => validation.value.errors || []);

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

    const iframeSrc = computed(() => appendWidgetParams(props.artifact?.widget?.url || '', {
      theme: props.theme,
      template: props.artifact?.template,
      artifactId: props.artifact?.id,
    }));

    const targetOrigin = computed(() => '*');

    const payload = computed(() => ({
      artifactId: props.artifact?.id,
      template: props.artifact?.template,
      props: props.artifact?.props || {},
      state: widgetState.value,
      actions: props.artifact?.actions || [],
      permissions: props.artifact?.permissions || [],
      theme: props.theme,
      inline: true,
      validation: validation.value,
    }));

    function postToWidget(action, data) {
      const iframeWindow = iframeRef.value?.contentWindow;
      if (!iframeWindow) return;

      iframeWindow.postMessage({
        type: 'artifactuse',
        action,
        data,
        timestamp: Date.now(),
      }, targetOrigin.value);
    }

    function loadWidget() {
      postToWidget('widget:load', payload.value);
    }

    function handleLoad() {
      window.setTimeout(loadWidget, 50);
    }

    function handleMessage(event) {
      const iframeWindow = iframeRef.value?.contentWindow;
      if (iframeWindow && event.source !== iframeWindow) return;

      const { type, action, data } = event.data || {};
      if (type !== 'artifactuse') return;

      if (action === 'widget:ready' || action === 'ready') {
        ready.value = true;
        loadWidget();
        return;
      }

      if (action === 'widget:height') {
        const nextHeight = clampWidgetHeight(data?.height || height.value, sizing.value);
        height.value = nextHeight;
        const eventData = { artifactId: props.artifact.id, template: props.artifact.template, height: nextHeight };
        instance.emit('widget:height', eventData);
        emit('height-change', eventData);
        return;
      }

      if (action === 'widget:state') {
        widgetState.value = data?.state || {};
        const eventData = { artifactId: props.artifact.id, template: props.artifact.template, state: widgetState.value };
        instance.emit('widget:state', eventData);
        emit('state-change', eventData);
        return;
      }

      if (action === 'widget:action') {
        const eventData = {
          artifactId: props.artifact.id,
          template: props.artifact.template,
          action: data?.action || data?.actionId,
          payload: data?.payload || {},
          props: props.artifact.props || {},
          state: widgetState.value,
          timestamp: Date.now(),
        };
        instance.emit('widget:action', eventData);
        emit('action', eventData);
        return;
      }

      if (action === 'widget:followup') {
        const eventData = {
          artifactId: props.artifact.id,
          template: props.artifact.template,
          ...data,
        };
        instance.emit('widget:followup', eventData);
        emit('follow-up', eventData);
      }
    }

    watch(payload, () => {
      if (ready.value) loadWidget();
    });

    onMounted(() => {
      window.addEventListener('message', handleMessage);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('message', handleMessage);
    });

    return {
      iframeRef,
      height,
      containerStyle,
      iframeStyle,
      validationErrors,
      isValid,
      iframeSrc,
      handleLoad,
    };
  },
};
</script>
