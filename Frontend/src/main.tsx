import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { auth } from '@/lib/auth'
import { toastError } from '@/lib/errors'
import { routeTree } from './routeTree.gen'
import './index.css'

/**
 * Every query and mutation failure lands here, so no API error can fail
 * silently. Components that want bespoke handling can still catch it themselves.
 */
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => toastError(error, 'Something went wrong loading data.'),
  }),
  mutationCache: new MutationCache({
    onError: (error) => toastError(error, 'Something went wrong.'),
  }),
})

const router = createRouter({
  routeTree,
  context: { auth },
  defaultPreload: 'intent',
})

// Register the router instance for full type-safety on <Link>, params, etc.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Restore any existing session (from the HttpOnly cookie) before the first
// render, so the router's auth guards see the correct state on a hard refresh.
void auth.bootstrap().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
