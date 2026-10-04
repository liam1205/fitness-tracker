import { Play, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateTemplateModal } from "@/components/views/modals/CreateTemplate";
import { useStartWorkoutModal } from "@/components/views/modals/StartWorkoutModal";
import { useAuth } from "@/lib/auth";
import { useCreateExerciseModal } from "../modals/CreateExercises";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WeekSummary from "../weeksummary/WeekSummary";
import { getCurrentWeekNumber } from "@/lib/utils";
import ActivityOverview from "../activity-overview/ActivityOverview";

export function Home() {
  const { user } = useAuth();
  const { openCreateTemplateModal } = useCreateTemplateModal();
  const { openStartWorkoutModal } = useStartWorkoutModal();
  const { openCreateExerciseModal } = useCreateExerciseModal();

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">
        Welcome{user ? `, ${user.name}` : ""}
      </h1>
      <div className="w-full h-full flex flex-col gap-2">
        <Card>
          <CardHeader>
            <CardTitle>This week's summary</CardTitle>
            <CardDescription>CW {getCurrentWeekNumber()}</CardDescription>
          </CardHeader>
          <CardContent>
            <WeekSummary></WeekSummary>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your activity</CardTitle>
          </CardHeader>
          <CardContent className="flex">
            <ActivityOverview></ActivityOverview>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Your activity - graph</CardTitle>
          </CardHeader>
          <CardContent className="flex "></CardContent>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-6 flex flex-wrap justify-center gap-3 px-4">
        <Button
          variant={"outline"}
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
          onClick={openStartWorkoutModal}
        >
          <Play />
          Start workout
        </Button>
        <Button
          variant={"outline"}
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
