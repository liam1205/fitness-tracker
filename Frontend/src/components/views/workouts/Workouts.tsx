import { Plus, TimelineIcon, Timer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateWorkoutModal } from "@/components/views/modals/CreateWorkout";
import type { WorkoutSessionRead } from "@/api/model";
import { useListCompletedWorkoutSessions } from "@/api/endpoints";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Logged workouts: the history of completed training sessions.
 */
export function Workouts() {
  const { openCreateWorkoutModal } = useCreateWorkoutModal();
  const { data: workout_sessions } = useListCompletedWorkoutSessions();

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Workouts</h1>
      {workout_sessions?.map((session) => (
        <Workout session={session}></Workout>
      ))}
      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={openCreateWorkoutModal}
      >
        <Plus />
        Create workout
      </Button>
    </div>
  );
}

type WorkoutProps = {
  session: WorkoutSessionRead;
};

const Workout = ({ session }: WorkoutProps) => {
  const started = new Date(session.started_at);
  const completed = session.completed_at
    ? new Date(session.completed_at)
    : new Date();
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{session.template_name}</CardTitle>
        <CardDescription className="flex justify-start">
          Started on {dateString(started)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {session.exercises.map((exercise) => (
            <div className="flex flex-row items-center gap-1">
              {exercise.sets.length} <X className="size-2.5"></X>
              {exercise.name}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-row gap-2 text-sm">
        <Timer className="size-4" />
        {timeSpent(started, completed)} min
      </CardFooter>
    </Card>
  );
};

const dateString = (date: Date) => {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${day}. ${month} ${year} at ${hours}:${minutes}`;
};

const timeSpent = (startDate: Date, endDate: Date) => {
  return Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
};
