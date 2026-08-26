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
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { ContractorTrustPanel } from "@/components/contractor-trust-panel";
import { ProfilePhotoControl } from "@/components/profile-photo-control";
import { haptic } from "@/lib/haptics";
import { copy, skillLabels, type AppCopy } from "@/lib/shramsetu-copy";
import {
  createLocalJob,
  filterJobs,
  financeSeries,
  getChartMaximum,
  getFairWageRange,
  jobs,
  sortJobs,
  type Job,
  type JobFilter,
  type JobSort,
  type Language,
  type WorkerSkill,
  validateDemoOtp,
} from "@/lib/shramsetu-logic";

type AuthMode = "phone" | "otp" | "app";
type AppTab = "Home" | "Kaam" | "Fair Wage" | "Hisab" | "Profile";
type LedgerMode = "Kamaai" | "Kharch" | "Bachat";
type ChartPeriod = "week" | "month";

const NAV_ITEMS: Array<{ key: AppTab; icon: string }> = [
  { key: "Home", icon: "home" },
  { key: "Kaam", icon: "work-outline" },
  { key: "Fair Wage", icon: "account-balance-wallet" },
  { key: "Hisab", icon: "receipt-long" },
  { key: "Profile", icon: "person-outline" },
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

function LanguageToggle({ language, onSelect }: { language: Language; onSelect: (language: Language) => void }) {
  return (
    <View style={styles.languageToggle}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: language === "Hindi" }} accessibilityLabel="Switch to Hindi" onPress={() => onSelect("Hindi")} style={({ pressed }) => [styles.languageChoice, language === "Hindi" && styles.languageChoiceActive, pressed && styles.pressed]}>
        <Text style={[styles.languageChoiceText, language === "Hindi" && styles.languageChoiceTextActive]}>हिं</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: language === "English" }} accessibilityLabel="Switch to English" onPress={() => onSelect("English")} style={({ pressed }) => [styles.languageChoice, language === "English" && styles.languageChoiceActive, pressed && styles.pressed]}>
        <Text style={[styles.languageChoiceText, language === "English" && styles.languageChoiceTextActive]}>EN</Text>
      </Pressable>
    </View>
  );
}

function AuthHeader({ language, onLanguage }: { language: Language; onLanguage: (language: Language) => void }) {
  return (
    <View style={styles.authHeader}>
      <View style={styles.brandRow}><BrandMark compact /><Text style={styles.brandName}>ShramSetu <Text style={styles.brandAI}>AI</Text></Text></View>
      <LanguageToggle language={language} onSelect={onLanguage} />
    </View>
  );
}

function PageHeader({ title, language, onLanguage, notification = false }: { title: string; language: Language; onLanguage: (language: Language) => void; notification?: boolean }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderTextBlock}><Text style={styles.eyebrow}>SHRAMSETU AI</Text><Text style={styles.pageTitle}>{title}</Text></View>
      <View style={styles.headerActions}>
        <LanguageToggle language={language} onSelect={onLanguage} />
        {notification ? <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}><AppIcon name="notifications-none" size={22} /></Pressable> : null}
      </View>
    </View>
  );
}

function PrimaryButton({ label, onPress, icon = "arrow-forward" }: { label: string; onPress: () => void; icon?: string }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><AppIcon name={icon} size={20} color={COLORS.white} /><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return <View style={styles.toast}><AppIcon name="check-circle" size={18} color={COLORS.success} /><Text style={styles.toastText}>{message}</Text></View>;
}

function TrustCard({ c }: { c: AppCopy }) {
  return (
    <View style={[styles.trustCard, polish.trustCard]}>
      <View style={styles.trustTopRow}>
        <View><Text style={styles.trustLabel}>{c.score}</Text><View style={styles.trustScoreRow}><Text style={styles.trustScore}>87</Text><Text style={styles.trustOutOf}>/100</Text></View></View>
        <View style={[styles.highBadge, polish.highBadge]}><AppIcon name="check-circle" size={14} color={COLORS.success} /><Text style={styles.highBadgeText}>HIGH</Text></View>
      </View>
      <View style={styles.progressTrack}><View style={styles.progressFill87} /></View>
      <Text style={styles.trustDescription}>{c.verified}</Text>
    </View>
  );
}

function MetricCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return <View style={[styles.metricCard, polish.metricCard]}><AppIcon name={icon} size={20} color={color} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function JobCard({ job, language, c, onApply, compact = false }: { job: Job; language: Language; c: AppCopy; onApply: () => void; compact?: boolean }) {
  return (
    <View style={[styles.jobCard, polish.jobCard, compact && styles.jobCardCompact]}>
      <View style={styles.jobTopRow}>
        <View style={styles.contractorRow}><View style={styles.contractorAvatar}><Text style={styles.contractorInitial}>{job.initial}</Text></View><View><Text style={styles.contractorName}>{job.contractor}</Text><View style={styles.reliabilityRow}><Text style={styles.reliabilityText}>{job.reliability}</Text><AppIcon name="verified" size={13} color={COLORS.success} /></View></View></View>
        <View style={styles.matchBadge}><Text style={styles.matchValue}>{job.match}%</Text><Text style={styles.matchLabel}>MATCH</Text></View>
      </View>
      <Text style={styles.jobTitle}>{job.title[language]}</Text>
      <View style={styles.jobInfoRow}><AppIcon name="location-on" size={16} color={COLORS.muted} /><Text style={styles.jobInfoText}>{job.location[language]}</Text></View>
      <View style={styles.jobMetaRow}><Text style={styles.jobSalary}>{formatRupees(job.salary)}/{c.perDay}</Text><View style={styles.jobDuration}><AppIcon name="calendar-today" size={14} color={COLORS.muted} /><Text style={styles.jobDurationText}>{job.duration} {c.days}</Text></View><View style={styles.skillChip}><Text style={styles.skillChipText}>{skillLabels[language][job.skill]}</Text></View></View>
      <View style={styles.matchLineTrack}><View style={job.match > 90 ? styles.matchLine94 : styles.matchLine82} /></View>
      <View style={reference.jobChecks}>
        <View style={reference.jobCheckItem}><AppIcon name="check-circle" size={15} color={COLORS.success} /><Text style={reference.jobCheckText}>{language === "Hindi" ? "Aapki skill aur location se match" : "Matches your skills and location"}</Text></View>
        <View style={reference.jobCheckItem}><AppIcon name="check-circle" size={15} color={COLORS.success} /><Text style={reference.jobCheckText}>{language === "Hindi" ? "Contractor ka payment record reliable hai" : "Contractor payment record is reliable"}</Text></View>
      </View>
      <PrimaryButton label={c.apply} icon="arrow-forward" onPress={onApply} />
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, polish.quickAction, pressed && styles.quickActionPressed]}><View style={[styles.quickActionIcon, polish.quickActionIcon]}><AppIcon name={icon} size={19} color={COLORS.orange} /></View><Text style={styles.quickActionText}>{label}</Text><View style={polish.quickActionArrow}><AppIcon name="chevron-right" size={18} color={COLORS.muted} /></View></Pressable>;
}

function EarningsChart({ c }: { c: AppCopy }) {
  const [period, setPeriod] = useState<ChartPeriod>("week");
  const { width } = useWindowDimensions();
  const points = financeSeries[period];
  const maximum = getChartMaximum(points);
  const chartWidth = Math.max(260, Math.min(580, width - 84));
  const chartHeight = 154;
  const baseline = 112;
  const drawableHeight = 82;
  const groupWidth = chartWidth / points.length;
  const barWidth = Math.max(8, Math.min(17, (groupWidth - 10) / 2));

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartTitleRow}><Text style={styles.chartTitle}>{c.chartTitle}</Text><View style={styles.periodToggle}><Pressable onPress={() => setPeriod("week")} style={[styles.periodChoice, period === "week" && styles.periodChoiceActive]}><Text style={[styles.periodText, period === "week" && styles.periodTextActive]}>{c.chartWeek}</Text></Pressable><Pressable onPress={() => setPeriod("month")} style={[styles.periodChoice, period === "month" && styles.periodChoiceActive]}><Text style={[styles.periodText, period === "month" && styles.periodTextActive]}>{c.chartMonth}</Text></Pressable></View></View>
      <View style={styles.chartLegend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.success }]} /><Text style={styles.legendText}>{c.earnings}</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.orange }]} /><Text style={styles.legendText}>{c.spend}</Text></View></View>
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {[0, 1, 2].map((line) => <Rect key={`line-${line}`} x={0} y={30 + line * 35} width={chartWidth} height={1} fill={COLORS.border} />)}
        {points.map((point, index) => {
          const center = index * groupWidth + groupWidth / 2;
          const incomeHeight = (point.income / maximum) * drawableHeight;
          const expenseHeight = (point.expense / maximum) * drawableHeight;
          return <Rect key={`${point.label}-income`} x={center - barWidth - 2} y={baseline - incomeHeight} width={barWidth} height={incomeHeight} rx={4} fill={COLORS.success} />;
        })}
        {points.map((point, index) => {
          const center = index * groupWidth + groupWidth / 2;
          const expenseHeight = (point.expense / maximum) * drawableHeight;
          return <Rect key={`${point.label}-expense`} x={center + 2} y={baseline - expenseHeight} width={barWidth} height={expenseHeight} rx={4} fill={COLORS.orange} />;
        })}
        {points.map((point, index) => <SvgText key={`${point.label}-label`} x={index * groupWidth + groupWidth / 2} y={137} fill={COLORS.muted} fontSize={10} fontWeight="700" textAnchor="middle">{point.label}</SvgText>)}
      </Svg>
    </View>
  );
}

export default function HomeScreen() {
  const [mode, setMode] = useState<AuthMode>("phone");
  const [activeTab, setActiveTab] = useState<AppTab>("Home");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [toast, setToast] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("Hindi");
  const [jobFeed, setJobFeed] = useState<Job[]>(jobs);
  const [jobFilter, setJobFilter] = useState<JobFilter>("All");
  const [jobSort, setJobSort] = useState<JobSort>("nearest");
  const [jobQuery, setJobQuery] = useState("");
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [workerSkill, setWorkerSkill] = useState<WorkerSkill>("Mason");
  const [experience, setExperience] = useState(7);
  const [ledgerMode, setLedgerMode] = useState<LedgerMode>("Kamaai");
  const [entryModalVisible, setEntryModalVisible] = useState(false);
  const [entryAmount, setEntryAmount] = useState("");
  const [entryType, setEntryType] = useState<"Kamaai" | "Kharch">("Kamaai");
  const [latestEntry, setLatestEntry] = useState<number | null>(null);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [newJob, setNewJob] = useState({ contractor: "", title: "", location: "", salary: "", duration: "", skill: "Mason" as WorkerSkill });
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const c = copy[language];
  const filteredJobs = useMemo(() => sortJobs(filterJobs(jobFeed, jobQuery, jobFilter), jobSort), [jobFeed, jobFilter, jobQuery, jobSort]);
  const wageRange = useMemo(() => getFairWageRange(workerSkill, experience), [workerSkill, experience]);

  const showToast = (message: string) => { setToast(message); setTimeout(() => setToast(null), 2600); };
  const chooseLanguage = (selectedLanguage: Language) => { haptic.selection(); setLanguage(selectedLanguage); showToast(copy[selectedLanguage].languageToast); };
  const continueToOtp = () => { if (phone.replace(/\D/g, "").length !== 10) { haptic.error(); showToast(c.phoneInvalid); return; } haptic.light(); setOtp(["", "", "", ""]); setMode("otp"); };
  const verifyOtp = (code = otp.join("")) => { if (!validateDemoOtp(code)) { haptic.error(); showToast(c.otpInvalid); return; } haptic.success(); setMode("app"); setActiveTab("Home"); showToast(c.verified); };
  const updateOtp = (value: string, index: number) => { const digit = value.replace(/\D/g, "").slice(-1); const nextOtp = [...otp]; nextOtp[index] = digit; setOtp(nextOtp); if (digit && index < 3) otpRefs.current[index + 1]?.focus(); if (nextOtp.join("") === "1234") setTimeout(() => verifyOtp("1234"), 120); };
  const applyToJob = (job: Job) => { if (appliedJobs.includes(job.id)) { showToast(`${job.contractor}: ${c.applied}`); return; } haptic.success(); setAppliedJobs((current) => [...current, job.id]); showToast(`${job.contractor} ${c.apply.toLowerCase()}`); };
  const saveEntry = () => { const parsedAmount = Number(entryAmount.replace(/\D/g, "")); if (!parsedAmount) { haptic.error(); showToast(c.phoneInvalid); return; } haptic.success(); setLatestEntry(parsedAmount); setEntryModalVisible(false); setEntryAmount(""); setLedgerMode(entryType); showToast(entryType === "Kamaai" ? c.earningsSaved : c.spendSaved); };
  const saveJob = () => {
    try {
      const job = createLocalJob({ contractor: newJob.contractor, title: newJob.title, location: newJob.location, salary: Number(newJob.salary), duration: Number(newJob.duration), skill: newJob.skill }, `local-job-${jobFeed.length + 1}`);
      haptic.success(); setJobFeed((current) => [job, ...current]); setJobFilter("All"); setJobQuery(""); setJobModalVisible(false); setNewJob({ contractor: "", title: "", location: "", salary: "", duration: "", skill: "Mason" }); showToast(c.newJobSaved);
    } catch { haptic.error(); showToast(c.jobsRequired); }
  };
  const logout = () => { const confirm = () => { haptic.light(); setMode("phone"); setPhone(""); setOtp(["", "", "", ""]); showToast(c.logout); }; if (Platform.OS === "web") { confirm(); return; } Alert.alert(c.logoutTitle, c.logoutConfirm, [{ text: "Cancel", style: "cancel" }, { text: c.logout, style: "destructive", onPress: confirm }]); };

  const renderPhone = () => <View style={styles.authScreen}><AuthHeader language={language} onLanguage={chooseLanguage} /><View style={[styles.authContent, reference.authContent]}><Text style={styles.eyebrowOrange}>{c.digitalIdentity}</Text><Text style={styles.authTitle}>{c.phoneTitle}</Text><Text style={styles.authSubtitle}>{c.phoneHint}</Text><View style={[styles.phoneField, reference.phoneField]}><Text style={styles.countryCode}>+91</Text><View style={styles.phoneDivider} /><TextInput accessibilityLabel="Mobile number" keyboardType="phone-pad" maxLength={10} onChangeText={(value) => setPhone(value.replace(/\D/g, ""))} placeholder="98765 43210" placeholderTextColor={COLORS.placeholder} returnKeyType="done" style={styles.phoneInput} value={phone} onSubmitEditing={continueToOtp} /></View><PrimaryButton label={c.continue} onPress={continueToOtp} /><View style={[styles.demoStrip, reference.demoStrip]}><AppIcon name="info-outline" size={19} color={COLORS.amberDark} /><Text style={styles.demoStripText}>{c.demo}: 9876543210 • OTP 1234</Text></View></View><Text style={styles.legalText}>{c.byContinuing}</Text></View>;
  const renderOtp = () => <View style={styles.authScreen}><Pressable accessibilityRole="button" onPress={() => setMode("phone")} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><AppIcon name="arrow-back" size={20} /><Text style={styles.backText}>{c.back}</Text></Pressable><View style={[styles.otpContent, reference.otpContent]}><View style={styles.lockBadge}><AppIcon name="lock" size={28} color={COLORS.orange} /></View><Text style={styles.authTitle}>{c.otp}</Text><Text style={styles.authSubtitle}>+91 {phone || "98765 43210"} {c.otpSent}</Text><View style={styles.otpRow}>{otp.map((digit, index) => <TextInput accessibilityLabel={`OTP digit ${index + 1}`} autoFocus={index === 0} caretHidden key={`otp-${index}`} keyboardType="number-pad" maxLength={1} onChangeText={(value) => updateOtp(value, index)} onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus(); }} ref={(input) => { otpRefs.current[index] = input; }} style={[styles.otpInput, reference.otpInput, digit ? styles.otpInputFilled : null]} value={digit} />)}</View><View style={[styles.demoStrip, reference.demoStrip]}><AppIcon name="auto-awesome" size={19} color={COLORS.orange} /><Text style={styles.demoStripText}>{c.demo} OTP: 1234</Text></View><PrimaryButton label={c.verify} onPress={verifyOtp} icon="verified" /><Text style={styles.resendText}>{c.otpHint}</Text></View></View>;

  const renderHome = () => <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><PageHeader language={language} onLanguage={chooseLanguage} title={c.name} notification /><TrustCard c={c} /><View style={styles.metricsRow}><MetricCard icon="trending-up" value="₹950" label={c.earningsLabel} color={COLORS.success} /><MetricCard icon="shopping-cart" value="₹350" label={c.spendLabel} color={COLORS.amberDark} /><MetricCard icon="account-balance-wallet" value="₹600" label={c.todaySavings} color={COLORS.navy} /></View><Pressable accessibilityRole="button" onPress={() => { setActiveTab("Hisab"); haptic.light(); }} style={({ pressed }) => [styles.pendingBanner, reference.pendingBanner, pressed && styles.pressed]}><View style={styles.pendingIcon}><AppIcon name="schedule" size={21} color={COLORS.orange} /></View><View style={styles.pendingCopy}><Text style={styles.pendingTitle}>{c.payment}</Text><Text style={styles.pendingDescription}>{c.pendingPayment}</Text></View><AppIcon name="chevron-right" size={24} color={COLORS.muted} /></Pressable><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{c.bestMatch}</Text><Pressable onPress={() => setActiveTab("Kaam")} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.linkText}>{c.jobsLabel}</Text></Pressable></View><JobCard job={jobFeed[0]} language={language} c={c} compact onApply={() => applyToJob(jobFeed[0])} /><Text style={styles.sectionTitle}>{language === "Hindi" ? "Quick actions" : "Quick actions"}</Text><View style={[styles.quickActionsCard, reference.quickActionsCard]}><QuickAction icon="account-balance-wallet" label={c.fair} onPress={() => setActiveTab("Fair Wage")} /><QuickAction icon="forum" label={language === "Hindi" ? "ShramSetu AI se poochhein" : "Ask ShramSetu AI"} onPress={() => showToast(language === "Hindi" ? "Sawal poochhne ka feature jald aayega" : "Questions will be available soon")} /><QuickAction icon="add-circle-outline" label={c.addEntry} onPress={() => setEntryModalVisible(true)} /><QuickAction icon="person-outline" label={c.profile} onPress={() => setActiveTab("Profile")} /></View></ScrollView>;

  const renderJobs = () => <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><PageHeader language={language} onLanguage={chooseLanguage} title={c.findJobs} /><View style={polish.jobsIntro}><View style={polish.jobsIntroIcon}><AppIcon name="verified" size={19} color={COLORS.success} /></View><View style={polish.jobsIntroCopy}><Text style={polish.jobsIntroTitle}>{language === "Hindi" ? "Verified opportunities" : "Verified opportunities"}</Text><Text style={polish.jobsIntroText}>{language === "Hindi" ? "Aapke skill aur location ke hisaab se." : "Matched to your skills and location."}</Text></View></View><View style={[styles.searchField, polish.searchField]}><AppIcon name="search" size={20} color={COLORS.muted} /><TextInput accessibilityLabel="Search jobs" onChangeText={setJobQuery} placeholder={c.searchJobs} placeholderTextColor={COLORS.placeholder} style={styles.searchInput} value={jobQuery} /></View><View style={styles.filterRow}>{(["All", "Mason", "Painter", "Electrician"] as JobFilter[]).map((filter) => <Pressable key={filter} onPress={() => { haptic.selection(); setJobFilter(filter); }} style={({ pressed }) => [styles.filterPill, jobFilter === filter && styles.filterPillSelected, pressed && styles.pressed]}><Text style={[styles.filterPillText, jobFilter === filter && styles.filterPillTextSelected]}>{filter === "All" ? c.all : skillLabels[language][filter]}</Text></Pressable>)}</View><View style={[styles.jobsHeadingRow, polish.jobsHeadingRow]}><Text style={styles.listCount}>{filteredJobs.length} {c.jobsFound} • {appliedJobs.length} {c.applied}</Text><Pressable accessibilityRole="button" onPress={() => setJobModalVisible(true)} style={({ pressed }) => [styles.addJobButton, polish.addJobButton, pressed && styles.pressed]}><AppIcon name="add" size={17} color={COLORS.white} /><Text style={styles.addJobButtonText}>{c.addJob}</Text></Pressable></View>{filteredJobs.length ? filteredJobs.map((job) => <JobCard key={job.id} job={job} language={language} c={c} onApply={() => applyToJob(job)} />) : <View style={styles.emptyState}><AppIcon name="search-off" size={30} color={COLORS.muted} /><Text style={styles.emptyTitle}>{c.noJobs}</Text><Text style={styles.emptyText}>{c.noJobsHint}</Text></View>}</ScrollView>;

  const renderFairWage = () => { const offerIsFair = wageRange.min <= 950 && wageRange.max >= 950; return <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><PageHeader language={language} onLanguage={chooseLanguage} title={c.fair} /><Text style={styles.pageSubtitle}>{c.wageDescription}</Text><View style={styles.wageCard}><Text style={styles.wageEyebrow}>{c.fairEstimate}</Text><Text style={styles.wageValue}>{formatRupees(wageRange.min)} — {formatRupees(wageRange.max)}</Text><Text style={styles.wageUnit}>{c.perDay}</Text><View style={styles.wageDivider} /><Text style={styles.wageMeta}>{skillLabels[language][workerSkill]} • {experience} {c.days} • Lucknow</Text></View><Text style={styles.formLabel}>{c.selectSkill}</Text><View style={styles.skillSelector}>{(["Mason", "Painter", "Electrician"] as WorkerSkill[]).map((skill) => <Pressable key={skill} onPress={() => { haptic.selection(); setWorkerSkill(skill); }} style={({ pressed }) => [styles.skillOption, workerSkill === skill && styles.skillOptionSelected, pressed && styles.pressed]}><Text style={[styles.skillOptionText, workerSkill === skill && styles.skillOptionTextSelected]}>{skillLabels[language][skill]}</Text></Pressable>)}</View><View style={styles.experienceCard}><View><Text style={styles.formLabel}>{c.experience}: {experience} {c.days}</Text><Text style={styles.experienceHint}>{c.experienceHint}</Text></View><View style={styles.stepper}><Pressable disabled={experience <= 1} onPress={() => { haptic.selection(); setExperience((value) => Math.max(1, value - 1)); }} style={({ pressed }) => [styles.stepperButton, experience <= 1 && styles.stepperButtonDisabled, pressed && styles.pressed]}><AppIcon name="remove" size={20} /></Pressable><Text style={styles.stepperValue}>{experience}</Text><Pressable disabled={experience >= 20} onPress={() => { haptic.selection(); setExperience((value) => Math.min(20, value + 1)); }} style={({ pressed }) => [styles.stepperButton, experience >= 20 && styles.stepperButtonDisabled, pressed && styles.pressed]}><AppIcon name="add" size={20} /></Pressable></View></View><View style={styles.fairnessMessage}><AppIcon name={offerIsFair ? "check-circle" : "info-outline"} size={22} color={offerIsFair ? COLORS.success : COLORS.orange} /><Text style={styles.fairnessText}>{offerIsFair ? c.fairInRange : c.fairOutOfRange}</Text></View><Text style={styles.disclaimerText}>{c.fairAdvice}</Text></ScrollView>; };

  const renderLedger = () => { if (ledgerMode === "Kamaai") return <View style={styles.ledgerCard}><View style={styles.totalRow}><Text style={styles.totalLabel}>{c.total}</Text><Text style={styles.totalIncome}>₹950</Text></View>{latestEntry && entryType === "Kamaai" ? <LedgerRow icon="add" title={c.newEarning} subtitle="Now" value={`₹${latestEntry}`} color={COLORS.success} /> : null}<LedgerRow icon="south" title="Daily wage" subtitle="Today" value="₹950" color={COLORS.success} /><LedgerRow icon="south" title="ABC Construction" subtitle="Yesterday" value="₹950" color={COLORS.success} /></View>; if (ledgerMode === "Kharch") return <View style={styles.ledgerCard}><View style={styles.totalRow}><Text style={styles.totalLabel}>{c.total}</Text><Text style={styles.totalExpense}>₹350</Text></View>{latestEntry && entryType === "Kharch" ? <LedgerRow icon="remove" title={c.newExpense} subtitle="Now" value={`₹${latestEntry}`} color={COLORS.orange} /> : null}<LedgerRow icon="north-east" title="Travel and tea" subtitle="Today" value="₹150" color={COLORS.orange} /><LedgerRow icon="north-east" title="Tools maintenance" subtitle="Yesterday" value="₹200" color={COLORS.orange} /></View>; return <View style={styles.ledgerCard}><View style={styles.totalRow}><Text style={styles.totalLabel}>{c.monthlySavings}</Text><Text style={styles.totalIncome}>₹600</Text></View><LedgerRow icon="savings" title="Available after expenses" subtitle="Current month" value="₹600" color={COLORS.navy} /></View>; };
  const renderHisab = () => <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><PageHeader language={language} onLanguage={chooseLanguage} title={c.yourMoney} /><View style={[styles.savingsCard, polish.savingsCard]}><View style={polish.savingsTopLine}><Text style={styles.savingsLabel}>{c.monthlySavings}</Text><View style={polish.savingsStatus}><AppIcon name="trending-up" size={14} color={COLORS.success} /><Text style={polish.savingsStatusText}>{language === "Hindi" ? "On track" : "On track"}</Text></View></View><Text style={styles.savingsValue}>₹600</Text><View style={polish.savingsRule} /><Text style={styles.savingsMeta}>{c.trend}</Text></View><EarningsChart c={c} /><View style={styles.ledgerTabs}>{(["Kamaai", "Kharch", "Bachat"] as LedgerMode[]).map((item) => <Pressable key={item} onPress={() => { haptic.selection(); setLedgerMode(item); }} style={({ pressed }) => [styles.ledgerTab, ledgerMode === item && styles.ledgerTabSelected, pressed && styles.pressed]}><Text style={[styles.ledgerTabText, ledgerMode === item && styles.ledgerTabTextSelected]}>{item === "Kamaai" ? c.earnings : item === "Kharch" ? c.spend : c.savings}</Text></Pressable>)}</View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{ledgerMode === "Kamaai" ? c.recentEarnings : ledgerMode === "Kharch" ? c.recentExpenses : c.savingsPlan}</Text><Pressable accessibilityRole="button" onPress={() => setEntryModalVisible(true)} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.linkText}>{c.addEntry}</Text></Pressable></View>{renderLedger()}</ScrollView>;

  const renderProfile = () => <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}><PageHeader language={language} onLanguage={chooseLanguage} title={c.profile} /><View style={styles.profileIntro}><View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>RK</Text></View><View><Text style={styles.profileName}>Ramesh Kumar</Text><Text style={styles.profileLocation}>Lucknow, Uttar Pradesh</Text><View style={styles.verifiedIdentityRow}><AppIcon name="check-circle" size={16} color={COLORS.success} /><Text style={styles.verifiedIdentityText}>{c.verifiedIdentity}</Text></View></View></View><View style={styles.digitalIdCard}><View style={styles.idCardTopRow}><Text style={styles.idCardEyebrow}>{c.digitalId}</Text><AppIcon name="qr-code" size={28} color={COLORS.white} /></View><Text style={styles.idNumber}>SS • 9876 5432 10</Text><Text style={styles.idIssue}>Issued 12 Jan 2024 • Active</Text></View><Text style={styles.sectionTitle}>{c.verifiedSkills}</Text><View style={styles.verifiedSkillsRow}><SkillCard skill={skillLabels[language].Mason} percent="88%" progressStyle={styles.skillProgress88} /><SkillCard skill={skillLabels[language].Painter} percent="75%" progressStyle={styles.skillProgress75} /></View><Text style={styles.sectionTitle}>{c.profileSettings}</Text><View style={styles.settingsCard}><View style={styles.languageSettingRow}><View style={styles.settingIcon}><AppIcon name="language" size={21} /></View><View style={styles.settingCopy}><Text style={styles.settingLabel}>{c.language}</Text><Text style={styles.settingHint}>{c.languageHint}</Text></View><LanguageToggle language={language} onSelect={chooseLanguage} /></View><SettingRow icon="help-outline" label="Help & support" onPress={() => showToast("Support is ready to help")} /><SettingRow icon="lock-outline" label="Privacy & security" onPress={() => showToast("Privacy settings are local")} /><SettingRow icon="logout" label={c.logout} destructive onPress={logout} /></View></ScrollView>;
  const renderEnhancedJobs = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <PageHeader language={language} onLanguage={chooseLanguage} title={c.findJobs} />
      <View style={jobsEnhancements.locationPanel}>
        <View style={jobsEnhancements.locationIcon}><AppIcon name="near-me" size={19} color={COLORS.success} /></View>
        <View style={jobsEnhancements.locationCopy}><Text style={jobsEnhancements.locationTitle}>{language === "Hindi" ? "Sabse paas ke kaam" : "Jobs nearest to you"}</Text><Text style={jobsEnhancements.locationText}>{language === "Hindi" ? "Lucknow se distance ke hisaab se" : "Sorted by distance from Lucknow"}</Text></View>
        <View style={jobsEnhancements.sortToggle}>
          <Pressable onPress={() => { haptic.selection(); setJobSort("nearest"); }} style={[jobsEnhancements.sortChoice, jobSort === "nearest" && jobsEnhancements.sortChoiceActive]}><Text style={[jobsEnhancements.sortChoiceText, jobSort === "nearest" && jobsEnhancements.sortChoiceTextActive]}>{language === "Hindi" ? "Paas" : "Near"}</Text></Pressable>
          <Pressable onPress={() => { haptic.selection(); setJobSort("best-match"); }} style={[jobsEnhancements.sortChoice, jobSort === "best-match" && jobsEnhancements.sortChoiceActive]}><Text style={[jobsEnhancements.sortChoiceText, jobSort === "best-match" && jobsEnhancements.sortChoiceTextActive]}>{language === "Hindi" ? "Match" : "Match"}</Text></Pressable>
        </View>
      </View>
      <View style={[styles.searchField, polish.searchField]}><AppIcon name="search" size={20} color={COLORS.muted} /><TextInput accessibilityLabel="Search jobs" onChangeText={setJobQuery} placeholder={c.searchJobs} placeholderTextColor={COLORS.placeholder} style={styles.searchInput} value={jobQuery} /></View>
      <View style={styles.filterRow}>{(["All", "Mason", "Painter", "Electrician"] as JobFilter[]).map((filter) => <Pressable key={filter} onPress={() => { haptic.selection(); setJobFilter(filter); }} style={({ pressed }) => [styles.filterPill, jobFilter === filter && styles.filterPillSelected, pressed && styles.pressed]}><Text style={[styles.filterPillText, jobFilter === filter && styles.filterPillTextSelected]}>{filter === "All" ? c.all : skillLabels[language][filter]}</Text></Pressable>)}</View>
      <View style={[styles.jobsHeadingRow, polish.jobsHeadingRow]}><Text style={styles.listCount}>{filteredJobs.length} {c.jobsFound} • {appliedJobs.length} {c.applied}</Text><Pressable accessibilityRole="button" onPress={() => setJobModalVisible(true)} style={({ pressed }) => [styles.addJobButton, polish.addJobButton, pressed && styles.pressed]}><AppIcon name="add" size={17} color={COLORS.white} /><Text style={styles.addJobButtonText}>{c.addJob}</Text></Pressable></View>
      {filteredJobs.length ? filteredJobs.map((job) => <View key={job.id} style={jobsEnhancements.jobCluster}><JobCard job={job} language={language} c={c} onApply={() => applyToJob(job)} /><ContractorTrustPanel job={job} language={language} /></View>) : <View style={styles.emptyState}><AppIcon name="search-off" size={30} color={COLORS.muted} /><Text style={styles.emptyTitle}>{c.noJobs}</Text><Text style={styles.emptyText}>{c.noJobsHint}</Text></View>}
    </ScrollView>
  );
  const renderEnhancedProfile = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <PageHeader language={language} onLanguage={chooseLanguage} title={c.profile} />
      <View style={profileEnhancements.identityPanel}>
        <ProfilePhotoControl language={language} onFeedback={showToast} />
        <View style={profileEnhancements.identityCopy}><Text style={styles.profileName}>Ramesh Kumar</Text><Text style={styles.profileLocation}>Lucknow, Uttar Pradesh</Text><View style={styles.verifiedIdentityRow}><AppIcon name="check-circle" size={16} color={COLORS.success} /><Text style={styles.verifiedIdentityText}>{c.verifiedIdentity}</Text></View><Text style={profileEnhancements.identityHint}>{language === "Hindi" ? "Photo add karke profile ko personal banayein" : "Add a photo to make this profile personal"}</Text></View>
      </View>
      <View style={styles.digitalIdCard}><View style={styles.idCardTopRow}><Text style={styles.idCardEyebrow}>{c.digitalId}</Text><AppIcon name="qr-code" size={28} color={COLORS.white} /></View><Text style={styles.idNumber}>SS • 9876 5432 10</Text><Text style={styles.idIssue}>Issued 12 Jan 2024 • Active</Text></View>
      <Text style={styles.sectionTitle}>{c.verifiedSkills}</Text><View style={styles.verifiedSkillsRow}><SkillCard skill={skillLabels[language].Mason} percent="88%" progressStyle={styles.skillProgress88} /><SkillCard skill={skillLabels[language].Painter} percent="75%" progressStyle={styles.skillProgress75} /></View>
      <Text style={styles.sectionTitle}>{c.profileSettings}</Text><View style={styles.settingsCard}><View style={styles.languageSettingRow}><View style={styles.settingIcon}><AppIcon name="language" size={21} /></View><View style={styles.settingCopy}><Text style={styles.settingLabel}>{c.language}</Text><Text style={styles.settingHint}>{c.languageHint}</Text></View><LanguageToggle language={language} onSelect={chooseLanguage} /></View><SettingRow icon="help-outline" label="Help & support" onPress={() => showToast("Support is ready to help")} /><SettingRow icon="lock-outline" label="Privacy & security" onPress={() => showToast("Privacy settings are local")} /><SettingRow icon="logout" label={c.logout} destructive onPress={logout} /></View>
    </ScrollView>
  );
  const renderActive = () => activeTab === "Home" ? renderHome() : activeTab === "Kaam" ? renderEnhancedJobs() : activeTab === "Fair Wage" ? renderFairWage() : activeTab === "Hisab" ? renderHisab() : renderEnhancedProfile();
  const tabLabel = (tab: AppTab) => tab === "Home" ? c.home : tab === "Kaam" ? c.jobs : tab === "Fair Wage" ? c.fair : tab === "Hisab" ? c.savings : c.profile;

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><StatusBar barStyle="dark-content" backgroundColor={COLORS.canvas} />{mode === "phone" ? renderPhone() : mode === "otp" ? renderOtp() : <View style={styles.appShell}><View style={styles.mainContent}>{renderActive()}</View><SafeAreaView style={styles.bottomNavSafeArea}><View style={[styles.bottomNav, polish.bottomNav]}>{NAV_ITEMS.map((item) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: activeTab === item.key }} key={item.key} onPress={() => { haptic.selection(); setActiveTab(item.key); }} style={({ pressed }) => [styles.navItem, activeTab === item.key && polish.navItemActive, pressed && styles.navItemPressed]}><AppIcon name={item.icon} size={22} color={activeTab === item.key ? COLORS.orange : COLORS.muted} /><Text style={[styles.navLabel, activeTab === item.key && styles.navLabelActive]}>{tabLabel(item.key)}</Text></Pressable>)}</View></SafeAreaView></View>}<Toast message={toast} /><EntryModal c={c} visible={entryModalVisible} entryAmount={entryAmount} entryType={entryType} onAmount={setEntryAmount} onType={setEntryType} onClose={() => setEntryModalVisible(false)} onSave={saveEntry} /><JobModal c={c} language={language} visible={jobModalVisible} job={newJob} onChange={setNewJob} onClose={() => setJobModalVisible(false)} onSave={saveJob} /></ScreenContainer>;
}

function EntryModal({ c, visible, entryAmount, entryType, onAmount, onType, onClose, onSave }: { c: AppCopy; visible: boolean; entryAmount: string; entryType: "Kamaai" | "Kharch"; onAmount: (value: string) => void; onType: (value: "Kamaai" | "Kharch") => void; onClose: () => void; onSave: () => void }) {
  return <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><Pressable style={styles.entrySheet} onPress={() => undefined}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{c.addEntry}</Text><Text style={styles.sheetSubtitle}>{c.trend}</Text><View style={styles.entryTypeRow}>{(["Kamaai", "Kharch"] as const).map((type) => <Pressable key={type} onPress={() => onType(type)} style={({ pressed }) => [styles.entryTypeButton, entryType === type && styles.entryTypeButtonSelected, pressed && styles.pressed]}><Text style={[styles.entryTypeText, entryType === type && styles.entryTypeTextSelected]}>{type === "Kamaai" ? c.earnings : c.spend}</Text></Pressable>)}</View><View style={styles.amountInputWrap}><Text style={styles.amountPrefix}>₹</Text><TextInput accessibilityLabel="Entry amount" autoFocus keyboardType="number-pad" onChangeText={(value) => onAmount(value.replace(/\D/g, ""))} placeholder="Amount" placeholderTextColor={COLORS.placeholder} style={styles.amountInput} value={entryAmount} /></View><PrimaryButton label={c.saveEntry} icon="check" onPress={onSave} /></Pressable></Pressable></Modal>;
}

function JobModal({ c, language, visible, job, onChange, onClose, onSave }: { c: AppCopy; language: Language; visible: boolean; job: { contractor: string; title: string; location: string; salary: string; duration: string; skill: WorkerSkill }; onChange: (job: { contractor: string; title: string; location: string; salary: string; duration: string; skill: WorkerSkill }) => void; onClose: () => void; onSave: () => void }) {
  const update = (key: keyof typeof job, value: string) => onChange({ ...job, [key]: value });
  return <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}><Pressable style={styles.modalBackdrop} onPress={onClose}><ScrollView contentContainerStyle={styles.jobSheetScroll} keyboardShouldPersistTaps="handled"><Pressable style={styles.entrySheet} onPress={() => undefined}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{c.addJob}</Text><Text style={styles.sheetSubtitle}>{c.addJobSubtitle}</Text><FormInput label={c.company} value={job.contractor} placeholder={c.companyPlaceholder} onChangeText={(value) => update("contractor", value)} /><FormInput label={c.role} value={job.title} placeholder={c.rolePlaceholder} onChangeText={(value) => update("title", value)} /><FormInput label={c.location} value={job.location} placeholder={c.locationPlaceholder} onChangeText={(value) => update("location", value)} /><View style={styles.formSplit}><View style={styles.formHalf}><FormInput label={c.salary} value={job.salary} placeholder="950" keyboardType="number-pad" onChangeText={(value) => update("salary", value.replace(/\D/g, ""))} /></View><View style={styles.formHalf}><FormInput label={c.workDuration} value={job.duration} placeholder="30" keyboardType="number-pad" onChangeText={(value) => update("duration", value.replace(/\D/g, ""))} /></View></View><Text style={styles.formLabel}>{c.selectSkill}</Text><View style={styles.skillSelector}>{(["Mason", "Painter", "Electrician"] as WorkerSkill[]).map((skill) => <Pressable key={skill} onPress={() => onChange({ ...job, skill })} style={({ pressed }) => [styles.skillOption, job.skill === skill && styles.skillOptionSelected, pressed && styles.pressed]}><Text style={[styles.skillOptionText, job.skill === skill && styles.skillOptionTextSelected]}>{skillLabels[language][skill]}</Text></Pressable>)}</View><View style={styles.sheetButtonGap}><PrimaryButton label={c.saveJob} icon="work-outline" onPress={onSave} /></View></Pressable></ScrollView></Pressable></Modal>;
}

function FormInput({ label, value, placeholder, onChangeText, keyboardType = "default" }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; keyboardType?: "default" | "number-pad" }) {
  return <View style={styles.formInputBlock}><Text style={styles.formLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.placeholder} keyboardType={keyboardType} style={styles.formInput} /></View>;
}

function LedgerRow({ icon, title, subtitle, value, color }: { icon: string; title: string; subtitle: string; value: string; color: string }) {
  return <View style={styles.ledgerRow}><View style={[styles.ledgerIcon, { backgroundColor: color === COLORS.success ? COLORS.successSoft : COLORS.cream }]}><AppIcon name={icon} size={20} color={color} /></View><View style={styles.ledgerCopy}><Text style={styles.ledgerTitle}>{title}</Text><Text style={styles.ledgerSubtitle}>{subtitle}</Text></View><Text style={[styles.ledgerValue, { color }]}>{value}</Text></View>;
}

function SkillCard({ skill, percent, progressStyle }: { skill: string; percent: string; progressStyle: object }) {
  return <View style={styles.verifiedSkillCard}><View style={styles.skillCardTop}><AppIcon name="construction" size={20} color={COLORS.orange} /><Text style={styles.skillPercent}>{percent}</Text></View><Text style={styles.skillName}>{skill}</Text><View style={styles.skillTrack}><View style={progressStyle} /></View></View>;
}

function SettingRow({ icon, label, onPress, destructive = false }: { icon: string; label: string; onPress: () => void; destructive?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.settingRow, pressed && styles.quickActionPressed]}><View style={styles.settingIcon}><AppIcon name={icon} size={21} color={destructive ? COLORS.error : COLORS.navy} /></View><Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>{label}</Text><AppIcon name="chevron-right" size={22} color={COLORS.muted} /></Pressable>;
}

const COLORS = { navy: "#182B4A", orange: "#FF6B0A", amber: "#F5B44C", amberDark: "#A96A13", canvas: "#F8FAFC", white: "#FFFFFF", border: "#E5EAF1", muted: "#718096", placeholder: "#A7B0BD", success: "#25B96C", successSoft: "#EAF9F0", cream: "#FFF7EA", error: "#D9534F" };
const styles = StyleSheet.create({
  addJobButton: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 11, flexDirection: "row", gap: 4, paddingHorizontal: 10, paddingVertical: 8 }, addJobButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" }, amountInput: { color: COLORS.navy, flex: 1, fontSize: 18, fontWeight: "700", height: 54 }, amountInputWrap: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 14, borderWidth: 1, flexDirection: "row", marginBottom: 16, paddingHorizontal: 16 }, amountPrefix: { color: COLORS.navy, fontSize: 22, fontWeight: "800", marginRight: 8 }, appShell: { backgroundColor: COLORS.canvas, flex: 1 }, authContent: { flex: 1, justifyContent: "center", paddingHorizontal: 20 }, authHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 }, authScreen: { backgroundColor: COLORS.canvas, flex: 1, paddingBottom: 18 }, authSubtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginBottom: 30, marginTop: 8 }, authTitle: { color: COLORS.navy, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, lineHeight: 34, marginTop: 8 }, backButton: { alignItems: "center", flexDirection: "row", gap: 5, marginLeft: 14, marginTop: 4, padding: 10, width: 100 }, backText: { color: COLORS.navy, fontSize: 15, fontWeight: "700" }, bottomNav: { backgroundColor: COLORS.white, borderTopColor: COLORS.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", minHeight: 62, paddingHorizontal: 4, paddingTop: 7 }, bottomNavSafeArea: { backgroundColor: COLORS.white }, brandAI: { color: COLORS.orange }, brandMark: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 14, height: 46, justifyContent: "center", width: 46 }, brandMarkCompact: { borderRadius: 10, height: 36, width: 36 }, brandName: { color: COLORS.navy, fontSize: 19, fontWeight: "800" }, brandRow: { alignItems: "center", flexDirection: "row", gap: 9 }, chartCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, marginTop: 16, padding: 15 }, chartLegend: { flexDirection: "row", gap: 15, marginBottom: 6 }, chartTitle: { color: COLORS.navy, fontSize: 16, fontWeight: "800" }, chartTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }, contractorAvatar: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 11, height: 40, justifyContent: "center", width: 40 }, contractorInitial: { color: COLORS.white, fontSize: 17, fontWeight: "800" }, contractorName: { color: COLORS.navy, fontSize: 15, fontWeight: "800" }, contractorRow: { alignItems: "center", flexDirection: "row", gap: 10 }, countryCode: { color: COLORS.navy, fontSize: 16, fontWeight: "800" }, demoStrip: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 12, flexDirection: "row", gap: 10, marginTop: 14, paddingHorizontal: 14, paddingVertical: 14 }, demoStripText: { color: COLORS.amberDark, fontSize: 13, fontWeight: "700" }, digitalIdCard: { backgroundColor: COLORS.navy, borderRadius: 18, marginBottom: 22, padding: 18 }, disclaimerText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: "center" }, emptyState: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, gap: 8, marginTop: 12, padding: 32 }, emptyText: { color: COLORS.muted, fontSize: 14, textAlign: "center" }, emptyTitle: { color: COLORS.navy, fontSize: 17, fontWeight: "800" }, entrySheet: { backgroundColor: COLORS.canvas, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxWidth: 720, padding: 22, width: "100%" }, entryTypeButton: { alignItems: "center", borderColor: COLORS.border, borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 12 }, entryTypeButtonSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy }, entryTypeRow: { flexDirection: "row", gap: 10, marginBottom: 16 }, entryTypeText: { color: COLORS.navy, fontSize: 14, fontWeight: "800" }, entryTypeTextSelected: { color: COLORS.white }, experienceCard: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 18, padding: 16 }, experienceHint: { color: COLORS.muted, fontSize: 12, marginTop: 4 }, eyebrow: { color: COLORS.amberDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginBottom: 5 }, eyebrowOrange: { color: COLORS.amberDark, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }, fairnessMessage: { alignItems: "center", backgroundColor: COLORS.successSoft, borderRadius: 14, flexDirection: "row", gap: 11, marginTop: 18, padding: 15 }, fairnessText: { color: COLORS.navy, flex: 1, fontSize: 14, fontWeight: "700", lineHeight: 20 }, filterPill: { borderColor: COLORS.border, borderRadius: 20, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 }, filterPillSelected: { backgroundColor: COLORS.navy, borderColor: COLORS.navy }, filterPillText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" }, filterPillTextSelected: { color: COLORS.white }, filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }, formHalf: { flex: 1 }, formInput: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 12, borderWidth: 1, color: COLORS.navy, fontSize: 15, height: 48, paddingHorizontal: 13 }, formInputBlock: { marginTop: 13 }, formLabel: { color: COLORS.navy, fontSize: 14, fontWeight: "800", marginBottom: 7, marginTop: 0 }, formSplit: { flexDirection: "row", gap: 10 }, headerActions: { alignItems: "center", flexDirection: "row", gap: 8 }, highBadge: { alignItems: "center", backgroundColor: "#1E4F4A", borderRadius: 18, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 7 }, highBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: "800" }, idCardEyebrow: { color: COLORS.amber, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, idCardTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, idIssue: { color: "#C9D3E4", fontSize: 13 }, idNumber: { color: COLORS.white, fontSize: 21, fontWeight: "800", marginBottom: 9, marginTop: 32 }, jobCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, gap: 14, marginTop: 12, padding: 16 }, jobCardCompact: { marginTop: 2 }, jobDuration: { alignItems: "center", flexDirection: "row", gap: 4 }, jobDurationText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" }, jobInfoRow: { alignItems: "center", flexDirection: "row", gap: 5 }, jobInfoText: { color: COLORS.muted, flex: 1, fontSize: 13, lineHeight: 19 }, jobMetaRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 12 }, jobSalary: { color: COLORS.navy, fontSize: 20, fontWeight: "800" }, jobSheetScroll: { flexGrow: 1, justifyContent: "flex-end" }, jobTitle: { color: COLORS.navy, fontSize: 18, fontWeight: "800", lineHeight: 24 }, jobTopRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, jobsHeadingRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, languageChoice: { alignItems: "center", borderRadius: 8, justifyContent: "center", minHeight: 30, minWidth: 34, paddingHorizontal: 6 }, languageChoiceActive: { backgroundColor: COLORS.navy }, languageChoiceText: { color: COLORS.navy, fontSize: 12, fontWeight: "800" }, languageChoiceTextActive: { color: COLORS.white }, languageSettingRow: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 68, paddingHorizontal: 14 }, languageToggle: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, flexDirection: "row", padding: 2 }, ledgerCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, overflow: "hidden" }, ledgerCopy: { flex: 1 }, ledgerIcon: { alignItems: "center", borderRadius: 11, height: 38, justifyContent: "center", width: 38 }, ledgerRow: { alignItems: "center", borderTopColor: COLORS.border, borderTopWidth: 1, flexDirection: "row", gap: 11, padding: 14 }, ledgerSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 3 }, ledgerTab: { alignItems: "center", flex: 1, paddingVertical: 11 }, ledgerTabSelected: { borderBottomColor: COLORS.orange, borderBottomWidth: 3 }, ledgerTabText: { color: COLORS.muted, fontSize: 13, fontWeight: "800" }, ledgerTabTextSelected: { color: COLORS.navy }, ledgerTabs: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 13, borderWidth: 1, flexDirection: "row", marginTop: 16 }, ledgerTitle: { color: COLORS.navy, fontSize: 14, fontWeight: "800" }, ledgerValue: { fontSize: 15, fontWeight: "800" }, legalText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, paddingHorizontal: 32, textAlign: "center" }, legendDot: { borderRadius: 4, height: 8, width: 8 }, legendItem: { alignItems: "center", flexDirection: "row", gap: 5 }, legendText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" }, linkButton: { padding: 4 }, linkText: { color: COLORS.orange, fontSize: 13, fontWeight: "800" }, listCount: { color: COLORS.muted, fontSize: 13, fontWeight: "600" }, lockBadge: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 15, height: 58, justifyContent: "center", marginBottom: 20, width: 58 }, mainContent: { flex: 1 }, matchBadge: { alignItems: "center", backgroundColor: COLORS.successSoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 }, matchLabel: { color: COLORS.success, fontSize: 8, fontWeight: "800", marginTop: 1 }, matchLine82: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "82%" }, matchLine94: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "94%" }, matchLineTrack: { backgroundColor: "#E1EEE6", borderRadius: 4, height: 5, overflow: "hidden" }, matchValue: { color: "#238C54", fontSize: 15, fontWeight: "900" }, metricCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, flex: 1, gap: 6, minHeight: 112, padding: 12 }, metricLabel: { color: COLORS.muted, fontSize: 11, lineHeight: 15 }, metricValue: { color: COLORS.navy, fontSize: 20, fontWeight: "800" }, metricsRow: { flexDirection: "row", gap: 8, marginTop: 14 }, modalBackdrop: { backgroundColor: "rgba(16, 30, 52, 0.45)", flex: 1, justifyContent: "flex-end" }, navItem: { alignItems: "center", flex: 1, gap: 3, minHeight: 50, justifyContent: "center" }, navItemPressed: { opacity: 0.6 }, navLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "700" }, navLabelActive: { color: COLORS.orange }, notificationButton: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, height: 36, justifyContent: "center", width: 36 }, otpContent: { flex: 1, justifyContent: "center", paddingHorizontal: 20 }, otpInput: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 15, borderWidth: 1, color: COLORS.navy, flex: 1, fontSize: 27, fontWeight: "800", height: 65, textAlign: "center" }, otpInputFilled: { backgroundColor: COLORS.cream, borderColor: COLORS.orange }, otpRow: { flexDirection: "row", gap: 9, marginBottom: 8 }, pageHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }, pageHeaderTextBlock: { flex: 1, paddingRight: 8 }, pageSubtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginBottom: 18, marginTop: -9 }, pageTitle: { color: COLORS.navy, fontSize: 24, fontWeight: "800", letterSpacing: -0.4, lineHeight: 31 }, pendingBanner: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 15, flexDirection: "row", gap: 11, marginTop: 14, padding: 14 }, pendingCopy: { flex: 1 }, pendingDescription: { color: COLORS.muted, fontSize: 12, marginTop: 3 }, pendingIcon: { alignItems: "center", backgroundColor: "#FFDFC0", borderRadius: 11, height: 40, justifyContent: "center", width: 40 }, pendingTitle: { color: "#8F4E0A", fontSize: 14, fontWeight: "800" }, periodChoice: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }, periodChoiceActive: { backgroundColor: COLORS.navy }, periodText: { color: COLORS.muted, fontSize: 11, fontWeight: "800" }, periodTextActive: { color: COLORS.white }, periodToggle: { backgroundColor: COLORS.canvas, borderRadius: 9, flexDirection: "row", padding: 2 }, phoneDivider: { backgroundColor: COLORS.border, height: 28, marginHorizontal: 12, width: 1 }, phoneField: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 15, borderWidth: 1, flexDirection: "row", height: 62, marginBottom: 14, paddingHorizontal: 16 }, phoneInput: { color: COLORS.navy, flex: 1, fontSize: 17, fontWeight: "600", height: 60 }, pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] }, primaryButton: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 15, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 56, paddingHorizontal: 20 }, primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "800" }, profileAvatar: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 17, height: 64, justifyContent: "center", width: 64 }, profileAvatarText: { color: COLORS.white, fontSize: 22, fontWeight: "800" }, profileIntro: { alignItems: "center", flexDirection: "row", gap: 13, marginBottom: 20 }, profileLocation: { color: COLORS.muted, fontSize: 13, marginTop: 4 }, profileName: { color: COLORS.navy, fontSize: 20, fontWeight: "800" }, progressFill87: { backgroundColor: COLORS.success, borderRadius: 4, height: 6, width: "87%" }, progressTrack: { backgroundColor: "#4A6287", borderRadius: 4, height: 6, marginTop: 18, overflow: "hidden" }, quickAction: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 58, paddingHorizontal: 14 }, quickActionIcon: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 11, height: 36, justifyContent: "center", width: 36 }, quickActionPressed: { backgroundColor: "#F4F7FA" }, quickActionText: { color: COLORS.navy, flex: 1, fontSize: 14, fontWeight: "700" }, quickActionsCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, marginTop: 12, overflow: "hidden" }, reliabilityRow: { alignItems: "center", flexDirection: "row", gap: 3, marginTop: 3 }, reliabilityText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" }, resendText: { color: COLORS.muted, fontSize: 13, marginTop: 22, textAlign: "center" }, savingsCard: { backgroundColor: COLORS.navy, borderRadius: 18, padding: 19 }, savingsLabel: { color: "#D4DEEA", fontSize: 13 }, savingsMeta: { color: "#D4DEEA", fontSize: 13, marginTop: 8 }, savingsValue: { color: COLORS.white, fontSize: 34, fontWeight: "900", marginTop: 6 }, scrollContent: { alignSelf: "center", maxWidth: 720, paddingBottom: 22, paddingHorizontal: 20, paddingTop: 12, width: "100%" }, searchField: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 8, height: 50, marginBottom: 12, paddingHorizontal: 14 }, searchInput: { color: COLORS.navy, flex: 1, fontSize: 15, height: 50 }, sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12, marginTop: 22 }, sectionTitle: { color: COLORS.navy, fontSize: 18, fontWeight: "800" }, settingCopy: { flex: 1 }, settingHint: { color: COLORS.muted, fontSize: 12, marginTop: 2 }, settingIcon: { alignItems: "center", backgroundColor: COLORS.canvas, borderRadius: 10, height: 36, justifyContent: "center", width: 36 }, settingLabel: { color: COLORS.navy, flex: 1, fontSize: 15, fontWeight: "700" }, settingLabelDestructive: { color: COLORS.error }, settingRow: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 58, paddingHorizontal: 14 }, settingsCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, marginTop: 12, overflow: "hidden" }, sheetButtonGap: { marginTop: 20 }, sheetHandle: { alignSelf: "center", backgroundColor: COLORS.border, borderRadius: 3, height: 5, marginBottom: 18, width: 45 }, sheetSubtitle: { color: COLORS.muted, fontSize: 14, marginBottom: 12, marginTop: 5 }, sheetTitle: { color: COLORS.navy, fontSize: 22, fontWeight: "800" }, skillCardTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, skillChip: { backgroundColor: COLORS.cream, borderRadius: 12, marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 4 }, skillChipText: { color: COLORS.amberDark, fontSize: 11, fontWeight: "800" }, skillName: { color: COLORS.navy, fontSize: 15, fontWeight: "800", marginTop: 19 }, skillOption: { alignItems: "center", borderColor: COLORS.border, borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 13 }, skillOptionSelected: { backgroundColor: COLORS.cream, borderColor: COLORS.orange }, skillOptionText: { color: COLORS.muted, fontSize: 12, fontWeight: "800" }, skillOptionTextSelected: { color: COLORS.amberDark }, skillPercent: { color: COLORS.success, fontSize: 14, fontWeight: "900" }, skillProgress75: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "75%" }, skillProgress88: { backgroundColor: COLORS.success, borderRadius: 4, height: 5, width: "88%" }, skillSelector: { flexDirection: "row", gap: 8, marginTop: 10 }, skillTrack: { backgroundColor: "#E1EEE6", borderRadius: 4, height: 5, marginTop: 10, overflow: "hidden" }, stepper: { alignItems: "center", flexDirection: "row", gap: 12 }, stepperButton: { alignItems: "center", backgroundColor: COLORS.cream, borderRadius: 11, height: 38, justifyContent: "center", width: 38 }, stepperButtonDisabled: { opacity: 0.45 }, stepperValue: { color: COLORS.navy, fontSize: 18, fontWeight: "800", minWidth: 18, textAlign: "center" }, toast: { alignItems: "center", alignSelf: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 22, borderWidth: 1, bottom: 94, elevation: 5, flexDirection: "row", gap: 8, maxWidth: "90%", paddingHorizontal: 15, paddingVertical: 11, position: "absolute", shadowColor: COLORS.navy, shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.12, shadowRadius: 12 }, toastText: { color: COLORS.navy, fontSize: 13, fontWeight: "700", maxWidth: 260 }, totalExpense: { color: COLORS.orange, fontSize: 20, fontWeight: "900" }, totalIncome: { color: COLORS.success, fontSize: 20, fontWeight: "900" }, totalLabel: { color: COLORS.muted, fontSize: 13, fontWeight: "700" }, totalRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 15 }, trustCard: { backgroundColor: COLORS.navy, borderRadius: 19, padding: 18 }, trustDescription: { color: "#D4DEEA", fontSize: 13, marginTop: 10 }, trustLabel: { color: "#D4DEEA", fontSize: 13, fontWeight: "700" }, trustOutOf: { color: "#B5C2D6", fontSize: 14, fontWeight: "700", marginBottom: 6 }, trustScore: { color: COLORS.white, fontSize: 42, fontWeight: "900", lineHeight: 48 }, trustScoreRow: { alignItems: "flex-end", flexDirection: "row", gap: 3, marginTop: 4 }, trustTopRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, verifiedIdentityRow: { alignItems: "center", flexDirection: "row", gap: 5, marginTop: 7 }, verifiedIdentityText: { color: COLORS.success, fontSize: 13, fontWeight: "800" }, verifiedSkillCard: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 16, borderWidth: 1, flex: 1, padding: 14 }, verifiedSkillsRow: { flexDirection: "row", gap: 10, marginBottom: 22, marginTop: 12 }, wageCard: { alignItems: "center", backgroundColor: COLORS.navy, borderRadius: 19, padding: 24 }, wageDivider: { backgroundColor: "#486486", height: 1, marginTop: 16, width: "100%" }, wageEyebrow: { color: COLORS.amber, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }, wageMeta: { color: "#DFE6F0", fontSize: 14, marginTop: 17 }, wageUnit: { color: "#D4DEEA", fontSize: 13, marginTop: 5 }, wageValue: { color: COLORS.white, fontSize: 28, fontWeight: "900", marginTop: 14, textAlign: "center" },
});

const polish = StyleSheet.create({
  addJobButton: { borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9 },
  authContent: { paddingBottom: 34 },
  authIntro: { alignItems: "center", flexDirection: "row", gap: 8 },
  authProgressDot: { backgroundColor: COLORS.success, borderRadius: 5, height: 8, width: 8 },
  bottomNav: { borderTopColor: "#EDF0F4", paddingHorizontal: 8 },
  demoStrip: { borderColor: "#F8E4C7", borderWidth: 1, paddingVertical: 12 },
  highBadge: { backgroundColor: "#214A46" },
  homePulse: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  homePulseText: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  homePulseTitle: { color: COLORS.navy, fontSize: 14, fontWeight: "800" },
  jobCard: { borderColor: "#E7EBF1", borderRadius: 20, padding: 17 },
  jobsHeadingRow: { marginBottom: 2 },
  jobsIntro: { alignItems: "center", backgroundColor: "#F0F7F4", borderColor: "#DDEEE4", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 11, marginBottom: 14, padding: 13 },
  jobsIntroCopy: { flex: 1 },
  jobsIntroIcon: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  jobsIntroText: { color: "#587068", fontSize: 12, marginTop: 2 },
  jobsIntroTitle: { color: "#1F5540", fontSize: 14, fontWeight: "800" },
  liveDot: { backgroundColor: COLORS.success, borderRadius: 4, height: 7, width: 7 },
  liveDotWrap: { alignItems: "center", backgroundColor: "#EAF9F0", borderRadius: 14, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  liveText: { color: "#238C54", fontSize: 11, fontWeight: "800" },
  metricCard: { borderColor: "#E8ECF2", borderRadius: 18, minHeight: 122, padding: 13 },
  metricIcon: { alignItems: "center", borderRadius: 10, height: 30, justifyContent: "center", width: 30 },
  navItemActive: { backgroundColor: "#FFF4EB", borderRadius: 13, marginHorizontal: 1 },
  otpContent: { paddingBottom: 48 },
  otpIconHalo: { alignItems: "flex-start", marginBottom: 2 },
  otpInput: { borderRadius: 17, height: 68 },
  otpReassurance: { color: COLORS.muted, fontSize: 13, marginBottom: 19, marginTop: -16 },
  pendingArrow: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: 18, height: 32, justifyContent: "center", width: 32 },
  pendingBanner: { borderColor: "#F9E5C5", borderWidth: 1, paddingVertical: 13 },
  phoneField: { borderColor: "#DDE3EB", borderRadius: 17, marginTop: 18 },
  phoneTrustRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: -20 },
  phoneTrustText: { color: "#57746A", fontSize: 12, fontWeight: "600" },
  quickAction: { minHeight: 62 },
  quickActionArrow: { alignItems: "center", backgroundColor: "#F6F8FA", borderRadius: 14, height: 28, justifyContent: "center", width: 28 },
  quickActionIcon: { backgroundColor: "#FFF4EB", height: 38, width: 38 },
  quickActionsCard: { borderColor: "#E7EBF1", borderRadius: 20 },
  quickActionsHeading: { marginTop: 25 },
  quickActionsHint: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  savingsCard: { borderColor: "#264768", borderWidth: 1, padding: 20 },
  savingsRule: { backgroundColor: "#456487", height: 1, marginTop: 16, width: "100%" },
  savingsStatus: { alignItems: "center", backgroundColor: "#214A46", borderRadius: 14, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 5 },
  savingsStatusText: { color: "#D5F2DF", fontSize: 11, fontWeight: "800" },
  savingsTopLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  scoreContext: { marginTop: 20 },
  searchField: { borderColor: "#DDE3EB", borderRadius: 15, height: 54 },
  sectionEyebrow: { color: COLORS.amberDark, fontSize: 10, fontWeight: "900", letterSpacing: 0.9, marginBottom: 4 },
  trustAvatar: { alignItems: "center", backgroundColor: "#2F4E76", borderColor: "#51759F", borderRadius: 17, borderWidth: 1, height: 34, justifyContent: "center", width: 34 },
  trustAvatarText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  trustCard: { borderColor: "#254466", borderWidth: 1, borderRadius: 22, padding: 19 },
  trustFooter: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 11 },
  trustIdentity: { alignItems: "center", flexDirection: "row", gap: 9 },
  trustName: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
  trustRole: { color: "#B9C9DF", fontSize: 11, marginTop: 2 },
});

const reference = StyleSheet.create({
  authContent: { justifyContent: "center", paddingBottom: 14 },
  demoStrip: { borderColor: "#F5E7D1", borderWidth: 1, marginTop: 14 },
  jobCheckItem: { alignItems: "center", flexDirection: "row", gap: 6 },
  jobCheckText: { color: "#5F786B", fontSize: 12, fontWeight: "600" },
  jobChecks: { backgroundColor: "#F4FAF6", borderColor: "#E0EEE5", borderRadius: 12, borderWidth: 1, gap: 7, padding: 11 },
  otpContent: { justifyContent: "center", paddingBottom: 10 },
  otpInput: { borderRadius: 15, height: 65 },
  pendingBanner: { borderColor: "#F6E5C8", borderWidth: 1 },
  phoneField: { borderColor: "#E2E7ED", borderRadius: 15, marginTop: 0 },
  quickActionsCard: { borderColor: "#E5EAF1", borderRadius: 18 },
});

const jobsEnhancements = StyleSheet.create({
  jobCluster: { marginBottom: 10 },
  locationCopy: { flex: 1 },
  locationIcon: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  locationPanel: { alignItems: "center", backgroundColor: "#F1F7F3", borderColor: "#DFEDE4", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 14, padding: 12 },
  locationText: { color: "#60776B", fontSize: 11, marginTop: 3 },
  locationTitle: { color: "#224B39", fontSize: 14, fontWeight: "900" },
  sortChoice: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 7 },
  sortChoiceActive: { backgroundColor: COLORS.navy },
  sortChoiceText: { color: COLORS.navy, fontSize: 10, fontWeight: "900" },
  sortChoiceTextActive: { color: COLORS.white },
  sortToggle: { backgroundColor: COLORS.white, borderColor: "#D9E6DD", borderRadius: 10, borderWidth: 1, flexDirection: "row", padding: 2 },
});

const profileEnhancements = StyleSheet.create({
  identityCopy: { flex: 1 },
  identityHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  identityPanel: { alignItems: "center", backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 14, marginBottom: 20, padding: 15 },
});
