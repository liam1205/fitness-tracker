import { useGetWeeklyMuscleGroupSets } from "@/api/endpoints/workout-sessions/workout-sessions";
import type { MuscleGroupSetCount } from "@/api/model";
import { Badge } from "@/components/ui/badge";
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
    cell: (info) => (
      <Badge variant={setsColorClass(info.row.original)}>
        {info.getValue()}
      </Badge>
    ),
    meta: { className: "text-right" },
  }),
  columnHelper.accessor("mev", {
    header: "MEV",
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-right" },
  }),
  columnHelper.accessor("mav", {
    header: "MAV",
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-right" },
  }),
  columnHelper.accessor("mrv", {
    header: "MRV",
    cell: (info) => optionalSets(info.getValue()),
    meta: { className: "text-right" },
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
