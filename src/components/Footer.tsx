import Link from "next/link";
import { FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { GrAppleAppStore } from "react-icons/gr";
import { LuMail } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { BrandWordmark } from "./BrandLogo";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mx-auto fixed-bottom flex flex-col mt-10 border-t-[.075rem] border-zinc-300 dark:border-zinc-800 w-[90%] max-w-[1280px] py-4">
      <div className="flex justify-between">
        <div className="flex flex-row gap-5 flex-wrap items-center text-sm text-zinc-800 dark:text-zinc-200">
          <Link href="/" aria-label="LeviClub home">
            <BrandWordmark className="text-lg opacity-75" />
          </Link>
          <Link href="/">{t("Footer.new")}</Link>
          <Link href="/">{t("Footer.discover")}</Link>
          <Link href="/">{t("Footer.pricing")}</Link>
          <Link href="/">{t("Footer.help")}</Link>
        </div>
        <div className="flex gap-4 text-zinc-800 dark:text-zinc-50">
          <Link href="/" aria-label="Contact LeviClub">
            <LuMail size={15} />
          </Link>
          <Link href="/" aria-label="LeviClub app">
            <GrAppleAppStore size={15} />
          </Link>
          <Link href="/" aria-label="LeviClub on X">
            <FaXTwitter size={15} />
          </Link>
          <Link href="/" aria-label="LeviClub on Instagram">
            <FaInstagram size={15} />
          </Link>
        </div>
      </div>
      <div className="flex mt-4 justify-between">
        <div className="flex gap-5 flex-wrap text-zinc-600 font-semibold text-sm">
          <Link href="/">{t("Footer.terms")}</Link>
          <Link href="/">{t("Footer.privacy")}</Link>
          <Link href="/">{t("Footer.security")}</Link>
        </div>
        <span className="text-xs font-medium text-zinc-500">
          © <Link href="/">LeviClub</Link>
        </span>
      </div>
    </footer>
  );
}
