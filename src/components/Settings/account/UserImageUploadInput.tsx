"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getBrowserUser } from "@/lib/auth/browser";

export function UserImageUploadInput() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    getBrowserUser()
      .then((user) => {
        const avatar = user?.user_metadata.avatar_url;
        if (typeof avatar === "string" && avatar.startsWith("http")) {
          setImageUrl(avatar);
        }
      })
      .catch(() => undefined);
  }, []);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Choose a PNG or JPEG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("The maximum profile image size is 5 MB.");
      return;
    }

    try {
      setIsUploading(true);
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/user/upload-image", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as { message?: string; url?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.message ?? "Unable to upload your image.");
      }
      setImageUrl(result.url);
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload your image.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Profile Photo
      </span>
      <label
        className="group relative size-28 cursor-pointer overflow-hidden rounded-full bg-gradient-to-tl from-[#F66371] to-[#C0CEF6]"
        htmlFor="profile-image"
      >
        {imageUrl ? (
          <Image
            alt="Profile"
            className="size-28 object-cover"
            height={224}
            src={imageUrl}
            width={224}
          />
        ) : null}
        <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-zinc-200 bg-zinc-950 text-zinc-100 transition group-hover:bg-pink-500 dark:border-zinc-800 dark:bg-zinc-50 dark:text-zinc-900">
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </span>
        <input
          accept="image/jpeg,image/png"
          className="hidden"
          disabled={isUploading}
          id="profile-image"
          onChange={uploadImage}
          type="file"
        />
      </label>
      <span className="text-xs text-zinc-500">PNG or JPEG, up to 5 MB.</span>
    </div>
  );
}
