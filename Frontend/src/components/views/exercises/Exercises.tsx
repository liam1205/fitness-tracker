import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateExerciseModal } from "@/components/views/modals/CreateExercises";

/**
 * Exercise library: the catalog of exercises a user can add to templates and workouts.
 */
export function Exercises() {
  const { openCreateExerciseModal } = useCreateExerciseModal();

  return (
    <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight">Exercises</h1>
      <p className="text-muted-foreground">
        Your exercises will show up here.
      </p>
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
