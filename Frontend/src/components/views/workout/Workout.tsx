import { useGetWorkoutSession } from "@/api/endpoints/workout-sessions/workout-sessions";
import { useParams, useRouter } from "@tanstack/react-router";

const Workout = () => {
  const { workoutId: sessionId } = useParams({
    from: "/_authenticated/workouts/$workoutId",
  });
  const { data } = useGetWorkoutSession(sessionId);
  return <div>{data.template_name}</div>;
};

export default Workout;
