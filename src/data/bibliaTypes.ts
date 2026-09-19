export interface BibliaYearEntry {
  year: 1 | 2 | 3 | 4;
  bookTitle: string;
  chapter: number;
  totalChapters: number;
  category: string;
  passage: string;
  title: string;
  content: string;
}

export interface BibliaDayFourYears {
  year1: BibliaYearEntry;
  year2: BibliaYearEntry;
  year3: BibliaYearEntry;
  year4: BibliaYearEntry;
}
