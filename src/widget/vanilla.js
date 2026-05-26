// artifactuse/widget/vanilla
// Tiny browser bridge for framework-agnostic inline widgets.

const CHANNEL = 'artifactuse';

function getDocumentHeight() {
  if (typeof document === 'undefined') return 0;

  const body = document.body;
  const root = document.documentElement;

  return Math.ceil(Math.max(
    body?.scrollHeight || 0,
    body?.offsetHeight || 0,
    root?.clientHeight || 0,
    root?.scrollHeight || 0,
    root?.offsetHeight || 0,
  ));
}

export function createWidgetBridge(options = {}) {
  const hostWindow = options.hostWindow || (typeof window !== 'undefined' ? window.parent : null);
  const targetOrigin = options.targetOrigin || '*';
  const loadListeners = new Set();
  const stateListeners = new Set();

  let context = {
    artifactId: null,
    template: null,
    props: {},
    state: {},
    actions: [],
    permissions: [],
    theme: 'dark',
    inline: true,
    validation: { valid: true, errors: [] },
  };

  function post(action, data = {}) {
    if (!hostWindow?.postMessage) return;

    hostWindow.postMessage({
      type: CHANNEL,
      action,
      data,
      timestamp: Date.now(),
    }, targetOrigin);
  }

  function ready(data = {}) {
    post('widget:ready', {
      timestamp: Date.now(),
      ...data,
    });
  }

  function notifyHeight(height) {
    const nextHeight = Number(height) || getDocumentHeight();
    if (!nextHeight) return;
    post('widget:height', { height: nextHeight });
  }

  function setState(nextState) {
    const resolved = typeof nextState === 'function'
      ? nextState(context.state || {})
      : nextState;

    context = {
      ...context,
      state: resolved && typeof resolved === 'object' ? resolved : {},
    };

    post('widget:state', { state: context.state });
    stateListeners.forEach(listener => listener(context.state, api));
  }

  function action(actionId, payload = {}) {
    post('widget:action', {
      action: actionId,
      payload,
    });
  }

  function followUp(prompt, data = {}) {
    post('widget:followup', {
      prompt,
      ...data,
    });
  }

  function onLoad(listener) {
    if (typeof listener !== 'function') return () => {};

    loadListeners.add(listener);

    if (context.artifactId) {
      listener(context, api);
    }

    return () => loadListeners.delete(listener);
  }

  function onStateChange(listener) {
    if (typeof listener !== 'function') return () => {};
    stateListeners.add(listener);
    return () => stateListeners.delete(listener);
  }

  function handleMessage(event) {
    const message = event.data || {};
    if (message.type !== CHANNEL || message.action !== 'widget:load') return;

    const data = message.data || {};
    context = {
      ...context,
      ...data,
      props: data.props || {},
      state: data.state || {},
      actions: data.actions || [],
      permissions: data.permissions || [],
      validation: data.validation || { valid: true, errors: [] },
    };

    loadListeners.forEach(listener => listener(context, api));
  }

  function destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage);
    }
    loadListeners.clear();
    stateListeners.clear();
  }

  const api = {
    ready,
    notifyHeight,
    setState,
    action,
    followUp,
    onLoad,
    onStateChange,
    destroy,
    get context() { return context; },
    get props() { return context.props; },
    get state() { return context.state; },
    get actions() { return context.actions; },
    get permissions() { return context.permissions; },
    get theme() { return context.theme; },
  };

  if (typeof window !== 'undefined') {
    window.artifactuse = api;
    window.addEventListener('message', handleMessage);
  }

  return api;
}

export default createWidgetBridge;
