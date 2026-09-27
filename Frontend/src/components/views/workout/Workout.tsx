import { useGetWorkoutSession } from "@/api/endpoints/workout-sessions/workout-sessions";
import { useParams, useRouter } from "@tanstack/react-router";
import { PageLayout } from "../main/PageLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { SessionSetRead } from "@/api/model/sessionSetRead";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import {
  BadgeCheck,
  BookmarkIcon,
  Check,
  CircleCheck,
  CircleDashed,
  SquareCheck,
  X,
} from "lucide-react";
import { useState } from "react";

const Workout = () => {
  const { workoutId: sessionId } = useParams({
    from: "/_authenticated/workouts/$workoutId",
  });
  const { data } = useGetWorkoutSession(sessionId);
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold tracking-tight">
        {data?.template_name}
      </h1>
      <div className="flex flex-col gap-3">
        {data?.exercises.map((exercise) => (
          <Card>
            <CardHeader>{exercise.name}</CardHeader>
            <CardContent className="flex flex-col gap-2">
              {exercise.sets.map((set) => (
                <Set key={set.id} set={set}></Set>
              ))}
            </CardContent>
            <CardFooter></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

type SetProps = {
  set: SessionSetRead;
};

const Set = ({ set }: SetProps) => {
  const [pressed, setPressed] = useState(false);
  return (
    <div className="flex flex-row justify-between px-3 items-center">
      <div className="flex flex-row w-1/15">{set.set_number}</div>
      <div className="flex items-center gap-2 w-14/15">
        <Input placeholder="Weight" className="w-fit"></Input>
        <Input placeholder="Reps" className="w-fit"></Input>
        <Toggle pressed={pressed} onPressedChange={setPressed} className="w-4">
          {pressed ? (
            <Check className="h-4 w-4" />
          ) : (
            <CircleDashed className="h-4 w-4" />
          )}
        </Toggle>
      </div>
    </div>
  );
};

export default Workout;
