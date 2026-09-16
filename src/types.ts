export type SectionId = 
  | 'info365'       // Wstęp i przewodnik po sekcjach
  | 'wnr365'        // blog "Widoki na Raj"
  | 'wnr366'        // backward-compat alias
  | 'rhz365'        // modlitwa "Różaniec Historii Zbawienia"
  | 'biblia365'     // czytanie Pisma Świętego i Apokryfów
  | 'ebook_wnr'     // ebook WnR365 w formie przewracanych kartek
  | 'ebook_rhz'     // ebook RHZ365 w formie przewracanych kartek
  | 'ebook_biblia'  // Biblia365 w formie przewracanych kartek
  | 'bio365'        // biografia mnie i żony w formie przewracanych kartek
  | 'grafika';      // galeria materiałów i ilustracji administratora z edytorem WYSIWYG

export type SectionType = 'reader' | 'flipbook' | 'info';

export interface QrCodeItem {
  id: string;
  title: string;                 // Tytuł kodu QR (np. "Wpis WnR365 na dziś")
  displayLabel: string;          // Nazwa wyświetlana pod kodem QR
  shortUrl: string;              // Skrócony adres URL (przypisany na stałe)
  fullUrl: string;               // Pełny adres URL (dynamicznie zmieniany)
  sectionId?: SectionId | string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SectionMeta {
  id: SectionId;
  name: string;
  shortTitle: string;
  subtitle: string;
  type: SectionType;
  description: string;
  badge: string;
  icon: string;
  accentColor: string;
  bgGradient: string;
}

export interface SectionShowcaseConfig {
  id: SectionId;
  name: string;
  badge: string;
  shortDesc: string;
  fullDesc: string;
  imageUrl: string;
  imageAlt: string;
  color?: string;
  bgGradient?: string;
  qrId?: string;
}

export interface HomePageConfig {
  heroTitle: string;
  heroSubtitle: string;
  introHtml: string;
  showcases: SectionShowcaseConfig[];
}


export interface CycleDate {
  dayNumber: number; // 1 to 365 (or 366)
  day: number;       // 1 to 31
  month: number;     // 1 to 12 (1 = styczeń, 12 = grudzień)
  monthName: string; // "grudnia", "stycznia", etc.
  dateKey: string;   // e.g. "12-25", "01-01"
  displayDate: string; // e.g. "25 grudnia", "1 stycznia"
  isCycleStart?: boolean;
  isCycleEnd?: boolean;
  season?: string;
}

export type BookFormat = 'pdf' | 'epub' | 'docx';

export interface UploadedPdf {
  id: string;
  filename: string;
  originalName: string;
  format?: BookFormat;
  url: string;
  size: number;
  sectionId: SectionId | string;
  dayNumber?: number;
  dateKey?: string;
  title: string;
  description?: string;
  uploadedAt: string;
}

export type UploadedFile = UploadedPdf;

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'pl', name: 'Polski', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'Angielski', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Hiszpański', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Włoski', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Niemiecki', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Francuski', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Portugalski', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'uk', name: 'Ukraiński', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'la', name: 'Łacina', nativeName: 'Lingua Latina', flag: '🇻🇦' },
  { code: 'cs', name: 'Czeski', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sk', name: 'Słowacki', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'hu', name: 'Węgierski', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Rumuński', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'lt', name: 'Litewski', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'el', name: 'Grecki', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'ru', name: 'Rosyjski', nativeName: 'Русский', flag: '🌐' }
];

export interface SectionEntry {
  id: string;
  sectionId: SectionId;
  dateKey: string;
  dayNumber: number;
  title: string;
  subtitle?: string;
  passage?: string; // For Biblia365
  apocryphaPassage?: string; // For Biblia365
  mystery?: string; // For RHZ365
  intention?: string; // For RHZ365
  decade?: string; // For RHZ365
  content: string; // Main text / reflection / chapter
  prayer?: string;
  quote?: string;
  authorNotes?: string; // Especially for Bio365
  image?: string;
  pdfs?: UploadedPdf[];
  updatedAt?: string;
  homeConfig?: HomePageConfig;
  translations?: Record<string, {
    title: string;
    subtitle?: string;
    content: string;
    prayer?: string;
    mystery?: string;
    intention?: string;
    quote?: string;
  }>;
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  avatar?: string;
}

export type AppTheme = 'light' | 'dark';

export type RosaryVariant = 
  | 'full_50_rgba'    // 1. 6 dużych przezroczystych paciorków i 50 małych w modelu RGBA
  | 'full_50_cmyk'    // 2. 6 dużych przezroczystych paciorków i 50 małych w modelu CMYK
  | 'line_13_rgba'    // 3. 2 duże paciorki i 13 małych w jednej linii w modelu RGBA
  | 'line_13_cmyk'    // 4. 2 duże paciorki przezroczyste i 13 małych w jednej linii w modelu CMYK
  | 'circle_13_rgba'  // 5. 2 duże paciorki przezroczyste i 13 małych w okręgu w modelu RGBA
  | 'circle_13_cmyk'; // 6. 2 duże paciorki przezroczyste i 13 małych w okręgu w modelu CMYK

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  autoSync: boolean;
  useGitHubAsPrimarySource: boolean;
  lastSyncTime?: string;
}
