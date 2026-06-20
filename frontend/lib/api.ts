import { getPublicEnv } from '@/lib/env';
import type { AuthUser } from '@/lib/auth-types';

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFail = { success: false; error: string };
export type ApiResult<T> = ApiSuccess<T> | ApiFail;

type ApiFetchOptions = RequestInit & {
  accessToken?: string | null;
  cacheTtlMs?: number;
  disableDedupe?: boolean;
  /** Do not attempt token refresh / unauthorized side-effects (login, refresh, etc.) */
  skipAuthRefresh?: boolean;
};

const DEFAULT_CACHE_TTL_MS = 4000;
export const AUTH_UNAUTHORIZED_EVENT = 'vsms:auth-unauthorized';

async function persistRefreshedSession(
  accessToken: string,
  user?: AuthUser,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const { useAuthStore } = await import('@/stores/auth-store');
  const state = useAuthStore.getState();
  if (state.sessionRevoked) return;
  if (!user && !state.user) return;
  state.setAuth(accessToken, user ?? state.user!);
}

type RefreshResult = { accessToken: string; user: AuthUser } | null;
let refreshInFlight: Promise<RefreshResult> | null = null;

export async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async (): Promise<RefreshResult> => {
    try {
      const { apiUrl } = getPublicEnv();
      const url = joinApiUrl(apiUrl, '/api/auth/refresh');

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const refreshRes = await fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const refreshJson: unknown = await refreshRes.json().catch(() => null);

          if (!refreshRes.ok) {
            if (refreshRes.status === 401) {
              return null;
            }
            throw new Error(`Refresh failed (${refreshRes.status})`);
          }

          const parsed = parseEnvelope(refreshJson);
          if (!parsed.ok) {
            return null;
          }

          const data = parsed.data as { accessToken: string; user: AuthUser };
          if (!data?.accessToken || !data?.user) {
            return null;
          }

          await persistRefreshedSession(data.accessToken, data.user);
          return { accessToken: data.accessToken, user: data.user };
        } catch {
          if (attempt < 2) {
            await new Promise((r) => window.setTimeout(r, 700 * (attempt + 1)));
          }
        }
      }

      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

const inFlightGetRequests = new Map<string, Promise<ApiResult<unknown>>>();
const recentGetCache = new Map<
  string,
  { expiresAt: number; value: ApiResult<unknown> }
>();

function extractErrorMessage(json: unknown, status: number): string {
  if (typeof json === 'object' && json !== null && 'message' in json) {
    const m = (json as { message: unknown }).message;
    if (typeof m === 'string') {
      return m;
    }
    if (Array.isArray(m)) {
      return m.map(String).join(', ');
    }
  }
  return `Request failed (${status})`;
}

function parseEnvelope(
  json: unknown,
): { ok: true; data: unknown } | { ok: false; error: string } {
  if (!json || typeof json !== 'object') {
    return { ok: false, error: 'Invalid API response.' };
  }
  const record = json as Record<string, unknown>;
  if (record.success === false && typeof record.error === 'string') {
    return { ok: false, error: record.error };
  }
  if (record.success === true) {
    return { ok: true, data: 'data' in record ? record.data : null };
  }
  return { ok: false, error: 'Unexpected API response shape.' };
}

function joinApiUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, '');
  let trimmedPath = path.startsWith('/') ? path : `/${path}`;
  if (trimmedBase.endsWith('/api') && trimmedPath.startsWith('/api')) {
    trimmedPath = trimmedPath === '/api' ? '' : trimmedPath.slice(4);
  }
  return `${trimmedBase}${trimmedPath}`;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  retries: number = 2,
): Promise<ApiResult<T>> {
  const {
    accessToken,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    disableDedupe = false,
    skipAuthRefresh = false,
    ...requestInit
  } = options;
  const { apiUrl } = getPublicEnv();
  const url = joinApiUrl(apiUrl, path);
  const headers = new Headers(requestInit.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (
    requestInit.body !== undefined &&
    !(requestInit.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const method = (requestInit.method ?? 'GET').toUpperCase();
  const isIdempotentMethod =
    method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
  const maxAttempts = isIdempotentMethod ? retries : 0;
  const canUseGetDedupe =
    method === 'GET' && requestInit.body === undefined && !disableDedupe;
  const cacheKey = canUseGetDedupe
    ? `${url}|auth:${headers.get('Authorization') ?? ''}`
    : '';

  if (canUseGetDedupe) {
    const cached = recentGetCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as ApiResult<T>;
    }

    const pending = inFlightGetRequests.get(cacheKey);
    if (pending) {
      return (await pending) as ApiResult<T>;
    }
  }

  const requestPromise: Promise<ApiResult<T>> = (async () => {
    for (let i = 0; i <= maxAttempts; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        const res = await fetch(url, {
          ...requestInit,
          headers,
          credentials: 'include', // CRITICAL: Send cookies
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const json: unknown = await res.json().catch(() => null);

        if (!res.ok) {
          const canAttemptRefresh =
            res.status === 401 &&
            typeof window !== 'undefined' &&
            !skipAuthRefresh &&
            Boolean(accessToken);

          if (canAttemptRefresh) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
              headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
              const retryRes = await fetch(url, {
                ...requestInit,
                headers,
                credentials: 'include',
              });
              const retryJson: unknown = await retryRes.json().catch(() => null);

              if (retryRes.ok) {
                const parsed = parseEnvelope(retryJson);
                if (!parsed.ok) {
                  return { success: false, error: parsed.error };
                }
                const result: ApiResult<T> = {
                  success: true,
                  data: parsed.data as T,
                };
                if (canUseGetDedupe && cacheTtlMs > 0) {
                  recentGetCache.set(cacheKey, {
                    expiresAt: Date.now() + cacheTtlMs,
                    value: result,
                  });
                }
                return result;
              }
            }

            window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
          }
          if (res.status >= 400 && res.status < 500) {
            if (res.status === 429) {
              return {
                success: false,
                error:
                  extractErrorMessage(json, res.status) ||
                  'Bahut zyada requests. 1-2 minute wait karke dubara try karein.',
              };
            }
            if (res.status === 403) {
              return {
                success: false,
                error:
                  extractErrorMessage(json, res.status) ||
                  'Access forbidden. Page refresh karein ya dubara login karein.',
              };
            }
            const msg = extractErrorMessage(json, res.status);
            return { success: false, error: msg };
          }

          // Retry on 5xx errors
          if (res.status >= 500 && i < maxAttempts) {
            await new Promise((r) => setTimeout(r, 500 * (i + 1)));
            continue;
          }

          const msg = extractErrorMessage(json, res.status);
          return { success: false, error: msg };
        }

        const parsed = parseEnvelope(json);
        if (!parsed.ok) {
          return { success: false, error: parsed.error };
        }
        const result: ApiResult<T> = { success: true, data: parsed.data as T };
        if (canUseGetDedupe && cacheTtlMs > 0) {
          recentGetCache.set(cacheKey, {
            expiresAt: Date.now() + cacheTtlMs,
            value: result,
          });
        }
        return result;
      } catch (e: unknown) {
        // Retry on network errors
        if (i < maxAttempts) {
          await new Promise((r) => setTimeout(r, 500 * (i + 1)));
          continue;
        }
        const message = e instanceof Error ? e.message : 'Network error';
        const friendlyMessage =
          message === 'Failed to fetch' || message.includes('fetch')
            ? 'API server se connect nahi ho saka. Backend (port 4000) check karein.'
            : message;
        return { success: false, error: friendlyMessage };
      }
    }
    return { success: false, error: 'Request failed after retries' };
  })();

  if (canUseGetDedupe) {
    inFlightGetRequests.set(
      cacheKey,
      requestPromise as Promise<ApiResult<unknown>>,
    );
  }

  try {
    return await requestPromise;
  } finally {
    if (canUseGetDedupe) {
      inFlightGetRequests.delete(cacheKey);
    }
  }
}

export async function authLogin(
  body: Record<string, unknown>,
): Promise<
  ApiResult<{ accessToken: string; refreshToken: string; user: AuthUser }>
> {
  return apiFetch<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuthRefresh: true,
  });
}

export async function authRegister(
  body: Record<string, unknown>,
): Promise<ApiResult<{ email: string }>> {
  return apiFetch<{ email: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuthRefresh: true,
  });
}

export async function authVerifySignup(
  body: Record<string, unknown>,
): Promise<
  ApiResult<{ accessToken: string; refreshToken: string; user: AuthUser }>
> {
  return apiFetch<{
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  }>('/api/auth/verify-signup', {
    method: 'POST',
    body: JSON.stringify(body),
    skipAuthRefresh: true,
  });
}

export async function authRefresh(): Promise<
  ApiResult<{ accessToken: string; user: AuthUser }>
> {
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return { success: false, error: 'Session expired. Please login again.' };
  }
  return {
    success: true,
    data: {
      accessToken: refreshed.accessToken,
      user: refreshed.user,
    },
  };
}

export async function authLogout(
  accessToken?: string | null,
): Promise<ApiResult<{ success: true; message: string }>> {
  return apiFetch<{ success: true; message: string }>('/api/auth/logout', {
    method: 'POST',
    skipAuthRefresh: true,
    accessToken,
  });
}

export async function authMe(
  accessToken?: string | null,
): Promise<ApiResult<AuthUser>> {
  return apiFetch<AuthUser>('/api/auth/me', { accessToken });
}

export async function authForgotPasswordRequest(
  body: Record<string, unknown>,
): Promise<ApiResult<void>> {
  return apiFetch<void>('/api/auth/forgot-password/request', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function authForgotPasswordReset(
  body: Record<string, unknown>,
): Promise<ApiResult<void>> {
  return apiFetch<void>('/api/auth/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function authChangePasswordRequestOtp(
  accessToken?: string | null,
): Promise<ApiResult<void>> {
  return apiFetch<void>('/api/auth/change-password/request-otp', {
    method: 'POST',
    accessToken,
  });
}

export async function authChangePasswordConfirm(
  body: Record<string, unknown>,
  accessToken?: string | null,
): Promise<ApiResult<void>> {
  return apiFetch<void>('/api/auth/change-password/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
    accessToken,
  });
}

// Config
export async function getPublicConfig(): Promise<
  ApiResult<{ adminWhatsappE164: string }>
> {
  return apiFetch<{ adminWhatsappE164: string }>('/api/config/public');
}

// Wallet & transactions
export async function getWallet(
  accessToken?: string | null,
): Promise<ApiResult<{ balancePkr: number }>> {
  return apiFetch<{ balancePkr: number }>('/api/wallet', { accessToken });
}

export async function getTransactions(
  query: string,
  accessToken?: string | null,
): Promise<ApiResult<{ items: unknown[]; total: number }>> {
  return apiFetch<{ items: unknown[]; total: number }>(
    `/api/transactions?${query}`,
    { accessToken },
  );
}

// Numbers & OTP
export async function getActiveNumber(
  accessToken?: string | null,
): Promise<ApiResult<unknown>> {
  return apiFetch<unknown>('/api/numbers/active', { accessToken });
}

export async function acquireNumber(
  body: Record<string, unknown>,
  accessToken?: string | null,
): Promise<ApiResult<unknown>> {
  return apiFetch<unknown>('/api/numbers/acquire', {
    method: 'POST',
    body: JSON.stringify(body),
    accessToken,
  });
}

export async function releaseNumber(
  accessToken?: string | null,
): Promise<ApiResult<{ refunded?: boolean; refundAmountPkr?: number | null }>> {
  return apiFetch<{ refunded?: boolean; refundAmountPkr?: number | null }>(
    '/api/numbers/release',
    {
      method: 'POST',
      accessToken,
    },
  );
}

export async function changeNumber(
  body: Record<string, unknown>,
  accessToken?: string | null,
): Promise<ApiResult<unknown>> {
  return apiFetch<unknown>('/api/numbers/change', {
    method: 'POST',
    body: JSON.stringify(body),
    accessToken,
  });
}

export async function pollOtp(
  number: string,
  accessToken?: string | null,
): Promise<ApiResult<{ status: string; otp?: string }>> {
  return apiFetch<{ status: string; otp?: string }>(
    `/api/otp/poll?number=${encodeURIComponent(number)}`,
    { accessToken, disableDedupe: true },
  );
}

export async function getOtpHistory(
  query: string,
  accessToken?: string | null,
): Promise<ApiResult<{ items: unknown[]; total: number }>> {
  return apiFetch<{ items: unknown[]; total: number }>(
    `/api/otp/history?${query}`,
    { accessToken },
  );
}

// Admin
export async function getAdminStats(
  accessToken?: string | null,
  refresh = false,
): Promise<ApiResult<unknown>> {
  const path = refresh ? '/api/manage/stats?refresh=true' : '/api/manage/stats';
  return apiFetch<unknown>(path, { accessToken, disableDedupe: refresh });
}
