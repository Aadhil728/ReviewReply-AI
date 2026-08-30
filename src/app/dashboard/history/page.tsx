import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { HistoryList } from "@/components/dashboard/history-list";
export default async function History() {
  const session = await requireSession();
  const items = await db.reviewGeneration.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <HistoryList
      referenceTime={new Date().toISOString()}
      items={items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))}
    />
  );
}
