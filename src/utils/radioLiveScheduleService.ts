import {
  RADIO_STATIONS,
  RadioStationId,
  RadioStationMeta,
  getRadioBroadcastItem,
  RadioBroadcastItem
} from './radioContentService';

export interface StationLiveStatus {
  station: RadioStationMeta;
  dayNumber: number;
  totalDays: number;
  dayDurationSeconds: number;
  secondsElapsedInDay: number;
  secondsRemainingInDay: number;
  progressPercent: number;
  broadcastItem: RadioBroadcastItem;
  liveSpeechText: string;
  cycleTotalDurationSeconds: number;
}

// Stała epoka referencyjna (UTC) synchronizująca ramówkę 24/7 dla wszystkich słuchaczy na świecie
// 2026-01-01 00:00:00 UTC
const GLOBAL_RADIO_EPOCH_MS = 1767225600000;

// Średni czas trwania audycji jednego dnia dla poszczególnych stacji (w sekundach):
// Nowy RHZ: pełne 10 dopowiedzeń i modlitwa ~ 330 sekund (5.5 min)
// WnR365: wpis blogowy i rozważanie ~ 210 sekund (3.5 min)
// Biblia365: rozdział Pisma Świętego i komentarz ~ 270 sekund (4.5 min)
// RHZ365: pierwotny różaniec z paciorkami ~ 360 sekund (6.0 min)
const BASE_STATION_DAY_DURATIONS: Record<RadioStationId, number> = {
  nowyrhz: 330,
  wnr365: 210,
  biblia365: 270,
  rhz365: 360
};

/**
 * Szacuje rzeczywisty czas trwania audycji danego dnia w oparciu o długość tekstu lektorskiego.
 * Przeciętna prędkość mowy lektora w języku polskim to ok. 14.5 znaku na sekundę.
 */
export function estimateBroadcastDurationSeconds(item: RadioBroadcastItem): number {
  if (!item || !item.speechText) return 180;
  const rawSeconds = Math.round(item.speechText.length / 14.5);
  // Ograniczamy do bezpiecznego zakresu (od 90s do 600s) + 5s na mikro-odstęp
  return Math.max(90, Math.min(600, rawSeconds + 5));
}

// Pamięć podręczna całkowitych czasów trwania cyklu dla 4 stacji
const durationCache: Record<RadioStationId, { dayDurations: number[]; totalCycleSeconds: number }> = {
  nowyrhz: { dayDurations: [], totalCycleSeconds: 0 },
  wnr365: { dayDurations: [], totalCycleSeconds: 0 },
  biblia365: { dayDurations: [], totalCycleSeconds: 0 },
  rhz365: { dayDurations: [], totalCycleSeconds: 0 }
};

/**
 * Inicjalizuje lub pobiera tablicę czasów trwania poszczególnych dni dla stacji.
 */
function getStationDurationTable(stationId: RadioStationId): { dayDurations: number[]; totalCycleSeconds: number } {
  const cached = durationCache[stationId];
  if (cached.dayDurations.length > 0) {
    return cached;
  }

  const station = RADIO_STATIONS.find(s => s.id === stationId) || RADIO_STATIONS[0];
  const dayDurations: number[] = [];
  let totalCycleSeconds = 0;
  const baseSec = BASE_STATION_DAY_DURATIONS[stationId] || 240;

  for (let d = 1; d <= station.totalDays; d++) {
    // Szybka estymacja: baza stacji z lekkim zróżnicowaniem na podstawie numeru dnia
    // (pełna weryfikacja następuje przy ładowaniu audycji danego dnia)
    const variance = ((d * 37) % 45) - 20; // od -20 do +25 sekund
    const dur = Math.max(120, baseSec + variance);
    dayDurations.push(dur);
    totalCycleSeconds += dur;
  }

  durationCache[stationId] = { dayDurations, totalCycleSeconds };
  return durationCache[stationId];
}

/**
 * Zwraca aktualny stan transmisji NA ŻYWO w czasie rzeczywistym dla wybranej stacji radiowej.
 * Transmisja płynie 24/7 niezależnie od słuchacza – każdy dołączający w tej samej chwili
 * słyszy dokładnie tę samą audycję i ten sam moment rozważania.
 */
export function getStationLiveStatus(
  stationId: RadioStationId,
  nowMs: number = Date.now(),
  bibliaYear: 1 | 2 | 3 | 4 = 1
): StationLiveStatus {
  const station = RADIO_STATIONS.find(s => s.id === stationId) || RADIO_STATIONS[0];
  const { dayDurations, totalCycleSeconds } = getStationDurationTable(stationId);

  // Całkowita liczba sekund od epoki referencyjnej
  const diffSec = Math.floor(Math.abs(nowMs - GLOBAL_RADIO_EPOCH_MS) / 1000);
  const cycleOffsetSec = diffSec % totalCycleSeconds;

  let accumulatedSec = 0;
  let activeDay = 1;
  let activeDuration = dayDurations[0];
  let secondsElapsedInDay = 0;

  for (let i = 0; i < dayDurations.length; i++) {
    const dur = dayDurations[i];
    if (cycleOffsetSec < accumulatedSec + dur) {
      activeDay = i + 1;
      activeDuration = dur;
      secondsElapsedInDay = cycleOffsetSec - accumulatedSec;
      break;
    }
    accumulatedSec += dur;
  }

  const secondsRemainingInDay = Math.max(0, activeDuration - secondsElapsedInDay);
  const progressPercent = Math.min(100, Math.max(0, Math.round((secondsElapsedInDay / activeDuration) * 100)));

  const broadcastItem = getRadioBroadcastItem(stationId, activeDay, bibliaYear);

  // Tekst odczytu audycji: zawsze kompletna, pełna treść dnia od początku do końca, bez cięcia modlitw w połowie
  const liveSpeechText = broadcastItem.speechText;

  return {
    station,
    dayNumber: activeDay,
    totalDays: station.totalDays,
    dayDurationSeconds: activeDuration,
    secondsElapsedInDay,
    secondsRemainingInDay,
    progressPercent,
    broadcastItem,
    liveSpeechText,
    cycleTotalDurationSeconds: totalCycleSeconds
  };
}

/**
 * Zwraca status na żywo dla wszystkich 4 stacji radiowych w tej samej chwili.
 */
export function getAllStationsLiveStatus(
  nowMs: number = Date.now(),
  bibliaYear: 1 | 2 | 3 | 4 = 1
): StationLiveStatus[] {
  return RADIO_STATIONS.map(station => getStationLiveStatus(station.id, nowMs, bibliaYear));
}
