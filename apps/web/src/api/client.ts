import axios, { AxiosHeaders, type AxiosRequestConfig, type Method } from 'axios';

export interface Permission {
  module: string;
  actions: Record<string, boolean>;
}

export interface SessionUser {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  tenantId: string;
  permissions?: Permission[];
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { code?: string; message?: string; details?: unknown };
}

const SESSION_KEY = 'apta.erp.session';
export const SESSION_EVENT = 'apta:session-change';
const configuredApiBaseUrl = typeof __APTA_API_BASE_URL__ === 'string'
  ? __APTA_API_BASE_URL__.trim()
  : '';
const localApiBaseUrl = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? `${window.location.protocol}//${window.location.hostname}:3000/api/v1`
  : '';

export const apiBaseUrl = (configuredApiBaseUrl || localApiBaseUrl).replace(/\/$/, '');

let refreshInFlight: Promise<string> | null = null;

export function readStoredSession(): Session | null {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || !('accessToken' in parsed) || typeof parsed.accessToken !== 'string') return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  if (session) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function requestConfig(method: Method, url: string, data?: unknown, session?: Session | null): AxiosRequestConfig {
  const headers = AxiosHeaders.from();
  if (session?.accessToken) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (data !== undefined) headers.set('Content-Type', 'application/json');

  return { baseURL: apiBaseUrl, method, url, data, headers, timeout: 15000 };
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!apiBaseUrl) throw new Error('Configura ERP_API_BASE_URL para conectar con la API.');

  if (!refreshInFlight) {
    refreshInFlight = axios.post<ApiEnvelope<{ accessToken: string }>>(
      `${apiBaseUrl}/auth/refresh`,
      { refreshToken },
      { timeout: 15000 },
    ).then((response) => response.data.data.accessToken).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function apiRequest<T>(
  method: Method,
  url: string,
  data: unknown,
  session: Session | null,
): Promise<T> {
  if (!apiBaseUrl) throw new Error('Configura ERP_API_BASE_URL para conectar con la API.');

  try {
    const response = await axios.request<ApiEnvelope<T>>(requestConfig(method, url, data, session));
    return response.data.data;
  } catch (error: unknown) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !session?.refreshToken || url.startsWith('/auth/')) {
      throw error;
    }

    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(session.refreshToken);
    } catch (refreshError: unknown) {
      saveSession(null);
      throw refreshError;
    }

    const renewedSession = { ...session, accessToken };
    saveSession(renewedSession);
    const response = await axios.request<ApiEnvelope<T>>(requestConfig(method, url, data, renewedSession));
    return response.data.data;
  }
}

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData: unknown = error.response?.data;
    if (typeof responseData === 'object' && responseData !== null && 'error' in responseData) {
      const apiError = responseData.error;
      if (typeof apiError === 'object' && apiError !== null && 'message' in apiError && typeof apiError.message === 'string') {
        return apiError.message;
      }
    }
    if (error.code === 'ERR_NETWORK') return `No se pudo conectar con la API (${apiBaseUrl || 'URL no configurada'}).`;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error. Intenta nuevamente.';
}

export function apiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const responseData: unknown = error.response?.data;
  if (typeof responseData !== 'object' || responseData === null || !('error' in responseData)) return null;
  const apiError = responseData.error;
  if (typeof apiError !== 'object' || apiError === null || !('code' in apiError)) return null;
  return typeof apiError.code === 'string' ? apiError.code : null;
}