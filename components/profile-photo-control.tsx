import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { Language } from "@/lib/shramsetu-logic";

const STORAGE_KEY = "shramsetu-profile-photo";
type DraftPhoto = { uri: string; width: number; height: number };

export function ProfilePhotoControl({ language, onFeedback }: { language: Language; onFeedback: (message: string) => void }) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPhoto | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const hindi = language === "Hindi";

  const savePhoto = async (uri: string) => {
    setPhotoUri(uri);
    await AsyncStorage.setItem(STORAGE_KEY, uri);
  };

  const prepareDraft = (asset: { uri: string; width?: number; height?: number }) => {
    setDraft({ uri: asset.uri, width: asset.width ?? 1080, height: asset.height ?? 1080 });
    setZoom(1);
    setRotation(0);
  };

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      const savedPhoto = await AsyncStorage.getItem(STORAGE_KEY);
      if (mounted && savedPhoto) setPhotoUri(savedPhoto);
      const pending = await ImagePicker.getPendingResultAsync();
      if (mounted && pending && "canceled" in pending && !pending.canceled && pending.assets[0]?.uri) {
        prepareDraft(pending.assets[0]);
      }
    };
    void restore();
    return () => { mounted = false; };
  }, []);

  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.9 });
      if (!result.canceled && result.assets[0]?.uri) prepareDraft(result.assets[0]);
    } catch {
      onFeedback(hindi ? "Photo select nahi ho paayi" : "Could not select a photo");
    }
  };

  const saveAdjustedPhoto = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const shortestSide = Math.max(1, Math.min(draft.width, draft.height));
      const cropSide = Math.max(1, Math.floor(shortestSide / zoom));
      const originX = Math.max(0, Math.floor((draft.width - cropSide) / 2));
      const originY = Math.max(0, Math.floor((draft.height - cropSide) / 2));
      const result = await ImageManipulator.manipulateAsync(
        draft.uri,
        [
          { crop: { originX, originY, width: cropSide, height: cropSide } },
          { rotate: rotation },
          { resize: { width: 360, height: 360 } },
        ],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
      );
      await savePhoto(result.uri);
      setDraft(null);
      onFeedback(hindi ? "Profile photo save ho gayi" : "Profile photo saved");
    } catch {
      onFeedback(hindi ? "Photo adjust nahi ho paayi" : "Could not adjust this photo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose profile photo" onPress={choosePhoto} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.photo} /> : <View style={styles.fallback}><Text style={styles.initials}>RK</Text></View>}
        <View style={styles.cameraBadge}><MaterialIcons name="photo-camera" size={14} color="#FFFFFF" /></View>
        <Text style={styles.label}>{photoUri ? (hindi ? "Badlein" : "Change") : (hindi ? "Photo" : "Photo")}</Text>
      </Pressable>
      <Modal transparent animationType="slide" visible={Boolean(draft)} onRequestClose={() => setDraft(null)}>
        <Pressable style={styles.backdrop} onPress={() => !saving && setDraft(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{hindi ? "Photo adjust karein" : "Adjust your photo"}</Text>
            <Text style={styles.sheetSubtitle}>{hindi ? "Square frame mein zoom ya rotate karke save karein." : "Zoom or rotate inside the square frame before saving."}</Text>
            <View style={styles.previewFrame}>{draft ? <Image source={{ uri: draft.uri }} style={[styles.previewImage, { transform: [{ scale: zoom }, { rotate: `${rotation}deg` }] }]} /> : null}</View>
            <View style={styles.controls}>
              <Pressable accessibilityRole="button" onPress={() => setZoom((value) => Math.max(1, Number((value - 0.15).toFixed(2))))} style={styles.controlButton}><MaterialIcons name="remove" size={20} color="#182B4A" /></Pressable>
              <Text style={styles.controlLabel}>{hindi ? "Zoom" : "Zoom"} {Math.round(zoom * 100)}%</Text>
              <Pressable accessibilityRole="button" onPress={() => setZoom((value) => Math.min(1.8, Number((value + 0.15).toFixed(2))))} style={styles.controlButton}><MaterialIcons name="add" size={20} color="#182B4A" /></Pressable>
              <View style={styles.controlDivider} />
              <Pressable accessibilityRole="button" onPress={() => setRotation((value) => (value + 90) % 360)} style={styles.rotateButton}><MaterialIcons name="rotate-right" size={20} color="#FF6B0A" /><Text style={styles.rotateText}>{hindi ? "Rotate" : "Rotate"}</Text></Pressable>
            </View>
            <View style={styles.actions}><Pressable onPress={() => setDraft(null)} style={styles.cancelButton}><Text style={styles.cancelText}>{hindi ? "Cancel" : "Cancel"}</Text></Pressable><Pressable disabled={saving} onPress={saveAdjustedPhoto} style={[styles.saveButton, saving && styles.saveButtonDisabled]}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <><MaterialIcons name="check" size={19} color="#FFFFFF" /><Text style={styles.saveText}>{hindi ? "Save photo" : "Save photo"}</Text></>}</Pressable></View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  backdrop: { backgroundColor: "rgba(16, 30, 52, 0.48)", flex: 1, justifyContent: "flex-end" },
  button: { alignItems: "center", height: 90, justifyContent: "flex-start", position: "relative", width: 72 },
  cameraBadge: { alignItems: "center", backgroundColor: "#FF6B0A", borderColor: "#FFFFFF", borderRadius: 13, borderWidth: 2, height: 27, justifyContent: "center", position: "absolute", right: 0, top: 42, width: 27 },
  cancelButton: { alignItems: "center", borderColor: "#E5EAF1", borderRadius: 14, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 52 },
  cancelText: { color: "#182B4A", fontSize: 15, fontWeight: "800" },
  controlButton: { alignItems: "center", backgroundColor: "#FFF7EA", borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  controlDivider: { backgroundColor: "#E5EAF1", height: 28, width: 1 },
  controlLabel: { color: "#182B4A", fontSize: 13, fontWeight: "800", minWidth: 62, textAlign: "center" },
  controls: { alignItems: "center", flexDirection: "row", gap: 9, justifyContent: "center", marginTop: 18 },
  fallback: { alignItems: "center", backgroundColor: "#182B4A", borderColor: "#FFFFFF", borderRadius: 17, borderWidth: 2, height: 64, justifyContent: "center", width: 64 },
  handle: { alignSelf: "center", backgroundColor: "#E5EAF1", borderRadius: 3, height: 5, marginBottom: 17, width: 44 },
  initials: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  label: { color: "#FF6B0A", fontSize: 11, fontWeight: "800", marginTop: 5 },
  photo: { borderColor: "#FFFFFF", borderRadius: 17, borderWidth: 2, height: 64, width: 64 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  previewFrame: { alignSelf: "center", backgroundColor: "#E8EDF3", borderRadius: 20, height: 236, overflow: "hidden", width: 236 },
  previewImage: { height: 236, resizeMode: "cover", width: 236 },
  rotateButton: { alignItems: "center", flexDirection: "row", gap: 5, paddingHorizontal: 5 },
  rotateText: { color: "#FF6B0A", fontSize: 12, fontWeight: "900" },
  saveButton: { alignItems: "center", backgroundColor: "#FF6B0A", borderRadius: 14, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 52 },
  saveButtonDisabled: { opacity: 0.65 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  sheet: { backgroundColor: "#F8FAFC", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22 },
  sheetSubtitle: { color: "#718096", fontSize: 14, lineHeight: 20, marginBottom: 18, marginTop: 5 },
  sheetTitle: { color: "#182B4A", fontSize: 22, fontWeight: "800" },
});
