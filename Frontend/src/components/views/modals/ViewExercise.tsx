import { useQueryClient } from "@tanstack/react-query";

import {
  getListExercisesQueryKey,
  useDeleteExercise,
  useUpdateExercise,
} from "@/api/endpoints";
import type { ExerciseRead } from "@/api/model";
import { MuscleGroup } from "@/api/model/muscleGroup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModal } from "@/hooks/use-modal";

/**
 * Modal for viewing and editing an existing exercise.
 */
export function useViewExerciseModal() {
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();
  const { mutate: updateExercise } = useUpdateExercise();
  const { mutate: deleteExercise } = useDeleteExercise();

  function openViewExerciseModal(exercise: ExerciseRead) {
    let name = exercise.name;
    let muscleGroup = exercise.muscle_group;

    function handleSave() {
      updateExercise(
        { exerciseId: exercise.id, data: { name, muscle_group: muscleGroup } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListExercisesQueryKey(),
            });
            closeModal();
          },
        },
      );
    }

    function handleDelete() {
      deleteExercise(
        { exerciseId: exercise.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListExercisesQueryKey(),
            });
            closeModal();
          },
        },
      );
    }

    openModal({
      title: "Exercise",
      subtitle: "Modify this exercise",
      content: (
        <div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="name-input">Name</Label>
            <Input
              id="name-input"
              defaultValue={exercise.name}
              onChange={(event) => {
                name = event.target.value;
              }}
            ></Input>
            <Label htmlFor="muscle-group-input">Muscle Group</Label>
            <Select
              defaultValue={exercise.muscle_group}
              onValueChange={(value) => {
                muscleGroup = value as MuscleGroup;
              }}
            >
              <SelectTrigger id="muscle-group-input" className="w-full">
                <SelectValue placeholder="Select a muscle group" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MuscleGroup).map((muscleGroupOption) => (
                  <SelectItem key={muscleGroupOption} value={muscleGroupOption}>
                    {muscleGroupOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      rightButtons: [
        {
          label: "Delete",
          onClick: handleDelete,
          variant: "destructive",
        },
        {
          label: "Save",
          onClick: handleSave,
        },
      ],
    });
  }

  return { openViewExerciseModal };
}
