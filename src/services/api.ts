import { supabase } from './supabase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// 인증 토큰 포함 fetch 래퍼
async function authFetch(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

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
  get: (endpoint: string) => authFetch(endpoint),
  post: (endpoint: string, body: unknown) =>
    authFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: unknown) =>
    authFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) =>
    authFetch(endpoint, { method: 'DELETE' }),
};
