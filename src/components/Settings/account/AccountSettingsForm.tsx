"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BsInstagram,
  BsLinkedin,
  BsTiktok,
  BsTwitterX,
  BsYoutube,
} from "react-icons/bs";
import { Loader2, UserCheck2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { UserImageUploadInput } from "./UserImageUploadInput";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  username: z
    .string()
    .trim()
    .min(3, "Use at least three characters.")
    .max(40)
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Use letters, numbers, dots, dashes, or underscores.",
    ),
  bio: z.string().trim().max(500).default(""),
  social: z.object({
    instagram: z.string().max(100).default(""),
    twitter: z.string().max(100).default(""),
    youtube: z.string().max(100).default(""),
    tiktok: z.string().max(100).default(""),
    linkedin: z.string().max(160).default(""),
  }),
});

type ProfileForm = z.infer<typeof profileSchema>;

const defaultValues: ProfileForm = {
  name: "",
  username: "",
  bio: "",
  social: {
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
  },
};

const inputClass =
  "border-zinc-300 text-zinc-950 transition hover:border-zinc-600 focus-visible:border-zinc-950 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-400 dark:focus-visible:border-zinc-50";

export function AccountSettingsForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues,
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load your profile.");
        return response.json() as Promise<ProfileForm>;
      })
      .then((profile) => reset(profile))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Unable to load your profile."),
      )
      .finally(() => setIsLoading(false));
  }, [reset]);

  async function onSubmit(data: ProfileForm) {
    try {
      setIsSaving(true);
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to save your profile.");
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-2">
      <Toaster position="bottom-center" />
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Your Profile
      </h1>
      <p className="text-zinc-700 dark:text-zinc-300">
        Choose how you will be displayed as a host or guest.
      </p>

      {isLoading ? (
        <div className="flex min-h-52 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-zinc-500" />
        </div>
      ) : (
        <form className="mt-3" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div className="order-2 flex flex-col gap-4 sm:order-1">
              <Field label="Name" error={errors.name?.message}>
                <Input className={inputClass} id="name" {...register("name")} />
              </Field>
              <Field label="Username" error={errors.username?.message}>
                <div className="flex items-center">
                  <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-200 px-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    @
                  </span>
                  <Input
                    className={`${inputClass} rounded-l-none`}
                    id="username"
                    {...register("username")}
                  />
                </div>
              </Field>
              <Field label="Bio" error={errors.bio?.message}>
                <Textarea
                  className={`${inputClass} min-h-24 rounded-lg`}
                  id="bio"
                  maxLength={500}
                  placeholder="Share a bit about your interests, work, or hobbies."
                  {...register("bio")}
                />
              </Field>
            </div>
            <div className="order-1 sm:order-2">
              <UserImageUploadInput />
            </div>
          </div>

          <div className="mt-7 border-t border-zinc-200 pt-7 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Social Links
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SocialField icon={<BsInstagram />} prefix="instagram.com/">
                <Input className={inputClass} {...register("social.instagram")} />
              </SocialField>
              <SocialField icon={<BsTwitterX />} prefix="x.com/">
                <Input className={inputClass} {...register("social.twitter")} />
              </SocialField>
              <SocialField icon={<BsYoutube />} prefix="youtube.com/@">
                <Input className={inputClass} {...register("social.youtube")} />
              </SocialField>
              <SocialField icon={<BsTiktok />} prefix="tiktok.com/@">
                <Input className={inputClass} {...register("social.tiktok")} />
              </SocialField>
              <SocialField icon={<BsLinkedin />} prefix="linkedin.com">
                <Input className={inputClass} {...register("social.linkedin")} />
              </SocialField>
            </div>
          </div>

          <Button
            className="mt-6 bg-zinc-950 hover:bg-zinc-700 dark:bg-zinc-50 dark:hover:bg-zinc-300"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? (
              <Loader2 className="size-5 animate-spin dark:text-zinc-800" />
            ) : (
              <UserCheck2 className="size-5 dark:text-zinc-800" />
            )}
            <span className="font-medium text-zinc-100 dark:text-zinc-800">
              Save Changes
            </span>
          </Button>
        </form>
      )}
    </div>
  );
}

function Field({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
      {label}
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

function SocialField({
  children,
  icon,
  prefix,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  prefix: string;
}) {
  return (
    <label className="flex min-w-0 items-center gap-3">
      <span className="text-zinc-500">{icon}</span>
      <span className="flex min-w-0 flex-1 items-center">
        <span className="flex h-10 shrink-0 items-center rounded-l-lg border border-r-0 border-zinc-300 bg-zinc-200 px-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {prefix}
        </span>
        <span className="min-w-0 flex-1 [&>input]:rounded-l-none">{children}</span>
      </span>
    </label>
  );
}
