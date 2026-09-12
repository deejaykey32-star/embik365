import React, { useState } from 'react';
import { 
  SectionMeta, 
  SectionId, 
  AdminUser, 
  QrCodeItem 
} from '../types';
import { 
  Compass, 
  ArrowRight, 
  Feather, 
  Cross, 
  BookOpen, 
  Book, 
  Library, 
  HeartHandshake, 
  QrCode, 
  Download, 
  Edit3, 
  Sparkles, 
  Calendar,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { SECTIONS } from '../data/defaultSections';
import { generateAndDownloadQrBadgePng, getSavedQrCodes } from '../utils/qrCodeService';
import { ElementEditorModal } from './ElementEditorModal';

interface Info365ViewProps {
  onSelectSection: (id: SectionId) => void;
  adminUser: AdminUser | null;
  onOpenQrModal?: () => void;
}

// Section illustrations and metadata
export const SECTION_SHOWCASES: Array<{
  id: SectionId;
  name: string;
  badge: string;
  shortDesc: string;
  fullDesc: string;
  imageUrl: string;
  imageAlt: string;
  icon: any;
  color: string;
  bgGradient: string;
  qrId: string;
}> = [
  {
    id: 'wnr365',
    name: 'WnR365',
    badge: 'Blog Codzienny',
    shortDesc: 'Widoki na Raj – codzienne spojrzenie na świat oczami wiary, nadziei i perspektywy wieczności.',
    fullDesc: 'Codzienny zbiór głębokich rozważań, aforyzmów i medytacji. Każdego dnia nowy wpis pomagający odnaleźć Boga w codziennych sytuacjach i dostrzec horyzont Wieczności.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    imageAlt: 'Horyzont nieba i morza – Widoki na Raj',
    icon: Feather,
    color: '#b45309',
    bgGradient: 'from-amber-900/20 via-amber-800/10 to-transparent',
    qrId: 'qr_wnr365'
  },
  {
    id: 'rhz365',
    name: 'RHZ365',
    badge: 'Modlitwa & Różaniec',
    shortDesc: 'Różaniec Historii Zbawienia – cyfrowa medytacja różańcowa w koncepcji "IN-LOVE".',
    fullDesc: 'Unikalna modlitwa różańcowa prowadząca przez całą Historię Zbawienia. Zawiera interaktywny różaniec w 6 modelach do wyboru (RGBA i CMYK, 50+6 oraz w linii i okręgu).',
    imageUrl: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=800&auto=format&fit=crop&q=80',
    imageAlt: 'Różaniec i światło wiary',
    icon: Cross,
    color: '#0369a1',
    bgGradient: 'from-sky-900/20 via-sky-800/10 to-transparent',
    qrId: 'qr_rhz365'
  },
  {
    id: 'biblia365',
    name: 'Biblia365',
    badge: 'Słowo Boże i Apokryfy',
    shortDesc: 'Roczny plan lektury Pisma Świętego wzbogacony o bezcenne wczesnochrześcijańskie apokryfy.',
    fullDesc: 'Codzienna porcja natchnionego Słowa Bożego wraz z komentarzami i tekstami wczesnej tradycji chrześcijańskiej, pozwalająca przeczytać Biblię w rocznym cyklu.',
    imageUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop&q=80',
    imageAlt: 'Pismo Święte – otwarta księga',
    icon: BookOpen,
    color: '#15803d',
    bgGradient: 'from-emerald-900/20 via-emerald-800/10 to-transparent',
    qrId: 'qr_biblia365'
  },
  {
    id: 'ebook_wnr',
    name: 'ebook WnR365',
    badge: 'Wydanie Książkowe Flipbook',
    shortDesc: 'Księga Widoki na Raj w formie bibliofilskiego e-booka z realistycznym przewracaniem stron.',
    fullDesc: 'Zbiór wpisów bloga WnR365 zebrany w elegancki tom z pergaminową fakturą kartek, spisem treści, zakładkami oraz opcją pobrania PDF/ePUB/docx do Amazon KDP i Empik.',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80',
    imageAlt: 'Otwarty e-book Widoki na Raj',
    icon: Book,
    color: '#92400e',
    bgGradient: 'from-amber-950/20 via-amber-900/10 to-transparent',
    qrId: 'qr_ebook_wnr'
  },
  {
    id: 'ebook_rhz',
    name: 'ebook RHZ365',
    badge: 'Modlitewnik Flipbook',
    shortDesc: 'Różaniec Historii Zbawienia w formie oprawnego modlitewnika z kartkami.',
    fullDesc: 'Kompletny modlitewnik różańcowy w interfejsie książkowym. Umożliwia kontemplację tajemnic, czytanie rozważań i odmawianie różańca w skupieniu.',
    imageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
    imageAlt: 'Modlitewnik różańcowy',
    icon: Compass,
    color: '#1e40af',
    bgGradient: 'from-blue-950/20 via-blue-900/10 to-transparent',
    qrId: 'qr_ebook_rhz'
  },
  {
    id: 'ebook_biblia',
    name: 'ebook Biblia365',
    badge: 'Księga Słowa Flipbook',
    shortDesc: 'Pismo Święte i Apokryfy w bibliofilskim wydaniu z przewracanymi kartami.',
    fullDesc: 'Monumentalna edycja czytań biblijnych w pergaminowym flipbooku. Czytaj Słowo Boże jak w wielkiej księdze klasztornej z zakładkami i notatkami.',
    imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
    imageAlt: 'Złote karty Biblii',
    icon: Library,
    color: '#166534',
    bgGradient: 'from-green-950/20 via-green-900/10 to-transparent',
    qrId: 'qr_ebook_biblia'
  },
  {
    id: 'bio365',
    name: 'Bio365',
    badge: 'Autobiografia Flipbook',
    shortDesc: 'Biografia: Ja i Moja Żona – 365 dni wspomnień, miłości i świadectwa drogi małżeńskiej.',
    fullDesc: 'Osobiste świadectwo życia Dominika i jego ukochanej żony rozpisane na każdy dzień roku: wspólne chwile, przezwyciężane trudności, wdzięczność i Boże prowadzenie.',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80',
    imageAlt: 'Dłonie z obrączkami – Biografia małżeńska',
    icon: HeartHandshake,
    color: '#9f1239',
    bgGradient: 'from-rose-950/20 via-rose-900/10 to-transparent',
    qrId: 'qr_bio365'
  }
];

export const Info365View: React.FC<Info365ViewProps> = ({
  onSelectSection,
  adminUser,
  onOpenQrModal
}) => {
  // Saved custom texts for intro and sections
  const [introHtml, setIntroHtml] = useState<string>(() => {
    return localStorage.getItem('drogowskazy_info365_intro') || `
      <p style="font-size: 18px; line-height: 1.7; margin-bottom: 16px;">
        Witaj w <strong>Drogowskazach 365</strong> – kompleksowej przestrzeni duchowej i czytelniczej, w której wiara łączy się z literaturą, modlitwą różańcową, Pismem Świętym oraz osobistym świadectwem życia.
      </p>
      <p style="font-size: 16px; line-height: 1.7; margin-bottom: 16px;">
        Roczny cykl aplikacji rozpoczyna się <strong>25 grudnia</strong> (w Uroczystość Narodzenia Pańskiego) i biegnie nieprzerwanie do <strong>24 grudnia</strong> (Wigilii). Każdego dnia otrzymujesz nową porcję strawy duchowej, rozważań, modlitw i świadectwa.
      </p>
      <p style="font-size: 15px; line-height: 1.7; color: #78350f; background: rgba(180,83,9,0.08); padding: 12px 18px; border-left: 4px solid #b45309; border-radius: 0 12px 12px 0;">
        Wybierz interesującą Cię sekcję poniżej lub kliknij w ilustrację bądź opis, aby przejść bezpośrednio do wybranego tomu.
      </p>
    `;
  });

  // Editing state for WYSIWYG modal
  const [editingField, setEditingField] = useState<{
    key: string;
    label: string;
    content: string;
  } | null>(null);

  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null);

  const handleSaveIntro = (newContent: string) => {
    setIntroHtml(newContent);
    try {
      localStorage.setItem('drogowskazy_info365_intro', newContent);
    } catch {}
  };

  const handleDownloadQr = async (qrId: string, title: string) => {
    setDownloadingQrId(qrId);
    try {
      const allQrs = getSavedQrCodes();
      const match = allQrs.find(q => q.id === qrId || q.sectionId === qrId.replace('qr_', ''));
      if (match) {
        await generateAndDownloadQrBadgePng(match);
      } else {
        await generateAndDownloadQrBadgePng({
          id: qrId,
          title,
          displayLabel: `Zeskanuj, aby przejść do ${title}`,
          shortUrl: `https://widokinaraj.pl/r/${qrId.replace('qr_', '')}`,
          fullUrl: `https://widokinaraj.pl/#${qrId.replace('qr_', '')}`,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Download QR failed:', err);
    } finally {
      setDownloadingQrId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in text-[#2c2219] dark:text-[#f1f5f9]">
      
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-500/15 via-orange-500/10 to-violet-500/10 dark:from-amber-950/40 dark:via-[#131b2e] dark:to-purple-950/30 p-6 sm:p-10 border border-amber-500/30 shadow-xl mb-10">
        
        {/* Decorative corner icon */}
        <div className="absolute -right-8 -top-8 w-40 h-40 opacity-10 pointer-events-none text-amber-700 dark:text-amber-400">
          <Compass className="w-full h-full" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 dark:bg-amber-400/20 text-amber-900 dark:text-amber-200 text-xs font-bold mb-4">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>info365 • Przewodnik & Wprowadzenie do Aplikacji</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-heading-cinzel font-bold text-[#3a2717] dark:text-[#f8fafc] mb-3 leading-tight">
            Drogowskazy 365
          </h1>
          <h2 className="text-base sm:text-lg font-serif-book italic text-[#785b3a] dark:text-[#cbd5e1] mb-6">
            Roczny cykl od 25 grudnia do 24 grudnia • 7 Dzieł w Jednym Miejscu
          </h2>

          {/* Rendered Intro HTML */}
          <div 
            className="prose dark:prose-invert max-w-none text-stone-800 dark:text-stone-200"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />

          {/* Admin WYSIWYG button for Intro */}
          {adminUser && (
            <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                Administrator: Możesz edytować ten wstęp za pomocą edytora WYSIWYG
              </span>
              <button
                onClick={() => setEditingField({
                  key: 'intro',
                  label: 'Wstęp do info365',
                  content: introHtml
                })}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edytuj Wstęp (WYSIWYG)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sections Grid Overview */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl sm:text-2xl font-heading-cinzel font-bold text-[#3a2717] dark:text-[#f8fafc]">
            Przegląd Sekcji & Szybki Dostęp
          </h3>
          <p className="text-xs text-[#786756] dark:text-[#94a3b8]">
            Kliknij w ilustrację lub opis dowolnej sekcji, aby natychmiast ją otworzyć
          </p>
        </div>

        {onOpenQrModal && (
          <button
            onClick={onOpenQrModal}
            className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-[#1a2538] hover:bg-amber-500/20 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-stone-300 dark:border-stone-700"
          >
            <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Otwórz Bazę Kodów QR</span>
          </button>
        )}
      </div>

      {/* Grid of 7 Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SECTION_SHOWCASES.map((section) => {
          const IconComponent = section.icon;
          return (
            <div
              key={section.id}
              className="group flex flex-col justify-between rounded-3xl bg-white dark:bg-[#0c121e] border border-stone-200 dark:border-[#1e2a40] shadow-sm hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 overflow-hidden"
            >
              {/* Top illustration - Clickable to open section */}
              <div 
                onClick={() => onSelectSection(section.id)}
                className="relative h-44 w-full overflow-hidden cursor-pointer bg-stone-100 dark:bg-stone-900"
                title={`Kliknij, aby otworzyć sekcję ${section.name}`}
              >
                <img
                  src={section.imageUrl}
                  alt={section.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Badge on illustration */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-[#0c121e]/90 text-stone-900 dark:text-white backdrop-blur-xs shadow-xs flex items-center gap-1.5">
                    <IconComponent className="w-3.5 h-3.5 text-amber-600" />
                    <span>{section.badge}</span>
                  </span>
                </div>

                {/* Section title over image */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-lg font-heading-cinzel font-bold drop-shadow-md">
                    {section.name}
                  </h4>
                </div>
              </div>

              {/* Description body - Clickable to open section */}
              <div 
                onClick={() => onSelectSection(section.id)}
                className="p-5 flex-1 cursor-pointer flex flex-col justify-between"
                title={`Kliknij, aby otworzyć ${section.name}`}
              >
                <div>
                  <p className="font-semibold text-xs text-amber-800 dark:text-amber-300 mb-2">
                    {section.shortDesc}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-serif-book">
                    {section.fullDesc}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                  <span>Otwórz sekcję</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Bottom Card Bar: Direct Jump & QR Download */}
              <div className="px-5 py-3 bg-stone-50/80 dark:bg-[#111827] border-t border-stone-200 dark:border-[#1e2a40] flex items-center justify-between text-xs">
                
                {/* QR Code Quick Download */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadQr(section.qrId, section.name);
                  }}
                  disabled={downloadingQrId === section.qrId}
                  className="px-2.5 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                  title="Pobierz kod QR sekcji jako grafikę PNG (300 DPI do druku)"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{downloadingQrId === section.qrId ? 'Pobieranie...' : 'Kod QR (PNG)'}</span>
                </button>

                {/* Primary Button to Jump */}
                <button
                  onClick={() => onSelectSection(section.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Wejdź</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* WYSIWYG Editor Modal for Intro */}
      {editingField && (
        <ElementEditorModal
          isOpen={true}
          onClose={() => setEditingField(null)}
          title="Edycja Treści info365"
          elementLabel={editingField.label}
          initialContent={editingField.content}
          onSave={handleSaveIntro}
        />
      )}

    </div>
  );
};
