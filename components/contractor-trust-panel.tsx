import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import type { Job, Language } from "@/lib/shramsetu-logic";

export function ContractorTrustPanel({ job, language }: { job: Job; language: Language }) {
  const verified = job.contractorTrust.verified;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}><View style={styles.iconWrap}><MaterialIcons name="verified-user" size={16} color="#182B4A" /></View><View><Text style={styles.title}>{language === "Hindi" ? "Contractor trust" : "Contractor trust"}</Text><Text style={styles.subtitle}>{verified ? (language === "Hindi" ? "ShramSetu verified contractor" : "Verified by ShramSetu") : (language === "Hindi" ? "New contractor listing" : "New contractor listing")}</Text></View></View>
        <View style={[styles.status, !verified && styles.statusPending]}><MaterialIcons name={verified ? "verified" : "schedule"} size={13} color={verified ? "#25B96C" : "#A96A13"} /><Text style={[styles.statusText, !verified && styles.statusTextPending]}>{verified ? "Verified" : "Screening"}</Text></View>
      </View>
      <View style={styles.metrics}><TrustMetric value={`${job.contractorTrust.paymentScore}%`} label="Payment" /><TrustMetric value={`${job.contractorTrust.responseRate}%`} label="Response" /><TrustMetric value={`${job.contractorTrust.completedProjects}`} label="Projects" /></View>
      <Text style={styles.finePrint}>{language === "Hindi" ? `Member since ${job.contractorTrust.memberSince} • payment history reviewed` : `Member since ${job.contractorTrust.memberSince} • payment history reviewed`}</Text>
    </View>
  );
}

function TrustMetric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#F7FAFC", borderColor: "#E4EAF0", borderRadius: 14, borderWidth: 1, marginTop: -2, padding: 12 },
  finePrint: { color: "#718096", fontSize: 10, marginTop: 10 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  iconWrap: { alignItems: "center", backgroundColor: "#EAF0F7", borderRadius: 9, height: 31, justifyContent: "center", width: 31 },
  metric: { alignItems: "center", flex: 1 },
  metricLabel: { color: "#718096", fontSize: 10, marginTop: 2 },
  metricValue: { color: "#182B4A", fontSize: 14, fontWeight: "900" },
  metrics: { borderTopColor: "#E4EAF0", borderTopWidth: 1, flexDirection: "row", marginTop: 11, paddingTop: 10 },
  status: { alignItems: "center", backgroundColor: "#EAF9F0", borderRadius: 12, flexDirection: "row", gap: 4, paddingHorizontal: 7, paddingVertical: 5 },
  statusPending: { backgroundColor: "#FFF7EA" },
  statusText: { color: "#238C54", fontSize: 10, fontWeight: "900" },
  statusTextPending: { color: "#A96A13" },
  subtitle: { color: "#718096", fontSize: 11, marginTop: 2 },
  title: { color: "#182B4A", fontSize: 13, fontWeight: "900" },
  titleWrap: { alignItems: "center", flexDirection: "row", gap: 8 },
});
