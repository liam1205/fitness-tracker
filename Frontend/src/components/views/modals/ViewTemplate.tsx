import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getListWorkoutTemplatesQueryKey,
  useListExercises,
  useStartWorkoutSession,
  useUpdateWorkoutTemplate,
} from "@/api/endpoints";
import type { WorkoutTemplateRead, WorkoutTemplateUpdate } from "@/api/model";
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
import { Info, Play } from "lucide-react";
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
            toast.success(`Started "${template.name}".`);
            closeModal();
          },
        },
      );
    }

    openModal({
      title: template.name,
      subtitle: "Modify your template.",
      content: <ViewTemplate ref={formRef} template={template}></ViewTemplate>,
      rightButtons: [
        {
          label: "Save",
          onClick: handleSave,
        },
        {
          label: (
            <>
              <Play className="size-3"></Play>Start Workout
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
          muscle_group: templateExercise.muscle_group,
          created_at: template.created_at,
        },
        sets: String(templateExercise.set_count),
      })),
  );
  const setsByMuscleGroup = React.useMemo(() => {
    const totals = new Map<string, number>();
    for (const row of rows) {
      const setCount = Number(row.sets);
      if (!row.exercise || !Number.isInteger(setCount) || setCount <= 0) {
        continue;
      }
      const muscleGroup = row.exercise.muscle_group;
      totals.set(muscleGroup, (totals.get(muscleGroup) ?? 0) + setCount);
    }
    return [...totals.entries()];
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
        const missing = [
          !trimmedName && "a name",
          validExercises.length === 0 && "at least one exercise",
        ].filter(Boolean);
        toastError(null, `Template requires ${missing.join(" and ")}.`);
        return null;
      }

      return { name: trimmedName, exercises: validExercises };
    },
  }));

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-name-input">Name</Label>
        <Input
          id="template-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        ></Input>
      </div>
      <Separator></Separator>
      <div className="w-full h-full max-h-72 overflow-y-scroll overflow-x-hidden">
        <ExerciseRowsEditor
          rows={rows}
          onRowsChange={setRows}
          groupedExercises={groupedExercises}
          containerRef={containerRef}
        />
      </div>
      <Separator></Separator>
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Info className="size-3.5"></Info>
            Sets by muscle group
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
                        {muscleGroup}
                      </Badge>
                      <span className="text-xs">{setCount} Sets</span>
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
