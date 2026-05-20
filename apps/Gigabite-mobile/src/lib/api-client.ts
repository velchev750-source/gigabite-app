import { getAuthToken } from './auth-storage';

const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiUrl(path: string) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export async function apiGet<T>(
  path: string,
  options: { token?: string | null; skipAuth?: boolean } = {},
): Promise<T> {
  const headers = await buildHeaders(options);

  const response = await fetch(getApiUrl(path), {
    headers,
  });

  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: { token?: string | null; skipAuth?: boolean } = {},
): Promise<T> {
  const headers = await buildHeaders(options, true);

  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  options: { token?: string | null; skipAuth?: boolean } = {},
): Promise<T> {
  const headers = await buildHeaders(options, true);

  const response = await fetch(getApiUrl(path), {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
}

async function buildHeaders(
  options: { token?: string | null; skipAuth?: boolean },
  hasJsonBody = false,
) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json';
  }

  const token = options.skipAuth ? null : options.token ?? (await getAuthToken());

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function getErrorMessage(data: unknown, status: number) {
  return data && typeof data === 'object' && 'message' in data && data.message
    ? String(data.message)
    : `Request failed with status ${status}`;
}
