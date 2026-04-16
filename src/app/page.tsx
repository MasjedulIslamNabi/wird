'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coordinates as AdhanCoordinates, PrayerTimes as AdhanPrayerTimes, CalculationMethod as AdhanCalculationMethod, Madhab as AdhanMadhab } from 'adhan';
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
  Volume2,
  Play,
  Pause,
  ChevronDown,
  Type,
  Globe,
  Info,
  Loader2,
  X,
  Headphones,
  SkipForward,
  SkipBack,
  Square,
  ListMusic,
  Repeat,
  HandHeart,
  MapPin,
  Clock,
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

// ─── Error Boundary ────────────────────────────────────

class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[TabErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">Something went wrong</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">This section encountered an error.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-lg bg-[#0D4B3C] dark:bg-[#C8A951] text-white dark:text-[#0D4B3C] text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', shortName: 'Alafasy' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', shortName: 'Husary' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq Al-Minshawi', shortName: 'Minshawi' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al Muaiqly', shortName: 'Muaiqly' },
  { id: 'ar.ahmedajamy', name: 'Ahmed ibn Ali Al-Ajamy', shortName: 'Al-Ajamy' },
  { id: 'ar.hudhaify', name: 'Ali Al-Hudhaify', shortName: 'Hudhaify' },
];

// ─── Daily Dua Collection ────────────────────────────────

interface DuaItem {
  id: string;
  title: string;
  titleAr: string;
  arabic: string;
  english: string;
  bangla: string;
  reference: string;
  category: 'morning' | 'evening' | 'sleep' | 'prayer' | 'after-eating' | 'travel' | 'gratitude' | 'forgiveness';
}

const DUA_CATEGORIES = [
  { id: 'morning' as const, label: 'Morning', labelAr: 'صباح', icon: '🌅', color: '#F59E0B' },
  { id: 'evening' as const, label: 'Evening', labelAr: 'مساء', icon: '🌆', color: '#8B5CF6' },
  { id: 'prayer' as const, label: 'After Prayer', labelAr: 'بعد الصلاة', icon: '🕌', color: '#0D4B3C' },
  { id: 'sleep' as const, label: 'Before Sleep', labelAr: 'قبل النوم', icon: '🌙', color: '#1E3A5F' },
  { id: 'after-eating' as const, label: 'After Eating', labelAr: 'بعد الطعام', icon: '🍽️', color: '#059669' },
  { id: 'travel' as const, label: 'Travel', labelAr: 'سفر', icon: '✈️', color: '#2563EB' },
  { id: 'gratitude' as const, label: 'Gratitude', labelAr: 'شكر', icon: '💕', color: '#DC2626' },
  { id: 'forgiveness' as const, label: 'Forgiveness', labelAr: 'استغفار', icon: '🤲', color: '#7C3AED' },
];

const BUNDLED_DUAS: DuaItem[] = [
  // ── Morning Duas ──
  {
    id: 'morning-1',
    title: 'Morning Invocation',
    titleAr: 'أذكار الصباح',
    arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    english: 'We have reached the morning and at this very time all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the goodness of this day, its triumphs, its light, its blessings and its guidance, and I seek refuge in You from the evil that is in it and from the evil that comes after it.',
    bangla: 'আমরা সকালে পৌঁছেছি এবং সকালে সমস্ত রাজত্ব আল্লাহর, সকল প্রশংসা আল্লাহর। আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি একক, তাঁর কোনো শরীক নেই। তাঁরই রাজত্ব, তাঁরই প্রশংসা এবং তিনি সব কিছুর উপরে ক্ষমতাবান।',
    reference: 'Sahih Muslim 4/2088',
    category: 'morning',
  },
  {
    id: 'morning-2',
    title: 'Protection from Harm',
    titleAr: 'اللَّهُمَّ بِكَ أَصْبَحْنَا',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
    english: 'O Allah, by Your leave we have reached the morning, by Your leave we have reached the evening, by Your leave we live and die, and unto You is our resurrection.',
    bangla: 'হে আল্লাহ, তোমার রহমতে আমরা সকালে পৌঁছেছি, তোমার রহমতে সন্ধ্যায় পৌঁছেছি, তোমার রহমতে বাঁচি এবং তোমার রহমতে মারা যাই। আর তোমারই দিকে পুনরুত্থান।',
    reference: 'Sunan At-Tirmidhi 5/466',
    category: 'morning',
  },
  {
    id: 'morning-3',
    title: 'Morning Remembrance',
    titleAr: 'سبحان الله وبحمده',
    arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ',
    english: 'How perfect Allah is and I praise Him.',
    bangla: 'আল্লাহ পবিত্র এবং আমি তাঁর প্রশংসা করি।',
    reference: 'Sahih Al-Bukhari & Muslim',
    category: 'morning',
  },
  {
    id: 'morning-4',
    title: 'Seeking Refuge from Shaytan',
    titleAr: 'أعوذ بكلمات الله التامات',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    english: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    bangla: 'আমি আল্লাহর পূর্ণ কালিমাগুলোর আশ্রয় নিচ্ছি তিনি যা সৃষ্টি করেছেন তার অনিষ্ট থেকে।',
    reference: 'Sahih Muslim 4/2084',
    category: 'morning',
  },

  // ── Evening Duas ──
  {
    id: 'evening-1',
    title: 'Evening Invocation',
    titleAr: 'أمسينا وأمسى الملك لله',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    english: 'We have reached the evening and at this very time all sovereignty belongs to Allah, Lord of the worlds. O Allah, I ask You for the goodness of this night, its triumphs, its light, its blessings and its guidance, and I seek refuge in You from the evil that is in it and from the evil that comes after it.',
    bangla: 'আমরা সন্ধ্যায় পৌঁছেছি এবং সন্ধ্যায় সমস্ত রাজত্ব আল্লাহর, সকল প্রশংসা আল্লাহর। আল্লাহ ছাড়া কোনো ইলাহ নেই, তিনি একক, তাঁর কোনো শরীক নেই। তাঁরই রাজত্ব, তাঁরই প্রশংসা এবং তিনি সব কিছুর উপরে ক্ষমতাবান।',
    reference: 'Sahih Muslim 4/2088',
    category: 'evening',
  },
  {
    id: 'evening-2',
    title: 'Evening Protection',
    titleAr: 'اللَّهُمَّ بِكَ أَمْسَيْنَا',
    arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ',
    english: 'O Allah, by Your leave we have reached the evening, by Your leave we have reached the morning, by Your leave we live and die, and unto You is our return.',
    bangla: 'হে আল্লাহ, তোমার রহমতে আমরা সন্ধ্যায় পৌঁছেছি, তোমার রহমতে সকালে পৌঁছেছি, তোমার রহমতে বাঁচি এবং তোমার রহমতে মারা যাই। আর তোমারই দিকে প্রত্যাবর্তন।',
    reference: 'Sunan At-Tirmidhi 5/466',
    category: 'evening',
  },
  {
    id: 'evening-3',
    title: 'Three Quls (Protection)',
    titleAr: 'القل - الفلق - الناس',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ، قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    english: 'Recite Surah Al-Ikhlas, Al-Falaq, and An-Nas three times each in the evening for protection from all harm.',
    bangla: 'সন্ধ্যায় সূরা ইখলাস, ফালাক এবং নাস তিন তিন বার করে পড়ুন — সমস্ত অনিষ্ট থেকে সুরক্ষার জন্য।',
    reference: 'Sunan Abu Dawud 4/322, Sunan At-Tirmidhi 5/567',
    category: 'evening',
  },

  // ── After Prayer Duas ──
  {
    id: 'prayer-1',
    title: 'Istighfar After Prayer',
    titleAr: 'أستغفر الله',
    arabic: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ',
    english: 'I ask Allah for forgiveness (recite three times after every prayer).',
    bangla: 'আমি আল্লাহর ক্ষমা চাই (প্রতি নামাজের পর তিনবার পড়ুন)।',
    reference: 'Sahih Al-Bukhari & Muslim',
    category: 'prayer',
  },
  {
    id: 'prayer-2',
    title: 'Tashahhud Dua',
    titleAr: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، وَمِنْ عَذَابِ جَهَنَّمَ، وَمِنْ فِتْنَةِ الْمَحْيَا وَالْمَمَاتِ، وَمِنْ شَرِّ فِتْنَةِ الْمَسِيحِ الدَّجَّالِ',
    english: 'O Allah, I seek refuge in You from the punishment of the grave, from the punishment of Hellfire, from the trials of life and death, and from the evil trials of the False Messiah.',
    bangla: 'হে আল্লাহ, আমি কবরের আযাব থেকে, জাহান্নামের আযাব থেকে, জীবন ও মৃত্যুর ফিতনা থেকে এবং দাজ্জালের ফিতনা থেকে তোমার আশ্রয় চাই।',
    reference: 'Sahih Al-Bukhari & Muslim',
    category: 'prayer',
  },
  {
    id: 'prayer-3',
    title: 'Dua for Guidance',
    titleAr: 'اللَّهُمَّ اهْدِنِي',
    arabic: 'اللَّهُمَّ اهْدِنِي وَسَدِّدْنِي',
    english: 'O Allah, guide me and keep me on the right path.',
    bangla: 'হে আল্লাহ, আমাকে হেদায়েত দাও এবং আমাকে সঠিক পথে অবিচল রাখো।',
    reference: 'Sunan Muslim 2/2019',
    category: 'prayer',
  },

  // ── Before Sleep Duas ──
  {
    id: 'sleep-1',
    title: 'Sleep Dua',
    titleAr: 'باسمك ربي وضعت جنبي',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    english: 'In Your name, O Allah, I die and I live.',
    bangla: 'হে আল্লাহ, তোমার নামেই আমি মারা যাই এবং তোমার নামেই বাঁচি।',
    reference: 'Sahih Al-Bukhari 11/113',
    category: 'sleep',
  },
  {
    id: 'sleep-2',
    title: 'Surah Al-Mulk Before Sleep',
    titleAr: 'سورة الملك',
    arabic: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    english: 'Recite Surah Al-Mulk before sleeping — it protects from the punishment of the grave and intercedes for the reciter until Allah forgives them.',
    bangla: 'ঘুমানোর আগে সূরা আল-মুলক তিলাওয়াত করুন — এটি কবরের আযাব থেকে রক্ষা করে এবং আল্লাহ ক্ষমা না করা পর্যন্ত পাঠকের জন্য সুপারিশ করে।',
    reference: 'Sunan At-Tirmidhi 5/267, Tafsir Ibn Kathir',
    category: 'sleep',
  },
  {
    id: 'sleep-3',
    title: 'Putting Side to Rest Dua',
    titleAr: 'باسمك ربي وضعت جنبي',
    arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    english: 'In Your name, my Lord, I lay my side down, and in Your name I raise it. If You take my soul, have mercy on it, and if You return it, protect it as You protect Your righteous servants.',
    bangla: 'হে আমার রব, তোমার নামেই আমি আমার কাত হয়ে শুয়েছি, তোমার নামেই আমি উঠি। তুমি যদি আমার প্রাণ নাও, তবে তার প্রতি দয়া করো, আর যদি ছেড়ে দাও, তবে তোমার নেক বান্দাদের যেভাবে হেফাজত করো, তার মতো হেফাজত করো।',
    reference: 'Sahih Al-Bukhari & Muslim',
    category: 'sleep',
  },

  // ── After Eating ──
  {
    id: 'eating-1',
    title: 'After Meal Dua',
    titleAr: 'الحمد لله الذي أطعمنا',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
    english: 'All praise is for Allah who fed us, gave us drink, and made us Muslims.',
    bangla: 'সকল প্রশংসা আল্লাহর যিনি আমাদের খাওয়ালেন, পান করালেন এবং আমাদের মুসলিম বানিয়েছেন।',
    reference: 'Sunan Abu Dawud 3/347, Sunan At-Tirmidhi 4/286',
    category: 'after-eating',
  },
  {
    id: 'eating-2',
    title: 'Before Meal Dua',
    titleAr: 'بسم الله',
    arabic: 'بِسْمِ اللهِ وَعَلَى بَرَكَةِ اللهِ',
    english: 'In the name of Allah and with the blessings of Allah.',
    bangla: 'আল্লাহর নামে এবং আল্লাহর বরকতে।',
    reference: 'Sunan Abu Dawud 3/347',
    category: 'after-eating',
  },

  // ── Travel ──
  {
    id: 'travel-1',
    title: 'Travel Dua',
    titleAr: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا',
    arabic: 'اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى',
    english: 'O Allah, we ask You for righteousness and piety on this journey, and deeds that are pleasing to You.',
    bangla: 'হে আল্লাহ, আমরা এই সফরে তোমার কাছে নেকি ও তাকওয়া চাই, এবং তুমি যে আমল পছন্দ করো সেই আমল চাই।',
    reference: 'Sahih Muslim 2/978',
    category: 'travel',
  },
  {
    id: 'travel-2',
    title: 'Mounting Dua',
    titleAr: 'سبحان الذي سخر لنا',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ',
    english: 'Glory be to the One who has subjugated this for us, for we could not have done it on our own. Indeed, to our Lord we will all return.',
    bangla: 'পবিত্র তিনি যিনি এটিকে আমাদের জন্য বশীভূত করেছেন, আমরা একাকী এটি নিয়ন্ত্রণ করতে পারতাম না। নিশ্চয়ই আমরা আমাদের রবের দিকে প্রত্যাবর্তন করব।',
    reference: 'Surah Az-Zukhruf 43:13-14',
    category: 'travel',
  },

  // ── Gratitude ──
  {
    id: 'gratitude-1',
    title: 'Shukr (Gratitude)',
    titleAr: 'اللَّهُمَّ لَكَ الْحَمْدُ',
    arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالْأَرْضِ وَمَنْ فِيهِنَّ',
    english: 'O Allah, all praise is Yours. You are the Light of the heavens and the earth and all that is in them.',
    bangla: 'হে আল্লাহ, সকল প্রশংসা তোমারই। তুমি আসমান ও যমীন এবং তাদের মধ্যে যা আছে তার আলো।',
    reference: 'Sahih Al-Bukhari & Muslim',
    category: 'gratitude',
  },
  {
    id: 'gratitude-2',
    title: 'Thankfulness Dua',
    titleAr: 'رَبِّ أَوْزِعْنِي',
    arabic: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ',
    english: 'My Lord, inspire me to be thankful for Your blessings which You have blessed me and my parents with, and to do righteous deeds that please You.',
    bangla: 'হে আমার রব, তুমি আমাকে তোমার নিয়ামতের শুকরিয়া আদায় করার তাওফিক দাও যা তুমি আমাকে ও আমার পিতা-মাতাকে দিয়েছো, এবং আমাকে এমন সৎকর্ম করার তাওফিক দাও যা তুমি পছন্দ করো।',
    reference: 'Surah An-Naml 27:19',
    category: 'gratitude',
  },

  // ── Forgiveness ──
  {
    id: 'forgiveness-1',
    title: 'Sayyidul Istighfar',
    titleAr: 'سيد الاستغفار',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَـهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
    english: 'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant. I am upon Your covenant and promise as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your blessings upon me and I acknowledge my sins, so forgive me, for indeed none can forgive sins except You.',
    bangla: 'হে আল্লাহ, তুমিই আমার রব, তুমি ছাড়া কোনো ইলাহ নেই। তুমি আমাকে সৃষ্টি করেছো এবং আমি তোমার বান্দা। আমি তোমার অঙ্গীকার ও প্রতিশ্রুতির উপর যথাসাধ্য রয়েছি। আমি আমার কৃতকর্মের অনিষ্ট থেকে তোমার আশ্রয় চাই। আমি তোমার আমার প্রতি অনুগ্রহকে স্বীকার করি এবং আমার পাপকেও স্বীকার করি, অতএব আমাকে ক্ষমা করো, কারণ পাপ ক্ষমা করার ক্ষমতা তোমার ছাড়া কারো নেই।',
    reference: 'Sahih Al-Bukhari 8/84, Sunan At-Tirmidhi 5/529',
    category: 'forgiveness',
  },
  {
    id: 'forgiveness-2',
    title: 'Istighfar',
    titleAr: 'رب اغفر لي وتب عليّ',
    arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    english: 'My Lord, forgive me and accept my repentance, for indeed You are the Accepting of Repentance, the Merciful.',
    bangla: 'হে আমার রব, আমাকে ক্ষমা করো এবং আমার তওবা কবুল করো, নিশ্চয়ই তুমি তওবা কবুলকারী, দয়ালু।',
    reference: 'Surah An-Nasaa 110:3, Sunan Abu Dawud 2/86',
    category: 'forgiveness',
  },
  {
    id: 'forgiveness-3',
    title: 'Constant Istighfar',
    titleAr: 'استغفر الله العظيم',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    english: 'I seek the forgiveness of Allah, the Magnificent, besides whom there is no deity, the Ever-Living, the Sustainer of existence, and I repent to Him.',
    bangla: 'আমি মহান আল্লাহর ক্ষমা চাই, যিনি ছাড়া কোনো ইলাহ নেই, চিরঞ্জীব, সমস্ত সৃষ্টির পালনকর্তা, এবং আমি তাঁর দিকে তওবা করি।',
    reference: 'Sunan Abu Dawud 2/87, Sunan At-Tirmidhi 5/450',
    category: 'forgiveness',
  },
];

// ─── Situation-Based Duas ───────────────────────────────

interface SituationDua {
  situation: string;
  emoji: string;
  description: string;
  duas: DuaItem[];
}

const SITUATION_DUAS: SituationDua[] = [
  {
    situation: 'Hard Times',
    emoji: '😔',
    description: 'When life feels overwhelming',
    duas: [
      {
        id: 'sit-hard-1',
        title: 'Dua for Distress',
        titleAr: 'دعاء الهم والغم',
        arabic: 'لَا إِلَـهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَـهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لَا إِلَـهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ',
        english: 'There is no deity except Allah, the Magnificent, the Forbearing. There is no deity except Allah, Lord of the magnificent Throne. There is no deity except Allah, Lord of the heavens and Lord of the earth and Lord of the noble Throne.',
        bangla: 'মহান, সহনশীল আল্লাহ ছাড়া কোনো ইলাহ নেই। মহান আরশের রব আল্লাহ ছাড়া কোনো ইলাহ নেই। আসমান ও যমীনের রব এবং সম্মানিত আরশের রব আল্লাহ ছাড়া কোনো ইলাহ নেই।',
        reference: 'Sahih Al-Bukhari & Muslim',
        category: 'morning',
      },
      {
        id: 'sit-hard-2',
        title: 'Hasbunallahu',
        titleAr: 'حسبنا الله ونعم الوكيل',
        arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
        english: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
        bangla: 'আমাদের জন্য আল্লাহই যথেষ্ট এবং তিনি সর্বোত্তম অভিভাবক।',
        reference: 'Surah Al-Imran 3:173',
        category: 'morning',
      },
      {
        id: 'sit-hard-3',
        title: 'Dua for Ease After Hardship',
        titleAr: 'دعاء الفرج',
        arabic: 'اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ',
        english: 'O Allah, I am Your servant, son of Your servant, son of Your maidservant. My forelock is in Your hand. Your command over me is forever executed and Your decree over me is just.',
        bangla: 'হে আল্লাহ, আমি তোমার বান্দা, তোমার বান্দার পুত্র, তোমার দাসীর পুত্র। আমার চুল তোমার হাতে। তোমার আদেশ আমার উপর চিরকাল কার্যকর এবং তোমার ফয়সালা আমার বেলায় ন্যায্য।',
        reference: 'Musnad Ahmad',
        category: 'morning',
      },
    ],
  },
  {
    situation: 'Anxiety & Worry',
    emoji: '😰',
    description: 'When you feel anxious or worried',
    duas: [
      {
        id: 'sit-anxiety-1',
        title: 'Dua for Anxiety',
        titleAr: 'دعاء الكرب',
        arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
        english: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, miserliness and cowardice, the burden of debts and from being overpowered by men.',
        bangla: 'হে আল্লাহ, আমি উদ্বেগ ও দুঃখ থেকে তোমার আশ্রয় চাই। দুর্বলতা ও অলসতা থেকে, কাপুরুষতা ও কৃপণতা থেকে, ঋণের ভার ও মানুষের অত্যাচার থেকে তোমার আশ্রয় চাই।',
        reference: 'Sahih Al-Bukhari 7/158',
        category: 'evening',
      },
      {
        id: 'sit-anxiety-2',
        title: 'La Tahzan',
        titleAr: 'لا تحزن',
        arabic: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
        english: 'Do not grieve; indeed Allah is with us.',
        bangla: 'দুঃখ করো না, নিশ্চয়ই আল্লাহ আমাদের সাথে আছেন।',
        reference: 'Surah At-Tawbah 9:40',
        category: 'evening',
      },
      {
        id: 'sit-anxiety-3',
        title: 'Heart Contentment',
        titleAr: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
        arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
        english: 'Verily, in the remembrance of Allah do hearts find rest.',
        bangla: 'নিশ্চয়ই আল্লাহর স্মরণেই অন্তর প্রশান্তি লাভ করে।',
        reference: 'Surah Ar-Ra\'d 13:28',
        category: 'evening',
      },
    ],
  },
  {
    situation: 'Seeking Guidance',
    emoji: '🤲',
    description: 'When you need direction in life',
    duas: [
      {
        id: 'sit-guidance-1',
        title: 'Istikhara Dua',
        titleAr: 'صلاة الاستخارة',
        arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ',
        english: 'O Allah, I seek Your counsel through Your knowledge, and I seek Your power through Your might, and I ask of You from Your great bounty. For indeed You have power and I do not, and You know while I do not.',
        bangla: 'হে আল্লাহ, আমি তোমার জ্ঞান দ্বারা তোমার কাছে কল্যাণ চাই, তোমার কুদরত দ্বারা শক্তি চাই, এবং তোমার মহান অনুগ্রহ থেকে চাই। তুমি ক্ষমতাবান আমি নই, তুমি জানো আমি জানি না, এবং তুমি অদৃশ্যের জ্ঞানী।',
        reference: 'Sahih Al-Bukhari',
        category: 'prayer',
      },
      {
        id: 'sit-guidance-2',
        title: 'Rabbi Zidni Ilma',
        titleAr: 'رب زدني علماً',
        arabic: 'رَبِّ زِدْنِي عِلْمًا',
        english: 'My Lord, increase me in knowledge.',
        bangla: 'হে আমার রব, আমাকে জ্ঞান বাড়াও।',
        reference: 'Surah Ta-Ha 20:114',
        category: 'prayer',
      },
    ],
  },
  {
    situation: 'Before Important Task',
    emoji: '💪',
    description: 'Before exams, interviews, big decisions',
    duas: [
      {
        id: 'sit-task-1',
        title: 'Bismillah with Tawakkul',
        titleAr: 'بسم الله توكلت على الله',
        arabic: 'بِسْمِ اللهِ، تَوَكَّلْتُ عَلَى اللهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
        english: 'In the name of Allah, I place my trust in Allah, and there is no power nor might except with Allah.',
        bangla: 'আল্লাহর নামে, আমি আল্লাহর উপর ভরসা করলাম, এবং আল্লাহর ছাড়া কোনো ক্ষমতা ও শক্তি নেই।',
        reference: 'Sunan Abu Dawud & Sunan At-Tirmidhi',
        category: 'prayer',
      },
      {
        id: 'sit-task-2',
        title: 'Allahumma Barik',
        titleAr: 'اللهم بارك',
        arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي أَعْمَالِنَا وَبَارِكْ لَنَا فِي أَقْوَالِنَا',
        english: 'O Allah, bless us in our deeds and bless us in our words.',
        bangla: 'হে আল্লাহ, আমাদের আমলে বরকত দাও এবং আমাদের কথায় বরকত দাও।',
        reference: 'Al-Mu\'jam Al-Kabir',
        category: 'prayer',
      },
    ],
  },
  {
    situation: 'After Loss',
    emoji: '💔',
    description: "When you've lost someone or something",
    duas: [
      {
        id: 'sit-loss-1',
        title: 'Patience Dua',
        titleAr: 'إنا لله وإنا إليه راجعون',
        arabic: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ، اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا',
        english: 'Indeed we belong to Allah, and indeed to Him we will return. O Allah, reward me in my affliction and compensate me with something better.',
        bangla: 'নিশ্চয়ই আমরা আল্লাহর এবং নিশ্চয়ই আমরা তাঁর দিকে প্রত্যাবর্তন করব। হে আল্লাহ, আমার বিপদে আমাকে পুরস্কৃত করো এবং এর চেয়ে উত্তম কিছু দিয়ে প্রতিস্থাপন করো।',
        reference: 'Sahih Muslim',
        category: 'forgiveness',
      },
      {
        id: 'sit-loss-2',
        title: 'Inna Ma\'al Usri Yusra',
        titleAr: 'إن مع العسر يسراً',
        arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا، إِنَّ مَعَ الْعُسْرِ يُسْرًا',
        english: 'For indeed, with hardship comes ease. Indeed, with hardship comes ease.',
        bangla: 'নিশ্চয়ই কষ্টের সাথে স্বস্তি আসে। নিশ্চয়ই কষ্টের সাথে স্বস্তি আসে।',
        reference: 'Surah Ash-Sharh 94:5-6',
        category: 'forgiveness',
      },
    ],
  },
  {
    situation: 'Gratitude',
    emoji: '🌟',
    description: 'When you want to thank Allah',
    duas: [
      {
        id: BUNDLED_DUAS[14].id,
        title: BUNDLED_DUAS[14].title,
        titleAr: BUNDLED_DUAS[14].titleAr,
        arabic: BUNDLED_DUAS[14].arabic,
        english: BUNDLED_DUAS[14].english,
        bangla: BUNDLED_DUAS[14].bangla,
        reference: BUNDLED_DUAS[14].reference,
        category: BUNDLED_DUAS[14].category,
      },
      {
        id: BUNDLED_DUAS[15].id,
        title: BUNDLED_DUAS[15].title,
        titleAr: BUNDLED_DUAS[15].titleAr,
        arabic: BUNDLED_DUAS[15].arabic,
        english: BUNDLED_DUAS[15].english,
        bangla: BUNDLED_DUAS[15].bangla,
        reference: BUNDLED_DUAS[15].reference,
        category: BUNDLED_DUAS[15].category,
      },
      {
        id: 'sit-gratitude-3',
        title: 'Alhamdulillah',
        titleAr: 'الحمد لله رب العالمين',
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        english: 'All praise is due to Allah, Lord of all the worlds.',
        bangla: 'সকল প্রশংসা আল্লাহর, সমস্ত সৃষ্টির রব।',
        reference: 'Surah Al-Fatihah 1:2',
        category: 'gratitude',
      },
    ],
  },
  {
    situation: 'Seeking Forgiveness',
    emoji: '🤲',
    description: 'When you want to repent',
    duas: [
      {
        id: BUNDLED_DUAS[16].id,
        title: BUNDLED_DUAS[16].title,
        titleAr: BUNDLED_DUAS[16].titleAr,
        arabic: BUNDLED_DUAS[16].arabic,
        english: BUNDLED_DUAS[16].english,
        bangla: BUNDLED_DUAS[16].bangla,
        reference: BUNDLED_DUAS[16].reference,
        category: BUNDLED_DUAS[16].category,
      },
      {
        id: BUNDLED_DUAS[17].id,
        title: BUNDLED_DUAS[17].title,
        titleAr: BUNDLED_DUAS[17].titleAr,
        arabic: BUNDLED_DUAS[17].arabic,
        english: BUNDLED_DUAS[17].english,
        bangla: BUNDLED_DUAS[17].bangla,
        reference: BUNDLED_DUAS[17].reference,
        category: BUNDLED_DUAS[17].category,
      },
      {
        id: BUNDLED_DUAS[18].id,
        title: BUNDLED_DUAS[18].title,
        titleAr: BUNDLED_DUAS[18].titleAr,
        arabic: BUNDLED_DUAS[18].arabic,
        english: BUNDLED_DUAS[18].english,
        bangla: BUNDLED_DUAS[18].bangla,
        reference: BUNDLED_DUAS[18].reference,
        category: BUNDLED_DUAS[18].category,
      },
    ],
  },
  {
    situation: 'Before Sleep',
    emoji: '🌙',
    description: 'End your day with remembrance',
    duas: [
      {
        id: BUNDLED_DUAS[8].id,
        title: BUNDLED_DUAS[8].title,
        titleAr: BUNDLED_DUAS[8].titleAr,
        arabic: BUNDLED_DUAS[8].arabic,
        english: BUNDLED_DUAS[8].english,
        bangla: BUNDLED_DUAS[8].bangla,
        reference: BUNDLED_DUAS[8].reference,
        category: BUNDLED_DUAS[8].category,
      },
      {
        id: BUNDLED_DUAS[9].id,
        title: BUNDLED_DUAS[9].title,
        titleAr: BUNDLED_DUAS[9].titleAr,
        arabic: BUNDLED_DUAS[9].arabic,
        english: BUNDLED_DUAS[9].english,
        bangla: BUNDLED_DUAS[9].bangla,
        reference: BUNDLED_DUAS[9].reference,
        category: BUNDLED_DUAS[9].category,
      },
      {
        id: BUNDLED_DUAS[10].id,
        title: BUNDLED_DUAS[10].title,
        titleAr: BUNDLED_DUAS[10].titleAr,
        arabic: BUNDLED_DUAS[10].arabic,
        english: BUNDLED_DUAS[10].english,
        bangla: BUNDLED_DUAS[10].bangla,
        reference: BUNDLED_DUAS[10].reference,
        category: BUNDLED_DUAS[10].category,
      },
    ],
  },
];

// ─── Prayer Time Calculation ───────────────────────────

function calculatePrayerTimes(lat: number, lng: number, date: Date): Record<string, string> {
  try {
    const coords = new AdhanCoordinates(lat, lng);
    const params = AdhanCalculationMethod.MuslimWorldLeague();
    params.madhab = AdhanMadhab.Shafi;
    const pt = new AdhanPrayerTimes(coords, date, params);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = (d: Date): string => {
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    return {
      Fajr: fmt(pt.fajr),
      Sunrise: fmt(pt.sunrise),
      Dhuhr: fmt(pt.dhuhr),
      Asr: fmt(pt.asr),
      Maghrib: fmt(pt.maghrib),
      Isha: fmt(pt.isha),
    };
  } catch {
    return { Fajr: '--:--', Sunrise: '--:--', Dhuhr: '--:--', Asr: '--:--', Maghrib: '--:--', Isha: '--:--' };
  }
}

function getNextPrayer(prayerTimes: Record<string, string>): string | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const order = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  for (const name of order) {
    const timeStr = prayerTimes[name];
    if (!timeStr || timeStr === '--:--') continue;
    const parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/);
    if (!parts) continue;
    let h = parseInt(parts[1]);
    const m = parseInt(parts[2]);
    const ampm = parts[3];
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentMinutes) return name;
  }
  return 'Fajr';
}

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
  const [activeTab, setActiveTab] = useState<'quran' | 'listen' | 'daily' | 'duas' | 'bookmarks' | 'settings'>('quran');
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('wird-bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [arabicFontSize, setArabicFontSize] = useState<'sm' | 'md' | 'lg'>(() => {
    if (typeof window === 'undefined') return 'md';
    try {
      const saved = localStorage.getItem('wird-font-size');
      if (saved === 'sm' || saved === 'md' || saved === 'lg') return saved;
    } catch { /* ignore */ }
    return 'md';
  });
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read persisted theme on mount (avoids hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('wird-theme');
    if (saved === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('wird-bookmarks', JSON.stringify(bookmarks));
    } catch { /* ignore */ }
  }, [bookmarks]);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('wird-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('wird-theme', 'light');
      }
      return next;
    });
  }, []);

  // Font size change
  const changeFontSize = useCallback((size: 'sm' | 'md' | 'lg') => {
    setArabicFontSize(size);
    localStorage.setItem('wird-font-size', size);
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
    setActiveTab('quran');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const { showToast } = useToast();

  // Global player state for cross-tab mini-player
  const [globalPlayer, setGlobalPlayer] = useState<{
    isPlaying: boolean;
    currentSurah: number;
    currentAyah: number;
    reciterId: string;
    reciterName: string;
    surahName: string;
    surahNameAr: string;
    totalInSurah: number;
  } | null>(null);
  const globalAudioRef = useRef<HTMLAudioElement | null>(null) as React.MutableRefObject<HTMLAudioElement | null>;
  const [playerMeta, setPlayerMeta] = useState<{ startSurah: number; endSurah: number; surahList: SurahInfo[] } | null>(null);
  const [autoPlaySurah, setAutoPlaySurah] = useState<number | null>(null);

  // PWA Install Prompt
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('wird-install-dismissed') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem('wird-install-dismissed');
      if (dismissed !== 'true') {
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Stable callback for auto-play consumption (prevents infinite useEffect churn)
  const onAutoPlayConsumed = useCallback(() => setAutoPlaySurah(null), []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      showToast('Wird installed successfully! 🎉');
    }
    setInstallPrompt(null);
    setShowInstallBanner(false);
  }, [installPrompt, showToast]);

  const dismissInstall = useCallback(() => {
    setShowInstallBanner(false);
    setInstallDismissed(true);
    try { localStorage.setItem('wird-install-dismissed', 'true'); } catch {}
  }, []);

  // Navigate from My Space to Listen tab with a specific surah
  const navigateToListen = useCallback((surahNumber: number) => {
    setAutoPlaySurah(surahNumber);
    setActiveTab('listen');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--islamic-bg)] dark:bg-[#0F1A14] transition-colors duration-300">
      {/* Header */}
      <IslamicHeader activeTab={activeTab} setActiveTab={setActiveTab} setSelectedSurah={setSelectedSurah} isDark={isDark} toggleTheme={toggleTheme} />

      {/* Main Content */}
      <main className={`flex-1 ${globalPlayer && activeTab !== 'listen' ? 'pb-36 md:pb-24' : 'pb-20 md:pb-4'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedSurah ?? '')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {activeTab === 'listen' && (
              <TabErrorBoundary>
                <ContinuousPlayer
                  globalPlayer={globalPlayer}
                  setGlobalPlayer={setGlobalPlayer}
                  globalAudioRef={globalAudioRef}
                  playerMeta={playerMeta}
                  setPlayerMeta={setPlayerMeta}
                  showToast={showToast}
                  autoPlaySurah={autoPlaySurah}
                  onAutoPlayConsumed={onAutoPlayConsumed}
                />
              </TabErrorBoundary>
            )}
            {activeTab === 'quran' && (
              <TabErrorBoundary>
                {selectedSurah !== null ? (
                  <SurahReader
                    surahNumber={selectedSurah}
                    onBack={() => setSelectedSurah(null)}
                    arabicFontSize={arabicFontSize}
                    addBookmark={addBookmark}
                    removeBookmark={removeBookmark}
                    isBookmarked={isBookmarked}
                    showToast={showToast}
                  />
                ) : (
                  <SurahList onSelectSurah={(n) => { setSelectedSurah(n); }} />
                )}
              </TabErrorBoundary>
            )}
            {activeTab === 'daily' && (
              <TabErrorBoundary>
                <DailyMotivation
                  addBookmark={addBookmark}
                  isBookmarked={isBookmarked}
                  showToast={showToast}
                  arabicFontSize={arabicFontSize}
                  onNavigateToListen={navigateToListen}
                />
              </TabErrorBoundary>
            )}
            {activeTab === 'duas' && (
              <TabErrorBoundary>
                <DuaCollection showToast={showToast} />
              </TabErrorBoundary>
            )}
            {activeTab === 'bookmarks' && (
              <TabErrorBoundary>
                <BookmarksView
                  bookmarks={bookmarks}
                  onRemove={removeBookmark}
                  onSelect={navigateToSurah}
                  showToast={showToast}
                  arabicFontSize={arabicFontSize}
                />
              </TabErrorBoundary>
            )}
            {activeTab === 'settings' && (
              <TabErrorBoundary>
                <SettingsView
                  isDark={isDark}
                  toggleTheme={toggleTheme}
                  arabicFontSize={arabicFontSize}
                  changeFontSize={changeFontSize}
                />
              </TabErrorBoundary>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mini Player (persistent across tabs) */}
      {globalPlayer && activeTab !== 'listen' && (
        <MiniPlayer
          globalPlayer={globalPlayer}
          globalAudioRef={globalAudioRef}
          setGlobalPlayer={setGlobalPlayer}
          playerMeta={playerMeta}
        />
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && installPrompt && !installDismissed && (
        <div className="fixed bottom-16 left-0 right-0 z-50 p-3 safe-area-bottom install-banner-animate">
          <div className="max-w-lg mx-auto bg-white dark:bg-[#162118] rounded-2xl shadow-xl border border-[#E5E1D8] dark:border-[#2D3E34] p-4 flex items-center gap-3">
            <img src="/icon-192.png" alt="Wird" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0D4B3C] dark:text-[#C8A951]">Install Wird</p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] truncate">Add to home screen for the best experience</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={dismissInstall}
                className="px-3 py-2 text-xs text-[#6B7280] dark:text-[#9CA3AF] rounded-lg hover:bg-[#F0EDE4] dark:hover:bg-[#1E2E24]"
              >
                Later
              </button>
              <button
                onClick={handleInstall}
                className="px-4 py-2 text-xs font-semibold bg-[#0D4B3C] text-white rounded-lg hover:bg-[#0D4B3C]/90 active:scale-95 transition-all"
              >
                Install
              </button>
            </div>
          </div>
        </div>
      )}

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
  setActiveTab: (tab: 'quran' | 'listen' | 'daily' | 'duas' | 'bookmarks' | 'settings') => void;
  setSelectedSurah: (n: number | null) => void;
  isDark: boolean;
  toggleTheme: () => void;
}) {
  const tabs = [
    { id: 'quran' as const, label: 'Quran', icon: BookOpen },
    { id: 'listen' as const, label: 'Listen', icon: Headphones },
    { id: 'daily' as const, label: 'My Space', icon: Sparkles },
    { id: 'duas' as const, label: 'Duas', icon: HandHeart },
    { id: 'bookmarks' as const, label: 'Bookmarks', icon: Bookmark },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0D4B3C]/95 dark:bg-[#0A1510]/95 backdrop-blur-md border-b border-[#C8A951]/20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Top Row */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="Wird" className="w-9 h-9 rounded-lg object-cover shadow-sm" />
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">ورد</h1>
              <p className="text-[10px] text-[#C8A951]/80 -mt-1 font-medium tracking-wider uppercase">Wird</p>
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
  setActiveTab: (tab: 'quran' | 'listen' | 'daily' | 'duas' | 'bookmarks' | 'settings') => void;
  setSelectedSurah: (n: number | null) => void;
}) {
  const tabs = [
    { id: 'quran' as const, label: 'Quran', icon: BookOpen },
    { id: 'listen' as const, label: 'Listen', icon: Headphones },
    { id: 'daily' as const, label: 'My Space', icon: Sparkles },
    { id: 'duas' as const, label: 'Duas', icon: HandHeart },
    { id: 'bookmarks' as const, label: 'Saved', icon: Bookmark },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#162118] border-t border-[#E5E1D8] dark:border-[#2D3E34]">
      <div className="flex items-center justify-around h-16 safe-area-bottom">
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[3.5rem] min-h-[44px] ${
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
  onBack,
  arabicFontSize,
  addBookmark,
  removeBookmark,
  isBookmarked,
  showToast,
}: {
  surahNumber: number;
  onBack: () => void;
  arabicFontSize: string;
  addBookmark: (b: BookmarkItem) => void;
  removeBookmark: (s: number, a: number) => void;
  isBookmarked: (s: number, a: number) => boolean;
  showToast: (msg: string) => void;
}) {
  const [arabicVerses, setArabicVerses] = useState<AyahFull[]>([]);
  const [englishVerses, setEnglishVerses] = useState<AyahTranslation[]>([]);
  const [banglaVerses, setBanglaVerses] = useState<AyahTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surahInfo, setSurahInfo] = useState<SurahInfo | null>(null);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0].id);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Fetch verses (Arabic, English, Bangla)
  useEffect(() => {
    let cancelled = false;
    async function fetchVerses() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,bn.bengali`);
        if (!res.ok) throw new Error('Failed to fetch verses');
        const data = await res.json();
        if (!cancelled && data.code === 200 && Array.isArray(data.data)) {
          setArabicVerses(data.data[0].ayahs);
          setEnglishVerses(data.data[1].ayahs);
          setBanglaVerses(data.data[2].ayahs);
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

  // Play/pause ayah audio
  const playAyah = useCallback((ayahAbsoluteNumber: number) => {
    if (playingAyah === ayahAbsoluteNumber) {
      // Toggle: pause and stop
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingAyah(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(
      `https://cdn.islamic.network/quran/audio/128/${selectedReciter}/${ayahAbsoluteNumber}.mp3`
    );
    audioRef.current = audio;
    setPlayingAyah(ayahAbsoluteNumber);

    audio.play().catch(() => {
      setPlayingAyah(null);
    });

    audio.onended = () => {
      setPlayingAyah(null);
      audioRef.current = null;
    };
  }, [playingAyah, selectedReciter]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
              {islamifyNames(surahInfo?.englishNameTranslation ?? '')} • {surahInfo?.numberOfAyahs || arabicVerses.length} Verses • {surahInfo?.revelationType ?? ''}
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

      {/* Reciter Selector */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <Volume2 className="w-4 h-4 text-[#C8A951]" />
        <select
          value={selectedReciter}
          onChange={(e) => {
            setSelectedReciter(e.target.value);
            if (audioRef.current) { audioRef.current.pause(); setPlayingAyah(null); }
          }}
          className="text-sm bg-white dark:bg-[#162118] border border-[#E5E1D8] dark:border-[#2D3E34] rounded-lg px-3 py-1.5 text-[#1A1A2E] dark:text-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
        >
          {RECITERS.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      {/* Full Text View */}
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
                    {/* Play/Pause button */}
                    <button
                      onClick={() => playAyah(ayah.number)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
                        playingAyah === ayah.number
                          ? 'bg-[#C8A951]/20 text-[#C8A951] animate-pulse'
                          : 'text-[#9CA3AF] hover:text-[#C8A951] hover:bg-[#C8A951]/10'
                      }`}
                      aria-label={playingAyah === ayah.number ? 'Pause recitation' : 'Play recitation'}
                    >
                      {playingAyah === ayah.number ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
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

                {/* English Translation */}
                <Separator className="mb-3" />
                <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed">
                  {islamifyNames(englishVerses[idx]?.text)}
                </p>

                {/* Bangla Translation */}
                {banglaVerses[idx]?.text && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-[#0D4B3C]/5 text-[#0D4B3C] dark:bg-[#C8A951]/10 dark:text-[#C8A951] mb-1.5">
                      বাংলা
                    </Badge>
                    <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed">
                      {banglaVerses[idx].text}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}


// ─── Continuous Player ──────────────────────────────────────

// Pre-computed surah ayah start numbers (absolute ayah number of first ayah in each surah)
const SURAH_AYAH_STARTS: number[] = [
  1, 8, 294, 494, 670, 790, 955, 1161, 1236, 1365,
  1474, 1597, 1708, 1751, 1803, 1902, 2030, 2141, 2251, 2349,
  2484, 2596, 2674, 2792, 2856, 2933, 3160, 3253, 3341, 3410,
  3470, 3504, 3534, 3607, 3661, 3706, 3789, 3971, 4059, 4134,
  4219, 4273, 4326, 4415, 4474, 4511, 4546, 4584, 4613, 4631,
  4676, 4736, 4785, 4847, 4902, 4980, 5076, 5105, 5127, 5151,
  5164, 5178, 5189, 5200, 5218, 5230, 5242, 5272, 5324, 5376,
  5420, 5448, 5476, 5496, 5552, 5592, 5623, 5673, 5713, 5759,
  5801, 5830, 5849, 5885, 5910, 5932, 5949, 5968, 5994, 6024,
  6044, 6059, 6080, 6091, 6099, 6107, 6126, 6131, 6139, 6147,
  6158, 6169, 6177, 6180, 6189, 6194, 6198, 6205, 6208, 6214,
  6217, 6222, 6226, 6231,
];

function getSurahForAyah(ayahAbsolute: number, surahList: SurahInfo[]): { surahNumber: number; ayahInSurah: number } {
  for (let i = surahList.length - 1; i >= 0; i--) {
    if (ayahAbsolute >= SURAH_AYAH_STARTS[i]) {
      return {
        surahNumber: i + 1,
        ayahInSurah: ayahAbsolute - SURAH_AYAH_STARTS[i] + 1,
      };
    }
  }
  return { surahNumber: 1, ayahInSurah: 1 };
}

function ContinuousPlayer({
  globalPlayer,
  setGlobalPlayer,
  globalAudioRef,
  playerMeta,
  setPlayerMeta,
  showToast,
  autoPlaySurah,
  onAutoPlayConsumed,
}: {
  globalPlayer: {
    isPlaying: boolean;
    currentSurah: number;
    currentAyah: number;
    reciterId: string;
    reciterName: string;
    surahName: string;
    surahNameAr: string;
    totalInSurah: number;
  } | null;
  setGlobalPlayer: React.Dispatch<React.SetStateAction<{
    isPlaying: boolean;
    currentSurah: number;
    currentAyah: number;
    reciterId: string;
    reciterName: string;
    surahName: string;
    surahNameAr: string;
    totalInSurah: number;
  } | null>>;
  globalAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  playerMeta: { startSurah: number; endSurah: number; surahList: SurahInfo[] } | null;
  setPlayerMeta: React.Dispatch<React.SetStateAction<{ startSurah: number; endSurah: number; surahList: SurahInfo[] } | null>>;
  showToast: (msg: string) => void;
  autoPlaySurah: number | null;
  onAutoPlayConsumed: () => void;
}) {
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  const [playMode, setPlayMode] = useState<'single' | 'range' | 'all'>('single');
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(114);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahAbsolute, setCurrentAyahAbsolute] = useState(0);
  const [playlist, setPlaylist] = useState<number[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const volumeRef = useRef(1.0);
  volumeRef.current = volume;

  // Caption state
  const [captionLanguage, setCaptionLanguage] = useState<'arabic' | 'english' | 'bangla'>('arabic');
  const [captionTexts, setCaptionTexts] = useState({ arabic: '', english: '', bangla: '' });
  const [captionKey, setCaptionKey] = useState('');
  const surahVersesRef = useRef<Record<number, { arabic: string[]; english: string[]; bangla: string[] }>>({});
  const lastCaptionSurahRef = useRef(0);
  const selectedReciterRef = useRef(selectedReciter);
  selectedReciterRef.current = selectedReciter;

  const playlistRef = useRef<number[]>([]);
  const trackIndexRef = useRef(0);
  const [surahSearch, setSurahSearch] = useState('');
  const autoPlaySurahRef = useRef<number | null>(null);
  autoPlaySurahRef.current = autoPlaySurah;
  const startPlayingRef = useRef<((trackIndex?: number) => void) | null>(null);

  // Sync isPlaying from globalPlayer on mount (handles tab-switch remount)
  useEffect(() => {
    if (globalPlayer?.isPlaying) {
      setIsPlaying(true);
    }
  }, []);

  // Fetch surah list
  useEffect(() => {
    let cancelled = false;
    async function fetchSurahs() {
      try {
        setLoading(true);
        const res = await fetch(SURAH_LIST_URL);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (!cancelled) setSurahs(data.data);
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSurahs();
    return () => { cancelled = true; };
  }, []);

  // Fetch verses for caption display when current surah changes during playback
  useEffect(() => {
    if (!isPlaying || currentAyahAbsolute <= 0 || surahs.length === 0) return;
    const { surahNumber } = getSurahForAyah(currentAyahAbsolute, surahs);
    if (surahNumber === lastCaptionSurahRef.current) return;
    lastCaptionSurahRef.current = surahNumber;

    let cancelled = false;
    fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih,bn.bengali`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.code === 200 && Array.isArray(data.data)) {
          const fetched = {
            arabic: data.data[0].ayahs.map((a: { text: string }) => a.text),
            english: data.data[1].ayahs.map((a: { text: string }) => islamifyNames(a.text)),
            bangla: data.data[2].ayahs.map((a: { text: string }) => a.text),
          };
          surahVersesRef.current[surahNumber] = fetched;
          const { ayahInSurah } = getSurahForAyah(currentAyahAbsolute, surahs);
          const idx = ayahInSurah - 1;
          setCaptionTexts({
            arabic: fetched.arabic[idx] || '',
            english: fetched.english[idx] || '',
            bangla: fetched.bangla[idx] || '',
          });
          setCaptionKey(`${surahNumber}:${ayahInSurah}`);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [isPlaying, currentAyahAbsolute, surahs]);

  // Build playlist
  const buildPlaylist = useCallback((start: number, end: number) => {
    const tracks: number[] = [];
    for (let s = start; s <= end; s++) {
      const sIdx = s - 1;
      const startAyah = SURAH_AYAH_STARTS[sIdx];
      const count = surahs[sIdx]?.numberOfAyahs || 1;
      for (let a = 0; a < count; a++) {
        tracks.push(startAyah + a);
      }
    }
    return tracks;
  }, [surahs]);

  const startPlaying = useCallback((trackIndex?: number) => {
    if (surahs.length === 0) return;

    let startS = selectedSurah;
    let endS = selectedSurah;
    if (playMode === 'range') {
      startS = rangeStart;
      endS = rangeEnd;
    } else if (playMode === 'all') {
      startS = 1;
      endS = 114;
    }

    const tracks = buildPlaylist(startS, endS);
    if (tracks.length === 0) return;

    playlistRef.current = tracks;
    setPlaylist(tracks);

    const idx = trackIndex ?? 0;
    trackIndexRef.current = idx;
    setCurrentTrackIndex(idx);

    const ayahAbs = tracks[idx];
    setCurrentAyahAbsolute(ayahAbs);

    const { surahNumber, ayahInSurah } = getSurahForAyah(ayahAbs, surahs);
    const surahInfo = surahs[surahNumber - 1];
    const totalAyahs = surahInfo?.numberOfAyahs || 1;

    // Update caption text for current ayah
    const cache = surahVersesRef.current[surahNumber];
    const aIdx = ayahInSurah - 1;
    if (cache) {
      setCaptionTexts({
        arabic: cache.arabic[aIdx] || '',
        english: cache.english[aIdx] || '',
        bangla: cache.bangla[aIdx] || '',
      });
    }
    setCaptionKey(`${surahNumber}:${ayahInSurah}`);

    setPlayerMeta({ startSurah: startS, endSurah: endS, surahList: surahs });
    setIsPlaying(true);
    setGlobalPlayer({
      isPlaying: true,
      currentSurah: surahNumber,
      currentAyah: ayahInSurah,
      reciterId: selectedReciter.id,
      reciterName: selectedReciter.name,
      surahName: surahInfo?.englishName || `Surah ${surahNumber}`,
      surahNameAr: surahInfo?.name || '',
      totalInSurah: totalAyahs,
    });

    // Play audio — clean up old audio handlers first
    if (globalAudioRef.current) {
      globalAudioRef.current.onended = null;
      globalAudioRef.current.ontimeupdate = null;
      globalAudioRef.current.onerror = null;
      globalAudioRef.current.pause();
      globalAudioRef.current = null;
    }

    const audio = new Audio(
      `https://cdn.islamic.network/quran/audio/128/${selectedReciter.id}/${ayahAbs}.mp3`
    );
    audio.volume = volumeRef.current;
    globalAudioRef.current = audio;

    audio.play().catch(() => {
      showToast('Audio playback failed. Trying next verse...');
      if (trackIndexRef.current < playlistRef.current.length - 1) {
        setTimeout(() => startPlayingRef.current?.(trackIndexRef.current + 1), 300);
      } else {
        setIsPlaying(false);
        setGlobalPlayer(prev => prev ? { ...prev, isPlaying: false } : null);
      }
    });

    audio.onerror = () => {
      showToast('Audio failed to load. Skipping...');
      if (trackIndexRef.current < playlistRef.current.length - 1) {
        setTimeout(() => startPlayingRef.current?.(trackIndexRef.current + 1), 300);
      } else {
        setIsPlaying(false);
        setGlobalPlayer(prev => prev ? { ...prev, isPlaying: false } : null);
      }
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setProgress(0);
      if (trackIndexRef.current < playlistRef.current.length - 1) {
        trackIndexRef.current++;
        const nextAyah = playlistRef.current[trackIndexRef.current];
        setCurrentAyahAbsolute(nextAyah);
        setCurrentTrackIndex(trackIndexRef.current);

        const { surahNumber: sn, ayahInSurah: ai } = getSurahForAyah(nextAyah, surahs);
        const si = surahs[sn - 1];

        // Update caption for next ayah
        const nextCache = surahVersesRef.current[sn];
        const nIdx = ai - 1;
        if (nextCache) {
          setCaptionTexts({
            arabic: nextCache.arabic[nIdx] || '',
            english: nextCache.english[nIdx] || '',
            bangla: nextCache.bangla[nIdx] || '',
          });
        }
        setCaptionKey(`${sn}:${ai}`);

        setGlobalPlayer(prev => prev ? {
          ...prev,
          currentSurah: sn,
          currentAyah: ai,
          surahName: si?.englishName || `Surah ${sn}`,
          surahNameAr: si?.name || '',
          totalInSurah: si?.numberOfAyahs || 1,
        } : null);

        const reciterToUse = selectedReciterRef.current.id;
        const nextAudio = new Audio(
          `https://cdn.islamic.network/quran/audio/128/${reciterToUse}/${nextAyah}.mp3`
        );
        nextAudio.volume = volumeRef.current;
        globalAudioRef.current = nextAudio;
        nextAudio.play().catch(() => {});
        nextAudio.ontimeupdate = () => {
          if (nextAudio.duration) {
            setProgress((nextAudio.currentTime / nextAudio.duration) * 100);
          }
        };
        nextAudio.onended = () => {
          setProgress(0);
          if (trackIndexRef.current < playlistRef.current.length - 1) {
            trackIndexRef.current++;
            nextAudio.onended = null;
            startPlayingRef.current?.(trackIndexRef.current);
          } else {
            setIsPlaying(false);
            setGlobalPlayer(prev => prev ? { ...prev, isPlaying: false } : null);
            showToast('Recitation completed');
          }
        };
        nextAudio.onerror = () => {
          showToast('Audio failed. Skipping...');
          if (trackIndexRef.current < playlistRef.current.length - 1) {
            trackIndexRef.current++;
            nextAudio.onended = null;
            startPlayingRef.current?.(trackIndexRef.current);
          } else {
            setIsPlaying(false);
            setGlobalPlayer(prev => prev ? { ...prev, isPlaying: false } : null);
          }
        };
      } else {
        setIsPlaying(false);
        setGlobalPlayer(prev => prev ? { ...prev, isPlaying: false } : null);
        showToast('Recitation completed');
      }
    };
  }, [surahs, selectedReciter, selectedSurah, playMode, rangeStart, rangeEnd, buildPlaylist, setGlobalPlayer, setPlayerMeta, showToast, globalAudioRef]);

  // Keep startPlayingRef updated (used by error/end handlers to avoid stale closures)
  useEffect(() => {
    startPlayingRef.current = startPlaying;
  }, [startPlaying]);

  // Auto-play when navigated from My Space mood suggestion
  // Step 1: Set playMode and selectedSurah when autoPlaySurah arrives
  useEffect(() => {
    if (autoPlaySurah && surahs.length > 0 && !loading) {
      setPlayMode("single");
      setSelectedSurah(autoPlaySurah);
      // Do NOT call onAutoPlayConsumed() here — it would null out autoPlaySurah
      // before step 2 can read it
    }
  }, [autoPlaySurah, surahs.length, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: Trigger startPlaying after state settles, then consume
  useEffect(() => {
    const target = autoPlaySurahRef.current;
    if (!target || surahs.length === 0 || loading || isPlaying) return;
    if (playMode === "single" && selectedSurah === target) {
      const timer = setTimeout(() => {
        startPlaying(0);
        onAutoPlayConsumed();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedSurah, playMode, surahs.length, loading, isPlaying, startPlaying, onAutoPlayConsumed]); // eslint-disable-line react-hooks/exhaustive-deps

  const pausePlaying = useCallback(() => {
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
    }
    setIsPlaying(false);
    setGlobalPlayer(prev => prev ? { ...prev, isPlaying: false } : null);
  }, [globalAudioRef, setGlobalPlayer]);

  const resumePlaying = useCallback(() => {
    if (globalAudioRef.current && playlistRef.current.length > 0) {
      globalAudioRef.current.play().catch(() => {});
      setIsPlaying(true);
      setGlobalPlayer(prev => prev ? { ...prev, isPlaying: true } : null);
    } else {
      startPlaying(trackIndexRef.current);
    }
  }, [globalAudioRef, startPlaying, setGlobalPlayer]);

  const skipNext = useCallback(() => {
    if (trackIndexRef.current < playlistRef.current.length - 1) {
      if (globalAudioRef.current) {
        globalAudioRef.current.onended = null;
        globalAudioRef.current.ontimeupdate = null;
        globalAudioRef.current.onerror = null;
        globalAudioRef.current.pause();
      }
      startPlaying(trackIndexRef.current + 1);
    }
  }, [startPlaying, globalAudioRef]);

  const skipPrev = useCallback(() => {
    if (trackIndexRef.current > 0) {
      if (globalAudioRef.current) {
        globalAudioRef.current.onended = null;
        globalAudioRef.current.ontimeupdate = null;
        globalAudioRef.current.onerror = null;
        globalAudioRef.current.pause();
      }
      startPlaying(trackIndexRef.current - 1);
    }
  }, [startPlaying, globalAudioRef]);

  const stopPlaying = useCallback(() => {
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
      globalAudioRef.current.onended = null;
      globalAudioRef.current.ontimeupdate = null;
      globalAudioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAyahAbsolute(0);
    setProgress(0);
    playlistRef.current = [];
    trackIndexRef.current = 0;
    lastCaptionSurahRef.current = 0;
    setCaptionTexts({ arabic: '', english: '', bangla: '' });
    setCaptionKey('');
    setGlobalPlayer(null);
    setPlayerMeta(null);
  }, [globalAudioRef, setGlobalPlayer, setPlayerMeta]);

  // Cleanup on unmount — prevent stale handlers from updating unmounted component
  useEffect(() => {
    return () => {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
        globalAudioRef.current.onended = null;
        globalAudioRef.current.ontimeupdate = null;
        globalAudioRef.current.onerror = null;
        globalAudioRef.current = null;
      }
    };
  }, []);

  const effectiveStart = playMode === 'single' ? selectedSurah : playMode === 'range' ? rangeStart : 1;
  const effectiveEnd = playMode === 'single' ? selectedSurah : playMode === 'range' ? rangeEnd : 114;

  const filteredSurahs = useMemo(() => {
    if (!surahSearch.trim()) return surahs;
    const q = surahSearch.toLowerCase().trim();
    return surahs.filter(s =>
      s.number.toString() === q ||
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(q) ||
      s.revelationType.toLowerCase().includes(q)
    );
  }, [surahs, surahSearch]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#0D4B3C] to-[#1B6B52] dark:from-[#C8A951]/20 dark:to-[#C8A951]/5 flex items-center justify-center shadow-lg">
            <Headphones className="w-8 h-8 text-[#C8A951]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0D4B3C] dark:text-[#C8A951]">Quran Radio</h2>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">Listen to the Noble Quran continuously</p>
        </motion.div>
      </div>

      {/* Search Surahs */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search surahs by name, number, or type..."
              value={surahSearch}
              onChange={e => setSurahSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F0] dark:bg-[#0F1A14] border border-[#E5E1D8] dark:border-[#2D3E34] rounded-xl text-[#1A1A2E] dark:text-[#E8E0D0] placeholder-[#9CA3AF]/60 focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 transition-all"
            />
            {surahSearch && (
              <button
                onClick={() => setSurahSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {surahSearch && (
            <p className="text-[10px] text-[#9CA3AF] mt-1.5">{filteredSurahs.length} surah{filteredSurahs.length !== 1 ? 's' : ''} found</p>
          )}
        </CardContent>
      </Card>

      {/* Reciter Selector */}
      <Card className="mb-4 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#0D4B3C] via-[#C8A951] to-[#0D4B3C]" />
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-4 h-4 text-[#C8A951]" />
            <h3 className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951]">Choose Reciter</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RECITERS.map(r => (
              <motion.button
                key={r.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedReciter(r);
                  if (isPlaying) {
                    showToast(`Switched to ${r.name}. Restarting...`);
                    stopPlaying();
                  }
                }}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                  selectedReciter.id === r.id
                    ? 'border-[#C8A951] bg-[#C8A951]/5 dark:bg-[#C8A951]/10'
                    : 'border-[#E5E1D8] dark:border-[#2D3E34] hover:border-[#C8A951]/40'
                }`}
              >
                <p className="text-xs font-semibold text-[#1A1A2E] dark:text-[#E8E0D0] truncate">{r.name}</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">{r.shortName}</p>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Play Mode */}
      <Card className="mb-4 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListMusic className="w-4 h-4 text-[#C8A951]" />
            <h3 className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951]">What to Listen</h3>
          </div>
          <div className="flex gap-2 mb-4">
            {([
              { mode: 'single' as const, label: 'Single Surah', icon: BookOpen },
              { mode: 'range' as const, label: 'Surah Range', icon: SkipForward },
              { mode: 'all' as const, label: 'All 114 Surahs', icon: Repeat },
            ]).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setPlayMode(mode)}
                className={`flex-1 flex items-center justify-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all duration-200 ${
                  playMode === mode
                    ? 'border-[#C8A951] bg-[#C8A951]/5 dark:bg-[#C8A951]/10 text-[#0D4B3C] dark:text-[#C8A951]'
                    : 'border-[#E5E1D8] dark:border-[#2D3E34] text-[#6B7280] dark:text-[#9CA3AF] hover:border-[#C8A951]/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Surah Selection */}
          {playMode === 'single' && (
            <div>
              <label className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5 block">Select Surah</label>
              <select
                value={selectedSurah}
                onChange={e => setSelectedSurah(Number(e.target.value))}
                className="w-full text-sm bg-white dark:bg-[#162118] border border-[#E5E1D8] dark:border-[#2D3E34] rounded-lg px-3 py-2.5 text-[#1A1A2E] dark:text-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.englishName} ({s.name}) - {s.numberOfAyahs} verses
                  </option>
                ))}
              </select>
            </div>
          )}

          {playMode === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5 block">From Surah</label>
                <select
                  value={rangeStart}
                  onChange={e => {
                    const v = Number(e.target.value);
                    setRangeStart(v);
                    if (v > rangeEnd) setRangeEnd(v);
                  }}
                  className="w-full text-sm bg-white dark:bg-[#162118] border border-[#E5E1D8] dark:border-[#2D3E34] rounded-lg px-3 py-2.5 text-[#1A1A2E] dark:text-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
                >
                  {surahs.map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.englishName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5 block">To Surah</label>
                <select
                  value={rangeEnd}
                  onChange={e => setRangeEnd(Number(e.target.value))}
                  className="w-full text-sm bg-white dark:bg-[#162118] border border-[#E5E1D8] dark:border-[#2D3E34] rounded-lg px-3 py-2.5 text-[#1A1A2E] dark:text-[#E8E0D0] focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
                >
                  {surahs.filter(s => s.number >= rangeStart).map(s => (
                    <option key={s.number} value={s.number}>
                      {s.number}. {s.englishName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] text-center">
                  Surah {rangeStart} to {rangeEnd} ({(() => {
                    let total = 0;
                    for (let i = rangeStart; i <= rangeEnd; i++) {
                      total += surahs[i - 1]?.numberOfAyahs || 0;
                    }
                    return total;
                  })()} verses, {rangeEnd - rangeStart + 1} surahs)
                </p>
              </div>
            </div>
          )}

          {playMode === 'all' && (
            <div className="text-center py-3">
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                All 114 Surahs will play continuously from <strong className="text-[#0D4B3C] dark:text-[#C8A951]">Al-Fatihah</strong> to <strong className="text-[#0D4B3C] dark:text-[#C8A951]">An-Nas</strong>
              </p>
              <p className="text-xs text-[#9CA3AF]/60 mt-1">Total: 6,236 verses</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Now Playing */}
      {isPlaying && currentAyahAbsolute > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="overflow-hidden border-2 border-[#C8A951]/30 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-[#0D4B3C] via-[#C8A951] to-[#0D4B3C]" />
            <CardContent className="p-5">
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#E5E1D8] dark:bg-[#2D3E34] rounded-full overflow-hidden mb-5">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#C8A951] to-[#D4B96A] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Surah Info */}
              <div className="text-center mb-5">
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider mb-1">Now Reciting</p>
                <div className="flex items-center justify-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#0D4B3C] dark:text-[#C8A951]">
                      {globalPlayer?.surahName}
                    </h3>
                    <p className="font-arabic text-xl text-[#0D4B3C]/70 dark:text-[#C8A951]/70">
                      {globalPlayer?.surahNameAr}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
                  Verse {globalPlayer?.currentAyah} of {globalPlayer?.totalInSurah} • Track {currentTrackIndex + 1} of {playlist.length}
                </p>
                <p className="text-[10px] text-[#C8A951] mt-1 font-medium">
                  {selectedReciter.name}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={skipPrev}
                  className="w-12 h-12 rounded-full bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center text-[#0D4B3C] dark:text-[#C8A951] hover:bg-[#0D4B3C]/20 dark:hover:bg-[#C8A951]/20 transition-all"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={pausePlaying}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0D4B3C] to-[#1B6B52] dark:from-[#C8A951] dark:to-[#A68B3A] flex items-center justify-center text-white shadow-xl hover:shadow-2xl transition-all"
                >
                  <Pause className="w-7 h-7" />
                </button>

                <button
                  onClick={skipNext}
                  className="w-12 h-12 rounded-full bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center text-[#0D4B3C] dark:text-[#C8A951] hover:bg-[#0D4B3C]/20 dark:hover:bg-[#C8A951]/20 transition-all"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Stop Button */}
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopPlaying}
                  className="gap-1.5 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 text-xs"
                >
                  <Square className="w-3 h-3" />
                  Stop
                </Button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 mt-4 px-2">
                <button
                  onClick={() => {
                    const newVol = volume === 0 ? 1 : 0;
                    setVolume(newVol);
                    if (globalAudioRef.current) globalAudioRef.current.volume = newVol;
                  }}
                  className="text-[#C8A951] flex-shrink-0"
                >
                  {volume === 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (globalAudioRef.current) globalAudioRef.current.volume = v;
                  }}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#C8A951] bg-[#E5E1D8] dark:bg-[#2D3E34]"
                />
                <span className="text-[10px] text-[#9CA3AF] w-7 text-right flex-shrink-0">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Caption Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <Card className="mt-3 overflow-hidden border border-[#C8A951]/20 bg-gradient-to-b from-[#FAFAF5] to-white dark:from-[#162118] dark:to-[#0F1A14]">
              <div className="h-px bg-gradient-to-r from-transparent via-[#C8A951]/40 to-transparent" />
              <CardContent className="p-5">
                {/* Language Selector */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  <Globe className="w-3.5 h-3.5 text-[#C8A951] mr-1" />
                  {(['arabic', 'english', 'bangla'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setCaptionLanguage(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        captionLanguage === lang
                          ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C] shadow-sm'
                          : 'bg-[#E5E1D8]/50 dark:bg-[#2D3E34]/50 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E1D8] dark:hover:bg-[#2D3E34]'
                      }`}
                    >
                      {lang === 'arabic' ? 'عربي' : lang === 'english' ? 'English' : 'বাংলা'}
                    </button>
                  ))}
                </div>

                {/* Animated Caption Text */}
                <div className="min-h-[80px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={captionKey}
                      initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="w-full text-center px-2"
                    >
                      {captionLanguage === 'arabic' ? (
                        <div dir="rtl" lang="ar">
                          <p className="font-arabic text-2xl text-[#0D4B3C] dark:text-[#E8E0D0] leading-[2]">
                            {captionTexts.arabic}
                          </p>
                        </div>
                      ) : captionLanguage === 'english' ? (
                        <p className="text-base text-[#4A5568] dark:text-[#B0B8C0] leading-relaxed italic">
                          &ldquo;{captionTexts.english}&rdquo;
                        </p>
                      ) : (
                        <p className="text-base text-[#4A5568] dark:text-[#B0B8C0] leading-relaxed">
                          {captionTexts.bangla}
                        </p>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Ayah indicator */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="verse-badge text-[10px]">{globalPlayer?.currentAyah ? formatAyahNumber(globalPlayer.currentAyah) : ''}</div>
                  <p className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280]">
                    {globalPlayer?.surahName} • Verse {globalPlayer?.currentAyah} of {globalPlayer?.totalInSurah}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Play Button */}
      {!isPlaying && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button
            onClick={() => startPlaying(0)}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#0D4B3C] via-[#145A48] to-[#1B6B52] dark:from-[#C8A951] dark:via-[#D4B96A] dark:to-[#C8A951] text-white dark:text-[#0D4B3C] font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 group"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Play className="w-6 h-6 ml-1" />
            </motion.div>
            {playMode === 'single'
              ? `Play Surah ${surahs[selectedSurah - 1]?.englishName}`
              : playMode === 'range'
                ? `Play Surah ${rangeStart} to ${rangeEnd}`
                : 'Play All 114 Surahs'
            }
            <span className="text-xs opacity-70 font-normal">• {selectedReciter.shortName}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Mini Player (persistent across tabs) ──────────────────

function MiniPlayer({
  globalPlayer,
  globalAudioRef,
  setGlobalPlayer,
  playerMeta,
}: {
  globalPlayer: {
    isPlaying: boolean;
    currentSurah: number;
    currentAyah: number;
    reciterId: string;
    reciterName: string;
    surahName: string;
    surahNameAr: string;
    totalInSurah: number;
  };
  globalAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  setGlobalPlayer: React.Dispatch<React.SetStateAction<{
    isPlaying: boolean;
    currentSurah: number;
    currentAyah: number;
    reciterId: string;
    reciterName: string;
    surahName: string;
    surahNameAr: string;
    totalInSurah: number;
  } | null>>;
  playerMeta: { startSurah: number; endSurah: number; surahList: SurahInfo[] } | null;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = globalAudioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, [globalAudioRef, globalPlayer?.currentAyah]);

  const togglePlay = () => {
    const audio = globalAudioRef.current;
    if (!audio) return;

    if (globalPlayer.isPlaying) {
      audio.pause();
      setGlobalPlayer(prev => prev ? { ...prev, isPlaying: false } : null);
    } else {
      audio.play().catch(() => {});
      setGlobalPlayer(prev => prev ? { ...prev, isPlaying: true } : null);
    }
  };

  const skipNext = () => {
    const audio = globalAudioRef.current;
    if (!audio || !playerMeta) return;

    const { surahList } = playerMeta;
    const currentSurahIdx = surahList.findIndex(s => s.number === globalPlayer.currentSurah);
    if (currentSurahIdx < 0) return;

    const currentSurah = surahList[currentSurahIdx];
    const currentStartAyah = SURAH_AYAH_STARTS[currentSurahIdx];
    const currentAbsolute = currentStartAyah + globalPlayer.currentAyah - 1;

    // Check if there's a next surah in range
    const nextSurahIdx = globalPlayer.currentAyah >= currentSurah.numberOfAyahs
      ? currentSurahIdx + 1
      : currentSurahIdx;
    const nextAyahInSurah = globalPlayer.currentAyah >= currentSurah.numberOfAyahs
      ? 1
      : globalPlayer.currentAyah + 1;

    if (nextSurahIdx < surahList.length && surahList[nextSurahIdx].number <= playerMeta.endSurah) {
      const nextSurah = surahList[nextSurahIdx];
      const nextAbsolute = SURAH_AYAH_STARTS[nextSurahIdx] + nextAyahInSurah - 1;

      audio.pause();
      audio.onended = null;
      audio.ontimeupdate = null;

      const nextAudio = new Audio(
        `https://cdn.islamic.network/quran/audio/128/${globalPlayer.reciterId}/${nextAbsolute}.mp3`
      );
      nextAudio.volume = 1.0;
      globalAudioRef.current = nextAudio;
      nextAudio.play().catch(() => {});

      setGlobalPlayer({
        ...globalPlayer,
        isPlaying: true,
        currentSurah: nextSurah.number,
        currentAyah: nextAyahInSurah,
        surahName: nextSurah.englishName,
        surahNameAr: nextSurah.name,
        totalInSurah: nextSurah.numberOfAyahs,
      });
      setProgress(0);
    }
  };

  const skipPrev = () => {
    const audio = globalAudioRef.current;
    if (!audio || !playerMeta) return;

    const { surahList } = playerMeta;
    const currentSurahIdx = surahList.findIndex(s => s.number === globalPlayer.currentSurah);
    if (currentSurahIdx < 0) return;

    let prevAyahInSurah = globalPlayer.currentAyah - 1;
    let prevSurahIdx = currentSurahIdx;

    if (prevAyahInSurah < 1) {
      if (prevSurahIdx > 0) {
        prevSurahIdx--;
        prevAyahInSurah = surahList[prevSurahIdx].numberOfAyahs;
      } else {
        prevAyahInSurah = 1;
      }
    }

    if (surahList[prevSurahIdx].number >= playerMeta.startSurah) {
      const prevSurah = surahList[prevSurahIdx];
      const prevAbsolute = SURAH_AYAH_STARTS[prevSurahIdx] + prevAyahInSurah - 1;

      audio.pause();
      audio.onended = null;
      audio.ontimeupdate = null;

      const prevAudio = new Audio(
        `https://cdn.islamic.network/quran/audio/128/${globalPlayer.reciterId}/${prevAbsolute}.mp3`
      );
      prevAudio.volume = 1.0;
      globalAudioRef.current = prevAudio;
      prevAudio.play().catch(() => {});

      setGlobalPlayer({
        ...globalPlayer,
        isPlaying: true,
        currentSurah: prevSurah.number,
        currentAyah: prevAyahInSurah,
        surahName: prevSurah.englishName,
        surahNameAr: prevSurah.name,
        totalInSurah: prevSurah.numberOfAyahs,
      });
      setProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-white dark:bg-[#1a2420] border-t border-[#C8A951]/20 shadow-2xl"
    >
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#E5E1D8] dark:bg-[#2D3E34]">
        <div className="h-full bg-gradient-to-r from-[#0D4B3C] to-[#C8A951] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Surah Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951] truncate">
            {globalPlayer.surahName}
          </p>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Verse {globalPlayer.currentAyah} of {globalPlayer.totalInSurah} • {globalPlayer.reciterName.split('(')[0].trim()}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={skipPrev}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#0D4B3C] dark:text-[#C8A951] hover:bg-[#0D4B3C]/10 dark:hover:bg-[#C8A951]/10 transition-all"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all ${
              globalPlayer.isPlaying
                ? 'bg-[#C8A951] text-white'
                : 'bg-[#0D4B3C] dark:bg-[#C8A951] text-white'
            }`}
          >
            {globalPlayer.isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={skipNext}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#0D4B3C] dark:text-[#C8A951] hover:bg-[#0D4B3C]/10 dark:hover:bg-[#C8A951]/10 transition-all"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}


// ─── Mood Quiz Types & Data ────────────────────────────────

type MoodCategory = 'sad' | 'anxious' | 'angry' | 'grateful' | 'lonely' | 'stressed' | 'hopeful' | 'seeking' | 'peaceful' | 'repentant';

interface MoodQuestion {
  id: number;
  question: string;
  options: {
    label: string;
    moodTags: MoodCategory[];
  }[];
}

interface MoodQuote {
  textAr: string;
  textEn: string;
  source: string;
  type: 'quran' | 'hadith';
  reference: string;
}

interface MoodProfile {
  primaryMood: MoodCategory;
  secondaryMoods: MoodCategory[];
  quotes: MoodQuote[];
  duaAr: string;
  duaEn: string;
  message: string;
  title: string;
}

const MOOD_LABELS: Record<MoodCategory, { label: string; icon: string; color: string }> = {
  sad: { label: 'Seeking Comfort', icon: 'broken-heart', color: '#6366F1' },
  anxious: { label: 'Finding Peace', icon: 'wind', color: '#8B5CF6' },
  angry: { label: 'Needing Patience', icon: 'flame', color: '#EF4444' },
  grateful: { label: 'Feeling Grateful', icon: 'sun', color: '#F59E0B' },
  lonely: { label: 'Seeking Connection', icon: 'cloud', color: '#64748B' },
  stressed: { label: 'Under Pressure', icon: 'zap', color: '#F97316' },
  hopeful: { label: 'Full of Hope', icon: 'sparkles', color: '#10B981' },
  seeking: { label: 'Seeking Guidance', icon: 'compass', color: '#3B82F6' },
  peaceful: { label: 'At Peace', icon: 'leaf', color: '#059669' },
  repentant: { label: 'Returning to Allah', icon: 'heart', color: '#EC4899' },
};

const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    id: 1,
    question: 'How would you describe your overall mood right now?',
    options: [
      { label: 'Feeling down or heavy-hearted', moodTags: ['sad', 'lonely'] },
      { label: 'Worried or uneasy about something', moodTags: ['anxious', 'stressed'] },
      { label: 'Frustrated or upset about a situation', moodTags: ['angry', 'stressed'] },
      { label: 'Calm, content, and at ease', moodTags: ['peaceful', 'grateful'] },
    ],
  },
  {
    id: 2,
    question: 'How has your relationship with Allah felt lately?',
    options: [
      { label: 'Distant — I feel disconnected from my faith', moodTags: ['lonely', 'repentant', 'seeking'] },
      { label: 'I want to improve but feel stuck in bad habits', moodTags: ['repentant', 'stressed'] },
      { label: 'Close — I feel grateful for His blessings', moodTags: ['grateful', 'peaceful', 'hopeful'] },
      { label: 'I am actively seeking to grow spiritually', moodTags: ['seeking', 'hopeful'] },
    ],
  },
  {
    id: 3,
    question: 'Are you currently facing any challenges in your life?',
    options: [
      { label: 'Emotional pain — grief, heartbreak, or loss', moodTags: ['sad', 'lonely'] },
      { label: 'Financial or career difficulties', moodTags: ['stressed', 'anxious'] },
      { label: 'Relationship or family conflicts', moodTags: ['angry', 'sad'] },
      { label: 'No major challenges — life is going well', moodTags: ['grateful', 'peaceful', 'hopeful'] },
    ],
  },
  {
    id: 4,
    question: 'How is your Salah (prayer) routine these days?',
    options: [
      { label: 'I have been missing prayers and feel guilty about it', moodTags: ['repentant', 'sad'] },
      { label: 'I pray but my mind often wanders — I feel distracted', moodTags: ['anxious', 'seeking'] },
      { label: 'I am trying to be more consistent and mindful', moodTags: ['hopeful', 'seeking'] },
      { label: 'Alhamdulillah, I pray regularly and find peace in it', moodTags: ['peaceful', 'grateful'] },
    ],
  },
  {
    id: 5,
    question: 'What area of your life needs the most support right now?',
    options: [
      { label: 'My mental health and emotional well-being', moodTags: ['sad', 'anxious', 'stressed'] },
      { label: 'My faith — I want to feel closer to Allah', moodTags: ['seeking', 'repentant', 'lonely'] },
      { label: 'My relationships with family or friends', moodTags: ['angry', 'lonely'] },
      { label: 'Finding purpose and direction in life', moodTags: ['seeking', 'hopeful'] },
    ],
  },
  {
    id: 6,
    question: 'How connected do you feel to the people around you?',
    options: [
      { label: 'Very isolated — I feel like no one understands me', moodTags: ['lonely', 'sad'] },
      { label: 'There is tension or conflict in my relationships', moodTags: ['angry', 'stressed'] },
      { label: 'I have people around me but I still feel a void inside', moodTags: ['lonely', 'seeking'] },
      { label: 'Surrounded by supportive people — I feel blessed', moodTags: ['grateful', 'peaceful'] },
    ],
  },
  {
    id: 7,
    question: 'What would help you the most right now?',
    options: [
      { label: 'Comfort and reassurance that things will get better', moodTags: ['sad', 'hopeful'] },
      { label: 'Strength to be patient with my situation', moodTags: ['angry', 'stressed'] },
      { label: 'Forgiveness and a fresh start', moodTags: ['repentant', 'anxious'] },
      { label: 'Gratitude and appreciation for what I already have', moodTags: ['grateful', 'peaceful'] },
    ],
  },
];

const MOOD_QUOTES: Record<MoodCategory, MoodQuote[]> = {
  sad: [
    {
      textAr: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ',
      textEn: 'Do not lose heart or grieve, for you will have the upper hand, if you are believers.',
      source: 'Surah Ali Imran 3:139',
      type: 'quran',
      reference: '3:139',
    },
    {
      textAr: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      textEn: 'Indeed, with hardship comes ease.',
      source: 'Surah Ash-Sharh 94:6',
      type: 'quran',
      reference: '94:6',
    },
    {
      textAr: 'وَبَشِّرِ الصَّابِرِينَ الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ',
      textEn: 'And give good tidings to those who are patient, who, when disaster strikes them, say, "Indeed we belong to Allah, and indeed to Him we return."',
      source: 'Surah Al-Baqarah 2:155-156',
      type: 'quran',
      reference: '2:155-156',
    },
    {
      textAr: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      textEn: 'Allah does not burden a soul beyond that it can bear.',
      source: 'Surah Al-Baqarah 2:286',
      type: 'quran',
      reference: '2:286',
    },
    {
      textAr: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
      textEn: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah."',
      source: 'Surah Az-Zumar 39:53',
      type: 'quran',
      reference: '39:53',
    },
  ],
  anxious: [
    {
      textAr: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
      textEn: 'And whoever relies upon Allah — then He is sufficient for him.',
      source: 'Surah At-Talaq 65:3',
      type: 'quran',
      reference: '65:3',
    },
    {
      textAr: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      textEn: 'Verily, in the remembrance of Allah do hearts find rest.',
      source: 'Surah Ar-Ra\'d 13:28',
      type: 'quran',
      reference: '13:28',
    },
    {
      textAr: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ',
      textEn: 'And when My servants ask you concerning Me, indeed I am near.',
      source: 'Surah Al-Baqarah 2:186',
      type: 'quran',
      reference: '2:186',
    },
    {
      textAr: 'كُلًّا نُّمِدُّ هَٰؤُلَاءِ وَهَٰؤُلَاءِ مِنْ عَطَاءِ رَبِّكَ وَمَا كَانَ عَطَاءُ رَبِّكَ مَحْظُورًا',
      textEn: 'These — We extend to them from Our bounty — these and others, and there is no restriction on the bounty of your Lord.',
      source: 'Surah Al-Isra 17:20',
      type: 'quran',
      reference: '17:20',
    },
    {
      textAr: 'The Prophet (PBUH) said: "If you put your trust completely in Allah, He would provide for you as He provides for the birds. They go out in the morning empty and return in the evening full."',
      textEn: 'If you put your trust completely in Allah, He would provide for you as He provides for the birds. They go out in the morning empty and return in the evening full.',
      source: 'Sunan at-Tirmidhi 2344',
      type: 'hadith',
      reference: 'Tirmidhi 2344',
    },
  ],
  angry: [
    {
      textAr: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ ۗ وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ',
      textEn: 'And those who restrain anger and who pardon the people — and Allah loves the doers of good.',
      source: 'Surah Ali Imran 3:134',
      type: 'quran',
      reference: '3:134',
    },
    {
      textAr: 'وَلَمَن صَبَرَ وَغَفَرَ ذَٰلِكَ لَمِنْ عَزْمِ الْأُمُورِ',
      textEn: 'But indeed, whoever is patient and forgives — that is a sign of determination and resolve.',
      source: 'Surah Ash-Shura 42:43',
      type: 'quran',
      reference: '42:43',
    },
    {
      textAr: 'وَاسْتَحْيُوا مِنَ اللَّهِ حَقَّ حَيَائِهِ',
      textEn: 'The strong man is not the one who can overpower others. The strong man is the one who controls himself when he is angry.',
      source: 'Sahih al-Bukhari 6114',
      type: 'hadith',
      reference: 'Bukhari 6114',
    },
    {
      textAr: 'فَبِمَا رَحْمَةٍ مِّنَ اللَّهِ لِنتَ لَهُمْ ۖ وَلَوْ كُنتَ فَظًّا غَلِيظَ الْقَلْبِ لَانفَضُّوا مِنْ حَوْلِكَ',
      textEn: 'So by mercy from Allah, you were lenient with them. And if you had been rude and harsh in heart, they would have disbanded from about you.',
      source: 'Surah Ali Imran 3:159',
      type: 'quran',
      reference: '3:159',
    },
  ],
  grateful: [
    {
      textAr: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
      textEn: 'If you are grateful, I will surely give you more.',
      source: 'Surah Ibrahim 14:7',
      type: 'quran',
      reference: '14:7',
    },
    {
      textAr: 'وَإِذْ تَأَذَّنَ رَبُّكُمْ لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ وَلَئِن كَفَرْتُمْ إِنَّ عَذَابِي لَشَدِيدٌ',
      textEn: 'And remember when your Lord proclaimed, "If you are grateful, I will surely increase you; but if you deny, indeed, My punishment is severe."',
      source: 'Surah Ibrahim 14:7',
      type: 'quran',
      reference: '14:7',
    },
    {
      textAr: 'وَمَا بِكُم مِّن نِّعْمَةٍ فَمِنَ اللَّهِ',
      textEn: 'And whatever you have of blessing — it is from Allah.',
      source: 'Surah An-Nahl 16:53',
      type: 'quran',
      reference: '16:53',
    },
    {
      textAr: 'The Prophet (PBUH) said: "Look at those who are below you and do not look at those above you, for this is more deserving of not belittling the blessing of Allah upon you."',
      textEn: 'Look at those who are below you and do not look at those above you, for this is more deserving of not belittling the blessing of Allah upon you.',
      source: 'Sahih al-Bukhari 6469',
      type: 'hadith',
      reference: 'Bukhari 6469',
    },
    {
      textAr: 'هُوَ الَّذِي جَعَلَ لَكُمُ اللَّيْلَ لِتَسْكُنُوا فِيهِ وَالنَّهَارَ مُبْصِرًا ۚ إِنَّ فِي ذَٰلِكَ لَآيَاتٍ لِّقَوْمٍ يَسْمَعُونَ',
      textEn: 'It is He who made for you the night that you may rest therein and the day, giving sight. Indeed in that are signs for a people who listen.',
      source: 'Surah Yunus 10:67',
      type: 'quran',
      reference: '10:67',
    },
  ],
  lonely: [
    {
      textAr: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
      textEn: 'And We are closer to him than his jugular vein.',
      source: 'Surah Qaf 50:16',
      type: 'quran',
      reference: '50:16',
    },
    {
      textAr: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ',
      textEn: 'And He is with you wherever you are.',
      source: 'Surah Al-Hadid 57:4',
      type: 'quran',
      reference: '57:4',
    },
    {
      textAr: 'فَأَيْنَمَا تُوَلُّوا فَثَمَّ وَجْهُ اللَّهِ',
      textEn: 'So wherever you turn, there is the Face of Allah.',
      source: 'Surah Al-Baqarah 2:115',
      type: 'quran',
      reference: '2:115',
    },
    {
      textAr: 'The Prophet (PBUH) said: "The hearts of the children of Adam are all between two fingers of the Most Merciful, like one heart. He directs them wherever He wills."',
      textEn: 'The hearts of the children of Adam are all between two fingers of the Most Merciful, like one heart. He directs them wherever He wills.',
      source: 'Sahih Muslim 2654',
      type: 'hadith',
      reference: 'Muslim 2654',
    },
  ],
  stressed: [
    {
      textAr: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا إِنَّ مَعَ الْعُسْرِ يُسْرًا',
      textEn: 'For indeed, with hardship will be ease. Indeed, with hardship will be ease.',
      source: 'Surah Ash-Sharh 94:5-6',
      type: 'quran',
      reference: '94:5-6',
    },
    {
      textAr: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ',
      textEn: 'Allah does not burden a soul beyond that it can bear. It will have whatever it has earned, and it will be accountable for whatever it has earned.',
      source: 'Surah Al-Baqarah 2:286',
      type: 'quran',
      reference: '2:286',
    },
    {
      textAr: 'رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
      textEn: 'Our Lord, pour upon us patience and make us firm in our footing and help us against the disbelieving people.',
      source: 'Surah Al-Baqarah 2:250',
      type: 'quran',
      reference: '2:250',
    },
    {
      textAr: 'The Prophet (PBUH) said: "Wonderful is the affair of the believer, for his affair is all good. If something good happens to him, he is grateful for it, and that is good for him. If something bad happens to him, he bears it with patience, and that is good for him."',
      textEn: 'Wonderful is the affair of the believer, for his affair is all good. If something good happens to him, he is grateful for it, and that is good for him. If something bad happens to him, he bears it with patience, and that is good for him.',
      source: 'Sahih Muslim 2999',
      type: 'hadith',
      reference: 'Muslim 2999',
    },
    {
      textAr: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
      textEn: 'And whoever fears Allah — He will make for him a way out. And will provide for him from where he does not expect.',
      source: 'Surah At-Talaq 65:2-3',
      type: 'quran',
      reference: '65:2-3',
    },
  ],
  hopeful: [
    {
      textAr: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ',
      textEn: 'And My mercy encompasses all things.',
      source: 'Surah Al-A\'raf 7:156',
      type: 'quran',
      reference: '7:156',
    },
    {
      textAr: 'إِنَّ اللَّهَ لَا يُظْلِمُ النَّاسَ شَيْئًا وَلَٰكِنَّ النَّاسَ أَنفُسَهُمْ يَظْلِمُونَ',
      textEn: 'Indeed, Allah does not wrong the people at all, but it is the people who wrong themselves.',
      source: 'Surah Yunus 10:44',
      type: 'quran',
      reference: '10:44',
    },
    {
      textAr: 'The Prophet (PBUH) said: "Allah the Almighty said: I am as My servant thinks of Me. So let him think of Me as he wishes."',
      textEn: 'Allah the Almighty said: I am as My servant thinks of Me. So let him think of Me as he wishes.',
      source: 'Sahih al-Bukhari 7405',
      type: 'hadith',
      reference: 'Bukhari 7405',
    },
    {
      textAr: 'عَسَىٰ أَن يَبْعَثَكَ رَبُّكَ مَقَامًا مَّحْمُودًا',
      textEn: 'Perhaps your Lord will raise you to a praiseworthy station.',
      source: 'Surah Al-Isra 17:79',
      type: 'quran',
      reference: '17:79',
    },
  ],
  seeking: [
    {
      textAr: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
      textEn: 'Guide us to the straight path.',
      source: 'Surah Al-Fatihah 1:6',
      type: 'quran',
      reference: '1:6',
    },
    {
      textAr: 'وَيَهْدِيَكُمْ صِرَاطًا مُّسْتَقِيمًا',
      textEn: 'And will guide you to a straight path.',
      source: 'Surah Al-Fath 48:2',
      type: 'quran',
      reference: '48:2',
    },
    {
      textAr: 'The Prophet (PBUH) said: "Whoever Allah wishes good for, He gives him understanding of the religion."',
      textEn: 'Whoever Allah wishes good for, He gives him understanding of the religion.',
      source: 'Sahih al-Bukhari 71',
      type: 'hadith',
      reference: 'Bukhari 71',
    },
    {
      textAr: 'قُلْ رَبِّ زِدْنِي عِلْمًا',
      textEn: 'Say, "My Lord, increase me in knowledge."',
      source: 'Surah Ta-Ha 20:114',
      type: 'quran',
      reference: '20:114',
    },
    {
      textAr: 'وَلَقَدْ صَرَّفْنَا لِلنَّاسِ فِي هَٰذَا الْقُرْآنِ مِن كُلِّ مَثَلٍ وَلَئِن جِئْتَهُم بِآيَةٍ لَّيَقُولَنَّ الَّذِينَ كَفَرُوا إِنْ أَنتُمْ إِلَّا مُبْطِلُونَ',
      textEn: 'And We have certainly presented for the people in this Quran from every kind of example — but most of the people refuse to believe.',
      source: 'Surah Ar-Rum 30:58',
      type: 'quran',
      reference: '30:58',
    },
  ],
  peaceful: [
    {
      textAr: 'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ لِيَزْدَادُوا إِيمَانًا مَّعَ إِيمَانِهِمْ',
      textEn: 'It is He who sent down tranquility into the hearts of the believers that they would increase in faith along with their faith.',
      source: 'Surah Al-Fath 48:4',
      type: 'quran',
      reference: '48:4',
    },
    {
      textAr: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      textEn: 'Verily, in the remembrance of Allah do hearts find rest.',
      source: 'Surah Ar-Ra\'d 13:28',
      type: 'quran',
      reference: '13:28',
    },
    {
      textAr: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      textEn: 'Those who have believed and whose hearts are assured by the remembrance of Allah. Unquestionably, by the remembrance of Allah hearts are assured.',
      source: 'Surah Ar-Ra\'d 13:28',
      type: 'quran',
      reference: '13:28',
    },
    {
      textAr: 'The Prophet (PBUH) said: "The example of a house in which Allah is remembered and a house in which Allah is not remembered is like the living and the dead."',
      textEn: 'The example of a house in which Allah is remembered and a house in which Allah is not remembered is like the living and the dead.',
      source: 'Sahih Muslim 779',
      type: 'hadith',
      reference: 'Muslim 779',
    },
  ],
  repentant: [
    {
      textAr: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
      textEn: 'Say, "O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins."',
      source: 'Surah Az-Zumar 39:53',
      type: 'quran',
      reference: '39:53',
    },
    {
      textAr: 'إِلَّا مَن تَابَ وَآمَنَ وَعَمِلَ عَمَلًا صَالِحًا فَأُولَٰئِكَ يُبَدِّلُ اللَّهُ سَيِّئَاتِهِمْ حَسَنَاتٍ',
      textEn: 'Except for those who repent, believe and do righteous deeds — for them Allah will replace their evil deeds with good deeds.',
      source: 'Surah Al-Furqan 25:70',
      type: 'quran',
      reference: '25:70',
    },
    {
      textAr: 'The Prophet (PBUH) said: "Allah extends His hand at night to accept the repentance of the one who sinned during the day, and He extends His hand during the day to accept the repentance of the one who sinned at night."',
      textEn: 'Allah extends His hand at night to accept the repentance of the one who sinned during the day, and He extends His hand during the day to accept the repentance of the one who sinned at night.',
      source: 'Sahih Muslim 2759',
      type: 'hadith',
      reference: 'Muslim 2759',
    },
    {
      textAr: 'وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ وَيَعْفُو عَنِ السَّيِّئَاتِ',
      textEn: 'And it is He who accepts repentance from His servants and pardons misdeeds.',
      source: 'Surah Ash-Shura 42:25',
      type: 'quran',
      reference: '42:25',
    },
    {
      textAr: 'The Prophet (PBUH) said: "By Allah, Allah is more pleased with the repentance of His servant than one of you who finds his camel after having lost it in a desolate land."',
      textEn: 'By Allah, Allah is more pleased with the repentance of His servant than one of you who finds his camel after having lost it in a desolate land.',
      source: 'Sahih al-Bukhari 6309',
      type: 'hadith',
      reference: 'Bukhari 6309',
    },
  ],
};

const MOOD_DUAS: Record<MoodCategory, { arabic: string; english: string }> = {
  sad: {
    arabic: 'اللَّهُمَّ إِنِّي عَبْدُكَ ابْنُ عَبْدِكَ ابْنُ أَمَتِكَ نَاصِيَتِي بِيَدِكَ مَاضٍ فِيَّ حُكْمُكَ عَدْلٌ فِيَّ قَضَاؤُكَ',
    english: 'O Allah, I am Your servant, son of Your servant, son of Your maid. My forelock is in Your hand, Your command over me is forever executed and Your decree over me is just.',
  },
  anxious: {
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    english: 'Allah is sufficient for me. There is no deity except Him. Upon Him I have relied, and He is the Lord of the Great Throne.',
  },
  angry: {
    arabic: 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَأَطْهِرْ قَلْبِي وَحَصِّنْ فَرْجِي',
    english: 'O Allah, forgive my sin, purify my heart, and guard my chastity.',
  },
  grateful: {
    arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ وَلِعَظِيمِ سُلْطَانِكَ',
    english: 'O Allah, all praise is due to You as much as befits the glory of Your face and the greatness of Your authority.',
  },
  lonely: {
    arabic: 'اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ',
    english: 'O Allah, You are the Companion during travel and the Guardian of the family.',
  },
  stressed: {
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    english: 'There is no power and no strength except with Allah, the Most High, the Most Great.',
  },
  hopeful: {
    arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي',
    english: 'My Lord, expand for me my breast and ease for me my task.',
  },
  seeking: {
    arabic: 'اللَّهُمَّ أَرْنِي الْحَقَّ حَقًّا وَارْزُقْنِي اتِّبَاعَهُ وَأَرْنِي الْبَاطِلَ بَاطِلًا وَارْزُقْنِي اجْتِنَابَهُ',
    english: 'O Allah, show me the truth as truth and enable me to follow it, and show me falsehood as falsehood and enable me to avoid it.',
  },
  peaceful: {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    english: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
  },
  repentant: {
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    english: 'O Allah, You are my Lord. There is no deity except You. You created me, and I am Your servant. I am upon Your covenant and Your promise as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your blessing upon me, and I acknowledge my sin. So forgive me, for there is none who can forgive sins except You.',
  },
};

const MOOD_MESSAGES: Record<MoodCategory, { title: string; message: string }> = {
  sad: {
    title: 'Comfort for Your Heart',
    message: 'Sadness is a natural part of the human experience, and Allah knows your pain. The Quran reminds us that after every difficulty comes ease. Allow these verses to wrap your heart in the warmth of Allah\'s mercy.',
  },
  anxious: {
    title: 'Find Your Peace',
    message: 'Worry and anxiety weigh heavy on the heart, but Allah has promised that whoever trusts in Him will find peace. These verses are a reminder that you are never alone in your worries, and Allah\'s plan is always the best.',
  },
  angry: {
    title: 'Path of Patience',
    message: 'Anger is natural, but how we respond to it defines us. Islam teaches us that controlling anger is a sign of true strength. These verses and teachings will help you find calm and channel your emotions positively.',
  },
  grateful: {
    title: 'Count Your Blessings',
    message: 'Gratitude is the key that unlocks even more of Allah\'s blessings. When you are thankful for what you have, Allah promises to increase you. Let these verses deepen your sense of shukr.',
  },
  lonely: {
    title: 'You Are Never Alone',
    message: 'Even when you feel most isolated, Allah is closer to you than your own heartbeat. The Quran reminds us that He is always with us, watching over us, and caring for us in ways we cannot perceive.',
  },
  stressed: {
    title: 'Ease After Hardship',
    message: 'The burden you carry may feel heavy, but Allah never gives you more than you can bear. These verses are a powerful reminder that ease follows hardship, and that every difficulty is an opportunity for growth and reward.',
  },
  hopeful: {
    title: 'Allah\'s Mercy Is Vast',
    message: 'Your hope in Allah is one of the greatest blessings. Never underestimate the power of a positive expectation from your Lord. These verses celebrate the beautiful relationship between a hopeful servant and a merciful Creator.',
  },
  seeking: {
    title: 'Allah Is the Guide',
    message: 'The desire to seek guidance itself is a gift from Allah. He loves those who seek knowledge, direction, and closeness to Him. These verses will illuminate your path and bring clarity to your heart.',
  },
  peaceful: {
    title: 'Guard Your Peace',
    message: 'Inner peace is a treasure that comes from the remembrance of Allah. Alhamdulillah for the tranquility in your heart. These verses will help you protect and deepen the serenity you already feel.',
  },
  repentant: {
    title: 'Allah Loves the Returning',
    message: 'No matter how far you feel you have gone, the door of repentance is always open. Allah\'s mercy is vaster than your sins. These verses and Hadiths are a reminder that returning to Allah is the most beautiful journey you can take.',
  },
};

// ─── Surah Suggestions by Mood ─────────────────────────────

interface MoodSurahSuggestion {
  surahNumber: number;
  surahName: string;
  surahNameAr: string;
  reason: string;
}

const MOOD_SURAHS: Record<MoodCategory, MoodSurahSuggestion[]> = {
  sad: [
    { surahNumber: 94, surahName: 'Ash-Sharh', surahNameAr: 'الشرح', reason: 'Reminds us that hardship is followed by ease — comfort for a heavy heart' },
    { surahNumber: 93, surahName: 'Ad-Duha', surahNameAr: 'الضحى', reason: 'Allah never abandons you — His mercy is always near' },
    { surahNumber: 12, surahName: 'Yusuf', surahNameAr: 'يوسف', reason: 'A story of patience through loss, betrayal, and ultimate relief from Allah' },
    { surahNumber: 2, surahName: 'Al-Baqarah', surahNameAr: 'البقرة', reason: 'Contains the greatest verse (Ayatul Kursi) — a source of peace and protection' },
  ],
  anxious: [
    { surahNumber: 13, surahName: 'Ar-Ra\'d', surahNameAr: 'الرعد', reason: 'Hearts find rest only in the remembrance of Allah' },
    { surahNumber: 65, surahName: 'At-Talaq', surahNameAr: 'الطلاق', reason: 'Whoever relies upon Allah — He is sufficient for them' },
    { surahNumber: 20, surahName: 'Ta-Ha', surahNameAr: 'طه', reason: 'A soothing surah that brings tranquility to anxious hearts' },
    { surahNumber: 40, surahName: 'Ghafir', surahNameAr: 'غافر', reason: 'The Forgiver — a surah of hope and reassurance for the worried soul' },
  ],
  angry: [
    { surahNumber: 3, surahName: 'Ali Imran', surahNameAr: 'آل عمران', reason: 'Those who suppress anger and forgive others — Allah loves the doers of good' },
    { surahNumber: 41, surahName: 'Fussilat', surahNameAr: 'فصلت', reason: 'Repel evil with that which is better — and your enemy will become a close friend' },
    { surahNumber: 7, surahName: 'Al-A\'raf', surahNameAr: 'الأعراف', reason: 'Speak good to people — a reminder of patience and wisdom in anger' },
    { surahNumber: 42, surahName: 'Ash-Shura', surahNameAr: 'الشورى', reason: 'Those who forgive and reconcile — Allah loves the good-doers' },
  ],
  grateful: [
    { surahNumber: 55, surahName: 'Ar-Rahman', surahNameAr: 'الرحمن', reason: 'Which of the favors of your Lord would you deny? A surah of pure gratitude' },
    { surahNumber: 14, surahName: 'Ibrahim', surahNameAr: 'إبراهيم', reason: 'If you are grateful, Allah will give you more — the promise of abundance' },
    { surahNumber: 67, surahName: 'Al-Mulk', surahNameAr: 'الملك', reason: 'Reflect on the creation — gratitude through recognizing Allah\'s blessings' },
    { surahNumber: 31, surahName: 'Luqman', surahNameAr: 'لقمان', reason: 'Wisdom to appreciate every blessing Allah has bestowed upon you' },
  ],
  lonely: [
    { surahNumber: 93, surahName: 'Ad-Duha', surahNameAr: 'الضحى', reason: 'Your Lord has not forsaken you — companionship through Allah\'s presence' },
    { surahNumber: 112, surahName: 'Al-Ikhlas', surahNameAr: 'الإخلاص', reason: 'One-third of the Quran — Allah is always with you, closer than your jugular vein' },
    { surahNumber: 36, surahName: 'Yasin', surahNameAr: 'يس', reason: 'The heart of the Quran — brings warmth and connection to the Divine' },
    { surahNumber: 108, surahName: 'Al-Kawthar', surahNameAr: 'الكوثر', reason: 'You are given abundance — Allah\'s love for you is limitless' },
  ],
  stressed: [
    { surahNumber: 94, surahName: 'Ash-Sharh', surahNameAr: 'الشرح', reason: 'Indeed, with hardship comes ease — repeated twice for emphasis and relief' },
    { surahNumber: 2, surahName: 'Al-Baqarah', surahNameAr: 'البقرة', reason: 'Allah does not burden a soul beyond its capacity — you are strong enough' },
    { surahNumber: 113, surahName: 'Al-Falaq', surahNameAr: 'الفلق', reason: 'Seeking refuge from harm and the pressures that overwhelm you' },
    { surahNumber: 114, surahName: 'An-Nas', surahNameAr: 'الناس', reason: 'Seeking protection from the whisperings that cause stress and anxiety' },
  ],
  hopeful: [
    { surahNumber: 76, surahName: 'Al-Insan', surahNameAr: 'الإنسان', reason: 'The story of the righteous who fulfill their vows — a vision of what hope leads to' },
    { surahNumber: 108, surahName: 'Al-Kawthar', surahNameAr: 'الكوثر', reason: 'Abundance and paradise await those who remain hopeful and grateful' },
    { surahNumber: 18, surahName: 'Al-Kahf', surahNameAr: 'الكهف', reason: 'Stories of faith, perseverance, and divine guidance for the hopeful soul' },
    { surahNumber: 91, surahName: 'Ash-Shams', surahNameAr: 'الشمس', reason: 'Allah purifies the soul — a promise of growth and brighter days ahead' },
  ],
  seeking: [
    { surahNumber: 1, surahName: 'Al-Fatiha', surahNameAr: 'الفاتحة', reason: 'The opening — your direct conversation with Allah, the ultimate guide' },
    { surahNumber: 103, surahName: 'Al-Asr', surahNameAr: 'العصر', reason: 'The essence of guidance — faith, patience, and truth' },
    { surahNumber: 73, surahName: 'Al-Muzzammil', surahNameAr: 'المزمل', reason: 'Stand in prayer at night — the path to spiritual clarity and guidance' },
    { surahNumber: 35, surahName: 'Fatir', surahNameAr: 'فاطر', reason: 'If you are grateful, He will increase you — a surah of seeking and finding' },
  ],
  peaceful: [
    { surahNumber: 36, surahName: 'Yasin', surahNameAr: 'يس', reason: 'The heart of the Quran — brings serenity and peace to the soul' },
    { surahNumber: 55, surahName: 'Ar-Rahman', surahNameAr: 'الرحمن', reason: 'A symphony of gratitude that fills the heart with contentment' },
    { surahNumber: 56, surahName: 'Al-Waqi\'ah', surahNameAr: 'الواقعة', reason: 'Reflecting on the Hereafter brings deep inner peace' },
    { surahNumber: 57, surahName: 'Al-Hadid', surahNameAr: 'الحديد', reason: 'Know that the life of this world is but play — true peace lies with Allah' },
  ],
  repentant: [
    { surahNumber: 39, surahName: 'Az-Zumar', surahNameAr: 'الزمر', reason: 'Do not despair of the mercy of Allah — the ultimate message of repentance' },
    { surahNumber: 40, surahName: 'Ghafir', surahNameAr: 'غافر', reason: 'The Forgiver — He is always ready to accept your sincere repentance' },
    { surahNumber: 25, surahName: 'Al-Furqan', surahNameAr: 'الفرقان', reason: 'The Criterion between truth and falsehood — guidance back to the right path' },
    { surahNumber: 71, surahName: 'Nuh', surahNameAr: 'نوح', reason: 'Prophet Nuh\'s prayer of repentance — a beautiful example of returning to Allah' },
  ],
};

function calculateMoodProfile(answers: number[]): MoodProfile {
  const tagCounts: Record<string, number> = {};
  answers.forEach((optionIndex, questionIndex) => {
    const question = MOOD_QUESTIONS[questionIndex];
    if (question && question.options[optionIndex]) {
      question.options[optionIndex].moodTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const sorted = Object.entries(tagCounts).sort(([, a], [, b]) => b - a);
  const primaryMood = (sorted[0]?.[0] || 'peaceful') as MoodCategory;
  const secondaryMoods = sorted.slice(1, 3).map(([mood]) => mood as MoodCategory);

  // Pick quotes: 2 from primary, 1 from secondary, 1 more from primary
  const primaryQuotes = MOOD_QUOTES[primaryMood] || MOOD_QUOTES.peaceful;
  const secondaryQuotes = secondaryMoods.length > 0
    ? (MOOD_QUOTES[secondaryMoods[0]] || MOOD_QUOTES.peaceful)
    : MOOD_QUOTES.peaceful;

  const quotes: MoodQuote[] = [];
  const usedSources = new Set<string>();
  // Add 3 from primary
  for (const q of primaryQuotes) {
    if (quotes.length < 3 && !usedSources.has(q.source)) {
      quotes.push(q);
      usedSources.add(q.source);
    }
  }
  // Add 1 from secondary
  for (const q of secondaryQuotes) {
    if (quotes.length < 4 && !usedSources.has(q.source)) {
      quotes.push(q);
      usedSources.add(q.source);
    }
  }

  const moodInfo = MOOD_MESSAGES[primaryMood];
  const dua = MOOD_DUAS[primaryMood];

  return {
    primaryMood,
    secondaryMoods,
    quotes,
    duaAr: dua.arabic,
    duaEn: dua.english,
    message: moodInfo.message,
    title: moodInfo.title,
  };
}


// ─── Mood Quiz Component ──────────────────────────────────


function MoodQuiz({
  showToast,
  arabicFontSize,
  onNavigateToListen,
}: {
  showToast: (msg: string) => void;
  arabicFontSize: string;
  onNavigateToListen: (surahNumber: number) => void;
}) {
  const [phase, setPhase] = useState<'idle' | 'quiz' | 'results'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<MoodProfile | null>(null);

  const handleStart = () => {
    setAnswers([]);
    setCurrentQuestion(0);
    setPhase('quiz');
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    if (currentQuestion < MOOD_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate results
      const profile = calculateMoodProfile(newAnswers);
      setResult(profile);
      setPhase('results');
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setAnswers(answers.slice(0, -1));
    } else {
      setPhase('idle');
    }
  };

  const handleReset = () => {
    setPhase('idle');
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
  };

  const handleCopyDua = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(`${result.duaAr}\n\n${result.duaEn}`);
      showToast('Dua copied to clipboard!');
    } catch {
      showToast('Could not copy');
    }
  };

  return (
    <div className="space-y-4">
      {/* Idle State — Full Hero */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative -mx-4 -mt-6 sm:-mx-6"
          style={{ minHeight: 'calc(100vh - 8rem)' }}
        >
          <motion.div
            className="relative h-full min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center cursor-pointer px-6 py-12 overflow-hidden"
            onClick={handleStart}
            whileTap={{ scale: 0.995 }}
          >
            {/* Full background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0D4B3C] via-[#145A48] to-[#1B6B52] dark:from-[#1a1510] dark:via-[#0F1A14] dark:to-[#162118]" />

            {/* Subtle Islamic pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A951' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />

            {/* Animated decorative elements */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-[#C8A951]/5 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#1B6B52]/30 blur-3xl dark:bg-[#C8A951]/5" />
            <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-[#C8A951]/40 dark:bg-[#C8A951]/20 animate-pulse" />
            <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 rounded-full bg-[#C8A951]/30 dark:bg-[#C8A951]/15 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="absolute top-1/3 right-1/6 w-1 h-1 rounded-full bg-[#C8A951]/50 dark:bg-[#C8A951]/25 animate-[pulse_4s_ease-in-out_infinite_1s]" />

            {/* Floating sparkles */}
            <motion.div
              className="absolute top-[15%] right-[10%] text-[#C8A951]/40 dark:text-[#C8A951]/20"
              animate={{ y: [-6, 6, -6], rotate: [0, 20, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <motion.div
              className="absolute bottom-[20%] left-[8%] text-[#C8A951]/30 dark:text-[#C8A951]/15"
              animate={{ y: [4, -4, 4], rotate: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            >
              <Star className="w-5 h-5" />
            </motion.div>
            <motion.div
              className="absolute top-[60%] right-[15%] text-[#C8A951]/25 dark:text-[#C8A951]/10"
              animate={{ y: [-3, 7, -3], opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <motion.div
              className="absolute top-[25%] left-[20%] text-[#C8A951]/20 dark:text-[#C8A951]/10"
              animate={{ y: [5, -5, 5], rotate: [0, 10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            >
              <Star className="w-3 h-3" />
            </motion.div>

            {/* Main content */}
            <div className="relative z-10 text-center max-w-lg mx-auto">
              {/* Pulsing heart icon with glow ring */}
              <motion.div
                className="mx-auto mb-8"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="relative">
                  {/* Outer glow */}
                  <motion.div
                    className="absolute -inset-3 rounded-full bg-[#C8A951]/20 dark:bg-[#C8A951]/10 blur-lg"
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {/* Icon circle */}
                  <div className="relative w-24 h-24 mx-auto rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-[#C8A951]/30 shadow-2xl">
                    <Heart className="w-12 h-12 text-[#C8A951]" />
                  </div>
                </div>
              </motion.div>

              {/* Arabic Bismillah */}
              <p className="font-arabic text-xl text-white/40 mb-6 leading-[2.4]">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>

              {/* Title */}
              <motion.h2
                className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                How Are You Feeling
                <br />
                <span className="text-[#C8A951]">Right Now?</span>
              </motion.h2>

              {/* Subtitle */}
              <motion.p
                className="text-white/60 text-base sm:text-lg max-w-sm mx-auto mb-10 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                Let us guide you to the perfect Quranic verses &amp; Hadiths for your heart in this moment.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                className="inline-flex items-center gap-3 bg-[#C8A951] text-[#0D4B3C] px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-[#C8A951]/20 hover:shadow-2xl hover:shadow-[#C8A951]/30 transition-all duration-300 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                <Sparkles className="w-5 h-5" />
                Start Now
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                className="mt-8 flex items-center justify-center gap-6 text-white/30 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Quran &amp; Hadith
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>7 Questions</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Takes 1 minute</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Quiz State */}
      {phase === 'quiz' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="-mx-4 -mt-6 sm:-mx-6"
        >
          <div className="bg-gradient-to-b from-[#0D4B3C] to-[#145A48] dark:from-[#0F1A14] dark:to-[#162118] px-4 py-6 sm:px-6">
            <Card className="max-w-2xl mx-auto overflow-hidden shadow-xl border-0 bg-white dark:bg-[#1a2420]">
              <div className="h-1 bg-gradient-to-r from-[#C8A951] via-[#D4B96A] to-[#C8A951]" />

              <CardContent className="p-6">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 text-sm text-[#6B7280] dark:text-[#9CA3AF] hover:text-white dark:hover:text-[#C8A951] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {currentQuestion === 0 ? 'Exit' : 'Back'}
                    </button>
                    <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-medium">
                      {currentQuestion + 1} of {MOOD_QUESTIONS.length}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E1D8] dark:bg-[#2D3E34] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#C8A951] to-[#D4B96A] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestion + 1) / MOOD_QUESTIONS.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="text-lg font-semibold text-[#1A1A2E] dark:text-[#E8E0D0] mb-5 leading-relaxed">
                      {MOOD_QUESTIONS[currentQuestion].question}
                    </p>

                    <div className="space-y-3">
                      {MOOD_QUESTIONS[currentQuestion].options.map((option, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08, duration: 0.2 }}
                          onClick={() => handleAnswer(idx)}
                          className="w-full text-left p-4 rounded-xl border-2 border-[#E5E1D8] dark:border-[#2D3E34] hover:border-[#C8A951] dark:hover:border-[#C8A951] hover:bg-[#C8A951]/5 transition-all duration-200 group/opt"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full border-2 border-[#C8A951]/40 group-hover/opt:border-[#C8A951] group-hover/opt:bg-[#C8A951]/10 flex items-center justify-center flex-shrink-0 transition-all">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#C8A951] opacity-0 group-hover/opt:opacity-50 transition-opacity" />
                            </div>
                            <span className="text-sm text-[#4A5568] dark:text-[#9CA3AF] group-hover/opt:text-[#0D4B3C] dark:group-hover/opt:text-[#E8E0D0] transition-colors leading-relaxed">
                              {option.label}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Results State */}
      {phase === 'results' && result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="-mx-4 -mt-6 sm:-mx-6"
        >
          <div className="bg-gradient-to-b from-[#0D4B3C] to-[#145A48] dark:from-[#0F1A14] dark:to-[#162118] px-4 py-6 sm:px-6 space-y-4 max-w-2xl mx-auto">

            {/* Result Header */}
            <Card className="overflow-hidden shadow-xl border-0 bg-white dark:bg-[#1a2420]">
              <div className="h-1.5 bg-gradient-to-r from-[#C8A951] via-[#D4B96A] to-[#C8A951]" />
              <CardContent className="p-6 sm:p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#C8A951] to-[#A68B3A] flex items-center justify-center shadow-lg shadow-[#C8A951]/20"
                >
                  <Heart className="w-8 h-8 text-white" />
                </motion.div>

                <Badge className="mb-3 bg-[#C8A951]/10 text-[#A68B3A] dark:bg-[#C8A951]/10 dark:text-[#C8A951] text-xs px-3 py-1">
                  {MOOD_LABELS[result.primaryMood].label}
                </Badge>

                <h3 className="text-xl font-bold text-[#0D4B3C] dark:text-[#C8A951] mb-2">
                  {result.title}
                </h3>
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-md mx-auto leading-relaxed">
                  {result.message}
                </p>

                <div className="flex items-center justify-center gap-2 mt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34] text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Take Again
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Personalized Dua */}
            <Card className="overflow-hidden shadow-lg border-0 bg-white dark:bg-[#1a2420]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C8A951]" />
                    <CardTitle className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951]">
                      A Dua for You
                    </CardTitle>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleCopyDua}>
                        <Copy className="w-3.5 h-3.5 text-[#6B7280]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>Copy dua</p></TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] text-right mb-3 leading-[2.4] ${getArabicFontSize(arabicFontSize)}`}>
                  {result.duaAr}
                </div>
                <Separator className="my-3" />
                <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed italic">
                  &ldquo;{result.duaEn}&rdquo;
                </p>
              </CardContent>
            </Card>

            {/* Recommended Quotes */}
            <div className="pb-2">
              <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C8A951]" />
                Verses & Hadiths for You
              </h3>
              <div className="space-y-3">
                {result.quotes.map((quote, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <Card className="islamic-border-top overflow-hidden shadow-md border-0 bg-white dark:bg-[#1a2420]">
                      <CardContent className="p-5">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-2 py-0.5 mb-3 ${
                            quote.type === 'quran'
                              ? 'bg-[#0D4B3C]/10 text-[#0D4B3C] dark:bg-[#C8A951]/10 dark:text-[#C8A951]'
                              : 'bg-[#C8A951]/10 text-[#A68B3A] dark:bg-[#0D4B3C]/10 dark:text-[#1B6B52]'
                          }`}
                        >
                          {quote.type === 'quran' ? 'Quran' : 'Hadith'}
                        </Badge>

                        <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] text-right mb-3 leading-[2.2] text-base ${arabicFontSize === 'lg' ? 'text-xl' : ''}`}>
                          {quote.textAr}
                        </div>
                        <Separator className="my-3" />
                        <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed">
                          {islamifyNames(quote.textEn)}
                        </p>
                        <p className="text-xs text-[#C8A951] mt-3 font-medium">
                          — {quote.source}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ★ Surah Suggestions based on Mood ★ */}
            {result && MOOD_SURAHS[result.primaryMood] && (
              <div className="pb-4">
                <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#C8A951]" />
                  Surahs Recommended for You
                </h3>
                <div className="space-y-3">
                  {MOOD_SURAHS[result.primaryMood].map((s, idx) => (
                    <motion.div
                      key={s.surahNumber}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                    >
                      <Card className="overflow-hidden shadow-md border-0 bg-white dark:bg-[#1a2420]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-[#C8A951]">{s.surahNumber}</span>
                                <span className="text-sm font-semibold text-[#0D4B3C] dark:text-[#E8E0D0]">{s.surahName}</span>
                                <span dir="rtl" lang="ar" className="font-arabic text-sm text-[#C8A951]/70">{s.surahNameAr}</span>
                              </div>
                              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">{s.reason}</p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onNavigateToListen(s.surahNumber)}
                              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C8A951] text-[#0D4B3C] text-xs font-bold shadow-md shadow-[#C8A951]/20 hover:shadow-lg transition-all"
                            >
                              <Play className="w-3 h-3" />
                              Listen
                            </motion.button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
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
  onNavigateToListen,
}: {
  addBookmark: (b: BookmarkItem) => void;
  isBookmarked: (s: number, a: number) => boolean;
  showToast: (msg: string) => void;
  arabicFontSize: string;
  onNavigateToListen: (surahNumber: number) => void;
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

  // ── Prayer Times State ──
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('wird-location');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [locationName, setLocationName] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('wird-location-name');
    } catch { return null; }
  });
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string> | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      setPrayerTimes(calculatePrayerTimes(location.lat, location.lng, new Date()));
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          setLocationDenied(false);
          try { localStorage.setItem('wird-location', JSON.stringify(loc)); } catch {}
          // Reverse geocode to get location name
          (async () => {
            try {
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10&accept-language=en`);
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const name = geoData.address?.city || geoData.address?.town || geoData.address?.county || geoData.address?.state || 'Your Location';
                setLocationName(name);
                try { localStorage.setItem('wird-location-name', name); } catch {}
              }
            } catch {}
          })();
        },
        () => {
          const mecca = { lat: 21.4225, lng: 39.8262 };
          setLocation(mecca);
          setLocationDenied(true);
        },
        { timeout: 5000 }
      );
    } else {
      setLocation({ lat: 21.4225, lng: 39.8262 });
      setLocationDenied(true);
    }
  }, [location]);

  const refreshLocation = useCallback(() => {
    try { localStorage.removeItem('wird-location'); } catch {}
    try { localStorage.removeItem('wird-location-name'); } catch {}
    setLocation(null);
    setLocationName(null);
    setPrayerTimes(null);
    setLocationDenied(false);
  }, []);

  const nextPrayer = prayerTimes ? getNextPrayer(prayerTimes) : null;

  // ── Situation Duas State ──
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);
  const [sitDuaCopied, setSitDuaCopied] = useState(false);

  // TTS for situation duas
  const [isSitSpeaking, setIsSitSpeaking] = useState(false);
  const [sitSpeakingLang, setSitSpeakingLang] = useState<string | null>(null);
  const speakSitDua = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utterance.voice = match;
    utterance.onstart = () => { setIsSitSpeaking(true); setSitSpeakingLang(lang); };
    utterance.onend = () => { setIsSitSpeaking(false); setSitSpeakingLang(null); };
    utterance.onerror = () => { setIsSitSpeaking(false); setSitSpeakingLang(null); };
    speechSynthesis.speak(utterance);
  }, []);
  const stopSitSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    setIsSitSpeaking(false);
    setSitSpeakingLang(null);
  }, []);

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
          localStorage.setItem('wird-daily-verse', JSON.stringify({
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
      const cached = localStorage.getItem('wird-daily-verse');
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
    <div className="max-w-4xl mx-auto">
      {/* ─── Prayer Times Widget ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-4 pt-4 pb-2 sm:px-6"
      >
        <Card className="overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-[#0D4B3C] to-[#0D4B3C]/90 dark:from-[#0D4B3C] dark:to-[#0D4B3C]/80 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-[#C8A951]" />
              <div>
                <h3 className="text-sm font-bold text-white">Prayer Times</h3>
                <p className="text-[10px] text-[#C8A951]/80">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="text-[#C8A951]/60 ml-1">📍 {locationName || (locationDenied ? 'Makkah (default)' : '...')}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 text-white/70 hover:text-white hover:bg-white/10"
                onClick={refreshLocation}
              >
                <MapPin className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            {prayerTimes ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Fajr', icon: '🌅', time: prayerTimes.Fajr },
                  { name: 'Sunrise', icon: '☀️', time: prayerTimes.Sunrise },
                  { name: 'Dhuhr', icon: '🌤️', time: prayerTimes.Dhuhr },
                  { name: 'Asr', icon: '⛅', time: prayerTimes.Asr },
                  { name: 'Maghrib', icon: '🌅', time: prayerTimes.Maghrib },
                  { name: 'Isha', icon: '🌙', time: prayerTimes.Isha },
                ].map(({ name, icon, time }) => (
                  <div
                    key={name}
                    className={`relative p-2.5 rounded-xl text-center transition-all duration-200 ${
                      nextPrayer === name
                        ? 'bg-[#C8A951]/10 dark:bg-[#C8A951]/15 border-2 border-[#C8A951] shadow-sm'
                        : 'bg-[#F8F6F0] dark:bg-[#0F1A14] border border-[#E5E1D8] dark:border-[#2D3E34]'
                    }`}
                  >
                    {nextPrayer === name && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                        <Badge className="text-[8px] h-4 px-1.5 bg-[#C8A951] text-[#0D4B3C] border-0 font-bold">NEXT</Badge>
                      </div>
                    )}
                    <p className="text-lg mb-0.5">{icon}</p>
                    <p className={`text-[11px] font-semibold mb-0.5 ${nextPrayer === name ? 'text-[#C8A951]' : 'text-[#0D4B3C] dark:text-[#C8A951]'}`}>
                      {name}
                    </p>
                    <p className={`text-xs font-bold ${nextPrayer === name ? 'text-[#0D4B3C] dark:text-white' : 'text-[#4A5568] dark:text-[#9CA3AF]'}`}>
                      {time}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-[#0D4B3C] dark:text-[#C8A951] animate-spin mr-2" />
                <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Calculating prayer times...</span>
              </div>
            )}
            {locationDenied && prayerTimes && (
              <p className="text-[10px] text-[#9CA3AF] text-center mt-2">
                Using default location (Makkah). Tap <MapPin className="w-2.5 h-2.5 inline" /> to detect your location.
              </p>
            )}
            {!locationDenied && locationName && prayerTimes && (
              <p className="text-[10px] text-[#9CA3AF] text-center mt-2">
                Times for {locationName} · {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ★ MAIN HERO: Mood-Based Spiritual Guidance ★ */}
      <MoodQuiz showToast={showToast} arabicFontSize={arabicFontSize} onNavigateToListen={onNavigateToListen} />

      {/* ─── Secondary Content ─── */}
      <div className="px-4 pb-6 sm:px-6 space-y-6">

        {/* Daily Verse Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center">
              <Moon className="w-4 h-4 text-[#0D4B3C] dark:text-[#C8A951]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0D4B3C] dark:text-[#C8A951]">Verse of the Day</h3>
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">A fresh verse to brighten your day</p>
            </div>
          </div>

          <Card className="islamic-pattern-border overflow-hidden relative">
            <div className="h-1 bg-gradient-to-r from-[#0D4B3C] via-[#C8A951] to-[#0D4B3C]" />
            <CardContent className="p-5 sm:p-6">
              {loading ? (
                <div className="space-y-3 py-4">
                  <Skeleton className="h-12 w-full mx-auto max-w-lg" />
                  <Skeleton className="h-3 w-3/4 mx-auto" />
                  <Skeleton className="h-3 w-1/2 mx-auto" />
                </div>
              ) : error ? (
                <div className="text-center py-6">
                  <p className="text-red-500 mb-3 text-sm">{error}</p>
                  <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </Button>
                </div>
              ) : dailyVerse ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <div className="bismillah mb-4 text-sm">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                  <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] text-center mb-4 leading-[2.4] ${arabicFontSize === 'sm' ? 'text-lg' : arabicFontSize === 'lg' ? 'text-2xl' : 'text-xl'}`}>
                    {dailyVerse.arabic}
                  </div>
                  <div className="w-12 h-0.5 bg-[#C8A951] mx-auto mb-4" />
                  <p className="text-[#4A5568] dark:text-[#9CA3AF] text-center leading-relaxed mb-3 max-w-xl mx-auto text-sm">
                    {islamifyNames(dailyVerse.english)}
                  </p>
                  <p className="text-[10px] text-[#C8A951] font-semibold text-center mb-4">
                    — {dailyVerse.surahName} ({dailyVerse.surahNameAr}) : {dailyVerse.ayahNumber}
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34] text-xs h-8">
                      <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> New
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34] text-xs h-8">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Done' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBookmark} className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34] text-xs h-8">
                      <Heart className={`w-3 h-3 ${isBookmarked(dailyVerse.surahNumber, dailyVerse.ayahNumber) ? 'fill-[#C8A951] text-[#C8A951]' : ''}`} /> Save
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 border-[#E5E1D8] dark:border-[#2D3E34] text-xs h-8">
                      <Share2 className="w-3 h-3" /> Share
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        {/* Hadith Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#C8A951]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#C8A951]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0D4B3C] dark:text-[#C8A951]">Hadith of the Day</h3>
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Narrated by {dailyHadith.narrator}</p>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#C8A951]/30 via-[#C8A951] to-[#C8A951]/30" />
            <CardContent className="p-5">
              <div dir="rtl" lang="ar" className={`font-arabic text-[#0D4B3C] dark:text-[#E8E0D0] text-right mb-3 leading-[2.2] ${arabicFontSize === 'sm' ? 'text-base' : arabicFontSize === 'lg' ? 'text-xl' : 'text-lg'}`}>
                {dailyHadith.textAr}
              </div>
              <Separator className="my-3" />
              <p className="text-sm text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed italic">
                &ldquo;{dailyHadith.textEn}&rdquo;
              </p>
              <p className="text-[10px] text-[#C8A951] mt-3 font-medium">— {dailyHadith.source}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* More Hadiths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#0D4B3C] dark:text-[#C8A951]" />
            </div>
            <h3 className="text-sm font-bold text-[#0D4B3C] dark:text-[#C8A951]">More Inspirational Hadiths</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUNDLED_HADITHS.slice(0, 4).map((h, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
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
        </motion.div>

        {/* ─── Duas for Your Moment ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D4B3C]/10 dark:bg-[#C8A951]/10 flex items-center justify-center">
              <HandHeart className="w-4 h-4 text-[#0D4B3C] dark:text-[#C8A951]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0D4B3C] dark:text-[#C8A951]">Duas for Your Moment</h3>
              <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">Supplications for every life situation</p>
            </div>
          </div>

          {/* Situation Cards Row */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {SITUATION_DUAS.map((sit) => (
              <motion.button
                key={sit.situation}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  stopSitSpeaking();
                  setSelectedSituation(selectedSituation === sit.situation ? null : sit.situation);
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border-2 text-left transition-all duration-200 min-w-fit ${
                  selectedSituation === sit.situation
                    ? 'border-[#C8A951] bg-[#C8A951]/5 dark:bg-[#C8A951]/10 shadow-sm'
                    : 'border-[#E5E1D8] dark:border-[#2D3E34] hover:border-[#C8A951]/40 bg-white dark:bg-[#0F1A14]'
                }`}
              >
                <span className="text-xl">{sit.emoji}</span>
                <div>
                  <p className={`text-xs font-semibold ${selectedSituation === sit.situation ? 'text-[#C8A951]' : 'text-[#1A1A2E] dark:text-[#E8E0D0]'}`}>
                    {sit.situation}
                  </p>
                  <p className="text-[9px] text-[#9CA3AF] max-w-[120px] truncate">{sit.description}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Expanded Situation Duas */}
          <AnimatePresence>
            {selectedSituation && (() => {
              const sitData = SITUATION_DUAS.find(s => s.situation === selectedSituation);
              if (!sitData) return null;
              return (
                <motion.div
                  key={selectedSituation}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-1">
                    {sitData.duas.map((dua, idx) => (
                      <motion.div
                        key={dua.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        <Card className="overflow-hidden border border-[#E5E1D8] dark:border-[#2D3E34]">
                          <div className="h-0.5 bg-gradient-to-r from-[#0D4B3C]/40 via-[#C8A951]/60 to-[#0D4B3C]/40" />
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951]">{dua.title}</h4>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {/* TTS Play buttons */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSitSpeaking && sitSpeakingLang === 'ar') {
                                          stopSitSpeaking();
                                        } else {
                                          speakSitDua(dua.arabic, 'ar');
                                        }
                                      }}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                                        isSitSpeaking && sitSpeakingLang === 'ar'
                                          ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C]'
                                          : 'bg-[#0D4B3C]/10 text-[#0D4B3C] dark:bg-[#C8A951]/10 dark:text-[#C8A951] hover:bg-[#0D4B3C]/20'
                                      }`}
                                    >
                                      {isSitSpeaking && sitSpeakingLang === 'ar' ? (
                                        <motion.div
                                          animate={{ scale: [1, 1.2, 1] }}
                                          transition={{ repeat: Infinity, duration: 1 }}
                                        >
                                          <Pause className="w-3 h-3" />
                                        </motion.div>
                                      ) : (
                                        <Volume2 className="w-3 h-3" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>Arabic</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSitSpeaking && sitSpeakingLang === 'en') {
                                          stopSitSpeaking();
                                        } else {
                                          speakSitDua(dua.english, 'en');
                                        }
                                      }}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 text-[10px] font-bold ${
                                        isSitSpeaking && sitSpeakingLang === 'en'
                                          ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C]'
                                          : 'bg-[#E5E1D8]/50 text-[#6B7280] dark:bg-[#2D3E34] hover:bg-[#E5E1D8] dark:hover:bg-[#2D3E34]'
                                      }`}
                                    >
                                      EN
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>English</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSitSpeaking && sitSpeakingLang === 'bn') {
                                          stopSitSpeaking();
                                        } else {
                                          speakSitDua(dua.bangla, 'bn');
                                        }
                                      }}
                                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 text-[10px] font-bold ${
                                        isSitSpeaking && sitSpeakingLang === 'bn'
                                          ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C]'
                                          : 'bg-[#E5E1D8]/50 text-[#6B7280] dark:bg-[#2D3E34] hover:bg-[#E5E1D8] dark:hover:bg-[#2D3E34]'
                                      }`}
                                    >
                                      বা
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top"><p>বাংলা</p></TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            {/* Speaking Indicator */}
                            {isSitSpeaking && (
                              <div className="flex items-center gap-1.5 mb-2">
                                <motion.div
                                  className="w-1.5 h-1.5 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 0.8 }}
                                />
                                <motion.div
                                  className="w-1.5 h-1.5 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                                />
                                <motion.div
                                  className="w-1.5 h-1.5 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                                />
                                <span className="text-[10px] text-[#0D4B3C] dark:text-[#C8A951] ml-0.5">
                                  {sitSpeakingLang === 'ar' ? 'Reciting Arabic...' : sitSpeakingLang === 'en' ? 'Speaking English...' : 'বাংলায় পড়ছি...'}
                                </span>
                              </div>
                            )}

                            <div dir="rtl" lang="ar" className="font-arabic text-base text-[#0D4B3C] dark:text-[#E8E0D0] leading-[2] mb-2">
                              {dua.arabic}
                            </div>
                            <Separator className="my-2" />
                            <p className="text-xs text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed mb-2">
                              {dua.english}
                            </p>
                            <p className="text-xs text-[#4A5568] dark:text-[#9CA3AF] leading-relaxed mb-2">
                              {dua.bangla}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-[10px] text-[#C8A951] font-medium">— {dua.reference}</p>
                              <button
                                onClick={() => {
                                  const text = `${dua.arabic}\n\n${dua.english}\n\n${dua.bangla}\n\n— ${dua.reference}`;
                                  navigator.clipboard.writeText(text).then(() => {
                                    setSitDuaCopied(true);
                                    showToast('Dua copied to clipboard');
                                    setTimeout(() => setSitDuaCopied(false), 2000);
                                  });
                                }}
                                className="flex items-center gap-1 text-[10px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0D4B3C] dark:hover:text-[#C8A951] transition-colors"
                              >
                                {sitDuaCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {sitDuaCopied ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </motion.div>
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

      {/* Install App */}
      <Card className="border border-[#C8A951]/30 bg-[#C8A951]/5">
        <CardContent className="p-4 flex items-center gap-3">
          <img src="/icon-192.png" alt="Wird" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951]">Install Wird App</p>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Add to home screen for quick access, or use your browser's menu → &quot;Add to Home Screen&quot; or &quot;Install App&quot;</p>
          </div>
        </CardContent>
      </Card>

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
                English (Sahih International) & Bengali
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
              <p className="text-sm font-semibold text-[#1A1A2E] dark:text-[#E8E0D0]">About Wird</p>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Version 1.0.0</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-[#4A5568] dark:text-[#9CA3AF]">
            <p>
              <strong className="text-[#0D4B3C] dark:text-[#C8A951]">ورد (Wird)</strong> means &ldquo;Daily Portion&rdquo; or &ldquo;Spiritual Practice&rdquo; in Arabic.
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

// ─── Dua Collection ──────────────────────────────────────

function DuaCollection({ showToast }: { showToast: (msg: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<DuaItem['category']>('morning');
  const [selectedDua, setSelectedDua] = useState<DuaItem | null>(null);
  const [captionLanguage, setCaptionLanguage] = useState<'arabic' | 'english' | 'bangla'>('arabic');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  // ── TTS State ──
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingLang, setSpeakingLang] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1);

  const speakDua = useCallback((text: string, lang: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = speechRate;
    // Try to find matching voice
    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (match) utterance.voice = match;
    utterance.onstart = () => { setIsSpeaking(true); setSpeakingLang(lang); };
    utterance.onend = () => { setIsSpeaking(false); setSpeakingLang(null); };
    utterance.onerror = () => { setIsSpeaking(false); setSpeakingLang(null); };
    speechSynthesis.speak(utterance);
  }, [speechRate]);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingLang(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Load voices (needed for some browsers)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.getVoices();
      speechSynthesis.addEventListener('voiceschanged', () => { speechSynthesis.getVoices(); });
    }
  }, []);

  const filteredDuas = useMemo(() => {
    let duas = BUNDLED_DUAS.filter((d) => d.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      duas = BUNDLED_DUAS.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.arabic.includes(q) ||
          d.english.toLowerCase().includes(q) ||
          d.bangla.includes(q) ||
          d.reference.toLowerCase().includes(q)
      );
    }
    return duas;
  }, [activeCategory, search]);

  const copyDua = useCallback(
    (dua: DuaItem) => {
      const text = `${dua.arabic}\n\n${dua.english}\n\n${dua.bangla}\n\n— ${dua.reference}`;
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        showToast('Dua copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [showToast]
  );

  // Category view
  if (!selectedDua) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#C8A951]/20 to-[#C8A951]/5 dark:from-[#C8A951]/20 dark:to-[#C8A951]/5 flex items-center justify-center shadow-lg">
              <HandHeart className="w-8 h-8 text-[#C8A951]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0D4B3C] dark:text-[#C8A951]">Daily Duas</h2>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">Essential supplications for every moment of your day</p>
          </motion.div>
        </div>

        {/* Search */}
        <Card className="mb-4 overflow-hidden">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search duas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8F6F0] dark:bg-[#0F1A14] border border-[#E5E1D8] dark:border-[#2D3E34] rounded-xl text-[#1A1A2E] dark:text-[#E8E0D0] placeholder-[#9CA3AF]/60 focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Grid */}
        {!search && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {DUA_CATEGORIES.map((cat) => {
              const count = BUNDLED_DUAS.filter((d) => d.category === cat.id).length;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all duration-200 overflow-hidden ${
                    activeCategory === cat.id
                      ? 'border-[#C8A951] bg-[#C8A951]/5 dark:bg-[#C8A951]/10'
                      : 'border-[#E5E1D8] dark:border-[#2D3E34] hover:border-[#C8A951]/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <p className="text-xs font-semibold text-[#1A1A2E] dark:text-[#E8E0D0]">{cat.label}</p>
                  <p className="font-arabic text-[10px] text-[#9CA3AF]">{cat.labelAr}</p>
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] h-5 min-w-5 flex items-center justify-center px-1">
                    {count}
                  </Badge>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Dua List */}
        {search && <p className="text-xs text-[#9CA3AF] mb-3">{filteredDuas.length} dua{filteredDuas.length !== 1 ? 's' : ''} found</p>}

        <div className="space-y-3">
          {filteredDuas.map((dua, index) => (
            <motion.div
              key={dua.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border border-[#E5E1D8] dark:border-[#2D3E34]"
                onClick={() => {
                  stopSpeaking();
                  setSelectedDua(dua);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="verse-badge text-[10px]">{DUA_CATEGORIES.find((c) => c.id === dua.category)?.icon}</div>
                        <h3 className="text-sm font-semibold text-[#0D4B3C] dark:text-[#C8A951] truncate">{dua.title}</h3>
                      </div>
                      <p dir="rtl" lang="ar" className="font-arabic text-sm text-[#0D4B3C]/70 dark:text-[#C8A951]/70 truncate">
                        {dua.arabic}
                      </p>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1.5 line-clamp-1">{dua.english}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      {/* Speaking indicator */}
                      {isSpeaking && speakingLang === 'ar' && (
                        <div className="flex items-center gap-0.5">
                          <motion.div className="w-1 h-1 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                          <motion.div className="w-1 h-1 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                          <motion.div className="w-1 h-1 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                        </div>
                      )}
                      {/* Play/Pause Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSpeaking && speakingLang === 'ar') {
                            stopSpeaking();
                          } else {
                            speakDua(dua.arabic, 'ar');
                          }
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                          isSpeaking && speakingLang === 'ar'
                            ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C] shadow-md'
                            : 'bg-[#0D4B3C]/10 text-[#0D4B3C] dark:bg-[#C8A951]/10 dark:text-[#C8A951] hover:bg-[#0D4B3C]/20 dark:hover:bg-[#C8A951]/20'
                        }`}
                      >
                        {isSpeaking && speakingLang === 'ar' ? (
                          <Pause className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filteredDuas.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-[#9CA3AF]">No duas found</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single dua view
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => {
          stopSpeaking();
          setSelectedDua(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex items-center gap-1.5 text-sm text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0D4B3C] dark:hover:text-[#C8A951] transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Duas
      </button>

      {/* Category Badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xl">{DUA_CATEGORIES.find((c) => c.id === selectedDua.category)?.icon}</span>
        <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
          {DUA_CATEGORIES.find((c) => c.id === selectedDua.category)?.label}
        </span>
      </div>

      {/* Dua Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-2 border-[#C8A951]/20 shadow-lg mb-4">
          <div className="h-1.5 bg-gradient-to-r from-[#0D4B3C] via-[#C8A951] to-[#0D4B3C]" />
          <CardContent className="p-6">
            {/* Title */}
            <h2 className="text-lg font-bold text-[#0D4B3C] dark:text-[#C8A951] text-center mb-1">{selectedDua.title}</h2>
            <p dir="rtl" lang="ar" className="font-arabic text-sm text-[#9CA3AF] text-center mb-4">{selectedDua.titleAr}</p>

            {/* ★ Prominent TTS Play Controls ★ */}
            <div className="flex flex-col items-center gap-3 mb-5">
              {/* Play Buttons Row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isSpeaking && speakingLang === 'ar') {
                      stopSpeaking();
                    } else {
                      speakDua(selectedDua.arabic, 'ar');
                    }
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                    isSpeaking && speakingLang === 'ar'
                      ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C] shadow-lg'
                      : 'bg-[#0D4B3C]/10 text-[#0D4B3C] dark:bg-[#C8A951]/10 dark:text-[#C8A951] hover:bg-[#0D4B3C]/20 dark:hover:bg-[#C8A951]/20'
                  }`}
                >
                  {isSpeaking && speakingLang === 'ar' ? (
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Pause className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  عربي
                </button>
                <button
                  onClick={() => {
                    if (isSpeaking && speakingLang === 'en') {
                      stopSpeaking();
                    } else {
                      speakDua(selectedDua.english, 'en');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isSpeaking && speakingLang === 'en'
                      ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C]'
                      : 'bg-[#E5E1D8]/50 text-[#6B7280] dark:bg-[#2D3E34]/50 dark:text-[#9CA3AF] hover:bg-[#E5E1D8] dark:hover:bg-[#2D3E34]'
                  }`}
                >
                  {isSpeaking && speakingLang === 'en' ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  English
                </button>
                <button
                  onClick={() => {
                    if (isSpeaking && speakingLang === 'bn') {
                      stopSpeaking();
                    } else {
                      speakDua(selectedDua.bangla, 'bn');
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    isSpeaking && speakingLang === 'bn'
                      ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C]'
                      : 'bg-[#E5E1D8]/50 text-[#6B7280] dark:bg-[#2D3E34]/50 dark:text-[#9CA3AF] hover:bg-[#E5E1D8] dark:hover:bg-[#2D3E34]'
                  }`}
                >
                  {isSpeaking && speakingLang === 'bn' ? <Pause className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  বাংলা
                </button>
              </div>

              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <motion.div className="w-2 h-2 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]" animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.7 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]" animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.15 }} />
                    <motion.div className="w-2 h-2 rounded-full bg-[#0D4B3C] dark:bg-[#C8A951]" animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.3 }} />
                  </div>
                  <span className="text-[11px] text-[#0D4B3C] dark:text-[#C8A951] font-medium">
                    {speakingLang === 'ar' ? 'Reciting Arabic...' : speakingLang === 'en' ? 'Speaking English...' : 'বাংলায় পড়ছি...'}
                  </span>
                  <button
                    onClick={stopSpeaking}
                    className="ml-2 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              )}

              {/* Rate Control */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#9CA3AF]">Speed:</span>
                {([0.7, 1].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                      speechRate === rate
                        ? 'bg-[#C8A951] text-[#0D4B3C] dark:text-[#0D4B3C]'
                        : 'bg-[#E5E1D8]/50 text-[#9CA3AF] dark:bg-[#2D3E34] hover:bg-[#E5E1D8] dark:hover:bg-[#2D3E34]'
                    }`}
                  >
                    {rate === 0.7 ? '0.7x Learning' : '1x Normal'}
                  </button>
                )))}
              </div>
            </div>

            <Separator className="my-3" />

            {/* Language Selector */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              <Globe className="w-3.5 h-3.5 text-[#C8A951] mr-1" />
              {(['arabic', 'english', 'bangla'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCaptionLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    captionLanguage === lang
                      ? 'bg-[#0D4B3C] text-white dark:bg-[#C8A951] dark:text-[#0D4B3C] shadow-sm'
                      : 'bg-[#E5E1D8]/50 dark:bg-[#2D3E34]/50 text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E1D8] dark:hover:bg-[#2D3E34]'
                  }`}
                >
                  {lang === 'arabic' ? 'عربي' : lang === 'english' ? 'English' : 'বাংলা'}
                </button>
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={captionLanguage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="min-h-[120px] flex items-center justify-center"
              >
                {captionLanguage === 'arabic' ? (
                  <div dir="rtl" lang="ar" className="text-center w-full px-2">
                    <p className="font-arabic text-2xl text-[#0D4B3C] dark:text-[#E8E0D0] leading-[2.2]">{selectedDua.arabic}</p>
                  </div>
                ) : captionLanguage === 'english' ? (
                  <p className="text-base text-[#4A5568] dark:text-[#B0B8C0] leading-relaxed italic text-center px-2">
                    &ldquo;{selectedDua.english}&rdquo;
                  </p>
                ) : (
                  <p className="text-base text-[#4A5568] dark:text-[#B0B8C0] leading-relaxed text-center px-2">{selectedDua.bangla}</p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Reference */}
            <div className="mt-6 pt-4 border-t border-[#E5E1D8] dark:border-[#2D3E34]">
              <p className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] text-center">
                Reference: <span className="font-medium text-[#C8A951]">{selectedDua.reference}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* All Languages Preview */}
      <Card className="overflow-hidden mb-4 border border-[#E5E1D8] dark:border-[#2D3E34]">
        <CardContent className="p-5">
          <h3 className="text-xs font-semibold text-[#0D4B3C] dark:text-[#C8A951] mb-3 uppercase tracking-wider">Full Translation</h3>
          <div dir="rtl" lang="ar" className="mb-4">
            <p className="text-[10px] text-[#9CA3AF] mb-1 text-left">Arabic</p>
            <p className="font-arabic text-lg text-[#0D4B3C] dark:text-[#E8E0D0] leading-[2]">{selectedDua.arabic}</p>
          </div>
          <Separator className="my-3" />
          <div className="mb-4">
            <p className="text-[10px] text-[#9CA3AF] mb-1">English</p>
            <p className="text-sm text-[#4A5568] dark:text-[#B0B8C0] leading-relaxed">{selectedDua.english}</p>
          </div>
          <Separator className="my-3" />
          <div>
            <p className="text-[10px] text-[#9CA3AF] mb-1">বাংলা</p>
            <p className="text-sm text-[#4A5568] dark:text-[#B0B8C0] leading-relaxed">{selectedDua.bangla}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => copyDua(selectedDua)}
          className="flex-1 gap-2 border-[#C8A951]/30 text-[#0D4B3C] dark:text-[#C8A951] hover:bg-[#C8A951]/5"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Dua'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedDua(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-1 gap-2 border-[#E5E1D8] dark:border-[#2D3E34] text-[#6B7280] dark:text-[#9CA3AF]"
        >
          <ListMusic className="w-4 h-4" />
          Browse All
        </Button>
      </div>
    </div>
  );
}
