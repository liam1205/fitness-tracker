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
import ActivityOverviewGraph from "../activity-overview/ActivityOverviewGraph";
import { useState } from "react";

export function Home() {
  const { user } = useAuth();
  const { openCreateTemplateModal } = useCreateTemplateModal();
  const { openStartWorkoutModal } = useStartWorkoutModal();
  const { openCreateExerciseModal } = useCreateExerciseModal();

  const [graphWeeks, setGraphWeeks] = useState<number>();
  const [activityWeeks, setActivityWeeks] = useState<number>();

  return (
    <div className="space-y-4 pb-10">
      <h1 className="text-4xl font-bold tracking-tight">
        Welcome
        {user ? (
          <>
            ,{" "}
            <span className="rounded-xl px-2  bg-foreground text-background">
              {user.name}
            </span>
          </>
        ) : (
          <></>
        )}
      </h1>
      <div className="w-full h-full flex flex-col gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Your activity</CardTitle>
            <CardDescription>
              Completed workouts in the last {activityWeeks} weeks
            </CardDescription>
          </CardHeader>
          <CardContent className="flex">
            <ActivityOverview currentWeek={setActivityWeeks}></ActivityOverview>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity Graph</CardTitle>
            <CardDescription>
              Amounts of workout sessions in the last {graphWeeks} weeks
            </CardDescription>
          </CardHeader>
          <CardContent className="flex ">
            <ActivityOverviewGraph
              currentWeek={setGraphWeeks}
            ></ActivityOverviewGraph>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>This week's summary</CardTitle>
            <CardDescription>CW {getCurrentWeekNumber()}</CardDescription>
          </CardHeader>
          <CardContent>
            <WeekSummary></WeekSummary>
          </CardContent>
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
