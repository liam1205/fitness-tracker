import {
  getGetWorkoutSessionQueryKey,
  getListActiveWorkoutSessionsQueryKey,
  getListCompletedWorkoutSessionsQueryKey,
  useGetWorkoutSession,
  useUpdateWorkoutSession,
} from "@/api/endpoints/workout-sessions/workout-sessions";
import { useQueryClient } from "@tanstack/react-query";
import { toastError } from "@/lib/errors";
import type { WorkoutSessionRead } from "@/api/model/workoutSessionRead";
import { useParams } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionSetRead } from "@/api/model/sessionSetRead";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import {
  Check,
  CheckIcon,
  CircleDashed,
  Pause,
  Play,
  Square,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import {
  canCompleteSession,
  useSessionControls,
} from "@/hooks/use-session-controls";
import { CompleteBlockedTooltip } from "@/components/views/workout/CompleteBlockedTooltip";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Workout = () => {
  const { t } = useTranslation();
  const { workoutId: sessionId } = useParams({
    from: "/_authenticated/workouts/$workoutId",
  });
  const { data } = useGetWorkoutSession(sessionId);
  const [time, setTime] = useState(0);
  const {
    pause,
    resume,
    complete,
    isPending: isControlPending,
  } = useSessionControls();
  const queryClient = useQueryClient();
  const sessionQueryKey = getGetWorkoutSessionQueryKey(sessionId);

  // Sets are persisted by resending the session's full exercise list, which
  // the backend replaces wholesale (and re-ids). Only one request may be in
  // flight at a time, otherwise two rapid toggles would each be built from
  // the same stale list and the second would undo the first.
  const { mutate: updateWorkoutSession, isPending } = useUpdateWorkoutSession({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(sessionQueryKey, updated);
        queryClient.invalidateQueries({
          queryKey: getListActiveWorkoutSessionsQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getListCompletedWorkoutSessionsQueryKey(),
        });
      },
      onError: (err) => {
        toastError(err, t("workout.errors.saveSet"));
        // Drop the optimistic change and show what the server actually has.
        queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      },
    },
  });

  const saveSet = (exerciseId: string, setId: string, values: SetValues) => {
    if (!data) return;
    const exercises = data.exercises.map((exercise) => ({
      exercise_id: exercise.exercise_id,
      sets: exercise.sets.map((s) => ({
        reps: s.reps,
        weight: s.weight,
        completed: s.completed,
        ...(exercise.id === exerciseId && s.id === setId ? values : {}),
      })),
    }));

    // Optimistic: reflect the change immediately, the response replaces it.
    queryClient.setQueryData<WorkoutSessionRead>(sessionQueryKey, {
      ...data,
      exercises: data.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((s) =>
          exercise.id === exerciseId && s.id === setId
            ? { ...s, ...values }
            : s,
        ),
      })),
    });
    updateWorkoutSession({ sessionId, data: { exercises } });
  };

  // The server reports the net time (pauses excluded) as of the last fetch.
  // While running, tick on top of that; when paused or finished it stands
  // still. The effect re-anchors whenever a response brings a new value.
  const activeSeconds = data?.active_seconds;
  const isPaused = data?.is_paused;
  const isCompleted = !!data?.completed_at;
  useEffect(() => {
    if (activeSeconds === undefined) {
      setTime(0);
      return;
    }

    if (isCompleted || isPaused) {
      setTime(activeSeconds);
      return;
    }

    const anchor = Date.now();
    const update = () =>
      setTime(activeSeconds + Math.floor((Date.now() - anchor) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeSeconds, isPaused, isCompleted]);

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight flex flex-row justify-between items-center">
        {data?.template_name}
        <div className="flex flex-row justify-end items-center gap-2">
          {data && !data.completed_at && (
            <Button
              className="font-normal"
              variant={"outline"}
              disabled={isControlPending}
              onClick={() =>
                data.is_paused ? resume(data.id) : pause(data.id)
              }
            >
              {data.is_paused ? <Play></Play> : <Pause></Pause>}
              {data.is_paused ? t("workout.resume") : t("workout.pause")}
            </Button>
          )}
          {data && !data.completed_at && (
            <CompleteBlockedTooltip blocked={!canCompleteSession(data)}>
              <Button
                className="font-normal"
                variant={"secondary"}
                onClick={() => complete(data)}
                disabled={isControlPending || !canCompleteSession(data)}
              >
                <Square></Square>
                {t("workout.complete")}
              </Button>
            </CompleteBlockedTooltip>
          )}
          <Badge
            variant={data?.is_paused ? "secondary" : "default"}
            className="w-20"
          >
            {formatDuration(time)}
          </Badge>
        </div>
      </h1>
      <div className="flex flex-col gap-3">
        {data?.exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader>
              <CardTitle className="flex flex-row justify-between">
                {exercise.name}
                {exercise.sets.filter((set) => set.completed === true)
                  .length === exercise.sets.length && (
                  <CheckIcon className="text-success"></CheckIcon>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {exercise.sets.map((set) => (
                // Keyed by set_number, not id: ids change on every save, and
                // a changing key would remount the row and wipe its inputs.
                <Set
                  key={set.set_number}
                  set={set}
                  disabled={isPending}
                  onSave={(values) => saveSet(exercise.id, set.id, values)}
                ></Set>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

type SetValues = {
  reps: number | null;
  weight: string | null;
  completed: boolean;
};

type SetProps = {
  set: SessionSetRead;
  disabled: boolean;
  onSave: (values: SetValues) => void;
};

const Set = ({ set, disabled, onSave }: SetProps) => {
  const { t } = useTranslation();
  const [weight, setWeight] = useState(set.weight?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");

  // Set once the user tries to complete the set with missing values, so the
  // empty inputs are only flagged after an attempt rather than on load.
  const [attempted, setAttempted] = useState(false);
  const parsedReps = Number.parseInt(reps, 10);
  const parsedWeight = Number.parseFloat(weight);
  const weightEmpty = weight.trim() === "";
  const weightInvalid = attempted && !weightEmpty && Number.isNaN(parsedWeight);
  const repsInvalid = attempted && Number.isNaN(parsedReps);

  // Weight and reps are saved along with the completion toggle, so the
  // values typed in are what gets persisted when the set is marked done.
  // A set can only be marked done once reps are filled in and the weight is
  // either empty (defaults to 0) or a valid number; un-marking is always allowed.
  const toggle = (completed: boolean) => {
    if (
      completed &&
      (Number.isNaN(parsedReps) || (!weightEmpty && Number.isNaN(parsedWeight)))
    ) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    onSave({
      reps: Number.isNaN(parsedReps) ? null : parsedReps,
      weight: weightEmpty ? (completed ? "0" : null) : weight.trim(),
      completed,
    });
  };

  return (
    <div className="flex flex-row justify-between px-3 items-center">
      <div className="flex flex-row w-1/15">{set.set_number}</div>
      <div className="flex items-center gap-2 w-14/15">
        <Input
          placeholder={t("common.fields.weight")}
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          aria-invalid={weightInvalid}
          className="w-fit"
        ></Input>
        <Input
          placeholder={t("common.fields.reps")}
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          required
          aria-invalid={repsInvalid}
          className="w-fit"
        ></Input>
        <Toggle
          pressed={set.completed}
          onPressedChange={toggle}
          disabled={disabled}
          className={cn("w-4")}
        >
          {set.completed ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <CircleDashed className="h-4 w-4" />
          )}
        </Toggle>
      </div>
    </div>
  );
};

export default Workout;
