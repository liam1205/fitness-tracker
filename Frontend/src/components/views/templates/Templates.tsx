import { Ellipsis, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateTemplateModal } from "@/components/views/modals/CreateTemplate";
import { useListWorkoutTemplates } from "@/api/endpoints";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Workout templates: reusable exercise plans a user can start a workout from.
 */
export function Templates() {
  const { openCreateTemplateModal } = useCreateTemplateModal();
  const { data } = useListWorkoutTemplates();

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Templates</h1>
      <div className="flex flex-col gap-3">
        {data?.map((template) => (
          <Card>
            <CardHeader className="flex flex-row justify-between">
              <span className="text-lg font-semibold">{template.name}</span>
              <Button size={"icon"} variant={"ghost"}>
                <Ellipsis></Ellipsis>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                {template.exercises.map((exercise) => (
                  <span className="text-sm text-accent-foreground">
                    {exercise.set_count} x {exercise.name} (
                    {exercise.muscle_group})
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
