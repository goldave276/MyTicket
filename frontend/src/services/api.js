const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const clearAuthStorageAndNotify = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('myticket_token');
      localStorage.removeItem('myticket_refresh_token');
      localStorage.removeItem('myticket_user');
      window.dispatchEvent(new CustomEvent('myticket_auth_expired'));
    } catch {
      // Storage unavailable or disabled
    }
  }
};

/**
 * Universal fetch wrapper with authorization header injection, transparent token refresh and error handling.
 */
export async function apiFetch(endpoint, options = {}, isRetry = false) {
  const purgeAuth = () => {
    try {
      if (typeof clearAuthStorageAndNotify === 'function') {
        clearAuthStorageAndNotify();
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('myticket_token');
        localStorage.removeItem('myticket_refresh_token');
        localStorage.removeItem('myticket_user');
        window.dispatchEvent(new CustomEvent('myticket_auth_expired'));
      }
    } catch {
      // Ignore storage errors
    }
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject token if present in client storage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('myticket_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized and not already retrying or on auth endpoints
    if (
      response.status === 401 &&
      !isRetry &&
      typeof window !== 'undefined' &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/signup') &&
      !endpoint.includes('/auth/refresh')
    ) {
      const storedRefreshToken = localStorage.getItem('myticket_refresh_token');

      if (storedRefreshToken) {
        if (isRefreshing) {
          // Queue the request until refresh finishes
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${token}`
            };
            return apiFetch(endpoint, options, true);
          });
        }

        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData.accessToken;
            if (newToken) {
              localStorage.setItem('myticket_token', newToken);
            }
            if (refreshData.refreshToken) {
              localStorage.setItem('myticket_refresh_token', refreshData.refreshToken);
            }
            if (refreshData.user) {
              localStorage.setItem('myticket_user', JSON.stringify(refreshData.user));
            }
            processQueue(null, newToken);
            isRefreshing = false;

            // Retry original request with new token
            const retryHeaders = {
              ...(options.headers || {}),
              Authorization: `Bearer ${newToken}`,
            };
            return apiFetch(endpoint, { ...options, headers: retryHeaders }, true);
          } else {
            // Refresh failed (invalid/expired refresh token)
            purgeAuth();
            const sessionErr = new Error('Session expirée');
            sessionErr.status = 401;
            processQueue(sessionErr);
            isRefreshing = false;
          }
        } catch (refreshErr) {
          purgeAuth();
          processQueue(refreshErr);
          isRefreshing = false;
        }
      } else {
        // No refresh token available
        purgeAuth();
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || data.error || `Erreur ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur backend (http://localhost:3000). Vérifiez que l\'API est démarrée.');
    }
    throw err;
  }
}

export default apiFetch;
