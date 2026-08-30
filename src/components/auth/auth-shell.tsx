import { Brand } from "@/components/branding/brand";
import { BrandAttribution } from "@/components/branding/brand-attribution";
import { AuthForm } from "./auth-form";

export function AuthShell({ mode }: { mode: "login" | "register" }) {
  const register = mode === "register";
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Brand />
          <div className="mt-12">
            <h1 className="text-3xl font-bold tracking-tight">
              {register ? "Start writing better replies" : "Welcome back"}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {register
                ? "Create your account and generate your first response in minutes."
                : "Sign in to continue to your workspace."}
            </p>
          </div>
          <div className="mt-8">
            <AuthForm mode={mode} />
          </div>
          <p className="mt-10 text-center text-xs text-muted-foreground">
            <BrandAttribution />
          </p>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden border-l bg-muted/60 p-12 lg:flex lg:items-end">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_40%)]" />
        <blockquote className="relative max-w-lg text-3xl font-semibold leading-tight tracking-tight">
          “Better replies. Stronger customer relationships.”
          <footer className="mt-5 text-sm font-medium text-muted-foreground">
            <BrandAttribution prefix="product" />
          </footer>
        </blockquote>
      </aside>
    </main>
  );
}
