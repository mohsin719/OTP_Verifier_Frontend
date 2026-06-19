import useSWR, { SWRConfiguration } from "swr";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useApi<T>(
  path: string | null,
  options?: SWRConfiguration & { disableDedupe?: boolean; cacheTtlMs?: number }
) {
  const token = useAuthStore((s) => s.token);
  
  const fetcher = async (url: string) => {
    try {
      const res = await apiFetch<T>(url, {
        accessToken: token,
        disableDedupe: options?.disableDedupe,
        cacheTtlMs: options?.cacheTtlMs,
      });
      
      if (!res.success) {
        throw new Error(res.error);
      }
      
      return res.data;
    } catch (error) {
      console.error(`Fetch Error for ${url}:`, error);
      return null as T;
    }
  };

  const key = path && token ? path : null;

  return useSWR<T, Error>(key, fetcher, {
    revalidateOnFocus: false, // Don't revalidate every time window gets focus
    revalidateIfStale: true, // Do revalidate on mount if data is stale
    dedupingInterval: 2000,
    ...options,
  });
}
