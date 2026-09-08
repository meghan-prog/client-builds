import Link from "next/link";
import { format, startOfWeek } from "date-fns";

const currentWeekStart = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

const NAV_ITEMS = [
  { href: "/week", label: "Week", icon: "🗓️" },
  { href: "/school", label: "School", icon: "🏫" },
  { href: "/children", label: "Kinderen", icon: "🧒" },
  { href: "/learning", label: "Leren", icon: "🎓" },
  { href: "/tasks", label: "Taken", icon: "🧺" },
  { href: "/shopping", label: "Boodschappen", icon: "🛒" },
  { href: "/settings", label: "Instellingen", icon: "⚙️" },
];

export default function NavShell({ children }: { children: React.ReactNode }) {
  const weekHref = `/week/${currentWeekStart()}`;

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <aside className="flex shrink-0 flex-row items-center justify-between border-b border-border bg-surface px-4 py-3 md:w-60 md:flex-col md:items-stretch md:justify-start md:border-b-0 md:border-r md:px-4 md:py-6">
        <Link href={weekHref} className="flex items-center gap-2 px-1 md:mb-8 md:px-2">
          <span className="text-2xl">🏡</span>
          <span className="font-semibold tracking-tight text-ink">Home OS</span>
        </Link>

        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href === "/week" ? weekHref : item.href}
              className="flex shrink-0 items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink md:rounded-xl md:px-3 md:py-2.5"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link
          href="/kids"
          className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-sage-soft px-3 py-2 text-sm font-semibold text-sage md:ml-0 md:mt-8 md:justify-center"
        >
          <span>🧸</span>
          <span className="hidden md:inline">Kindmodus</span>
        </Link>
      </aside>

      <main className="min-w-0 flex-1 bg-bg">{children}</main>
    </div>
  );
}
