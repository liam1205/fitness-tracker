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
import { Trans, useTranslation } from "react-i18next";

export function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openCreateTemplateModal } = useCreateTemplateModal();
  const { openStartWorkoutModal } = useStartWorkoutModal();
  const { openCreateExerciseModal } = useCreateExerciseModal();

  const [graphWeeks, setGraphWeeks] = useState<number>();
  const [activityWeeks, setActivityWeeks] = useState<number>();

  return (
    <div className="space-y-4 pb-22">
      <h1 className="text-4xl font-bold tracking-tight">
        {user ? (
          <Trans
            i18nKey="home.welcomeUser"
            values={{ name: user.firstName }}
            components={{
              name: (
                <span className="rounded-xl px-2 bg-foreground text-background" />
              ),
            }}
          />
        ) : (
          t("home.welcome")
        )}
      </h1>
      <div className="w-full h-full flex flex-col gap-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("home.activity.title")}</CardTitle>
            <CardDescription>
              {t("home.activity.description", { count: activityWeeks ?? 0 })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex">
            <ActivityOverview currentWeek={setActivityWeeks}></ActivityOverview>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("home.activityGraph.title")}</CardTitle>
            <CardDescription>
              {t("home.activityGraph.description", { count: graphWeeks ?? 0 })}
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
            <CardTitle>{t("home.weekSummary.title")}</CardTitle>
            <CardDescription>
              {t("activity.calendarWeek", { week: getCurrentWeekNumber() })}
            </CardDescription>
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
          {t("home.actions.createTemplate")}
        </Button>
        <Button
          size={"lg"}
          className="shadow-lg"
          onClick={openStartWorkoutModal}
        >
          <Play />
          {t("home.actions.startWorkout")}
        </Button>
        <Button
          variant={"outline"}
          size={"lg"}
          className="shadow-lg"
          onClick={openCreateExerciseModal}
        >
          <Plus />
          {t("home.actions.createExercise")}
        </Button>
      </div>
    </div>
  );
}
