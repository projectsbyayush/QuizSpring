import axios, { type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, DEMO_MODE } from '../lib/config';
import { mockAdapter } from './mockAdapter';
import { clearStoredSession, getStoredSession, storeSession, type StoredSession } from '../lib/tokenStore';
import type { ApiErrorPayload, AuthResponse } from '../types';

export const SESSION_UPDATED_EVENT = 'quizspring:session-updated';
export const SESSION_EXPIRED_EVENT = 'quizspring:session-expired';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  adapter: DEMO_MODE ? mockAdapter : undefined,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshPromise: Promise<string> | null = null;

function notifySessionUpdated(response: AuthResponse): void {
  storeSession({ access_token: response.access_token, refresh_token: response.refresh_token });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<AuthResponse>(SESSION_UPDATED_EVENT, { detail: response }));
  }
}

function notifySessionExpired(): void {
  clearStoredSession();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

function isAuthEndpoint(config: RetryableConfig): boolean {
  const url = config.url ?? '';
  return [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
    '/auth/forgot-password',
    '/auth/reset-password',
  ].some((path) => url.includes(path));
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const session = getStoredSession();
  if (!session?.refresh_token) {
    notifySessionExpired();
    throw new Error('Your session has expired. Please sign in again.');
  }

  refreshPromise = axios
    .post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, { refresh_token: session.refresh_token })
    .then(({ data }) => {
      notifySessionUpdated(data);
      return data.access_token;
    })
    .catch((error: unknown) => {
      notifySessionExpired();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.access_token) {
    config.headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    const config = error.config as RetryableConfig | undefined;
    if (!config || error.response?.status !== 401 || config._retry || isAuthEndpoint(config)) {
      return Promise.reject(error);
    }
    config._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      config.headers.set('Authorization', `Bearer ${accessToken}`);
      return apiClient(config);
    } catch (refreshError: unknown) {
      return Promise.reject(refreshError);
    }
  },
);

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    if (data?.field_errors) {
      const first = Object.values(data.field_errors)[0];
      if (first) return first;
    }
    if (error.code === 'ECONNABORTED') return 'The request took too long. Please try again.';
    if (!error.response) return 'Unable to reach the QuizSpring API.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError<ApiErrorPayload>(error)) return error.response?.data?.code;
  return undefined;
}

export function persistAuthResponse(response: AuthResponse): StoredSession {
  notifySessionUpdated(response);
  return { access_token: response.access_token, refresh_token: response.refresh_token };
}
