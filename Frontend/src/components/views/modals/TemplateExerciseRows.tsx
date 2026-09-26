import * as React from "react";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { ExerciseRead } from "@/api/model";
import { MuscleGroup } from "@/api/model/muscleGroup";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus } from "lucide-react";

export const MAX_EXERCISES = 12;

export type TemplateExerciseRow = {
  id: number;
  exercise: ExerciseRead | null;
  sets: string;
};

export type ExerciseGroup = {
  value: string;
  items: ExerciseRead[];
};

export function groupExercisesByMuscleGroup(
  exercises: ExerciseRead[],
): ExerciseGroup[] {
  return Object.values(MuscleGroup).flatMap((muscleGroup) => {
    const items = exercises.filter(
      (exercise) => exercise.muscle_group === muscleGroup,
    );
    return items.length > 0 ? [{ value: muscleGroup, items }] : [];
  });
}

export function ExerciseRowsEditor({
  rows,
  onRowsChange,
  groupedExercises,
  containerRef,
}: {
  rows: TemplateExerciseRow[];
  onRowsChange: React.Dispatch<React.SetStateAction<TemplateExerciseRow[]>>;
  groupedExercises: ExerciseGroup[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const nextRowId = React.useRef(
    rows.reduce((max, row) => Math.max(max, row.id + 1), 0),
  );

  function addRow() {
    onRowsChange((rows) => {
      if (rows.length >= MAX_EXERCISES) return rows;
      return [...rows, { id: nextRowId.current++, exercise: null, sets: "" }];
    });
  }

  function updateRow(id: number, changes: Partial<TemplateExerciseRow>) {
    onRowsChange((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    onRowsChange((rows) => {
      const oldIndex = rows.findIndex((row) => row.id === active.id);
      const newIndex = rows.findIndex((row) => row.id === over.id);
      return arrayMove(rows, oldIndex, newIndex);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rows.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          {rows.map((row) => (
            <SortableExerciseRow
              key={row.id}
              row={row}
              groupedExercises={groupedExercises}
              containerRef={containerRef}
              onUpdate={(changes) => updateRow(row.id, changes)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {rows.length < MAX_EXERCISES && (
        <Button variant={"outline"} className="w-full mt-1.5" onClick={addRow}>
          <Plus></Plus>
          Add exercise
        </Button>
      )}
    </div>
  );
}

function SortableExerciseRow({
  row,
  groupedExercises,
  containerRef,
  onUpdate,
}: {
  row: TemplateExerciseRow;
  groupedExercises: ExerciseGroup[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (changes: Partial<TemplateExerciseRow>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-row gap-1 items-center"
    >
      <Button
        variant="ghost"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </Button>
      <Combobox
        items={groupedExercises}
        value={row.exercise}
        onValueChange={(exercise) => onUpdate({ exercise })}
        itemToStringLabel={(exercise) => exercise.name}
        isItemEqualToValue={(a, b) => a.id === b.id}
      >
        <ComboboxInput placeholder="Select exercise" className="flex-1" />
        <ComboboxContent container={containerRef}>
          <ComboboxEmpty>No exercises found.</ComboboxEmpty>
          <ComboboxList className={"w-24"}>
            {(group: ExerciseGroup) => (
              <ComboboxGroup key={group.value} items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(exercise: ExerciseRead) => (
                    <ComboboxItem
                      key={exercise.id}
                      value={exercise}
                      className="min-w-0"
                    >
                      <span className="truncate">{exercise.name}</span>
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Input
        disabled
        className="w-18"
        value={row.exercise?.muscle_group ?? ""}
      ></Input>
      <Input
        type="number"
        placeholder="Sets"
        className="w-9"
        value={row.sets}
        onChange={(e) => onUpdate({ sets: e.target.value })}
      ></Input>
    </div>
  );
}
