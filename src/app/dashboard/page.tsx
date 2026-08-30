import type { Metadata } from "next";
import { Generator } from "@/components/dashboard/generator";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  const [user, businesses] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.user.id },
      select: { defaultLength: true, defaultLanguage: true },
    }),
    db.business.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return (
    <Generator
      defaultLength={user.defaultLength}
      defaultLanguage={user.defaultLanguage}
      businesses={businesses}
    />
  );
}
