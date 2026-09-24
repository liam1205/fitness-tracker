import { useQueryClient } from "@tanstack/react-query";

import { getListExercisesQueryKey, useCreateExercise } from "@/api/endpoints";
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
 * Modal for creating a new exercise.
 */
export function useCreateExerciseModal() {
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();
  const { mutate: createExercise } = useCreateExercise();

  function openCreateExerciseModal() {
    let name = "";
    let muscleGroup: MuscleGroup | undefined;

    function handleSave() {
      if (!name || !muscleGroup) {
        return;
      }

      createExercise(
        { data: { name, muscle_group: muscleGroup } },
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
      title: "Create exercise",
      subtitle: "Add a new exercise to your library.",
      content: (
        <div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="name-input">Name</Label>
            <Input
              id="name-input"
              defaultValue={name}
              onChange={(event) => {
                name = event.target.value;
              }}
            ></Input>
            <Label htmlFor="muscle-group-input">Muscle Group</Label>
            <Select
              defaultValue={muscleGroup}
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
          label: "Save",
          onClick: handleSave,
        },
      ],
    });
  }

  return { openCreateExerciseModal };
}
