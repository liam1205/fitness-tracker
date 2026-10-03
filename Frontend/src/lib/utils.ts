import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateString = (date: Date) => {
  const day = date.getDate().toLocaleString().padStart(2, "0");
  const month = date
    .toLocaleString("en-US", { month: "long" })
    .padStart(2, "0");
  const year = date.getFullYear().toLocaleString();

  const hours = date.getHours().toLocaleString().padStart(2, "0");
  const minutes = date.getMinutes().toLocaleString().padStart(2, "0");

  return `${day}. ${month} ${year} at ${hours}:${minutes}`;
};

export const formatDuration = (totalSec: number) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor(totalSec / 3_600) % 24;
  const minutes = Math.floor(totalSec / 60) % 60;
  const seconds = totalSec % 60;

  return [
    days > 0 && `${pad(days)}d`,
    hours > 0 && `${pad(hours)}h`,
    minutes > 0 && `${pad(minutes)}m`,
    `${pad(seconds)}s`,
  ]
    .filter(Boolean)
    .join(" ");
};
