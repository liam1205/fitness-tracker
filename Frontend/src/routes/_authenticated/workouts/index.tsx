import { Workouts } from "@/components/views/workouts/Workouts";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workouts/")({
  component: Workouts,
});
