import { addWeeks, getISOWeek, startOfISOWeek, subWeeks } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useGetWeeklyCompletedSessionCounts } from "@/api/endpoints/workout-sessions/workout-sessions";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const WEEKS = 6;

type Props = {
  currentWeek: (weeks: number) => void;
};

const ActivityOverviewGraph = ({ currentWeek }: Props) => {
  const { t } = useTranslation();
  const chartConfig = useMemo(
    () =>
      ({
        sessions: {
          label: t("activity.graph.sessions"),
          color: "var(--success)",
        },
      }) satisfies ChartConfig,
    [t],
  );
  const { data: activity } = useGetWeeklyCompletedSessionCounts({
    weeks: WEEKS,
  });
  const firstMonday = startOfISOWeek(subWeeks(new Date(), WEEKS - 1));

  const data = activity?.map((sessions, w) => ({
    week: t("activity.calendarWeek", {
      week: getISOWeek(addWeeks(firstMonday, w)),
    }),
    sessions,
  }));

  currentWeek(WEEKS);

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="sessions"
          fill="var(--info)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ChartContainer>
  );
};

export default ActivityOverviewGraph;
