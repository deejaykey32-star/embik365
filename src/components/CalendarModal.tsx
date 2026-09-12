import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, RotateCcw, FileText, ChevronRight } from 'lucide-react';
import { CycleDate } from '../types';
import { CYCLE_DAYS, POLISH_MONTHS, getTodayCycleDate } from '../utils/dateCycle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: CycleDate;
  onSelectDate: (date: CycleDate) => void;
  uploadedDateKeys?: Set<string>;
}

export const CalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  uploadedDateKeys = new Set()
}) => {
  if (!isOpen) return null;

  const today = getTodayCycleDate();
  const [activeMonth, setActiveMonth] = useState<number>(selectedDate.month);

  const monthsList = [
    { id: 12, label: 'Grudzień', sub: 'Początek cyklu 25 XII oraz finał 1-24 XII' },
    { id: 1, label: 'Styczeń', sub: 'Dni 8 - 38' },
    { id: 2, label: 'Luty', sub: 'Dni 39 - 67' },
    { id: 3, label: 'Marzec', sub: 'Dni 68 - 98' },
    { id: 4, label: 'Kwiecień', sub: 'Dni 99 - 128' },
    { id: 5, label: 'Maj', sub: 'Dni 129 - 159' },
    { id: 6, label: 'Czerwiec', sub: 'Dni 160 - 189' },
    { id: 7, label: 'Lipiec', sub: 'Dni 190 - 220' },
    { id: 8, label: 'Sierpień', sub: 'Dni 221 - 251' },
    { id: 9, label: 'Wrzesień', sub: 'Dni 252 - 281' },
    { id: 10, label: 'Październik', sub: 'Dni 282 - 312' },
    { id: 11, label: 'Listopad', sub: 'Dni 313 - 342' },
  ];

  const daysInMonth = CYCLE_DAYS.filter(d => d.month === activeMonth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="bg-[#faf7f2] dark:bg-[#0d121c] rounded-3xl border border-[#e4d7c7] dark:border-[#212b3c] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#e7ded2] dark:border-[#212b3c] flex items-center justify-between bg-[#f4ebe1] dark:bg-[#141a26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8c572b] dark:bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5 text-[#fde4c8] dark:text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading-cinzel text-[#2d2218] dark:text-[#f3e8d2]">
                Wybór Dnia i Miesiąca
              </h2>
              <p className="text-xs text-[#7d6c5d] dark:text-[#94a3b8]">
                Cykl czytań: <span className="font-semibold text-[#8c572b] dark:text-amber-400">25 grudnia</span> (Dzień 1) → <span className="font-semibold text-[#8c572b] dark:text-amber-400">24 grudnia</span> (Dzień 366)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectDate(today);
                onClose();
              }}
              id="btn-calendar-jump-today"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1b2333] hover:bg-[#ede3d5] dark:hover:bg-[#253044] text-[#423223] dark:text-[#e2e8f0] text-xs font-semibold border border-[#d6c7b5] dark:border-[#2a364d] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Dziś ({today.displayDate})</span>
            </button>
            <button
              onClick={onClose}
              id="btn-calendar-close"
              className="p-2 rounded-xl text-[#786757] dark:text-[#94a3b8] hover:bg-[#e4d6c4] dark:hover:bg-[#1c2434] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left month selector + Right days grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Months list */}
          <div className="md:col-span-4 border-r border-[#e7ded2] dark:border-[#212b3c] overflow-y-auto p-3 bg-[#f8f3eb] dark:bg-[#0f1420] space-y-1">
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#8c7867] dark:text-[#94a3b8] px-2 py-1">
              Miesiące
            </div>
            {monthsList.map(m => {
              const isSelected = activeMonth === m.id;
              const isTodayMonth = today.month === m.id;

              return (
                <button
                  key={m.id}
                  id={`btn-month-${m.id}`}
                  onClick={() => setActiveMonth(m.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#35281e] dark:bg-amber-600 text-white shadow-xs font-semibold'
                      : 'hover:bg-[#ebe0d3] dark:hover:bg-[#18202e] text-[#403326] dark:text-[#cbd5e1]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{m.label}</span>
                      {isTodayMonth && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans-ui ${
                          isSelected ? 'bg-amber-400/30 text-amber-200' : 'bg-[#e2d2c1] dark:bg-[#202b3c] text-[#69513d] dark:text-amber-300'
                        }`}>
                          Dziś
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] truncate max-w-[200px] ${
                      isSelected ? 'text-[#cdbeaf] dark:text-amber-100' : 'text-[#857464] dark:text-[#808d9e]'
                    }`}>
                      {m.sub}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-300 dark:text-white' : 'text-[#a39180] dark:text-[#4b5563]'}`} />
                </button>
              );
            })}
          </div>

          {/* Days Grid */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto bg-[#faf7f2] dark:bg-[#0d121c]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading-cinzel font-bold text-base text-[#382b20] dark:text-[#f3e8d2]">
                Dni w miesiącu: {POLISH_MONTHS.find(m => m.id === activeMonth)?.nameNominative}
              </h3>
              <span className="text-xs text-[#7b6b5c] dark:text-[#94a3b8]">
                {daysInMonth.length} dni w cyklu
              </span>
            </div>

            {/* If December: explain the two parts (25-31 and 1-24) */}
            {activeMonth === 12 && (
              <div className="mb-4 p-3 rounded-xl bg-[#f0e4d4] dark:bg-[#192233] border border-[#ddccba] dark:border-[#2a374d] text-xs text-[#614936] dark:text-[#cbd5e1]">
                <div className="font-bold mb-1 dark:text-amber-300">Uwaga do Grudnia w cyklu rocznym:</div>
                <div className="flex flex-col gap-1">
                  <div>• <span className="font-semibold">25 - 31 grudnia:</span> Początek cyklu (Dni 1 do 7)</div>
                  <div>• <span className="font-semibold">1 - 24 grudnia:</span> Zakończenie cyklu (Dni 343 do 366)</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
              {daysInMonth.map(dateItem => {
                const isCurrentSelected = selectedDate.dateKey === dateItem.dateKey;
                const isCurrentToday = today.dateKey === dateItem.dateKey;
                const hasPdf = uploadedDateKeys.has(dateItem.dateKey);

                return (
                  <button
                    key={dateItem.dateKey}
                    id={`btn-day-${dateItem.dateKey}`}
                    onClick={() => {
                      onSelectDate(dateItem);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[76px] cursor-pointer ${
                      isCurrentSelected
                        ? 'bg-[#3b2d21] dark:bg-gradient-to-br dark:from-amber-600 dark:to-amber-700 text-white border-[#271d15] dark:border-amber-400 shadow-md ring-2 ring-amber-600/30 dark:ring-amber-400/50'
                        : isCurrentToday
                        ? 'bg-amber-100/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600/60 text-[#362719] dark:text-amber-200 hover:bg-amber-200/50 dark:hover:bg-amber-900/40'
                        : 'bg-white dark:bg-[#141b27] hover:bg-[#f3eae0] dark:hover:bg-[#1a2332] border-[#e2d5c6] dark:border-[#222d3d] text-[#34271c] dark:text-[#e2e8f0]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-base sm:text-lg font-bold font-serif-book leading-none">
                        {dateItem.day}
                      </span>
                      {hasPdf && (
                        <FileText className={`w-3.5 h-3.5 ${isCurrentSelected ? 'text-amber-300 dark:text-white' : 'text-red-600 dark:text-red-400'}`} title="Wgrany plik PDF" />
                      )}
                    </div>

                    <div className="mt-2">
                      <div className={`text-[10px] font-semibold leading-tight ${
                        isCurrentSelected ? 'text-amber-200 dark:text-white' : 'text-[#877464] dark:text-[#94a3b8]'
                      }`}>
                        Dzień {dateItem.dayNumber}
                      </div>
                      {isCurrentToday && (
                        <div className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tighter">
                          Dzisiaj
                        </div>
                      )}
                      {dateItem.isCycleStart && (
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">
                          Początek 25 XII
                        </div>
                      )}
                      {dateItem.isCycleEnd && (
                        <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-tighter">
                          Finał 24 XII
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 sm:p-4 border-t border-[#e7ded2] dark:border-[#212b3c] bg-[#f5ecdf] dark:bg-[#111723] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#7d6c5d] dark:text-[#94a3b8]">Szybkie skoki:</span>
            <button
              onClick={() => {
                const day1 = CYCLE_DAYS.find(d => d.dateKey === '12-25');
                if (day1) {
                  onSelectDate(day1);
                  onClose();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a2230] border border-[#d6c7b5] dark:border-[#2a364d] hover:bg-[#f1e6d7] dark:hover:bg-[#232e40] text-[#423223] dark:text-[#e2e8f0] font-medium cursor-pointer"
            >
              25 XII (Boże Narodzenie / Dzień 1)
            </button>
            <button
              onClick={() => {
                const dayEnd = CYCLE_DAYS.find(d => d.dateKey === '12-24');
                if (dayEnd) {
                  onSelectDate(dayEnd);
                  onClose();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1a2230] border border-[#d6c7b5] dark:border-[#2a364d] hover:bg-[#f1e6d7] dark:hover:bg-[#232e40] text-[#423223] dark:text-[#e2e8f0] font-medium cursor-pointer"
            >
              24 XII (Wigilia / Koniec)
            </button>
          </div>

          <div className="text-[#847363] dark:text-[#94a3b8] text-[11px]">
            Wybrano: <span className="font-bold text-[#35281e] dark:text-amber-300">{selectedDate.displayDate} (Dzień {selectedDate.dayNumber})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
