import { InstallerForm } from "@/components/install/installer-form";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InstallPage() {
  let installed = false;
  try {
    installed =
      (await db.installationState.findUnique({ where: { id: "primary" } }))
        ?.installed ?? false;
  } catch {
    /* The page still explains the database prerequisite. */
  }
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6 py-12">
      <p className="eyebrow">Self-hosted setup</p>
      <h1 className="mt-2 text-4xl font-bold">Install ReviewReply AI</h1>
      <p className="mt-3 text-muted-foreground">
        Before continuing, configure the database URL, authentication secret,
        encryption key, application URL, and installation token on the server.
      </p>
      {installed ? (
        <section className="mt-8 rounded-2xl border bg-card p-8">
          <h2 className="text-xl font-bold">Installer locked</h2>
          <p className="mt-2 text-muted-foreground">
            This installation is complete. The public installer cannot be run
            again.
          </p>
        </section>
      ) : (
        <InstallerForm />
      )}
    </main>
  );
}
