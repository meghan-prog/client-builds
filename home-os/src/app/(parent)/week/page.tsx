import { redirect } from "next/navigation";
import { format, startOfWeek } from "date-fns";

export default function WeekIndexPage() {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  redirect(`/week/${weekStart}`);
}
