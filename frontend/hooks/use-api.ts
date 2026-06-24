import useSWR, { SWRConfiguration } from "swr";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useApi<T>(
  path: string | null,
  options?: SWRConfiguration & { disableDedupe?: boolean; cacheTtlMs?: number }
) {
  const token = useAuthStore((s) => s.token);
  
  const fetcher = async (url: string) => {
    const res = await apiFetch<T>(url, {
      accessToken: token,
      disableDedupe: options?.disableDedupe,
      cacheTtlMs: options?.cacheTtlMs,
    });

    if (!res.success) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`API request failed for ${url}:`, res.error);
      }
      // Throw so SWR keeps previous data during background revalidation.
      throw new Error(res.error);
    }

    return res.data;
  };

  const key = path && token ? path : null;

  return useSWR<T, Error>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    revalidateOnMount: true,
    keepPreviousData: true,
    dedupingInterval: 2000,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    ...options,
  });
}
