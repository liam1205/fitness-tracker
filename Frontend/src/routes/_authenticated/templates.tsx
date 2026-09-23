import { createFileRoute } from '@tanstack/react-router'
import { Templates } from '@/components/views/templates/Templates'

export const Route = createFileRoute('/_authenticated/templates')({
  component: Templates,
})
