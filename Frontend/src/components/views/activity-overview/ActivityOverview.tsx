import { Fragment } from "react";
import {
  addDays,
  format,
  getISOWeek,
  isToday,
  startOfISOWeek,
  subWeeks,
} from "date-fns";
import { useGetDailySessionCounts } from "@/api/endpoints/workout-sessions/workout-sessions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { dateFnsLocale } from "@/lib/i18n";

const WEEKS = 5;
const DAYS_PER_WEEK = 7;

type Props = {
  currentWeek: (weeks: number) => void;
};

const ActivityOverview = ({ currentWeek }: Props) => {
  const { t } = useTranslation();
  const { data: activity } = useGetDailySessionCounts({ weeks: WEEKS });
  const firstMonday = startOfISOWeek(subWeeks(new Date(), WEEKS - 1));
  const locale = dateFnsLocale();
  // Narrow weekday names (e.g. "M", "T", …) in the active language.
  const weekdays = Array.from({ length: DAYS_PER_WEEK }, (_, d) =>
    format(addDays(firstMonday, d), "EEEEE", { locale }),
  );

  currentWeek(WEEKS);

  return (
    <div className="mx-auto grid grid-cols-[auto_repeat(7,1rem)] items-center gap-2 text-xs">
      <span />
      {weekdays.map((day, i) => (
        <span key={i} className="text-center text-muted-foreground">
          {day}
        </span>
      ))}
      {activity?.map((week, w) => {
        const monday = addDays(firstMonday, w * 7);
        return (
          <Fragment key={w}>
            <span className="pr-2 text-muted-foreground">
              {t("activity.calendarWeek", { week: getISOWeek(monday) })}
            </span>
            {weekdays.map((_, d) => {
              const date = addDays(monday, d);
              const count = week[d]; // undefined = future day
              return (
                <Tooltip key={d}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "size-4 rounded-sm",
                        count === undefined &&
                          "border border-dashed border-foreground/20",
                        count === 0 && "bg-foreground/10",
                        count === 1 && "bg-info",
                        count !== undefined && count >= 2 && "bg-success",
                        isToday(date) &&
                          "ring-2 ring-ring ring-offset-0 ring-offset-card",
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("activity.dayTooltip", {
                      date: format(date, t("activity.dayFormat"), { locale }),
                      count: count ?? 0,
                    })}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
};

export default ActivityOverview;
