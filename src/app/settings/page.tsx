'use client'
import { RandomBg } from "@/components/Background/RandomBg";
import { Header } from "@/components/Header";
import { SettingsForm } from "@/components/Settings/SettingsForm";
import { useTranslation } from "react-i18next";

export default function Page() {
    const { t } = useTranslation();
    if (typeof document !== "undefined") {
        document.title = t("titles.accountSettings");
    }
    
    return (
        <>
            <RandomBg />
            <Header isSignedIn={true}/>
            <>
                <SettingsForm />
            </>
        </>
    )
}
