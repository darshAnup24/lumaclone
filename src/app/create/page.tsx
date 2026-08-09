"use client";
import EventForm from "@/components/CreateEvent/EventForm/EventForm";
import ImageSelection from "@/components/CreateEvent/ImageSelection/ImageSelection";
import { Header } from "@/components/Header";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Page() {
  const { t } = useTranslation();
  if (typeof document !== "undefined") {
    document.title = t("titles.createEvent");
  }

  const [colors, setColors] = useState<string>("#212121");

  return (
    <>
        <div className="z-[-1] fixed top-0 left-0 right-0 bottom-0">
            <div 
                className="w-full h-full" 
                style={{ opacity: 0.1, backgroundColor: colors }}
            />
        </div>
      <Header isSignedIn={true} />
      <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-24 sm:px-6">
        <div className="flex w-full flex-col items-center justify-center gap-6 md:flex-row md:items-start">
          <ImageSelection returnImageColors={setColors} />
          <EventForm />
        </div>
      </main>
    </>
  );
}
