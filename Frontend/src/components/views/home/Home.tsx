import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateTemplateModal } from "@/components/views/modals/CreateTemplate";
import { useCreateWorkoutModal } from "@/components/views/modals/CreateWorkout";
import { useAuth } from "@/lib/auth";
import { useCreateExerciseModal } from "../modals/CreateExercises";

export function Home() {
  const { user } = useAuth();
  const { openCreateTemplateModal } = useCreateTemplateModal();
  const { openCreateWorkoutModal } = useCreateWorkoutModal();
  const { openCreateExerciseModal } = useCreateExerciseModal();

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">
        Welcome{user ? `, ${user.name}` : ""}
      </h1>
      <p className="text-muted-foreground">
        You're signed in. The whole app is gated behind authentication — the
        sign-in screen is all an unauthenticated visitor can reach.
      </p>
      <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
        <Button
          size={"lg"}
          className="shadow-lg"
          onClick={openCreateTemplateModal}
        >
          <Plus />
          Create template
        </Button>
        <Button
          size={"lg"}
          className="shadow-lg"
          onClick={openCreateWorkoutModal}
        >
          <Plus />
          Create workout
        </Button>
        <Button
          size={"lg"}
          className="shadow-lg"
          onClick={openCreateExerciseModal}
        >
          <Plus />
          Create exercise
        </Button>
      </div>
    </div>
  );
}
