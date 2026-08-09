"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminReviewItem, ReviewOrganization } from "@/lib/admin/review";
import { categoryLabel } from "@/lib/events/presentation";
import { eventCategories, eventContentTypes, eventLocationTypes, eventTypes } from "@/lib/events/constants";

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function isoDateTime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function AdminReviewList({ items, organizations }: { items: AdminReviewItem[]; organizations: ReviewOrganization[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-zinc-200/80 bg-white/65 p-8 text-center shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/65">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">Review queue is clear</p>
        <p className="mt-1 text-sm text-zinc-500">New uncertain email extractions will appear here.</p>
      </div>
    );
  }
  return <div className="space-y-5">{items.map((item) => <ReviewCard key={item.event.id} item={item} organizations={organizations} />)}</div>;
}

function ReviewCard({ item, organizations }: { item: AdminReviewItem; organizations: ReviewOrganization[] }) {
  const router = useRouter();
  type Action = "publish" | "reject" | "apply_update" | "create_new";
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState("");
  const event = item.event;
  const fieldClass = "h-9 w-full rounded-md border border-zinc-200 bg-white/60 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900/50";

  async function submit(form: HTMLFormElement, action: Action) {
    setBusy(action);
    setError("");
    const values = new FormData(form);
    const nullable = (name: string) => String(values.get(name) || "").trim() || null;
    const numeric = nullable("capacity");
    const confidence = nullable("confidence_score");
    const body = {
      action,
      event: {
        title: String(values.get("title") || ""), description: nullable("description"),
        category: values.get("category"), organization_id: nullable("organization_id"),
        event_type: values.get("event_type"), content_type: values.get("content_type"),
        start_time: isoDateTime(String(values.get("start_time") || "")),
        end_time: isoDateTime(String(values.get("end_time") || "")), timezone: values.get("timezone"),
        location_type: values.get("location_type"), location: nullable("location"),
        meeting_url: nullable("meeting_url"), capacity: numeric ? Number(numeric) : null,
        registration_url: nullable("registration_url"),
        registration_deadline: isoDateTime(String(values.get("registration_deadline") || "")),
        confidence_score: confidence ? Number(confidence) : null,
        possible_duplicate: values.get("possible_duplicate") === "on",
      },
    };
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Review could not be saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget, "publish"); }} className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/65 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-zinc-500">
            <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-950 dark:text-amber-300">{event.status.replace("_", " ")}</span>
            <span>{item.organizationName || "Unknown organization"}</span>
            {event.confidence_score == null ? <span>Confidence unavailable</span> : <span>{Math.round(event.confidence_score * 100)}% confidence</span>}
          </div>
          {item.inbound ? <p className="mt-2 text-xs text-zinc-500">From {item.inbound.from_email} · {item.inbound.subject}</p> : null}
        </div>
        {item.inbound?.attachment_metadata.length ? <span className="text-xs font-medium text-zinc-500">{item.inbound.attachment_metadata.length} attachment(s) preserved</span> : null}
      </div>

      {item.proposedUpdateFor ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Possible update to {item.proposedUpdateFor.title}
          </p>
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div><span className="font-semibold">Old</span><p>{localDateTime(item.proposedUpdateFor.start_time) || "Date unknown"}</p><p>{item.proposedUpdateFor.location || "Location unknown"}</p></div>
            <div><span className="font-semibold">New</span><p>{localDateTime(event.start_time) || "Date unknown"}</p><p>{event.location || "Location unknown"}</p></div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" wide><input className={fieldClass} name="title" defaultValue={event.title} required /></Field>
        <Field label="Description" wide><textarea className={`${fieldClass} min-h-24 py-2`} name="description" defaultValue={event.description ?? ""} /></Field>
        <Field label="Category"><select className={fieldClass} name="category" defaultValue={event.category}>{eventCategories.map((value) => <option key={value} value={value}>{categoryLabel(value)}</option>)}</select></Field>
        <Field label="Organizer"><select className={fieldClass} name="organization_id" defaultValue={event.organization_id ?? ""}><option value="">Unknown organization</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></Field>
        <Field label="Starts"><input className={fieldClass} name="start_time" type="datetime-local" defaultValue={localDateTime(event.start_time)} /></Field>
        <Field label="Ends"><input className={fieldClass} name="end_time" type="datetime-local" defaultValue={localDateTime(event.end_time)} /></Field>
        <Field label="Timezone"><input className={fieldClass} name="timezone" defaultValue={event.timezone} required /></Field>
        <Field label="Location type"><select className={fieldClass} name="location_type" defaultValue={event.location_type}>{eventLocationTypes.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Location"><input className={fieldClass} name="location" defaultValue={event.location ?? ""} /></Field>
        <Field label="Meeting URL"><input className={fieldClass} name="meeting_url" type="url" defaultValue={event.meeting_url ?? ""} /></Field>
        <Field label="Registration URL"><input className={fieldClass} name="registration_url" type="url" defaultValue={event.registration_url ?? ""} /></Field>
        <Field label="Registration deadline"><input className={fieldClass} name="registration_deadline" type="datetime-local" defaultValue={localDateTime(event.registration_deadline)} /></Field>
        <Field label="Event type"><select className={fieldClass} name="event_type" defaultValue={event.event_type}>{eventTypes.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Content type"><select className={fieldClass} name="content_type" defaultValue={event.content_type}>{eventContentTypes.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Capacity"><input className={fieldClass} name="capacity" min="1" type="number" defaultValue={event.capacity ?? ""} /></Field>
        <Field label="Confidence (0–1)"><input className={fieldClass} name="confidence_score" min="0" max="1" step="0.001" type="number" defaultValue={event.confidence_score ?? ""} /></Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400"><input name="possible_duplicate" type="checkbox" defaultChecked={event.possible_duplicate} /> Possible duplicate</label>
      {error ? <p className="mt-4 text-sm font-medium text-red-500" role="alert">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-3 border-t border-zinc-200/80 pt-5 dark:border-zinc-800">
        <button type="button" disabled={busy !== null} onClick={(e) => void submit(e.currentTarget.form!, "reject")} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{busy === "reject" ? "Rejecting…" : "Reject"}</button>
        {item.proposedUpdateFor ? (
          <>
            <button type="button" disabled={busy !== null} onClick={(e) => void submit(e.currentTarget.form!, "create_new")} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">{busy === "create_new" ? "Creating…" : "Create New"}</button>
            <button type="button" disabled={busy !== null} onClick={(e) => void submit(e.currentTarget.form!, "apply_update")} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300">{busy === "apply_update" ? "Applying…" : "Apply Update"}</button>
          </>
        ) : (
          <button type="submit" disabled={busy !== null} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300">{busy === "publish" ? "Publishing…" : "Publish"}</button>
        )}
      </div>
    </form>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><span className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>{children}</label>;
}
