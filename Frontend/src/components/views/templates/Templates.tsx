import { Ellipsis, Eye, Play, Plus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCreateTemplateModal } from "@/components/views/modals/CreateTemplate";
import {
  getListWorkoutTemplatesQueryKey,
  useDeleteWorkoutTemplate,
  useListWorkoutTemplates,
  useStartWorkoutSession,
} from "@/api/endpoints";
import type { WorkoutTemplateRead } from "@/api/model";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useViewTemplateModal } from "../modals/ViewTemplate";

/**
 * Workout templates: reusable exercise plans a user can start a workout from.
 */
export function Templates() {
  const queryClient = useQueryClient();
  const { openCreateTemplateModal } = useCreateTemplateModal();
  const { openViewTemplateModal } = useViewTemplateModal();
  const { data } = useListWorkoutTemplates();
  const { mutate: deleteWorkoutTemplate } = useDeleteWorkoutTemplate();
  const { mutate: startWorkoutSession } = useStartWorkoutSession();

  function handleDeleteTemplate(templateId: number) {
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
        onSuccess: () => {
          toast.success(`Started "${template.name}".`);
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Templates</h1>
      <div className="flex flex-col gap-3">
        {data?.map((template) => (
          <Card
            size="sm"
            className="hover:bg-background hover:cursor-pointer active:bg-background"
            onClick={() => openViewTemplateModal(template)}
          >
            <CardHeader className="flex flex-row justify-between">
              <span className=" font-semibold">{template.name}</span>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button size={"xs"} variant={"ghost"}>
                    <Ellipsis></Ellipsis>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="flex flex-ro gap-2"
                      onClick={() => openViewTemplateModal(template)}
                    >
                      <Eye className="size-3"></Eye>
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex flex-ro gap-2"
                      onClick={() => handleStartWorkout(template)}
                    >
                      <Play className="size-3"></Play>
                      Start Workout
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      className="flex flex-ro gap-2"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <X className="size-3"></X>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-0.5">
                {template.exercises.map((exercise) => (
                  <span className="flex flex-row items-center gap-1 text-sm text-accent-foreground">
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
