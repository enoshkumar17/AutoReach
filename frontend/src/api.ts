import type { AuthUser } from './types';

const TOKEN_KEY = 'autoreach_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Global fetch interceptor: Automatically attaches Bearer token to all /api requests
const originalFetch = window.fetch;
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  let modifiedInit = init;
  if (url.startsWith('/api') && !url.startsWith('/api/auth/login') && !url.startsWith('/api/auth/register')) {
    const token = getStoredToken();
    if (token) {
      modifiedInit = { ...init };
      const headers = new Headers(modifiedInit.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      modifiedInit.headers = headers;
    }
  }

  const response = await originalFetch(input, modifiedInit);

  // If unauthorized on protected routes, broadcast event to App
  if (response.status === 401 && !url.startsWith('/api/auth')) {
    setStoredToken(null);
    window.dispatchEvent(new CustomEvent('autoreach:unauthorized'));
  }

  return response;
};

export async function apiRegister(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; token?: string; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Registration failed.' };
    }
    if (data.token) {
      setStoredToken(data.token);
    }
    return { success: true, token: data.token, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during registration.' };
  }
}

export async function apiLogin(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Invalid email or password.' };
    }
    if (data.token) {
      setStoredToken(data.token);
    }
    return { success: true, token: data.token, user: data.user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during login.' };
  }
}

export async function apiGetCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
    setStoredToken(null);
    return null;
  } catch (_) {
    return null;
  }
}

export function apiLogout() {
  setStoredToken(null);
}
