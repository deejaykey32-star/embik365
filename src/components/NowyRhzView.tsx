import React, { useState, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Share2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  QrCode, 
  ShieldCheck, 
  BookOpen, 
  ScrollText, 
  Volume2, 
  VolumeX,
  Play, 
  Calendar,
  Layers,
  Heart,
  ChevronLeft,
  ChevronRight,
  Info,
  Copy,
  Check,
  Video,
  Flame,
  CheckCircle2,
  RotateCcw,
  Square,
  Pause,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { SectionMeta } from '../types';
import { generateAndDownloadQrBadgePng } from '../utils/qrCodeService';
import { NOWY_RHZ_MYSTERIES, NowyRhzMystery } from '../data/nowyRhzData';
import { RosaryDecadeProgressTracker } from './RosaryDecadeProgressTracker';
import { VideoYouTubeExportModal } from './VideoYouTubeExportModal';
import { 
  getRadioBroadcastItem, 
  buildFullHailMary, 
  OJCZE_NASZ_PELNY, 
  CHWALA_OJCU_PELNE, 
  MODLITWA_FATIMSKA_PELNA,
  ZNAK_KRZYZ_PELNY,
  WITAJ_KROLOWO_PELNE,
  WIERZE_W_BOGA_PELNE
} from '../utils/radioContentService';
import { 
  playLectorSpeech, 
  stopLectorSpeech, 
  getLectorConfig, 
  unlockMobileAudio 
} from '../utils/audioLectorService';
import { SectionGuidePlayerBar } from './SectionGuidePlayerBar';

interface Props {
  section?: SectionMeta;
  currentLang?: string;
  theme?: 'light' | 'dark';
}

export const NowyRhzView: React.FC<Props> = ({ currentLang = 'pl', theme = 'light' }) => {
  // Tryb widoku: okno z tekstem modlitwy, aplikacja PWA, lub katalog 7 etapów
  const [activeTab, setActiveTab] = useState<'text_reader' | 'pwa_app' | 'stages'>('text_reader');

  // Bieżący dzień tajemnicy (1..175)
  const [currentDay, setCurrentDay] = useState<number>(() => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return ((diff % 175) + 1);
    } catch {
      return 1;
    }
  });

  // Stany odznaczeń modlitwy w oknie z tekstem
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Modal wideo MP4 na YouTube
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Stany iframe PWA
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const standaloneUrl = '/nowyrhz/';

  // Aktualna tajemnica z bazy 175 dni (0 = Tajemnica 0, 1..175)
  const safeDay = Math.max(0, Math.min(175, currentDay));
  const mystery: NowyRhzMystery = useMemo(() => {
    return NOWY_RHZ_MYSTERIES.find(m => m.day === safeDay) || NOWY_RHZ_MYSTERIES[0];
  }, [safeDay]);

  // Radio broadcast item dla generatora wideo MP4
  const broadcastItem = useMemo(() => {
    return getRadioBroadcastItem('nowyrhz', safeDay);
  }, [safeDay]);

  // Zakres modlitwy: 'single' (1 tajemnica), 'part' (5 tajemnic w części), 'stage' (25 tajemnic w etapie)
  const [prayerScope, setPrayerScope] = useState<'single' | 'part' | 'stage'>('single');
  const [includeIntroPrayers, setIncludeIntroPrayers] = useState<boolean>(true);

  // Wybór etapu i części dla trybów 'part' i 'stage'
  const [selectedStageNum, setSelectedStageNum] = useState<number>(() => (mystery.stage > 0 ? mystery.stage : 1));
  const [selectedPartNum, setSelectedPartNum] = useState<number>(() => (mystery.part > 0 ? mystery.part : 1));
  const [activeMysteryTabInPart, setActiveMysteryTabInPart] = useState<number>(0); // 0 = wszystkie, 1..5 = konkretna tajemnica, -1 = Tajemnica 0
  const [activePartTabInStage, setActivePartTabInStage] = useState<number>(0); // 0 = wszystkie 5 części, 1..5 = konkretna część

  // Kolejka sekwencyjnego odmawiania z lektorem
  interface SequenceItem {
    id: string;
    title: string;
    subtitle?: string;
    text: string;
    dayNumber?: number;
  }
  const [isSequencePlaying, setIsSequencePlaying] = useState<boolean>(false);
  const [sequenceQueue, setSequenceQueue] = useState<SequenceItem[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);

  // Tajemnice dla wybranej części (5 tajemnic)
  const partMysteries = useMemo(() => {
    return NOWY_RHZ_MYSTERIES.filter(m => m.stage === selectedStageNum && m.part === selectedPartNum && m.day > 0);
  }, [selectedStageNum, selectedPartNum]);

  // Tajemnice dla wybranego etapu (25 tajemnic)
  const stageMysteries = useMemo(() => {
    return NOWY_RHZ_MYSTERIES.filter(m => m.stage === selectedStageNum && m.day > 0);
  }, [selectedStageNum]);

  // Budowanie kolejki modlitw do odmawiania z lektorem
  const buildPrayerQueue = (mysteriesList: NowyRhzMystery[], withIntro: boolean): SequenceItem[] => {
    const q: SequenceItem[] = [];
    if (withIntro) {
      q.push({
        id: 'seq_t0_cross',
        title: 'Tajemnica 0 • Znak Krzyża Świętego',
        subtitle: 'Początek Różańca',
        text: ZNAK_KRZYZ_PELNY
      });
      q.push({
        id: 'seq_t0_regina',
        title: 'Tajemnica 0 • Witaj Królowo (Salve Regina)',
        subtitle: 'Antyfona Maryjna',
        text: WITAJ_KROLOWO_PELNE
      });
      q.push({
        id: 'seq_t0_credo',
        title: 'Tajemnica 0 • Skład Apostolski (Wierzę w Boga Ojca)',
        subtitle: 'Wyznanie Wiary',
        text: WIERZE_W_BOGA_PELNE
      });
      q.push({
        id: 'seq_t0_pater',
        title: 'Tajemnica 0 • Modlitwa Pańska (Ojcze nasz)',
        subtitle: 'Modlitwa Pańska',
        text: OJCZE_NASZ_PELNY
      });
      q.push({
        id: 'seq_t0_faith',
        title: 'Tajemnica 0 • Zdrowaś Maryjo – O wiarę',
        subtitle: '„który przymnaża nam wiary”',
        text: buildFullHailMary('który przymnaża nam wiary')
      });
      q.push({
        id: 'seq_t0_hope',
        title: 'Tajemnica 0 • Zdrowaś Maryjo – O nadzieję',
        subtitle: '„który przymnaża nam nadziei”',
        text: buildFullHailMary('który przymnaża nam nadziei')
      });
      q.push({
        id: 'seq_t0_love',
        title: 'Tajemnica 0 • Zdrowaś Maryjo – O miłość',
        subtitle: '„który przymnaża nam miłości”',
        text: buildFullHailMary('który przymnaża nam miłości')
      });
      q.push({
        id: 'seq_t0_glory',
        title: 'Tajemnica 0 • Modlitwa Uwielbienia (Chwała Ojcu)',
        subtitle: 'Zakończenie modlitw wstępnych',
        text: CHWALA_OJCU_PELNE
      });
    }

    mysteriesList.forEach((m, mIdx) => {
      const mNum = mIdx + 1;
      q.push({
        id: `seq_m${m.day}_intro`,
        dayNumber: m.day,
        title: `Tajemnica ${mNum}: ${m.t}`,
        subtitle: `${m.sub} • Rozważanie`,
        text: `Tajemnica ${mNum}: ${m.t}. ${m.sub}. Fragment Pisma Świętego: ${m.ref}. Rozważanie: ${m.med}`
      });
      q.push({
        id: `seq_m${m.day}_pater`,
        dayNumber: m.day,
        title: `Tajemnica ${mNum} • Ojcze nasz`,
        subtitle: 'Modlitwa Pańska',
        text: OJCZE_NASZ_PELNY
      });
      m.cl.forEach((dop, bIdx) => {
        q.push({
          id: `seq_m${m.day}_bead_${bIdx + 1}`,
          dayNumber: m.day,
          title: `Tajemnica ${mNum} • Paciorek ${bIdx + 1}/10`,
          subtitle: `„${dop}”`,
          text: buildFullHailMary(dop)
        });
      });
      q.push({
        id: `seq_m${m.day}_glory`,
        dayNumber: m.day,
        title: `Tajemnica ${mNum} • Chwała Ojcu & O mój Jezu`,
        subtitle: 'Uwielbienie & Modlitwa Fatimska',
        text: `${CHWALA_OJCU_PELNE}\n\n${MODLITWA_FATIMSKA_PELNA}`
      });
      if (m.prayer) {
        q.push({
          id: `seq_m${m.day}_prayer`,
          dayNumber: m.day,
          title: `Tajemnica ${mNum} • Modlitwa końcowa`,
          subtitle: m.partTitle,
          text: m.prayer
        });
      }
    });

    return q;
  };

  const startSequence = async (queue: SequenceItem[], startIndex = 0) => {
    unlockMobileAudio();
    stopLectorSpeech();
    setSequenceQueue(queue);
    setCurrentQueueIndex(startIndex);
    setIsSequencePlaying(true);
    playSequenceStep(queue, startIndex);
  };

  const playSequenceStep = async (queue: SequenceItem[], index: number) => {
    if (index >= queue.length) {
      setIsSequencePlaying(false);
      setActiveSpeechId(null);
      return;
    }
    const item = queue[index];
    setActiveSpeechId(item.id);
    const config = getLectorConfig();

    await playLectorSpeech({
      text: item.text,
      config,
      overrideLang: currentLang,
      onStart: () => setActiveSpeechId(item.id),
      onEnd: () => {
        setActiveSpeechId(null);
        const next = index + 1;
        if (next < queue.length) {
          setCurrentQueueIndex(next);
          playSequenceStep(queue, next);
        } else {
          setIsSequencePlaying(false);
        }
      },
      onError: () => {
        setActiveSpeechId(null);
        setTimeout(() => {
          const next = index + 1;
          if (next < queue.length) {
            setCurrentQueueIndex(next);
            playSequenceStep(queue, next);
          } else {
            setIsSequencePlaying(false);
          }
        }, 500);
      }
    });
  };

  const stopSequence = () => {
    stopLectorSpeech();
    setIsSequencePlaying(false);
    setActiveSpeechId(null);
  };

  const skipNextSequence = () => {
    if (currentQueueIndex + 1 < sequenceQueue.length) {
      stopLectorSpeech();
      const nxt = currentQueueIndex + 1;
      setCurrentQueueIndex(nxt);
      playSequenceStep(sequenceQueue, nxt);
    }
  };

  const skipPrevSequence = () => {
    if (currentQueueIndex > 0) {
      stopLectorSpeech();
      const prev = currentQueueIndex - 1;
      setCurrentQueueIndex(prev);
      playSequenceStep(sequenceQueue, prev);
    }
  };

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleResetProgress = () => {
    setCompletedSteps({});
  };

  const handleMarkAllDecade = () => {
    const updated = { ...completedSteps };
    for (let i = 1; i <= 10; i++) {
      updated[`bead_${i}`] = true;
    }
    setCompletedSteps(updated);
  };

  const speakText = async (id: string, text: string) => {
    unlockMobileAudio();
    if (activeSpeechId === id) {
      stopLectorSpeech();
      setActiveSpeechId(null);
      return;
    }
    stopLectorSpeech();
    setActiveSpeechId(id);
    const config = getLectorConfig();
    await playLectorSpeech({
      text,
      config,
      overrideLang: currentLang,
      onStart: () => setActiveSpeechId(id),
      onEnd: () => setActiveSpeechId(null),
      onError: () => setActiveSpeechId(null)
    });
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleReload = () => {
    setIframeKey(k => k + 1);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/nowyrhz/`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Nowy Różaniec Historii Zbawienia (175 dni)',
          text: '7 etapów × 5 części × 5 tajemnic = 175 dni modlitwy z dopowiedzeniami i lektorem mowy.',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    const fullUrl = `${window.location.origin}/nowyrhz/`;
    generateAndDownloadQrBadgePng({
      id: 'nowyrhz',
      title: 'Nowy Różaniec Historii Zbawienia (175 dni)',
      displayLabel: 'widokinaraj.pl/nowyrhz/',
      shortUrl: fullUrl,
      fullUrl: fullUrl,
      category: 'nowyrhz',
      createdAt: new Date().toISOString()
    });
  };

  // 7 Etapów Nowego RHZ (175 dni)
  const stages = [
    {
      num: 'I',
      title: 'Księgi Historyczne Starego Przymierza',
      days: 'Dni 1 – 25',
      desc: 'Od Stworzenia, przez Przymierze z Abrahamem, Wyjście z Egiptu i Ziemię Obiecaną, aż po Królestwo Dawida i Niewolę Babilońską.',
      parts: ['Tajemnice Początku', 'Tajemnice Wiary', 'Tajemnice Wyzwolenia', 'Tajemnice Przymierza', 'Tajemnice Królestwa'],
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    },
    {
      num: 'II',
      title: 'Księgi Mądrościowe i Modlitwy ST',
      days: 'Dni 26 – 50',
      desc: 'Mądrość serca, tajemnica cierpienia Hioba, modlitwa Psalmów, zmaganie Koheleta i mistyczna miłość Pieśni nad Pieśniami.',
      parts: ['Tajemnice Mądrości', 'Tajemnice Cierpienia i Próby', 'Tajemnice Uwielbienia (Psalmy)', 'Tajemnice Miłości Oblubieńczej', 'Tajemnice Zaufania w Przemijaniu'],
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    },
    {
      num: 'III',
      title: 'Prorocy i Zapowiedzi Mesjańskie',
      days: 'Dni 51 – 75',
      desc: 'Głos wołających na pustyni: obietnica Emmanuela, Nowego Przymierza, Cierpiącego Sługi Jahwe i Ducha wylewającego się na wszelkie ciało.',
      parts: ['Tajemnice Powołania Proroków', 'Tajemnice Sprawiedliwości i Sądu', 'Tajemnice Pocieszenia i Nadziei', 'Tajemnice Cierpiącego Sługi Jahwe', 'Tajemnice Nowego Serca i Nowego Ducha'],
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
    },
    {
      num: 'IV',
      title: 'Życie Jezusa i Maryi (Centrum Historii)',
      days: 'Dni 76 – 100',
      desc: 'Serce całego różańca: Tajemnice Radosne, Światła, Bolesne, Chwalebne oraz Tajemnice Ciszy i Ukrytego Życia w Nazarecie.',
      parts: ['Tajemnice Radosne (Wcielenie)', 'Tajemnice Światła (Objawienie Królestwa)', 'Tajemnice Bolesne (Odkupienie)', 'Tajemnice Chwalebne (Zmartwychwstanie)', 'Tajemnice Ciszy i Trwania'],
      badgeColor: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
    },
    {
      num: 'V',
      title: 'Dzieje Apostolskie i Narodziny Kościoła',
      days: 'Dni 101 – 125',
      desc: 'Zesłanie Ducha Świętego, ogień Wieczernika, pierwsze wspólnoty w Jerozolimie, męczeństwo Szczepana i misja narodów aż po krańce ziemi.',
      parts: ['Tajemnice Ognia Ducha Świętego', 'Tajemnice Pierwszej Wspólnoty', 'Tajemnice Świadectwa i Męczeństwa', 'Tajemnice Drogi do Pogan (Św. Paweł)', 'Tajemnice Kościoła w Drodze'],
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    },
    {
      num: 'VI',
      title: 'Listy Apostolskie i Życie w Chrystusie',
      days: 'Dni 126 – 150',
      desc: 'Teologia łaski, hymn o miłości, zbroja Boża, walka duchowa, życie w Duchu i codzienna wierność Ewangelii we wspólnocie.',
      parts: ['Tajemnice Łaski i Usprawiedliwienia', 'Tajemnice Ciała Chrystusa', 'Tajemnice Hymnu o Miłości', 'Tajemnice Zbroi Bożej i Walki', 'Tajemnice Nadziei i Wytrwałości'],
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
    },
    {
      num: 'VII',
      title: 'Apokalipsa i Nowe Jeruzalem',
      days: 'Dni 151 – 175',
      desc: 'Zwycięski Baranek na Tronie, pokonanie wszelkiego zła, Ostateczne Zwycięstwo Boga, Wesele Baranka oraz Nowe Niebo i Nowa Ziemia.',
      parts: ['Tajemnice Zwycięzcy i Świadka Wiernego', 'Tajemnice Baranka na Tronie', 'Tajemnice Niewiasty Obleczonej w Słońce', 'Tajemnice Wesela Baranka i Oblubienicy', 'Tajemnice Nowego Nieba i Nowej Ziemi'],
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    }
  ];

  // Mapowanie ukończonych paciorków 1..10
  const completedBeadsMap: Record<number, boolean> = {};
  for (let i = 1; i <= 10; i++) {
    completedBeadsMap[i] = !!completedSteps[`bead_${i}`];
  }
  const isIntroDone = !!(completedSteps['intro_med'] || completedSteps['intro_pater']);
  const isConclusionDone = !!(completedSteps['concl_glory'] || completedSteps['concl_fatima']);

  // Wyznaczenie aktywnego kroku lektora
  let activeStep: 'intro' | number | 'conclusion' | null = null;
  if (
    activeSpeechId === 'speech_passage' || 
    activeSpeechId === 'speech_med' || 
    activeSpeechId === 'speech_pater' ||
    activeSpeechId?.startsWith('speech_passage_') || 
    activeSpeechId?.startsWith('speech_med_') || 
    activeSpeechId?.startsWith('speech_pater_')
  ) {
    activeStep = 'intro';
  } else if (activeSpeechId?.startsWith('speech_bead_')) {
    const parts = activeSpeechId.replace('speech_bead_', '').split('_');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) activeStep = num;
  } else if (
    activeSpeechId === 'speech_glory' || 
    activeSpeechId === 'speech_fatima' || 
    activeSpeechId === 'speech_prayer' ||
    activeSpeechId?.startsWith('speech_glory_') || 
    activeSpeechId?.startsWith('speech_fatima_') || 
    activeSpeechId?.startsWith('speech_prayer_')
  ) {
    activeStep = 'conclusion';
  }

  const fontClass = 
    fontSize === 'normal' ? 'text-[12pt] leading-[1.15]' :
    fontSize === 'large' ? 'text-[14pt] leading-[1.2]' :
    'text-[16pt] leading-[1.25]';

  // Pomocnik renderowania Modlitw Wstępnych (Tajemnica 0)
  const renderTajemnicaZeroCards = () => (
    <div className="space-y-6">
      {/* Karta 1: Znak Krzyża Świętego */}
      <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0 text-lg">
              ✝️
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Początek Różańca
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                Znak Krzyża Świętego
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText('t0_cross', ZNAK_KRZYZ_PELNY)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Kopiuj modlitwę"
            >
              {copiedId === 't0_cross' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => speakText('t0_cross', ZNAK_KRZYZ_PELNY)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Odsłuchaj lektorem"
            >
              {activeSpeechId === 't0_cross' ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className={`font-serif-book font-semibold text-[#2d2217] dark:text-[#f1f5f9] ${fontClass}`}>
          {ZNAK_KRZYZ_PELNY}
        </p>
      </div>

      {/* Karta 2: Witaj Królowo (Salve Regina) */}
      <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0 text-lg">
              👑
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Antyfona Maryjna
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                Witaj Królowo (Salve Regina)
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText('t0_regina', WITAJ_KROLOWO_PELNE)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Kopiuj modlitwę"
            >
              {copiedId === 't0_regina' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => speakText('t0_regina', WITAJ_KROLOWO_PELNE)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Odsłuchaj lektorem"
            >
              {activeSpeechId === 't0_regina' ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className={`font-serif-book text-[#33261a] dark:text-[#cbd5e1] text-justify leading-relaxed ${fontClass}`}>
          {WITAJ_KROLOWO_PELNE}
        </p>
      </div>

      {/* Karta 3: Skład Apostolski (Wierzę w Boga Ojca) */}
      <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0 text-lg">
              📜
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Wyznanie Wiary (Krzyżyk Różańca)
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                Skład Apostolski (Wierzę w Boga Ojca)
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText('t0_credo', WIERZE_W_BOGA_PELNE)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Kopiuj modlitwę"
            >
              {copiedId === 't0_credo' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => speakText('t0_credo', WIERZE_W_BOGA_PELNE)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Odsłuchaj lektorem"
            >
              {activeSpeechId === 't0_credo' ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className={`font-serif-book text-[#33261a] dark:text-[#cbd5e1] text-justify leading-relaxed ${fontClass}`}>
          {WIERZE_W_BOGA_PELNE}
        </p>
      </div>

      {/* Karta 4: Modlitwa Pańska (Ojcze Nasz) */}
      <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0 text-lg">
              🙏
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Paciorek Duży Wstępny
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                Modlitwa Pańska (Ojcze nasz)
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText('t0_pater', OJCZE_NASZ_PELNY)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Kopiuj modlitwę"
            >
              {copiedId === 't0_pater' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => speakText('t0_pater', OJCZE_NASZ_PELNY)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Odsłuchaj lektorem"
            >
              {activeSpeechId === 't0_pater' ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className={`font-serif-book text-[#33261a] dark:text-[#cbd5e1] text-justify leading-relaxed ${fontClass}`}>
          {OJCZE_NASZ_PELNY}
        </p>
      </div>

      {/* Karta 5: 3 x Zdrowaś Maryjo ze wstawkami o Wiarę, Nadzieję i Miłość */}
      <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0 text-lg">
              🕊️
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                3 Małe Paciorki Wstępne o Cnoty Boskie
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                3 × Zdrowaś Maryjo z dopowiedzeniami
              </h3>
            </div>
          </div>
        </div>

        {/* 1. O wiarę */}
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
              Paciorek 1 (Niebieski) • O wiarę: „który przymnaża nam wiary”
            </span>
            <button
              onClick={() => speakText('t0_faith', buildFullHailMary('który przymnaża nam wiary'))}
              className="p-1.5 rounded-lg hover:bg-blue-600/20 text-blue-800 dark:text-blue-300 transition cursor-pointer"
            >
              {activeSpeechId === 't0_faith' ? <VolumeX className="w-4 h-4 text-blue-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <p className={`font-serif-book text-[#263238] dark:text-[#e2e8f0] text-justify leading-relaxed ${fontClass}`}>
            Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus,{' '}
            <strong className="underline decoration-blue-500 text-blue-950 dark:text-blue-200">
              który przymnaża nam wiary
            </strong>
            . Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen.
          </p>
        </div>

        {/* 2. O nadzieję */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
              Paciorek 2 (Zielony) • O nadzieję: „który przymnaża nam nadziei”
            </span>
            <button
              onClick={() => speakText('t0_hope', buildFullHailMary('który przymnaża nam nadziei'))}
              className="p-1.5 rounded-lg hover:bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 transition cursor-pointer"
            >
              {activeSpeechId === 't0_hope' ? <VolumeX className="w-4 h-4 text-emerald-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <p className={`font-serif-book text-[#1b382b] dark:text-[#e2e8f0] text-justify leading-relaxed ${fontClass}`}>
            Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus,{' '}
            <strong className="underline decoration-emerald-500 text-emerald-950 dark:text-emerald-200">
              który przymnaża nam nadziei
            </strong>
            . Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen.
          </p>
        </div>

        {/* 3. O miłość */}
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
              Paciorek 3 (Czerwony) • O miłość: „który przymnaża nam miłości”
            </span>
            <button
              onClick={() => speakText('t0_love', buildFullHailMary('który przymnaża nam miłości'))}
              className="p-1.5 rounded-lg hover:bg-rose-600/20 text-rose-800 dark:text-rose-300 transition cursor-pointer"
            >
              {activeSpeechId === 't0_love' ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
          <p className={`font-serif-book text-[#3d1e22] dark:text-[#e2e8f0] text-justify leading-relaxed ${fontClass}`}>
            Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego, Jezus,{' '}
            <strong className="underline decoration-rose-500 text-rose-950 dark:text-rose-200">
              który przymnaża nam miłości
            </strong>
            . Święta Maryjo, Matko Boża, módl się za nami grzesznymi, teraz i w godzinę śmierci naszej. Amen.
          </p>
        </div>
      </div>

      {/* Karta 6: Modlitwa Uwielbienia (Chwała Ojcu) */}
      <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0 text-lg">
              ✨
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Zakończenie Modlitw Wstępnych
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                Modlitwa Uwielbienia (Chwała Ojcu)
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText('t0_glory', CHWALA_OJCU_PELNE)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Kopiuj modlitwę"
            >
              {copiedId === 't0_glory' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => speakText('t0_glory', CHWALA_OJCU_PELNE)}
              className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              title="Odsłuchaj lektorem"
            >
              {activeSpeechId === 't0_glory' ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify leading-relaxed ${fontClass}`}>
          {CHWALA_OJCU_PELNE}
        </p>
      </div>
    </div>
  );

  // Pomocnik renderowania pojedynczej tajemnicy (Duży paciorek 1, 10 paciorków, Duży paciorek 2)
  const renderMysteryContent = (m: NowyRhzMystery, displayIdx?: number, isSingleView: boolean = true) => {
    const introDone = isSingleView ? isIntroDone : !!completedSteps[`m${m.day}_intro`];
    const conclDone = isSingleView ? isConclusionDone : !!completedSteps[`m${m.day}_concl`];
    const mysteryHeaderTitle = displayIdx !== undefined ? `Tajemnica ${displayIdx}: ${m.t}` : `${m.t}`;

    return (
      <div key={m.day} className="space-y-6">
        {/* ========================================================= */}
        {/* SEKCJA 1: ROZWAŻANIE I OJCZE NASZ (DUŻY PACIOREK 1) */}
        {/* ========================================================= */}
        <div id={`nowyrhz-step-intro-${m.day}`} className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-6 shadow-xs scroll-mt-20">
          <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Duży Paciorek I • Dzień {m.day} z 175 (Etap {m.stage}, Część {m.part})
                </div>
                <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                  {mysteryHeaderTitle} – {m.sub}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleStep(isSingleView ? 'intro_med' : `m${m.day}_intro`)}
                className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 cursor-pointer"
                title="Oznacz rozważanie i Ojcze nasz jako odmówione"
              >
                {introDone ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <RotateCcw className="w-5 h-5 opacity-40 hover:opacity-80" />}
              </button>
            </div>
          </div>

          {/* Pismo Święte */}
          {m.ref && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf5ee] dark:bg-[#16202e] border-l-4 border-amber-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Fragment Pisma Świętego: {m.ref}</span>
                </span>
                <button
                  onClick={() => speakText(`speech_passage_${m.day}`, `Fragment Pisma Świętego: ${m.ref}`)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                  title="Odsłuchaj lektorem"
                >
                  {activeSpeechId === `speech_passage_${m.day}` ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book italic text-[#473729] dark:text-amber-100 ${fontClass}`}>
                {m.ref}
              </p>
            </div>
          )}

          {/* Rozważanie */}
          {m.med && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131b28] border border-[#e6dacd] dark:border-[#22314a] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Rozważanie Tajemnicy:</span>
                </span>
                <button
                  onClick={() => speakText(`speech_med_${m.day}`, `Rozważanie: ${m.med}`)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                  title="Odsłuchaj lektorem"
                >
                  {activeSpeechId === `speech_med_${m.day}` ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#382b20] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {m.med}
              </p>
            </div>
          )}

          {/* Modlitwa Pańska (Ojcze Nasz) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] dark:bg-[#161e2d] border border-[#e8ded3] dark:border-[#223048] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Modlitwa Pańska (Ojcze Nasz) — Duży Paciorek Tajemnicy:
              </span>
              <button
                onClick={() => {
                  const spokenWithMed = m.med
                    ? `Tajemnica ${m.day > 0 ? `${m.day}: ` : ''}${m.t} – ${m.sub}. Rozważanie: ${m.med}. ${OJCZE_NASZ_PELNY}`
                    : OJCZE_NASZ_PELNY;
                  speakText(`speech_pater_${m.day}`, spokenWithMed);
                }}
                className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                title="Odsłuchaj lektorem (z rozważaniem tajemnicy)"
              >
                {activeSpeechId === `speech_pater_${m.day}` ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            {m.med && (
              <div className="text-xs font-medium text-amber-800/90 dark:text-amber-300/90 italic border-l-2 border-amber-600/60 pl-3 py-1 bg-amber-500/10 rounded-r-lg mb-2">
                <span className="font-bold not-italic">Rozważanie w tej tajemnicy:</span> {m.med}
              </div>
            )}
            <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
              {OJCZE_NASZ_PELNY}
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SEKCJA 2: 10 PACIORKÓW Z DOPOWIEDZENIAMI */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  10 Małych Paciorków Dziesiątka
                </div>
                <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                  Zdrowaś Maryjo ze wstawką po słowie „Jezus”
                </h3>
              </div>
            </div>

            <button
              onClick={() => {
                const updated = { ...completedSteps };
                for (let i = 1; i <= 10; i++) {
                  updated[isSingleView ? `bead_${i}` : `m${m.day}_bead_${i}`] = true;
                }
                setCompletedSteps(updated);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 text-xs font-bold transition cursor-pointer"
            >
              Zaznacz wszystkie 10
            </button>
          </div>

          {/* Lista 10 paciorków */}
          <div className="space-y-3.5 pt-2">
            {m.cl.map((cl, idx) => {
              const beadNum = idx + 1;
              const beadKey = isSingleView ? `bead_${beadNum}` : `m${m.day}_bead_${beadNum}`;
              const speechKey = `speech_bead_${m.day}_${beadNum}`;
              const isDone = !!completedSteps[beadKey];
              const fullHailMary = buildFullHailMary(cl);

              return (
                <div
                  key={beadNum}
                  id={`nowyrhz-bead-${m.day}-${beadNum}`}
                  onClick={() => toggleStep(beadKey)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer scroll-mt-20 ${
                    isDone
                      ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-500/50 shadow-xs'
                      : 'bg-white dark:bg-[#141d2c] border-[#e7ddd1] dark:border-[#223048] hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(beadKey);
                        }}
                        className="text-amber-700 dark:text-amber-400 cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-amber-600/40 flex items-center justify-center text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            {beadNum}
                          </div>
                        )}
                      </button>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        isDone
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                      }`}>
                        Paciorek #{beadNum} z 10
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(`bead_${m.day}_${beadNum}`, fullHailMary);
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                        title="Kopiuj modlitwę"
                      >
                        {copiedId === `bead_${m.day}_${beadNum}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(speechKey, fullHailMary);
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                        title="Odsłuchaj lektorem"
                      >
                        {activeSpeechId === speechKey ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Tekst modlitwy ze wstawką po słowie Jezus */}
                  <div className={`font-serif-book text-[#2e2319] dark:text-[#e2e8f0] text-justify leading-relaxed ${fontClass}`}>
                    Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego Jezus,{' '}
                    <span className="inline-block my-0.5 px-2.5 py-0.5 rounded-lg font-bold bg-amber-500/20 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border border-amber-500/40">
                      „{cl}”
                    </span>{' '}
                    Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SEKCJA 3: DUŻY PACIOREK 2: CHWAŁA OJCU I O MÓJ JEZU */}
        {/* ========================================================= */}
        <div id={`nowyrhz-step-conclusion-${m.day}`} className="rounded-3xl bg-white dark:bg-[#101726] border border-[#e5d8c8] dark:border-[#1e2a3c] p-6 sm:p-8 space-y-5 shadow-xs scroll-mt-20">
          <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 font-bold shrink-0">
                <Flame className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Duży Paciorek II • Zakończenie Dziesiątka
                </div>
                <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                  Chwała Ojcu, Modlitwa Fatimska i Zakończenie Części
                </h3>
              </div>
            </div>

            <button
              onClick={() => toggleStep(isSingleView ? 'concl_glory' : `m${m.day}_concl`)}
              className="p-1.5 rounded-lg text-amber-700 dark:text-amber-400 cursor-pointer"
              title="Oznacz modlitwy końcowe jako odmówione"
            >
              {conclDone ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <RotateCcw className="w-5 h-5 opacity-40 hover:opacity-80" />}
            </button>
          </div>

          {/* Chwała Ojcu */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] dark:bg-[#161f2f] border border-[#ebdccf] dark:border-[#222f46] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Modlitwa Uwielbienia (Chwała Ojcu):
              </span>
              <button
                onClick={() => speakText(`speech_glory_${m.day}`, CHWALA_OJCU_PELNE)}
                className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              >
                {activeSpeechId === `speech_glory_${m.day}` ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
              {CHWALA_OJCU_PELNE}
            </p>
          </div>

          {/* Modlitwa Fatimska */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/25 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Modlitwa Fatimska (O mój Jezu):</span>
              </span>
              <button
                onClick={() => speakText(`speech_fatima_${m.day}`, MODLITWA_FATIMSKA_PELNA)}
                className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
              >
                {activeSpeechId === `speech_fatima_${m.day}` ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <p className={`font-serif-book italic text-[#3a2e22] dark:text-[#f8fafc] text-justify ${fontClass}`}>
              {MODLITWA_FATIMSKA_PELNA}
            </p>
          </div>

          {/* Modlitwa na zakończenie części */}
          {m.prayer && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141b29] border border-[#e5d9cc] dark:border-[#24334c] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-600" />
                  <span>Modlitwa na zakończenie części ({m.partTitle}):</span>
                </span>
                <button
                  onClick={() => speakText(`speech_prayer_${m.day}`, m.prayer)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition cursor-pointer"
                >
                  {activeSpeechId === `speech_prayer_${m.day}` ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {m.prayer}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] dark:bg-[#080d16] text-[#2c241e] dark:text-[#e4e8f0] pb-24 transition-colors duration-300 font-sans-ui">
      
      {/* 1. Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f2ece2] via-[#faf6ef] to-[#faf7f2] dark:from-[#0d1525] dark:via-[#090f1a] dark:to-[#080d16] border-b border-[#e5d8c8] dark:border-[#1d2738] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          
          {/* Top badges & action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-600/15 to-sky-600/15 border border-amber-600/30 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Nowy Różaniec Historii Zbawienia • 175 Dni</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                title="Generuj wideo MP4 na YouTube z lektorem AI i koralikami"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Wideo MP4 (YouTube)</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121a28] hover:bg-[#f0e8dc] dark:hover:bg-[#1a2538] border border-[#d8c8b4] dark:border-[#24334a] text-xs font-semibold text-[#4e3d2d] dark:text-slate-200 transition cursor-pointer shadow-xs"
                title="Udostępnij link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Skopiowano link!' : 'Udostępnij'}</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121a28] hover:bg-[#f0e8dc] dark:hover:bg-[#1a2538] border border-[#d8c8b4] dark:border-[#24334a] text-xs font-semibold text-[#4e3d2d] dark:text-slate-200 transition cursor-pointer shadow-xs"
                title="Pobierz kod QR"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kod QR</span>
              </button>
            </div>
          </div>

          {/* Title and summary */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-serif-book tracking-tight text-[#1c1611] dark:text-white flex items-center gap-3">
              <span>Nowy RHZ</span>
              <span className="text-base sm:text-xl font-light text-amber-700 dark:text-amber-400 font-sans-ui">
                – Różaniec Historii Zbawienia
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#5e4b3b] dark:text-[#9bb0cf] max-w-4xl font-sans-ui leading-relaxed">
              7 etapów × 5 części × 5 tajemnic = 175 dni modlitwy. Każdego dnia rozważana jest jedna tajemnica z 10 dopowiedzeniami po słowie „Jezus” oraz syntezą lektora AI TTS.
            </p>

            {/* Lektor AI Audio Guide Bar */}
            <div className="pt-2">
              <SectionGuidePlayerBar 
                sectionId="nowyRHZ" 
                currentLang={currentLang} 
                variant="banner" 
              />
            </div>
          </div>

          {/* 3 Zakładki: Okno z tekstem, Aplikacja PWA, 7 Etapów */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#e2d5c4] dark:border-[#1e293c]">
            <button
              onClick={() => setActiveTab('text_reader')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'text_reader'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/80 dark:bg-[#121a28] text-[#5e4b3b] dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-[#1b263a] border border-[#dac8b4] dark:border-[#24334a]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Okno z tekstem modlitwy (175 dni)</span>
            </button>

            <button
              onClick={() => setActiveTab('pwa_app')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'pwa_app'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/80 dark:bg-[#121a28] text-[#5e4b3b] dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-[#1b263a] border border-[#dac8b4] dark:border-[#24334a]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Aplikacja Nowy RHZ (PWA)</span>
            </button>

            <button
              onClick={() => setActiveTab('stages')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'stages'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white/80 dark:bg-[#121a28] text-[#5e4b3b] dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-[#1b263a] border border-[#dac8b4] dark:border-[#24334a]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Przegląd 7 Etapów</span>
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* ZAKŁADKA 1: OKNO Z TEKSTEM MODLITWY (1, 5 LUB 25 TAJEMNIC) */}
      {/* ========================================================= */}
      {activeTab === 'text_reader' && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          
          {/* Pływający pasek odtwarzacza sekwencyjnego z lektorem */}
          {isSequencePlaying && sequenceQueue[currentQueueIndex] && (
            <div className="fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 md:max-w-3xl md:mx-auto z-50 bg-[#141e2e]/95 backdrop-blur-md text-white border-2 border-amber-500/70 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 animate-pulse">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Lektor w toku • Krok {currentQueueIndex + 1} z {sequenceQueue.length}</span>
                  </div>
                  <div className="text-sm font-bold truncate text-white">
                    {sequenceQueue[currentQueueIndex].title}
                  </div>
                  {sequenceQueue[currentQueueIndex].subtitle && (
                    <div className="text-xs text-amber-200/80 truncate">
                      {sequenceQueue[currentQueueIndex].subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={skipPrevSequence}
                  disabled={currentQueueIndex <= 0}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
                  title="Poprzednia modlitwa"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={stopSequence}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                  title="Zatrzymaj odmawianie"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Zatrzymaj</span>
                </button>
                <button
                  onClick={skipNextSequence}
                  disabled={currentQueueIndex >= sequenceQueue.length - 1}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition cursor-pointer"
                  title="Następna modlitwa"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* GŁÓWNY PASEK WYBORU TRYBU MODLITWY: 1 TAJEMNICA | CAŁA CZĘŚĆ (5) | CAŁY ETAP (25) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0f1726] border border-[#e5d8c8] dark:border-[#1e2a3c] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Tryb odmawiania:
                </span>
                <div className="inline-flex rounded-2xl bg-[#f0e8dc] dark:bg-[#162132] p-1 border border-[#e2d2c0] dark:border-[#22314a]">
                  <button
                    onClick={() => setPrayerScope('single')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      prayerScope === 'single'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300'
                    }`}
                  >
                    1 Tajemnica
                  </button>
                  <button
                    onClick={() => setPrayerScope('part')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      prayerScope === 'part'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300'
                    }`}
                  >
                    Cała Część (5 tajemnic)
                  </button>
                  <button
                    onClick={() => setPrayerScope('stage')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      prayerScope === 'stage'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-300'
                    }`}
                  >
                    Cały Etap (25 tajemnic)
                  </button>
                </div>
              </div>

              {/* Rozmiar czcionki */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">Czcionka:</span>
                <div className="inline-flex rounded-xl bg-stone-100 dark:bg-[#1a2333] p-0.5 border border-stone-200 dark:border-stone-700 text-xs">
                  {(['normal', 'large', 'xlarge'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        fontSize === sz
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750'
                      }`}
                    >
                      {sz === 'normal' ? '12 pt' : sz === 'large' ? '14 pt' : '16 pt'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-nawigacja i kontrolki specyficzne dla danego trybu */}
            {prayerScope === 'single' && (
              <div className="pt-2 border-t border-amber-500/15 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentDay(d => Math.max(0, d - 1))}
                    disabled={safeDay <= 0}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 disabled:opacity-40 transition cursor-pointer"
                    title="Poprzedni dzień"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">
                      Dzień:
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={175}
                      value={safeDay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 0 && val <= 175) setCurrentDay(val);
                      }}
                      className="w-16 px-2.5 py-1 text-center font-bold text-sm rounded-lg border border-amber-500/40 bg-white dark:bg-[#162132] text-amber-900 dark:text-amber-200"
                    />
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {safeDay === 0 ? '(Tajemnica 0 - Wstęp)' : 'z 175'}
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentDay(d => Math.min(175, d + 1))}
                    disabled={safeDay >= 175}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 disabled:opacity-40 transition cursor-pointer"
                    title="Następny dzień"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {safeDay > 0 && (
                    <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeIntroPrayers}
                        onChange={(e) => setIncludeIntroPrayers(e.target.checked)}
                        className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Dołącz Tajemnicę 0 (wstęp)</span>
                    </label>
                  )}

                  {isSequencePlaying ? (
                    <button
                      onClick={stopSequence}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Zatrzymaj lektora</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const queue = safeDay === 0 
                          ? buildPrayerQueue([], true)
                          : buildPrayerQueue([mystery], includeIntroPrayers);
                        startSequence(queue);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>
                        {safeDay === 0 
                          ? 'Odmawiaj Modlitwy Wstępne z lektorem' 
                          : 'Odmawiaj tę tajemnicę z lektorem'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {prayerScope === 'part' && (
              <div className="pt-2 border-t border-amber-500/15 space-y-3">
                {/* Wybór Etapu 1..7 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 mr-1">
                    Etap:
                  </span>
                  {[1, 2, 3, 4, 5, 6, 7].map((stg) => (
                    <button
                      key={stg}
                      onClick={() => setSelectedStageNum(stg)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        selectedStageNum === stg
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100'
                      }`}
                    >
                      Etap {stg} ({stages[stg - 1].num})
                    </button>
                  ))}
                </div>

                {/* Wybór Części 1..5 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 mr-1">
                    Część:
                  </span>
                  {[1, 2, 3, 4, 5].map((prt) => {
                    const partTitle = stages[selectedStageNum - 1]?.parts[prt - 1] || `Część ${prt}`;
                    return (
                      <button
                        key={prt}
                        onClick={() => {
                          setSelectedPartNum(prt);
                          setActiveMysteryTabInPart(0);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          selectedPartNum === prt
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100'
                        }`}
                      >
                        Część {prt}: {partTitle}
                      </button>
                    );
                  })}
                </div>

                {/* Akcja startu lektora dla całej części */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeIntroPrayers}
                      onChange={(e) => setIncludeIntroPrayers(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Dołącz Tajemnicę 0 (Modlitwy Wstępne) na początku</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {isSequencePlaying ? (
                      <button
                        onClick={stopSequence}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Zatrzymaj odmawianie</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const queue = buildPrayerQueue(partMysteries, includeIntroPrayers);
                          startSequence(queue);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Odmawiaj całą część (5 tajemnic) z lektorem</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Zakładki tajemnic w ramach części */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    onClick={() => setActiveMysteryTabInPart(0)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeMysteryTabInPart === 0
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Wszystkie 5 tajemnic na raz
                  </button>
                  <button
                    onClick={() => setActiveMysteryTabInPart(-1)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeMysteryTabInPart === -1
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Tajemnica 0 (Wstęp)
                  </button>
                  {partMysteries.map((m, idx) => (
                    <button
                      key={m.day}
                      onClick={() => setActiveMysteryTabInPart(idx + 1)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeMysteryTabInPart === idx + 1
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100'
                      }`}
                    >
                      Tajemnica {idx + 1} (Dzień {m.day})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {prayerScope === 'stage' && (
              <div className="pt-2 border-t border-amber-500/15 space-y-3">
                {/* Wybór Etapu 1..7 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 mr-1">
                    Etap:
                  </span>
                  {[1, 2, 3, 4, 5, 6, 7].map((stg) => (
                    <button
                      key={stg}
                      onClick={() => {
                        setSelectedStageNum(stg);
                        setActivePartTabInStage(0);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedStageNum === stg
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-100'
                      }`}
                    >
                      Etap {stages[stg - 1].num}: {stages[stg - 1].title}
                    </button>
                  ))}
                </div>

                {/* Opis etapu */}
                <div className="p-3.5 rounded-2xl bg-[#faf5ee] dark:bg-[#16202e] border border-amber-500/20 text-xs text-stone-700 dark:text-stone-300">
                  <div className="font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                    Etap {stages[selectedStageNum - 1].num}: {stages[selectedStageNum - 1].title} ({stages[selectedStageNum - 1].days})
                  </div>
                  <div>{stages[selectedStageNum - 1].desc}</div>
                </div>

                {/* Akcja startu lektora dla całego etapu */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20">
                  <label className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeIntroPrayers}
                      onChange={(e) => setIncludeIntroPrayers(e.target.checked)}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Dołącz Tajemnicę 0 (Modlitwy Wstępne) na początku</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {isSequencePlaying ? (
                      <button
                        onClick={stopSequence}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Zatrzymaj odmawianie</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const queue = buildPrayerQueue(stageMysteries, includeIntroPrayers);
                          startSequence(queue);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Odmawiaj cały etap (25 tajemnic) z lektorem</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Zakładki części w ramach etapu */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    onClick={() => setActivePartTabInStage(0)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activePartTabInStage === 0
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Cały etap (wszystkie 5 części razem)
                  </button>
                  <button
                    onClick={() => setActivePartTabInStage(-1)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activePartTabInStage === -1
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    Tajemnica 0 (Wstęp)
                  </button>
                  {[1, 2, 3, 4, 5].map((prt) => (
                    <button
                      key={prt}
                      onClick={() => setActivePartTabInStage(prt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activePartTabInStage === prt
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-100'
                      }`}
                    >
                      Część {prt} (5 tajemnic)
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* TRYB 1: POJEDYNCZA TAJEMNICA (1 TAJEMNICA) */}
          {/* ========================================================= */}
          {prayerScope === 'single' && (
            <>
              {safeDay === 0 ? (
                renderTajemnicaZeroCards()
              ) : (
                <>
                  <RosaryDecadeProgressTracker
                    isIntroDone={isIntroDone}
                    completedBeads={completedBeadsMap}
                    isConclusionDone={isConclusionDone}
                    activeStep={activeStep}
                    dopowiedzenia={mystery.cl}
                    mysteryTitle={`${mystery.t} – ${mystery.sub}`}
                    stageTitle={`Etap ${mystery.stage}: ${mystery.stageTitle} • Część ${mystery.part}: ${mystery.partTitle}`}
                    onSelectIntro={() => {
                      toggleStep('intro_med');
                      const el = document.getElementById(`nowyrhz-step-intro-${safeDay}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    onSelectBead={(num) => {
                      toggleStep(`bead_${num}`);
                      const el = document.getElementById(`nowyrhz-bead-${safeDay}-${num}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    onSelectConclusion={() => {
                      toggleStep('concl_glory');
                      const el = document.getElementById(`nowyrhz-step-conclusion-${safeDay}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    onResetProgress={handleResetProgress}
                  />

                  {renderMysteryContent(mystery, safeDay, true)}
                </>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* TRYB 2: CAŁA CZĘŚĆ (5 TAJEMNIC) */}
          {/* ========================================================= */}
          {prayerScope === 'part' && (
            <div className="space-y-8">
              {activeMysteryTabInPart === -1 && renderTajemnicaZeroCards()}

              {activeMysteryTabInPart === 0 && (
                <>
                  {includeIntroPrayers && (
                    <div className="space-y-4">
                      <div className="px-4 py-2.5 rounded-2xl bg-amber-600/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span>✝️ Modlitwy Wstępne Różańca Świętego (Tajemnica 0)</span>
                      </div>
                      {renderTajemnicaZeroCards()}
                    </div>
                  )}

                  {partMysteries.map((m, idx) => (
                    <div key={m.day} className="space-y-4 pt-4 border-t-2 border-amber-500/20">
                      <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                              Tajemnica {idx + 1} z 5 • Dzień {m.day} z 175
                            </div>
                            <div className="text-sm font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                              {m.t} – {m.sub}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const q = buildPrayerQueue([m], false);
                            startSequence(q);
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Odsłuchaj lektorem</span>
                        </button>
                      </div>

                      {renderMysteryContent(m, idx + 1, false)}
                    </div>
                  ))}
                </>
              )}

              {activeMysteryTabInPart > 0 && partMysteries[activeMysteryTabInPart - 1] && (
                renderMysteryContent(partMysteries[activeMysteryTabInPart - 1], activeMysteryTabInPart, false)
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TRYB 3: CAŁY ETAP (25 TAJEMNIC / 5 CZĘŚCI) */}
          {/* ========================================================= */}
          {prayerScope === 'stage' && (
            <div className="space-y-10">
              {activePartTabInStage === -1 && renderTajemnicaZeroCards()}

              {activePartTabInStage === 0 && (
                <>
                  {includeIntroPrayers && (
                    <div className="space-y-4">
                      <div className="px-4 py-2.5 rounded-2xl bg-amber-600/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <span>✝️ Modlitwy Wstępne Różańca Świętego (Tajemnica 0)</span>
                      </div>
                      {renderTajemnicaZeroCards()}
                    </div>
                  )}

                  {[1, 2, 3, 4, 5].map((prtNum) => {
                    const mysteriesInPart = stageMysteries.filter(m => m.part === prtNum);
                    const partTitle = stages[selectedStageNum - 1]?.parts[prtNum - 1] || `Część ${prtNum}`;

                    return (
                      <div key={prtNum} className="space-y-6 pt-6 border-t-4 border-amber-600/30">
                        {/* Nagłówek części */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#22354c] via-[#1a293c] to-[#142030] text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                              Etap {stages[selectedStageNum - 1].num} • Część {prtNum} z 5
                            </div>
                            <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-white">
                              {partTitle}
                            </h3>
                          </div>

                          <button
                            onClick={() => {
                              const q = buildPrayerQueue(mysteriesInPart, false);
                              startSequence(q);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Odmawiaj tę część (5 tajemnic)</span>
                          </button>
                        </div>

                        {/* 5 tajemnic w ramach tej części */}
                        {mysteriesInPart.map((m, idx) => (
                          <div key={m.day} className="space-y-4">
                            <div className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                                Tajemnica {idx + 1} z 5 • Dzień {m.day} ({m.t})
                              </span>
                              <span className="text-xs text-stone-500">
                                {m.sub}
                              </span>
                            </div>
                            {renderMysteryContent(m, idx + 1, false)}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              )}

              {activePartTabInStage > 0 && (
                <div className="space-y-6">
                  {stageMysteries
                    .filter(m => m.part === activePartTabInStage)
                    .map((m, idx) => (
                      <div key={m.day} className="space-y-4 pt-4 border-t-2 border-amber-500/20">
                        <div className="px-5 py-3 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                            Część {activePartTabInStage} • Tajemnica {idx + 1} z 5 (Dzień {m.day}: {m.t})
                          </span>
                          <span className="text-xs text-stone-600 dark:text-stone-400">
                            {m.sub}
                          </span>
                        </div>
                        {renderMysteryContent(m, idx + 1, false)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      

      {/* ZAKŁADKA 2: APLIKACJA NOWY RHZ (PWA / IFRAME) */}
      {/* ========================================================= */}
      {activeTab === 'pwa_app' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className={`relative bg-white dark:bg-[#0c1322] rounded-3xl border border-amber-500/30 dark:border-amber-500/20 shadow-xl overflow-hidden transition-all duration-300 ${
            isFullscreen ? 'fixed inset-2 z-50 rounded-2xl flex flex-col' : ''
          }`}>
            
            {/* Frame Toolbar */}
            <div className="px-4 py-3 bg-gradient-to-r from-[#1f3a5f] via-[#1a2d48] to-[#142337] text-white flex items-center justify-between gap-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 truncate">
                    <span>Aplikacja Nowy RHZ</span>
                    <span className="hidden sm:inline-block px-2 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Offline & Lektor Audio
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-200/80 font-mono truncate">
                    Dziś • Tajemnice • Auto • Ustawienia • PWA
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleReload}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Odśwież aplikację"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFullscreen(f => !f)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={isFullscreen ? 'Zmniejsz okno' : 'Powiększ na pełny ekran'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <a
                  href={standaloneUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                  title="Otwórz w nowej karcie"
                >
                  <span className="hidden sm:inline">Nowe okno</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Iframe View */}
            <div className={`relative w-full ${isFullscreen ? 'flex-1' : 'h-[680px] sm:h-[780px]'} bg-[#f7f4ee] dark:bg-[#15171b]`}>
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={standaloneUrl}
                title="Nowy Różaniec Historii Zbawienia"
                className="w-full h-full border-0"
                allow="autoplay; clipboard-write"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              />
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* ZAKŁADKA 3: PRZEGLĄD 7 ETAPÓW (175 TAJEMNIC) */}
      {/* ========================================================= */}
      {activeTab === 'stages' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="space-y-4">
            {stages.map((st) => (
              <div 
                key={st.num}
                className="bg-white dark:bg-[#0e1627] border border-[#e5d8c8] dark:border-[#1d293d] rounded-2xl p-5 sm:p-6 shadow-xs hover:border-amber-500/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#f0e6d8] dark:border-[#182335] pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1f3a5f] text-amber-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {st.num}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#1f3a5f] dark:text-amber-300">
                      Etap {st.num}: {st.title}
                    </h3>
                  </div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border self-start sm:self-auto ${st.badgeColor}`}>
                    {st.days} (25 tajemnic)
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#614e3e] dark:text-[#90a6c6] mb-3 leading-relaxed">
                  {st.desc}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {st.parts.map((p, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#f7f2ea] dark:bg-[#162033] text-[#4b3c2e] dark:text-[#c5d3ea] text-xs font-medium border border-[#e2d5c4] dark:border-[#202d44]"
                    >
                      {idx + 1}. {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal Wideo YouTube z Lektorem i Koralikami */}
      {isVideoModalOpen && (
        <VideoYouTubeExportModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          broadcastItem={broadcastItem}
          currentDayNumber={safeDay}
          totalDays={175}
        />
      )}

    </div>
  );
};
