import { createFileRoute } from '@tanstack/react-router'
import { Exercises } from '@/components/views/exercises/Exercises'

export const Route = createFileRoute('/_authenticated/exercises')({
  component: Exercises,
})
