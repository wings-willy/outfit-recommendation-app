const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => apiFetch(endpoint),
  post: (endpoint: string, body: unknown) =>
    apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) =>
    apiFetch(endpoint, { method: 'DELETE' }),
};
