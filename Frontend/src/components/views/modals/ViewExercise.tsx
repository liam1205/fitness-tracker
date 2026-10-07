import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  getListExercisesQueryKey,
  useDeleteExercise,
  useUpdateExercise,
} from "@/api/endpoints/exercises/exercises";
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
import { Save, Trash } from "lucide-react";

/**
 * Modal for viewing and editing an existing exercise.
 */
export function useViewExerciseModal() {
  const { t } = useTranslation();
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
      title: t("exercises.viewModal.title"),
      subtitle: t("exercises.viewModal.subtitle"),
      content: (
        <div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="name-input">{t("common.fields.name")}</Label>
            <Input
              id="name-input"
              defaultValue={exercise.name}
              onChange={(event) => {
                name = event.target.value;
              }}
            ></Input>
            <Label htmlFor="muscle-group-input">
              {t("common.fields.muscleGroup")}
            </Label>
            <Select
              defaultValue={exercise.muscle_group}
              onValueChange={(value) => {
                muscleGroup = value as MuscleGroup;
              }}
            >
              <SelectTrigger id="muscle-group-input" className="w-full">
                <SelectValue
                  placeholder={t("common.fields.selectMuscleGroup")}
                />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MuscleGroup).map((muscleGroupOption) => (
                  <SelectItem key={muscleGroupOption} value={muscleGroupOption}>
                    {t(`common.muscleGroups.${muscleGroupOption}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      rightButtons: [
        {
          icon: <Trash></Trash>,
          label: t("common.actions.delete"),
          onClick: handleDelete,
          variant: "destructive",
        },
        {
          icon: <Save></Save>,
          label: t("common.actions.save"),
          onClick: handleSave,
        },
      ],
    });
  }

  return { openViewExerciseModal };
}
