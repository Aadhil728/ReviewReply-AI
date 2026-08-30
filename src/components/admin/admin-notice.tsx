export function AdminNotice({
  notice,
  error,
}: {
  notice?: string;
  error?: string;
}) {
  const message = error || notice;
  if (!message) return null;
  return (
    <div
      role="status"
      className={
        error
          ? "mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
          : "mt-6 rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success"
      }
    >
      {message}
    </div>
  );
}
