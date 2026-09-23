import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateExerciseModal } from "@/components/views/modals/CreateExercises";
import { useListExercises } from "@/api/endpoints";
import { Card, CardContent } from "@/components/ui/card";
import { useViewExerciseModal } from "../modals/ViewExercise";
import type { ExerciseRead } from "@/api/model";

/**
 * Exercise library: the catalog of exercises a user can add to templates and workouts.
 */
export function Exercises() {
  const { openCreateExerciseModal } = useCreateExerciseModal();
  const { data } = useListExercises({ page: 1, page_size: 100 });
  const { openViewExerciseModal } = useViewExerciseModal();

  const groupedExercises = (data?.items ?? []).reduce<
    Record<string, ExerciseRead[]>
  >((groups, exercise) => {
    (groups[exercise.muscle_group] ??= []).push(exercise);
    return groups;
  }, {});

  return (
    <div className="space-y-4  pb-12">
      <h1 className="text-4xl font-bold tracking-tight">Exercises</h1>
      <div className="flex flex-col gap-6">
        {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
          <div key={muscleGroup} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {muscleGroup}
            </h2>
            {exercises.map((exercise) => (
              <Card
                key={exercise.id}
                size="sm"
                className="hover:bg-background hover:cursor-pointer active:bg-background"
                onClick={() => openViewExerciseModal(exercise)}
              >
                <CardContent className="flex flex-row items-center gap-3">
                  <div className="flex justify-center items-center text-2xl font-bold text-background size-12 bg-foreground rounded-xl shrink-0">
                    {exercise.name.substring(0, 1)}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{exercise.name}</p>
                    <p className="font-light text-muted-foreground">
                      {exercise.muscle_group}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={openCreateExerciseModal}
      >
        <Plus />
        Create exercise
      </Button>
    </div>
  );
}
