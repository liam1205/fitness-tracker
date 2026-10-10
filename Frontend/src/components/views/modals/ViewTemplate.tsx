import * as React from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getListWorkoutTemplatesQueryKey,
  useUpdateWorkoutTemplate,
} from "@/api/endpoints/workout-templates/workout-templates";
import { useListExercises } from "@/api/endpoints/exercises/exercises";
import { useStartWorkoutSession } from "@/api/endpoints/workout-sessions/workout-sessions";
import type {
  MuscleGroup,
  WorkoutTemplateRead,
  WorkoutTemplateUpdate,
} from "@/api/model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useModal } from "@/hooks/use-modal";
import { toastError } from "@/lib/errors";
import {
  ExerciseRowsEditor,
  groupExercisesByMuscleGroup,
  type TemplateExerciseRow,
} from "@/components/views/modals/TemplateExerciseRows";
import { Info, Play, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export interface ViewTemplateHandle {
  /** Builds the update payload, or null if the form isn't valid yet. */
  getPayload: () => WorkoutTemplateUpdate | null;
}

/**
 * Modal for viewing and editing a workout template.
 */
export function useViewTemplateModal() {
  const { t } = useTranslation();
  const { openModal, closeModal } = useModal();
  const queryClient = useQueryClient();
  const { mutate: updateWorkoutTemplate } = useUpdateWorkoutTemplate();
  const { mutate: startWorkoutSession } = useStartWorkoutSession();

  function openViewTemplateModal(template: WorkoutTemplateRead) {
    const formRef = React.createRef<ViewTemplateHandle>();

    function handleSave() {
      const payload = formRef.current?.getPayload();
      if (!payload) return;

      updateWorkoutTemplate(
        { templateId: template.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListWorkoutTemplatesQueryKey(),
            });
            closeModal();
          },
        },
      );
    }

    function handleStartWorkout() {
      startWorkoutSession(
        { data: { template_id: template.id } },
        {
          onSuccess: () => {
            toast.success(
              t("templates.workoutStarted", { name: template.name }),
            );
            closeModal();
          },
        },
      );
    }

    openModal({
      title: template.name,
      subtitle: t("templates.viewModal.subtitle"),
      content: <ViewTemplate ref={formRef} template={template}></ViewTemplate>,
      rightButtons: [
        {
          icon: <Save></Save>,
          label: t("common.actions.save"),
          onClick: handleSave,
        },
        {
          label: (
            <>
              <Play className="size-2.5"></Play>
              {t("templates.startWorkout")}
            </>
          ),
          variant: "outline",
          onClick: handleStartWorkout,
        },
      ],
    });
  }

  return { openViewTemplateModal };
}

type Props = {
  template: WorkoutTemplateRead;
};

const ViewTemplate = ({
  ref,
  template,
}: Props & { ref?: React.Ref<ViewTemplateHandle> }) => {
  const { t } = useTranslation();
  const { data } = useListExercises({ page: 1, page_size: 100 });
  const exercises = data?.items ?? [];
  const groupedExercises = React.useMemo(
    () => groupExercisesByMuscleGroup(exercises),
    [exercises],
  );
  const [name, setName] = React.useState(template.name);
  const [rows, setRows] = React.useState<TemplateExerciseRow[]>(() =>
    [...template.exercises]
      .sort((a, b) => a.position - b.position)
      .map((templateExercise) => ({
        id: templateExercise.id,
        exercise: {
          id: templateExercise.exercise_id,
          name: templateExercise.name,
          primary_muscle_group: templateExercise.primary_muscle_group,
          secondary_muscle_groups: templateExercise.secondary_muscle_groups,
          created_at: template.created_at,
        },
        sets: String(templateExercise.set_count),
      })),
  );
  // Weighted like the backend's weekly summary: each set counts towards every
  // muscle group the exercise trains, multiplied by that muscle group's factor.
  const setsByMuscleGroup = React.useMemo(() => {
    // Summed in hundredths (factors have at most two decimals) so the totals
    // don't pick up floating-point noise like 5.6000000001.
    const hundredths = new Map<MuscleGroup, number>();
    for (const row of rows) {
      const setCount = Number(row.sets);
      if (!row.exercise || !Number.isInteger(setCount) || setCount <= 0) {
        continue;
      }
      for (const { muscle_group, factor } of [
        row.exercise.primary_muscle_group,
        ...row.exercise.secondary_muscle_groups,
      ]) {
        hundredths.set(
          muscle_group,
          (hundredths.get(muscle_group) ?? 0) +
            setCount * Math.round(factor * 100),
        );
      }
    }
    return [...hundredths.entries()].map(
      ([muscleGroup, total]) => [muscleGroup, total / 100] as const,
    );
  }, [rows]);
  const setsByMuscleGroupColumns = React.useMemo(() => {
    const columnCount = 3;
    const perColumn = Math.ceil(setsByMuscleGroup.length / columnCount);
    return Array.from({ length: columnCount }, (_, index) =>
      setsByMuscleGroup.slice(index * perColumn, (index + 1) * perColumn),
    ).filter((column) => column.length > 0);
  }, [setsByMuscleGroup]);
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
      <Separator></Separator>
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Info className="size-3.5"></Info>
            {t("templates.setsByMuscleGroup")}
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-auto max-w-md">
          <div className="flex flex-row flex-wrap items-stretch gap-4">
            {setsByMuscleGroupColumns.map((column, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <Separator
                    orientation="vertical"
                    className="hidden sm:block"
                  ></Separator>
                )}
                <div className="flex min-w-32 flex-1 flex-col gap-1">
                  {column.map(([muscleGroup, setCount]) => (
                    <div
                      key={muscleGroup}
                      className="flex flex-row gap-1.5  items-center"
                    >
                      <Badge
                        variant={"default"}
                        className="w-24 capitalize text-xs"
                      >
                        {t(`common.muscleGroups.${muscleGroup}`)}
                      </Badge>
                      <span className="text-xs">
                        {t("templates.setCount", { count: setCount })}
                      </span>
                    </div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};
