import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return AsyncStorage.getItem(key);
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    return AsyncStorage.setItem(key, value);
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    return AsyncStorage.removeItem(key);
  }
  const SecureStore = await import("expo-secure-store");
  return SecureStore.deleteItemAsync(key);
}

export const storage = { getItem, setItem, deleteItem };
