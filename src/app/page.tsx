'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  Search,
  BookOpen,
  Bookmark,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Share2,
  Heart,
  Trash2,
  Sparkles,
  Copy,
  Check,
  Type,
  Globe,
  Info,
  Loader2,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Types ────────────────────────────────────────────────

interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface AyahFull {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
  surah: { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: string };
}

interface AyahTranslation {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
  surah: { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: string };
}

interface WordByWordEntry {
  number: number;
  text: string;
  translation: string;
  transliteration: { text: string };
  verse_key: string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: number;
}

interface BookmarkItem {
  surahNumber: number;
  surahName: string;
  surahNameAr: string;
  ayahNumber: number;
  ayahText: string;
  translation: string;
  dateAdded: string;
}

interface Hadith {
  textAr: string;
  textEn: string;
  source: string;
  narrator: string;
}

// ─── Constants ────────────────────────────────────────────

const BUNDLED_HADITHS: Hadith[] = [
  {
    textAr: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى",
    textEn: "Actions are judged by intentions, and every person will get the reward according to what they intended.",
    source: "Sahih al-Bukhari 1",
    narrator: "Umar ibn al-Khattab",
  },
  {
    textAr: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت",
    textEn: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
    source: "Sahih al-Bukhari 6018",
    narrator: "Abu Hurairah",
  },
  {
    textAr: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه",
    textEn: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Sahih al-Bukhari 13",
    narrator: "Anas ibn Malik",
  },
  {
    textAr: "الطيبُ من الرزقِ طلبُه ويسيرُه",
    textEn: "The purest of provision is that which is earned through lawful work.",
    source: "Musnad Ahmad",
    narrator: "Abdullah ibn Mas'ud",
  },
  {
    textAr: "خيركم من تعلّم القرآن وعلمه",
    textEn: "The best among you are those who learn the Quran and teach it.",
    source: "Sahih al-Bukhari 5027",
    narrator: "Uthman ibn Affan",
  },
  {
    textAr: "المسلم من سلم المسلمون من لسانه ويده",
    textEn: "A Muslim is the one from whose tongue and hands other Muslims are safe.",
    source: "Sahih al-Bukhari 10",
    narrator: "Abdullah ibn Amr",
  },
  {
    textAr: "لا تحاسدوا ولا تناجشوا ولا تباغضوا ولا تدابروا، وكونوا عباد الله إخواناً",
    textEn: "Do not envy one another, do not hate one another, do not turn your backs on one another. Rather, be servants of Allah as brothers.",
    source: "Sahih Muslim 2559",
    narrator: "Abu Hurairah",
  },
  {
    textAr: "إن الله لا ينظر إلى صوركم وأموالكم، ولكن ينظر إلى قلوبكم وأعمالكم",
    textEn: "Indeed, Allah does not look at your appearances or your wealth, but He looks at your hearts and your deeds.",
    source: "Sahih Muslim 2564",
    narrator: "Abu Hurairah",
  },
  {
    textAr: "من صلّى عليّ صلاة واحدة صلّى الله عليه عشراً",
    textEn: "Whoever sends blessings upon me once, Allah will send blessings upon him tenfold.",
    source: "Sahih Muslim 408",
    narrator: "Abu Hurairah",
  },
  {
    textAr: "الدال على الخير كفاعله",
    textEn: "Whoever guides someone to goodness will have a reward like the one who did it.",
    source: "Sahih Muslim 1893",
    narrator: "Abu Mas'ud al-Ansari",
  },
  {
    textAr: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن",
    textEn: "Fear Allah wherever you are, follow up a bad deed with a good one and it will wipe it out, and treat people with good character.",
    source: "Sunan at-Tirmidhi 1987",
    narrator: "Abu Dharr",
  },
  {
    textAr: "المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف وفي كل خير",
    textEn: "The strong believer is better and more beloved to Allah than the weak believer, while there is good in both.",
    source: "Sahih Muslim 2664",
    narrator: "Abu Hurairah",
  },
  {
    textAr: "إنما بُعثت لأتمم مكارم الأخلاق",
    textEn: "I was only sent to perfect good character.",
    source: "Sunan al-Bayhaqi",
    narrator: "Abu Hurairah",
  },
  {
    textAr: "لا تُكثر من الضحك فإن كثرة الضحك تميت القلب",
    textEn: "Do not laugh too much, for excessive laughter kills the heart.",
    source: "Sunan at-Tirmidhi 2305",
    narrator: "Abu Hurairah",
  },
  {
    textAr: "من سلك طريقاً يلتمس فيه علماً سهّل الله له طريقاً إلى الجنة",
    textEn: "Whoever travels a path seeking knowledge, Allah will make easy for him a path to Paradise.",
    source: "Sahih Muslim 2699",
    narrator: "Abu Hurairah",
  },
];

const SURAH_LIST_URL = 'https://api.alquran.cloud/v1/surah';
const TOTAL_VERSES = 6236;

// ─── Islamic Name Correction ─────────────────────────────
// Replaces Biblical/Christian names with proper Islamic names in translations

const ISLAMIC_NAMES: [RegExp, string][] = [
  // Prophets (peace be upon them all)
  [/\bAbraham\b/g, 'Ibrahim (AS)'],
  [/\bMoses\b/g, 'Musa (AS)'],
  [/\bJesus\b/g, 'Isa (AS)'],
  [/\bJoseph\b/g, 'Yusuf (AS)'],
  [/\bDavid\b/g, 'Dawud (AS)'],
  [/\bSolomon\b/g, 'Sulayman (AS)'],
  [/\bNoah\b/g, 'Nuh (AS)'],
  [/\bJacob\b/g, 'Yaqub (AS)'],
  [/\bIsaac\b/g, 'Ishaq (AS)'],
  [/\bIshmael\b/g, 'Ismail (AS)'],
  [/\bElijah\b/g, 'Ilyas (AS)'],
  [/\bElisha\b/g, 'Al-Yasa (AS)'],
  [/\bEzekiel\b/g, 'Dhul-Kifl (AS)'],
  [/\bAaron\b/g, 'Harun (AS)'],
  [/\bZachariah\b/g, 'Zakariya (AS)'],
  [/\bJohn\b(?!\s*the\s*Baptist)/g, 'Yahya (AS)'],
  [/\bJohn the Baptist\b/g, 'Yahya (AS)'],
  [/\bJonah\b/g, 'Yunus (AS)'],
  [/\bJob\b/g, 'Ayyub (AS)'],
  [/\bLot\b/g, 'Lut (AS)'],
  [/\bEnoch\b/g, 'Idris (AS)'],
  [/\bShuaib\b/g, 'Shuayb (AS)'],
  [/\bHud\b/g, 'Hud (AS)'],
  [/\bSalih\b/g, 'Salih (AS)'],
  [/\bMuhammad\b/g, 'Muhammad (PBUH)'],
  [/\bAdam\b/g, 'Adam (AS)'],
  // Angels
  [/\bGabriel\b/g, 'Jibril (AS)'],
  [/\bMichael\b/g, 'Mikail (AS)'],
  [/\bIsrafil\b/g, 'Israfil (AS)'],
  [/\bAzrael\b/g, 'Azrael (AS)'],
  // Wives / Family of Prophets
  [/\bMary\b/g, 'Maryam (AS)'],
  [/\bSarah\b/g, 'Sara (AS)'],
  [/\bHagar\b/g, 'Hajar (AS)'],
  [/\bEve\b/g, 'Hawwa (AS)'],
  [/\bAsiyah\b/g, 'Asiyah (AS)'],
  // Key Islamic terms sometimes translated
  [/\bGod\b/g, 'Allah'],
  // Remove duplicate "(AS)" if the name already has it
  [/\(AS\)\s*\(AS\)/g, '(AS)'],
];

function islamifyNames(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [pattern, replacement] of ISLAMIC_NAMES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────

function getDayOfYearAyah(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return (dayOfYear % TOTAL_VERSES) + 1;
}

function formatAyahNumber(num: number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicNumerals[parseInt(d)]).join('');
}

function getArabicFontSize(size: string): string {
  switch (size) {
    case 'sm': return 'text-xl leading-[2.2]';
    case 'md': return 'text-2xl leading-[2.4]';
    case 'lg': return 'text-3xl leading-[2.8]';
    default: return 'text-2xl leading-[2.4]';
  }
}

function getArabicWordFontSize(size: string): string {
  switch (size) {
    case 'sm': return 'text-lg';
    case 'md': return 'text-xl';
    case 'lg': return 'text-2xl';
    default: return 'text-xl';
  }
}

// ─── Toast Utility ────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  }, []);

  const ToastComponent = toast.visible ? (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D4B3C] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium dark:bg-[#C8A951] dark:text-[#0F1A14]"
    >
      {toast.message}
    </motion.div>
  ) : null;

  return { showToast, ToastComponent };
}

// ─── Main Page Component ──────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<'quran' | 'daily' | 'bookmarks' | 'settings'>('quran');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'full' | 'wordbyword'>('full');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('noor-bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [arabicFontSize, setArabicFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    if (typeof window === 'undefined') return 'md';
    try {
      const saved = localStorage.getItem('noor-font-size');
      if (saved === 'sm' || saved === 'md' || saved === 'lg') return saved;
    } catch { /* ignore */ }
    return 'md';
  });
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('noor-theme') === 'dark';
  });

  // Sync dark class on mount
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('noor-bookmarks', JSON.stringify(bookmarks));
    } catch { /* ignore */ }
  }, [bookmarks]);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('noor-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('noor-theme', 'light');
      }
      return next;
    });
  }, []);

  // Font size change
  const changeFontSize = useCallback((size: 'sm' | 'md' | 'lg') => {
    setArabicFontSize(size);
    localStorage.setItem('noor-font-size', size);
  }, []);

  const addBookmark = useCallback((item: BookmarkItem) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.surahNumber === item.surahNumber && b.ayahNumber === item.ayahNumber);
      if (exists) return prev;
      return [item, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((surahNumber: number, ayahNumber: number) => {
    setBookmarks(prev => prev.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)));
  }, []);

  const isBookmarked = useCallback((surahNumber: number, ayahNumber: number) => {
    return bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
  }, [bookmarks]);

  const navigateToSurah = useCallback((surahNumber: number) => {
    setSelectedSurah(surahNumber);
    setViewMode('full');
    setActiveTab('quran');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { showToast } = useToast();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--islamic-bg)] dark:bg-[#0F1A14] transition-colors duration-300">
      {/* Header */}
      <IslamicHeader activeTab={activeTab} setActiveTab={setActiveTab} setSelectedSurah={setSelectedSurah} isDark={isDark} toggleTheme={toggleTheme} />

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedSurah ?? '')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {activeTab === 'quran' && (
              selectedSurah !== null ? (
                <SurahReader
                  surahNumber={selectedSurah}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  onBack={() => setSelectedSurah(null)}
                  arabicFontSize={arabicFontSize}
                  addBookmark={addBookmark}
                  removeBookmark={removeBookmark}
                  isBookmarked={isBookmarked}
                  showToast={showToast}
                />
              ) : (
                <SurahList onSelectSurah={(n) => { setSelectedSurah(n); setViewMode('full'); }} />
              )
            )}
            {activeTab === 'daily' && (
              <DailyMotivation
                addBookmark={addBookmark}
                isBookmarked={isBookmarked}
                showToast={showToast}
                arabicFontSize={arabicFontSize}
              />
            )}
            {activeTab === 'bookmarks' && (
              <BookmarksView
                bookmarks={bookmarks}
                onRemove={removeBookmark}
                onSelect={navigateToSurah}
                showToast={showToast}
                arabicFontSize={arabicFontSize}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView
                isDark={isDark}
                toggleTheme={toggleTheme}
                arabicFontSize={arabicFontSize}
                changeFontSize={changeFontSize}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} setSelectedSurah={setSelectedSurah} />
    </div>
  );
}

// ─── Islamic Header ───────────────────────────────────────

function IslamicHeader({
  activeTab,
  setActiveTab,
  setSelectedSurah,
  isDark,
  toggleTheme,
}: {
  activeTab: string;
  setActiveTab: (tab: 'quran' | 'daily' | 'bookmarks' | 'settings') => void;
  setSelectedSurah: (n: number | null) => void;
  isDark: boolean;
  toggleTheme: () => void;
}) {
  const tabs = [
    { id: 'quran' as const, label: 'Quran', icon: BookOpen },
    { id: 'daily' as const, label: 'Daily', icon: Sparkles },
    { id: 'bookmarks' as const, label: 'Bookmarks', icon: Bookmark },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0D4B3C]/95 dark:bg-[#0A1510]/95 backdrop-blur-md border-b border-[#C8A951]/20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Top Row */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Moon className="w-7 h-7 text-[#C8A951] absolute" />
              <Star className="w-3 h-3 text-[#C8A951] absolute -right-0.5 -top-0.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">نـور</h1>
              <p className="text-[10px] text-[#C8A951]/80 -mt-1 font-medium tracking-wider uppercase">Noor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white/80 hover:text-white hover:bg-white/10">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isDark ? 'Light Mode' : 'Dark Mode'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1 pb-2 -mt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'quran') setSelectedSurah(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C8A951] text-[#0D4B3C]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────

function MobileBottomNav({
  activeTab,
  setActiveTab,
  setSelectedSurah,
}: {
  activeTab: string;
  setActiveTab: (tab: 'quran' | 'daily' | 'bookmarks' | 'settings') => void;
  setSelectedSurah: (n: number | null) => void;
}) {
  const tabs = [
    { id: 'quran' as const, label: 'Quran', icon: BookOpen },
    { id: 'daily' as const, label: 'Daily', icon: Sparkles },
    { id: 'bookmarks' as const, label: 'Saved', icon: Bookmark },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#162118]/95 backdrop-blur-md border-t border-[#E5E1D8] dark:border-[#2D3E34] safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'quran') setSelectedSurah(null);
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[3.5rem] ${
                isActive
                  ? 'text-[#0D4B3C] dark:text-[#C8A951]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF]'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0D4B3C] dark:text-[#C8A951]' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Surah List ───────────────────────────────────────────

function SurahList({ onSelectSurah }: { onSelectSurah: (n: number) => void }) {
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchSurahs() {
      try {
        setLoading(true);
        const res = await fetch(SURAH_LIST_URL);
        if (!res.ok) throw new Error('Failed to fetch surahs');
        const data = await res.json();
        if (!cancelled) {
          setSurahs(data.data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSurahs();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return surahs;
    const q = search.toLowerCase();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(search)
    );
  }, [surahs, search]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#0D4B3C] dark:text-[#C8A951]">The Noble Quran</h2>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">114 Surahs • 6,236 Verses</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
        <Input
          placeholder="Search surahs by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white dark:bg-[#162118] border-[#E5E1D8] dark:border-[#2D3E34]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#0D4B3C]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-[#162118] rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-2">Failed to load surahs</p>
            <p className="text-sm text-[#6B7280]">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-3">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Surah Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((surah, idx) => (
            <motion.button
              key={surah.number}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02, duration: 0.2 }}
              onClick={() => onSelectSurah(surah.number)}
              className="flex items-center gap-3 p-4 bg-white dark:bg-[#162118] rounded-xl border border-[#E5E1D8] dark:border-[#2D3E34] hover:border-[#C8A951]/40 dark:hover:border-[#C8A951]/40 hover:shadow-md transition-all duration-200 text-left group"
            >
              {/* Surah Number */}
              <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 40 40" className="absolute inset-0 w-10 h-10">
                  <polygon
                    points="20,2 38,12 38,28 20,38 2,28 2,12"
                    fill="none"
                    stroke="#C8A951"
                    strokeWidth="1.5"
                    className="dark:stroke-[#C8A951]"
                  />
                </svg>
                <span className="text-xs font-bold text-[#0D4B3C] dark:text-[#C8A951]">{surah.number}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1A1A2E] dark:text-[#E8E0D0] truncate">
                  {surah.englishName}
                </p>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">
                  {islamifyNames(surah.englishNameTranslation)}
                </p>
              </div>

              {/* Arabic Name & Meta */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-arabic text-lg text-[#0D4B3C] dark:text-[#C8A951]">{surah.name}</span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${
                      surah.revelationType === 'Meccan'
                        ? 'bg-[#0D4B3C]/10 text-[#0D4B3C] dark:bg-[#C8A951]/10 dark:text-[#C8A951]'
                        : 'bg-[#C8A951]/10 text-[#A68B3A] dark:bg-[#0D4B3C]/10 dark:text-[#1B6B52]'
                    }`}
                  >
                    {surah.revelationType}
                  </Badge>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">{surah.numberOfAyahs}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Empty search results */}
      {!loading && !error && filtered.length === 0 && search && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-[#6B7280]/30 mb-3" />
          <p className="text-[#6B7280]">No surahs found for &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

// ─── Surah Reader ─────────────────────────────────────────

function SurahReader({
  surahNumber,
  viewMode,
  setViewMode,
  onBack,
  arabicFontSize,
  addBookmark,
  removeBookmark,
  isBookmarked,
  showToast,
}: {
  surahNumber: number;
  viewMode: 'full' | 'wordbyword';
  setViewMode: (v: 'full' | 'wordbyword') => void;
  onBack: () => void;
  arabicFontSize: string;
  addBookmark: (b: BookmarkItem) => void;
  removeBookmark: (s: number, a: number) => void;
  isBookmarked: (s: number, a: number) => boolean;
  showToast: (msg: string) => void;
}) {
  const [arabicVerses, setArabicVerses] = useState<AyahFull[]>([]);
  const [englishVerses, setEnglishVerses] = useState<AyahTranslation[]>([]);
  const [wordByWordData, setWordByWordData] = useState<WordByWordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWbw, setLoadingWbw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surahInfo, setSurahInfo] = useState<SurahInfo | null>(null);

  // Fetch surah info from the list
  useEffect(() => {
    let cancelled = false;
    async function fetchSurahInfo() {
      try {
        const res = await fetch(SURAH_LIST_URL);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) {
          const info = data.data.find((s: SurahInfo) => s.number === surahNumber);
          setSurahInfo(info || null);
        }
      } catch { /* ignore */ }
    }
    fetchSurahInfo();
    return () => { cancelled = true; };
  }, [surahNumber]);

  // Fetch verses
  useEffect(() => {
    let cancelled = false;
    async function fetchVerses() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`);
        if (!res.ok) throw new Error('Failed to fetch verses');
        const data = await res.json();
        if (!cancelled && data.code === 200 && Array.isArray(data.data)) {
          setArabicVerses(data.data[0].ayahs);
          setEnglishVerses(data.data[1].ayahs);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchVerses();
    return () => { cancelled = true; };
  }, [surahNumber]);

  // Fetch word-by-word when mode changes
  useEffect(() => {
    if (viewMode !== 'wordbyword') return;
    if (wordByWordData.length > 0) return;
    let cancelled = false;
    async function fetchWBW() {
      try {
        setLoadingWbw(true);
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,word_by_word`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled && data.code === 200 && Array.isArray(data.data)) {
          const wbwEdition = data.data.find((d: { edition: { identifier: string } }) => d.edition.identifier === 'word_by_word');
          if (wbwEdition && Array.isArray(wbwEdition.ayahs)) {
            const entries: WordByWordEntry[] = [];
            wbwEdition.ayahs.forEach((ayah: WordByWordEntry) => {
              entries.push(ayah);
            });
            setWordByWordData(entries);
          }
        }
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoadingWbw(false);
      }
    }
    fetchWBW();
    return () => { cancelled = true; };
  }, [viewMode, surahNumber, wordByWordData.length]);

  // Group word-by-word by verse_key
  const groupedWords = useMemo(() => {
    const groups: Record<string, { arabic: string; translation: string }[]> = {};
    if (wordByWordData.length === 0) return groups;
    wordByWordData.forEach((entry) => {
      const key = entry.verse_key;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ arabic: entry.text, translation: entry.translation || entry.transliteration?.text || '' });
    });
    return groups;
  }, [wordByWordData]);

  const handleBookmark = (ayah: AyahFull, translation: AyahTranslation) => {
    const key = `${surahNumber}:${ayah.numberInSurah}`;
    if (isBookmarked(surahNumber, ayah.numberInSurah)) {
      removeBookmark(surahNumber, ayah.numberInSurah);
      showToast('Removed from bookmarks');
    } else {
      addBookmark({
        surahNumber,
        surahName: islamifyNames(surahInfo?.englishName || ''),
        surahNameAr: surahInfo?.name || '',
        ayahNumber: ayah.numberInSurah,
        ayahText: ayah.text,
        translation: islamifyNames(translation.text),
        dateAdded: new Date().toISOString(),
      });
      showToast('Saved to bookmarks ✨');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-16 w-full mb-3" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-2">Failed to load verses</p>
            <p className="text-sm text-[#6B7280]">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back + Surah Info */}
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-3 text-[#0D4B3C] dark:text-[#C8A951] hover:bg-[#0D4B3C]/10 dark:hover:bg-[#C8A951]/10 -ml-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          All Surahs
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0D4B3C] dark:text-[#C8A951]">
              {surahInfo?.englishName || `Surah ${surahNumber}`}
            </h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              {islamifyNames(surahInfo?.englishNameTranslation)} • {surahInfo?.numberOfAyahs || arabicVerses.length} Verses • {surahInfo?.revelationType}
            </p>
          </div>
          <div className="font-arabic text-3xl text-[#0D4B3C] dark:text-[#C8A951]">{surahInfo?.name}</div>
        </div>
      </div>

      {/* Bismillah */}
      {surahNumber !== 1 && surahNumber !== 9 && (
        <div className="text-center mb-6 py-4">
          <p className="font-arabic text-2xl text-[#0D4B3C] dark:text-[#C8A951] leading-[2.4]">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Button
          size="sm"
          variant={viewMode === 'full' ? 'default' : 'outline'}
          onClick={() => setViewMode('full')}
          className={viewMode === 'full' ? 'bg-[#0D4B3C] hover:bg-[#0D4B3C]/90 text-white dark:bg-[#C8A951] dark:text-[#0F1A14] dark:hover:bg-[#C8A951]/90' : ''}
        >
          <BookOpen className="w-3.5 h-3.5 mr-1" />
          Full Text
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'wordbyword' ? 'default' : 'outline'}
          onClick={() => setViewMode('wordbyword')}
          className={viewMode === 'wordbyword' ? 'bg-[#0D4B3C] hover:bg-[#0D4B3C]/90 text-white dark:bg-[#C8A951] dark:text-[#0F1A14] dark:hover:bg-[#C8A951]/90' : ''}
        >
          <Type className="w-3.5 h-3.5 mr-1" />
          Word-by-Word
        </Button>
      </div>

      {/* Full Text View */}
      {viewMode === 'full' && (
        <div className="space-y-4">
          {arabicVerses.map((ayah, idx) => (
            <motion.div
              key={ayah.number}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02, duration: 0.2 }}
            >
              <Card className="islamic-border-top overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  {/* Ayah Number Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="verse-badge">{formatAyahNumber(ayah.numberInSurah)}</div>
                      <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Verse {ayah.numberInSurah}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleBookmark(ayah, englishVerses[idx])}
                        >
                          <Heart className={`w-4 h-4 ${isBookmarked(surahNumber, ayah.numberInSurah) ? 'fill-[#C8A951] text-[#C8A951]' : 'text-[#6B7280]'}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{isBookmarked(surahNumber, ayah.numberInSurah) ? 'Remove bookmark' : 'Bookmark this verse'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Arabic Text */}
                  <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] mb-4 leading-[2.4] text-right ${getArabicFontSize(arabicFontSize)}`}>
                    {ayah.text}
                  </div>

                  {/* Translation */}
                  <Separator className="mb-3" />
                  <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed">
                    {islamifyNames(englishVerses[idx]?.text)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Word-by-Word View */}
      {viewMode === 'wordbyword' && (
        <div className="space-y-6">
          {loadingWbw ? (
            <div className="flex items-center justify-center py-12 gap-2 text-[#6B7280]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading word-by-word data...</span>
            </div>
          ) : Object.keys(groupedWords).length > 0 ? (
            Object.entries(groupedWords).map(([verseKey, words], idx) => {
              const ayahNum = parseInt(verseKey.split(':')[1]);
              const engVerse = englishVerses.find(v => v.numberInSurah === ayahNum);
              const arabVerse = arabicVerses.find(v => v.numberInSurah === ayahNum);

              return (
                <motion.div
                  key={verseKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                >
                  <Card className="islamic-border-top overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                      {/* Ayah Number */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="verse-badge">{formatAyahNumber(ayahNum)}</div>
                        <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Verse {ayahNum}</span>
                        {arabVerse && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 ml-auto"
                                onClick={() => handleBookmark(arabVerse, engVerse || englishVerses[idx])}
                              >
                                <Heart className={`w-4 h-4 ${isBookmarked(surahNumber, ayahNum) ? 'fill-[#C8A951] text-[#C8A951]' : 'text-[#6B7280]'}`} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>{isBookmarked(surahNumber, ayahNum) ? 'Remove bookmark' : 'Bookmark'}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Full Arabic for reference */}
                      {arabVerse && (
                        <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] mb-4 text-right leading-[2.4] ${getArabicFontSize(arabicFontSize)}`}>
                          {arabVerse.text}
                        </div>
                      )}

                      <Separator className="my-3" />

                      {/* Word Chips */}
                      <div dir="rtl" lang="ar" className="flex flex-wrap gap-2 justify-end mt-4">
                        {words.map((word, wIdx) => (
                          <motion.div
                            key={`${verseKey}-${wIdx}`}
                            className="word-chip"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: wIdx * 0.01, duration: 0.15 }}
                          >
                            <span className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] whitespace-nowrap ${getArabicWordFontSize(arabicFontSize)}`}>
                              {word.arabic}
                            </span>
                            <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] text-center leading-tight max-w-[5rem]">
                              {islamifyNames(word.translation)}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Full Translation */}
                      {engVerse && (
                        <>
                          <Separator className="my-3" />
                          <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed">
                            {islamifyNames(engVerse.text)}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12 text-[#6B7280]">
              <p>No word-by-word data available for this surah.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Daily Motivation ─────────────────────────────────────

function DailyMotivation({
  addBookmark,
  isBookmarked,
  showToast,
  arabicFontSize,
}: {
  addBookmark: (b: BookmarkItem) => void;
  isBookmarked: (s: number, a: number) => boolean;
  showToast: (msg: string) => void;
  arabicFontSize: string;
}) {
  const [dailyVerse, setDailyVerse] = useState<{
    arabic: string;
    english: string;
    surahName: string;
    surahNameAr: string;
    ayahNumber: number;
    surahNumber: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dailyHadith] = useState<Hadith>(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return BUNDLED_HADITHS[dayOfYear % BUNDLED_HADITHS.length];
  });

  const fetchVerse = useCallback(async (ayahNum?: number) => {
    try {
      const num = ayahNum ?? getDayOfYearAyah();
      const res = await fetch(`https://api.alquran.cloud/v1/ayah/${num}/editions/quran-uthmani,en.sahih`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.code === 200 && Array.isArray(data.data)) {
        const arabic = data.data[0];
        const english = data.data[1];
        setDailyVerse({
          arabic: arabic.text,
          english: english.text,
          surahName: islamifyNames(english.surah.englishName),
          surahNameAr: english.surah.name,
          ayahNumber: english.numberInSurah,
          surahNumber: english.surah.number,
        });
        // Cache in localStorage
        try {
          localStorage.setItem('noor-daily-verse', JSON.stringify({
            data: { arabic: arabic.text, english: islamifyNames(english.text), surahName: islamifyNames(english.surah.englishName), surahNameAr: english.surah.name, ayahNumber: english.numberInSurah, surahNumber: english.surah.number },
            date: new Date().toDateString(),
          }));
        } catch { /* ignore */ }
        setError(null);
      }
    } catch {
      setError('Could not load verse. Please try again.');
    }
  }, []);

  useEffect(() => {
    // Check cache first
    try {
      const cached = localStorage.getItem('noor-daily-verse');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === new Date().toDateString()) {
          setDailyVerse(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    fetchVerse().finally(() => setLoading(false));
  }, [fetchVerse]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const randomAyah = Math.floor(Math.random() * TOTAL_VERSES) + 1;
    await fetchVerse(randomAyah);
    setRefreshing(false);
  };

  const handleCopy = async () => {
    if (!dailyVerse) return;
    const text = `${dailyVerse.arabic}\n\n${dailyVerse.english}\n\n— ${dailyVerse.surahName} ${dailyVerse.ayahNumber}:${dailyVerse.ayahNumber}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Could not copy text');
    }
  };

  const handleBookmark = () => {
    if (!dailyVerse) return;
    if (isBookmarked(dailyVerse.surahNumber, dailyVerse.ayahNumber)) {
      showToast('Already bookmarked');
      return;
    }
    addBookmark({
      surahNumber: dailyVerse.surahNumber,
      surahName: dailyVerse.surahName,
      surahNameAr: dailyVerse.surahNameAr,
      ayahNumber: dailyVerse.ayahNumber,
      ayahText: dailyVerse.arabic,
      translation: dailyVerse.english,
      dateAdded: new Date().toISOString(),
    });
    showToast('Saved to bookmarks ✨');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#0D4B3C] dark:text-[#C8A951]">Daily Motivation</h2>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">A verse from the Quran to brighten your day</p>
      </div>

      {/* Daily Verse Card */}
      <Card className="islamic-pattern-border overflow-hidden relative">
        {/* Decorative top border */}
        <div className="h-1.5 bg-gradient-to-r from-[#0D4B3C] via-[#C8A951] to-[#0D4B3C]" />

        <CardContent className="p-6 sm:p-8">
          {/* Bismillah */}
          <div className="bismillah mb-6">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>

          {loading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-16 w-full mx-auto max-w-lg" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-3">{error}</p>
              <Button onClick={handleRefresh} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
            </div>
          ) : dailyVerse ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Arabic Text */}
              <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] text-center mb-6 leading-[2.6] ${getArabicFontSize(arabicFontSize)}`}>
                {dailyVerse.arabic}
              </div>

              <div className="w-16 h-0.5 bg-[#C8A951] mx-auto mb-6" />

              {/* Translation */}
              <p className="text-[#4A5568] dark:text-[#9CA3AF] text-center leading-relaxed mb-4 max-w-xl mx-auto">
                {islamifyNames(dailyVerse.english)}
              </p>

              {/* Reference */}
              <p className="text-xs text-[#C8A951] font-semibold text-center mb-6">
                — {dailyVerse.surahName} ({dailyVerse.surahNameAr}) : {dailyVerse.ayahNumber}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34]"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                      New Verse
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Get a random verse</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34]"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Copy to clipboard</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBookmark}
                      className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34]"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isBookmarked(dailyVerse.surahNumber, dailyVerse.ayahNumber) ? 'fill-[#C8A951] text-[#C8A951]' : ''}`} />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Save to bookmarks</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Share
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p>Share this verse</p></TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          ) : null}
        </CardContent>
      </Card>

      {/* Hadith Card */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#C8A951]/50 via-[#C8A951] to-[#C8A951]/50" />
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C8A951]" />
            <CardTitle className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951]">Hadith of the Day</CardTitle>
          </div>
          <CardDescription className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Narrated by {dailyHadith.narrator}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] text-right mb-3 leading-[2.4] ${getArabicFontSize(arabicFontSize)}`}>
            {dailyHadith.textAr}
          </div>
          <Separator className="my-3" />
          <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed italic">
            &ldquo;{dailyHadith.textEn}&rdquo;
          </p>
          <p className="text-xs text-[#C8A951] mt-3 font-medium">
            — {dailyHadith.source}
          </p>
        </CardContent>
      </Card>

      {/* More Hadiths */}
      <div>
        <h3 className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951] mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          More Inspirational Hadiths
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BUNDLED_HADITHS.slice(0, 4).map((h, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-4">
                <p className="text-xs text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed line-clamp-3 mb-2">
                  &ldquo;{h.textEn}&rdquo;
                </p>
                <p className="text-[10px] text-[#C8A951] font-medium">— {h.source}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bookmarks View ───────────────────────────────────────

function BookmarksView({
  bookmarks,
  onRemove,
  onSelect,
  showToast,
  arabicFontSize,
}: {
  bookmarks: BookmarkItem[];
  onRemove: (s: number, a: number) => void;
  onSelect: (s: number) => void;
  showToast: (msg: string) => void;
  arabicFontSize: string;
}) {
  const handleDelete = (surahNumber: number, ayahNumber: number) => {
    onRemove(surahNumber, ayahNumber);
    showToast('Bookmark removed');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#0D4B3C] dark:text-[#C8A951]">Your Bookmarks</h2>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          {bookmarks.length} saved {bookmarks.length === 1 ? 'verse' : 'verses'}
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#0D4B3C]/5 dark:bg-[#C8A951]/5 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-[#0D4B3C]/30 dark:text-[#C8A951]/30" />
          </div>
          <h3 className="text-lg font-semibold text-[#1A1A2E] dark:text-[#E8E0D0] mb-2">No Bookmarks Yet</h3>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-sm mx-auto">
            Start exploring the Quran and save your favorite verses. Tap the heart icon on any verse to bookmark it.
          </p>
          <p className="font-arabic text-xl text-[#C8A951]/40 mt-4">
            وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ
          </p>
          <p className="text-xs text-[#6B7280] mt-1 italic">
            &ldquo;And We have certainly made the Quran easy for remembrance&rdquo; — Quran 54:17
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark, idx) => (
            <motion.div
              key={`${bookmark.surahNumber}-${bookmark.ayahNumber}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="islamic-border-top overflow-hidden group">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="verse-badge">{formatAyahNumber(bookmark.ayahNumber)}</div>
                      <div>
                        <p className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951]">
                          {bookmark.surahName}
                        </p>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Verse {bookmark.ayahNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => onSelect(bookmark.surahNumber)}
                          >
                            <BookOpen className="w-4 h-4 text-[#0D4B3C] dark:text-[#C8A951]" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>Open in reader</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => handleDelete(bookmark.surahNumber, bookmark.ayahNumber)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>Remove bookmark</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Arabic */}
                  <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] text-right mb-2 leading-[2.2] ${getArabicFontSize(arabicFontSize)}`}>
                    {bookmark.ayahText}
                  </div>

                  <Separator className="my-2" />

                  {/* Translation */}
                  <p className="text-xs text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed line-clamp-3">
                    {islamifyNames(bookmark.translation)}
                  </p>

                  {/* Date */}
                  <p className="text-[10px] text-[#6B7280]/60 dark:text-[#9CA3AF]/60 mt-2">
                    Saved {new Date(bookmark.dateAdded).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings View ────────────────────────────────────────

function SettingsView({
  isDark,
  toggleTheme,
  arabicFontSize,
  changeFontSize,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  arabicFontSize: string;
  changeFontSize: (s: 'sm' | 'md' | 'lg') => void;
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-[#0D4B3C] dark:text-[#C8A951]">Settings</h2>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">Customize your reading experience</p>
      </div>

      {/* Theme */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5 text-[#C8A951]" /> : <Sun className="w-5 h-5 text-[#0D4B3C]" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#E8E0D0]">Dark Mode</p>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Switch between light and dark theme</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center">
              <Type className="w-5 h-5 text-[#0D4B3C] dark:text-[#C8A951]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#E8E0D0]">Arabic Font Size</p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Adjust the size of Arabic text</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {([
              { size: 'sm' as const, label: 'Small', preview: 'text-lg' },
              { size: 'md' as const, label: 'Medium', preview: 'text-xl' },
              { size: 'lg' as const, label: 'Large', preview: 'text-2xl' },
            ]).map(({ size, label, preview }) => (
              <button
                key={size}
                onClick={() => changeFontSize(size)}
                className={`flex-1 p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                  arabicFontSize === size
                    ? 'border-[#0D4B3C] dark:border-[#C8A951] bg-[#0D4B3C]/5 dark:bg-[#C8A951]/5'
                    : 'border-[#E5E1D8] dark:border-[#2D3E34] hover:border-[#C8A951]/40'
                }`}
              >
                <p className={`font-arabic ${preview} text-[#0D4B3C] dark:text-[#C8A951] mb-1`}>بسم الله</p>
                <p className={`text-xs font-medium ${arabicFontSize === size ? 'text-[#0D4B3C] dark:text-[#C8A951]' : 'text-[#6B7280]'}`}>
                  {label}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Translation Info */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#0D4B3C] dark:text-[#C8A951]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#E8E0D0]">Translation</p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                English — Sahih International
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#0D4B3C] via-[#C8A951] to-[#0D4B3C]" />
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center">
              <Info className="w-5 h-5 text-[#0D4B3C] dark:text-[#C8A951]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#E8E0D0]">About Noor</p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Version 1.0.0</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-[#4A5568] dark:text-[#9CA3AF]">
            <p>
              <strong className="text-[#0D4B3C] dark:text-[#C8A951]">نـور (Noor)</strong> means &ldquo;Light&rdquo; in Arabic.
              It is a Faith-Tech application designed to bring the beauty of the Quran closer to you.
            </p>
            <p>
              Features include a complete Quran reader with word-for-word translation, daily motivational verses,
              curated Hadiths, and a personal bookmark system.
            </p>
            <Separator className="my-3" />
            <p className="text-xs">
              Quran data provided by <strong>alquran.cloud</strong> API.
              <br />
              Built with ❤️ for the Muslim Ummah.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
