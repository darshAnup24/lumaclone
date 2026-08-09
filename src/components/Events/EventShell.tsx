import type { ReactNode } from "react";
import { RandomBg } from "@/components/Background/RandomBg";
import { Header } from "@/components/Header";

export function EventShell({ children }: { children: ReactNode }) {
  return (
    <>
      <RandomBg />
      <Header isSignedIn />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6">
        {children}
      </main>
    </>
  );
}
