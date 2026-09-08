import NavShell from "@/components/NavShell";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <NavShell>{children}</NavShell>;
}
