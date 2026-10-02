import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CompleteBlockedTooltipProps = {
  /** Whether completing is currently blocked because sets are still open. */
  blocked: boolean;
  children: ReactNode;
};

/**
 * Explains why a "complete workout" button is disabled. A disabled button
 * swallows pointer events, so the tooltip hangs off a wrapper around it.
 */
export function CompleteBlockedTooltip({
  blocked,
  children,
}: CompleteBlockedTooltipProps) {
  if (!blocked) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Keeps clicks on the disabled button from reaching a clickable parent. */}
        <span
          tabIndex={0}
          className="inline-flex"
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Complete all sets in the workout to finish it.
      </TooltipContent>
    </Tooltip>
  );
}
