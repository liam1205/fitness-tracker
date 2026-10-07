import { useGetWeeklyMuscleGroupSets } from "@/api/endpoints/workout-sessions/workout-sessions";
import type { MuscleGroup, MuscleGroupSetCount } from "@/api/model";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableColumnDef,
} from "@/components/views/datatable/DataTable";
import { useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const columnHelper = createDataTableColumnHelper<MuscleGroupSetCount>();

const optionalSets = (value: number | null | undefined) => value ?? "—";

const isDefined = (value: number | null | undefined): value is number =>
  value != null;

const setsColorClass = ({
  completed_sets,
  mev,
  mav,
  mrv,
}: MuscleGroupSetCount) => {
  if (isDefined(mrv) && completed_sets > mrv) return "destructive";
  if (isDefined(mav) && completed_sets > mav) return "success";
  if (isDefined(mev) && completed_sets >= mev) return "warning";
  if (isDefined(mev)) return "destructive";
  return "secondary";
};

const highlight = (
  <span className="rounded-md px-2 bg-foreground text-background" />
);

const buildColumns = (
  t: TFunction,
): DataTableColumnDef<MuscleGroupSetCount>[] => [
  columnHelper.accessor("muscle_group", {
    header: t("common.fields.muscleGroup"),
    cell: (info) => (
      <span className="capitalize">
        {t(`common.muscleGroups.${info.getValue() as MuscleGroup}`)}
      </span>
    ),
  }),
  columnHelper.accessor("completed_sets", {
    header: t("common.fields.sets"),
    cell: (info) => {
      return !info.row.original.mev ||
        !info.row.original.mav ||
        !info.row.original.mrv ? (
        <Badge variant={setsColorClass(info.row.original)}>
          {info.getValue()}
        </Badge>
      ) : (
        <HoverCard>
          <HoverCardTrigger>
            <Badge variant={setsColorClass(info.row.original)}>
              {info.getValue()}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="min-w-fit">
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <p>
                <Trans
                  i18nKey="weekSummary.mevMissing"
                  count={
                    info.row.original.mev - info.row.original.completed_sets
                  }
                  values={{
                    muscleGroup: t(
                      `common.muscleGroups.${info.row.original.muscle_group}`,
                    ),
                  }}
                  components={{ count: highlight, term: highlight }}
                />
              </p>
              <p>
                <Trans
                  i18nKey="weekSummary.mavMissing"
                  values={{
                    min:
                      info.row.original.mav - info.row.original.completed_sets,
                    max:
                      info.row.original.mrv - info.row.original.completed_sets,
                    muscleGroup: t(
                      `common.muscleGroups.${info.row.original.muscle_group}`,
                    ),
                  }}
                  components={{ count: highlight, term: highlight }}
                />
              </p>
            </ol>
          </HoverCardContent>
        </HoverCard>
      );
    },
    meta: { className: "text-center" },
  }),
  columnHelper.accessor("mev", {
    header: t("weekSummary.columns.mev"),
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-center" },
  }),
  columnHelper.accessor("mav", {
    header: t("weekSummary.columns.mav"),
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-center" },
  }),
  columnHelper.accessor("mrv", {
    header: t("weekSummary.columns.mrv"),
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-center" },
  }),
];

const WeekSummary = () => {
  const { t } = useTranslation();
  const { data: setsOfTheWeek, isLoading } = useGetWeeklyMuscleGroupSets();
  // Built per language so headers stay plain strings (keeps the sort toggle).
  const columns = useMemo(() => buildColumns(t), [t]);
  return (
    <DataTable
      columns={columns}
      data={setsOfTheWeek?.muscle_groups}
      getRowId={(row) => row.muscle_group}
      isLoading={isLoading}
    />
  );
};

export default WeekSummary;
