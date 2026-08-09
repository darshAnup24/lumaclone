"use client";

import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getBrowserUser, requestMagicLink } from "@/lib/auth/browser";

const SignInSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
});

type SignInData = z.infer<typeof SignInSchema>;

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

export function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInData>({
    resolver: zodResolver(SignInSchema),
  });
  const { t } = useTranslation();

  const router = useRouter();

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) toast.error(message);
  }, []);

  const [isSessionChecked, setIsSessionChecked] = useState(false);
  useEffect(() => {
    if (isSessionChecked) return;

    getBrowserUser()
      .then((user) => {
        if (user) router.replace("/home");
      })
      .catch(() => undefined)
      .finally(() => setIsSessionChecked(true));
  }, [isSessionChecked, router]);

  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (data: SignInData) => {
    try {
      setIsLoading(true);
      await requestMagicLink(data.email);
      setSentTo(data.email.trim().toLowerCase());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to start email sign-in. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <Toaster position="top-center" />
      <div className="flex flex-col gap-2">
        {sentTo ? (
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold dark:text-zinc-100 text-zinc-900">
                Check your email
              </p>
              <p className="mt-1 text-sm dark:text-zinc-400 text-zinc-600">
                We sent a secure sign-in link to {sentTo}. Click it to continue
                to LeviClub.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="p-2 rounded-lg transition font-medium dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            <label
              htmlFor="email"
              className="hover:cursor-pointer font-semibold text-sm dark:hover:text-zinc-100 dark:text-zinc-300 hover:text-zinc-900 text-zinc-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder={t("SignIn.emailPlaceholder")}
              className="p-2 transition border-[.075rem] rounded-lg
              dark:placeholder-zinc-600 dark:hover:border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 
              placeholder-zinc-400 hover:border-zinc-800 bg-zinc-100 border-zinc-300 text-zinc-900 "
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email.message}</p>
            )}
            <Button
              type="submit"
              className="mt-2 p-2 rounded-lg transition font-medium text-center
              dark:bg-zinc-50 dark:text-zinc-800 dark:hover:bg-zinc-300
              bg-zinc-950 text-zinc-200 hover:bg-zinc-700
              "
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2Icon className="animate-spin h-5 w-5" />
              ) : (
                t("SignIn.continueWith.email")
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
