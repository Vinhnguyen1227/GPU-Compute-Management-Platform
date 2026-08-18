const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('dgx_access_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      const refreshToken = localStorage.getItem('dgx_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (refreshData.accessToken) {
              localStorage.setItem('dgx_access_token', refreshData.accessToken);
              if (refreshData.refreshToken) {
                localStorage.setItem('dgx_refresh_token', refreshData.refreshToken);
              }
              headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
              const retryRes = await fetch(url, { ...options, headers });
              if (retryRes.ok) {
                const contentType = retryRes.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  return await retryRes.json();
                }
                return (await retryRes.text()) as unknown as T;
              }
            }
          }
        } catch {
          // Token refresh failed
        }
      }
      localStorage.removeItem('dgx_access_token');
      localStorage.removeItem('dgx_refresh_token');
    }

    if (!response.ok) {
      const errBody = await response.text();
      let parsedMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const parsed = JSON.parse(errBody);
        parsedMessage = parsed.message || parsed.error || parsedMessage;
      } catch {
        if (errBody) parsedMessage = errBody;
      }
      throw new Error(parsedMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return (await response.text()) as unknown as T;
  } catch (err: any) {
    console.warn(`[API Client] Call to ${url} failed:`, err.message || err);
    throw err;
  }
}
