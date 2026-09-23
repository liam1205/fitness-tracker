import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'

/** Values made available to every route's `beforeLoad`/`loader` via `context`. */
export interface RouterContext {
  auth: typeof auth
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundary,
})

/**
 * The root renders nothing but the matched route: unauthenticated visitors get
 * the full-screen sign-in screen, and every protected page brings its own chrome
 * via `PageLayout`.
 */
function RootLayout() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">This page could not be found.</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}

function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        {error.message}
      </p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </div>
  )
}
