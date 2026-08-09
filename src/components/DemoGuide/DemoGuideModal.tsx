"use client";

import { Mail, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBrowserUser } from "@/lib/auth/browser";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const INBOX = "events@moreusul.resend.app";

const MAILTO_HREF =
  `mailto:${INBOX}` +
  "?subject=Event%20announcement%20for%20Campus%20LeviClub" +
  "&body=Hello%2C%0A%0AI%20would%20like%20to%20publish%20the%20following%20event%20on%20the%20campus%20platform.%0A%0A" +
  "Event%20name%3A%20%5Btype%20your%20event%20name%20here%5D%0A" +
  "Date%20and%20time%3A%20%5Btype%20the%20date%20and%20time%2C%20e.g.%2015%20August%202026%2C%2010%3A00%20AM%5D%0A" +
  "Venue%20%2F%20online%20link%3A%20%5Btype%20the%20venue%20or%20meeting%20link%5D%0A" +
  "Short%20description%3A%20%5Ba%20few%20words%20about%20the%20event%5D%0A%0AThank%20you!";

const DISMISSED_KEY = "campus_demo_guide_dismissed";

export function DemoGuideModal() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const shownThisAuth = useRef(false);

  useEffect(() => {
    let mounted = true;

    getBrowserUser()
      .then((user) => {
        if (!mounted) return;
        if (user) {
          setSignedIn(true);
          shownThisAuth.current = true;
        } else if (!localStorage.getItem(DISMISSED_KEY)) {
          setOpen(true);
        }
      })
      .catch(() => {
        if (mounted && !localStorage.getItem(DISMISSED_KEY)) setOpen(true);
      });

    const {
      data: { subscription },
    } = getSupabaseBrowserClient().auth.onAuthStateChange((event) => {
      if (!mounted) return;
      if (event === "SIGNED_IN") {
        setSignedIn(true);
        if (!shownThisAuth.current) {
          shownThisAuth.current = true;
          setOpen(true);
        }
      } else if (event === "SIGNED_OUT") {
        shownThisAuth.current = false;
        localStorage.removeItem(DISMISSED_KEY);
        setSignedIn(false);
        setOpen(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-w-md gap-5 rounded-2xl">
        <DialogHeader className="space-y-2 text-left">
          <span className="inline-block w-fit rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-950 dark:text-red-300">
            NEW · Events created from email
          </span>
          <DialogTitle className="text-xl">
            Try it: your email becomes a live event
          </DialogTitle>
          <DialogDescription className="text-sm leading-6">
            Campus LeviClub reads event emails with AI and publishes them
            automatically. Try it now in four steps.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
              1
            </span>
            <span>
              {signedIn ? (
                "You are signed in."
              ) : (
                <>
                  Sign in to the platform:{" "}
                  <Link
                    className="font-semibold underline underline-offset-2"
                    href="/signin"
                  >
                    Sign in with Google or email
                  </Link>
                </>
              )}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
              2
            </span>
            <span>
              Click{" "}
              <span className="font-semibold">Compose test event email</span>{" "}
              below — your mail app opens with a prefilled message to{" "}
              <span className="font-mono text-xs">{INBOX}</span>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
              3
            </span>
            <span>
              Replace the placeholders with{" "}
              <span className="font-semibold">
                your event name, date &amp; time, venue, and description
              </span>
              , then send the email.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
              4
            </span>
            <span>
              Within seconds the AI extracts and publishes your event — watch
              it appear automatically on the Events page.
            </span>
          </li>
        </ol>

        <a
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          href={MAILTO_HREF}
          rel="noreferrer"
          target="_blank"
        >
          <Mail className="size-4" />
          Compose test event email → {INBOX}
        </a>

        <div className="flex items-center justify-between gap-3">
          <Link
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            href="/discover"
          >
            <Send className="size-4" />
            Open the Events page
          </Link>
          <button
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            onClick={dismiss}
            type="button"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
