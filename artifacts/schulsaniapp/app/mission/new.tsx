import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router, useNavigation } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateMission, getGetMissionsQueryKey } from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { spacing } from "@/constants/colors";
import { useEffect } from "react";

export default function NewMissionScreen() {
  const { theme } = useTheme();
  const t = useTranslation();
  const qc = useQueryClient();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [patientInitials, setPatientInitials] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");

  const { mutate: createMission, isPending } = useCreateMission();

  useEffect(() => {
    navigation.setOptions({ title: t.missions.new });
  }, [navigation, t.missions.new]);

  const handleSubmit = () => {
    if (!title || !location || !patientInitials) return;
    createMission(
      { data: { title, location, patientInitials, treatmentNotes } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetMissionsQueryKey() });
          router.back();
        },
      },
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Input
        label={t.missionForm.titleLabel}
        value={title}
        onChangeText={setTitle}
        placeholder={t.missionForm.titlePlaceholder}
      />
      <Input
        label={t.missions.location}
        value={location}
        onChangeText={setLocation}
        placeholder={t.missionForm.locationPlaceholder}
      />
      <Input
        label={t.missions.patientInitials}
        value={patientInitials}
        onChangeText={setPatientInitials}
        placeholder={t.missionForm.initialsPlaceholder}
        autoCapitalize="characters"
        maxLength={10}
      />
      <Input
        label={t.missions.treatmentNotes}
        value={treatmentNotes}
        onChangeText={setTreatmentNotes}
        placeholder={t.missionForm.notesPlaceholder}
        multiline
        numberOfLines={4}
      />
      <Button
        label={isPending ? t.missionForm.creating : t.missionForm.submit}
        onPress={handleSubmit}
        loading={isPending}
        disabled={!title || !location || !patientInitials}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
});
