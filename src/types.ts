export type SectionId = 
  | 'wnr366'        // blog "Widoki na Raj"
  | 'rhz365'        // modlitwa "Różaniec Historii Zbawienia"
  | 'biblia365'     // czytanie Pisma Świętego i Apokryfów
  | 'ebook_wnr'     // ebook WnR365 w formie przewracanych kartek
  | 'ebook_rhz'     // ebook RHZ365 w formie przewracanych kartek
  | 'ebook_biblia'  // Biblia365 w formie przewracanych kartek
  | 'bio365';       // biografia mnie i żony w formie przewracanych kartek

export type SectionType = 'reader' | 'flipbook';

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

export interface UploadedPdf {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  sectionId: SectionId | string;
  dayNumber?: number;
  dateKey?: string;
  title: string;
  description?: string;
  uploadedAt: string;
}

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
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  avatar?: string;
}

export type AppTheme = 'light' | 'dark';

export interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
  autoSync: boolean;
  useGitHubAsPrimarySource: boolean;
  lastSyncTime?: string;
}
