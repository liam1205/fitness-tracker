import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { Plus } from "lucide-react";

/**
 * Logged workouts: the history of completed training sessions.
 */
export function Workouts() {
  const { openModal, closeModal } = useModal();

  function handleCreateWorkout() {
    openModal({
      title: "Create workout",
      subtitle: "Log a new training session.",
      content: (
        <p className="text-sm text-muted-foreground">
          Workout form goes here.
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
      <h1 className="text-4xl font-bold tracking-tight">Workouts</h1>
      <p className="text-muted-foreground">
        Your logged workouts will show up here.
      </p>
      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={handleCreateWorkout}
      >
        <Plus />
        Create workout
      </Button>
    </div>
  );
}
