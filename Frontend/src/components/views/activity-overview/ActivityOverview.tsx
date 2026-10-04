import { Fragment } from "react";
import {
  addDays,
  format,
  getISOWeek,
  isToday,
  startOfISOWeek,
  subWeeks,
} from "date-fns";
import { useGetDailySessionCounts } from "@/api/endpoints";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const WEEKS = 5;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const ActivityOverview = () => {
  const { data: activity } = useGetDailySessionCounts({ weeks: WEEKS });
  const firstMonday = startOfISOWeek(subWeeks(new Date(), WEEKS - 1));

  return (
    <div className="mx-auto grid grid-cols-[auto_repeat(7,1rem)] items-center gap-1.5 text-xs">
      <span />
      {WEEKDAYS.map((day, i) => (
        <span key={i} className="text-center text-muted-foreground">
          {day}
        </span>
      ))}
      {activity?.map((week, w) => {
        const monday = addDays(firstMonday, w * 7);
        return (
          <Fragment key={w}>
            <span className="pr-2 text-muted-foreground">
              CW {getISOWeek(monday)}
            </span>
            {WEEKDAYS.map((_, d) => {
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
                        count === 1 && "bg-success",
                        count !== undefined && count >= 2 && "bg-success",
                        isToday(date) &&
                          "ring-2 ring-ring ring-offset-0 ring-offset-card",
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(date, "EEE, d MMM")} · {count ?? 0} session
                    {count === 1 ? "" : "s"}
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
