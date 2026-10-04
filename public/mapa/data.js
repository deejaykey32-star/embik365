// Baza danych Pielgrzymki Gwiaździstej i Szlaku Orlich Gniazd 2026

export const PILGRIMAGE_STAGES = {
  STAGE_1: {
    id: "stage-1",
    name: "Etap I: Promienie Gwiazdy (Zbieżność do Częstochowy)",
    subtitle: "Różne strony świata i Polski zmierzają ku Jasnej Górze",
    description: "Pielgrzymki z całego świata i Polski zmierzają w kierunku Jasnej Góry niczym promienie wielkiej gwiazdy. Każda grupa przemieszcza się wybranym środkiem lokomocji według własnego harmonogramu.",
    center: [51.5, 19.1],
    zoom: 6
  },
  STAGE_2: {
    id: "stage-2",
    name: "Etap II: Wielkie Zjednoczenie – Szlak Orlich Gniazd",
    subtitle: "Częstochowa (Jasna Góra) -> Kraków-Łagiewniki (Sanktuarium Miłosierdzia Bożego)",
    period: "18 czerwca 2026 – 24 czerwca 2026",
    highlight: "Nocleg w Ojcowie w Dzień Ojca (23 czerwca 2026)",
    description: "Wspólna wielka pielgrzymka zjednoczonych grup przez malowniczy jurajski Szlak Orlich Gniazd. 7 dni wędrówki pośród zamków, ostańców skalnych i dolin aż do Łagiewnik.",
    center: [50.4, 19.6],
    zoom: 9
  },
  STAGE_3: {
    id: "stage-3",
    name: "Etap III: Rozesłanie (Missio – Błogosławieństwo)",
    subtitle: "Powrót z Łagiewnik do miejsc startu i świadectwo wiary",
    description: "Uroczyste rozesłanie pielgrzymów z Sanktuarium Miłosierdzia Bożego. Grupy wyruszają z powrotem do swoich domów i wspólnot na całym świecie, niosąc orędzie miłosierdzia.",
    center: [51.5, 19.1],
    zoom: 6
  }
};

// Promienie gwiazdy - Etap 1
export const STAR_RAYS = [
  {
    id: "ray-gdansk",
    name: "Promień Północny: Gdańsk - Częstochowa",
    mode: "Piesza",
    modeIcon: "fa-walking",
    color: "#e63946",
    startLocation: "Gdańsk (Bazylika Mariacka)",
    distance: "485 km",
    durationDays: 16,
    startDate: "2026-06-02",
    arrivalDate: "2026-06-17",
    liveStreamId: "jfKfPfyJRdk", // Lofi/Ambient placeholder stream or Catholic Live
    liveTitle: "Na Żywo: Grupa Kaszubsko-Gdańska na trasie",
    leader: "ks. Tomasz & s. Weronika",
    pilgrimsCount: 420,
    digitalPilgrims: 3850,
    coordinates: [
      [54.3499, 18.6534], // Gdańsk
      [54.0324, 18.7857], // Tczew
      [53.4842, 18.7538], // Grudziądz
      [53.1235, 18.0084], // Bydgoszcz
      [52.7957, 18.2587], // Inowrocław
      [52.4064, 16.9252], // Gniezno / Konin trail
      [52.2233, 18.2511], // Konin
      [51.7673, 18.0853], // Kalisz
      [51.4052, 18.5714], // Wieluń
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "02.06", from: "Gdańsk", to: "Tczew", km: 32, note: "Błogosławieństwo morza i start" },
      { day: 5, date: "06.06", from: "Świecie", to: "Bydgoszcz", km: 34, note: "Apel Jasnogórski nad Brdą" },
      { day: 10, date: "11.06", from: "Kruszwica", to: "Konin", km: 36, note: "Pasterka pielgrzymkowa" },
      { day: 14, date: "15.06", from: "Kalisz", to: "Wieluń", km: 38, note: "Różaniec hybrydowy" },
      { day: 16, date: "17.06", from: "Kłobuck", to: "Częstochowa (Jasna Góra)", km: 18, note: "Powitanie na Wałach Jasnogórskich" }
    ]
  },
  {
    id: "ray-wroclaw-bike",
    name: "Promień Zachodni: Wrocław - Częstochowa",
    mode: "Rowerowa",
    modeIcon: "fa-bicycle",
    color: "#2a9d8f",
    startLocation: "Wrocław (Ostrów Tumski)",
    distance: "198 km",
    durationDays: 4,
    startDate: "2026-06-14",
    arrivalDate: "2026-06-17",
    liveStreamId: "5qap5aO4i9A",
    liveTitle: "Kamera 360° na rowerze: Peleton Wrocławski w drodze",
    leader: "Piotr Zawadzki (Duszpasterstwo Rowerowe)",
    pilgrimsCount: 230,
    digitalPilgrims: 1940,
    coordinates: [
      [51.1141, 17.0463], // Wrocław
      [51.2078, 17.3828], // Oleśnica
      [51.1556, 17.9868], // Namysłów
      [51.0967, 18.1969], // Kluczbork
      [50.8752, 18.6853], // Lubliniec
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "14.06", from: "Wrocław", to: "Oleśnica", km: 45, note: "Start z Katedry św. Jana Chrzciciela" },
      { day: 2, date: "15.06", from: "Oleśnica", to: "Kluczbork", km: 62, note: "Odcinek leśny z modlitwą w drodze" },
      { day: 3, date: "16.06", from: "Kluczbork", to: "Lubliniec", km: 55, note: "Integracja peletonów" },
      { day: 4, date: "17.06", from: "Lubliniec", to: "Częstochowa", km: 36, note: "Triumfalny wjazd na Jasną Górę" }
    ]
  },
  {
    id: "ray-rome",
    name: "Promień Śródziemnomorski: Rzym - Częstochowa",
    mode: "Autokarowa & Hybrydowa",
    modeIcon: "fa-bus",
    color: "#e76f51",
    startLocation: "Rzym (Plac św. Piotra, Watykan)",
    distance: "1520 km",
    durationDays: 7,
    startDate: "2026-06-11",
    arrivalDate: "2026-06-17",
    liveStreamId: "DWcJFNfaw90",
    liveTitle: "Studio Mobilne Rzym: Relacja ze szlaku europejskiego",
    leader: "o. Matteo & s. Chiara",
    pilgrimsCount: 160,
    digitalPilgrims: 12400,
    coordinates: [
      [41.9022, 12.4539], // Rzym
      [43.7696, 11.2558], // Florencja
      [45.4384, 10.9916], // Werona
      [47.2692, 11.4041], // Innsbruck
      [48.2082, 16.3738], // Wiedeń
      [49.1951, 16.6068], // Brno
      [49.8344, 18.2923], // Ostrava
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "11.06", from: "Rzym", to: "Florencja", km: 280, note: "Błogosławieństwo Ojca Świętego" },
      { day: 3, date: "13.06", from: "Werona", to: "Innsbruck", km: 275, note: "Przejazd przez Alpy z rozważaniami" },
      { day: 5, date: "15.06", from: "Wiedeń", to: "Brno", km: 140, note: "Msza św. w katedrze św. Stefana" },
      { day: 7, date: "17.06", from: "Ostrava", to: "Częstochowa", km: 160, note: "Dotarcie na Jasną Górę" }
    ]
  },
  {
    id: "ray-vilnius",
    name: "Promień Kresowy: Wilno - Częstochowa",
    mode: "Pieszo-Autokarowa (Hybrydowa)",
    modeIcon: "fa-person-walking-luggage",
    color: "#f4a261",
    startLocation: "Wilno (Ostra Brama)",
    distance: "590 km",
    durationDays: 10,
    startDate: "2026-06-08",
    arrivalDate: "2026-06-17",
    liveStreamId: "Live_Vilnius_Ostrobramska",
    liveTitle: "Ostra Brama -> Jasna Góra: Śpiewy i transmisja na żywo",
    leader: "ks. Janusz & młodzież wileńska",
    pilgrimsCount: 290,
    digitalPilgrims: 5120,
    coordinates: [
      [54.6744, 25.2895], // Wilno
      [54.1018, 22.9298], // Suwałki
      [53.7997, 22.3619], // Ełk
      [53.1325, 23.1688], // Białystok
      [52.2297, 21.0122], // Warszawa
      [51.4027, 21.1471], // Radom
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "08.06", from: "Wilno (Ostra Brama)", to: "Druskieniki", km: 45, note: "Początek z Matką Miłosierdzia" },
      { day: 4, date: "11.06", from: "Suwałki", to: "Białystok", km: 120, note: "Etap autokarowo-pieszy" },
      { day: 7, date: "14.06", from: "Białystok", to: "Warszawa", km: 190, note: "Spotkanie z grupą warszawską" },
      { day: 10, date: "17.06", from: "Radom", to: "Częstochowa", km: 145, note: "Finałowe wejście" }
    ]
  },
  {
    id: "ray-warszawa-train",
    name: "Promień Centralny: Warszawa - Częstochowa",
    mode: "Pociąg & Smartfon (Kolejowa)",
    modeIcon: "fa-train",
    color: "#3a86ff",
    startLocation: "Warszawa Centralna",
    distance: "230 km",
    durationDays: 2,
    startDate: "2026-06-16",
    arrivalDate: "2026-06-17",
    liveStreamId: "Warszawa_Train_Live",
    liveTitle: "Wagon Modlitwy: Pociąg Pielgrzymkowy Warszawa-Częstochowa",
    leader: "Duszpasterstwo Akademickie św. Anny",
    pilgrimsCount: 850,
    digitalPilgrims: 4600,
    coordinates: [
      [52.2297, 21.0122], // Warszawa
      [52.0977, 20.6121], // Grodzisk Mazowiecki
      [51.7592, 19.4560], // Łódź
      [51.3411, 19.3664], // Bełchatów
      [51.0654, 19.4443], // Radomsko
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "16.06", from: "Warszawa", to: "Łódź Fabryczna", km: 130, note: "Nabożeństwo w podróży, warsztaty w wagonach" },
      { day: 2, date: "17.06", from: "Łódź", to: "Częstochowa Osobowa", km: 100, note: "Przejście procesyjne z dworca na Jasną Górę" }
    ]
  },
  {
    id: "ray-digital-global",
    name: "Promień Wirtualny: Cyfrowi Pielgrzymi Świata",
    mode: "Cyfrowa (Smartfon / VR / Hybrydowa)",
    modeIcon: "fa-mobile-screen-button",
    color: "#8338ec",
    startLocation: "Aplikacja Globalna (Ponad 45 krajów)",
    distance: "Dowolna / Globalna",
    durationDays: 14,
    startDate: "2026-06-04",
    arrivalDate: "2026-06-17",
    liveStreamId: "Global_Digital_Adoration",
    liveTitle: "Globalny Czat i Różaniec Nieustający Online",
    leader: "Zespół Ewangelizacji Cyfrowej",
    pilgrimsCount: 0,
    digitalPilgrims: 34200,
    coordinates: [
      [48.8566, 2.3522],  // Paryż
      [50.0755, 14.4378], // Praga
      [40.7128, -74.006], // Nowy Jork (symboliczny łącznik)
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "04.06", from: "Online", to: "Wirtualna Baza", km: 0, note: "Inauguracja cyfrowego licznika kroków i intencji" },
      { day: 7, date: "10.06", from: "Świat", to: "Modlitwa Live", km: 0, note: "Połączenie live ze wszystkimi grupami na trasie" },
      { day: 14, date: "17.06", from: "Sieć", to: "Częstochowa Live", km: 0, note: "Wirtualne przekroczenie Bramy Jasnogórskiej" }
    ]
  },
  {
    id: "ray-zakopane",
    name: "Promień Południowy: Zakopane - Częstochowa",
    mode: "Piesza Górska",
    modeIcon: "fa-person-hiking",
    color: "#06d6a0",
    startLocation: "Zakopane (Sanktuarium na Krzeptówkach)",
    distance: "235 km",
    durationDays: 9,
    startDate: "2026-06-09",
    arrivalDate: "2026-06-17",
    liveStreamId: "Zakopane_Krzeptowki_Live",
    liveTitle: "Górale na Szlaku: Transmisja z Podhala i Beskidów",
    leader: "ks. Władysław & kapela góralska",
    pilgrimsCount: 380,
    digitalPilgrims: 2800,
    coordinates: [
      [49.2992, 19.9496], // Zakopane
      [49.4842, 20.0323], // Nowy Targ
      [49.6105, 19.9622], // Rabka-Zdrój
      [49.7719, 19.7891], // Sucha Beskidzka
      [49.8833, 19.4939], // Wadowice
      [50.1438, 19.4086], // Chrzanów
      [50.4000, 19.2500], // Siewierz
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "09.06", from: "Zakopane", to: "Nowy Targ", km: 24, note: "Błogosławieństwo pod Tatrami" },
      { day: 5, date: "13.06", from: "Rabka", to: "Wadowice", km: 38, note: "Urodziny i dom św. Jana Pawła II" },
      { day: 9, date: "17.06", from: "Koziegłowy", to: "Częstochowa", km: 26, note: "Spotkanie z pozostałymi grupami" }
    ]
  },
  {
    id: "ray-lublin-auto",
    name: "Promień Wschodni: Lublin - Częstochowa",
    mode: "Samochodowa (Konwój Rodzin)",
    modeIcon: "fa-car",
    color: "#118ab2",
    startLocation: "Lublin (KUL / Archikatedra)",
    distance: "310 km",
    durationDays: 2,
    startDate: "2026-06-16",
    arrivalDate: "2026-06-17",
    liveStreamId: "Family_Car_Convoy_Live",
    liveTitle: "Radio Samochodowe Konwoju Rodzin: Modlitwa przez CB i YouTube",
    leader: "Rodzina Nowaków & Duszpasterstwo Rodzin",
    pilgrimsCount: 520,
    digitalPilgrims: 2100,
    coordinates: [
      [51.2465, 22.5684], // Lublin
      [51.4166, 21.9694], // Puławy
      [51.4027, 21.1471], // Radom
      [51.1114, 20.8524], // Skarżysko-Kamienna
      [50.8703, 20.6275], // Kielce
      [50.8540, 20.0261], // Włoszczowa
      [50.8122, 19.0975]  // Częstochowa
    ],
    schedule: [
      { day: 1, date: "16.06", from: "Lublin", to: "Kielce", km: 175, note: "Przejazd z postojami na modlitwę w sanktuariach" },
      { day: 2, date: "17.06", from: "Kielce", to: "Częstochowa", km: 135, note: "Wjazd kolumny na wyznaczone parkingi pielgrzymkowe" }
    ]
  }
];

// Etap 2: Szlak Orlich Gniazd (18 - 24 czerwca 2026) dzień po dniu
export const STAGE_2_DAYS = [
  {
    dayNumber: 1,
    date: "18.06.2026 (Czwartek)",
    name: "Dzień 1: Przełom Warty i Warownia Królewska",
    route: "Częstochowa (Jasna Góra) -> Zamek Olsztyn -> Zrębice -> Złoty Potok",
    distanceKm: 28,
    elevationGain: "320 m",
    highlights: ["Błogosławieństwo na Wałach Jasnej Góry", "Zamek Królewski w Olsztynie", "Rezerwat Sokole Góry", "Pałac Raczyńskich w Złotym Potoku"],
    coords: [
      [50.8122, 19.0975], // Jasna Góra
      [50.7712, 19.1623], // Kucelin / wyjście
      [50.7497, 19.2747], // Zamek Olsztyn
      [50.7342, 19.3458], // Zrębice
      [50.7093, 19.4347]  // Złoty Potok
    ],
    spiritualTheme: "„Wyjdź z twojej ziemi rodzinnej” – zawiązanie wspólnoty",
    media: [
      { type: "image", title: "Zamek Olsztyn w promieniach słońca", url: "https://images.unsplash.com/photo-1544986581-efac024faf62?w=800&auto=format&fit=crop" },
      { type: "audio", title: "Hymn Pielgrzymki 2026 - Zjednoczeni", duration: "3:45" }
    ],
    liveStream: {
      id: "Stage2_Day1_Olsztyn",
      title: "Transmisja Live: Wymarsz z Jasnej Góry i wspinaczka pod Zamek Olsztyn",
      viewers: 6420
    }
  },
  {
    dayNumber: 2,
    date: "19.06.2026 (Piątek)",
    name: "Dzień 2: Bliźniacze Twierdze i Jurajskie Ostańce",
    route: "Złoty Potok -> Ostrężnik -> Zamek Mirów -> Zamek Bobolice",
    distanceKm: 24,
    elevationGain: "280 m",
    highlights: ["Tajemniczy Zamek Ostrężnik", "Grzęda Mirowsko-Bobolicka", "Odbudowany Królewski Zamek Bobolice", "Wieczorna adoracja pod basztami"],
    coords: [
      [50.7093, 19.4347], // Złoty Potok
      [50.6865, 19.4032], // Ostrężnik
      [50.6455, 19.4754], // Mirów
      [50.6133, 19.4936]  // Bobolice
    ],
    spiritualTheme: "Pojednanie i braterstwo ponad podziałami",
    media: [
      { type: "image", title: "Zamek Bobolice o zmierzchu", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop" }
    ],
    liveStream: {
      id: "Stage2_Day2_Bobolice",
      title: "Transmisja Live: Droga Krzyżowa na Grzędzie Mirowskiej",
      viewers: 5890
    }
  },
  {
    dayNumber: 3,
    date: "20.06.2026 (Sobota)",
    name: "Dzień 3: Korona Jury i Majestat Skalnego Miasta",
    route: "Zamek Bobolice -> Góra Zborów (Podlesice) -> Zamek Bąkowiec (Morsko) -> Zamek Ogrodzieniec (Podzamcze)",
    distanceKm: 26,
    elevationGain: "360 m",
    highlights: ["Panorama z Góry Zborów (462 m n.p.m.)", "Zamek Bąkowiec w Morsku", "Najpotężniejsza twierdza Orlich Gniazd – Ogrodzieniec", "Koncert uwielbienia na dziedzińcu"],
    coords: [
      [50.6133, 19.4936], // Bobolice
      [50.5756, 19.5257], // Góra Zborów / Podlesice
      [50.5482, 19.5164], // Morsko Bąkowiec
      [50.4533, 19.5528]  // Zamek Ogrodzieniec Podzamcze
    ],
    spiritualTheme: "Budować dom na skale – wiara w próbach życia",
    media: [
      { type: "image", title: "Zamek Ogrodzieniec w Podzamczu", url: "https://images.unsplash.com/photo-1599818816933-4f901170b6aa?w=800&auto=format&fit=crop" }
    ],
    liveStream: {
      id: "Stage2_Day3_Ogrodzieniec",
      title: "Transmisja Live: Nocne Czuwanie w ruinach Zamku Ogrodzieniec",
      viewers: 9140
    }
  },
  {
    dayNumber: 4,
    date: "21.06.2026 (Niedziela)",
    name: "Dzień 4: Dolina Wodącej i Pustynne Piaski",
    route: "Zamek Ogrodzieniec -> Zamek Smoleń -> Bydlin -> Klucze / Pustynia Błędowska",
    distanceKm: 27,
    elevationGain: "250 m",
    highlights: ["Zamek Smoleń z cylindryczną wieżą", "Zegarowe Skały w Dolinie Wodącej", "Kościółek obronny w Bydlinie", "Róża Wiatrów – Pustynia Błędowska"],
    coords: [
      [50.4533, 19.5528], // Ogrodzieniec
      [50.4389, 19.6783], // Smoleń
      [50.3956, 19.6433], // Bydlin
      [50.3421, 19.5672]  // Klucze / Pustynia Błędowska
    ],
    spiritualTheme: "„Wyprowadzę cię na pustynię i będę mówił do twego serca”",
    media: [
      { type: "image", title: "Zamek Smoleń", url: "https://images.unsplash.com/photo-1582560475093-ba66accbc424?w=800&auto=format&fit=crop" }
    ],
    liveStream: {
      id: "Stage2_Day4_Pustynia",
      title: "Transmisja Live: Msza Święta na skraju Pustyni Błędowskiej",
      viewers: 7350
    }
  },
  {
    dayNumber: 5,
    date: "22.06.2026 (Poniedziałek)",
    name: "Dzień 5: Srebrny Gród i Perła Renesansu",
    route: "Klucze -> Olkusz (Rynek) -> Zamek Rabsztyn -> Sułoszowa -> Zamek Pieskowa Skała",
    distanceKm: 25,
    elevationGain: "310 m",
    highlights: ["Srebrne miasto Olkusz", "Imponujący Zamek Rabsztyn", "Rezerwat Doliny Prądnika", "Renesansowy Zamek Pieskowa Skała i Maczuga Herkulesa"],
    coords: [
      [50.3421, 19.5672], // Klucze
      [50.2801, 19.5639], // Olkusz
      [50.2989, 19.5931], // Rabsztyn
      [50.2439, 19.7828]  // Pieskowa Skała
    ],
    spiritualTheme: "Piękno stworzenia i dar wdzięczności",
    media: [
      { type: "image", title: "Pieskowa Skała i Maczuga Herkulesa", url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop" }
    ],
    liveStream: {
      id: "Stage2_Day5_PieskowaSkala",
      title: "Transmisja Live: Od Rabsztyna po Maczugę Herkulesa",
      viewers: 6180
    }
  },
  {
    dayNumber: 6,
    date: "23.06.2026 (Wtorek - DZIEŃ OJCA)",
    name: "Dzień 6: Dolina Prądnika – Nocleg w Ojcowie w DZIEŃ OJCA",
    route: "Pieskowa Skała -> Grodzisko (Pustelnia bł. Salomei) -> Brama Krakowska -> Zamek Kazimierzowski w Ojcowie",
    distanceKm: 18,
    elevationGain: "210 m",
    highlights: [
      "Specjalny Dzień Ojca – modlitwa za ojców i rodziców",
      "Pustelnia bł. Salomei w Grodzisku",
      "Kaplica 'Na Wodzie' w Ojcowie",
      "Skała Rękawica i Brama Krakowska",
      "Nocleg w Ojcowie (Pola namiotowe, pensjonaty, agroturystyki, remiza, szkoła)"
    ],
    coords: [
      [50.2439, 19.7828], // Pieskowa Skała
      [50.2289, 19.8242], // Grodzisko
      [50.2106, 19.8294]  // Ojców
    ],
    spiritualTheme: "Ojcostwo Boże i ziemskie – wielkie czuwanie i modlitwa w Dzień Ojca",
    media: [
      { type: "image", title: "Dolina Prądnika i Zamek w Ojcowie", url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop" }
    ],
    liveStream: {
      id: "Stage2_Day6_Ojcow_DzienOjca",
      title: "TRANSMISJA SPECJALNA: Czuwanie w Dniu Ojca w Ojcowie pod Bramą Krakowską",
      viewers: 14200
    }
  },
  {
    dayNumber: 7,
    date: "24.06.2026 (Środa)",
    name: "Dzień 7: Wejście do Krakowa i Uroczyste Zwieńczenie w Łagiewnikach",
    route: "Ojców -> Zamek Korzkiew -> Kraków (Wawel) -> Kraków-Łagiewniki (Sanktuarium Bożego Miłosierdzia)",
    distanceKm: 26,
    elevationGain: "190 m",
    highlights: [
      "Zamek Korzkiew",
      "Wkroczenie do Królewskiego Krakowa",
      "Zamek Królewski na Wawelu",
      "Przejście przez kładkę o. Bernatka ku Podgórzu",
      "Uroczyste Wejście do Bazyliki Bożego Miłosierdzia w Łagiewnikach",
      "Godzina Miłosierdzia (15:00) i Uroczysta Msza Święta Te Deum"
    ],
    coords: [
      [50.2106, 19.8294], // Ojców
      [50.1583, 19.8833], // Korzkiew
      [50.0833, 19.9167], // Północny Kraków
      [50.0540, 19.9354], // Wawel
      [50.0197, 19.9377]  // Łagiewniki Sanktuarium Bożego Miłosierdzia
    ],
    spiritualTheme: "„Jezu, ufam Tobie” – Zanurzenie w Bożym Miłosierdziu",
    media: [
      { type: "image", title: "Sanktuarium Bożego Miłosierdzia w Łagiewnikach", url: "https://images.unsplash.com/photo-1548625361-195973b4d4b1?w=800&auto=format&fit=crop" }
    ],
    liveStream: {
      id: "Stage2_Day7_Lagiewniki_Final",
      title: "GŁÓWNA TRANSMISJA: Finałowe Wejście do Łagiewnik i Msza Święta Jedności",
      viewers: 28500
    }
  }
];

// Cała zintegrowana trasa Orlich Gniazd (interpolowana)
export const ORLE_GNIAZDA_FULL_PATH = [
  [50.8122, 19.0975], // Częstochowa Jasna Góra
  [50.7712, 19.1623],
  [50.7497, 19.2747], // Olsztyn
  [50.7342, 19.3458], // Zrębice
  [50.7093, 19.4347], // Złoty Potok
  [50.6865, 19.4032], // Ostrężnik
  [50.6455, 19.4754], // Mirów
  [50.6133, 19.4936], // Bobolice
  [50.5756, 19.5257], // Góra Zborów
  [50.5482, 19.5164], // Morsko
  [50.4533, 19.5528], // Ogrodzieniec
  [50.4389, 19.6783], // Smoleń
  [50.3956, 19.6433], // Bydlin
  [50.3421, 19.5672], // Klucze
  [50.2801, 19.5639], // Olkusz
  [50.2989, 19.5931], // Rabsztyn
  [50.2439, 19.7828], // Pieskowa Skała
  [50.2289, 19.8242], // Grodzisko
  [50.2106, 19.8294], // Ojców (Nocleg 23.06 w Dzień Ojca)
  [50.1583, 19.8833], // Korzkiew
  [50.0540, 19.9354], // Wawel
  [50.0197, 19.9377]  // Łagiewniki
];

// Baza noclegów z pełnym podziałem na kategorie
export const ACCOMMODATIONS = [
  {
    id: "acc-czestochowa-1",
    name: "Dom Pielgrzyma im. św. Jana Pawła II",
    stageDay: 0,
    location: "Częstochowa (obok Klasztoru)",
    type: "dom_parafialny",
    typeLabel: "Dom Pielgrzyma / Parafia",
    lat: 50.8115,
    lng: 19.0945,
    capacity: "650 miejsc",
    priceRange: "Ofiara dobrowolna / 40-70 zł",
    contact: "+48 34 377 72 22",
    amenities: ["Wi-Fi", "Prysznice", "Ciepła woda", "Stołówka pielgrzymkowa", "Kaplica 24h", "Dostęp dla niepełnosprawnych"],
    description: "Centrum zakwaterowania przed wyruszeniem na Szlak Orlich Gniazd. Bezpośrednie sąsiedztwo Wałów Jasnogórskich."
  },
  {
    id: "acc-czestochowa-camp",
    name: "Miejskie Pole Namiotowe 'Oleńka'",
    stageDay: 0,
    location: "Częstochowa, ul. Oleńki 22",
    type: "pole_namiotowe",
    typeLabel: "Pole Namiotowe / Camping",
    lat: 50.8142,
    lng: 19.0911,
    capacity: "1200 namiotów",
    priceRange: "20 zł / namiot",
    contact: "+48 34 365 55 56",
    amenities: ["Sanitariaty", "Prąd do ładowania telefonów", "Stanowiska kuchenne", "Ochrona terenu"],
    description: "Główne pole namiotowe dla grup młodzieżowych i pielgrzymów pod namiotami."
  },
  {
    id: "acc-zloty-potok-school",
    name: "Szkoła Podstawowa & Sala Gimnastyczna w Złotym Potoku",
    stageDay: 1,
    location: "Złoty Potok, gm. Janów",
    type: "szkola",
    typeLabel: "Szkoła / Hala Sportowa",
    lat: 50.7121,
    lng: 19.4312,
    capacity: "350 materaców / karimat",
    priceRange: "15 zł (koszty mediów)",
    contact: "+48 34 327 80 11",
    amenities: ["Natryski", "Ciepły wrzątek rano i wieczorem", "Świetlica multimedialna", "Bezpieczny parking dla busów"],
    description: "Nocleg zbiorowy na salach gimnastycznych i klasach po pierwszym dniu marszu."
  },
  {
    id: "acc-zloty-potok-agro",
    name: "Agroturystyka 'Pstrągarnia i Jurajski Zakątek'",
    stageDay: 1,
    location: "Złoty Potok, ul. Kościuszki",
    type: "agroturystyka",
    typeLabel: "Agroturystyka",
    lat: 50.7065,
    lng: 19.4398,
    capacity: "28 miejsc",
    priceRange: "60-90 zł / os.",
    contact: "+48 602 123 456",
    amenities: ["Pokoje z łazienkami", "Domowe posiłki jurajskie", "Ogród", "Możliwość prania"],
    description: "Przytulne gospodarstwo agroturystyczne w sercu Parku Krajobrazowego Orlich Gniazd."
  },
  {
    id: "acc-bobolice-hotel",
    name: "Hotel Zamek Bobolice ***",
    stageDay: 2,
    location: "Bobolice 1",
    type: "hotel",
    typeLabel: "Hotel / Motel",
    lat: 50.6139,
    lng: 19.4925,
    capacity: "65 miejsc",
    priceRange: "180-320 zł / pokój",
    contact: "+48 34 328 80 07",
    amenities: ["Restauracja zamkowa", "Komfortowe łóżka", "Śniadanie w cenie", "Widok na zamek"],
    description: "Luksusowy odpoczynek u stóp królewskiego zamku dla pielgrzymów potrzebujących regeneracji."
  },
  {
    id: "acc-mirow-camp",
    name: "Jurajskie Błonia Namiotowe Mirów",
    stageDay: 2,
    location: "Mirów (u stóp Grzędy Mirowskiej)",
    type: "pole_namiotowe",
    typeLabel: "Pole Namiotowe / Camping",
    lat: 50.6441,
    lng: 19.4772,
    capacity: "800 namiotów",
    priceRange: "15 zł / os.",
    contact: "+48 604 789 012",
    amenities: ["Umywalnie polowe", "Miejsce na ognisko pielgrzymkowe", "Punkt medyczny Maltańczyków", "Mobilna kawiarnia"],
    description: "Niezapomniany nocleg pod gwiazdami pośród wapiennych skałek i zamkowych baszt."
  },
  {
    id: "acc-podlesice-schronisko",
    name: "Schronisko Młodzieżowe PTSM 'Pod Lipą' Podlesice",
    stageDay: 2,
    location: "Podlesice (Góra Zborów)",
    type: "schronisko",
    typeLabel: "Schronisko PTTK / PTSM",
    lat: 50.5734,
    lng: 19.5281,
    capacity: "90 miejsc",
    priceRange: "35-50 zł / os.",
    contact: "+48 34 315 20 44",
    amenities: ["Kuchnia samoobsługowa", "Prysznice", "Stemple do książeczek turystycznych", "Sklepik"],
    description: "Historyczne schronisko turystyczne tuż przy Rezerwacie Przyrody Góra Zborów."
  },
  {
    id: "acc-ogrodzieniec-parafia",
    name: "Parafia Przemienienia Pańskiego i Gościnni Mieszkańcy Ogrodzieńca",
    stageDay: 3,
    location: "Ogrodzieniec / Podzamcze",
    type: "dom_parafialny",
    typeLabel: "Kwatery Prywatne u Rodzin / Parafia",
    lat: 50.4512,
    lng: 19.5211,
    capacity: "500 osób u rodzin + 150 w salkach",
    priceRange: "Tradycyjna gościnność polska (Co łaska)",
    contact: "+48 32 673 21 00",
    amenities: ["Ciepły posiłek od gospodarzy", "Rodzinna atmosfera", "Pranie ubrań pielgrzymich", "Modlitwa wieczorna"],
    description: "Tradycyjne przyjęcie pielgrzymów przez mieszkańców Ogrodzieńca i Podzamcza. Niezwykłe świadectwo gościnności."
  },
  {
    id: "acc-ogrodzieniec-camp",
    name: "Pole Biwakowe 'Pod Basztą' w Podzamczu",
    stageDay: 3,
    location: "Podzamcze, ul. Zamkowa",
    type: "pole_namiotowe",
    typeLabel: "Pole Namiotowe / Camping",
    lat: 50.4552,
    lng: 19.5541,
    capacity: "1000 namiotów",
    priceRange: "20 zł / os.",
    contact: "+48 32 673 22 20",
    amenities: ["Światło, woda, toalety", "Punkt ładowania powerbanków", "Bliskość ruin zamku"],
    description: "Nocleg tuż przy oświetlonych murach Zamku Ogrodzieniec z widokiem na skalne ostańce."
  },
  {
    id: "acc-klucze-szkola",
    name: "Zespół Szkół i Hala Sportowa Klucze (Pustynia Błędowska)",
    stageDay: 4,
    location: "Klucze, ul. Zawierciańska",
    type: "szkola",
    typeLabel: "Szkoła / Hala Sportowa",
    lat: 50.3444,
    lng: 19.5631,
    capacity: "400 miejsc na materacach",
    priceRange: "Bezpłatnie dla zarejestrowanych",
    contact: "+48 32 642 81 20",
    amenities: ["Pełne zaplecze sanitarne", "Bufet herbaty i kawy", "Internet Wi-Fi", "Gabinet ratownika medycznego"],
    description: "Oaza odpoczynku po przejściu okolic Pustyni Błędowskiej i Doliny Wodącej."
  },
  {
    id: "acc-olkusz-hotel",
    name: "Hotel Victoria & Motele Olkusz",
    stageDay: 4,
    location: "Olkusz, Traugutta",
    type: "hotel",
    typeLabel: "Hotel / Motel",
    lat: 50.2789,
    lng: 19.5590,
    capacity: "120 miejsc",
    priceRange: "120-210 zł",
    contact: "+48 32 645 10 00",
    amenities: ["Pokoje 1, 2, 3-osobowe", "Śniadania", "Klimatyzacja"],
    description: "Baza noclegowa w zabytkowym Olkuszu dla asysty technicznej i pielgrzymów."
  },
  {
    id: "acc-suloszowa-agro",
    name: "Gospodarstwo Agroturystyczne 'Pod Maczugą'",
    stageDay: 5,
    location: "Sułoszowa (okolice Pieskowej Skały)",
    type: "agroturystyka",
    typeLabel: "Agroturystyka",
    lat: 50.2471,
    lng: 19.7801,
    capacity: "35 miejsc",
    priceRange: "55-80 zł",
    contact: "+48 601 998 877",
    amenities: ["Świeże mleko i chleb wiejski", "Ogród z hamakami", "Ciepłe prysznice"],
    description: "Swojski wypoczynek przed wejściem do Ojcowskiego Parku Narodowego."
  },
  // DZIEŃ OJCA - NOCLEG W OJCOWIE (23.06.2026)
  {
    id: "acc-ojcow-camp-glowny",
    name: "Główne Błonia Pielgrzymie w Ojcowie (DZIEŃ OJCA)",
    stageDay: 6,
    location: "Ojców – Dolina Prądnika (koło Złotej Góry)",
    type: "pole_namiotowe",
    typeLabel: "Główne Pole Pielgrzymie i Namiotowe",
    lat: 50.2131,
    lng: 19.8272,
    capacity: "2500 namiotów",
    priceRange: "Wstęp wolny (Pielgrzymka Zjednoczona)",
    contact: "+48 12 389 20 05",
    amenities: ["Polowe ołtarze i scena czuwania", "Cysterny z wodą pitną", "50 kabin prysznicowych", "Punkt Caritas z ciepłą zupą", "Kącik Modlitwy za Ojców"],
    description: "SZCZEGÓLNE MIEJSCE: Centralne miasteczko namiotowe na Nocleg w Dzień Ojca 23.06.2026! Czuwanie pod gwiazdami Jury."
  },
  {
    id: "acc-ojcow-pensjonaty",
    name: "Ojcowskie Wille i Pokoje Gościnne ('Zosia', 'Pod Koroną')",
    stageDay: 6,
    location: "Ojców Centrum",
    type: "hotel",
    typeLabel: "Pensjonaty i Wille Historyczne",
    lat: 50.2101,
    lng: 19.8315,
    capacity: "180 miejsc",
    priceRange: "80-160 zł / os.",
    contact: "+48 12 389 20 20",
    amenities: ["Zabytkowa architektura szwajcarska", "Śniadanie", "Cisza Ojcowskiego Parku Narodowego"],
    description: "Drewniane wille zdrojowe w sercu Ojcowa z widokiem na Zamek Kazimierzowski."
  },
  {
    id: "acc-ojcow-remiza-szkola",
    name: "Szkoła i Remiza OSP w Ojcowie / Grodzisku",
    stageDay: 6,
    location: "Ojców / Skała",
    type: "szkola",
    typeLabel: "Szkoła / Remiza Strażacka OSP",
    lat: 50.2185,
    lng: 19.8350,
    capacity: "320 miejsc",
    priceRange: "Dar serca",
    contact: "+48 12 389 10 08",
    amenities: ["Nocleg pod dachem", "Pralnia polowa", "Herbaciarnia strażacka"],
    description: "Otwarte serca druhów strażaków i nauczycieli dla zjednoczonej rzeszy pielgrzymiej."
  },
  {
    id: "acc-lagiewniki-dom-milosierdzia",
    name: "Dom Duszpasterski Sanktuarium Bożego Miłosierdzia w Łagiewnikach",
    stageDay: 7,
    location: "Kraków, ul. Siostry Faustyny 3",
    type: "dom_parafialny",
    typeLabel: "Dom Pielgrzyma w Łagiewnikach",
    lat: 50.0191,
    lng: 19.9388,
    capacity: "500 łóżek + sala audytoryjna",
    priceRange: "50-100 zł / os.",
    contact: "+48 12 252 33 00",
    amenities: ["Widok na Bazylikę i Wieżę Miłosierdzia", "Pełne wyżywienie", "Kaplica Wieczystej Adoracji", "Punkt rejestracji Certyfikatów"],
    description: "Meta szlaku i miejsce spoczynku po 7-dniowej wędrówce Orlimi Gniazdami. Tu rozpoczyna się Etap III - Rozesłanie."
  },
  {
    id: "acc-krakow-blonia-camp",
    name: "Miasteczko Rozesłania (Kraków - Łagiewniki Błonia)",
    stageDay: 7,
    location: "Kraków - Białe Morza / Łagiewniki",
    type: "pole_namiotowe",
    typeLabel: "Wielkie Pole Pielgrzymkowe",
    lat: 50.0152,
    lng: 19.9360,
    capacity: "5000 namiotów",
    priceRange: "Bezpłatne z akredytacją",
    contact: "+48 12 252 30 00",
    amenities: ["Wielka scena rozesłania", "Strefa expo ewangelizacyjnego", "Darmowe Wi-Fi", "Punkt ładowania urządzeń"],
    description: "Obszar finałowy zjednoczonych pielgrzymek z całego świata przed uroczystym Missio."
  }
];

// Multimedialne punkty POI ze zdjęciami, nagraniami i opisami
export const POI_POINTS = [
  {
    id: "poi-jasna-gora",
    name: "Jasna Góra – Sanktuarium Matki Bożej Częstochowskiej",
    category: "Święte Miejsce",
    lat: 50.8122,
    lng: 19.0975,
    img: "https://images.unsplash.com/photo-1548625361-195973b4d4b1?w=800&auto=format&fit=crop",
    audioGuide: "audio_jasna_gora.mp3",
    description: "Serce duchowe Polski. Punkt zbiegu wszystkich promieni gwiazdy w Etapie I oraz uroczysty start wspólnego marszu w Etapie II (18 czerwca 2026 r.).",
    liveCamera: true
  },
  {
    id: "poi-zamek-olsztyn",
    name: "Ruiny Zamku Królewskiego w Olsztynie",
    category: "Zamek Orlich Gniazd",
    lat: 50.7497,
    lng: 19.2747,
    img: "https://images.unsplash.com/photo-1544986581-efac024faf62?w=800&auto=format&fit=crop",
    description: "Średniowieczna warownia Kazimierza Wielkiego z charakterystyczną 35-metrową basztą gotycką górującą nad wapiennymi wzgórzami.",
    liveCamera: false
  },
  {
    id: "poi-bobolice-mirow",
    name: "Zamki Bliźniacze Mirów i Bobolice",
    category: "Zamek Orlich Gniazd",
    lat: 50.6133,
    lng: 19.4936,
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop",
    description: "Dwie majestatyczne twierdze połączone malowniczym 2-kilometrowym grzbietem skalnym (Grzęda Mirowska). Dzień 2 wędrówki.",
    liveCamera: true
  },
  {
    id: "poi-ogrodzieniec",
    name: "Zamek Ogrodzieniec w Podzamczu",
    category: "Zamek Orlich Gniazd",
    lat: 50.4533,
    lng: 19.5528,
    img: "https://images.unsplash.com/photo-1599818816933-4f901170b6aa?w=800&auto=format&fit=crop",
    description: "Największy i najlepiej zachowany zamek Jury Krakowsko-Częstochowskiej, wkomponowany w monumentalne ostańce skalne na Górze Janowskiego.",
    liveCamera: true
  },
  {
    id: "poi-pustynia-bledowska",
    name: "Pustynia Błędowska i Róża Wiatrów",
    category: "Przyroda i Krajobraz",
    lat: 50.3421,
    lng: 19.5672,
    img: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop",
    description: "Największy w Europie Środkowej obszar piasków lotnych. Miejsce refleksji i niedzielnej modlitwy 'Przez pustynię ku wolności'.",
    liveCamera: false
  },
  {
    id: "poi-pieskowa-skala",
    name: "Zamek Pieskowa Skała i Maczuga Herkulesa",
    category: "Zabytek UNESCO / Renesans",
    lat: 50.2439,
    lng: 19.7828,
    img: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    description: "Perła renesansowej architektury obronnej, wznosząca się nad Doliną Prądnika tuż obok 25-metrowej skały Maczuga Herkulesa.",
    liveCamera: true
  },
  {
    id: "poi-ojcow-brama-krakowska",
    name: "Brama Krakowska i Zamek w Ojcowie",
    category: "DZIEŃ OJCA - Kulminacja",
    lat: 50.2106,
    lng: 19.8294,
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    description: "Naturalna brama skalna zamykająca wylot Wąwozu Ciasne Skałki. Tu odbędzie się nocleg w Dzień Ojca (23 czerwca 2026 r.) i ognisko jedności ojców i dzieci.",
    liveCamera: true
  },
  {
    id: "poi-lagiewniki-sanktuarium",
    name: "Sanktuarium Bożego Miłosierdzia w Łagiewnikach",
    category: "Święte Miejsce – Cel Szlaku",
    lat: 50.0197,
    lng: 19.9377,
    img: "https://images.unsplash.com/photo-1548625361-195973b4d4b1?w=800&auto=format&fit=crop",
    description: "Światowe Centrum Kultu Miłosierdzia Bożego ze słynnym obrazem 'Jezu, ufam Tobie' i relikwiami św. Siostry Faustyny Kowalskiej. Meta Etapu II i początek Rozesłania (Etap III).",
    liveCamera: true
  }
];

// Dane transmisji na żywo (YouTube Live / Kamery)
export const LIVE_STREAMS = [
  {
    id: "live-main",
    group: "Pielgrzymka Główna (Częstochowa - Łagiewniki)",
    channel: "Telewizja Pielgrzymkowa Live",
    youtubeId: "jfKfPfyJRdk", // embed id
    active: true,
    viewersCount: "34 820 oglądających",
    badge: "TRANSMISJA GŁÓWNA",
    description: "Wspólny szlak Orlich Gniazd – transmisja z mobilnej kamery drona i czoła kolumny pielgrzymów."
  },
  {
    id: "live-gdansk",
    group: "Promień Północny (Gdańsk - Piesza)",
    channel: "Grupa Kaszubska YouTube Live",
    youtubeId: "5qap5aO4i9A",
    active: true,
    viewersCount: "4 120 oglądających",
    badge: "PROMIEŃ GDAŃSKI",
    description: "Śpiewy, modlitwy i wywiady z trasy pielgrzymki morskiej zmierzającej ku Jasnej Górze."
  },
  {
    id: "live-wroclaw",
    group: "Promień Zachodni (Wrocław - Rowerowa)",
    channel: "Peleton Rowerowy Live Stream",
    youtubeId: "DWcJFNfaw90",
    active: true,
    viewersCount: "2 890 oglądających",
    badge: "PROMIEŃ ROWEROWY",
    description: "Kamera 4K z kierownicy przewodnika grupy rowerowej na trasie z Dolnego Śląska."
  },
  {
    id: "live-rome",
    group: "Promień Europejski (Rzym / Watykan - Autokarowa)",
    channel: "Pellegrinaggio di Roma Live",
    youtubeId: "7T4H8Q0n6xY",
    active: true,
    viewersCount: "8 940 oglądających",
    badge: "PROMIEŃ RZYMSKI",
    description: "Wspólna modlitwa w języku włoskim i polskim przez przełęcze alpejskie ku Polsce."
  },
  {
    id: "live-ojcow",
    group: "Czuwanie w Dniu Ojca (Ojców 23.06.2026)",
    channel: "Ojcowie na Szlaku TV",
    youtubeId: "jfKfPfyJRdk",
    active: true,
    viewersCount: "19 450 oglądających",
    badge: "DZIEŃ OJCA LIVE",
    description: "Transmisja uroczystego nabożeństwa i świadectw ojców w Ojcowskim Parku Narodowym."
  },
  {
    id: "live-lagiewniki-kaplica",
    group: "Łagiewniki – Wieczysta Adoracja",
    channel: "Sanktuarium Łagiewniki TV",
    youtubeId: "Live_Faustyna_Lagiewniki",
    active: true,
    viewersCount: "12 110 oglądających",
    badge: "KAPLICA ŁAGIEWNIKI",
    description: "Obraz Jezusa Miłosiernego i grób św. Faustyny – transmisja ciągła 24/7."
  }
];

// Przykładowe intencje modlitewne cyfrowych pielgrzymów
export const SAMPLE_PRAYER_INTENTIONS = [
  { id: 1, author: "Marek z Poznania", text: "O zdrowie dla taty Jana w Dniu Ojca i o zgodę w naszej rodzinie.", date: "10 minut temu", likes: 42, group: "Promień Zachodni" },
  { id: 2, author: "Maria & Giuseppe (Roma)", text: "Per la pace in tutto il mondo e per i giovani pellegrini.", date: "25 minut temu", likes: 89, group: "Promień Śródziemnomorski" },
  { id: 3, author: "Ania (Pielgrzymka Cyfrowa)", text: "Łączę się duchowo ze szpitala – ofiaruję ten ból w intencji wszystkich idących Szlakiem Orlich Gniazd.", date: "40 minut temu", likes: 178, group: "Pielgrzymka Cyfrowa" },
  { id: 4, author: "Peleton Rowerowy Wrocław", text: "Za bezpieczną drogę dla wszystkich rowerzystów i kierowców.", date: "1 godzinę temu", likes: 64, group: "Promień Rowerowy" }
];
