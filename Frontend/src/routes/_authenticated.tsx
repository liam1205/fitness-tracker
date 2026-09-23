import { createFileRoute, redirect } from '@tanstack/react-router'
import { PageLayout } from '@/components/views/main/PageLayout'

/**
 * Pathless layout route: the `_authenticated` prefix groups protected routes
 * without adding a `/authenticated` URL segment. Its `beforeLoad` runs before
 * any child route (or its data) renders, so unauthenticated users are bounced
 * to `/login` — carrying where they were headed in `?redirect=`.
 *
 * Everything past the guard is wrapped in `PageLayout`, so child routes render
 * page content only.
 */
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: PageLayout,
})
