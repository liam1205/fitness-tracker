import { useSyncExternalStore } from 'react'
import {
  login as loginRequest,
  logout as logoutRequest,
  readCurrentUser,
  register as registerRequest,
} from '@/api/endpoints/auth/auth'
import type { UserRead } from '@/api/model'
import { getErrorMessage } from '@/lib/errors'

/**
 * Cookie-backed auth store.
 *
 * The session lives entirely in an HttpOnly cookie set by the backend — it is
 * invisible to JavaScript (XSS-safe), so this store never holds a token. It only
 * mirrors "who is signed in" for the router guards and UI. The source of truth is
 * the backend: `bootstrap()` asks `GET /auth/me` on startup to restore a session
 * after a refresh, and `login`/`signup`/`logout` hit the backend then update state.
 */

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  /** Convenience display name ("First Last"), trimmed. */
  name: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
}

function toUser(dto: UserRead): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    name: `${dto.first_name} ${dto.last_name}`.trim() || dto.email,
  }
}

let state: AuthState = {
  isAuthenticated: false,
  user: null,
}

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function setUser(dto: UserRead) {
  state = { isAuthenticated: true, user: toUser(dto) }
  emit()
}

function clear() {
  state = { isAuthenticated: false, user: null }
  emit()
}

export const auth = {
  get state() {
    return state
  },
  get isAuthenticated() {
    return state.isAuthenticated
  },
  get user() {
    return state.user
  },

  /**
   * Restore an existing session on app startup. Resolves whether or not a
   * session exists — a 401 simply means "not signed in". Must complete before
   * the router runs its guards (see `main.tsx`).
   */
  async bootstrap(): Promise<void> {
    try {
      setUser(await readCurrentUser())
    } catch {
      clear()
    }
  },

  async login(email: string, password: string): Promise<void> {
    try {
      setUser(await loginRequest({ email, password }))
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Sign in failed.'))
    }
  },

  async signup(params: {
    firstName: string
    lastName: string
    email: string
    password: string
  }): Promise<void> {
    try {
      setUser(
        await registerRequest({
          email: params.email,
          password: params.password,
          first_name: params.firstName,
          last_name: params.lastName,
        }),
      )
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Sign up failed.'))
    }
  },

  /**
   * Ends the session. The local state is cleared either way — if the backend
   * call fails the user is still signed out here — but the error is rethrown so
   * the caller can report that the server may still hold the session.
   */
  async logout(): Promise<void> {
    try {
      await logoutRequest()
    } catch (err) {
      throw new Error(getErrorMessage(err, 'Log out failed.'))
    } finally {
      clear()
    }
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

/** React hook for components that need to render based on auth state. */
export function useAuth(): AuthState {
  return useSyncExternalStore(auth.subscribe, () => auth.state)
}
