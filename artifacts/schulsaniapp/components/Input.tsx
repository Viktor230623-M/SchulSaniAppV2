import React from "react";
import { TextInput, View, Text, StyleSheet, type TextInputProps } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { radius, spacing } from "@/constants/colors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.danger : theme.border,
            color: theme.textPrimary,
          },
          style,
        ]}
        placeholderTextColor={theme.textMuted}
        {...props}
      />
      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
});
