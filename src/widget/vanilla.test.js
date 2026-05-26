import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWidgetBridge } from './vanilla.js';

function installWindow() {
  let messageHandler = null;

  globalThis.window = {
    parent: null,
    addEventListener: vi.fn((eventName, handler) => {
      if (eventName === 'message') messageHandler = handler;
    }),
    removeEventListener: vi.fn((eventName, handler) => {
      if (eventName === 'message' && messageHandler === handler) messageHandler = null;
    }),
  };

  return {
    dispatch(message) {
      messageHandler?.({ data: message });
    },
  };
}

describe('createWidgetBridge', () => {
  afterEach(() => {
    delete globalThis.window;
    delete globalThis.document;
    vi.restoreAllMocks();
  });

  it('posts ready, action, state, height, and follow-up messages', () => {
    installWindow();
    const hostWindow = { postMessage: vi.fn() };
    const widget = createWidgetBridge({ hostWindow, targetOrigin: 'https://host.example' });

    widget.ready();
    widget.action('approve', { id: 1 });
    widget.setState({ selected: true });
    widget.notifyHeight(320);
    widget.followUp('Continue with the deploy');

    expect(hostWindow.postMessage).toHaveBeenCalledTimes(5);
    expect(hostWindow.postMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'artifactuse', action: 'widget:ready' }),
      'https://host.example',
    );
    expect(hostWindow.postMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        action: 'widget:action',
        data: { action: 'approve', payload: { id: 1 } },
      }),
      'https://host.example',
    );
    expect(hostWindow.postMessage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        action: 'widget:state',
        data: { state: { selected: true } },
      }),
      'https://host.example',
    );
    expect(hostWindow.postMessage).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        action: 'widget:height',
        data: { height: 320 },
      }),
      'https://host.example',
    );
    expect(hostWindow.postMessage).toHaveBeenNthCalledWith(
      5,
      expect.objectContaining({
        action: 'widget:followup',
        data: { prompt: 'Continue with the deploy' },
      }),
      'https://host.example',
    );
  });

  it('updates context when the host sends widget:load', () => {
    const windowHarness = installWindow();
    const hostWindow = { postMessage: vi.fn() };
    const widget = createWidgetBridge({ hostWindow });
    const onLoad = vi.fn();

    widget.onLoad(onLoad);
    windowHarness.dispatch({
      type: 'artifactuse',
      action: 'widget:load',
      data: {
        artifactId: 'msg-1-widget-0',
        template: 'approval-card',
        props: { title: 'Deploy' },
        state: { selectedAction: 'approve' },
        actions: [{ id: 'approve', label: 'Approve' }],
        permissions: ['state', 'actions'],
        theme: 'light',
        inline: true,
      },
    });

    expect(onLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactId: 'msg-1-widget-0',
        template: 'approval-card',
        props: { title: 'Deploy' },
        state: { selectedAction: 'approve' },
        theme: 'light',
      }),
      widget,
    );
    expect(widget.props).toEqual({ title: 'Deploy' });
    expect(widget.state).toEqual({ selectedAction: 'approve' });
    expect(widget.actions).toEqual([{ id: 'approve', label: 'Approve' }]);
    expect(widget.permissions).toEqual(['state', 'actions']);
    expect(widget.theme).toBe('light');
  });
});
