import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminReviewList } from "@/components/Admin/AdminReviewList";
import { EventShell } from "@/components/Events/EventShell";
import {
  AdminAuthenticationError,
  AdminAuthorizationError,
  requireAdmin,
} from "@/lib/admin/auth";
import { listAdminReviewItems } from "@/lib/admin/review";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin Review · LeviClub" };
export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  const supabase = await createSupabaseServerClient();
  try {
    await requireAdmin(supabase);
  } catch (error) {
    if (error instanceof AdminAuthenticationError) redirect("/signin?next=/admin/review");
    if (error instanceof AdminAuthorizationError) redirect("/home");
    throw error;
  }
  const review = await listAdminReviewItems(supabase);

  return (
    <EventShell>
      <div className="mb-7">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Campus operations</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Email event review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          Check uncertain or rejected email extractions, correct their details, then publish or reject them.
        </p>
      </div>
      <AdminReviewList {...review} />
    </EventShell>
  );
}
