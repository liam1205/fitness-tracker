import * as React from "react";
import { useTranslation } from "react-i18next";

import { useListExercises } from "@/api/endpoints/exercises/exercises";
import { useCreateWorkoutTemplate } from "@/api/endpoints/workout-templates/workout-templates";
import type { WorkoutTemplateCreate } from "@/api/model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-modal";
import { toastError } from "@/lib/errors";
import { Separator } from "@/components/ui/separator";
import {
  ExerciseRowsEditor,
  groupExercisesByMuscleGroup,
  type TemplateExerciseRow,
} from "@/components/views/modals/TemplateExerciseRows";
import { Save } from "lucide-react";

export interface CreateTemplateHandle {
  /** Builds the create payload, or null if the form isn't valid yet. */
  getPayload: () => WorkoutTemplateCreate | null;
}

/**
 * Modal for creating a new workout template.
 */
export function useCreateTemplateModal() {
  const { t } = useTranslation();
  const { openModal, closeModal } = useModal();
  const { mutate: createWorkoutTemplate } = useCreateWorkoutTemplate();

  function openCreateTemplateModal() {
    const formRef = React.createRef<CreateTemplateHandle>();

    function handleSave() {
      const payload = formRef.current?.getPayload();
      if (!payload) return;

      createWorkoutTemplate(
        { data: payload },
        { onSuccess: () => closeModal() },
      );
    }

    openModal({
      title: t("templates.createModal.title"),
      subtitle: t("templates.createModal.subtitle"),
      content: <CreateTemplate ref={formRef}></CreateTemplate>,
      rightButtons: [
        {
          icon: <Save></Save>,
          label: t("common.actions.save"),
          onClick: handleSave,
        },
      ],
    });
  }

  return { openCreateTemplateModal };
}

const CreateTemplate = ({ ref }: { ref?: React.Ref<CreateTemplateHandle> }) => {
  const { t } = useTranslation();
  const { data } = useListExercises({ page: 1, page_size: 100 });
  const exercises = data?.items ?? [];
  const groupedExercises = React.useMemo(
    () => groupExercisesByMuscleGroup(exercises),
    [exercises],
  );
  const [name, setName] = React.useState("");
  const [rows, setRows] = React.useState<TemplateExerciseRow[]>([]);
  // Portal comboboxes into this container rather than document.body: the
  // Dialog sets `pointer-events: none` on the body while open and only
  // re-enables it on its own subtree, so a body-level portal is unclickable.
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    getPayload: () => {
      const trimmedName = name.trim();
      const validExercises = rows.flatMap((row) => {
        const setCount = Number(row.sets);
        if (!row.exercise || !Number.isInteger(setCount) || setCount <= 0) {
          return [];
        }
        return [{ exercise_id: row.exercise.id, set_count: setCount }];
      });

      if (!trimmedName || validExercises.length === 0) {
        toastError(
          null,
          !trimmedName && validExercises.length === 0
            ? t("templates.validation.missingNameAndExercise")
            : !trimmedName
              ? t("templates.validation.missingName")
              : t("templates.validation.missingExercise"),
        );
        return null;
      }

      return { name: trimmedName, exercises: validExercises };
    },
  }));

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-name-input">{t("common.fields.name")}</Label>
        <Input
          id="template-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        ></Input>
      </div>
      <Separator></Separator>
      <ExerciseRowsEditor
        rows={rows}
        onRowsChange={setRows}
        groupedExercises={groupedExercises}
        containerRef={containerRef}
      />
    </div>
  );
};
