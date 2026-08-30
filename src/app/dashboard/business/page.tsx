import Link from "next/link";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { BusinessProfileForm } from "@/components/dashboard/business-profile-form";
import { CreateBusinessForm } from "@/components/dashboard/create-business-form";
import { getUserEntitlements } from "@/lib/plans";
import { cn } from "@/lib/utils";

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const session = await requireSession();
  const requestedId = (await searchParams).business;
  const [businesses, entitlements] = await Promise.all([
    db.business.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    }),
    getUserEntitlements(session.user.id),
  ]);
  const business =
    businesses.find((item) => item.id === requestedId) ?? businesses[0];
  if (!business) return null;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Brand voice</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Business profiles
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage the context used to write each business&apos;s replies.
          </p>
        </div>
        {businesses.length < entitlements.businessLimit ? (
          <CreateBusinessForm />
        ) : null}
      </div>
      {businesses.length > 1 ? (
        <nav
          className="mb-5 flex flex-wrap gap-2"
          aria-label="Business profiles"
        >
          {businesses.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/business?business=${item.id}`}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold",
                item.id === business.id
                  ? "bg-accent text-primary"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      ) : null}
      <BusinessProfileForm business={business} showHeading={false} />
      <p className="mt-3 text-xs text-muted-foreground">
        {businesses.length} of {entitlements.businessLimit} business profiles
        used.
      </p>
    </>
  );
}
