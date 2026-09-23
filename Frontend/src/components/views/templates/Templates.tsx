import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";

/**
 * Workout templates: reusable exercise plans a user can start a workout from.
 */
export function Templates() {
  const { openModal, closeModal } = useModal();

  function handleCreateTemplate() {
    openModal({
      title: "Create template",
      subtitle: "Build a reusable workout template.",
      content: (
        <p className="text-sm text-muted-foreground">
          Template form goes here.
        </p>
      ),
      rightButtons: [
        {
          label: "Save",
          onClick: closeModal,
        },
      ],
    });
  }

  return (
    <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight">Templates</h1>
      <p className="text-muted-foreground">
        Your workout templates will show up here.
      </p>
      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={handleCreateTemplate}
      >
        <Plus />
        Create template
      </Button>
    </div>
  );
}
