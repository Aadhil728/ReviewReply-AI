import { Menu } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Brand } from "@/components/branding/brand";
import { SignOut } from "@/components/dashboard/sign-out";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <div className="min-h-screen bg-muted/35 md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r bg-card p-4 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <Brand className="px-2 py-2" />
        <div className="mt-3 px-2">
          <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Owner admin
          </span>
        </div>
        <nav className="mt-8" aria-label="Administration">
          <AdminNav />
        </nav>
        <div className="mt-auto border-t pt-4">
          <p className="truncate px-3 text-sm font-semibold">
            {session.user.name}
          </p>
          <p className="truncate px-3 text-xs text-muted-foreground">
            {session.user.email}
          </p>
          <a
            href="/dashboard"
            className="mt-3 block rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Open customer dashboard
          </a>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold">Administration</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Manage your installation, users, plans, and providers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOut />
            <details className="group relative md:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground">
                <Menu className="size-5" />
                <span className="sr-only">Open admin navigation</span>
              </summary>
              <nav
                className="absolute right-0 top-12 w-64 rounded-2xl border bg-card shadow-xl"
                aria-label="Mobile administration"
              >
                <div className="border-b p-4">
                  <p className="truncate text-sm font-semibold">
                    {session.user.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <AdminNav mobile />
              </nav>
            </details>
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
