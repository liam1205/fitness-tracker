import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  getListExercisesQueryKey,
  useDeleteExercise,
  useUpdateExercise,
} from "@/api/endpoints/exercises/exercises";
import type { ExerciseRead } from "@/api/model";
import {
  ExerciseForm,
  type ExerciseFormHandle,
} from "@/components/views/modals/ExerciseForm";
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
    const formRef = React.createRef<ExerciseFormHandle>();

    function handleSave() {
      const payload = formRef.current?.getPayload();
      if (!payload) return;

      updateExercise(
        { exerciseId: exercise.id, data: payload },
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
      content: <ExerciseForm ref={formRef} exercise={exercise}></ExerciseForm>,
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
