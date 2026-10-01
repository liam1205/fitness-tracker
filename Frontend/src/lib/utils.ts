import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const dateString = (date: Date) => {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${day}. ${month} ${year} at ${hours}:${minutes}`;
};

export const timeSpentSec = (startDate: Date, endDate: Date) => {
  return Math.round((endDate.getTime() - startDate.getTime()) / 1_000);
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

export const timeSpentMin = (startDate: Date, endDate: Date) => {
  return Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
};
