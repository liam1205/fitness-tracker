import { isAxiosError } from 'axios'
import { toast } from 'sonner'

/**
 * Turn anything thrown — an axios failure, an `Error`, a stray string — into a
 * human-readable message.
 *
 * FastAPI puts the useful part in `detail`: a plain string for our explicit
 * errors (401/409) and an array of `{loc, msg}` for 422 validation failures.
 * Both are flattened here so callers never have to know the shape.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string' && detail) return detail
    if (Array.isArray(detail)) {
      const msg = detail
        .map((d) => {
          const field = Array.isArray(d?.loc) ? d.loc[d.loc.length - 1] : undefined
          return field ? `${field}: ${d.msg}` : d.msg
        })
        .filter(Boolean)
        .join('; ')
      if (msg) return msg
    }
    // No body to read from: the request never reached the backend.
    if (!err.response) return 'Could not reach the server. Check your connection.'
  }
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err) return err
  return fallback
}

/**
 * Normalise an unknown error and surface it as a toast. Errors get longer on
 * screen than Sonner's 4s default — they carry more to read than a "Saved!" and
 * are usually the thing the user has to act on.
 */
export function toastError(err: unknown, fallback: string): void {
  toast.error(getErrorMessage(err, fallback), { duration: 6000 })
}
