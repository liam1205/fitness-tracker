import {
  getListActiveWorkoutSessionsQueryKey,
  useStartWorkoutSession,
} from "@/api/endpoints/workout-sessions/workout-sessions";
import { useListWorkoutTemplates } from "@/api/endpoints/workout-templates/workout-templates";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModal, type ModalButton } from "@/hooks/use-modal";
import { useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { toast } from "sonner";

/**
 * Modal for starting a workout from one of the user's templates.
 */
export function useStartWorkoutModal() {
  const { openModal, updateModal, closeModal } = useModal();
  const { mutate: startWorkoutSession, isPending } = useStartWorkoutSession();

  const queryClient = useQueryClient();

  function openStartWorkoutModal() {
    function startButtons(templateId?: string): ModalButton[] {
      return [
        {
          icon: <Play></Play>,
          label: "Start",
          disabled: !templateId || isPending,
          onClick: () => {
            if (!templateId) return;
            startWorkoutSession(
              { data: { template_id: templateId } },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: getListActiveWorkoutSessionsQueryKey(),
                  });
                  toast.success("Workout started.");
                  closeModal();
                },
              },
            );
          },
        },
      ];
    }

    openModal({
      title: "Start workout",
      subtitle: "Pick a template to start a training session from.",
      content: (
        <WorkoutModalContent
          onSelect={(templateId) =>
            updateModal({ rightButtons: startButtons(templateId) })
          }
        />
      ),
      rightButtons: startButtons(),
    });
  }

  return { openStartWorkoutModal };
}

const WorkoutModalContent = ({
  onSelect,
}: {
  onSelect: (templateId: string) => void;
}) => {
  const { data: templates } = useListWorkoutTemplates();

  return (
    <div className="flex flex-col gap-3">
      <Select onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent position="popper">
          {templates?.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
