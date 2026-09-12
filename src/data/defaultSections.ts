import { SectionMeta, SectionId } from '../types';

export const SECTIONS: SectionMeta[] = [
  {
    id: 'wnr366',
    name: 'WnR366',
    shortTitle: 'Widoki na Raj',
    subtitle: 'Blog duchowy i rozważania na każdy dzień',
    type: 'reader',
    description: 'Codzienne spojrzenie na rzeczywistość oczami wiary, nadziei i perspektywy wieczności. 366 wpisów o spotkaniu Boga w codzienności.',
    badge: 'Blog 366',
    icon: 'Feather',
    accentColor: '#b45309', // amber-700
    bgGradient: 'from-amber-900/20 via-amber-800/10 to-transparent'
  },
  {
    id: 'rhz365',
    name: 'RHZ365',
    shortTitle: 'Różaniec Historii Zbawienia',
    subtitle: 'Modlitwa i kontemplacja wielkich dzieł Bożych',
    type: 'reader',
    description: 'Modlitwa różańcowa prowadząca przez całą historię zbawienia: od Stworzenia, przez Przymierza z patriarchami, tajemnice Chrystusa, aż po Nowe Jeruzalem.',
    badge: 'Modlitwa 365',
    icon: 'Cross',
    accentColor: '#0369a1', // sky-700
    bgGradient: 'from-sky-900/20 via-sky-800/10 to-transparent'
  },
  {
    id: 'biblia365',
    name: 'Biblia365',
    shortTitle: 'Pismo Święte i Apokryfy',
    subtitle: 'Czytania biblijne oraz wczesnochrześcijańskie teksty',
    type: 'reader',
    description: 'Kompletny roczny program lektury Słowa Bożego wraz z cennymi apokryfami wczesnochrześcijańskimi rzucającymi światło na tradycję biblijną.',
    badge: 'Słowo Boże',
    icon: 'BookOpen',
    accentColor: '#15803d', // emerald-700
    bgGradient: 'from-emerald-900/20 via-emerald-800/10 to-transparent'
  },
  {
    id: 'ebook_wnr',
    name: 'ebook WnR365',
    shortTitle: 'Księga Widoki na Raj',
    subtitle: 'Wydanie e-book w formie przewracanych kartek',
    type: 'flipbook',
    description: 'Interaktywny e-book z przewracanymi kartkami. Wolumin myśli, aforyzmów i medytacji bloga Widoki na Raj w formie oprawnego dzieła.',
    badge: 'Flipbook E-book',
    icon: 'Book',
    accentColor: '#92400e', // amber-800
    bgGradient: 'from-amber-950/20 via-amber-900/10 to-transparent'
  },
  {
    id: 'ebook_rhz',
    name: 'ebook RHZ365',
    shortTitle: 'Modlitewnik RHZ',
    subtitle: 'Różaniec w formie przewracanych kartek',
    type: 'flipbook',
    description: 'Wirtualny modlitewnik różańcowy. Przewracaj kartki z ilustracjami tajemnic, pieśniami, medytacjami i aktami zawierzenia.',
    badge: 'Flipbook E-book',
    icon: 'Compass',
    accentColor: '#1e40af', // blue-800
    bgGradient: 'from-blue-950/20 via-blue-900/10 to-transparent'
  },
  {
    id: 'ebook_biblia',
    name: 'ebook Biblia365',
    shortTitle: 'Księga Słowa i Apokryfów',
    subtitle: 'Biblia w formie przewracanych kartek',
    type: 'flipbook',
    description: 'Biblioteka ksiąg natchnionych i apokryfów w formacie bibliofilskiej księgi z realistycznym przewracaniem pergaminowych kart.',
    badge: 'Flipbook E-book',
    icon: 'Library',
    accentColor: '#166534', // green-800
    bgGradient: 'from-green-950/20 via-green-900/10 to-transparent'
  },
  {
    id: 'bio365',
    name: 'Bio365',
    shortTitle: 'Biografia: Ja i Moja Żona',
    subtitle: 'Wspomnienia i droga życia w formie przewracanych kartek',
    type: 'flipbook',
    description: 'Osobista, pełna miłości i wdzięczności autobiografia małżeńska Dominika i jego ukochanej żony rozpisana na 365 dni wspomnień, świadectwa i pamiątek.',
    badge: 'Autobiografia Flipbook',
    icon: 'HeartHandshake',
    accentColor: '#9f1239', // rose-800
    bgGradient: 'from-rose-950/20 via-rose-900/10 to-transparent'
  }
];

export function getSectionById(id: SectionId): SectionMeta {
  return SECTIONS.find(s => s.id === id) || SECTIONS[0];
}
