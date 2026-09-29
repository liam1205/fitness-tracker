import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const dateString = (date: Date) => {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${day}. ${month} ${year} at ${hours}:${minutes}`;
};

export const timeSpent = (startDate: Date, endDate: Date) => {
  return Math.round((endDate.getTime() - startDate.getTime()) / 60_000);
};
