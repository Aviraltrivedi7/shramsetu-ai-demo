import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import {
  filterJobs,
  getFairWageRange,
  jobs,
  type Job,
  type JobFilter,
  type WorkerSkill,
  validateDemoOtp,
} from "@/lib/shramsetu-logic";

type AuthMode = "phone" | "otp" | "app";
type AppTab = "Home" | "Kaam" | "Fair Wage" | "Hisab" | "Profile";
type LedgerMode = "Kamaai" | "Kharch" | "Bachat";

const NAV_ITEMS: Array<{ label: AppTab; icon: string }> = [
  { label: "Home", icon: "home" },
  { label: "Kaam", icon: "work-outline" },
  { label: "Fair Wage", icon: "account-balance-wallet" },
  { label: "Hisab", icon: "receipt-long" },
  { label: "Profile", icon: "person-outline" },
];

const formatRupees = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function AppIcon({ name, size = 22, color = COLORS.navy }: { name: string; size?: number; color?: string }) {
  return <MaterialIcons name={name as never} size={size} color={color} />;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
      <AppIcon name="verified-user" size={compact ? 17 : 22} color={COLORS.orange} />
    </View>
  );
}

function LanguageToggle({ onSelect }: { onSelect: (language: "Hindi" | "English") => void }) {
  return (
    <View style={styles.languageToggle}>
      <Pressable accessibilityRole="button" accessibilityLabel="Hindi language" onPress={() => onSelect("Hindi")} style={styles.languageChoice}>
        <Text style={styles.languageChoiceText}>हिं</Text>
      </Pressable>
      <View style={styles.languageDivider} />
      <Pressable accessibilityRole="button" accessibilityLabel="English language" onPress={() => onSelect("English")} style={styles.languageChoice}>
        <Text style={styles.languageChoiceText}>EN</Text>
      </Pressable>
    </View>
  );
}

function AuthHeader({ onLanguage }: { onLanguage: (language: "Hindi" | "English") => void }) {
  return (
    <View style={styles.authHeader}>
      <View style={styles.brandRow}>
        <BrandMark compact />
        <Text style={styles.brandName}>ShramSetu <Text style={styles.brandAI}>AI</Text></Text>
      </View>
      <LanguageToggle onSelect={onLanguage} />
    </View>
  );
}

function PageHeader({ title, onLanguage, notification = false }: { title: string; onLanguage: (language: "Hindi" | "English") => void; notification?: boolean }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderTextBlock}>
        <Text style={styles.eyebrow}>SHRAMSETU AI</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      <View style={styles.headerActions}>
        <LanguageToggle onSelect={onLanguage} />
        {notification ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}>
            <AppIcon name="notifications-none" size={22} color={COLORS.navy} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PrimaryButton({ label, onPress, icon = "arrow-forward" }: { label: string; onPress: () => void; icon?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
      <AppIcon name={icon} size={20} color={COLORS.white} />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.toast}>
      <AppIcon name="check-circle" size={18} color={COLORS.success} />
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

function TrustCard() {
  return (
    <View style={styles.trustCard}>
      <View style={styles.trustTopRow}>
        <View>
          <Text style={styles.trustLabel}>Trust Score</Text>
          <View style={styles.trustScoreRow}>
            <Text style={styles.trustScore}>87</Text>
            <Text style={styles.trustOutOf}>/100</Text>
          </View>
        </View>
        <View style={styles.highBadge}>
          <AppIcon name="check-circle" size={14} color={COLORS.success} />
          <Text style={styles.highBadgeText}>HIGH</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill87} />
      </View>
      <Text style={styles.trustDescription}>Aapki pehchaan verified hai</Text>
    </View>
  );
}

function MetricCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.metricCard}>
      <AppIcon name={icon} size={20} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function JobCard({ job, onApply, compact = false }: { job: Job; onApply: () => void; compact?: boolean }) {
  return (
    <View style={[styles.jobCard, compact && styles.jobCardCompact]}>
      <View style={styles.jobTopRow}>
        <View style={styles.contractorRow}>
          <View style={styles.contractorAvatar}>
            <Text style={styles.contractorInitial}>{job.initial}</Text>
          </View>
          <View>
            <Text style={styles.contractorName}>{job.contractor}</Text>
            <View style={styles.reliabilityRow}>
              <Text style={styles.reliabilityText}>{job.reliability}</Text>
              <AppIcon name="verified" size={13} color={COLORS.success} />
            </View>
          </View>
        </View>
        <View style={styles.matchBadge}>
          <Text style={styles.matchValue}>{job.match}%</Text>
          <Text style={styles.matchLabel}>MATCH</Text>
        </View>
      </View>
      <Text style={styles.jobTitle}>{job.title}</Text>
      <View style={styles.jobInfoRow}>
        <AppIcon name="location-on" size={16} color={COLORS.muted} />
        <Text style={styles.jobInfoText}>{job.location}</Text>
      </View>
      <View style={styles.jobMetaRow}>
        <Text style={styles.jobSalary}>{job.salary}</Text>
        <View style={styles.jobDuration}>
          <AppIcon name="calendar-today" size={14} color={COLORS.muted} />
          <Text style={styles.jobDurationText}>{job.duration}</Text>
        </View>
        <View style={styles.skillChip}>
          <Text style={styles.skillChipText}>{job.skill}</Text>
        </View>
      </View>
      <View style={styles.matchLineTrack}>
        <View style={job.match > 90 ? styles.matchLine94 : styles.matchLine82} />
      </View>
      <PrimaryButton label="Abhi apply karein" icon="arrow-forward" onPress={onApply} />
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.quickActionPressed]}>
      <View style={styles.quickActionIcon}>
        <AppIcon name={icon} size={20} color={COLORS.orange} />
      </View>
      <Text style={styles.quickActionText}>{label}</Text>
      <AppIcon name="chevron-right" size={20} color={COLORS.muted} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const [mode, setMode] = useState<AuthMode>("phone");
  const [activeTab, setActiveTab] = useState<AppTab>("Home");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [toast, setToast] = useState<string | null>(null);
  const [language, setLanguage] = useState<"Hindi" | "English">("Hindi");
  const [jobFilter, setJobFilter] = useState<JobFilter>("All");
  const [jobQuery, setJobQuery] = useState("");
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [workerSkill, setWorkerSkill] = useState<WorkerSkill>("Mason");
  const [experience, setExperience] = useState(7);
  const [ledgerMode, setLedgerMode] = useState<LedgerMode>("Kamaai");
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [entryAmount, setEntryAmount] = useState("");
  const [entryType, setEntryType] = useState<"Kamaai" | "Kharch">("Kamaai");
  const [latestEntry, setLatestEntry] = useState<number | null>(null);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const filteredJobs = useMemo(() => filterJobs(jobQuery, jobFilter), [jobFilter, jobQuery]);
  const wageRange = useMemo(() => getFairWageRange(workerSkill, experience), [workerSkill, experience]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  };

  const chooseLanguage = (selectedLanguage: "Hindi" | "English") => {
    haptic.selection();
    setLanguage(selectedLanguage);
    showToast(`${selectedLanguage} mode selected`);
  };

  const continueToOtp = () => {
    if (phone.replace(/\D/g, "").length !== 10) {
      haptic.error();
      showToast("10 digit mobile number daalein");
      return;
    }
    haptic.light();
    setOtp(["", "", "", ""]);
    setMode("otp");
  };

  const verifyOtp = (code = otp.join("")) => {
    const enteredCode = code;
    if (!validateDemoOtp(enteredCode)) {
      haptic.error();
      showToast("Demo OTP 1234 use karein");
      return;
    }
    haptic.success();
    setMode("app");
    setActiveTab("Home");
    showToast("Pehchaan verify ho gayi");
  };

  const updateOtp = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    if (digit && index < 3) otpRefs.current[index + 1]?.focus();
    if (nextOtp.join("") === "1234") {
      setTimeout(() => verifyOtp("1234"), 120);
    }
  };

  const applyToJob = (job: Job) => {
    if (appliedJobs.includes(job.id)) {
      showToast("Aap pehle hi apply kar chuke hain");
      return;
    }
    haptic.success();
    setAppliedJobs((current) => [...current, job.id]);
    showToast(`${job.contractor} ko application bhej di gayi`);
  };

  const saveEntry = () => {
    const parsedAmount = Number(entryAmount.replace(/\D/g, ""));
    if (!parsedAmount) {
      haptic.error();
      showToast("Sahi amount daalein");
      return;
    }
    haptic.success();
    setLatestEntry(parsedAmount);
    setEntryModalVisible(false);
    setEntryAmount("");
    setLedgerMode(entryType);
    showToast(`${entryType} entry save ho gayi`);
  };

  const logout = () => {
    const confirmLogout = () => {
      haptic.light();
      setMode("phone");
      setPhone("");
      setOtp(["", "", "", ""]);
      showToast("Aap logout ho gaye");
    };
    if (Platform.OS === "web") {
      confirmLogout();
      return;
    }
    Alert.alert("Logout", "Kya aap logout karna chahte hain?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: confirmLogout },
    ]);
  };

  const renderPhoneScreen = () => (
    <View style={styles.authScreen}>
      <AuthHeader onLanguage={chooseLanguage} />
      <View style={styles.authContent}>
        <Text style={styles.eyebrowOrange}>DIGITAL IDENTITY</Text>
        <Text style={styles.authTitle}>Apna mobile number daalein</Text>
        <Text style={styles.authSubtitle}>Aapke number par secure OTP bhejenge</Text>
        <View style={styles.phoneField}>
          <Text style={styles.countryCode}>+91</Text>
          <View style={styles.phoneDivider} />
          <TextInput
            accessibilityLabel="Mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={(value) => setPhone(value.replace(/\D/g, ""))}
            placeholder="98765 43210"
            placeholderTextColor={COLORS.placeholder}
            returnKeyType="done"
            style={styles.phoneInput}
            value={phone}
            onSubmitEditing={continueToOtp}
          />
        </View>
        <PrimaryButton label="Aage Badhein" onPress={continueToOtp} />
        <View style={styles.demoStrip}>
          <AppIcon name="info-outline" size={19} color={COLORS.amberDark} />
          <Text style={styles.demoStripText}>Demo: 9876543210 • OTP 1234</Text>
        </View>
      </View>
      <Text style={styles.legalText}>By continuing, you agree to ShramSetu&apos;s terms and privacy.</Text>
    </View>
  );

  const renderOtpScreen = () => (
    <View style={styles.authScreen}>
      <Pressable accessibilityRole="button" onPress={() => setMode("phone")} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <AppIcon name="arrow-back" size={20} color={COLORS.navy} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <View style={styles.otpContent}>
        <View style={styles.lockBadge}>
          <AppIcon name="lock" size={28} color={COLORS.orange} />
        </View>
        <Text style={styles.authTitle}>OTP daalein</Text>
        <Text style={styles.authSubtitle}>+91 {phone || "98765 43210"} par bheja gaya</Text>
        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              accessibilityLabel={`OTP digit ${index + 1}`}
              autoFocus={index === 0}
              caretHidden
              key={`otp-${index}`}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(value) => updateOtp(value, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
              }}
              ref={(input) => {
                otpRefs.current[index] = input;
              }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
            />
          ))}
        </View>
        <View style={styles.demoStrip}>
          <AppIcon name="auto-awesome" size={19} color={COLORS.orange} />
          <Text style={styles.demoStripText}>Demo OTP: 1234</Text>
        </View>
        <PrimaryButton label="Verify karein" onPress={verifyOtp} icon="verified" />
        <Text style={styles.resendText}>OTP nahi mila? <Text style={styles.resendTimer}>00:28 mein resend</Text></Text>
      </View>
    </View>
  );

  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <PageHeader onLanguage={chooseLanguage} title="Namaste, Ramesh" notification />
      <TrustCard />
      <View style={styles.metricsRow}>
        <MetricCard icon="trending-up" value="₹950" label="Aaj ki kamaai" color={COLORS.success} />
        <MetricCard icon="shopping-cart" value="₹350" label="Aaj ka kharch" color={COLORS.amberDark} />
        <MetricCard icon="account-balance-wallet" value="₹600" label="Aaj ki bachat" color={COLORS.navy} />
      </View>
      <Pressable accessibilityRole="button" onPress={() => { setActiveTab("Hisab"); haptic.light(); }} style={({ pressed }) => [styles.pendingBanner, pressed && styles.pressed]}>
        <View style={styles.pendingIcon}>
          <AppIcon name="schedule" size={21} color={COLORS.orange} />
        </View>
        <View style={styles.pendingCopy}>
          <Text style={styles.pendingTitle}>Baaki payment: ₹950</Text>
          <Text style={styles.pendingDescription}>ABC Construction • 3 din pehle</Text>
        </View>
        <AppIcon name="chevron-right" size={24} color={COLORS.muted} />
      </Pressable>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Aapka best job match</Text>
        <Pressable onPress={() => setActiveTab("Kaam")} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
          <Text style={styles.linkText}>Sabhi kaam dekhein</Text>
        </Pressable>
      </View>
      <JobCard job={jobs[0]} compact onApply={() => applyToJob(jobs[0])} />
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickActionsCard}>
        <QuickAction icon="account-balance-wallet" label="Apni fair wage jaanein" onPress={() => setActiveTab("Fair Wage")} />
        <QuickAction icon="forum" label="ShramSetu AI se poochhein" onPress={() => showToast("Sawal poochhne ka feature jald aayega")} />
        <QuickAction icon="add-circle-outline" label="Kamaai jodein" onPress={() => setEntryModalVisible(true)} />
        <QuickAction icon="person-outline" label="Profile dekhein" onPress={() => setActiveTab("Profile")} />
      </View>
    </ScrollView>
  );

  const renderJobs = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <PageHeader onLanguage={chooseLanguage} title="Kaam dhoondhein" />
      <View style={styles.searchField}>
        <AppIcon name="search" size={21} color={COLORS.muted} />
        <TextInput accessibilityLabel="Search jobs" onChangeText={setJobQuery} placeholder="Skill search karein" placeholderTextColor={COLORS.placeholder} style={styles.searchInput} value={jobQuery} />
      </View>
      <View style={styles.filterRow}>
        {(["All", "Mason", "Painter"] as JobFilter[]).map((filter) => (
          <Pressable key={filter} onPress={() => { haptic.selection(); setJobFilter(filter); }} style={({ pressed }) => [styles.filterPill, jobFilter === filter && styles.filterPillSelected, pressed && styles.pressed]}>
            <Text style={[styles.filterPillText, jobFilter === filter && styles.filterPillTextSelected]}>{filter}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.listCount}>{filteredJobs.length} verified jobs • {appliedJobs.length} applied</Text>
      {filteredJobs.length ? filteredJobs.map((job) => <JobCard key={job.id} job={job} onApply={() => applyToJob(job)} />) : (
        <View style={styles.emptyState}>
          <AppIcon name="search-off" size={30} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Koi kaam nahi mila</Text>
          <Text style={styles.emptyText}>Search ya filter badal kar dekhein.</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderFairWage = () => {
    const offerIsFair = wageRange.min <= 950 && wageRange.max >= 950;
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <PageHeader onLanguage={chooseLanguage} title="Fair Wage" />
        <Text style={styles.pageSubtitle}>Apni mehnat ki sahi keemat jaanein.</Text>
        <View style={styles.wageCard}>
          <Text style={styles.wageEyebrow}>AI ESTIMATE</Text>
          <Text style={styles.wageValue}>{formatRupees(wageRange.min)} — {formatRupees(wageRange.max)}</Text>
          <Text style={styles.wageUnit}>per day</Text>
          <View style={styles.wageDivider} />
          <Text style={styles.wageMeta}>{workerSkill} • {experience} saal • Lucknow</Text>
        </View>
        <Text style={styles.formLabel}>Aapki skill</Text>
        <View style={styles.skillSelector}>
          {(["Mason", "Painter", "Electrician"] as WorkerSkill[]).map((skill) => (
            <Pressable key={skill} onPress={() => { haptic.selection(); setWorkerSkill(skill); }} style={({ pressed }) => [styles.skillOption, workerSkill === skill && styles.skillOptionSelected, pressed && styles.pressed]}>
              <Text style={[styles.skillOptionText, workerSkill === skill && styles.skillOptionTextSelected]}>{skill}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.experienceCard}>
          <View>
            <Text style={styles.formLabel}>Experience: {experience} saal</Text>
            <Text style={styles.experienceHint}>Zyada tajurba, behtar daily range</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable accessibilityRole="button" accessibilityLabel="Reduce experience" disabled={experience <= 1} onPress={() => { haptic.selection(); setExperience((value) => Math.max(1, value - 1)); }} style={({ pressed }) => [styles.stepperButton, experience <= 1 && styles.stepperButtonDisabled, pressed && styles.pressed]}>
              <AppIcon name="remove" size={20} color={COLORS.navy} />
            </Pressable>
            <Text style={styles.stepperValue}>{experience}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Increase experience" disabled={experience >= 20} onPress={() => { haptic.selection(); setExperience((value) => Math.min(20, value + 1)); }} style={({ pressed }) => [styles.stepperButton, experience >= 20 && styles.stepperButtonDisabled, pressed && styles.pressed]}>
              <AppIcon name="add" size={20} color={COLORS.navy} />
            </Pressable>
          </View>
        </View>
        <View style={styles.fairnessMessage}>
          <AppIcon name={offerIsFair ? "check-circle" : "info-outline"} size={22} color={offerIsFair ? COLORS.success : COLORS.orange} />
          <Text style={styles.fairnessText}>{offerIsFair ? "Offer ₹950 hota to yeh fair range mein hota." : "₹950 offer aapke current fair range se alag hai."}</Text>
        </View>
        <Text style={styles.disclaimerText}>AI Estimate hai | Professional advice ke liye kisi expert se milein.</Text>
      </ScrollView>
    );
  };

  const renderLedgerList = () => {
    if (ledgerMode === "Kamaai") {
      return (
        <View style={styles.ledgerCard}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalIncome}>₹950</Text></View>
          {latestEntry && entryType === "Kamaai" ? <LedgerRow icon="add" title="Nayi kamaai entry" subtitle="Abhi" value={`₹${latestEntry}`} color={COLORS.success} /> : null}
          <LedgerRow icon="south" title="Aaj ka daily wage" subtitle="Today" value="₹950" color={COLORS.success} />
          <LedgerRow icon="south" title="ABC Construction" subtitle="Yesterday" value="₹950" color={COLORS.success} />
          <LedgerRow icon="south" title="Overtime bonus" subtitle="14 days ago" value="₹1100" color={COLORS.success} />
        </View>
      );
    }
    if (ledgerMode === "Kharch") {
      return (
        <View style={styles.ledgerCard}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalExpense}>₹350</Text></View>
          {latestEntry && entryType === "Kharch" ? <LedgerRow icon="remove" title="Naya kharch" subtitle="Abhi" value={`₹${latestEntry}`} color={COLORS.orange} /> : null}
          <LedgerRow icon="north-east" title="Safar aur chai" subtitle="Today" value="₹150" color={COLORS.orange} />
          <LedgerRow icon="north-east" title="Tools maintenance" subtitle="Yesterday" value="₹200" color={COLORS.orange} />
        </View>
      );
    }
    return (
      <View style={styles.ledgerCard}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Is mahine ki bachat</Text><Text style={styles.totalIncome}>₹600</Text></View>
        <LedgerRow icon="savings" title="Income ke baad available" subtitle="Current month" value="₹600" color={COLORS.navy} />
        <LedgerRow icon="verified" title="Goal: Emergency fund" subtitle="40% complete" value="₹1,500" color={COLORS.success} />
      </View>
    );
  };

  const renderHisab = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <PageHeader onLanguage={chooseLanguage} title="Aapka paisa, aapke haath mein" />
      <View style={styles.savingsCard}>
        <Text style={styles.savingsLabel}>Is mahine ki bachat</Text>
        <Text style={styles.savingsValue}>₹600</Text>
        <Text style={styles.savingsMeta}>Income ₹950 • Spend ₹350</Text>
      </View>
      <View style={styles.ledgerTabs}>
        {(["Kamaai", "Kharch", "Bachat"] as LedgerMode[]).map((item) => (
          <Pressable key={item} onPress={() => { haptic.selection(); setLedgerMode(item); }} style={({ pressed }) => [styles.ledgerTab, ledgerMode === item && styles.ledgerTabSelected, pressed && styles.pressed]}>
            <Text style={[styles.ledgerTabText, ledgerMode === item && styles.ledgerTabTextSelected]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{ledgerMode === "Kamaai" ? "Recent income" : ledgerMode === "Kharch" ? "Recent spend" : "Savings plan"}</Text>
        <Pressable accessibilityRole="button" onPress={() => setEntryModalVisible(true)} style={({ pressed }) => [styles.addLink, pressed && styles.pressed]}>
          <Text style={styles.addLinkText}>+ Add karein</Text>
        </Pressable>
      </View>
      {renderLedgerList()}
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <PageHeader onLanguage={chooseLanguage} title="Profile" />
      <View style={styles.profileIntro}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>RK</Text></View>
        <View>
          <Text style={styles.profileName}>Ramesh Kumar</Text>
          <Text style={styles.profileLocation}>Lucknow, Uttar Pradesh</Text>
          <View style={styles.verifiedIdentityRow}><AppIcon name="check-circle" size={16} color={COLORS.success} /><Text style={styles.verifiedIdentityText}>Verified identity</Text></View>
        </View>
      </View>
      <View style={styles.digitalIdCard}>
        <View style={styles.idCardTopRow}><Text style={styles.idCardEyebrow}>SHRAMSETU DIGITAL ID</Text><AppIcon name="qr-code" size={28} color={COLORS.white} /></View>
        <Text style={styles.idNumber}>SS • 9876 5432 10</Text>
        <Text style={styles.idIssue}>Issued 12 Jan 2024 • Active</Text>
      </View>
      <Text style={styles.sectionTitle}>Verified skills</Text>
      <View style={styles.verifiedSkillsRow}>
        <SkillCard skill="Mason" percent="88%" progressStyle={styles.skillProgress88} />
        <SkillCard skill="Painter" percent="75%" progressStyle={styles.skillProgress75} />
      </View>
      <Text style={styles.sectionTitle}>Profile settings</Text>
      <View style={styles.settingsCard}>
        <SettingRow icon="language" label="Language / भाषा" onPress={() => chooseLanguage(language === "Hindi" ? "English" : "Hindi")} />
        <SettingRow icon="help-outline" label="Help & support" onPress={() => showToast("Support team se connect kiya ja raha hai")} />
        <SettingRow icon="lock-outline" label="Privacy & security" onPress={() => showToast("Privacy settings local hain")} />
        <SettingRow icon="logout" label="Logout" destructive onPress={logout} />
      </View>
    </ScrollView>
  );

  const renderActiveScreen = () => {
    if (activeTab === "Home") return renderHome();
    if (activeTab === "Kaam") return renderJobs();
    if (activeTab === "Fair Wage") return renderFairWage();
    if (activeTab === "Hisab") return renderHisab();
    return renderProfile();
  };

  const renderMainApp = () => (
    <View style={styles.appShell}>
      <View style={styles.mainContent}>{renderActiveScreen()}</View>
      <SafeAreaView style={styles.bottomNavSafeArea}>
        <View style={styles.bottomNav}>
          {NAV_ITEMS.map((item) => (
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: activeTab === item.label }} key={item.label} onPress={() => { haptic.selection(); setActiveTab(item.label); }} style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}>
              <AppIcon name={item.icon} size={23} color={activeTab === item.label ? COLORS.orange : COLORS.muted} />
              <Text style={[styles.navLabel, activeTab === item.label && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background">
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />
      {mode === "phone" ? renderPhoneScreen() : mode === "otp" ? renderOtpScreen() : renderMainApp()}
      <Toast message={toast} />
      <Modal animationType="slide" transparent visible={entryModalVisible} onRequestClose={() => setEntryModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEntryModalVisible(false)}>
          <Pressable style={styles.entrySheet} onPress={() => undefined}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Nayi entry jodein</Text>
            <Text style={styles.sheetSubtitle}>Apne hisaab ko update rakhein.</Text>
            <View style={styles.entryTypeRow}>
              {(["Kamaai", "Kharch"] as const).map((type) => (
                <Pressable key={type} onPress={() => { haptic.selection(); setEntryType(type); }} style={({ pressed }) => [styles.entryTypeButton, entryType === type && styles.entryTypeButtonSelected, pressed && styles.pressed]}>
                  <Text style={[styles.entryTypeText, entryType === type && styles.entryTypeTextSelected]}>{type}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.amountInputWrap}>
              <Text style={styles.amountPrefix}>₹</Text>
              <TextInput accessibilityLabel="Entry amount" autoFocus keyboardType="number-pad" onChangeText={(value) => setEntryAmount(value.replace(/\D/g, ""))} placeholder="Amount" placeholderTextColor={COLORS.placeholder} style={styles.amountInput} value={entryAmount} />
            </View>
            <PrimaryButton label="Save entry" icon="check" onPress={saveEntry} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function LedgerRow({ icon, title, subtitle, value, color }: { icon: string; title: string; subtitle: string; value: string; color: string }) {
  return (
    <View style={styles.ledgerRow}>
      <View style={[styles.ledgerIcon, { backgroundColor: color === COLORS.success ? COLORS.successSoft : COLORS.cream }]}>
        <AppIcon name={icon} size={20} color={color} />
      </View>
      <View style={styles.ledgerCopy}><Text style={styles.ledgerTitle}>{title}</Text><Text style={styles.ledgerSubtitle}>{subtitle}</Text></View>
      <Text style={[styles.ledgerValue, { color }]}>{value}</Text>
    </View>
  );
}

function SkillCard({ skill, percent, progressStyle }: { skill: string; percent: string; progressStyle: object }) {
  return (
    <View style={styles.verifiedSkillCard}>
      <View style={styles.skillCardTop}><AppIcon name="construction" size={20} color={COLORS.orange} /><Text style={styles.skillPercent}>{percent}</Text></View>
      <Text style={styles.skillName}>{skill}</Text>
      <View style={styles.skillTrack}><View style={progressStyle} /></View>
    </View>
  );
}

function SettingRow({ icon, label, onPress, destructive = false }: { icon: string; label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.settingRow, pressed && styles.quickActionPressed]}>
      <View style={styles.settingIcon}><AppIcon name={icon} size={21} color={destructive ? COLORS.error : COLORS.navy} /></View>
      <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>{label}</Text>
      <AppIcon name="chevron-right" size={22} color={COLORS.muted} />
    </Pressable>
  );
}

const COLORS = {
  navy: "#182B4A",
  navySoft: "#27436E",
  orange: "#FF6B0A",
  amber: "#F5B44C",
  amberDark: "#A96A13",
  canvas: "#F8FAFC",
  white: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#E5EAF1",
  muted: "#718096",
  placeholder: "#A7B0BD",
  success: "#25B96C",
  successSoft: "#EAF9F0",
  cream: "#FFF7EA",
  error: "#D9534F",
};

const styles = StyleSheet.create({
  addLink: { padding: 4 },
  addLinkText: { color: COLORS.orange, fontSize: 13, fontWeight: "800" },
  amountInput: { color: COLORS.navy, flex: 1, fontSize: 18, fontWeight: "700", height: 54 },
  amountInputWrap: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", marginBottom: 16, paddingHorizontal: 16 },
  amountPrefix: { color: COLORS.navy, fontSize: 22, fontWeight: "800", marginRight: 8 },
  appShell: { backgroundColor: COLORS.canvas, flex: 1 },
  authContent: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  authHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 },
  authScreen: { backgroundColor: COLORS.canvas, flex: 1, paddingBottom: 18 },
  authSubtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginBottom: 30, marginTop: 8 },
  authTitle: { color: COLORS.navy, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, lineHeight: 34, marginTop: 8 },
  backButton: { alignItems: "center", flexDirection: "row", gap: 5, marginLeft: 14, marginTop: 4, padding: 10, width: 86 },
  backText: { color: COLORS.navy, fontSize: 15, fontWeight: "700" },
  bottomNav: { backgroundColor: COLORS.white, borderTopColor: COLORS.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", minHeight: 62, paddingHorizontal: 4, paddingTop: 7 },
  bottomNavSafeArea: { backgroundColor: COLORS.white },
  brandAI: { color: COLORS.orange },
  brandMark: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 14, height: 46, justifyContent: "center", width: 46 },
  brandMarkCompact: { borderRadius: 10, height: 36, width: 36 },
  brandName: { color: COLORS.navy, fontSize: 19, fontWeight: "800" },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 9 },
  contractorAvatar: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 11, height: 40, justifyContent: "center", width: 40 },
  contractorInitial: { color: COLORS.white, fontSize: 17, fontWeight: "800" },
  contractorName: { color: COLORS.navy, fontSize: 15, fontWeight: "800" },
  contractorRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  countryCode: { color: COLORS.navy, fontSize: 16, fontWeight: "800" },
  demoStrip: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 12, flexDirection: "row", gap: 10, marginTop: 14, paddingHorizontal: 14, paddingVertical: 14 },
  demoStripText: { color: COLORS.amberDark, fontSize: 13, fontWeight: "700" },
  digitalIdCard: { backgroundColor: COLORS.navy, borderRadius: 18, marginBottom: 22, padding: 18 },
  disclaimerText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: "center" },
  emptyState: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, gap: 8, padding: 32 },
  emptyText: { color: COLORS.muted, fontSize: 14, textAlign: "center" },
  emptyTitle: { color: COLORS.navy, fontSize: 17, fontWeight: "800" },
  entrySheet: { backgroundColor: COLORS.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxWidth: 720, padding: 22, width: "100%" },
  entryTypeButton: { alignItems: "center", borderColor: COLORS.border, borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 12 },
  entryTypeButtonSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  entryTypeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  entryTypeText: { color: COLORS.navy, fontSize: 14, fontWeight: "800" },
  entryTypeTextSelected: { color: COLORS.white },
  experienceCard: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 18, padding: 16 },
  experienceHint: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  eyebrow: { color: COLORS.amberDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginBottom: 5 },
  eyebrowOrange: { color: COLORS.amberDark, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  fairnessMessage: { alignItems: "center", backgroundColor: COLORS.successSoft, borderRadius: 14, flexDirection: "row", gap: 11, marginTop: 18, padding: 15 },
  fairnessText: { color: COLORS.navy, flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  filterPill: { borderColor: COLORS.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 9 },
  filterPillSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterPillText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  filterPillTextSelected: { color: COLORS.white },
  filterRow: { flexDirection: "row", gap: 9, marginBottom: 14 },
  formLabel: { color: COLORS.navy, fontSize: 15, fontWeight: "800", marginTop: 22 },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  highBadge: { alignItems: "center", backgroundColor: "#1E4F4A", borderRadius: 18, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  highBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
  idCardEyebrow: { color: COLORS.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  idCardTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  idIssue: { color: "#C9D3E4", fontSize: 13 },
  idNumber: { color: COLORS.white, fontSize: 21, fontWeight: "800", marginBottom: 9, marginTop: 32 },
  jobCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, gap: 14, marginTop: 12, padding: 16 },
  jobCardCompact: { marginTop: 2 },
  jobDuration: { alignItems: "center", flexDirection: "row", gap: 4 },
  jobDurationText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  jobInfoRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  jobInfoText: { color: COLORS.muted, flex: 1, fontSize: 13, lineHeight: 19 },
  jobMetaRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 12 },
  jobSalary: { color: COLORS.navy, fontSize: 20, fontWeight: "800" },
  jobTitle: { color: COLORS.navy, fontSize: 18, fontWeight: "800", lineHeight: 24 },
  jobTopRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  languageChoice: { alignItems: "center", justifyContent: "center", minHeight: 32, minWidth: 35 },
  languageChoiceText: { color: COLORS.navy, fontSize: 12, fontWeight: "800" },
  languageDivider: { backgroundColor: COLORS.border, height: 18, width: 1 },
  languageToggle: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", paddingHorizontal: 2 },
  ledgerCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  ledgerCopy: { flex: 1 },
  ledgerIcon: { alignItems: "center", borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  ledgerRow: { alignItems: "center", borderTopColor: COLORS.border, borderTopWidth: 1, flexDirection: "row", gap: 11, padding: 14 },
  ledgerSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  ledgerTab: { alignItems: "center", flex: 1, paddingVertical: 11 },
  ledgerTabSelected: { borderBottomColor: COLORS.orange, borderBottomWidth: 3 },
  ledgerTabText: { color: COLORS.muted, fontSize: 14, fontWeight: "800" },
  ledgerTabTextSelected: { color: COLORS.navy },
  ledgerTabs: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 13, borderWidth: 1, flexDirection: "row", marginTop: 16 },
  ledgerTitle: { color: COLORS.navy, fontSize: 14, fontWeight: "800" },
  ledgerValue: { fontSize: 15, fontWeight: "800" },
  legalText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, paddingHorizontal: 32, textAlign: "center" },
  linkButton: { padding: 4 },
  linkText: { color: COLORS.orange, fontSize: 13, fontWeight: "800" },
  listCount: { color: COLORS.muted, fontSize: 13, fontWeight: "600", marginBottom: 2 },
  lockBadge: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 15, height: 58, justifyContent: "center", marginBottom: 20, width: 58 },
  mainContent: { flex: 1 },
  matchBadge: { alignItems: "center", backgroundColor: COLORS.successSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  matchLabel: { color: COLORS.success, fontSize: 8, fontWeight: "800", marginTop: 1 },
  matchLine82: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "82%" },
  matchLine94: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "94%" },
  matchLineTrack: { backgroundColor: "#E1EEE6", borderRadius: 4, height: 5, overflow: "hidden" },
  matchValue: { color: "#238C54", fontSize: 15, fontWeight: "900" },
  metricCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, flex: 1, gap: 6, minHeight: 112, padding: 12 },
  metricLabel: { color: COLORS.muted, fontSize: 11, lineHeight: 15 },
  metricValue: { color: COLORS.navy, fontSize: 20, fontWeight: "800" },
  metricsRow: { flexDirection: "row", gap: 8, marginTop: 14 },
  modalBackdrop: { backgroundColor: "rgba(16, 30, 52, 0.45)", flex: 1, justifyContent: "flex-end" },
  navItem: { alignItems: "center", flex: 1, gap: 3, minHeight: 50, justifyContent: "center" },
  navItemPressed: { opacity: 0.6 },
  navLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  navLabelActive: { color: COLORS.orange },
  notificationButton: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, height: 36, justifyContent: "center", width: 36 },
  otpContent: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  otpInput: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 15, borderWidth: 1, color: COLORS.navy, flex: 1, fontSize: 27, fontWeight: "800", height: 65, textAlign: "center" },
  otpInputFilled: { backgroundColor: COLORS.cream, borderColor: COLORS.orange },
  otpRow: { flexDirection: "row", gap: 9, marginBottom: 8 },
  pageHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  pageHeaderTextBlock: { flex: 1, paddingRight: 8 },
  pageSubtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginBottom: 18, marginTop: -9 },
  pageTitle: { color: COLORS.navy, fontSize: 25, fontWeight: "800", letterSpacing: -0.4, lineHeight: 31 },
  pendingBanner: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 15, flexDirection: "row", gap: 11, marginTop: 14, padding: 14 },
  pendingCopy: { flex: 1 },
  pendingDescription: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  pendingIcon: { alignItems: "center", backgroundColor: "#FFDFC0", borderRadius: 11, height: 40, justifyContent: "center", width: 40 },
  pendingTitle: { color: "#8F4E0A", fontSize: 14, fontWeight: "800" },
  phoneDivider: { backgroundColor: COLORS.border, height: 28, marginHorizontal: 12, width: 1 },
  phoneField: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 15, borderWidth: 1, flexDirection: "row", height: 62, marginBottom: 14, paddingHorizontal: 16 },
  phoneInput: { color: COLORS.navy, flex: 1, fontSize: 17, fontWeight: "600", height: 60 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  primaryButton: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 15, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 56, paddingHorizontal: 20 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "800" },
  profileAvatar: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 17, height: 64, justifyContent: "center", width: 64 },
  profileAvatarText: { color: COLORS.white, fontSize: 22, fontWeight: "800" },
  profileIntro: { alignItems: "center", flexDirection: "row", gap: 13, marginBottom: 20 },
  profileLocation: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  profileName: { color: COLORS.navy, fontSize: 20, fontWeight: "800" },
  progressFill87: { backgroundColor: COLORS.success, borderRadius: 4, height: 6, width: "87%" },
  progressTrack: { backgroundColor: "#4A6287", borderRadius: 4, height: 6, marginTop: 18, overflow: "hidden" },
  quickAction: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 58, paddingHorizontal: 14 },
  quickActionIcon: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 11, height: 36, justifyContent: "center", width: 36 },
  quickActionPressed: { backgroundColor: "#F4F7FA" },
  quickActionText: { color: COLORS.navy, flex: 1, fontSize: 14, fontWeight: "700" },
  quickActionsCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, marginTop: 12, overflow: "hidden" },
  reliabilityRow: { alignItems: "center", flexDirection: "row", gap: 3, marginTop: 3 },
  reliabilityText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  resendText: { color: COLORS.muted, fontSize: 13, marginTop: 22, textAlign: "center" },
  resendTimer: { color: COLORS.navy, fontWeight: "800" },
  savingsCard: { backgroundColor: COLORS.navy, borderRadius: 18, padding: 19 },
  savingsLabel: { color: "#D4DEEA", fontSize: 13 },
  savingsMeta: { color: "#D4DEEA", fontSize: 13, marginTop: 8 },
  savingsValue: { color: COLORS.white, fontSize: 34, fontWeight: "900", marginTop: 6 },
  scrollContent: { alignSelf: "center", gap: 0, maxWidth: 720, paddingBottom: 22, paddingHorizontal: 20, paddingTop: 12, width: "100%" },
  searchField: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 8, height: 50, marginBottom: 12, paddingHorizontal: 14 },
  searchInput: { color: COLORS.navy, flex: 1, fontSize: 15, height: 50 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12, marginTop: 22 },
  sectionTitle: { color: COLORS.navy, fontSize: 18, fontWeight: "800" },
  settingIcon: { alignItems: "center", backgroundColor: COLORS.canvas, borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  settingLabel: { color: COLORS.navy, flex: 1, fontSize: 15, fontWeight: "700" },
  settingLabelDestructive: { color: COLORS.error },
  settingRow: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 58, paddingHorizontal: 14 },
  settingsCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, marginTop: 12, overflow: "hidden" },
  sheetHandle: { alignSelf: "center", backgroundColor: COLORS.border, borderRadius: 3, height: 5, marginBottom: 18, width: 45 },
  sheetSubtitle: { color: COLORS.muted, fontSize: 14, marginBottom: 20, marginTop: 5 },
  sheetTitle: { color: COLORS.navy, fontSize: 22, fontWeight: "800" },
  skillCardTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  skillChip: { backgroundColor: COLORS.cream, borderRadius: 12, marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 4 },
  skillChipText: { color: COLORS.amberDark, fontSize: 11, fontWeight: "800" },
  skillName: { color: COLORS.navy, fontSize: 15, fontWeight: "800", marginTop: 19 },
  skillOption: { alignItems: "center", borderColor: COLORS.border, borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 13 },
  skillOptionSelected: { backgroundColor: COLORS.cream, borderColor: COLORS.orange },
  skillOptionText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" },
  skillOptionTextSelected: { color: COLORS.amberDark },
  skillPercent: { color: COLORS.success, fontSize: 14, fontWeight: "900" },
  skillProgress75: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "75%" },
  skillProgress88: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "88%" },
  skillSelector: { flexDirection: "row", gap: 8, marginTop: 10 },
  skillTrack: { backgroundColor: "#E1EEE6", borderRadius: 4, height: 5, marginTop: 10, overflow: "hidden" },
  stepper: { alignItems: "center", flexDirection: "row", gap: 12 },
  stepperButton: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  stepperButtonDisabled: { opacity: 0.45 },
  stepperValue: { color: COLORS.navy, fontSize: 18, fontWeight: "800", minWidth: 18, textAlign: "center" },
  toast: { alignItems: "center", alignSelf: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 22, borderWidth: 1, bottom: 94, elevation: 5, flexDirection: "row", gap: 8, maxWidth: "90%", paddingHorizontal: 15, paddingVertical: 11, position: "absolute", shadowColor: COLORS.navy, shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.12, shadowRadius: 12 },
  toastText: { color: COLORS.navy, fontSize: 13, fontWeight: "700", maxWidth: 260 },
  totalExpense: { color: COLORS.orange, fontSize: 20, fontWeight: "900" },
  totalIncome: { color: COLORS.success, fontSize: 20, fontWeight: "900" },
  totalLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  totalRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 15 },
  trustCard: { backgroundColor: COLORS.navy, borderRadius: 19, padding: 18 },
  trustDescription: { color: "#D4DEEA", fontSize: 13, marginTop: 10 },
  trustLabel: { color: "#D4DEEA", fontSize: 13, fontWeight: "700" },
  trustOutOf: { color: "#B5C2D6", fontSize: 14, fontWeight: "700", marginBottom: 6 },
  trustScore: { color: COLORS.white, fontSize: 42, fontWeight: "900", lineHeight: 48 },
  trustScoreRow: { alignItems: "flex-end", flexDirection: "row", gap: 3, marginTop: 4 },
  trustTopRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  verifiedIdentityRow: { alignItems: "center", flexDirection: "row", gap: 5, marginTop: 7 },
  verifiedIdentityText: { color: COLORS.success, fontSize: 13, fontWeight: "800" },
  verifiedSkillCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, flex: 1, padding: 14 },
  verifiedSkillsRow: { flexDirection: "row", gap: 10, marginBottom: 22, marginTop: 12 },
  wageCard: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 19, padding: 24 },
  wageDivider: { backgroundColor: "#486486", height: 1, marginTop: 16, width: "100%" },
  wageEyebrow: { color: COLORS.amber, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  wageMeta: { color: "#DFE6F0", fontSize: 14, marginTop: 17 },
  wageUnit: { color: "#D4DEEA", fontSize: 13, marginTop: 5 },
  wageValue: { color: COLORS.white, fontSize: 28, fontWeight: "900", marginTop: 14, textAlign: "center" },
});
