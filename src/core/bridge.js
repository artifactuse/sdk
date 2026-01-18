// artifactuse/core/bridge.js
// postMessage bridge for iframe communication

/**
 * Create bridge for panel iframe communication
 */
export function createBridge(cdnUrl) {
  const listeners = new Map();
  let panelIframe = null;
  let isReady = false;
  const pendingMessages = [];
  
  /**
   * Handle messages from iframe
   */
  function handleMessage(event) {
    // Verify origin
    if (!event.origin.includes(new URL(cdnUrl).hostname)) {
      return;
    }
    
    const { type, action, data, requestId } = event.data || {};
    
    if (type !== 'artifactuse') return;
    
    // Handle ready signal
    if (action === 'ready' || action === 'panel:ready') {
      isReady = true;
      // Send any pending messages
      pendingMessages.forEach(msg => sendRaw(msg));
      pendingMessages.length = 0;
      return;
    }
    
    // Emit to listeners
    const callbacks = listeners.get(action) || [];
    callbacks.forEach(callback => {
      try {
        callback(data, requestId);
      } catch (error) {
        console.error(`Artifactuse bridge handler error (${action}):`, error);
      }
    });
    
    // Emit to wildcard listeners
    const wildcardCallbacks = listeners.get('*') || [];
    wildcardCallbacks.forEach(callback => {
      try {
        callback({ action, data, requestId });
      } catch (error) {
        console.error('Artifactuse bridge wildcard handler error:', error);
      }
    });
  }
  
  // Listen for messages
  window.addEventListener('message', handleMessage);
  
  /**
   * Set panel iframe reference
   */
  function setIframe(iframe) {
    panelIframe = iframe;
    isReady = false;
  }
  
  /**
   * Send raw message to iframe
   */
  function sendRaw(message) {
    if (!panelIframe?.contentWindow) {
      console.warn('Artifactuse: No panel iframe available');
      return false;
    }
    
    try {
      panelIframe.contentWindow.postMessage(message, cdnUrl);
      return true;
    } catch (error) {
      console.error('Artifactuse bridge send error:', error);
      return false;
    }
  }
  
  /**
   * Send message to iframe
   */
  function send(action, data, requestId = null) {
    const message = {
      type: 'artifactuse',
      action,
      data,
      requestId: requestId || generateRequestId(),
      timestamp: Date.now(),
    };
    
    if (!isReady) {
      pendingMessages.push(message);
      return message.requestId;
    }
    
    sendRaw(message);
    return message.requestId;
  }
  
  /**
   * Send and wait for response
   */
  function request(action, data, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const requestId = generateRequestId();
      
      const timeoutId = setTimeout(() => {
        off(`${action}:response`, handler);
        reject(new Error(`Artifactuse bridge request timeout: ${action}`));
      }, timeout);
      
      const handler = (responseData, responseId) => {
        if (responseId === requestId) {
          clearTimeout(timeoutId);
          off(`${action}:response`, handler);
          resolve(responseData);
        }
      };
      
      on(`${action}:response`, handler);
      send(action, data, requestId);
    });
  }
  
  /**
   * Subscribe to action
   */
  function on(action, callback) {
    if (!listeners.has(action)) {
      listeners.set(action, []);
    }
    listeners.get(action).push(callback);
    
    // Return unsubscribe function
    return () => off(action, callback);
  }
  
  /**
   * Unsubscribe from action
   */
  function off(action, callback) {
    const callbacks = listeners.get(action);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * Send artifact data to panel
   */
  function loadArtifact(artifact) {
    return send('load:artifact', artifact);
  }
  
  /**
   * Update artifact in panel
   */
  function updateArtifact(artifactId, updates) {
    return send('update:artifact', { artifactId, updates });
  }
  
  /**
   * Request save from panel
   */
  function requestSave() {
    return request('save', {});
  }
  
  /**
   * Request export from panel
   */
  function requestExport(format = 'default') {
    return request('export', { format });
  }
  
  /**
   * Send AI response to panel
   */
  function sendAIResponse(response, requestId) {
    return send('ai:response', response, requestId);
  }
  
  /**
   * Destroy bridge
   */
  function destroy() {
    window.removeEventListener('message', handleMessage);
    listeners.clear();
    panelIframe = null;
    isReady = false;
    pendingMessages.length = 0;
  }
  
  // Public API
  return {
    setIframe,
    send,
    request,
    on,
    off,
    loadArtifact,
    updateArtifact,
    requestSave,
    requestExport,
    sendAIResponse,
    destroy,
    
    // State
    get isReady() { return isReady; },
    get iframe() { return panelIframe; },
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create bridge receiver (for use inside panel iframes)
 */
export function createBridgeReceiver(allowedOrigins = []) {
  const listeners = new Map();
  let parentOrigin = null;
  
  /**
   * Handle messages from parent
   */
  function handleMessage(event) {
    // Verify origin if specified
    if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
      return;
    }
    
    const { type, action, data, requestId } = event.data || {};
    
    if (type !== 'artifactuse') return;
    
    // Store parent origin for responses
    parentOrigin = event.origin;
    
    // Emit to listeners
    const callbacks = listeners.get(action) || [];
    callbacks.forEach(callback => {
      try {
        callback(data, requestId, respond);
      } catch (error) {
        console.error(`Artifactuse receiver handler error (${action}):`, error);
      }
    });
  }
  
  /**
   * Send response to parent
   */
  function respond(action, data, requestId) {
    if (!parentOrigin) {
      console.warn('Artifactuse receiver: No parent origin');
      return;
    }
    
    window.parent.postMessage({
      type: 'artifactuse',
      action,
      data,
      requestId,
      timestamp: Date.now(),
    }, parentOrigin);
  }
  
  /**
   * Send message to parent
   */
  function send(action, data) {
    respond(action, data, null);
  }
  
  /**
   * Subscribe to action
   */
  function on(action, callback) {
    if (!listeners.has(action)) {
      listeners.set(action, []);
    }
    listeners.get(action).push(callback);
    
    return () => off(action, callback);
  }
  
  /**
   * Unsubscribe
   */
  function off(action, callback) {
    const callbacks = listeners.get(action);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * Signal ready to parent
   */
  function ready() {
    // Try to send to any parent
    try {
      window.parent.postMessage({
        type: 'artifactuse',
        action: 'ready',
        timestamp: Date.now(),
      }, '*');
    } catch (error) {
      console.error('Artifactuse receiver: Failed to signal ready', error);
    }
  }
  
  /**
   * Request AI from parent
   */
  function requestAI(prompt, context = {}) {
    const requestId = generateRequestId();
    send('ai:request', { prompt, context, requestId });
    return requestId;
  }
  
  /**
   * Request save to parent
   */
  function requestSave(data) {
    send('save:request', data);
  }
  
  /**
   * Notify export complete
   */
  function notifyExportComplete(data) {
    send('export:complete', data);
  }
  
  /**
   * Destroy receiver
   */
  function destroy() {
    window.removeEventListener('message', handleMessage);
    listeners.clear();
  }
  
  // Start listening
  window.addEventListener('message', handleMessage);
  
  // Public API
  return {
    on,
    off,
    send,
    respond,
    ready,
    requestAI,
    requestSave,
    notifyExportComplete,
    destroy,
  };
}

export default {
  createBridge,
  createBridgeReceiver,
};
