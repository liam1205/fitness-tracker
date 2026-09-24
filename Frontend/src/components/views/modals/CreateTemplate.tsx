import * as React from "react";

import { useCreateWorkoutTemplate, useListExercises } from "@/api/endpoints";
import type { ExerciseRead, WorkoutTemplateCreate } from "@/api/model";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModal } from "@/hooks/use-modal";
import { Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface CreateTemplateHandle {
  /** Builds the create payload, or null if the form isn't valid yet. */
  getPayload: () => WorkoutTemplateCreate | null;
}

/**
 * Modal for creating a new workout template.
 */
export function useCreateTemplateModal() {
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
      title: "Create workout template",
      subtitle: "Build a reusable workout template.",
      content: <CreateTemplate ref={formRef}></CreateTemplate>,
      rightButtons: [
        {
          label: "Save",
          onClick: handleSave,
        },
      ],
    });
  }

  return { openCreateTemplateModal };
}

const MAX_EXERCISES = 12;

type TemplateExerciseRow = {
  id: number;
  exercise: ExerciseRead | null;
  sets: string;
};

const CreateTemplate = ({ ref }: { ref?: React.Ref<CreateTemplateHandle> }) => {
  const { data } = useListExercises({ page: 1, page_size: 100 });
  const exercises = data?.items ?? [];
  const [name, setName] = React.useState("");
  const [rows, setRows] = React.useState<TemplateExerciseRow[]>([]);
  const nextRowId = React.useRef(0);

  React.useImperativeHandle(ref, () => ({
    getPayload: () => {
      const trimmedName = name.trim();
      if (!trimmedName) return null;

      const templateExercises = rows.flatMap((row) => {
        const setCount = Number(row.sets);
        if (!row.exercise || !Number.isInteger(setCount) || setCount <= 0) {
          return [];
        }
        return [{ exercise_id: row.exercise.id, set_count: setCount }];
      });

      return { name: trimmedName, exercises: templateExercises };
    },
  }));

  function addRow() {
    setRows((rows) => {
      if (rows.length >= MAX_EXERCISES) return rows;
      return [
        ...rows,
        { id: nextRowId.current++, exercise: null, sets: "" },
      ];
    });
  }

  function updateRow(id: number, changes: Partial<TemplateExerciseRow>) {
    setRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
        ></Input>
      </div>
      <Separator></Separator>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-row gap-4 items-center">
            <Combobox
              items={exercises}
              value={row.exercise}
              onValueChange={(exercise) => updateRow(row.id, { exercise })}
              itemToStringLabel={(exercise) => exercise.name}
              isItemEqualToValue={(a, b) => a.id === b.id}
            >
              <ComboboxInput
                placeholder="Select exercise"
                className="flex-1"
              />
              <ComboboxContent>
                <ComboboxEmpty>No exercises found.</ComboboxEmpty>
                <ComboboxList>
                  {(exercise: ExerciseRead) => (
                    <ComboboxItem key={exercise.id} value={exercise}>
                      {exercise.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Input
              disabled
              className="w-24"
              value={row.exercise?.muscle_group}
            ></Input>
            <Input
              type="number"
              placeholder="Sets"
              className="w-15"
              value={row.sets}
              onChange={(e) => updateRow(row.id, { sets: e.target.value })}
            ></Input>
          </div>
        ))}
        {rows.length < MAX_EXERCISES && (
          <Button variant={"ghost"} className="w-full" onClick={addRow}>
            <Plus></Plus>
            Add exercise
          </Button>
        )}
      </div>
    </>
  );
};
