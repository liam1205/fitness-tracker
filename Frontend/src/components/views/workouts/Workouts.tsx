import {
  Check,
  Eye,
  Loader,
  Play,
  Square,
  Timer,
  Trash,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStartWorkoutModal } from "@/components/views/modals/StartWorkoutModal";
import type { WorkoutSessionRead } from "@/api/model";
import { useListCompletedWorkoutSessions } from "@/api/endpoints/workout-sessions/workout-sessions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@tanstack/react-router";
import { dateString, timeSpentMin } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

/**
 * Logged workouts: the history of completed training sessions.
 */
export function Workouts() {
  const { openStartWorkoutModal } = useStartWorkoutModal();
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
        onClick={openStartWorkoutModal}
      >
        <Play />
        Start workout
      </Button>
    </div>
  );
}

type WorkoutProps = {
  session: WorkoutSessionRead;
};

const Workout = ({ session }: WorkoutProps) => {
  const router = useRouter();
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
      <CardFooter className="flex flex-row">
        <div className="flex flex-row items-center justify-start gap-4 text-sm w-5/7">
          <div className="flex flex-row justify-start items-center gap-2 text-sm">
            <Timer id="timer-icon" className="size-3.5" />
            <Label htmlFor="timer-icon">
              {timeSpentMin(started, completed)} min
            </Label>
          </div>
          {!session.completed_at ? (
            <Badge variant={"default"}>
              <Loader className="size-2.5"></Loader>Running
            </Badge>
          ) : (
            <Badge variant={"success"}>
              <Check className="size-2.5"></Check>Completed
            </Badge>
          )}
          <Button variant="destructive">
            <Trash className="size-2.5"></Trash> Delete
          </Button>
        </div>
        <div className="flex flex-row justify-end gap-2 text-sm w-2/7">
          {!session.completed_at && (
            <Button variant="outline">
              <Square className="size-2.5"></Square> Stop
            </Button>
          )}
          <Button
            variant="default"
            onClick={() =>
              router.navigate({
                to: "/workouts/$workoutId",
                params: { workoutId: session.id.toLocaleString() },
              })
            }
          >
            <Eye className="size-2.5"></Eye> View
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
