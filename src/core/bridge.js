// artifactuse/core/bridge.js
// postMessage bridge for iframe communication

/**
 * Extract hostname from URL safely
 */
function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Create bridge for panel iframe communication
 * 
 * @param {string|string[]} initialOrigins - Initial allowed origin(s) for message verification
 */
export function createBridge(initialOrigins = []) {
  // Normalize initialOrigins to array
  const originsArray = Array.isArray(initialOrigins) 
    ? initialOrigins 
    : [initialOrigins].filter(Boolean);
  
  // Set of allowed origins (full URLs or hostnames)
  const allowedOrigins = new Set(originsArray);
  
  const listeners = new Map();
  let panelIframe = null;
  let isReady = false;
  const pendingMessages = [];
  
  /**
   * Check if an event origin is allowed
   */
  function isOriginAllowed(eventOrigin) {
    if (allowedOrigins.size === 0) {
      // No origins configured - allow all (backwards compatibility, but warn)
      console.warn('Artifactuse bridge: No allowed origins configured, accepting all messages');
      return true;
    }
    
    const eventHostname = getHostname(eventOrigin);
    if (!eventHostname) return false;
    
    // Check if any allowed origin matches
    for (const allowed of allowedOrigins) {
      const allowedHostname = getHostname(allowed);
      if (allowedHostname && allowedHostname === eventHostname) {
        return true;
      }
      // Also check if the allowed origin is just a hostname string
      if (allowed === eventHostname) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Handle messages from iframe
   */
  function handleMessage(event) {
    // Verify origin against allowed origins
    if (!isOriginAllowed(event.origin)) {
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
   * Add an allowed origin for message verification
   * Call this when registering panels with custom CDNs
   * 
   * @param {string} origin - Origin URL to allow (e.g., 'https://charts.example.com')
   */
  function addAllowedOrigin(origin) {
    if (origin && typeof origin === 'string') {
      allowedOrigins.add(origin);
    }
  }
  
  /**
   * Remove an allowed origin
   * 
   * @param {string} origin - Origin URL to remove
   */
  function removeAllowedOrigin(origin) {
    if (origin && typeof origin === 'string') {
      allowedOrigins.delete(origin);
    }
  }
  
  /**
   * Get all currently allowed origins
   * 
   * @returns {string[]} - Array of allowed origins
   */
  function getAllowedOrigins() {
    return [...allowedOrigins];
  }
  
  /**
   * Set panel iframe reference
   */
  function setIframe(iframe) {
    panelIframe = iframe;
    isReady = false;
  }
  
  /**
   * Send raw message to iframe
   * 
   * @param {object} message - Message to send
   * @param {string} targetOrigin - Optional specific origin to send to (defaults to '*')
   */
  function sendRaw(message, targetOrigin = '*') {
    if (!panelIframe?.contentWindow) {
      console.warn('Artifactuse: No panel iframe available');
      return false;
    }
    
    try {
      panelIframe.contentWindow.postMessage(message, targetOrigin);
      return true;
    } catch (error) {
      console.error('Artifactuse bridge send error:', error);
      return false;
    }
  }
  
  /**
   * Send message to iframe
   * 
   * @param {string} action - Action name
   * @param {*} data - Data to send
   * @param {string} requestId - Optional request ID
   * @param {string} targetOrigin - Optional specific origin to send to
   */
  function send(action, data, requestId = null, targetOrigin = '*') {
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
    
    sendRaw(message, targetOrigin);
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
    allowedOrigins.clear();
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
    
    // Origin management
    addAllowedOrigin,
    removeAllowedOrigin,
    getAllowedOrigins,
    
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