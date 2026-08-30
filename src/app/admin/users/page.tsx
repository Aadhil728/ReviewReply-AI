import { Prisma, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { recordAdminAction } from "@/lib/admin-audit";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

const PAGE_SIZE = 20;

async function updateUser(formData: FormData) {
  "use server";
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const operation = String(formData.get("operation") ?? "");
  if (!userId) redirect("/admin/users?error=Invalid user.");
  if (userId === session.user.id)
    redirect(
      "/admin/users?error=You cannot change your own role or account status.",
    );
  if (operation !== "toggle-status" && operation !== "toggle-role")
    redirect("/admin/users?error=Unsupported user operation.");
  const result = await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('active-admin-safety'))`;
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true, isActive: true },
    });
    if (!target) return { error: "User not found." } as const;
    const removesActiveAdmin =
      target.role === UserRole.ADMIN && target.isActive;
    if (
      removesActiveAdmin &&
      (await tx.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      })) <= 1
    )
      return {
        error: "The final active administrator cannot be disabled or demoted.",
      } as const;
    if (operation === "toggle-status")
      await tx.user.update({
        where: { id: userId },
        data: { isActive: !target.isActive },
      });
    else
      await tx.user.update({
        where: { id: userId },
        data: {
          role: target.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN,
        },
      });
    return { target } as const;
  });
  if ("error" in result && result.error)
    redirect(`/admin/users?error=${encodeURIComponent(result.error)}`);
  const { target } = result;
  await recordAdminAction({
    actorId: session.user.id,
    action:
      operation === "toggle-status"
        ? target.isActive
          ? "USER_DISABLED"
          : "USER_ENABLED"
        : target.role === UserRole.ADMIN
          ? "ADMIN_DEMOTED"
          : "ADMIN_PROMOTED",
    targetType: "User",
    targetId: userId,
    metadata: { email: target.email },
  });
  redirect("/admin/users?notice=User account updated.");
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
    notice?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const role =
    params.role === "ADMIN" || params.role === "USER" ? params.role : undefined;
  const isActive =
    params.status === "active"
      ? true
      : params.status === "disabled"
        ? false
        : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const where: Prisma.UserWhereInput = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role ? { role } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
  };
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { generations: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <>
      <div>
        <p className="eyebrow">Accounts</p>
        <h1 className="mt-2 text-3xl font-bold">Users</h1>
        <p className="mt-2 text-muted-foreground">
          Search accounts, control access, and assign administrator
          responsibility safely.
        </p>
      </div>
      <AdminNotice notice={params.notice} error={params.error} />
      <form className="mt-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-[minmax(220px,1fr)_160px_160px_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name or email"
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        />
        <select
          name="role"
          defaultValue={role ?? ""}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-10 rounded-xl border bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b text-muted-foreground">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Generations</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0">
                <td className="p-4">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">
                  {user.subscription?.plan.name ?? "Free"}
                </td>
                <td className="p-4">{user._count.generations}</td>
                <td className="p-4">{user.isActive ? "Active" : "Disabled"}</td>
                <td className="p-4">
                  <form action={updateUser} className="flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <ConfirmSubmitButton
                      name="operation"
                      value="toggle-status"
                      message={`${user.isActive ? "Disable" : "Enable"} ${user.email}?`}
                    >
                      {user.isActive ? "Disable" : "Enable"}
                    </ConfirmSubmitButton>
                    <ConfirmSubmitButton
                      name="operation"
                      value="toggle-role"
                      variant="ghost"
                      message={`Change the role for ${user.email}?`}
                    >
                      {user.role === "ADMIN" ? "Make user" : "Make admin"}
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No users match these filters.
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} user{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <Button asChild size="sm" variant="secondary">
              <Link
                href={{
                  pathname: "/admin/users",
                  query: {
                    ...params,
                    page: page - 1,
                    notice: undefined,
                    error: undefined,
                  },
                }}
              >
                Previous
              </Link>
            </Button>
          )}
          <span className="px-2 py-2">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Button asChild size="sm" variant="secondary">
              <Link
                href={{
                  pathname: "/admin/users",
                  query: {
                    ...params,
                    page: page + 1,
                    notice: undefined,
                    error: undefined,
                  },
                }}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
