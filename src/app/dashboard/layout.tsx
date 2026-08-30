import { AppShell } from "@/components/dashboard/app-shell";
import { db } from "@/lib/db";
import { getUsageSummary } from "@/lib/plans";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const [business, usage] = await Promise.all([
    db.business.findFirst({ where: { userId: session.user.id } }),
    getUsageSummary(session.user.id),
  ]);
  if (!business) {
    const { redirect } = await import("next/navigation");
    redirect("/onboarding");
  }
  return (
    <AppShell
      user={{ name: session.user.name, email: session.user.email }}
      used={usage.used}
      total={usage.generationLimit}
    >
      {children}
    </AppShell>
  );
}
