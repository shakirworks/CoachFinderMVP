import * as SecureStore from 'expo-secure-store';

const SESSION_COOKIE_KEY = 'session_cookie';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://coachfinders.replit.app';

/**
 * Resolve any URL to an absolute URL. Backend stores relative paths (e.g. /uploads/...)
 * which React Native <Image> cannot load without a full base URL.
 */
export function getAbsoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function getStoredCookie(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SESSION_COOKIE_KEY);
  } catch {
    return null;
  }
}

async function storeCookie(cookie: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_COOKIE_KEY, cookie);
  } catch {}
}

export async function clearCookie(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_COOKIE_KEY);
  } catch {}
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const cookie = await getStoredCookie();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const sessionCookie = setCookie.split(';')[0];
    if (sessionCookie) {
      await storeCookie(sessionCookie);
    }
  }

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    try {
      const json = await res.json();
      if (json.error) errorMsg = json.error;
      else if (json.message) errorMsg = json.message;
    } catch {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export async function uploadPhoto(uri: string): Promise<{ url: string }> {
  const cookie = await getStoredCookie();
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  formData.append('photo', { uri, name: filename, type } as unknown as Blob);

  const headers: Record<string, string> = {};
  if (cookie) headers['Cookie'] = cookie;

  const res = await fetch(`${BASE_URL}/api/upload/photo`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Photo upload failed');
  }
  return res.json();
}
