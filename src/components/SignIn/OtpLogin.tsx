"use client";
import React, { useEffect, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter } from "next/navigation";
import { Loader2Icon, LockKeyholeIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import {
  getPendingEmail,
  requestEmailOtp,
  verifyEmailOtp,
} from "@/lib/auth/browser";

const OtpLoginSchema = z.object({
  otp: z.string().length(6, {
    message: "Por favor, insira um código OTP válido.",
  }),
});

type OtpLoginData = z.infer<typeof OtpLoginSchema>;

function OtpLogin({ setWelcome }: { setWelcome: (value: boolean) => void }) {
  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OtpLoginData>({
    resolver: zodResolver(OtpLoginSchema),
  });

  const [resendCountdown, setResendCountdown] = useState(60);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: OtpLoginData) => {
    try {
      setIsLoading(true);
      const user = await verifyEmailOtp(data.otp);
      const displayName = user?.user_metadata.username ?? user?.user_metadata.full_name;
      if (!displayName) {
        router.push("/finish-signup");
        return;
      }

      setWelcome(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify this code.");
      setIsLoading(false);
    }
  };

  const requestOtp = async () => {
    setResendCountdown(60);
    try {
      const email = getPendingEmail();
      if (!email) return router.push("/signin");
      await requestEmailOtp(email);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend the code.");
      setResendCountdown(0);
    }
  };

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const { t } = useTranslation();

  return (
    <div className="flex w-full h-[90vh] items-center">
      <div className="m-auto flex justify-center">
        <motion.div 
            initial={{ scaleX: 0, width: 0, scaleY: 0 }}
            animate={{ scaleX: 1, width: "auto", scaleY: 1 }}
            transition={{ duration: 0.5 }}
            className="border bg-opacity-65 backdrop-blur-5 rounded-3xl
            border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="p-6 flex flex-col gap-3 w-[23rem] text-left">
            <div className="dark:bg-zinc-800 bg-zinc-200 rounded-full p-4 w-fit">
              <LockKeyholeIcon className="text-zinc-700 dark:text-zinc-300 scale-x-[-1] h-8 w-8" />
            </div>
            <h1 className="text-2xl dark:text-zinc-100 text-zinc-900 font-semibold">{t("OTPLogin.title")}</h1>
            <p className="text-sm font-semibold dark:text-zinc-400 text-zinc-600">
            {t("OTPLogin.subtitle")}
            </p>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
              <div className="mx-auto w-full">
                <InputOTP
                  maxLength={6}
                  autoFocus
                  onChange={(value) =>
                    setValue("otp", value, { shouldValidate: true })
                  }
                  className="flex justify-center mx-auto w-full"
                >
                  <InputOTPGroup className="flex gap-3 group dark:text-zinc-50 text-zinc-950 w-full">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-[3rem] transition rounded-lg border-[.075rem] h-[3rem]
                        dark:hover:border-zinc-50 dark:focus:text-zinc-50 dark:border-zinc-400
                        hover:border-zinc-950 focus:text-zinc-950 border-zinc-600
                        "
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {errors.otp && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.otp.message}
                  </p>
                )}
              </div>
              <div className="flex flex-row mt-2 justify-between items-center">
                <Button
                  type="submit"
                  className="bg-zinc-950 text-zinc-200 hover:bg-zinc-700
                  dark:bg-zinc-50 dark:text-zinc-800 dark:hover:bg-zinc-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2Icon className="animate-spin h-5 w-5" />
                    </>
                  ) : (
                    <>{t("OTPLogin.verify")}</>
                    )}
                </Button>
                <Button
                  type="button"
                  disabled={resendCountdown > 0}
                  onClick={requestOtp}
                  className="bg-transparent dark:text-zinc-400 text-zinc-600"
                >
                  {t("OTPLogin.resend")} {resendCountdown > 0 ? `(${resendCountdown}s)` : ""}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
}

export default OtpLogin;
