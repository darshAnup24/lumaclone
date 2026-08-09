"use client";

import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { getBrowserUser } from "@/lib/auth/browser";

export function PrimaryEmailSection() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    getBrowserUser()
      .then((user) => setEmail(user?.email ?? ""))
      .catch(() => undefined);
  }, []);

  return (
    <section className="my-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Email
      </h2>
      <p className="text-zinc-700 dark:text-zinc-300">
        Event invitations and authentication links are sent to this address.
      </p>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/55 p-4 dark:border-zinc-800 dark:bg-zinc-900/65">
        <Mail className="size-5 text-zinc-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-zinc-950 dark:text-zinc-100">
            {email || "Loading…"}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">
            Primary account email
          </p>
        </div>
        <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          Main
        </span>
      </div>
    </section>
  );
}
