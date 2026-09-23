import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateTemplateModal } from "@/components/views/modals/CreateTemplate";

/**
 * Workout templates: reusable exercise plans a user can start a workout from.
 */
export function Templates() {
  const { openCreateTemplateModal } = useCreateTemplateModal();

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Templates</h1>
      <p className="text-muted-foreground">
        Your workout templates will show up here.
      </p>
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
