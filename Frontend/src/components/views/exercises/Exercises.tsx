import { Eye, Plus } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useCreateExerciseModal } from "@/components/views/modals/CreateExercises";
import { useListExercises } from "@/api/endpoints/exercises/exercises";
import { useViewExerciseModal } from "../modals/ViewExercise";
import type { ExerciseRead, MuscleGroup } from "@/api/model";
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
import { useAuth } from "@/lib/auth";

/**
 * Exercise library: the catalog of exercises a user can add to templates and workouts.
 */
export function Exercises() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { openCreateExerciseModal } = useCreateExerciseModal();
  const { data } = useListExercises({ page: 1, page_size: 100 });
  const { openViewExerciseModal } = useViewExerciseModal();

  const groupedExercises = (data?.items ?? []).reduce<
    Record<string, ExerciseRead[]>
  >((groups, exercise) => {
    (groups[exercise.primary_muscle_group.muscle_group] ??= []).push(exercise);
    return groups;
  }, {});

  /** E.g. "Chest · Triceps 0.5 · Shoulders 0.25". */
  function describeMuscleGroups(exercise: ExerciseRead) {
    return [
      t(`common.muscleGroups.${exercise.primary_muscle_group.muscle_group}`),
      ...exercise.secondary_muscle_groups.map(
        ({ muscle_group, factor }) =>
          `${t(`common.muscleGroups.${muscle_group}`)} ${factor.toLocaleString(i18n.resolvedLanguage)}`,
      ),
    ].join(" · ");
  }

  return (
    <div className="space-y-4 pb-12">
      <h1 className="text-4xl font-bold tracking-tight">
        <Trans
          i18nKey="exercises.heading"
          values={{ name: user?.firstName ?? "" }}
          components={{
            highlight: (
              <span className="rounded-xl px-2 bg-foreground text-background" />
            ),
          }}
        />
      </h1>
      <Accordion
        type="single"
        collapsible
        defaultValue="chest"
        key={Object.keys(groupedExercises).join(",")}
      >
        {Object.entries(groupedExercises).map(([muscleGroup, exercises]) => (
          <AccordionItem key={muscleGroup} value={muscleGroup}>
            <AccordionTrigger>
              {t(`common.muscleGroups.${muscleGroup as MuscleGroup}`)} (
              {exercises.length})
            </AccordionTrigger>
            <AccordionContent className="gap-1">
              {exercises.map((exercise) => (
                <Item key={exercise.id} variant={"outline"}>
                  <ItemMedia></ItemMedia>
                  <ItemContent>
                    <ItemTitle>{exercise.name}</ItemTitle>
                    <ItemDescription>
                      {describeMuscleGroups(exercise)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button onClick={() => openViewExerciseModal(exercise)}>
                      <Eye className="size-2.5"></Eye> {t("exercises.view")}
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
        {t("exercises.create")}
      </Button>
    </div>
  );
}
