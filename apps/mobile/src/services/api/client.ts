export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  error?: string;
}

export class ApiError extends Error {
  statusCode: number;
  errorPayload?: unknown;

  constructor(message: string, statusCode: number = 500, errorPayload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorPayload = errorPayload;
  }
}

// Configurable endpoint with production default
const DEFAULT_API_BASE_URL = 'https://padhai-pilot.vercel.app/api';

class ApiClient {
  private baseUrl: string = DEFAULT_API_BASE_URL;
  private authToken: string | null = null;

  public setBaseUrl(url: string) {
    let clean = url.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean += '/api';
    }
    this.baseUrl = clean;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 2500);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `Server returned HTTP ${response.status}`;
        let payload: unknown;
        try {
          payload = await response.json();
          if (payload && typeof payload === 'object' && 'message' in payload) {
            const msg = (payload as Record<string, unknown>).message;
            errorMsg = Array.isArray(msg) ? msg.join(', ') : String(msg);
          }
        } catch {
          // Response body was not JSON
        }
        throw new ApiError(errorMsg, response.status, payload);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) {
        throw err;
      }
      const networkMsg =
        err instanceof Error ? err.message : 'Unable to connect to school server. Please verify internet connection.';
      throw new ApiError(networkMsg, 0, err);
    }
  }

  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

