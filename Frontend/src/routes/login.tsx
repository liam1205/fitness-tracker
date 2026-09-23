import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticationView } from '@/components/views/authenticiation/AuthenticationView'

export const Route = createFileRoute('/login')({
  // Type + sanitise the `?redirect=` search param the guard sends us.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect:
      typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  // Already signed in? Skip the auth screen entirely.
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' })
    }
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect: redirectTo } = Route.useSearch()
  return <AuthenticationView redirectTo={redirectTo} />
}
