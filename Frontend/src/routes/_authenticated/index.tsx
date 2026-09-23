import { createFileRoute } from '@tanstack/react-router'
import { Home } from '@/components/views/home/Home'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})
