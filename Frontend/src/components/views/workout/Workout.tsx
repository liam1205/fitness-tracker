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
import { Check, CheckIcon, CircleDashed } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration, timeSpentSec } from "@/lib/utils";

const Workout = () => {
  const { workoutId: sessionId } = useParams({
    from: "/_authenticated/workouts/$workoutId",
  });
  const { data } = useGetWorkoutSession(sessionId);
  const [time, setTime] = useState(0);
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
        toastError(err, "Couldn't save the set.");
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

  useEffect(() => {
    if (!data?.started_at) {
      setTime(0);
      return;
    }

    const start = new Date(data.started_at);

    // Finished workout: show the final duration and don't tick.
    if (data.completed_at) {
      setTime(timeSpentSec(start, new Date(data.completed_at)));
      return;
    }

    const update = () => setTime(timeSpentSec(start, new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [data?.started_at, data?.completed_at]);
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight flex flex-row justify-between items-center">
        {data?.template_name}
        <Badge className="w-20">{formatDuration(time)}</Badge>
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
  const [weight, setWeight] = useState(set.weight?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");

  // Set once the user tries to complete the set with missing values, so the
  // empty inputs are only flagged after an attempt rather than on load.
  const [attempted, setAttempted] = useState(false);
  const parsedReps = Number.parseInt(reps, 10);
  const parsedWeight = Number.parseFloat(weight);
  const weightInvalid = attempted && Number.isNaN(parsedWeight);
  const repsInvalid = attempted && Number.isNaN(parsedReps);

  // Weight and reps are saved along with the completion toggle, so the
  // values typed in are what gets persisted when the set is marked done.
  // A set can only be marked done once both are filled in (otherwise the
  // empty inputs are flagged as required); un-marking is always allowed.
  const toggle = (completed: boolean) => {
    if (completed && (Number.isNaN(parsedWeight) || Number.isNaN(parsedReps))) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    onSave({
      reps: Number.isNaN(parsedReps) ? null : parsedReps,
      weight: weight.trim() === "" ? null : weight.trim(),
      completed,
    });
  };

  return (
    <div className="flex flex-row justify-between px-3 items-center">
      <div className="flex flex-row w-1/15">{set.set_number}</div>
      <div className="flex items-center gap-2 w-14/15">
        <Input
          placeholder="Weight"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
          aria-invalid={weightInvalid}
          className="w-fit"
        ></Input>
        <Input
          placeholder="Reps"
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
