import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

/**
 * Shared axios instance used by the orval-generated API client.
 *
 * Base URL comes from `VITE_API_URL` (see `.env`). Left empty, requests go to
 * relative paths on the page's own origin, so in dev they're picked up by the
 * Vite proxy (see `vite.config.ts`) instead of hitting the backend
 * cross-origin — this keeps the session cookie same-site. `withCredentials`
 * makes the browser send/store the backend's HttpOnly session cookie — the
 * basis of the cookie-based auth in `@/lib/auth`.
 */
export const apiClient = Axios.create({
  baseURL: import.meta.env.VITE_API_URL || undefined,
  withCredentials: true,
})

/**
 * The mutator orval calls for every operation. Returns `response.data` so the
 * generated hooks expose the response body directly (e.g. `data` is `UserRead[]`).
 */
export const customInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> => {
  // `signal` is forwarded by orval in `config`, so TanStack Query cancellation
  // works via axios' AbortSignal support — no manual CancelToken needed.
  return apiClient({ ...config, ...options }).then(({ data }) => data)
}

// Error type surfaced to hooks (`error` in useQuery/useMutation) on failure.
export type ErrorType<Error> = AxiosError<Error>
