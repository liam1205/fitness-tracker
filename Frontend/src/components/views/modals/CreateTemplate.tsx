import { useModal } from "@/hooks/use-modal";

/**
 * Modal for creating a new workout template.
 */
export function useCreateTemplateModal() {
  const { openModal, closeModal } = useModal();

  function openCreateTemplateModal() {
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

  return { openCreateTemplateModal };
}
