import { useModal } from "@/hooks/use-modal";

/**
 * Modal for creating a new exercise.
 */
export function useCreateExerciseModal() {
  const { openModal, closeModal } = useModal();

  function openCreateExerciseModal() {
    openModal({
      title: "Create exercise",
      subtitle: "Add a new exercise to your library.",
      content: (
        <p className="text-sm text-muted-foreground">
          Exercise form goes here.
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

  return { openCreateExerciseModal };
}
