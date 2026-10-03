import { Eye, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateExerciseModal } from "@/components/views/modals/CreateExercises";
import { useListExercises } from "@/api/endpoints/exercises/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { useViewExerciseModal } from "../modals/ViewExercise";
import type { ExerciseRead } from "@/api/model";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

/**
 * Exercise library: the catalog of exercises a user can add to templates and workouts.
 */
export function Exercises() {
  const { openCreateExerciseModal } = useCreateExerciseModal();
  const { data } = useListExercises({ page: 1, page_size: 100 });
  const { openViewExerciseModal } = useViewExerciseModal();

  const groupedExercises = (data?.items ?? []).reduce<
    Record<string, ExerciseRead[]>
  >((groups, exercise) => {
    (groups[exercise.muscle_group] ??= []).push(exercise);
    return groups;
  }, {});

  return (
    <div className="space-y-4 pb-12">
      <h1 className="text-4xl font-bold tracking-tight">Exercises</h1>
      <Accordion
        type="single"
        collapsible
        defaultValue="chest"
        key={Object.keys(groupedExercises).join(",")}
      >
        {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
          <AccordionItem key={muscleGroup} value={muscleGroup}>
            <AccordionTrigger>
              {muscleGroup} ({exercises.length})
            </AccordionTrigger>
            <AccordionContent className="gap-1">
              {exercises.map((exercise) => (
                <Item key={exercise.id} variant={"outline"}>
                  <ItemMedia></ItemMedia>
                  <ItemContent>
                    <ItemTitle>{exercise.name}</ItemTitle>
                    <ItemDescription>{exercise.muscle_group}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button onClick={() => openViewExerciseModal(exercise)}>
                      <Eye className="size-2.5"></Eye> View
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={openCreateExerciseModal}
      >
        <Plus />
        Create exercise
      </Button>
    </div>
  );
}
