import { HomePageConfig, SectionShowcaseConfig, SectionId } from '../types';
import { Feather, Cross, BookOpen, Book, Compass, Library, HeartHandshake, Image as ImageIcon } from 'lucide-react';

export const SECTION_ICONS_MAP: Record<SectionId, any> = {
  wnr365: Feather,
  wnr366: Feather,
  rhz365: Cross,
  biblia365: BookOpen,
  ebook_wnr: Book,
  ebook_rhz: Compass,
  ebook_biblia: Library,
  bio365: HeartHandshake,
  info365: Compass,
  grafika: ImageIcon
};

export const DEFAULT_HOME_PAGE_CONFIG: HomePageConfig = {
  heroTitle: 'Droga365',
  heroSubtitle: 'Roczny cykl od 25 grudnia do 24 grudnia • 7 Dzieł w Jednym Miejscu',
  introHtml: `
    <p style="font-size: 18px; line-height: 1.7; margin-bottom: 16px;">
      Witaj w <strong>Droga365</strong> – kompleksowej przestrzeni duchowej i czytelniczej, w której wiara łączy się z literaturą, modlitwą różańcową, Pismem Świętym oraz osobistym świadectwem życia.
    </p>
    <p style="font-size: 16px; line-height: 1.7; margin-bottom: 16px;">
      Roczny cykl aplikacji rozpoczyna się <strong>25 grudnia</strong> (w Uroczystość Narodzenia Pańskiego) i biegnie nieprzerwanie do <strong>24 grudnia</strong> (Wigilii). Każdego dnia otrzymujesz nową porcję strawy duchowej, rozważań, modlitw i świadectwa.
    </p>
    <p style="font-size: 15px; line-height: 1.7; color: #78350f; background: rgba(180,83,9,0.08); padding: 12px 18px; border-left: 4px solid #b45309; border-radius: 0 12px 12px 0;">
      Wybierz interesującą Cię sekcję poniżej lub kliknij w ilustrację bądź opis, aby przejść bezpośrednio do wybranego tomu.
    </p>
  `,
  showcases: [
    {
      id: 'wnr365',
      name: 'WnR365',
      badge: 'Blog Codzienny',
      shortDesc: 'Widoki na Raj – codzienne spojrzenie na świat oczami wiary, nadziei i perspektywy wieczności.',
      fullDesc: 'Codzienny zbiór głębokich rozważań, aforyzmów i medytacji. Każdego dnia nowy wpis pomagający odnaleźć Boga w codziennych situacjach i dostrzec horyzont Wieczności.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Horyzont nieba i morza – Widoki na Raj',
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
      color: '#9f1239',
      bgGradient: 'from-rose-950/20 via-rose-900/10 to-transparent',
      qrId: 'qr_bio365'
    },
    {
      id: 'grafika',
      name: 'Galeria Zasobów & Media',
      badge: 'Galeria & Ilustracje',
      shortDesc: 'Materiały graficzne, ilustracje i zasoby opublikowane przez administratora.',
      fullDesc: 'Interaktywna galeria wszystkich ilustracji, okładek, grafik okolicznościowych i plików zasobów wgranych przez administratora z możliwością edycji opisów i przeglądania w pełnej rozdzielczości.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Galeria sztuki i ilustracji',
      color: '#c026d3',
      bgGradient: 'from-fuchsia-950/20 via-fuchsia-900/10 to-transparent',
      qrId: 'qr_grafika'
    }
  ]
};

export function compressImageFile(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Nie można odczytać pliku graficznego.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Nieprawidłowy format obrazu.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/webp', quality);
        resolve(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadImageFileToServer(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('sectionId', 'info365');
    
    const res = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Server upload endpoint not available, falling back to local compression:', err);
  }

  return compressImageFile(file);
}

const STORAGE_KEY = 'drogowskazy_home_config';

export function getHomePageConfig(): HomePageConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const showcases = DEFAULT_HOME_PAGE_CONFIG.showcases.map(def => {
        const found = (parsed.showcases || []).find((s: any) => s.id === def.id);
        return found ? { ...def, ...found } : def;
      });
      
      const oldIntro = localStorage.getItem('drogowskazy_info365_intro');
      
      return {
        heroTitle: parsed.heroTitle || DEFAULT_HOME_PAGE_CONFIG.heroTitle,
        heroSubtitle: parsed.heroSubtitle || DEFAULT_HOME_PAGE_CONFIG.heroSubtitle,
        introHtml: parsed.introHtml || oldIntro || DEFAULT_HOME_PAGE_CONFIG.introHtml,
        showcases
      };
    }
  } catch (err) {
    console.error('Error reading home page config:', err);
  }

  const oldIntro = localStorage.getItem('drogowskazy_info365_intro');
  if (oldIntro) {
    return {
      ...DEFAULT_HOME_PAGE_CONFIG,
      introHtml: oldIntro
    };
  }

  return DEFAULT_HOME_PAGE_CONFIG;
}

export async function saveHomePageConfig(config: HomePageConfig, syncToRemote = true): Promise<boolean> {
  try {
    const jsonStr = JSON.stringify(config);
    localStorage.setItem(STORAGE_KEY, jsonStr);
    if (config.introHtml) {
      localStorage.setItem('drogowskazy_info365_intro', config.introHtml);
    }
    window.dispatchEvent(new CustomEvent('drogowskazy_home_config_updated', { detail: config }));

    if (syncToRemote) {
      // Send to dev server / Cloudflare API for persistence & GitHub auto-sync
      try {
        let ghConfig: any = null;
        try {
          const savedGh = localStorage.getItem('drogowskazy_github_config');
          if (savedGh) ghConfig = JSON.parse(savedGh);
        } catch {}

        await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'drogowskazy_home_config',
            entry: { homeConfig: config, title: 'Konfiguracja Strony Startowej Info365' },
            githubConfig: ghConfig?.token ? ghConfig : undefined
          })
        });
      } catch (apiErr) {
        console.warn('API sync for homeConfig failed, saved locally:', apiErr);
      }
    }
    return true;
  } catch (err: any) {
    console.error('Error saving home page config:', err);
    alert('Błąd zapisu strony startowej. Zdjęcie jest zbyt duże. Prosimy wgrać je ponownie.');
    return false;
  }
}

export function resetHomePageConfig(): HomePageConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('drogowskazy_info365_intro');
    window.dispatchEvent(new CustomEvent('drogowskazy_home_config_updated', { detail: DEFAULT_HOME_PAGE_CONFIG }));
  } catch {}
  return DEFAULT_HOME_PAGE_CONFIG;
}
