import { useModal } from "@/hooks/use-modal";

/**
 * Modal for logging a new workout.
 */
export function useCreateWorkoutModal() {
  const { openModal, closeModal } = useModal();

  function openCreateWorkoutModal() {
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

  return { openCreateWorkoutModal };
}
