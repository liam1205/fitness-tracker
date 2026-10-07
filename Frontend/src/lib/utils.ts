import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import i18n from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats as e.g. "05. October 2026 at 14:03", in i18next's active language. */
export const dateString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");

  return i18n.t("common.dateTime", {
    day: pad(date.getDate()),
    month: date.toLocaleString(i18n.resolvedLanguage, { month: "long" }),
    year: date.getFullYear(),
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  });
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

export const getCurrentWeekNumber = (date = new Date()) => {
  const target = new Date(date.valueOf());

  // Shift to Thursday of the current week (ISO weeks start on Monday, and week 1 contains the year's first Thursday)
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));

  // Get first day of the year
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));

  // Calculate full weeks to target Thursday
  return Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
};
