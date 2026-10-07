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
import { useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/**
 * Modal for starting a workout from one of the user's templates.
 */
export function useStartWorkoutModal() {
  const { t } = useTranslation();
  const { openModal, updateModal, closeModal } = useModal();
  const { mutate: startWorkoutSession, isPending } = useStartWorkoutSession();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  function openStartWorkoutModal() {
    function startButtons(templateId?: string): ModalButton[] {
      return [
        {
          icon: <Play></Play>,
          label: t("workouts.startModal.start"),
          disabled: !templateId || isPending,
          onClick: () => {
            if (!templateId) return;
            startWorkoutSession(
              { data: { template_id: templateId } },
              {
                onSuccess: (workout) => {
                  queryClient.invalidateQueries({
                    queryKey: getListActiveWorkoutSessionsQueryKey(),
                  });
                  toast.success(t("workouts.startModal.started"));
                  navigate({
                    to: "/workouts/$workoutId",
                    params: { workoutId: workout.id },
                  });
                  closeModal();
                },
              },
            );
          },
        },
      ];
    }

    openModal({
      title: t("workouts.startModal.title"),
      subtitle: t("workouts.startModal.subtitle"),
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
  const { t } = useTranslation();
  const { data: templates } = useListWorkoutTemplates();

  return (
    <div className="flex flex-col gap-3">
      <Select onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("workouts.startModal.selectTemplate")} />
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
