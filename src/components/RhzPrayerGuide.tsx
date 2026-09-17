import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Heart, 
  Shield, 
  Cross as CrossIcon, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Copy, 
  Check,
  Flame,
  Compass,
  Lightbulb
} from 'lucide-react';
import { RhzDayEntry } from '../data/rhz365Data';
import { COMMON_PRAYERS } from '../data/rosaryData';
import { playLectorSpeech, stopLectorSpeech, getLectorConfig, unlockMobileAudio } from '../utils/audioLectorService';

interface Props {
  rhzEntry: RhzDayEntry;
  fontSize?: 'normal' | 'large' | 'xlarge';
  theme?: string;
  currentLang?: string;
}

export const RhzPrayerGuide: React.FC<Props> = ({
  rhzEntry,
  fontSize = 'normal',
  theme = 'light',
  currentLang = 'pl'
}) => {
  // Set of completed prayer IDs
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Section collapse states
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [showReflection, setShowReflection] = useState<boolean>(true);
  const [showDecade, setShowDecade] = useState<boolean>(true);
  const [showConclusion, setShowConclusion] = useState<boolean>(true);

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
    const updated: Record<string, boolean> = { ...completedSteps };
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

  // Calculate decade progress
  const completedBeadsCount = (rhzEntry.smallBeads || []).filter(
    b => completedSteps[`bead_${b.beadNumber}`]
  ).length;

  const fontClass = 
    fontSize === 'normal' ? 'text-sm sm:text-base leading-relaxed' :
    fontSize === 'large' ? 'text-base sm:text-lg leading-relaxed' :
    'text-lg sm:text-xl leading-relaxed';

  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* Top Header Summary & Progress Tracker */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/15 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-amber-950/40 border border-amber-500/30 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-600 text-white shadow-xs">
                {rhzEntry.cycle}
              </span>
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                Tajemnica {rhzEntry.mysteryIndex} z 175 • {rhzEntry.displayDate}
              </span>
            </div>
            <h2 className="font-heading-cinzel text-xl sm:text-2xl font-extrabold text-[#2d1f14] dark:text-[#f8fafc]">
              {rhzEntry.stageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Postęp dziesiątka: {completedBeadsCount} / 10
              </div>
              <div className="w-32 sm:w-44 h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(completedBeadsCount / 10) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleResetProgress}
              className="p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700 border border-amber-500/30 text-amber-900 dark:text-amber-300 transition-colors shadow-xs"
              title="Zresetuj odznaczone paciorki"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEKCJA 1: WPROWADZENIE DO RÓŻAŃCA (Krzyżyk + Zawieszka) */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#111722] border border-[#e8ded3] dark:border-[#1f293d] overflow-hidden shadow-xs">
        <button
          onClick={() => setShowIntro(!showIntro)}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
              <CrossIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Krok 1 • Początek Modlitwy
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                Wstęp Różańca na Krzyżyku i Zawieszce
              </h3>
            </div>
          </div>
          <div className="text-stone-400 dark:text-stone-500">
            {showIntro ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showIntro && (
          <div className="p-5 sm:p-8 pt-0 space-y-6 border-t border-[#f0e6da] dark:border-[#1a2335]">
            {/* 1. Znak Krzyża */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] dark:bg-[#161f2f] border border-[#ebdccf] dark:border-[#222f46] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CrossIcon className="w-3.5 h-3.5" />
                  <span>Znak Krzyża Świętego</span>
                </span>
                <button
                  onClick={() => speakText('intro_cross', 'W imię Ojca i Syna, i Ducha Świętego. Amen.')}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                  title="Odsłuchaj lektorem"
                >
                  {activeSpeechId === 'intro_cross' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book font-semibold text-[#2d2217] dark:text-[#f1f5f9] ${fontClass}`}>
                W imię Ojca i Syna, i Ducha Świętego. Amen.
              </p>
            </div>

            {/* 2. Krzyżyk: Wierzę w Boga (Skład Apostolski) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141b29] border border-[#e5d9cc] dark:border-[#24334c] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Krzyżyk — Skład Apostolski (Wierzę w Boga)</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyText('credo', COMMON_PRAYERS.cross.text)}
                    className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                    title="Kopiuj modlitwę"
                  >
                    {copiedId === 'credo' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => speakText('credo', COMMON_PRAYERS.cross.text)}
                    className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                    title="Odsłuchaj lektorem"
                  >
                    {activeSpeechId === 'credo' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {COMMON_PRAYERS.cross.text}
              </p>
            </div>

            {/* 3. Duży paciorek: Ojcze Nasz */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#fbf8f3] dark:bg-[#161e2d] border border-[#e8ded3] dark:border-[#223048] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Duży Paciorek (Litera "I") — Modlitwa Pańska (Ojcze Nasz)
                </span>
                <button
                  onClick={() => speakText('intro_pater', COMMON_PRAYERS.ourFather.text)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                  title="Odsłuchaj lektorem"
                >
                  {activeSpeechId === 'intro_pater' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {COMMON_PRAYERS.ourFather.text}
              </p>
            </div>

            {/* 4. Trzy małe paciorki RGB: Wiara, Nadzieja, Miłość */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                Trzy Małe Paciorki RGB — Modlitwy o Cnoty Boskie z Dopowiedzeniami:
              </div>

              {/* Niebieski - Wiara */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-xs inline-block" />
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      Paciorek 1 (Niebieski • Model RGBA) — Modlitwa o Wiarę
                    </span>
                  </div>
                  <button
                    onClick={() => speakText('faith', COMMON_PRAYERS.hailMaryFaith.text)}
                    className="p-1.5 rounded-lg hover:bg-blue-600/20 text-blue-800 dark:text-blue-300 transition-colors"
                  >
                    {activeSpeechId === 'faith' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book text-[#263238] dark:text-[#e2e8f0] text-justify ${fontClass}`}>
                  Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego Jezus,{' '}
                  <strong className="underline decoration-blue-500 text-blue-950 dark:text-blue-200">
                    który niech pomnaża naszą wiarę
                  </strong>
                  . Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.
                </p>
              </div>

              {/* Zielony - Nadzieja */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs inline-block" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      Paciorek 2 (Zielony • Model RGBA) — Modlitwa o Nadzieję
                    </span>
                  </div>
                  <button
                    onClick={() => speakText('hope', COMMON_PRAYERS.hailMaryHope.text)}
                    className="p-1.5 rounded-lg hover:bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 transition-colors"
                  >
                    {activeSpeechId === 'hope' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book text-[#1b382b] dark:text-[#e2e8f0] text-justify ${fontClass}`}>
                  Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego Jezus,{' '}
                  <strong className="underline decoration-emerald-500 text-emerald-950 dark:text-emerald-200">
                    który niech umacnia naszą nadzieję
                  </strong>
                  . Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.
                </p>
              </div>

              {/* Czerwony - Miłość */}
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs inline-block" />
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                      Paciorek 3 (Czerwony • Model RGBA) — Modlitwa o Miłość
                    </span>
                  </div>
                  <button
                    onClick={() => speakText('love', COMMON_PRAYERS.hailMaryLove.text)}
                    className="p-1.5 rounded-lg hover:bg-rose-600/20 text-rose-800 dark:text-rose-300 transition-colors"
                  >
                    {activeSpeechId === 'love' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book text-[#3d1e22] dark:text-[#e2e8f0] text-justify ${fontClass}`}>
                  Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego Jezus,{' '}
                  <strong className="underline decoration-rose-500 text-rose-950 dark:text-rose-200">
                    który niech rozpala naszą miłość
                  </strong>
                  . Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.
                </p>
              </div>
            </div>

            {/* 5. Chwała Ojcu */}
            <div className="p-4 rounded-2xl bg-[#faf6f0] dark:bg-[#161f2f] border border-[#ebdccf] dark:border-[#222f46] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Chwała Ojcu i Synowi
                </span>
                <button
                  onClick={() => speakText('intro_glory', COMMON_PRAYERS.gloryBe.text)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                >
                  {activeSpeechId === 'intro_glory' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {COMMON_PRAYERS.gloryBe.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEKCJA 2: ROZWAŻANIE TAJEMNICY (Pismo Święte, Słowo, 3 Wezwania) */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#111722] border border-[#e8ded3] dark:border-[#1f293d] overflow-hidden shadow-xs">
        <button
          onClick={() => setShowReflection(!showReflection)}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Krok 2 • Rozważanie Tajemnicy
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                {rhzEntry.stageTitle}
              </h3>
            </div>
          </div>
          <div className="text-stone-400 dark:text-stone-500">
            {showReflection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showReflection && (
          <div className="p-5 sm:p-8 pt-0 space-y-6 border-t border-[#f0e6da] dark:border-[#1a2335]">
            {/* Pismo Święte */}
            {rhzEntry.passage && (
              <div className="p-5 rounded-2xl bg-[#faf5ee] dark:bg-[#16202e] border-l-4 border-amber-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Pismo Święte:</span>
                  </span>
                  <button
                    onClick={() => speakText('refl_passage', rhzEntry.passage)}
                    className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                  >
                    {activeSpeechId === 'refl_passage' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book italic text-[#473729] dark:text-amber-100 text-justify ${fontClass}`}>
                  {rhzEntry.passage}
                </p>
              </div>
            )}

            {/* Słowo Wyjaśnienia */}
            {rhzEntry.explanation && (
              <div className="p-5 rounded-2xl bg-white dark:bg-[#131b28] border border-[#e6dacd] dark:border-[#22314a] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Słowo Wyjaśnienia:</span>
                  </span>
                  <button
                    onClick={() => speakText('refl_expl', rhzEntry.explanation)}
                    className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                  >
                    {activeSpeechId === 'refl_expl' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <p className={`font-serif-book text-[#382b20] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                  {rhzEntry.explanation}
                </p>
              </div>
            )}

            {/* Trzy Wezwania do Działania */}
            {rhzEntry.callsToAction && rhzEntry.callsToAction.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#fdf9f4] dark:bg-[#151f2e] border border-[#ebdccf] dark:border-[#202d42] space-y-3">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Trzy Wezwania do Działania:</span>
                </span>
                <div className="space-y-2">
                  {rhzEntry.callsToAction.map((call, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl bg-white dark:bg-[#1a2536] border border-amber-500/20 font-serif-book text-[#2f241a] dark:text-[#e2e8f0] text-sm sm:text-base"
                    >
                      {call}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modlitwa Pańska (Duży Paciorek Tajemnicy) */}
            <div className="p-5 rounded-2xl bg-[#faf6f0] dark:bg-[#161e2d] border border-[#e8ded3] dark:border-[#223048] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Duży Paciorek Tajemnicy (Litera "N") — Modlitwa Pańska (Ojcze Nasz)
                </span>
                <button
                  onClick={() => speakText('mystery_pater', rhzEntry.ourFather || COMMON_PRAYERS.ourFather.text)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                >
                  {activeSpeechId === 'mystery_pater' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {rhzEntry.ourFather || COMMON_PRAYERS.ourFather.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEKCJA 3: 10 PACIORKÓW Z DOPOWIEDZENIAMI PO SŁOWIE JEZUS */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#111722] border border-[#e8ded3] dark:border-[#1f293d] overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e6da] dark:border-[#1a2335]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Krok 3 • Dziesiątek Różańca
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                10 Paciorków z Dopowiedzeniami po słowie „Jezus”
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllDecade}
              className="px-3 py-1.5 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-800 dark:text-amber-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Zaznacz wszystkie 10
            </button>
            <button
              onClick={() => setShowDecade(!showDecade)}
              className="p-1.5 text-stone-400 dark:text-stone-500 cursor-pointer"
            >
              {showDecade ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {showDecade && (
          <div className="p-4 sm:p-6 space-y-4">
            {(rhzEntry.smallBeads || []).map((bead) => {
              const beadId = `bead_${bead.beadNumber}`;
              const isDone = !!completedSteps[beadId];

              return (
                <div
                  key={bead.beadNumber}
                  onClick={() => toggleStep(beadId)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none ${
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
                          toggleStep(beadId);
                        }}
                        className="text-amber-700 dark:text-amber-400 cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Circle className="w-5 h-5 opacity-40 hover:opacity-80" />
                        )}
                      </button>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        isDone
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                      }`}>
                        Paciorek #{bead.beadNumber} z 10
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(beadId, bead.text);
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                        title="Kopiuj tekst modlitwy"
                      >
                        {copiedId === beadId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(beadId, bead.text);
                        }}
                        className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                        title="Odsłuchaj lektorem"
                      >
                        {activeSpeechId === beadId ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Prayer Text with Highlighted Dopowiedzenie */}
                  <div className={`font-serif-book text-[#2e2319] dark:text-[#e2e8f0] text-justify leading-relaxed ${fontClass}`}>
                    Zdrowaś Maryjo, łaski pełna, Pan z Tobą, błogosławionaś Ty między niewiastami i błogosławiony owoc żywota Twojego Jezus,{' '}
                    <span className="inline-block my-1 px-2.5 py-0.5 rounded-lg font-bold bg-amber-500/20 dark:bg-amber-500/25 text-amber-950 dark:text-amber-200 border border-amber-500/40">
                      „{bead.dopowiedzenie}”
                    </span>{' '}
                    Święta Maryjo, Matko Boża, módl się za nami grzesznymi teraz i w godzinę śmierci naszej. Amen.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SEKCJA 4: ZAKOŃCZENIE DZIESIĄTKA (Chwała Ojcu, Fatima, Pod Twoją obronę) */}
      {/* ========================================================= */}
      <div className="rounded-3xl bg-white dark:bg-[#111722] border border-[#e8ded3] dark:border-[#1f293d] overflow-hidden shadow-xs">
        <button
          onClick={() => setShowConclusion(!showConclusion)}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-3 text-left hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/15 border border-amber-600/30 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Krok 4 • Zakończenie Modlitwy
              </div>
              <h3 className="font-heading-cinzel text-lg sm:text-xl font-bold text-[#2a2016] dark:text-[#f3e8d2]">
                Chwała Ojcu, Modlitwa Fatimska i Pod Twoją obronę
              </h3>
            </div>
          </div>
          <div className="text-stone-400 dark:text-stone-500">
            {showConclusion ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showConclusion && (
          <div className="p-5 sm:p-8 pt-0 space-y-6 border-t border-[#f0e6da] dark:border-[#1a2335]">
            {/* Chwała Ojcu */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#faf6f0] dark:bg-[#161f2f] border border-[#ebdccf] dark:border-[#222f46] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Modlitwa Uwielbienia (Chwała Ojcu):
                </span>
                <button
                  onClick={() => speakText('concl_glory', rhzEntry.gloryBe || COMMON_PRAYERS.gloryBe.text)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                >
                  {activeSpeechId === 'concl_glory' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {rhzEntry.gloryBe || COMMON_PRAYERS.gloryBe.text}
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
                  onClick={() => speakText('concl_fatima', rhzEntry.fatimaPrayer || COMMON_PRAYERS.fatimaPrayer.text)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                >
                  {activeSpeechId === 'concl_fatima' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book italic text-[#3a2e22] dark:text-[#f8fafc] text-justify ${fontClass}`}>
                {rhzEntry.fatimaPrayer || COMMON_PRAYERS.fatimaPrayer.text}
              </p>
            </div>

            {/* Pod Twoją obronę */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141b29] border border-[#e5d9cc] dark:border-[#24334c] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>Modlitwa na zakończenie różańca:</span>
                </span>
                <button
                  onClick={() => speakText('concl_defense', COMMON_PRAYERS.concludingPrayer.text)}
                  className="p-1.5 rounded-lg hover:bg-amber-600/20 text-amber-800 dark:text-amber-300 transition-colors"
                >
                  {activeSpeechId === 'concl_defense' ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <p className={`font-serif-book text-[#3a2e22] dark:text-[#cbd5e1] text-justify ${fontClass}`}>
                {COMMON_PRAYERS.concludingPrayer.text}
              </p>
            </div>

            {/* Końcowy Znak Krzyża */}
            <div className="p-3 text-center text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-400">
              W imię Ojca i Syna, i Ducha Świętego. Amen.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
