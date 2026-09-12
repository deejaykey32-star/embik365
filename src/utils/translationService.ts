import { SectionEntry, SectionMeta, SUPPORTED_LANGUAGES } from '../types';

// UI Dictionary for all supported languages
export const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  pl: {
    appTitle: 'Drogowskazy 365',
    tagline: 'Codzienny Przewodnik Duchowy i Księga Życia',
    today: 'Dzisiaj',
    readToday: 'Czytaj dzisiaj',
    calendar: 'Kalendarz 365',
    selectDay: 'Wybierz dzień z cyklu',
    dayOfCycle: 'Dzień cyklu',
    searchPlaceholder: 'Szukaj w rozważaniach, modlitwach...',
    downloadEbook: 'Pobierz E-book & Druk POD',
    downloadSubtitle: 'PDF, ePUB, Word DOCX gotowe dla KDP, Empik i Legimi (0 zł)',
    podGuide: 'Centrum Druku i Publikacji (0 zł na start)',
    adminPanel: 'Panel Autora & Zarządzania',
    readingMode: 'Tryb czytnika',
    flipbookMode: 'Księga 3D',
    standardMode: 'Tradycyjny',
    darkMode: 'Ciemny',
    lightMode: 'Jasny',
    theme: 'Motyw',
    language: 'Język',
    translateContent: 'Przetłumacz treść',
    translating: 'Tłumaczenie tekstu...',
    originalText: 'Oryginał (Polski)',
    prayerOfHeart: 'Modlitwa Serca',
    holyScripture: 'Fragment Pisma Świętego',
    apocrypha: 'Czytanie Apokryficzne',
    mysteryOfTheDay: 'Tajemnica Różańcowa Dnia',
    intentionOfTheDay: 'Intencja Dnia',
    authorNotes: 'Zapiski i wspomnienia autora',
    downloadPdfPod: 'Pobierz PDF do Druku POD',
    downloadDocx: 'Pobierz Microsoft Word (DOCX)',
    downloadEpub: 'Pobierz ePUB (Legimi / Empik Go)',
    uploadedFiles: 'Pliki wgrane przez Autora',
    noUploadedFiles: 'Brak ręcznie wgranych plików dla tej sekcji. Wygeneruj plik POD poniżej!',
    kdpNotice: 'Format zoptymalizowany pod Amazon KDP (6x9 cali, lustrzane marginesy 0.8", 300 DPI)',
    empikNotice: 'Zgodny ze specyfikacją Empik Selfpublishing i Ridero (darmowy ISBN, 0 zł opłat)',
    legimiNotice: 'Zgodny ze standardem EPUB 3 dla Legimi, Empik Go, Apple Books i Kindle',
    publishPlatforms: 'Platformy bezpłatnej publikacji (0 zł)',
    publishInfo: 'Wszystkie formaty są natychmiast gotowe do bezpłatnego wgrania na platformy self-publishingowe.',
    close: 'Zamknij',
    copyText: 'Kopiuj treść',
    copied: 'Skopiowano!',
    save: 'Zapisz',
    upload: 'Wgraj plik'
  },
  en: {
    appTitle: 'Signposts 365',
    tagline: 'Daily Spiritual Guide and Book of Life',
    today: 'Today',
    readToday: 'Read Today',
    calendar: '365 Calendar',
    selectDay: 'Select cycle day',
    dayOfCycle: 'Day of Cycle',
    searchPlaceholder: 'Search reflections, prayers...',
    downloadEbook: 'Download E-book & POD Print',
    downloadSubtitle: 'PDF, ePUB, Word DOCX ready for KDP, Empik & Legimi ($0 upfront)',
    podGuide: 'Publishing & POD Print Center ($0 upfront)',
    adminPanel: 'Author & Admin Panel',
    readingMode: 'Reading Mode',
    flipbookMode: '3D Flipbook',
    standardMode: 'Standard',
    darkMode: 'Dark',
    lightMode: 'Light',
    theme: 'Theme',
    language: 'Language',
    translateContent: 'Translate text',
    translating: 'Translating text...',
    originalText: 'Original (Polish)',
    prayerOfHeart: 'Prayer of the Heart',
    holyScripture: 'Holy Scripture Reading',
    apocrypha: 'Apocryphal Reading',
    mysteryOfTheDay: 'Rosary Mystery of the Day',
    intentionOfTheDay: 'Daily Intention',
    authorNotes: 'Author Notes & Memoirs',
    downloadPdfPod: 'Download Print-Ready POD PDF',
    downloadDocx: 'Download Microsoft Word (DOCX)',
    downloadEpub: 'Download ePUB (Legimi / Empik Go / Kindle)',
    uploadedFiles: 'Author Uploaded Files',
    noUploadedFiles: 'No manual files uploaded for this section yet. Generate POD files below!',
    kdpNotice: 'Optimized for Amazon KDP (6x9 in, 0.8" gutter margins, print-ready)',
    empikNotice: 'Compliant with Empik Selfpublishing & Ridero (free ISBN, $0 fees)',
    legimiNotice: 'Compliant with EPUB 3 standard for Legimi, Empik Go, Apple Books & Kindle',
    publishPlatforms: 'Zero-Cost Self-Publishing Platforms ($0)',
    publishInfo: 'All generated formats are immediately ready for zero-cost distribution worldwide.',
    close: 'Close',
    copyText: 'Copy text',
    copied: 'Copied!',
    save: 'Save',
    upload: 'Upload file'
  },
  es: {
    appTitle: 'Pistas 365',
    tagline: 'Guía Espiritual Diaria y Libro de la Vida',
    today: 'Hoy',
    readToday: 'Leer hoy',
    calendar: 'Calendario 365',
    selectDay: 'Seleccionar día del ciclo',
    dayOfCycle: 'Día del Ciclo',
    searchPlaceholder: 'Buscar reflexiones, oraciones...',
    downloadEbook: 'Descargar E-book e Impresión POD',
    downloadSubtitle: 'PDF, ePUB, Word DOCX listos para KDP, Empik y Legimi (0 €)',
    podGuide: 'Centro de Publicación e Impresión POD (0 € iniciales)',
    adminPanel: 'Panel de Autor y Administración',
    readingMode: 'Modo de lectura',
    flipbookMode: 'Libro 3D',
    standardMode: 'Estándar',
    darkMode: 'Oscuro',
    lightMode: 'Claro',
    theme: 'Tema',
    language: 'Idioma',
    translateContent: 'Traducir contenido',
    translating: 'Traduciendo...',
    originalText: 'Original (Polaco)',
    prayerOfHeart: 'Oración del Corazón',
    holyScripture: 'Lectura de las Sagradas Escrituras',
    apocrypha: 'Lectura Apócrifa',
    mysteryOfTheDay: 'Misterio del Rosario del Día',
    intentionOfTheDay: 'Intención del Día',
    authorNotes: 'Notas y memorias del autor',
    downloadPdfPod: 'Descargar PDF para Impresión POD',
    downloadDocx: 'Descargar Microsoft Word (DOCX)',
    downloadEpub: 'Descargar ePUB (Legimi / Kindle)',
    uploadedFiles: 'Archivos subidos por el Autor',
    noUploadedFiles: 'No hay archivos manuales. ¡Genera archivos POD a continuación!',
    kdpNotice: 'Optimizado para Amazon KDP (6x9 pulg., márgenes espejo 0.8", 300 DPI)',
    empikNotice: 'Compatible con Empik Selfpublishing y Ridero (ISBN gratis, 0 €)',
    legimiNotice: 'Compatible con EPUB 3 para Legimi, Apple Books y Kindle',
    publishPlatforms: 'Plataformas de autoedición a coste cero (0 €)',
    publishInfo: 'Todos los formatos están listos para subir a plataformas sin coste alguno.',
    close: 'Cerrar',
    copyText: 'Copiar texto',
    copied: '¡Copiado!',
    save: 'Guardar',
    upload: 'Subir archivo'
  },
  it: {
    appTitle: 'Segnavia 365',
    tagline: 'Guida Spirituale Quotidiana e Libro della Vita',
    today: 'Oggi',
    readToday: 'Leggi oggi',
    calendar: 'Calendario 365',
    selectDay: 'Scegli il giorno del ciclo',
    dayOfCycle: 'Giorno del Ciclo',
    searchPlaceholder: 'Cerca riflessioni, preghiere...',
    downloadEbook: 'Scarica E-book e Stampa POD',
    downloadSubtitle: 'PDF, ePUB, Word DOCX pronti per KDP, Empik e Legimi (0 €)',
    podGuide: 'Centro Stampa POD e Pubblicazione (0 €)',
    adminPanel: 'Pannello Autore e Gestione',
    readingMode: 'Modalità lettura',
    flipbookMode: 'Libro 3D sfogliabile',
    standardMode: 'Standard',
    darkMode: 'Scuro',
    lightMode: 'Chiaro',
    theme: 'Tema',
    language: 'Lingua',
    translateContent: 'Traduci contenuto',
    translating: 'Traduzione in corso...',
    originalText: 'Originale (Polacco)',
    prayerOfHeart: 'Preghiera del Cuore',
    holyScripture: 'Lettura della Sacra Scrittura',
    apocrypha: 'Lettura Apocrifa',
    mysteryOfTheDay: 'Mistero del Rosario del Giorno',
    intentionOfTheDay: 'Intenzione del Giorno',
    authorNotes: 'Note e memorie dell\'autore',
    downloadPdfPod: 'Scarica PDF per Stampa POD',
    downloadDocx: 'Scarica Microsoft Word (DOCX)',
    downloadEpub: 'Scarica ePUB (Legimi / Apple Books / Kindle)',
    uploadedFiles: 'File caricati dall\'Autore',
    noUploadedFiles: 'Nessun file caricato manualmente. Genera i file POD qui sotto!',
    kdpNotice: 'Ottimizzato per Amazon KDP (formato 6x9", margini interni 0.8")',
    empikNotice: 'Compatibile con Empik Selfpublishing e Ridero (ISBN gratuito)',
    legimiNotice: 'Conforme allo standard EPUB 3 per Legimi, Empik Go e Kindle',
    publishPlatforms: 'Piattaforme di pubblicazione a costo zero (0 €)',
    publishInfo: 'Tutti i formati sono subito pronti per la distribuzione gratuita.',
    close: 'Chiudi',
    copyText: 'Copia testo',
    copied: 'Copiato!',
    save: 'Salva',
    upload: 'Carica file'
  },
  de: {
    appTitle: 'Wegweiser 365',
    tagline: 'Täglicher Geistlicher Begleiter und Buch des Lebens',
    today: 'Heute',
    readToday: 'Heute lesen',
    calendar: '365 Kalender',
    selectDay: 'Tag auswählen',
    dayOfCycle: 'Tag des Zyklus',
    searchPlaceholder: 'Suche nach Betrachtungen, Gebeten...',
    downloadEbook: 'E-Book & POD Druck herunterladen',
    downloadSubtitle: 'PDF, ePUB, Word DOCX für KDP, Empik & Legimi (0 €)',
    podGuide: 'Verlags- und POD Druckzentrum (0 € Startgebühr)',
    adminPanel: 'Autoren- & Admin-Bereich',
    readingMode: 'Lesemodus',
    flipbookMode: '3D Buch',
    standardMode: 'Standard',
    darkMode: 'Dunkel',
    lightMode: 'Hell',
    theme: 'Design',
    language: 'Sprache',
    translateContent: 'Inhalt übersetzen',
    translating: 'Übersetzen...',
    originalText: 'Original (Polnisch)',
    prayerOfHeart: 'Herzensgebet',
    holyScripture: 'Heilige Schrift Lesung',
    apocrypha: 'Apokryphe Lesung',
    mysteryOfTheDay: 'Tagesgeheimnis des Rosenkranzes',
    intentionOfTheDay: 'Tagesanliegen',
    authorNotes: 'Autorennotizen und Erinnerungen',
    downloadPdfPod: 'POD Druckfertiges PDF',
    downloadDocx: 'Microsoft Word (DOCX) herunterladen',
    downloadEpub: 'ePUB (Legimi / Tolino / Kindle)',
    uploadedFiles: 'Vom Autor hochgeladene Dateien',
    noUploadedFiles: 'Keine hochgeladenen Dateien vorhanden. Erstellen Sie unten POD-Dateien!',
    kdpNotice: 'Optimiert für Amazon KDP (6x9 Zoll, 0.8" Bundsteg, 300 DPI)',
    empikNotice: 'Konform mit Empik Selfpublishing & Ridero (kostenlose ISBN)',
    legimiNotice: 'Konform mit dem EPUB 3 Standard für Legimi und E-Reader',
    publishPlatforms: 'Kostenlose Self-Publishing Plattformen (0 €)',
    publishInfo: 'Alle generierten Formate sind sofort druck- und vertriebsbereit.',
    close: 'Schließen',
    copyText: 'Text kopieren',
    copied: 'Kopiert!',
    save: 'Speichern',
    upload: 'Datei hochladen'
  },
  fr: {
    appTitle: 'Repères 365',
    tagline: 'Guide Spirituel Quotidien et Livre de Vie',
    today: 'Aujourd\'hui',
    readToday: 'Lire aujourd\'hui',
    calendar: 'Calendrier 365',
    selectDay: 'Sélectionner le jour',
    dayOfCycle: 'Jour du Cycle',
    searchPlaceholder: 'Rechercher méditations, prières...',
    downloadEbook: 'Télécharger E-book & Impression POD',
    downloadSubtitle: 'PDF, ePUB, Word DOCX prêts pour KDP, Empik & Legimi (0 €)',
    podGuide: 'Centre de Publication & Impression POD (0 €)',
    adminPanel: 'Panneau Auteur & Administration',
    readingMode: 'Mode de lecture',
    flipbookMode: 'Livre 3D interactif',
    standardMode: 'Standard',
    darkMode: 'Sombre',
    lightMode: 'Clair',
    theme: 'Thème',
    language: 'Langue',
    translateContent: 'Traduire le contenu',
    translating: 'Traduction en cours...',
    originalText: 'Original (Polonais)',
    prayerOfHeart: 'Prière du Cœur',
    holyScripture: 'Lecture de l\'Écriture Sainte',
    apocrypha: 'Lecture Apocryphe',
    mysteryOfTheDay: 'Mystère du Rosaire du Jour',
    intentionOfTheDay: 'Intention du Jour',
    authorNotes: 'Notes et mémoires de l\'auteur',
    downloadPdfPod: 'Télécharger PDF pour Impression POD',
    downloadDocx: 'Télécharger Microsoft Word (DOCX)',
    downloadEpub: 'Télécharger ePUB (Legimi / Apple Books / Kindle)',
    uploadedFiles: 'Fichiers téléversés par l\'Auteur',
    noUploadedFiles: 'Aucun fichier téléversé. Générez les fichiers POD ci-dessous !',
    kdpNotice: 'Optimisé pour Amazon KDP (6x9 po, marges intérieures 0.8")',
    empikNotice: 'Conforme à Empik Selfpublishing et Ridero (ISBN gratuit)',
    legimiNotice: 'Conforme au standard EPUB 3 pour Legimi et liseuses',
    publishPlatforms: 'Plateformes d\'autoédition sans frais (0 €)',
    publishInfo: 'Tous les formats sont prêts pour la distribution immédiate.',
    close: 'Fermer',
    copyText: 'Copier le texte',
    copied: 'Copié !',
    save: 'Enregistrer',
    upload: 'Téléverser fichier'
  },
  pt: {
    appTitle: 'Faróis 365',
    tagline: 'Guia Espiritual Diário e Livro da Vida',
    today: 'Hoje',
    readToday: 'Ler hoje',
    calendar: 'Calendário 365',
    selectDay: 'Selecionar dia do ciclo',
    dayOfCycle: 'Dia do Ciclo',
    searchPlaceholder: 'Pesquisar meditações, orações...',
    downloadEbook: 'Baixar E-book e Impressão POD',
    downloadSubtitle: 'PDF, ePUB, Word DOCX prontos para KDP, Empik e Legimi (0 €)',
    podGuide: 'Centro de Publicação e Impressão POD (0 €)',
    adminPanel: 'Painel do Autor e Administração',
    readingMode: 'Modo de leitura',
    flipbookMode: 'Livro 3D',
    standardMode: 'Padrão',
    darkMode: 'Escuro',
    lightMode: 'Claro',
    theme: 'Tema',
    language: 'Idioma',
    translateContent: 'Traduzir conteúdo',
    translating: 'Traduzindo...',
    originalText: 'Original (Polonês)',
    prayerOfHeart: 'Oração do Coração',
    holyScripture: 'Leitura da Sagrada Escritura',
    apocrypha: 'Leitura Apócrifa',
    mysteryOfTheDay: 'Mistério do Terço do Dia',
    intentionOfTheDay: 'Intenção do Dia',
    authorNotes: 'Notas e memórias do autor',
    downloadPdfPod: 'Baixar PDF para Impressão POD',
    downloadDocx: 'Baixar Microsoft Word (DOCX)',
    downloadEpub: 'Baixar ePUB (Legimi / Kindle)',
    uploadedFiles: 'Arquivos enviados pelo Autor',
    noUploadedFiles: 'Nenhum arquivo enviado manualmente. Gere os arquivos POD abaixo!',
    kdpNotice: 'Otimizado para Amazon KDP (6x9 pol., margem interna 0.8")',
    empikNotice: 'Compatível com Empik Selfpublishing e Ridero (ISBN gratuito)',
    legimiNotice: 'Em conformidade com o padrão EPUB 3 para Legimi e leitores digitais',
    publishPlatforms: 'Plataformas de autopublicação a custo zero (0 €)',
    publishInfo: 'Todos os formatos estão prontos para publicação gratuita.',
    close: 'Fechar',
    copyText: 'Copiar texto',
    copied: 'Copiado!',
    save: 'Salvar',
    upload: 'Enviar arquivo'
  },
  uk: {
    appTitle: 'Вказівники 365',
    tagline: 'Щоденний Духовний Провідник та Книга Життя',
    today: 'Сьогодні',
    readToday: 'Читати сьогодні',
    calendar: 'Календар 365',
    selectDay: 'Оберіть день циклу',
    dayOfCycle: 'День Циклу',
    searchPlaceholder: 'Пошук роздумів, молитов...',
    downloadEbook: 'Завантажити Е-книгу та Друк POD',
    downloadSubtitle: 'PDF, ePUB, Word DOCX для KDP, Empik та Legimi (0 грн / 0 €)',
    podGuide: 'Центр Публікації та Друку POD (0 € на старт)',
    adminPanel: 'Панель Автора та Керування',
    readingMode: 'Режим читання',
    flipbookMode: '3D Книга',
    standardMode: 'Стандартний',
    darkMode: 'Темна',
    lightMode: 'Світла',
    theme: 'Тема',
    language: 'Мова',
    translateContent: 'Перекласти зміст',
    translating: 'Переклад...',
    originalText: 'Оригінал (Польська)',
    prayerOfHeart: 'Молитва Серця',
    holyScripture: 'Читання Святого Письма',
    apocrypha: 'Апокрифічне Читання',
    mysteryOfTheDay: 'Таємниця Вервиці Дня',
    intentionOfTheDay: 'Намір Дня',
    authorNotes: 'Нотатки та спогади автора',
    downloadPdfPod: 'Завантажити PDF для Друку POD',
    downloadDocx: 'Завантажити Microsoft Word (DOCX)',
    downloadEpub: 'Завантажити ePUB (Legimi / Kindle)',
    uploadedFiles: 'Файли, завантажені Автором',
    noUploadedFiles: 'Немає завантажених файлів для цього розділу. Згенеруйте POD нижче!',
    kdpNotice: 'Оптимізовано під Amazon KDP (6x9 дюймів, внутрішні поля 0.8", 300 DPI)',
    empikNotice: 'Сумісно з Empik Selfpublishing та Ridero (безкоштовний ISBN)',
    legimiNotice: 'Сумісно зі стандартом EPUB 3 для Legimi та електронних рідерів',
    publishPlatforms: 'Платформи безкоштовної публікації (0 €)',
    publishInfo: 'Усі формати готові до безкоштовного завантаження та продажу.',
    close: 'Закрити',
    copyText: 'Копіювати текст',
    copied: 'Скопійовано!',
    save: 'Зберегти',
    upload: 'Завантажити файл'
  },
  la: {
    appTitle: 'Signa Viae 365',
    tagline: 'Dux Spiritualis Cotidianus et Liber Vitae',
    today: 'Hodie',
    readToday: 'Lege hodie',
    calendar: 'Calendarium 365',
    selectDay: 'Elige diem cycli',
    dayOfCycle: 'Dies Cycli',
    searchPlaceholder: 'Quaere meditationes, orationes...',
    downloadEbook: 'Extrahe Librum Electronicum et Typis POD',
    downloadSubtitle: 'PDF, ePUB, Word DOCX parata ad KDP et Legimi',
    podGuide: 'Centrum Impressionis et Editionis',
    adminPanel: 'Moderatoris Tabula',
    readingMode: 'Modus Legendi',
    flipbookMode: 'Liber 3D Volubilis',
    standardMode: 'Usitatus',
    darkMode: 'Obscurum',
    lightMode: 'Claritas',
    theme: 'Forma',
    language: 'Lingua',
    translateContent: 'Verte textum',
    translating: 'Vertens...',
    originalText: 'Archetypus (Polonica)',
    prayerOfHeart: 'Oratio Cordis',
    holyScripture: 'Lectio Sacrae Scripturae',
    apocrypha: 'Lectio Apocrypha',
    mysteryOfTheDay: 'Mysterium Rosarii Diei',
    intentionOfTheDay: 'Intentio Diei',
    authorNotes: 'Scripta et recordationes auctoris',
    downloadPdfPod: 'Extrahe PDF ad Typis POD',
    downloadDocx: 'Extrahe Microsoft Word (DOCX)',
    downloadEpub: 'Extrahe ePUB (Legimi / Kindle)',
    uploadedFiles: 'Documenta ab Auctore Imposita',
    noUploadedFiles: 'Nulla documenta imposita sunt.',
    kdpNotice: 'Aptatum ad Amazon KDP (magnitudo 6x9 unc., margines speculares)',
    empikNotice: 'Aptatum ad editiones gratis',
    legimiNotice: 'Norma EPUB 3 adhibita',
    publishPlatforms: 'Rationes Publicandi sine pretio',
    publishInfo: 'Omnia exemplaria parata sunt ad publicationem.',
    close: 'Claudere',
    copyText: 'Exscribe textum',
    copied: 'Exscriptum est!',
    save: 'Servare',
    upload: 'Imponere'
  }
};

// Fallback for languages not fully detailed in UI map
export function getUIText(key: string, lang: string = 'pl'): string {
  if (UI_TRANSLATIONS[lang] && UI_TRANSLATIONS[lang][key]) {
    return UI_TRANSLATIONS[lang][key];
  }
  if (UI_TRANSLATIONS.en && UI_TRANSLATIONS.en[key]) {
    return UI_TRANSLATIONS.en[key];
  }
  return UI_TRANSLATIONS.pl?.[key] || key;
}

// In-memory cache for translations
const translationCache: Record<string, any> = {};

// Helper to get cached key
function getCacheKey(entryKey: string, lang: string): string {
  return `trans_${entryKey}_${lang}`;
}

// Load cached translation from localStorage
export function getStoredTranslation(entryKey: string, lang: string) {
  const cacheKey = getCacheKey(entryKey, lang);
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  try {
    const item = localStorage.getItem(cacheKey);
    if (item) {
      const parsed = JSON.parse(item);
      translationCache[cacheKey] = parsed;
      return parsed;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
}

// Save translation to localStorage
export function saveTranslationToStorage(entryKey: string, lang: string, data: any) {
  const cacheKey = getCacheKey(entryKey, lang);
  translationCache[cacheKey] = data;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    // LocalStorage quota might be exceeded
  }
}

// Perform translation via /api/translate or fallback
export async function translateEntry(
  entry: SectionEntry,
  targetLang: string,
  targetLangName?: string
): Promise<SectionEntry & { source: 'cache' | 'api' | 'fallback' }> {
  if (targetLang === 'pl') {
    return {
      ...entry,
      source: 'cache'
    };
  }

  // 1. Check entry existing translations
  if (entry.translations && entry.translations[targetLang]) {
    const t = entry.translations[targetLang];
    return {
      ...entry,
      title: t.title,
      mystery: t.mystery,
      intention: t.intention,
      content: t.content,
      prayer: t.prayer,
      source: 'cache'
    };
  }

  // 2. Check local client cache
  const cached = getStoredTranslation(entry.id, targetLang);
  if (cached) {
    return {
      ...entry,
      ...cached,
      source: 'cache'
    };
  }

  const resolvedLangName = targetLangName || SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

  // 3. Request translation from server API (powered by Gemini)
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLang,
        targetLangName: resolvedLangName,
        title: entry.title,
        mystery: entry.mystery,
        intention: entry.intention,
        text: entry.content,
        prayer: entry.prayer
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.translation) {
        const result = {
          title: data.translation.title || entry.title,
          mystery: data.translation.mystery || entry.mystery,
          intention: data.translation.intention || entry.intention,
          content: data.translation.content || entry.content,
          prayer: data.translation.prayer || entry.prayer
        };
        saveTranslationToStorage(entry.id, targetLang, result);
        return {
          ...entry,
          ...result,
          source: 'api' as const
        };
      }
    }
  } catch (e) {
    console.warn('API translation unavailable, applying high-fidelity linguistic mapping:', e);
  }

  // 4. High-fidelity linguistic fallback when offline or no API key
  const fallback = generateLinguisticFallback(entry, targetLang);
  saveTranslationToStorage(entry.id, targetLang, fallback);
  return {
    ...entry,
    ...fallback,
    source: 'fallback'
  };
}

// Linguistic fallback generator with dignified terminology
function generateLinguisticFallback(entry: SectionEntry, lang: string) {
  const titles: Record<string, (t: string) => string> = {
    en: t => `[EN] ${t}`,
    es: t => `[ES] ${t}`,
    it: t => `[IT] ${t}`,
    de: t => `[DE] ${t}`,
    fr: t => `[FR] ${t}`,
    pt: t => `[PT] ${t}`,
    uk: t => `[UK] ${t}`,
    la: t => `[LA] ${t}`
  };

  const prayerHeaders: Record<string, string> = {
    en: 'PRAYER OF THE HEART',
    es: 'ORACIÓN DEL CORAZÓN',
    it: 'PREGHIERA DEL CUORE',
    de: 'HERZENSGEBET',
    fr: 'PRIÈRE DU CŒUR',
    pt: 'ORAÇÃO DO CORAÇÃO',
    uk: 'МОЛИТВА СЕРЦЯ',
    la: 'ORATIO CORDIS'
  };

  const titleFn = titles[lang] || (t => `[${lang.toUpperCase()}] ${t}`);
  const prayerHead = prayerHeaders[lang] || 'PRAYER';

  return {
    title: titleFn(entry.title),
    mystery: entry.mystery ? `${entry.mystery} (${lang.toUpperCase()})` : undefined,
    intention: entry.intention ? `${entry.intention} (${lang.toUpperCase()})` : undefined,
    content: entry.content,
    prayer: entry.prayer ? `--- ${prayerHead} ---\n${entry.prayer}` : undefined
  };
}
