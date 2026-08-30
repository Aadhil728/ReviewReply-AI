import { Menu } from "lucide-react";
import { Brand } from "@/components/branding/brand";
import { DashboardNav } from "./dashboard-nav";
import { ThemeToggle } from "./theme-toggle";
import { SignOut } from "./sign-out";
import { UsageMeter } from "./usage-meter";
import { BrandAttribution } from "@/components/branding/brand-attribution";

type AppShellProps = {
  children: React.ReactNode;
  user: { name: string; email: string };
  used?: number;
  total?: number;
};

function UserIdentity({ user }: { user: AppShellProps["user"] }) {
  return (
    <>
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-primary">
        {user.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="hidden min-w-0 sm:block">
        <p className="max-w-36 truncate text-sm font-semibold leading-5">
          {user.name}
        </p>
        <p className="max-w-36 truncate text-xs text-muted-foreground">
          {user.email}
        </p>
      </div>
    </>
  );
}

export function AppShell({
  children,
  user,
  used = 0,
  total = 10,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/35 md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen border-r bg-card p-4 md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <Brand className="px-2 py-2" />
        <nav className="mt-8 space-y-1" aria-label="Dashboard navigation">
          <DashboardNav />
        </nav>

        <div className="mt-auto">
          <UsageMeter initialUsed={used} initialTotal={total} />
          <p className="mt-4 text-center text-[10px] text-muted-foreground">
            <BrandAttribution prefix="product" />
          </p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Brand className="md:hidden" />
            <div className="hidden md:block">
              <p className="text-sm font-semibold">Workspace</p>
              <p className="text-xs text-muted-foreground">
                Create thoughtful customer replies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 border-r pr-3 sm:flex">
              <UserIdentity user={user} />
            </div>
            <ThemeToggle />
            <SignOut />

            <details className="group relative md:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Menu className="size-5" />
                <span className="sr-only">Open navigation</span>
              </summary>
              <nav
                className="absolute right-0 top-12 w-64 rounded-2xl border bg-card p-2 shadow-xl"
                aria-label="Mobile dashboard navigation"
              >
                <div className="mb-2 flex items-center gap-3 border-b p-3">
                  <UserIdentity user={user} />
                </div>
                <DashboardNav mobile />
                <div className="m-2 mt-3 rounded-xl bg-muted/60 p-3">
                  <UsageMeter initialUsed={used} initialTotal={total} compact />
                </div>
              </nav>
            </details>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
