import { Ellipsis, Eye, Play, Plus, Trash, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCreateTemplateModal } from "@/components/views/modals/CreateTemplate";
import {
  getListWorkoutTemplatesQueryKey,
  useDeleteWorkoutTemplate,
  useListWorkoutTemplates,
} from "@/api/endpoints/workout-templates/workout-templates";
import {
  getListActiveWorkoutSessionsQueryKey,
  useStartWorkoutSession,
} from "@/api/endpoints/workout-sessions/workout-sessions";
import type { WorkoutTemplateRead } from "@/api/model";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useViewTemplateModal } from "../modals/ViewTemplate";
import { dateString } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import EmptyIndicator from "../empty-indicator/EmptyIndicator";

/**
 * Workout templates: reusable exercise plans a user can start a workout from.
 */
export function Templates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openCreateTemplateModal } = useCreateTemplateModal();
  const { openViewTemplateModal } = useViewTemplateModal();
  const { data } = useListWorkoutTemplates();
  const { mutate: deleteWorkoutTemplate } = useDeleteWorkoutTemplate();
  const { mutate: startWorkoutSession } = useStartWorkoutSession();

  function handleDeleteTemplate(templateId: string) {
    deleteWorkoutTemplate(
      { templateId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListWorkoutTemplatesQueryKey(),
          });
        },
      },
    );
  }

  function handleStartWorkout(template: WorkoutTemplateRead) {
    startWorkoutSession(
      { data: { template_id: template.id } },
      {
        onSuccess: (result) => {
          toast.success(`Started "${template.name}".`);
          queryClient.invalidateQueries({
            queryKey: getListActiveWorkoutSessionsQueryKey(),
          });
          navigate({
            to: "/workouts/$workoutId",
            params: { workoutId: result.id },
          });
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">
        {user?.firstName}'s{" "}
        <span className="rounded-xl px-2 bg-foreground text-background">
          Templates
        </span>
      </h1>
      <div className="flex flex-col gap-3">
        {data?.length === 0 && (
          <EmptyIndicator
            message={<>No templates available.</>}
          ></EmptyIndicator>
        )}
        {data?.map((template) => (
          <Card size="sm">
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription className="flex justify-start">
                Created on {dateString(new Date(template.created_at))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-0.5">
                {template.exercises.map((exercise) => (
                  <span className="flex flex-row items-center gap-2 text-sm text-accent-foreground">
                    {exercise.set_count}
                    <X className="size-2.5"></X>
                    {exercise.name}{" "}
                    <span className="capitalize">
                      ({exercise.muscle_group})
                    </span>
                  </span>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex flex-row">
              <div className="flex flex-row w-2/3 justify-start gap-2">
                <Button
                  variant={"destructive"}
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash className="size-2.5"></Trash> Delete
                </Button>
              </div>
              <div className="flex flex-row w-2/3 justify-end gap-2">
                <Button
                  variant={"outline"}
                  onClick={() => handleStartWorkout(template)}
                >
                  <Play className="size-2.5"></Play> Start Workout
                </Button>
                <Button onClick={() => openViewTemplateModal(template)}>
                  <Eye className="size-2.5"></Eye> View
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={openCreateTemplateModal}
      >
        <Plus />
        Create template
      </Button>
    </div>
  );
}
