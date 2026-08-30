import { db } from "@/lib/db";

export default async function AdminAuditPage() {
  const logs = await db.adminAuditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <div>
        <p className="eyebrow">Security trail</p>
        <h1 className="mt-2 text-3xl font-bold">Admin audit log</h1>
        <p className="mt-2 text-muted-foreground">
          Sensitive owner actions are recorded for accountability and
          troubleshooting.
        </p>
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Administrator</th>
              <th className="p-4">Action</th>
              <th className="p-4">Target</th>
              <th className="p-4">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="p-4 text-muted-foreground">
                  {log.createdAt.toLocaleString()}
                </td>
                <td className="p-4">
                  <p className="font-semibold">
                    {log.actor?.name ?? "Deleted administrator"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.actor?.email}
                  </p>
                </td>
                <td className="p-4 font-semibold">
                  {log.action.replaceAll("_", " ")}
                </td>
                <td className="p-4">
                  {log.targetType}
                  {log.targetId ? ` · ${log.targetId}` : ""}
                </td>
                <td className="p-4 text-muted-foreground">
                  {log.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No administrative actions have been recorded yet.
          </p>
        )}
      </div>
    </>
  );
}
