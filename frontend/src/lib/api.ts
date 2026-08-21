const resolvedApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');

export const API_BASE_URL = resolvedApiBaseUrl;

export const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message ?? 'Request failed');
  }

  return json.data as T;
};
