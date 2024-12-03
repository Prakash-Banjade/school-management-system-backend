import { format } from "date-fns";

export const ISO_TIME = 'T00:00:00Z' as const;

export function startOfDayString(date: Date) {
    return format(date, 'yyyy-MM-dd') + ISO_TIME;
}