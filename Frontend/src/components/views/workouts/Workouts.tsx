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
import { useQueryClient } from "@tanstack/react-query";
import { useStartWorkoutModal } from "@/components/views/modals/StartWorkoutModal";
import type { WorkoutSessionRead } from "@/api/model";
import {
  getListActiveWorkoutSessionsQueryKey,
  getListCompletedWorkoutSessionsQueryKey,
  useDeleteWorkoutSession,
  useListActiveWorkoutSessions,
  useListCompletedWorkoutSessions,
} from "@/api/endpoints/workout-sessions/workout-sessions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@tanstack/react-router";
import { dateString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/lib/auth";
import EmptyIndicator from "../empty-indicator/EmptyIndicator";
import { Trans, useTranslation } from "react-i18next";

/**
 * Logged workouts: the history of completed training sessions.
 */
export function Workouts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openStartWorkoutModal } = useStartWorkoutModal();
  const { data: workoutSessionsCompleted } = useListCompletedWorkoutSessions();
  const { data: workoutSessionsNotCompleted } = useListActiveWorkoutSessions();

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">
        <Trans
          i18nKey="workouts.title"
          values={{ name: user?.firstName }}
          components={{
            highlight: (
              <span className="rounded-xl px-2 bg-foreground text-background" />
            ),
          }}
        />
      </h1>
      <Accordion type="single" defaultValue={"active"} collapsible>
        <AccordionItem value="active">
          <AccordionTrigger>{t("workouts.activeSessions")}</AccordionTrigger>
          <AccordionContent>
            {workoutSessionsNotCompleted?.length === 0 && (
              <EmptyIndicator
                message={<>{t("workouts.noActiveSessions")}</>}
              ></EmptyIndicator>
            )}
            {workoutSessionsNotCompleted?.map((session) => (
              <Workout session={session}></Workout>
            ))}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem key={"completed"} value={"completed"}>
          <AccordionTrigger>{t("workouts.completedSessions")}</AccordionTrigger>
          <AccordionContent>
            {workoutSessionsCompleted?.length === 0 && (
              <EmptyIndicator
                message={<>{t("workouts.noCompletedSessions")}</>}
              ></EmptyIndicator>
            )}
            {workoutSessionsCompleted?.map((session) => (
              <Workout session={session}></Workout>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={openStartWorkoutModal}
      >
        <Play />
        {t("workouts.startWorkout")}
      </Button>
    </div>
  );
}

type WorkoutProps = {
  session: WorkoutSessionRead;
};

const Workout = ({ session }: WorkoutProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: deleteWorkoutSession, isPending: isDeleting } =
    useDeleteWorkoutSession();
  const started = new Date(session.started_at);

  function handleDelete() {
    deleteWorkoutSession(
      { sessionId: session.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListCompletedWorkoutSessionsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListActiveWorkoutSessionsQueryKey(),
          });
        },
      },
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{session.template_name}</CardTitle>
        <CardDescription className="flex justify-start">
          {t("workouts.startedOn", { date: dateString(started) })}
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
              {t("workouts.durationMinutes", {
                minutes: Math.round(session.active_seconds / 60),
              })}
            </Label>
          </div>
          {!session.completed_at ? (
            <Badge variant={"default"}>
              <Loader className="size-2"></Loader>
              {t("workouts.status.running")}
            </Badge>
          ) : (
            <Badge variant={"success"}>
              <Check className="size-2"></Check>
              {t("workouts.status.completed")}
            </Badge>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash className="size-2.5"></Trash> {t("common.actions.delete")}
          </Button>
        </div>
        <div className="flex flex-row justify-end gap-2 text-sm w-2/7">
          {!session.completed_at && (
            <Button variant="outline">
              <Square className="size-2.5"></Square>{" "}
              {t("workouts.actions.stop")}
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
            <Eye className="size-2.5"></Eye> {t("workouts.actions.view")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
