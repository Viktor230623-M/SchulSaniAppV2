import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { themes, type Theme, type ThemeKey } from "@/constants/colors";

const THEME_KEY = "app_theme";
const LANG_KEY = "app_language";

interface ThemeContextType {
  themeKey: ThemeKey;
  theme: Theme;
  setTheme: (key: ThemeKey) => void;
  language: "de" | "en";
  setLanguage: (lang: "de" | "en") => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeKey: "dark",
  theme: themes.dark,
  setTheme: () => {},
  language: "de",
  setLanguage: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeKey, setThemeKey] = useState<ThemeKey>("dark");
  const [language, setLanguageState] = useState<"de" | "en">("de");

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, LANG_KEY]).then((values) => {
      const savedTheme = values[0]?.[1] as ThemeKey | null;
      const savedLang = values[1]?.[1] as "de" | "en" | null;
      if (savedTheme && themes[savedTheme]) setThemeKey(savedTheme);
      if (savedLang) setLanguageState(savedLang);
    });
  }, []);

  const setTheme = useCallback((key: ThemeKey) => {
    setThemeKey(key);
    AsyncStorage.setItem(THEME_KEY, key);
  }, []);

  const setLanguage = useCallback((lang: "de" | "en") => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeKey,
        theme: themes[themeKey],
        setTheme,
        language,
        setLanguage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
