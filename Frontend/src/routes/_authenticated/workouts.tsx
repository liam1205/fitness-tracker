import { createFileRoute } from '@tanstack/react-router'
import { Workouts } from '@/components/views/workouts/Workouts'

export const Route = createFileRoute('/_authenticated/workouts')({
  component: Workouts,
})
