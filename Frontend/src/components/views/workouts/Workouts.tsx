import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateWorkoutModal } from "@/components/views/modals/CreateWorkout";

/**
 * Logged workouts: the history of completed training sessions.
 */
export function Workouts() {
  const { openCreateWorkoutModal } = useCreateWorkoutModal();

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">Workouts</h1>
      <p className="text-muted-foreground">
        Your logged workouts will show up here.
      </p>
      <Button
        size={"lg"}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 shadow-lg"
        onClick={openCreateWorkoutModal}
      >
        <Plus />
        Create workout
      </Button>
    </div>
  );
}
