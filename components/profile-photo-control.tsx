import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Language } from "@/lib/shramsetu-logic";

const STORAGE_KEY = "shramsetu-profile-photo";

export function ProfilePhotoControl({ language, onFeedback }: { language: Language; onFeedback: (message: string) => void }) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const savePhoto = async (uri: string) => {
    setPhotoUri(uri);
    await AsyncStorage.setItem(STORAGE_KEY, uri);
  };

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      const savedPhoto = await AsyncStorage.getItem(STORAGE_KEY);
      if (mounted && savedPhoto) setPhotoUri(savedPhoto);
      const pending = await ImagePicker.getPendingResultAsync();
      if (mounted && pending && "canceled" in pending && !pending.canceled && pending.assets[0]?.uri) {
        await savePhoto(pending.assets[0].uri);
      }
    };
    void restore();
    return () => { mounted = false; };
  }, []);

  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.75,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        await savePhoto(result.assets[0].uri);
        onFeedback(language === "Hindi" ? "Profile photo update ho gayi" : "Profile photo updated");
      }
    } catch {
      onFeedback(language === "Hindi" ? "Photo select nahi ho paayi" : "Could not select a photo");
    }
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Choose profile photo" onPress={choosePhoto} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : <View style={styles.fallback}><Text style={styles.initials}>RK</Text></View>}
      <View style={styles.cameraBadge}><MaterialIcons name="photo-camera" size={14} color="#FFFFFF" /></View>
      <Text style={styles.label}>{photoUri ? (language === "Hindi" ? "Badlein" : "Change") : (language === "Hindi" ? "Photo" : "Photo")}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: "center", height: 90, justifyContent: "flex-start", position: "relative", width: 72 },
  cameraBadge: { alignItems: "center", backgroundColor: "#FF6B0A", borderColor: "#FFFFFF", borderRadius: 13, borderWidth: 2, height: 27, justifyContent: "center", position: "absolute", right: 0, top: 42, width: 27 },
  fallback: { alignItems: "center", backgroundColor: "#182B4A", borderColor: "#FFFFFF", borderRadius: 17, borderWidth: 2, height: 64, justifyContent: "center", width: 64 },
  initials: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  label: { color: "#FF6B0A", fontSize: 11, fontWeight: "800", marginTop: 5 },
  photo: { borderColor: "#FFFFFF", borderRadius: 17, borderWidth: 2, height: 64, width: 64 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
