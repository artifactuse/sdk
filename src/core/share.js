/**
 * Share service for Artifactuse SDK
 * Handles sharing and saving artifacts to the API
 */

const STORAGE_KEY = 'artifactuse_auth';
const APP_URL = 'https://app.artifactuse.com';
const API_URL = 'https://api.artifactuse.com';

/**
 * Get stored auth data from localStorage
 */
export function getStoredAuthData() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Store auth data in localStorage
 */
export function setStoredAuthData(data) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear stored auth data
 */
export function clearStoredAuthData() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated() {
  const data = getStoredAuthData();
  return data?.token != null;
}

/**
 * Get stored user email
 */
export function getStoredEmail() {
  const data = getStoredAuthData();
  return data?.user?.email || '';
}

/**
 * Share an artifact anonymously (expires in 30 days)
 * @param {Object} artifact - The artifact to share
 * @param {Object} options - Share options
 * @returns {Promise<Object>} - { id, url, expiresAt }
 */
export async function shareArtifact(artifact, options = {}) {
  const { apiUrl = API_URL } = options;

  const response = await fetch(`${apiUrl}/v1/project/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: artifact.code,
      language: artifact.language,
      title: artifact.title,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to share artifact' }));
    throw new Error(error.message || 'Failed to share artifact');
  }

  return response.json();
}

/**
 * Save an artifact to account (permanent, requires authentication)
 * @param {Object} artifact - The artifact to save
 * @param {Object} options - Save options
 * @returns {Promise<Object>} - { id, url, saved }
 */
export async function saveArtifact(artifact, options = {}) {
  const { apiUrl = API_URL, getStoredAuthData: _getAuth = getStoredAuthData } = options;

  const storedData = _getAuth();

  if (!storedData?.token) {
    throw new Error('Authentication required. Please sign in first.');
  }

  const response = await fetch(`${apiUrl}/v1/project/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': storedData.token,
    },
    body: JSON.stringify({
      code: artifact.code,
      language: artifact.language,
      title: artifact.title,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to save artifact' }));
    throw new Error(error.message || 'Failed to save artifact');
  }

  return response.json();
}

/**
 * Open auth popup for user to sign in
 * @param {Object} options - Options
 * @returns {Promise<Object>} - { token, user }
 */
export function openAuthPopup(options = {}) {
  const {
    appUrl = APP_URL,
    setStoredAuthData: _setAuth = setStoredAuthData,
    getStoredAuthData: _getAuth = getStoredAuthData,
  } = options;

  return new Promise((resolve, reject) => {
    const origin = window.location.origin;
    const authUrl = `${appUrl}/sdk/auth?origin=${encodeURIComponent(origin)}`;

    // Open popup
    const popup = window.open(
      authUrl,
      'Artifactuse Auth',
      'width=500,height=600,scrollbars=yes'
    );

    if (!popup) {
      reject(new Error('Failed to open auth popup. Please allow popups for this site.'));
      return;
    }

    // Listen for message from popup
    const messageHandler = (event) => {
      // Verify origin
      if (event.origin !== appUrl) {
        return;
      }

      // Check for our auth message
      if (event.data?.type === 'sdk-auth') {
        window.removeEventListener('message', messageHandler);

        const { token, user } = event.data;

        if (token) {
          // Store auth data
          _setAuth({ token, user });
          resolve({ token, user });
        } else {
          reject(new Error('Authentication failed'));
        }
      }
    };

    window.addEventListener('message', messageHandler);

    // Check if popup was closed without auth
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);

        // Check if we got auth in the meantime
        const data = _getAuth();
        if (data?.token) {
          resolve(data);
        } else {
          reject(new Error('Authentication cancelled'));
        }
      }
    }, 500);
  });
}

/**
 * Sign out - clear stored auth data
 */
export function signOut() {
  clearStoredAuthData();
}

/**
 * Create share service instance with config
 * @param {Object} config - Sharing configuration
 */
export function createShareService(config = {}) {
  const {
    apiUrl = API_URL,
    appUrl = APP_URL,
    storageKey = STORAGE_KEY,
    enabled = true,
    allowAnonymous = true,
    expiryDays = 30,
  } = config;

  // Closure-based storage helpers using configured storageKey
  function _getStoredAuthData() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    try {
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  function _setStoredAuthData(data) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch {}
  }

  function _clearStoredAuthData() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try { localStorage.removeItem(storageKey); } catch {}
  }

  return {
    enabled,
    allowAnonymous,
    expiryDays,
    apiUrl,
    appUrl,

    // State helpers
    isAuthenticated: () => _getStoredAuthData()?.token != null,
    getStoredEmail: () => _getStoredAuthData()?.user?.email || '',
    getStoredAuthData: _getStoredAuthData,
    setStoredAuthData: _setStoredAuthData,
    clearStoredAuthData: _clearStoredAuthData,
    signOut: _clearStoredAuthData,

    // API methods
    share: (artifact) => shareArtifact(artifact, { apiUrl }),
    save: (artifact) => saveArtifact(artifact, { apiUrl, getStoredAuthData: _getStoredAuthData }),
    openAuthPopup: () => openAuthPopup({ appUrl, setStoredAuthData: _setStoredAuthData, getStoredAuthData: _getStoredAuthData }),
  };
}

export default createShareService;
