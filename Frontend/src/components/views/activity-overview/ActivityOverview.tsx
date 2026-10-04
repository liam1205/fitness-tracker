import { useGetDailySessionCounts } from "@/api/endpoints";

const ActivityOverview = () => {
  const { data: activity } = useGetDailySessionCounts({ weeks: 4 });
  console.log(activity);
  return (
    <div className="w-full h-full flex flex-col gap-3 justify-center items-center">
      {activity?.map((week) => (
        <div className="flex flex-row gap-3 justify-center items-center">
          {" "}
          {week.map((amount) => (
            <div className="size-2.5 flex flex-col justify-center items-center text-xs">
              {amount}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ActivityOverview;
