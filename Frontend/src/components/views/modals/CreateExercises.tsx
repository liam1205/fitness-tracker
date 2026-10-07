import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  getListExercisesQueryKey,
  useCreateExercise,
} from "@/api/endpoints/exercises/exercises";
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
import { Save } from "lucide-react";

/**
 * Modal for creating a new exercise.
 */
export function useCreateExerciseModal() {
  const { t } = useTranslation();
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
      title: t("exercises.createModal.title"),
      subtitle: t("exercises.createModal.subtitle"),
      content: (
        <div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="name-input">{t("common.fields.name")}</Label>
            <Input
              id="name-input"
              defaultValue={name}
              onChange={(event) => {
                name = event.target.value;
              }}
            ></Input>
            <Label htmlFor="muscle-group-input">
              {t("common.fields.muscleGroup")}
            </Label>
            <Select
              defaultValue={muscleGroup}
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
          icon: <Save></Save>,
          label: t("common.actions.save"),
          onClick: handleSave,
        },
      ],
    });
  }

  return { openCreateExerciseModal };
}
