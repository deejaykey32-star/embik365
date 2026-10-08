import {
  RADIO_STATIONS,
  RadioStationId,
  RadioStationMeta,
  getRadioBroadcastItem,
  RadioBroadcastItem
} from './radioContentService';
import {
  getStationLiveStatus,
  StationLiveStatus
} from './radioLiveScheduleService';
import {
  playLectorSpeech,
  stopLectorSpeech,
  pauseLectorSpeech,
  resumeLectorSpeech,
  getLectorConfig,
  getLectorPlaybackState,
  LectorPlaybackState,
  unlockMobileAudio
} from './audioLectorService';

export interface RadioPlaybackState {
  isRadioActive: boolean;
  stationId: RadioStationId | null;
  dayNumber: number;
  totalDays: number;
  playbackState: LectorPlaybackState;
  isMuted: boolean;
  isLiveMode: boolean;
  isLoopEnabled: boolean;
  loopMode: 'station' | 'all_stations';
  bibliaYear: 1 | 2 | 3 | 4;
  currentBroadcastItem: RadioBroadcastItem | null;
  liveStatus: StationLiveStatus | null;
}

const RADIO_PLAYBACK_EVENT = 'drogowskazy_radio_playback_changed';

class RadioPlaybackManager {
  private stationId: RadioStationId | null = null;
  private dayNumber: number = 1;
  private playbackState: LectorPlaybackState = 'idle';
  private isMuted: boolean = false;
  private isLiveMode: boolean = true;
  private isLoopEnabled: boolean = true;
  private loopMode: 'station' | 'all_stations' = 'station';
  private bibliaYear: 1 | 2 | 3 | 4 = 1;
  private currentBroadcastItem: RadioBroadcastItem | null = null;
  private liveStatus: StationLiveStatus | null = null;
  private transitionTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('drogowskazy_lector_state_changed', () => {
        const state = getLectorPlaybackState();
        if (state !== this.playbackState) {
          this.playbackState = state;
          this.notifySubscribers();
        }
      });
    }
  }

  public getState(): RadioPlaybackState {
    const totalDays = this.stationId
      ? (RADIO_STATIONS.find(s => s.id === this.stationId)?.totalDays || 365)
      : 365;

    return {
      isRadioActive: this.stationId !== null && this.playbackState !== 'idle',
      stationId: this.stationId,
      dayNumber: this.dayNumber,
      totalDays,
      playbackState: this.playbackState,
      isMuted: this.isMuted,
      isLiveMode: this.isLiveMode,
      isLoopEnabled: this.isLoopEnabled,
      loopMode: this.loopMode,
      bibliaYear: this.bibliaYear,
      currentBroadcastItem: this.currentBroadcastItem,
      liveStatus: this.liveStatus
    };
  }

  private notifySubscribers() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(RADIO_PLAYBACK_EVENT, { detail: this.getState() })
      );
    }
  }

  /**
   * Dołącza do stacji radiowej w trybie NA ŻYWO (tradycyjne radio)
   * lub od wybranego numeru dnia. Transmisja trwa 24/7 w tle bez przerw.
   */
  public async tuneInStation(
    targetStationId: RadioStationId,
    customDay?: number,
    startFromLiveOffset: boolean = true
  ): Promise<void> {
    this.clearTransitionTimer();
    unlockMobileAudio();
    stopLectorSpeech();

    this.stationId = targetStationId;
    const stationMeta = RADIO_STATIONS.find(s => s.id === targetStationId) || RADIO_STATIONS[0];

    let speechTextToPlay = '';
    let dayToPlay = customDay;

    if (customDay === undefined) {
      // Pobieramy aktualny stan transmisji na żywo z zegara ramówki 24/7
      const live = getStationLiveStatus(targetStationId, Date.now(), this.bibliaYear);
      this.liveStatus = live;
      dayToPlay = live.dayNumber;
      this.isLiveMode = true;
      speechTextToPlay = startFromLiveOffset ? live.liveSpeechText : live.broadcastItem.speechText;
      this.currentBroadcastItem = live.broadcastItem;
    } else {
      this.isLiveMode = false;
      const safeDay = Math.max(1, Math.min(stationMeta.totalDays, customDay));
      dayToPlay = safeDay;
      const item = getRadioBroadcastItem(targetStationId, safeDay, this.bibliaYear);
      this.currentBroadcastItem = item;
      speechTextToPlay = item.speechText;
      this.liveStatus = getStationLiveStatus(targetStationId, Date.now(), this.bibliaYear);
    }

    this.dayNumber = dayToPlay;

    if (this.isMuted) {
      this.playbackState = 'paused';
      this.notifySubscribers();
      return;
    }

    this.playbackState = 'playing';
    this.notifySubscribers();

    const cfg = getLectorConfig();
    const item = this.currentBroadcastItem!;

    await playLectorSpeech({
      text: speechTextToPlay,
      config: cfg,
      title: `${item.headlineTitle} (${item.displayDate})`,
      sectionName: `Radio 24/7: ${item.stationName}`,
      onStart: () => {
        this.playbackState = 'playing';
        this.notifySubscribers();
      },
      onEnd: () => {
        this.handleTrackEnded();
      },
      onError: (err) => {
        console.warn('Radio stream playback warning, auto-recovering non-stop loop:', err);
        this.handlePlaybackError();
      },
      onNext: () => {
        this.playNextDay();
      },
      onPrev: () => {
        this.playPrevDay();
      }
    });
  }

  /**
   * Obsługa zakończenia audycji danego dnia:
   * Przechodzi natychmiast do kolejnego dnia w pętli 24/7 bez przerw.
   * Po zakończeniu całej serii zaczyna od początku (Dzień 1).
   */
  private handleTrackEnded() {
    if (!this.isLoopEnabled || !this.stationId) {
      this.playbackState = 'idle';
      this.notifySubscribers();
      return;
    }

    const currentMeta = RADIO_STATIONS.find(s => s.id === this.stationId) || RADIO_STATIONS[0];
    let nextStationId = this.stationId;
    let nextDay = this.dayNumber + 1;

    if (nextDay > currentMeta.totalDays) {
      if (this.loopMode === 'all_stations') {
        // Wielka pętla: przejdź do kolejnej z 4 stacji i zacznij od dnia 1
        const curIdx = RADIO_STATIONS.findIndex(s => s.id === this.stationId);
        const nextIdx = (curIdx + 1) % RADIO_STATIONS.length;
        nextStationId = RADIO_STATIONS[nextIdx].id;
        nextDay = 1;
      } else {
        // Po skończeniu całej serii od początku (Dzień 1)
        nextDay = 1;
      }
    }

    this.stationId = nextStationId;
    this.dayNumber = nextDay;
    this.currentBroadcastItem = getRadioBroadcastItem(nextStationId, nextDay, this.bibliaYear);
    this.notifySubscribers();

    // Płynne, natychmiastowe przejście do kolejnego dnia audycji bez przestoju
    this.transitionTimer = setTimeout(() => {
      this.tuneInStation(nextStationId, nextDay, false);
    }, 250);
  }

  private handlePlaybackError() {
    if (!this.isLoopEnabled || !this.stationId) {
      this.playbackState = 'idle';
      this.notifySubscribers();
      return;
    }

    const currentMeta = RADIO_STATIONS.find(s => s.id === this.stationId) || RADIO_STATIONS[0];
    const nextDay = this.dayNumber >= currentMeta.totalDays ? 1 : this.dayNumber + 1;
    this.dayNumber = nextDay;
    this.notifySubscribers();

    this.transitionTimer = setTimeout(() => {
      this.tuneInStation(this.stationId!, nextDay, false);
    }, 1200);
  }

  /**
   * Sprawdza, czy radio aktualnie nadaje i jest słyszalne.
   */
  public isListening(): boolean {
    return this.stationId !== null && this.playbackState === 'playing' && !this.isMuted;
  }

  /**
   * Automatycznie rozpoczyna lub wznawia podsłuch bez konieczności klikania Play/Włącz.
   */
  public ensurePlaying(defaultStationId: RadioStationId = 'nowyrhz'): void {
    if (!this.isListening() && !this.isMuted) {
      const target = this.stationId || defaultStationId;
      this.tuneInStation(target, undefined, true);
    }
  }

  /**
   * Przełącza wyciszenie podsłuchu.
   * Gdy słuchacz odcisza radio, natychmiast synchronizuje się z aktualnym czasem eteru na żywo!
   */
  public toggleMute(): void {
    this.setMuted(!this.isMuted);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.isMuted) {
      stopLectorSpeech();
      this.playbackState = 'paused';
      this.notifySubscribers();
    } else {
      const target = this.stationId || 'nowyrhz';
      this.tuneInStation(target, undefined, true);
    }
  }

  public pauseRadio() {
    this.setMuted(true);
  }

  public resumeRadio() {
    this.setMuted(false);
  }

  public stopRadio() {
    this.clearTransitionTimer();
    stopLectorSpeech();
    this.playbackState = 'idle';
    this.stationId = null;
    this.notifySubscribers();
  }

  public playNextDay() {
    if (!this.stationId) return;
    const currentMeta = RADIO_STATIONS.find(s => s.id === this.stationId) || RADIO_STATIONS[0];
    const nextDay = this.dayNumber >= currentMeta.totalDays ? 1 : this.dayNumber + 1;
    this.tuneInStation(this.stationId, nextDay, false);
  }

  public playPrevDay() {
    if (!this.stationId) return;
    const currentMeta = RADIO_STATIONS.find(s => s.id === this.stationId) || RADIO_STATIONS[0];
    const prevDay = this.dayNumber <= 1 ? currentMeta.totalDays : this.dayNumber - 1;
    this.tuneInStation(this.stationId, prevDay, false);
  }

  public setLoopEnabled(enabled: boolean) {
    this.isLoopEnabled = enabled;
    this.notifySubscribers();
  }

  public setLoopMode(mode: 'station' | 'all_stations') {
    this.loopMode = mode;
    this.notifySubscribers();
  }

  public setBibliaYear(year: 1 | 2 | 3 | 4) {
    this.bibliaYear = year;
    this.notifySubscribers();
  }

  private clearTransitionTimer() {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }
}

// Globalny singleton do zarządzania transmisją radiową w całej aplikacji
export const globalRadioManager = new RadioPlaybackManager();
export const RADIO_PLAYBACK_EVENT_NAME = RADIO_PLAYBACK_EVENT;
