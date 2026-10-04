import { useGetWeeklyMuscleGroupSets } from "@/api/endpoints/workout-sessions/workout-sessions";
import type { MuscleGroupSetCount } from "@/api/model";
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

const columns: DataTableColumnDef<MuscleGroupSetCount>[] = [
  columnHelper.accessor("muscle_group", {
    header: "Muscle Group",
    cell: (info) => <span className="capitalize">{info.getValue()}</span>,
  }),
  columnHelper.accessor("completed_sets", {
    header: "Sets",
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
          <HoverCardContent>
            <ol className="list-inside list-decimal space-y-2 text-sm">
              <p>
                <span className="bg-accent">
                  {info.row.original.mev - info.row.original.completed_sets}{" "}
                  sets
                </span>{" "}
                missing to reach{" "}
                <span className="bg-accent">Minimum Effective Volume</span> for{" "}
                {info.row.original.muscle_group}.
              </p>
              <p>
                <span className="bg-accent">
                  {info.row.original.mav - info.row.original.completed_sets} -{" "}
                  {info.row.original.mrv - info.row.original.completed_sets}{" "}
                  sets
                </span>{" "}
                missing to reach{" "}
                <span className="bg-accent">Maximum Adaptive Volume</span> for{" "}
                {info.row.original.muscle_group}.
              </p>
            </ol>
          </HoverCardContent>
        </HoverCard>
      );
    },
    meta: { className: "text-center" },
  }),
  columnHelper.accessor("mev", {
    header: "MEV",
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-center" },
  }),
  columnHelper.accessor("mav", {
    header: "MAV",
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-center" },
  }),
  columnHelper.accessor("mrv", {
    header: "MRV",
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-center" },
  }),
];

const WeekSummary = () => {
  const { data: setsOfTheWeek, isLoading } = useGetWeeklyMuscleGroupSets();
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
