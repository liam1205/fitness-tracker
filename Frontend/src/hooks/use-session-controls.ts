import { useQueryClient } from "@tanstack/react-query";
import {
  getGetWorkoutSessionQueryKey,
  getListActiveWorkoutSessionsQueryKey,
  getListCompletedWorkoutSessionsQueryKey,
  useCompleteWorkoutSession,
  usePauseWorkoutSession,
  useResumeWorkoutSession,
} from "@/api/endpoints/workout-sessions/workout-sessions";
import type { WorkoutSessionRead } from "@/api/model/workoutSessionRead";
import { toastError } from "@/lib/errors";
import { useTranslation } from "react-i18next";

/** A session can only be completed once every set of every exercise is done. */
export function canCompleteSession(
  session: Pick<WorkoutSessionRead, "exercises">,
) {
  return session.exercises.every((exercise) =>
    exercise.sets.every((set) => set.completed),
  );
}

/**
 * Pause, resume and complete for workout sessions, with the cache upkeep each
 * of them needs. The server rejects completing a paused session, so `complete`
 * resumes it first.
 */
export function useSessionControls() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pauseMutation = usePauseWorkoutSession();
  const resumeMutation = useResumeWorkoutSession();
  const completeMutation = useCompleteWorkoutSession();

  const sync = (session: WorkoutSessionRead) => {
    queryClient.setQueryData(getGetWorkoutSessionQueryKey(session.id), session);
    queryClient.invalidateQueries({
      queryKey: getListActiveWorkoutSessionsQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getListCompletedWorkoutSessionsQueryKey(),
    });
  };

  const run = async (
    sessionId: string,
    action: () => Promise<WorkoutSessionRead>,
    failure: string,
  ) => {
    try {
      sync(await action());
    } catch (err) {
      toastError(err, failure);
      // Show what the server actually has, e.g. when it was already paused.
      queryClient.invalidateQueries({
        queryKey: getGetWorkoutSessionQueryKey(sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: getListActiveWorkoutSessionsQueryKey(),
      });
    }
  };

  const pause = (sessionId: string) =>
    run(
      sessionId,
      () => pauseMutation.mutateAsync({ sessionId }),
      t("workout.errors.pause"),
    );

  const resume = (sessionId: string) =>
    run(
      sessionId,
      () => resumeMutation.mutateAsync({ sessionId }),
      t("workout.errors.resume"),
    );

  const complete = (session: Pick<WorkoutSessionRead, "id" | "is_paused">) =>
    run(
      session.id,
      async () => {
        if (session.is_paused) {
          await resumeMutation.mutateAsync({ sessionId: session.id });
        }
        return completeMutation.mutateAsync({ sessionId: session.id });
      },
      t("workout.errors.complete"),
    );

  const isPending =
    pauseMutation.isPending ||
    resumeMutation.isPending ||
    completeMutation.isPending;

  return { pause, resume, complete, isPending };
}
