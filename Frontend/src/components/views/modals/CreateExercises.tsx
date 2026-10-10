import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  getListExercisesQueryKey,
  useCreateExercise,
} from "@/api/endpoints/exercises/exercises";
import {
  ExerciseForm,
  type ExerciseFormHandle,
} from "@/components/views/modals/ExerciseForm";
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
    const formRef = React.createRef<ExerciseFormHandle>();

    function handleSave() {
      const payload = formRef.current?.getPayload();
      if (!payload) return;

      createExercise(
        { data: payload },
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
      content: <ExerciseForm ref={formRef}></ExerciseForm>,
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
