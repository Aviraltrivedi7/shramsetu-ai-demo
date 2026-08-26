import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Job, Language } from "@/lib/shramsetu-logic";

type ChatMessage = { id: string; sender: "worker" | "contractor"; text: string; time: string };

export function ContractorChatSheet({ job, language, visible, onClose }: { job: Job | null; language: Language; visible: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const hindi = language === "Hindi";
  const storageKey = useMemo(() => `shramsetu-conversation-${job?.id ?? "empty"}`, [job?.id]);

  useEffect(() => {
    if (!job || !visible) return;
    const restore = async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        setMessages(JSON.parse(stored) as ChatMessage[]);
        return;
      }
      const seeded: ChatMessage[] = [{ id: "welcome", sender: "contractor", text: hindi ? `Namaste Ramesh, ${job.title.Hindi} ke baare mein aap kya poochhna chahte hain?` : `Hello Ramesh, what would you like to know about ${job.title.English}?`, time: "Now" }];
      setMessages(seeded);
      await AsyncStorage.setItem(storageKey, JSON.stringify(seeded));
    };
    void restore();
  }, [hindi, job, storageKey, visible]);

  const persist = async (nextMessages: ChatMessage[]) => {
    setMessages(nextMessages);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nextMessages));
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !job) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const sent: ChatMessage = { id: `worker-${Date.now()}`, sender: "worker", text, time: now };
    const updated = [...messages, sent];
    setDraft("");
    await persist(updated);
    setTimeout(() => {
      const reply: ChatMessage = { id: `contractor-${Date.now()}`, sender: "contractor", text: hindi ? "Dhanyavaad. Main details check karke jaldi jawab deta hoon." : "Thanks. I will check the details and reply shortly.", time: "Now" };
      void persist([...updated, reply]);
    }, 450);
  };

  if (!job) return null;
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardWrap}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.handle} />
            <View style={styles.header}><View style={styles.avatar}><Text style={styles.avatarText}>{job.initial}</Text></View><View style={styles.headerCopy}><View style={styles.contractorNameRow}><Text style={styles.contractorName}>{job.contractor}</Text><MaterialIcons name="verified" size={15} color="#25B96C" /></View><Text style={styles.contractorStatus}>{job.contractorTrust.verified ? (hindi ? "Verified contractor • Usually replies today" : "Verified contractor • Usually replies today") : (hindi ? "Contractor listing" : "Contractor listing")}</Text></View><Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}><MaterialIcons name="close" size={20} color="#182B4A" /></Pressable></View>
            <View style={styles.contextChip}><MaterialIcons name="work-outline" size={15} color="#A96A13" /><Text style={styles.contextText}>{job.title[language]}</Text></View>
            <FlatList ref={listRef} data={messages} keyExtractor={(item) => item.id} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })} renderItem={({ item }) => <View style={[styles.messageRow, item.sender === "worker" && styles.messageRowWorker]}><View style={[styles.messageBubble, item.sender === "worker" ? styles.workerBubble : styles.contractorBubble]}><Text style={[styles.messageText, item.sender === "worker" && styles.workerMessageText]}>{item.text}</Text><Text style={[styles.messageTime, item.sender === "worker" && styles.workerMessageTime]}>{item.time}</Text></View></View>} contentContainerStyle={styles.messages} style={styles.messageList} />
            <View style={styles.composer}><TextInput accessibilityLabel="Message contractor" multiline onChangeText={setDraft} placeholder={hindi ? "Apna sawal likhein..." : "Write your question..."} placeholderTextColor="#A7B0BD" style={styles.input} value={draft} /><Pressable accessibilityRole="button" onPress={send} style={({ pressed }) => [styles.sendButton, !draft.trim() && styles.sendButtonDisabled, pressed && styles.pressed]}><MaterialIcons name="send" size={19} color="#FFFFFF" /></Pressable></View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: "center", backgroundColor: "#182B4A", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  avatarText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  backdrop: { backgroundColor: "rgba(16, 30, 52, 0.48)", flex: 1, justifyContent: "flex-end" },
  closeButton: { alignItems: "center", backgroundColor: "#F3F6F9", borderRadius: 18, height: 34, justifyContent: "center", width: 34 },
  composer: { alignItems: "flex-end", borderTopColor: "#E5EAF1", borderTopWidth: 1, flexDirection: "row", gap: 8, paddingTop: 11 },
  contextChip: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "#FFF7EA", borderRadius: 10, flexDirection: "row", gap: 6, marginBottom: 9, marginTop: 12, paddingHorizontal: 9, paddingVertical: 6 },
  contextText: { color: "#8F5A14", fontSize: 11, fontWeight: "800", maxWidth: 240 },
  contractorBubble: { backgroundColor: "#F1F5F8" },
  contractorName: { color: "#182B4A", fontSize: 16, fontWeight: "900" },
  contractorNameRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  contractorStatus: { color: "#718096", fontSize: 11, marginTop: 3 },
  handle: { alignSelf: "center", backgroundColor: "#E5EAF1", borderRadius: 3, height: 5, marginBottom: 17, width: 44 },
  header: { alignItems: "center", flexDirection: "row", gap: 10 },
  headerCopy: { flex: 1 },
  input: { color: "#182B4A", flex: 1, fontSize: 14, lineHeight: 19, maxHeight: 80, minHeight: 46, paddingHorizontal: 12, paddingTop: 13 },
  keyboardWrap: { justifyContent: "flex-end" },
  messageBubble: { borderRadius: 16, maxWidth: "82%", paddingHorizontal: 12, paddingVertical: 9 },
  messageList: { maxHeight: 300, minHeight: 150 },
  messageRow: { alignItems: "flex-start", marginBottom: 8 },
  messageRowWorker: { alignItems: "flex-end" },
  messageText: { color: "#182B4A", fontSize: 14, lineHeight: 20 },
  messageTime: { color: "#718096", fontSize: 10, marginTop: 4, textAlign: "right" },
  messages: { paddingBottom: 8, paddingTop: 6 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  sendButton: { alignItems: "center", backgroundColor: "#FF6B0A", borderRadius: 13, height: 46, justifyContent: "center", width: 46 },
  sendButtonDisabled: { opacity: 0.45 },
  sheet: { backgroundColor: "#F8FAFC", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20 },
  workerBubble: { backgroundColor: "#182B4A" },
  workerMessageText: { color: "#FFFFFF" },
  workerMessageTime: { color: "#C8D6E8" },
});
