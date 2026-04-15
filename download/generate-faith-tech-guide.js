const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableLayoutType, LevelFormat, TableOfContents, SectionType,
} = require("docx");

// ──────────────────────────────────────────────────────────
// Palette: DM-1 Deep Cyan (Tech / AI / Innovation)
// ──────────────────────────────────────────────────────────
const coverPalette = {
  bg: "162235", primary: "FFFFFF", accent: "37DCF2",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", accentLine: "1B6B7A", innerLine: "C8DDE2", surface: "EDF3F5" },
};

// Body palette (light-mode)
const P = {
  primary: "0A1628", body: "1A2B40", secondary: "6878A0",
  accent: "1B6B7A", surface: "F4F8FC",
};
const c = (hex) => hex.replace("#", "");
const t = coverPalette.table;

// ──────────────────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function heading(text, level = HeadingLevel.HEADING_1) {
  const sizes = { [HeadingLevel.HEADING_1]: 32, [HeadingLevel.HEADING_2]: 28, [HeadingLevel.HEADING_3]: 24 };
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: sizes[level] || 28, color: c(P.primary), font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
  });
}

function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })],
  });
}

function bodyParaRuns(runs) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: runs,
  });
}

function boldBody(boldText, normalText) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 312 },
    children: [
      new TextRun({ text: boldText, bold: true, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text: normalText, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

function codeBlock(lines) {
  return lines.map((line, i) => new Paragraph({
    spacing: { after: 0, line: 276 },
    indent: { left: 400 },
    shading: { type: ShadingType.CLEAR, fill: "F0F4F8" },
    children: [new TextRun({ text: line, size: 20, font: { ascii: "Courier New", eastAsia: "Microsoft YaHei" }, color: "334155" })],
  }));
}

function headerCell(text) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 21, color: c(t.headerText), font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
    shading: { type: ShadingType.CLEAR, fill: c(t.headerBg) },
    borders: { top: NB, bottom: { style: BorderStyle.SINGLE, size: 2, color: c(t.accentLine) }, left: NB, right: NB },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
  });
}

function dataCell(text, idx) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, size: 21, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
    shading: { type: ShadingType.CLEAR, fill: idx % 2 === 0 ? c(t.surface) : "FFFFFF" },
    borders: { top: NB, bottom: NB, left: NB, right: NB },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
  });
}

function makeTable(headers, rows) {
  const tableRows = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: headers.map(h => headerCell(h)),
    }),
    ...rows.map((row, idx) => new TableRow({
      cantSplit: true,
      children: row.map(cell => dataCell(cell, idx)),
    })),
  ];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(t.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(t.accentLine) },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(t.innerLine) },
      insideVertical: NB,
    },
    rows: tableRows,
  });
}

// ──────────────────────────────────────────────────────────
// Cover: R4 Top Color Block (GO-1 Graphite Orange)
// ──────────────────────────────────────────────────────────
function calcTitleLayout(title, maxWidth, preferred = 40, min = 24) {
  const cw = (pt) => pt * 20;
  const cpl = (pt) => Math.floor(maxWidth / cw(pt));
  let pt = preferred;
  let lines;
  while (pt >= min) {
    const n = cpl(pt);
    if (n < 2) { pt -= 2; continue; }
    lines = splitTitle(title, n);
    if (lines.length <= 3) break;
    pt -= 2;
  }
  if (!lines || lines.length > 3) { lines = splitTitle(title, cpl(min)); pt = min; }
  return { titlePt: pt, titleLines: lines };
}

function splitTitle(title, cpl) {
  if (title.length <= cpl) return [title];
  const breakAfter = new Set([...' ,.;:!?-/ ', ...'_\u2014\u2013']);
  const lines = []; let rem = title;
  while (rem.length > cpl) {
    let brk = -1;
    for (let i = cpl; i >= Math.floor(cpl * 0.6); i--) {
      if (i < rem.length && breakAfter.has(rem[i - 1])) { brk = i; break; }
    }
    if (brk === -1) {
      const lim = Math.min(rem.length, Math.ceil(cpl * 1.3));
      for (let i = cpl + 1; i < lim; i++) {
        if (breakAfter.has(rem[i - 1])) { brk = i; break; }
      }
    }
    if (brk === -1) brk = cpl;
    lines.push(rem.slice(0, brk).trim());
    rem = rem.slice(brk).trim();
  }
  if (rem) lines.push(rem);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false, metaLineCount = 0, fixedHeight = 800, pageHeight = 16838 } = params;
  const SAFETY = 1200;
  const usable = pageHeight - SAFETY;
  const titleH = titlePt * 23 * titleLineCount;
  const subtitleH = hasSubtitle ? 500 : 0;
  const englishH = hasEnglishLabel ? 400 : 0;
  const metaH = metaLineCount * 380;
  const used = titleH + subtitleH + englishH + metaH + fixedHeight;
  const remaining = usable - used;
  const topSpacing = Math.round(remaining * 0.4);
  const bottomSpacing = Math.round(remaining * 0.25);
  return { topSpacing, bottomSpacing, midSpacing: Math.round(remaining * 0.35) };
}

// GO-1 Graphite Orange palette
const coverP = { bg: "1A2330", titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", accent: "D4875A", footerColor: "687078" };

function buildCoverR4() {
  const title = "Islamic Faith-Tech App";
  const subtitle = "Complete Technical Guide & MVP Roadmap";
  const englishLabel = "QURAN READER  |  DAILY MOTIVATION  |  WORD-FOR-WORD";
  const metaLines = [
    "Technical Architecture & Data Design",
    "API Integration & Offline Strategy",
    "Arabic Typography & MVP Roadmap",
  ];
  const footerRight = "April 2026  |  Confidential";

  const availW = 11906 - 1200 - 800;
  const { titlePt, titleLines } = calcTitleLayout(title, availW, 38, 26);
  const titleSize = titlePt * 2;

  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!subtitle, hasEnglishLabel: !!englishLabel,
    metaLineCount: metaLines.length, fixedHeight: 600,
  });

  // Color block height
  const colorBlockH = 4200;

  const children = [];

  // 1. Dynamic top whitespace
  children.push(new Paragraph({ spacing: { before: Math.max(800, spacing.topSpacing - colorBlockH) } }));

  // 2. Color block wrapper (single table)
  const blockChildren = [];

  // English label inside color block
  if (englishLabel) {
    blockChildren.push(new Paragraph({
      indent: { left: 300 }, spacing: { after: 300 },
      children: [new TextRun({ text: englishLabel, size: 18, color: "F0E8E0",
        font: { ascii: "Calibri", eastAsia: "SimHei" }, characterSpacing: 30 })],
    }));
  }

  // Title inside color block
  for (let i = 0; i < titleLines.length; i++) {
    blockChildren.push(new Paragraph({
      indent: { left: 300 },
      spacing: { after: i < titleLines.length - 1 ? 80 : 200, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: coverP.titleColor, font: { ascii: "Times New Roman", eastAsia: "SimHei" } })],
    }));
  }

  // Subtitle inside color block
  if (subtitle) {
    blockChildren.push(new Paragraph({
      indent: { left: 300 }, spacing: { after: 300 },
      children: [new TextRun({ text: subtitle, size: 24, color: coverP.subtitleColor,
        font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })],
    }));
  }

  const colorBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: colorBlockH, rule: "exact" },
      verticalAlign: "top",
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: coverP.accent },
        borders: noBorders,
        margins: { top: 400, bottom: 400, left: 0, right: 0 },
        children: blockChildren,
      })],
    })],
  });

  children.push(colorBlock);

  // 3. Meta info lines
  for (const line of metaLines) {
    children.push(new Paragraph({
      indent: { left: 1200 }, spacing: { after: 80 },
      border: { left: { style: BorderStyle.SINGLE, size: 4, color: coverP.accent, space: 10 } },
      children: [new TextRun({ text: line, size: 22, color: coverP.metaColor,
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
    }));
  }

  // 4. Bottom spacing + footer
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: 1200, right: 800 },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: coverP.accent, space: 8 } },
    spacing: { before: 200 },
    children: [new TextRun({ text: footerRight, size: 18, color: coverP.footerColor, font: { ascii: "Calibri" } })],
  }));

  // Outer wrapper
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      verticalAlign: "top",
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: coverP.bg },
        borders: noBorders,
        children,
      })],
    })],
  })];
}

// ──────────────────────────────────────────────────────────
// Page number footer helper
// ──────────────────────────────────────────────────────────
function pageNumFooter(format = "arabic") {
  const instrText = format === "roman" ? "PAGE \\* ROMAN \\* MERGEFORMAT" : "PAGE \\* arabic \\* MERGEFORMAT";
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: { ascii: "Calibri" } }),
      ],
    })],
  });
}

// ──────────────────────────────────────────────────────────
// DOCUMENT CONTENT
// ──────────────────────────────────────────────────────────

// TOC Section
const tocChildren = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 360 },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: c(P.primary) })],
  }),
  new TableOfContents("Table of Contents", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }),
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({
      text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
      italics: true, size: 18, color: "888888", font: { ascii: "Calibri" },
    })],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ──────────────────────────────────────────────────────────
// 1. EXECUTIVE SUMMARY
// ──────────────────────────────────────────────────────────
const execSummary = [
  heading("1. Executive Summary"),
  bodyPara("This technical guide provides a comprehensive architecture blueprint for building an Islamic Faith-Tech application that combines a Quran Reader with word-for-word translation functionality and a Daily Motivation feature powered by Quranic Ayahs and authenticated Sahih Hadiths. The document addresses the critical technical decisions every development team must make before writing the first line of code, from database selection to API integration strategies, and from data architecture design to Arabic typography handling."),
  bodyPara("The Islamic app ecosystem has grown significantly in recent years, with users demanding accurate, reliable, and beautifully presented religious content. Unlike generic content applications, Islamic Faith-Tech apps carry an additional responsibility of data accuracy, as errors in Quranic text or Hadith translations can have serious implications for users. This guide prioritizes authenticated data sources, offline-first architecture, and robust caching mechanisms to ensure a dependable user experience regardless of network conditions."),
  bodyPara("The core technical decisions covered in this document include choosing between Firebase and Supabase as the backend-as-a-service platform, designing a word-for-word translation JSON schema that maps each Arabic word to its corresponding translation, integrating the most reliable open-source APIs for Quran and Hadith data, implementing an offline-capable daily quote engine with local notification scheduling, and handling the complexities of Arabic script rendering including ligatures, diacritical marks, and right-to-left text direction. Each section provides actionable code examples, architectural diagrams in JSON form, and clear recommendations grounded in production-tested patterns."),
  bodyPara("The MVP roadmap at the end of this document outlines a pragmatic eight-week development plan, breaking the project into sprint-sized deliverables that a small team of two to four developers can execute. The roadmap prioritizes the core user-facing features first, including the Quran reader with word-by-word translation and the daily motivation notification system, followed by progressive enhancements such as bookmarks, progress tracking, and social sharing capabilities."),
];

// ──────────────────────────────────────────────────────────
// 2. TECHNICAL STACK: FIREBASE VS SUPABASE
// ──────────────────────────────────────────────────────────
const techStack = [
  heading("2. Technical Stack: Database Recommendation"),
  heading("2.1 Overview of Requirements", HeadingLevel.HEADING_2),
  bodyPara("Before evaluating Firebase and Supabase, it is essential to understand the specific data requirements of an Islamic Faith-Tech app. The application must store user authentication credentials, reading progress (current Surah, Ayah, Juz), bookmarked verses with optional notes, favorite Hadiths organized by collection and narrator, daily quote display preferences and notification schedules, and offline caching data for recently viewed content. The data model involves both structured relational data (user profiles, progress tracking) and document-style data (verse metadata, translation mappings)."),
  bodyPara("The ideal backend should support real-time synchronization across devices, robust offline capabilities, serverless functions for daily quote scheduling, and straightforward integration with mobile SDKs for Flutter, React Native, and Swift. Cost efficiency is also a critical consideration for MVPs and early-stage startups, as the app may experience unpredictable growth patterns driven by community sharing and seasonal usage spikes during Ramadan and Hajj periods."),

  heading("2.2 Feature-by-Feature Comparison", HeadingLevel.HEADING_2),
  makeTable(
    ["Feature", "Firebase", "Supabase", "Recommendation"],
    [
      ["Auth System", "Google, Apple, Email, Phone, Anonymous", "Email, Magic Link, OAuth, SAML", "Firebase (more sign-in options for diverse users)"],
      ["Database", "Firestore (NoSQL Document)", "PostgreSQL (Full Relational)", "Supabase (better for structured Quranic metadata)"],
      ["Real-time Sync", "Native real-time listeners", "Real-time via PostgreSQL changes", "Tie (both excellent)"],
      ["Offline Support", "Built-in Firestore cache", "Requires manual sync logic", "Firebase (out-of-the-box)"],
      ["Serverless Functions", "Cloud Functions (Node.js)", "Edge Functions (Deno/TypeScript)", "Supabase (TypeScript-first, cold-start faster)"],
      ["Pricing (Free Tier)", "1 GB storage, 50K reads/day", "500 MB DB, 2 GB bandwidth", "Supabase (PostgreSQL is more storage-efficient)"],
      ["Push Notifications", "FCM (mature, cross-platform)", "Via third-party integration", "Firebase FCM is battle-tested"],
      ["Data Modeling", "Flexible document model", "Strict schema with foreign keys", "Supabase (relationships between Surah/Ayah/Hadith)"],
      ["Cron / Scheduled Jobs", "Cloud Scheduler + Functions", "pg_cron extension", "Supabase (native pg_cron for daily quotes)"],
      ["SDK Maturity", "Excellent Flutter/React Native/Swift", "Good but younger ecosystem", "Firebase (more mature mobile SDKs)"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("2.3 Verdict: Hybrid Approach", HeadingLevel.HEADING_2),
  bodyPara("For an Islamic Faith-Tech app, the recommended approach is a hybrid architecture that leverages the strengths of both platforms. Use Firebase Authentication for its comprehensive sign-in provider support, including Anonymous authentication which allows users to explore the app before creating an account. Use Firebase Cloud Messaging (FCM) for push notifications to deliver daily motivational quotes to the user's lock screen, as this is one of the most mature cross-platform notification systems available."),
  bodyPara("However, use Supabase PostgreSQL as the primary database for all structured data storage. The relational model is fundamentally better suited for the hierarchical and interconnected nature of Quranic data. Surahs contain Ayahs, which map to word-by-word translations, which may have multiple language variants. Hadith collections contain chapters, which contain individual narrations, which chain back to narrators and source books. These many-to-many relationships are trivial to model in PostgreSQL with foreign keys and join tables, but require complex denormalization strategies in Firestore that increase the risk of data inconsistency."),
  bodyPara("Supabase also provides native pg_cron support, which is ideal for scheduling the daily verse selection logic directly in the database layer. This eliminates the need for an external cron service or a separate serverless function invocation schedule. The daily quote job can run as a simple PostgreSQL function that selects a random verse based on predefined criteria and stores the result in a daily_quotes table that the mobile app synchronizes with."),
];

// ──────────────────────────────────────────────────────────
// 3. DATA ARCHITECTURE: WORD-FOR-WORD JSON
// ──────────────────────────────────────────────────────────
const dataArch = [
  heading("3. Data Architecture: Word-for-Word Translation Schema"),
  heading("3.1 The Mapped Array Concept", HeadingLevel.HEADING_2),
  bodyPara("The word-for-word translation feature is the cornerstone of the Quran reader experience. Unlike a traditional translation that presents an entire Ayah as a single block of translated text, the word-for-word approach creates a visual mapping where each individual Arabic word is paired with its corresponding translation. This allows users to study the Quran at a granular level, understanding how each word contributes to the overall meaning of the verse."),
  bodyPara("The fundamental data structure for this feature is a mapped array where each element represents a single word-unit containing the Arabic word, its translation, transliteration, and optional grammatical information. This array must preserve the exact word order of the original Arabic text, as reordering words to match English syntax would destroy the structural integrity of the Quranic text and confuse users who are simultaneously learning Arabic."),
  bodyPara("The UI rendering of this data structure typically uses a flex-wrap layout where each word-unit is rendered as a compact card or chip. The Arabic word appears above or beside the translation, and tapping a word may reveal additional details such as root word information, verb form, or grammatical case. This approach works naturally in Flutter (Wrap widget), React Native (flexDirection with flexWrap), and Swift UI (LazyVGrid with flexible columns)."),

  heading("3.2 JSON Schema Definition", HeadingLevel.HEADING_2),
  bodyPara("The following JSON structure defines the complete word-for-word mapping for a single Ayah. This schema is designed to be both human-readable and efficient for programmatic access. Each field serves a specific purpose in the rendering pipeline, from display logic to audio synchronization."),
  ...codeBlock([
    "{",
    '  "surah": {',
    '    "number": 1,',
    '    "name_ar": "\u0627\u0644\u0641\u0627\u062a\u062d\u0629",',
    '    "name_en": "Al-Fatihah",',
    '    "revelation_type": "Meccan",',
    '    "total_ayahs": 7',
    "  },",
    '  "ayah": {',
    '    "number": 1,',
    '    "number_in_surah": 1,',
    '    "juz": 1,',
    '    "page": 1,',
    '    "ruku": 1',
    "  },",
    '  "text_uthmani": "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u0650\u0646\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650",',
    '  "translations": {',
    '    "en_sahih": "In the name of Allah, the Most Gracious, the Most Merciful."',
    "  },",
    '  "word_by_word": [',
    "    {",
    '      "id": 1,',
    '      "position": 1,',
    '      "arabic": "\u0628\u0650\u0633\u0652\u0645\u0650",',
    '      "transliteration": "Bismi",',
    '      "translation_en": "In the name of",',
    '      "word_type": "noun",',
    '      "root": "\u0628 \u0633 \u0645"',
    "    },",
    "    {",
    '      "id": 2,',
    '      "position": 2,',
    '      "arabic": "\u0627\u0644\u0644\u0651\u064e\u0647\u0650",',
    '      "transliteration": "Allahi",',
    '      "translation_en": "Allah",',
    '      "word_type": "proper_noun",',
    '      "root": "\u0627 \u0644 \u0647"',
    "    }",
    "  ]",
    "}",
  ]),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("3.3 Schema Field Reference", HeadingLevel.HEADING_2),
  makeTable(
    ["Field", "Type", "Purpose"],
    [
      ["id", "Integer", "Unique identifier for each word-unit within the Ayah"],
      ["position", "Integer", "Zero-indexed position preserving original Arabic word order"],
      ["arabic", "String (Unicode)", "The Arabic word in Uthmani script with full diacritical marks (tashkeel)"],
      ["transliteration", "String", "Romanized Arabic pronunciation for non-Arabic speakers"],
      ["translation_en", "String", "English meaning of the individual word, not the full Ayah"],
      ["word_type", "Enum", "Grammatical classification: noun, verb, particle, proper_noun, pronoun"],
      ["root", "String", "Triliteral or quadriliteral root consonants for morphological study"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("3.4 Database Table Design (Supabase PostgreSQL)", HeadingLevel.HEADING_2),
  bodyPara("The following SQL schema defines the core tables in Supabase for storing word-for-word translation data. The schema normalizes the data into separate tables for Surahs, Ayahs, and word mappings, enabling efficient queries for any level of granularity. A user can request a full Surah, a single Ayah, or drill down to individual word analysis, all using standard SQL joins."),
  ...codeBlock([
    "CREATE TABLE surahs (",
    "  id        SERIAL PRIMARY KEY,",
    "  number    INTEGER UNIQUE NOT NULL,",
    "  name_ar   TEXT NOT NULL,",
    "  name_en   TEXT NOT NULL,",
    "  revelation_type TEXT CHECK (revelation_type IN ('Meccan','Medinan')),",
    "  total_ayahs   INTEGER NOT NULL,",
    "  created_at    TIMESTAMPTZ DEFAULT now()",
    ");",
    "",
    "CREATE TABLE ayahs (",
    "  id              SERIAL PRIMARY KEY,",
    "  surah_id        INTEGER REFERENCES surahs(id),",
    "  number_in_surah INTEGER NOT NULL,",
    "  juz             INTEGER NOT NULL,",
    "  page            INTEGER NOT NULL,",
    "  text_uthmani    TEXT NOT NULL,",
    "  created_at      TIMESTAMPTZ DEFAULT now(),",
    "  UNIQUE(surah_id, number_in_surah)",
    ");",
    "",
    "CREATE TABLE word_mappings (",
    "  id              SERIAL PRIMARY KEY,",
    "  ayah_id         INTEGER REFERENCES ayahs(id) ON DELETE CASCADE,",
    "  position        INTEGER NOT NULL,",
    "  arabic          TEXT NOT NULL,",
    "  transliteration TEXT,",
    "  translation_en  TEXT NOT NULL,",
    "  word_type       TEXT,",
    "  root            TEXT,",
    "  UNIQUE(ayah_id, position)",
    ");",
    "",
    "-- Index for fast verse lookups",
    "CREATE INDEX idx_ayahs_surah ON ayahs(surah_id);",
    "CREATE INDEX idx_words_ayah ON word_mappings(ayah_id);",
  ]),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("3.5 UI Rendering Strategy", HeadingLevel.HEADING_2),
  bodyPara("The word-by-word data maps directly to a flex-wrap layout in all three target platforms. In Flutter, use a Wrap widget with spacing and runSpacing to create a flowing grid of word chips. Each chip is a Container or Card widget with the Arabic word on top and the translation below, separated by a thin divider. The Wrap widget automatically handles line breaks when the horizontal space is exhausted, ensuring words never clip or overflow the screen boundaries."),
  bodyPara("In React Native, achieve the same effect using a View with flexDirection set to 'row' and flexWrap set to 'wrap'. Each word-unit is a TouchableOpacity wrapped around a small card component. The key advantage of this approach is that it naturally adapts to different screen sizes and orientations, from narrow phone screens in portrait mode to wide tablet screens in landscape mode. The translation text beneath each Arabic word should use a smaller font size and a lighter color to create a clear visual hierarchy without overwhelming the user with information."),
  bodyPara("In SwiftUI, use a LazyVGrid with FlexibleGridItem or a custom Layout that implements flow-based wrapping. SwiftUI's Layout protocol (available in iOS 16+) allows you to create a custom FlowLayout that sizes and positions child views in a wrapping grid pattern, similar to CSS flex-wrap. Each word-unit becomes a small VStack containing the Arabic Text view and the translation Text view, with tap gestures to reveal additional morphological details."),
];

// ──────────────────────────────────────────────────────────
// 4. API INTEGRATION
// ──────────────────────────────────────────────────────────
const apiIntegration = [
  heading("4. API Integration: Quran & Hadith Data Sources"),
  heading("4.1 API Evaluation Criteria", HeadingLevel.HEADING_2),
  bodyPara("Selecting the right API for Islamic content requires careful evaluation against criteria that go beyond typical API assessment. For a Quran reader, data accuracy is paramount. The API must provide text in the Uthmani script (the standard text of the Quran used in Mushafs worldwide) with proper diacritical marks (tashkeel), including fatha, kasra, damma, sukun, shadda, and tanween. Any API that strips or simplifies these marks is unsuitable for a serious Quran study application."),
  bodyPara("Additional critical evaluation criteria include the availability of authenticated word-by-word translations (not just full-Ayah translations), multiple recitation audio URLs aligned with the text, reliable uptime and response times under load (especially during Ramadan when traffic spikes), clear licensing terms (the Quran text itself is public domain, but translations may have copyright restrictions), and active maintenance with regular updates to correct any reported errors in the data."),
  bodyPara("The three APIs recommended below have been selected based on their track record of reliability, data completeness, community trust, and direct usage by major Islamic apps including Muslim Pro, Quran.com, and Ayah. Each serves a slightly different purpose in the application architecture, and the recommended approach is to use them complementarily rather than choosing just one."),

  heading("4.2 Quran.com API (Primary Recommendation)", HeadingLevel.HEADING_2),
  bodyPara("The Quran.com API (api.quran.com) is the gold standard for modern Quranic applications and is maintained by the same team behind the most popular Quran website globally. It provides comprehensive coverage of the entire Quran including Uthmani text, over 100 translations in 40+ languages, word-by-word translations with morphological data, multiple recitation audio files from renowned Qaris, and Surah and Ayah metadata including Juz, Hizb, Manzil, Ruku, and Sajdah markers."),
  makeTable(
    ["Endpoint", "Description", "Key Response Fields"],
    [
      ["/v4/chapters/{id}", "Surah metadata and info", "name_simple, name_arabic, revelation_place, verses_count"],
      ["/v4/verses/by_chapter/{id}", "All verses in a Surah", "verse_key, text_uthmani, translations, transliteration"],
      ["/v4/verses/by_key/{key}", "Single verse by key (e.g. 1:1)", "text_uthmani, words[], translations[]"],
      ["/v4/recitations/{id}/by_chapter/{id}", "Audio recitations per Surah", "audio_url, reciter_name"],
      ["/v4/word_translations/{id}", "Word-by-word translations", "arabic, translation, transliteration"],
      ["/v4/resources/translations", "List available translations", "id, name, language_name, author_name"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  bodyPara("A critical advantage of the Quran.com API is its word-level granularity. The /v4/word_translations endpoint returns each word with its position in the Ayah, its Arabic form, and its translation. This eliminates the need for custom word-parsing logic and ensures that the word-by-word display is consistent with the authoritative source. The API also supports pagination and field filtering, allowing the app to fetch only the data it needs and reduce bandwidth consumption on mobile networks."),

  heading("4.3 Alquran.cloud API (Secondary Recommendation)", HeadingLevel.HEADING_2),
  bodyPara("Alquran.cloud (alquran.cloud/api) serves as an excellent secondary API, particularly strong for metadata queries and cross-referencing. Its clean RESTful design makes it straightforward to integrate, and it provides comprehensive Surah metadata including revelation type, verse count, and structural divisions. The API supports JSON responses by default, making it easy to parse in any mobile framework."),
  bodyPara("The key strength of Alquran.cloud is its edition system. Each request can specify an edition identifier to retrieve the Quran text in different scripts (Uthmani, Simple, Warsh) and different translations (Sahih International, Yusuf Ali, Pickthall, and dozens more in languages including Urdu, Malay, French, Turkish, and Indonesian). This makes it particularly useful for apps that need to support multiple translation languages. The /edition endpoint returns a complete catalog of all available editions, allowing the app to dynamically build a language selection interface."),
  bodyPara("For the Daily Motivation feature, Alquran.cloud provides a /random endpoint that returns a random Ayah with its translation in the specified edition. While this endpoint is convenient for prototyping, the production implementation should use a server-side scheduled job (covered in Section 5) rather than relying on client-side random API calls, because the random endpoint may return the same verse on consecutive calls during high-traffic periods, and it requires an active network connection each time the app requests a new quote."),

  heading("4.4 Sunnah.com API (Hadith Data)", HeadingLevel.HEADING_2),
  bodyPara("For Hadith data, the Sunnah.com API (sunnah.com/api) is the definitive open-source resource, providing access to the most authenticated Hadith collections in Islam. The API covers all six major Hadith collections (Kutub al-Sittah) including Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Sunan al-Tirmidhi, Sunan al-Nasai, and Sunan Ibn Majah, along with additional collections such as Riyad as-Salihin, Bulugh al-Maram, and Al-Adab al-Mufrad."),
  bodyPara("The data structure returned by the Sunnah.com API includes the collection name, book number within the collection, chapter name and number, the Hadith text in both Arabic and English, the narrator chain (isnad/sanad), the Hadith grade or authentication status where available, and reference numbers for cross-referencing with printed editions. This level of detail is essential for a Faith-Tech app because users expect to verify the authenticity and source of every Hadith they read."),
  makeTable(
    ["Endpoint", "Description", "Use Case"],
    [
      ["/v1/collections", "List all available Hadith collections", "Build collection browser UI"],
      ["/v1/collections/{name}/books", "List books within a collection", "Chapter-level navigation"],
      ["/v1/hadiths/{urn}", "Single Hadith by URN", "Display specific Hadith detail"],
      ["/v1/collections/{name}/hadiths", "Paginated Hadiths from collection", "Scrolling feed of Hadiths"],
      ["/v1/hadiths/random", "Random Hadith from any collection", "Daily motivation feature"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("4.5 Recommended API Strategy", HeadingLevel.HEADING_2),
  bodyPara("The production API strategy should use a layered caching architecture to minimize direct API calls and ensure offline availability. The first layer is a pre-populated local SQLite or Hive database that ships with the app binary, containing the complete Quran text (Uthmani), all Surah and Ayah metadata, and at minimum the Sahih International English translation. This ensures the core Quran reading experience works immediately without any network calls."),
  bodyPara("The second layer is an in-memory LRU cache for recently fetched data such as word-by-word translations, additional translation languages, and Hadith collections. This cache sits between the local database and the remote API, serving repeated requests from memory for maximum speed. The third layer is the remote API itself, used for fetching data not included in the bundled database, such as rarely-used translations, detailed Hadith narrator chains, and audio recitation files. All API responses should be written back to the local database so that the cached data grows over time and the user needs fewer network calls as they continue using the app."),
];

// ──────────────────────────────────────────────────────────
// 5. DAILY QUOTE ENGINE
// ──────────────────────────────────────────────────────────
const dailyQuote = [
  heading("5. Daily Quote Engine: Fetch, Cache & Offline Logic"),
  heading("5.1 Architecture Overview", HeadingLevel.HEADING_2),
  bodyPara("The Daily Motivation feature requires a robust architecture that ensures the user receives a fresh inspirational verse or Hadith every day, even when the device is offline. The system operates on a push model rather than a pull model, meaning the app proactively delivers the quote to the user via local notifications rather than requiring the user to open the app to check for new content. This distinction is critical for user engagement, as the motivational impact of the feature is maximized when the quote appears on the lock screen during the user's morning routine."),
  bodyPara("The architecture consists of three components: a server-side scheduled job that selects the daily content, a local caching and notification system on the device, and a fallback mechanism for offline scenarios. The server-side job runs once per day (recommended at midnight UTC) and selects a verse or Hadith based on predefined criteria such as thematic variety, user preferences, and avoidance of recently shown content. The selected content is stored in a daily_quotes table in Supabase that the mobile app synchronizes with."),
  bodyPara("The local notification system uses platform-specific APIs: flutter_local_notifications for Flutter, react-native-notifications for React Native, and UNUserNotificationCenter for Swift. These APIs allow the app to schedule a local notification at the user's preferred time (e.g., 7:00 AM daily) that displays the cached quote text on the lock screen. Because the notification is local (not pushed from a server), it works reliably even without an active network connection, as long as the app has fetched and cached the quote data at least once before going offline."),

  heading("5.2 Supabase pg_cron Scheduled Job", HeadingLevel.HEADING_2),
  bodyPara("The following SQL sets up a daily scheduled job using Supabase's pg_cron extension. The job runs at midnight UTC every day, selects a random verse from the Quran that has not been shown in the past 30 days, and inserts the result into the daily_quotes table. This approach is preferable to client-side random selection because it ensures all users see the same verse on a given day (enabling shared community discussion), prevents duplicates within a rolling 30-day window, and offloads the selection logic from the mobile device."),
  ...codeBlock([
    "-- Enable pg_cron extension (one-time setup)",
    "CREATE EXTENSION IF NOT EXISTS pg_cron;",
    "",
    "-- Daily quotes table",
    "CREATE TABLE daily_quotes (",
    "  id          SERIAL PRIMARY KEY,",
    "  quote_date  DATE UNIQUE NOT NULL,",
    "  source_type TEXT CHECK (source_type IN ('quran','hadith')) NOT NULL,",
    "  surah_id    INTEGER REFERENCES surahs(id),",
    "  ayah_id     INTEGER REFERENCES ayahs(id),",
    "  hadith_urn  TEXT,",
    "  text_ar     TEXT NOT NULL,",
    "  text_en     TEXT NOT NULL,",
    "  created_at  TIMESTAMPTZ DEFAULT now()",
    ");",
    "",
    "-- Selection function",
    "CREATE OR REPLACE FUNCTION select_daily_quote()",
    "RETURNS void AS $$",
    "DECLARE",
    "  v_ayah_id INTEGER;",
    "BEGIN",
    "  SELECT a.id INTO v_ayah_id",
    "  FROM ayahs a",
    "  WHERE NOT EXISTS (",
    "    SELECT 1 FROM daily_quotes dq",
    "    WHERE dq.ayah_id = a.id",
    "    AND dq.quote_date > CURRENT_DATE - 30",
    "  )",
    "  ORDER BY random()",
    "  LIMIT 1;",
    "",
    "  INSERT INTO daily_quotes (quote_date, source_type,",
    "    surah_id, ayah_id, text_ar, text_en)",
    "  SELECT CURRENT_DATE, 'quran', a.surah_id, a.id,",
    "    a.text_uthmani, t.translation_en",
    "  FROM ayahs a",
    "  JOIN word_mappings w ON w.ayah_id = a.id AND w.position = 0",
    "  WHERE a.id = v_ayah_id",
    "  LIMIT 1;",
    "END;",
    "$$ LANGUAGE plpgsql;",
    "",
    "-- Schedule: runs daily at 00:00 UTC",
    "SELECT cron.schedule(",
    "  'daily-quran-quote',",
    "  '0 0 * * *',",
    "  'SELECT select_daily_quote();'",
    ");",
  ]),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("5.3 Flutter Implementation: useDailyQuote Hook", HeadingLevel.HEADING_2),
  bodyPara("The following Dart code implements a clean Flutter hook (using the flutter_hooks and hooks_riverpod packages) that fetches the daily quote from Supabase, caches it locally using shared_preferences for simple key-value storage and Hive for structured offline data, and schedules a local notification at the user's preferred time. The hook implements a cache-first strategy: it checks the local cache first, and only makes a network call if the cached data is stale (older than 24 hours) or missing."),
  ...codeBlock([
    "import 'package:supabase_flutter/supabase_flutter.dart';",
    "import 'package:shared_preferences/shared_preferences.dart';",
    "import 'package:flutter_local_notifications/flutter_local_notifications.dart';",
    "",
    "class DailyQuoteService {",
    "  static const _cacheKey = 'daily_quote_cache';",
    "  static const _cacheDateKey = 'daily_quote_date';",
    "",
    "  final _supabase = Supabase.instance.client;",
    "  final _notifications = FlutterLocalNotificationsPlugin();",
    "",
    "  /// Fetch today's quote (cache-first strategy)",
    "  Future<Map<String, dynamic>> getDailyQuote() async {",
    "    final prefs = await SharedPreferences.getInstance();",
    "    final cachedDate = prefs.getString(_cacheDateKey);",
    "    final today = DateTime.now().toIso8601String().split('T')[0];",
    "",
    "    // Return cached quote if still valid for today",
    "    if (cachedDate == today) {",
    "      final cached = prefs.getString(_cacheKey);",
    "      if (cached != null) return jsonDecode(cached);",
    "    }",
    "",
    "    // Fetch fresh quote from Supabase",
    "    final response = await _supabase",
    "        .from('daily_quotes')",
    "        .select('*, surahs(name_en), ayahs(text_uthmani)')",
    "        .eq('quote_date', today)",
    "        .maybeSingle();",
    "",
    "    if (response == null) {",
    "      // Fallback: fetch any recent quote",
    "      final fallback = await _supabase",
    "          .from('daily_quotes')",
    "          .select('*, surahs(name_en), ayahs(text_uthmani)')",
    "          .order('quote_date', ascending: false)",
    "          .limit(1)",
    "          .single();",
    "      await _cacheQuote(fallback, today);",
    "      return fallback;",
    "    }",
    "",
    "    await _cacheQuote(response, today);",
    "    return response;",
    "  }",
    "",
    "  Future<void> _cacheQuote(",
    "      Map<String, dynamic> quote, String date) async {",
    "    final prefs = await SharedPreferences.getInstance();",
    "    await prefs.setString(_cacheKey, jsonEncode(quote));",
    "    await prefs.setString(_cacheDateKey, date);",
    "  }",
    "",
    "  /// Schedule daily notification at preferred time",
    "  Future<void> scheduleNotification(",
    "      TimeOfDay time, Map<String, dynamic> quote) async {",
    "    await _notifications.zonedSchedule(",
    "      0,",
    "      'Daily Quran Reminder',",
    "      quote['text_en'] ?? '',",
    "      _nextInstanceOfTime(time),",
    "      const NotificationDetails(",
    "        android: AndroidNotificationDetails(",
    "          'daily_quote', 'Daily Quote',",
    "          importance: Importance.max,",
    "          priority: Priority.high,",
    "        ),",
    "        iOS: IOSNotificationDetails(),",
    "      ),",
    "      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,",
    "      matchDateTimeComponents: DateTimeComponents.time,",
    "    );",
    "  }",
    "}",
  ]),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("5.4 React Native Implementation", HeadingLevel.HEADING_2),
  bodyPara("For React Native, the equivalent implementation uses a custom hook built with React Query for data fetching and caching, combined with react-native-notifications for local notification scheduling. React Query provides built-in cache invalidation, background refetching, and stale-while-revalidate strategies that align perfectly with the daily quote use case. The hook automatically refetches the quote when the app comes to the foreground, ensuring the displayed quote is always fresh."),
  ...codeBlock([
    "import { useQuery, useMutation } from '@tanstack/react-query';",
    "import * as Notifications from 'expo-notifications';",
    "import AsyncStorage from '@react-native-async-storage/async-storage';",
    "",
    "const DAILY_QUOTE_KEY = ['dailyQuote'];",
    "const CACHE_KEY = '@faithapp/daily_quote';",
    "",
    "async function fetchDailyQuote() {",
    "  const today = new Date().toISOString().split('T')[0];",
    "  const { data, error } = await supabase",
    "    .from('daily_quotes')",
    "    .select('*, surahs(name_en)')",
    "    .eq('quote_date', today)",
    "    .single();",
    "  if (error) throw error;",
    "  return data;",
    "}",
    "",
    "export function useDailyQuote() {",
    "  return useQuery({",
    "    queryKey: DAILY_QUOTE_KEY,",
    "    queryFn: fetchDailyQuote,",
    "    staleTime: 24 * 60 * 60 * 1000, // 24 hours",
    "    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days",
    "    placeholderData: async () => {",
    "      const cached = await AsyncStorage.getItem(CACHE_KEY);",
    "      return cached ? JSON.parse(cached) : null;",
    "    },",
    "  });",
    "}",
    "",
    "// Schedule daily notification",
    "async function scheduleDailyNotification(",
    "  hour: number, quoteText: string",
    ") {",
    "  await Notifications.scheduleNotificationAsync({",
    "    content: {",
    "      title: 'Your Daily Quran Verse',",
    "      body: quoteText,",
    "      sound: true,",
    "    },",
    "    trigger: {",
    "      type: Notifications.SchedulableTriggerInputTypes.DAILY,",
    "      hour, minute: 0,",
    "    },",
    "  });",
    "}",
  ]),
  new Paragraph({ spacing: { after: 60 }, children: [] }),

  heading("5.5 Offline Fallback Strategy", HeadingLevel.HEADING_2),
  bodyPara("The offline fallback strategy ensures the Daily Motivation feature continues to function when the device has no network connectivity. The implementation follows a three-tier approach. The first tier is the bundled fallback: the app ships with a curated collection of 30-50 inspirational verses and Hadiths embedded directly in the app binary as a JSON file. This ensures the feature always has content to display, even on the very first launch before any network request has been made."),
  bodyPara("The second tier is the persistent cache. Every quote received from the API is stored in the local database (SQLite via drift, Hive, or async_storage) with its date stamp. When the device is offline and the app needs to show today's quote, it checks the cache first. If today's quote has already been fetched and cached (from a previous session when the device was online), it displays the cached version. If not, it falls back to the most recently cached quote, showing a subtle indicator that this quote was from a previous day."),
  bodyPara("The third tier is the sync queue. When the device regains network connectivity, any pending API requests (such as fetching the latest daily quote or syncing the user's reading progress) are automatically replayed from a queue. This ensures that the local database eventually converges with the server state, and the user does not lose any data or miss any quotes due to temporary network interruptions. The sync queue is implemented using a simple FIFO queue stored in the local database, processed by a background isolate or work manager task that activates when connectivity changes are detected."),
];

// ──────────────────────────────────────────────────────────
// 6. ARABIC TYPOGRAPHY
// ──────────────────────────────────────────────────────────
const arabicTypography = [
  heading("6. Arabic Typography & Ligature Handling"),
  heading("6.1 Understanding Arabic Script Complexity", HeadingLevel.HEADING_2),
  bodyPara("Arabic script presents unique typographic challenges that distinguish it from Latin-based writing systems. Unlike English letters that maintain their shape regardless of position, Arabic letters change form based on their position within a word: initial, medial, final, or isolated. This positional shaping is handled by the font's OpenType tables (GSUB and GPOS features), which substitute glyph forms based on context. The rendering engine must correctly apply these substitutions to produce visually correct text."),
  bodyPara("Ligatures are another critical aspect of Arabic typography. Certain letter combinations merge into a single glyph for aesthetic and readability reasons. The most prominent example is Lam-Alef (la), which combines the letters Lam and Alef into a single connected form. There are four variants of this ligature (Lam-Alef, Lam-Alef Hamza Above, Lam-Alef Hamza Below, Lam-Alef Madda Above), each used in different contexts. Beyond Lam-Alef, Arabic fonts may include hundreds of optional ligatures that affect the visual density and rhythm of the text."),
  bodyPara("Diacritical marks (tashkeel) add another layer of complexity. The Quran uses extensive diacritical marks including fatha (a), kasra (i), damma (u), sukun (no vowel), shadda (consonant doubling), tanween (double vowels), and various hamza forms. These marks must be precisely positioned above or below the base letters without overlapping or colliding with each other. In a word-for-word display where each word is rendered in a compact space, improper diacritical mark handling can make the text unreadable or cause visual artifacts."),

  heading("6.2 Platform-Specific Rendering Solutions", HeadingLevel.HEADING_2),

  bodyParaRuns([
    new TextRun({ text: "Flutter: ", bold: true, size: 24, color: c(P.body), font: { ascii: "Times New Roman" } }),
    new TextRun({ text: "Flutter's default text rendering engine (Impeller on mobile, Skia on desktop) handles Arabic text shaping natively, including positional forms, ligatures, and bidirectional text. For optimal results, use the Google Noto Naskh Arabic font family, which is specifically designed for screen rendering and includes comprehensive OpenType support. Load the font via pubspec.yaml and apply it with a TextStyle that sets the locale to Arabic (locale: 'ar') to activate the correct shaping rules. Avoid wrapping individual Arabic words in separate Text widgets, as this breaks the ligature and shaping context. Instead, render the entire Ayah text in a single Text widget and use TextSpan for styling variations.", size: 24, color: c(P.body), font: { ascii: "Times New Roman" } }),
  ]),

  bodyParaRuns([
    new TextRun({ text: "React Native: ", bold: true, size: 24, color: c(P.body), font: { ascii: "Times New Roman" } }),
    new TextRun({ text: "React Native relies on the platform's native text rendering: Core Text on iOS and HarfBuzz on Android (via the operating system's text stack). Both engines handle Arabic shaping correctly, but there are known issues with certain edge cases. On Android, ensure the device's Arabic font fallback chain includes a font with full OpenType support. On iOS, Core Text handles Arabic well but may produce different results depending on the specific iOS version. Use the @expo-google-fonts/noto-naskh-arabic package to ensure a consistent font across platforms, and set the textDirection prop to 'rtl' on all Arabic text containers to ensure correct alignment and cursor behavior.", size: 24, color: c(P.body), font: { ascii: "Times New Roman" } }),
  ]),

  bodyParaRuns([
    new TextRun({ text: "Swift (iOS): ", bold: true, size: 24, color: c(P.body), font: { ascii: "Times New Roman" } }),
    new TextRun({ text: "SwiftUI and UIKit both use Core Text for text rendering, which provides excellent Arabic support. Use the system font with the .arabic design or specify a custom font such as NotoNaskhArabic. In UIKit, set the paragraphStyle.baseWritingDirection to .rightToLeft. In SwiftUI, the .environment(\\.layoutDirection, .rightToLeft) modifier handles bidirectional layout. For the word-by-word view, avoid placing each word in a separate UILabel or Text view, as this prevents cross-word ligature formation. Instead, use a single Text view with AttributedString for styling, and insert soft line-break hints using Unicode U+200C (zero-width non-joiner) at word boundaries if needed.", size: 24, color: c(P.body), font: { ascii: "Times New Roman" } }),
  ]),

  heading("6.3 Preventing Unnatural Line Breaks", HeadingLevel.HEADING_2),
  bodyPara("The most common typography issue in Arabic Quran display is unnatural line breaks where a word is split across lines at a point that disrupts the ligature or separates diacritical marks from their base letter. This occurs when the text rendering engine treats the text as a sequence of independent characters rather than a shaped text stream. To prevent this, ensure that the entire Ayah text is passed to the rendering engine as a single string, and allow the engine's built-in line-breaking algorithm to determine appropriate break points."),
  bodyPara("Arabic line breaking follows different rules than English. In Arabic, breaks are generally preferred at word boundaries (spaces), but the shaping engine may also break at certain points within a word if the word is too long for the available width. To prevent intra-word breaks, insert Unicode word joiner characters (U+2060) between the base letters of long words. However, this should be done sparingly, as it prevents the engine from breaking the word at all, which may cause the text to overflow its container on narrow screens."),
  bodyPara("For the word-by-word display mode, the line-breaking problem is simplified because each word is an independent visual unit. The flex-wrap layout naturally breaks between word-units, so there is no risk of splitting a word across lines. However, ensure that the container width provides enough horizontal space for the longest Arabic word in the Quran (which varies by Surah but typically fits within 30-40% of a standard phone screen width in a 20sp font). If the word-units are too narrow, the Arabic text inside may clip; if they are too wide, the layout wastes horizontal space. A good starting point is to set each word-unit width to wrap-content with a minimum width of 80dp and a maximum width of 40% of the screen width."),

  heading("6.4 Recommended Fonts and Configuration", HeadingLevel.HEADING_2),
  makeTable(
    ["Font", "License", "Best For", "File Size"],
    [
      ["Noto Naskh Arabic", "OFL (Open)", "Screen reading, word-by-word view", "~500 KB"],
      ["Amiri", "OFL (Open)", "Quran Mushaf-style display", "~400 KB"],
      ["Scheherazade New", "OFL (Open)", "Scholarly text with full diacritics", "~350 KB"],
      ["KFGQPC Uthmanic Script", "Free (King Fahd)", "Authentic Mushaf reproduction", "~1.2 MB"],
      ["Noto Sans Arabic", "OFL (Open)", "Modern UI labels and headings", "~300 KB"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  bodyPara("The KFGQPC Uthmanic Script font from the King Fahd Complex is the most authentic choice for displaying Quranic text, as it matches the script used in printed Mushafs worldwide. However, its large file size (~1.2 MB) makes it expensive to bundle with the app. The recommended strategy is to use Noto Naskh Arabic as the default bundled font (for the word-by-word translation view and general UI text) and offer KFGQPC Uthmanic Script as a downloadable optional font for users who want the most authentic Mushaf-style reading experience."),
  bodyPara("Regardless of the chosen font, always test the rendering on multiple devices and screen sizes before release. Pay particular attention to how diacritical marks render on small screens (13sp and below) and how ligatures appear in the word-by-word mode where each word may have limited horizontal space. Devices with high DPI screens (Retina displays, 3x/4x density Android devices) generally render Arabic text more crisply than lower-density screens, so test on a range of device specifications."),
];

// ──────────────────────────────────────────────────────────
// 7. MVP ROADMAP
// ──────────────────────────────────────────────────────────
const mvpRoadmap = [
  heading("7. MVP Roadmap: Step-by-Step Development Plan"),
  heading("7.1 Phase Overview", HeadingLevel.HEADING_2),
  bodyPara("The Minimum Viable Product roadmap is designed for a team of two to four developers working in two-week sprints over an eight-week period. The roadmap prioritizes features by user impact and technical dependency order, ensuring that each sprint delivers a testable increment of the application. The core principle is to ship the essential reading experience first (Surah list, Ayah display, word-by-word translation), then add the engagement layer (daily motivation, bookmarks, progress tracking), and finally polish the experience (audio recitation, advanced search, social sharing)."),
  bodyPara("Each sprint includes a clear set of deliverables, acceptance criteria, and risk mitigation strategies. The technical architecture established in the previous sections (Supabase for data, Firebase for auth and notifications, Quran.com API for content) provides the foundation upon which each sprint builds. The roadmap assumes that the development team has intermediate-level proficiency in the chosen framework (Flutter, React Native, or Swift) and basic familiarity with REST APIs and PostgreSQL."),

  heading("7.2 Sprint 1: Foundation & Core Data Layer (Weeks 1-2)", HeadingLevel.HEADING_2),
  makeTable(
    ["Task", "Description", "Priority"],
    [
      ["Project scaffolding", "Initialize Flutter/React Native/Swift project with folder structure, state management setup (Riverpod/Redux/SwiftUI), and CI/CD pipeline", "Critical"],
      ["Supabase project setup", "Create Supabase project, configure PostgreSQL schema (surahs, ayahs, word_mappings tables), run seed scripts with Quran data", "Critical"],
      ["Firebase integration", "Configure Firebase project, enable Authentication (Email + Anonymous + Google), integrate FCM for push notifications", "High"],
      ["Quran.com API client", "Build type-safe API client with error handling, caching, and retry logic for all v4 endpoints", "Critical"],
      ["Surah list screen", "Build scrollable Surah list with Arabic names, English names, revelation type badges, and verse counts", "High"],
      ["Surah detail screen", "Build Ayah listing screen showing all verses in a Surah with basic Arabic text and translation", "High"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  bodyPara("The first sprint delivers the foundational data layer and the first user-facing screens. By the end of Sprint 1, a user should be able to launch the app, see a list of all 114 Surahs, tap a Surah to see its verses, and read each verse in Arabic with its English translation. This sprint establishes the architectural patterns (API client, state management, navigation) that all subsequent sprints will follow."),

  heading("7.3 Sprint 2: Word-for-Word Translation (Weeks 3-4)", HeadingLevel.HEADING_2),
  makeTable(
    ["Task", "Description", "Priority"],
    [
      ["Word mapping data model", "Define Dart/TypeScript models for the word_by_word JSON structure, implement parsing from API response", "Critical"],
      ["Word-by-word UI component", "Build flex-wrap word chip component displaying Arabic word above, translation below, with tap-to-expand details", "Critical"],
      ["Ayah screen redesign", "Integrate word-by-word view into the Ayah reading screen with toggle between full-text and word-by-word modes", "Critical"],
      ["Translation language switcher", "Allow users to select from available translations via the /v4/resources/translations endpoint", "Medium"],
      ["Font configuration", "Integrate Noto Naskh Arabic font, test Arabic rendering and diacritical mark display across devices", "High"],
      ["Bundled Quran database", "Embed pre-populated SQLite/Hive database with Uthmani text and Sahih translation for offline access", "High"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  bodyPara("Sprint 2 transforms the basic reader into a study tool by adding the word-for-word translation feature. By the end of this sprint, users can switch between a full-text reading mode and a word-by-word analysis mode, tap individual words to see their grammatical details, and choose from multiple available translations. The bundled offline database ensures that the core reading experience works without an internet connection."),

  heading("7.4 Sprint 3: Daily Motivation & Engagement (Weeks 5-6)", HeadingLevel.HEADING_2),
  makeTable(
    ["Task", "Description", "Priority"],
    [
      ["pg_cron daily quote job", "Implement and deploy the Supabase scheduled function that selects a daily verse and stores it in daily_quotes table", "Critical"],
      ["Daily quote service", "Build the fetch-cache-display service with cache-first strategy and offline fallback", "Critical"],
      ["Local notification scheduling", "Integrate flutter_local_notifications / expo-notifications to deliver daily quote at user's preferred time", "High"],
      ["Sunnah.com API integration", "Build Hadith API client for fetching random and categorized Hadiths from authenticated collections", "High"],
      ["Hadith display screen", "Build clean Hadith detail screen showing Arabic text, English translation, narrator chain, and source reference", "Medium"],
      ["User preferences", "Build settings screen for notification time, translation language, theme (light/dark), and reading mode preference", "Medium"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  bodyPara("Sprint 3 adds the engagement layer that differentiates the app from a simple digital Mushaf. By the end of this sprint, users receive a daily motivational verse on their lock screen, can browse Hadith collections, and customize their app experience through the settings screen. The offline fallback ensures the daily quote works even without network access, using the bundled fallback content and the persistent cache."),

  heading("7.5 Sprint 4: Polish, Analytics & Launch (Weeks 7-8)", HeadingLevel.HEADING_2),
  makeTable(
    ["Task", "Description", "Priority"],
    [
      ["Audio recitation", "Integrate Quran.com audio API for streaming recitations from popular Qaris (Mishary, Abd al-Basit, etc.)", "Medium"],
      ["Bookmark system", "Implement verse bookmarking with user authentication, sync across devices via Supabase", "High"],
      ["Reading progress tracking", "Track and display reading progress (Juz, Surah completion percentage) with persistence", "Medium"],
      ["Search functionality", "Implement full-text search across Quran text and translations using Supabase pg_trgm or Meilisearch", "Medium"],
      ["Performance optimization", "Profile and optimize list rendering, image caching, API response parsing, and database queries", "High"],
      ["UI polish and animations", "Add page transitions, loading skeletons, pull-to-refresh, and accessibility features", "Medium"],
      ["Beta testing and QA", "Internal beta testing, fix critical bugs, verify Arabic rendering on 10+ device configurations", "Critical"],
      ["App store submission", "Prepare app store listings, screenshots, privacy policy, and submit to App Store and Google Play", "Critical"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  bodyPara("The final sprint focuses on polishing the user experience and preparing the app for public launch. Audio recitation, bookmarks, and search are the most requested features in Islamic apps and significantly increase user retention. Performance optimization ensures smooth scrolling through the 6,236 Ayahs and responsive UI interactions even on lower-end devices. The sprint concludes with thorough QA testing and app store submission, marking the transition from development to maintenance and iteration."),

  heading("7.6 Post-MVP Enhancement Roadmap", HeadingLevel.HEADING_2),
  bodyPara("After the initial launch, the following features are recommended for subsequent releases based on user feedback and usage analytics. These enhancements are ordered by expected user impact and implementation complexity, with the most impactful and least complex items at the top of the list."),
  makeTable(
    ["Priority", "Feature", "Complexity", "Expected Impact"],
    [
      ["1", "Dark mode with Quran-specific color theming", "Low", "High (most requested UI feature)"],
      ["2", "Tafsir integration (Ibn Kathir, Al-Tabari)", "Medium", "High (deepens study experience)"],
      ["3", "Memorization mode with progress tracking", "Medium", "High (core user segment: Huffadh)"],
      ["4", "Community features: shared highlights and notes", "High", "Medium (social engagement driver)"],
      ["5", "AI-powered verse recommendation engine", "High", "Medium (personalization at scale)"],
      ["6", "Apple Watch and Wear OS companion app", "High", "Low (niche but dedicated user base)"],
      ["7", "Advanced Tajweed rules visualization", "High", "Medium (educational value)"],
    ]
  ),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
];

// ──────────────────────────────────────────────────────────
// ASSEMBLE DOCUMENT
// ──────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 240, after: 120, line: 312 } },
      },
      heading3: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    // Section 1: Cover (no page number, no footer)
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR4(),
    },
    // Section 2: TOC (Roman numerals)
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Islamic Faith-Tech App  |  Technical Guide", size: 18, color: "808080", font: { ascii: "Calibri" } })],
          })],
        }),
      },
      footers: { default: pageNumFooter("roman") },
      children: tocChildren,
    },
    // Section 3: Body (Arabic numerals)
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "Islamic Faith-Tech App  |  Technical Guide", size: 18, color: "808080", font: { ascii: "Calibri" } })],
          })],
        }),
      },
      footers: { default: pageNumFooter("arabic") },
      children: [
        ...execSummary,
        ...techStack,
        ...dataArch,
        ...apiIntegration,
        ...dailyQuote,
        ...arabicTypography,
        ...mvpRoadmap,
      ],
    },
  ],
});

// ──────────────────────────────────────────────────────────
// GENERATE
// ──────────────────────────────────────────────────────────
async function main() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("/home/z/my-project/download/Islamic_FaithTech_App_Technical_Guide.docx", buffer);
  console.log("Document generated successfully!");
}

main().catch(console.error);
