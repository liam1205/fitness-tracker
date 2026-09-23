import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

function Home() {
  const { user } = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight">
        Welcome{user ? `, ${user.name}` : ''}
      </h1>
      <p className="text-muted-foreground">
        You're signed in. The whole app is gated behind authentication — the
        sign-in screen is all an unauthenticated visitor can reach.
      </p>
    </div>
  )
}
