export type ThemeKey = "dark" | "light" | "ocean" | "forest" | "crimson";

export interface Theme {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  primary: string;
  primaryDark: string;
  primaryForeground: string;
  danger: string;
  warning: string;
  success: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  tabBar: string;
  tabBarBorder: string;
  inputBg: string;
  card: string;
  cardBorder: string;
}

export const themes: Record<ThemeKey, Theme> = {
  dark: {
    background: "#0A0F1E",
    surface: "#111827",
    surfaceElevated: "#1F2937",
    border: "#374151",
    primary: "#3B82F6",
    primaryDark: "#1D4ED8",
    primaryForeground: "#FFFFFF",
    danger: "#EF4444",
    warning: "#F59E0B",
    success: "#10B981",
    textPrimary: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    tabBar: "#111827",
    tabBarBorder: "#1F2937",
    inputBg: "#1F2937",
    card: "#111827",
    cardBorder: "#374151",
  },
  light: {
    background: "#F3F4F6",
    surface: "#FFFFFF",
    surfaceElevated: "#F9FAFB",
    border: "#E5E7EB",
    primary: "#2563EB",
    primaryDark: "#1D4ED8",
    primaryForeground: "#FFFFFF",
    danger: "#DC2626",
    warning: "#D97706",
    success: "#059669",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    tabBar: "#FFFFFF",
    tabBarBorder: "#E5E7EB",
    inputBg: "#F9FAFB",
    card: "#FFFFFF",
    cardBorder: "#E5E7EB",
  },
  ocean: {
    background: "#0D1B2A",
    surface: "#1B2B3C",
    surfaceElevated: "#1E3A50",
    border: "#2A4A62",
    primary: "#00B4D8",
    primaryDark: "#0096C7",
    primaryForeground: "#000000",
    danger: "#FF6B6B",
    warning: "#FFD166",
    success: "#06D6A0",
    textPrimary: "#E0F4FF",
    textSecondary: "#90CAE8",
    textMuted: "#5A8FA8",
    tabBar: "#0D1B2A",
    tabBarBorder: "#2A4A62",
    inputBg: "#1B2B3C",
    card: "#1B2B3C",
    cardBorder: "#2A4A62",
  },
  forest: {
    background: "#0D1A0F",
    surface: "#162618",
    surfaceElevated: "#1E3521",
    border: "#2D4A31",
    primary: "#4ADE80",
    primaryDark: "#22C55E",
    primaryForeground: "#000000",
    danger: "#F87171",
    warning: "#FBBF24",
    success: "#86EFAC",
    textPrimary: "#E8F5EA",
    textSecondary: "#86B890",
    textMuted: "#527558",
    tabBar: "#0D1A0F",
    tabBarBorder: "#2D4A31",
    inputBg: "#162618",
    card: "#162618",
    cardBorder: "#2D4A31",
  },
  crimson: {
    background: "#1A0808",
    surface: "#2A1010",
    surfaceElevated: "#3A1818",
    border: "#5C2A2A",
    primary: "#F87171",
    primaryDark: "#EF4444",
    primaryForeground: "#FFFFFF",
    danger: "#FCA5A5",
    warning: "#FBBF24",
    success: "#6EE7B7",
    textPrimary: "#FEE2E2",
    textSecondary: "#FCA5A5",
    textMuted: "#C07070",
    tabBar: "#1A0808",
    tabBarBorder: "#5C2A2A",
    inputBg: "#2A1010",
    card: "#2A1010",
    cardBorder: "#5C2A2A",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  full: 9999,
};

const colors = {
  light: {
    text: "#111827",
    tint: "#2563EB",
    background: themes.dark.background,
    foreground: themes.dark.textPrimary,
    card: themes.dark.surface,
    cardForeground: themes.dark.textPrimary,
    primary: themes.dark.primary,
    primaryForeground: themes.dark.primaryForeground,
    secondary: themes.dark.surfaceElevated,
    secondaryForeground: themes.dark.textSecondary,
    muted: themes.dark.surfaceElevated,
    mutedForeground: themes.dark.textMuted,
    accent: themes.dark.surfaceElevated,
    accentForeground: themes.dark.textSecondary,
    destructive: themes.dark.danger,
    destructiveForeground: "#FFFFFF",
    border: themes.dark.border,
    input: themes.dark.border,
  },
  radius: radius.md,
};

export default colors;
