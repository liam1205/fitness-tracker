import Workout from "@/components/views/workout/Workout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workouts/$workoutId")({
  component: Workout,
});
