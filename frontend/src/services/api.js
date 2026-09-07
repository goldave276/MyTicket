const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Universal fetch wrapper with authorization header injection and error handling.
 */
export async function apiFetch(endpoint, options = {}) {
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

    // If session expired or unauthorized, clean token if 401
    if (response.status === 401 && typeof window !== 'undefined') {
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/signup')) {
        localStorage.removeItem('myticket_token');
        localStorage.removeItem('myticket_user');
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
