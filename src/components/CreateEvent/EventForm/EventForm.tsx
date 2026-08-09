"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Loader2, MapPin, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { eventCategories, eventLocationTypes } from "@/lib/events/constants";
import { categoryLabel } from "@/lib/events/presentation";

const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Add an activity title").max(240),
    description: z.string().trim().max(10000),
    category: z.enum(eventCategories),
    start: z.string().min(1, "Choose a start time"),
    end: z.string().min(1, "Choose an end time"),
    location_type: z.enum(eventLocationTypes),
    location: z.string().trim().max(500),
    meeting_url: z.union([z.literal(""), z.string().url("Enter a valid meeting URL")]),
    capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(10000),
    requires_approval: z.boolean(),
  })
  .superRefine((value, context) => {
    if (new Date(value.end) <= new Date(value.start)) {
      context.addIssue({
        code: "custom",
        path: ["end"],
        message: "End time must follow the start time",
      });
    }
    if (value.location_type === "online" && !value.meeting_url) {
      context.addIssue({
        code: "custom",
        path: ["meeting_url"],
        message: "Add a meeting URL for an online activity",
      });
    }
  });

type EventFormValues = z.infer<typeof eventFormSchema>;

function selectedCoverUrl() {
  try {
    const image = JSON.parse(localStorage.getItem("event-image") ?? "null")?.image;
    return typeof image === "string" && /^https?:\/\//.test(image) ? image : null;
  } catch {
    return null;
  }
}

export default function EventForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "study",
      start: "",
      end: "",
      location_type: "physical",
      location: "",
      meeting_url: "",
      capacity: 6,
      requires_approval: true,
    },
  });

  const locationType = watch("location_type");

  const onSubmit = async (values: EventFormValues) => {
    setSubmitError("");
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          category: values.category,
          content_type: "event",
          start_time: new Date(values.start).toISOString(),
          end_time: new Date(values.end).toISOString(),
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
          location_type: values.location_type,
          location: values.location || null,
          meeting_url: values.meeting_url || null,
          capacity: values.capacity,
          cover_image_url: selectedCoverUrl(),
          requires_approval: values.requires_approval,
        }),
      });
      const result = (await response.json()) as {
        event?: { id: string };
        message?: string;
      };
      if (!response.ok || !result.event) {
        setSubmitError(result.message ?? "The activity could not be created.");
        return;
      }
      router.push(`/events/${result.event.id}`);
      router.refresh();
    } catch {
      setSubmitError("The activity could not be created. Check your connection and try again.");
    }
  };

  const fieldClass =
    "border-zinc-200 bg-white/60 dark:border-zinc-700 dark:bg-zinc-900/50";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-xl space-y-5 rounded-2xl border border-zinc-200/80 bg-white/65 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/65 sm:p-6"
    >
      <div>
        <div className="mb-4 flex w-fit items-center gap-2 rounded-lg bg-zinc-200/70 px-2 py-1 dark:bg-zinc-800/70">
          <div className="size-3 rounded-full bg-pink-500" />
          <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            Personal Calendar
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Create an activity</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Host a study session, game, meetup, or project discussion for other students.
        </p>
      </div>

      <Field label="Title" error={errors.title?.message}>
        <Input
          {...register("title")}
          className={fieldClass}
          placeholder="DSA practice, football, project discussion…"
        />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <Textarea
          {...register("description")}
          className={`${fieldClass} min-h-28 resize-y`}
          placeholder="What will you do, and what should people bring?"
        />
      </Field>

      <Field label="Category" error={errors.category?.message}>
        <select {...register("category")} className={`${fieldClass} h-9 w-full rounded-md border px-3 text-sm`}>
          {eventCategories
            .filter((category) => !["unknown", "career_placement"].includes(category))
            .map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" error={errors.start?.message} icon={<CalendarDays />}>
          <Input {...register("start")} className={fieldClass} type="datetime-local" />
        </Field>
        <Field label="Ends" error={errors.end?.message} icon={<CalendarDays />}>
          <Input {...register("end")} className={fieldClass} type="datetime-local" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location type" error={errors.location_type?.message} icon={<MapPin />}>
          <select
            {...register("location_type")}
            className={`${fieldClass} h-9 w-full rounded-md border px-3 text-sm`}
          >
            {eventLocationTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Capacity" error={errors.capacity?.message} icon={<Users />}>
          <Input {...register("capacity")} className={fieldClass} min={1} max={10000} type="number" />
        </Field>
      </div>

      <Field label="Location" error={errors.location?.message}>
        <Input
          {...register("location")}
          className={fieldClass}
          placeholder={locationType === "online" ? "Optional description" : "Library, field, lab…"}
        />
      </Field>

      {locationType === "online" || locationType === "hybrid" ? (
        <Field label="Meeting URL" error={errors.meeting_url?.message}>
          <Input {...register("meeting_url")} className={fieldClass} placeholder="https://…" type="url" />
        </Field>
      ) : null}

      <label className="flex items-start gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-950/30">
        <input {...register("requires_approval")} className="mt-1 size-4 accent-zinc-900" type="checkbox" />
        <span>
          <span className="block text-sm font-semibold">Approve join requests</span>
          <span className="block text-xs text-zinc-500">You decide who joins before capacity is filled.</span>
        </span>
      </label>

      {submitError ? (
        <p className="text-sm font-medium text-red-500" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {isSubmitting ? "Creating…" : "Create activity"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error?: string;
  icon?: React.ReactElement;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 [&>svg]:size-4">
        {icon} {label}
      </span>
      {children}
      {error ? <span className="block text-xs font-medium text-red-500">{error}</span> : null}
    </label>
  );
}
