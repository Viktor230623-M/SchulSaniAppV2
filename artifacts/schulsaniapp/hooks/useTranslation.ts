import { useTheme } from "@/context/ThemeContext";
import { de } from "@/i18n/de";
import { en } from "@/i18n/en";

export function useTranslation() {
  const { language } = useTheme();
  return language === "en" ? en : de;
}
