import { cn } from "@/lib/utils";
import type React from "react";

type Props = {
  message?: string | React.ReactNode;
};

const EmptyIndicator = ({ message }: Props) => {
  return (
    <div
      className={cn(
        "flex flex-row justify-center items-center text-muted-foreground w-full h-full py-2",
      )}
    >
      {message && <span>{message}</span>}
      {!message && <>No data available.</>}
    </div>
  );
};

export default EmptyIndicator;
