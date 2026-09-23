import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios'

/**
 * Shared axios instance used by the orval-generated API client.
 *
 * Base URL comes from `VITE_API_URL` (see `.env`), falling back to the local
 * backend. `withCredentials` makes the browser send/store the backend's
 * HttpOnly session cookie on every (cross-origin) request — the basis of the
 * cookie-based auth in `@/lib/auth`.
 */
export const apiClient = Axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
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
