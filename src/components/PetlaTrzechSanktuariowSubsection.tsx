import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Headphones, 
  Volume2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Square, 
  Maximize2, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Route, 
  Info, 
  Sparkles, 
  Heart, 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  Calendar,
  Layers,
  Flame,
  AlertTriangle,
  PhoneCall,
  CheckSquare
} from 'lucide-react';
import { 
  playLectorSpeech, 
  stopLectorSpeech, 
  getLectorConfig, 
  unlockMobileAudio,
  getLectorPlaybackState 
} from '../utils/audioLectorService';

interface Props {
  theme?: 'light' | 'dark';
}

interface PilgrimageDay {
  n: number;
  date: string;
  stage: number;
  km: number;
  level: 1 | 2 | 3;
  from: string;
  to: string;
  start?: string;
  route: string;
  warn?: string;
  special?: string;
  pois: { name: string; at: [number, number]; note?: string }[];
  via: [number, number, string][];
  sleep: string;
  intention: string;
}

const STAGES = [
  {
    id: 1,
    name: 'Etap I: Z Kochłowic do Matki Bożej Częstochowskiej',
    short: 'Kochłowice ➔ Jasna Góra',
    days: '4 dni, 14–17 czerwca',
    color: '#2563eb',
    about: 'Teren silnie zurbanizowany, a następnie podmiejski. Trasa w większości płaska, prowadząca przez miasta aglomeracji śląskiej i spokojniejsze wsie w kierunku północnym.'
  },
  {
    id: 2,
    name: 'Etap II: Główny Szlak Orlich Gniazd',
    short: 'Jasna Góra ➔ Łagiewniki',
    days: '7 dni, 18–24 czerwca',
    color: '#c2410c',
    about: 'Najbardziej wymagający fizycznie odcinek. Pojawią się podjazdy i zjazdy, dlatego wsparcie asystentów lub dostawka elektryczna do wózka będą tu kluczowe. Trasa wiedzie utwardzonymi szlakami rowerowymi i lokalnymi drogami asfaltowymi o małym natężeniu ruchu.'
  },
  {
    id: 3,
    name: 'Etap III: Powrót w stronę domu',
    short: 'Łagiewniki ➔ Kochłowice',
    days: '4 dni, 25–28 czerwca',
    color: '#047857',
    about: 'Powrót z Krakowa na Górny Śląsk. Teren systematycznie opada (więcej zjazdów niż podjazdów). Wykorzystujemy dawne trasy królewskie i gęstą sieć miasteczek ze ścieżkami dla pieszych i rowerów.'
  }
];

const DAYS_DATA: PilgrimageDay[] = [
  {
    n: 1, date: '06-14', stage: 1, km: 20, level: 1,
    from: 'Ruda Śląska (Kochłowice)', to: 'Radzionków / Tarnowskie Góry',
    start: 'Poranna Msza Święta i błogosławieństwo w Sanktuarium Matki Bożej z Lourdes w Kochłowicach.',
    route: 'Przejazd przez Chorzów Batory i centrum Bytomia.',
    pois: [
      { name: 'Sanktuarium MB z Lourdes, Kochłowice', at: [50.2550, 18.8985], note: 'Msza Święta na rozpoczęcie i uroczyste błogosławieństwo.' },
      { name: 'Rynek w Bytomiu', at: [50.3480, 18.9157], note: 'Możliwy postój i odpoczynek – twarda, równa nawierzchnia.' }
    ],
    via: [
      [50.2550, 18.8985, 'Kochłowice – Sanktuarium'],
      [50.2810, 18.9160, 'Chorzów Batory'],
      [50.3480, 18.9157, 'Bytom – Rynek'],
      [50.3990, 18.9000, 'Radzionków'],
      [50.4300, 18.8700, 'Tarnowskie Góry (płd. dzielnice)']
    ],
    sleep: 'Okolice Radzionkowa lub południowych dzielnic Tarnowskich Gór.',
    intention: 'Oddanie słabości ciała w ręce Maryi – jak chorzy w Lourdes.'
  },
  {
    n: 2, date: '06-15', stage: 1, km: 18, level: 1,
    from: 'Tarnowskie Góry', to: 'Miasteczko Śląskie / Ożarowice',
    route: 'Wyjazd z Tarnowskich Gór w kierunku wschodnim, z wykorzystaniem ciągów pieszo-rowerowych.',
    pois: [
      { name: 'Zalew Nakło-Chechło', at: [50.4670, 18.9240], note: 'Asfaltowe alejki wokół jeziora – idealne miejsce na dłuższy, bezpieczny postój.' }
    ],
    via: [
      [50.4300, 18.8700, 'Tarnowskie Góry'],
      [50.4670, 18.9240, 'Zalew Nakło-Chechło'],
      [50.4800, 18.9950, 'Tąpkowice'],
      [50.4690, 19.0460, 'Ożarowice']
    ],
    sleep: 'Ożarowice lub Zendek (okolice lotniska w Pyrzowicach).',
    intention: 'Za tych, którzy idą przez życie samotnie – by spotkali swojego asystenta w drodze.'
  },
  {
    n: 3, date: '06-16', stage: 1, km: 20, level: 2,
    from: 'Ożarowice', to: 'Koziegłowy / Poraj',
    route: 'Zmiana krajobrazu na bardziej wiejski. Korzystamy z dróg powiatowych.',
    warn: 'Wymagana asysta z tyłu ze względu na ruch aut. Samochód techniczny z tyłu.',
    pois: [
      { name: 'Rynek w Koziegłowach', at: [50.5995, 19.1640] },
      { name: 'Zalew Porajski', at: [50.6650, 19.2400], note: 'Malownicze miejsce na odpoczynek.' }
    ],
    via: [
      [50.4690, 19.0460, 'Ożarowice'],
      [50.5995, 19.1640, 'Koziegłowy – Rynek'],
      [50.6650, 19.2400, 'Zalew Porajski'],
      [50.6800, 19.2150, 'Poraj']
    ],
    sleep: 'Poraj lub Jastrząb (rozwinięta baza turystyczna z podjazdami dla wózków).',
    intention: 'Za kierowców mijających nas na drogach – o rozwagę i życzliwość.'
  },
  {
    n: 4, date: '06-17', stage: 1, km: 17, level: 1,
    from: 'Poraj', to: 'Jasna Góra, Częstochowa',
    route: 'Wjazd do Częstochowy od strony południowej – najlepiej wzdłuż al. Wojska Polskiego (równe chodniki i ścieżki rowerowe).',
    pois: [
      { name: 'Aleja Najświętszej Maryi Panny', at: [50.8114, 19.1180], note: 'Płaski, reprezentacyjny deptak prowadzący prosto pod klasztor.' },
      { name: 'Jasna Góra', at: [50.8123, 19.0972], note: 'Serce pielgrzymki – miejsce duchowej siły i wspólnoty.' }
    ],
    via: [
      [50.6800, 19.2150, 'Poraj'],
      [50.7820, 19.1560, 'Częstochowa – al. Wojska Polskiego'],
      [50.8114, 19.1250, 'Aleja NMP'],
      [50.8123, 19.0972, 'Jasna Góra']
    ],
    sleep: 'Domy Pielgrzyma na Jasnej Górze (w pełni dostosowane do potrzeb osób z niepełnosprawnościami).',
    intention: 'Zawierzenie wszystkich uczestników przed Cudownym Obrazem – siła na etap jurajski.'
  },
  {
    n: 5, date: '06-18', stage: 2, km: 26, level: 2,
    from: 'Częstochowa', to: 'Złoty Potok',
    route: 'Wymarsz z Jasnej Góry i kierunek na Olsztyn wydzieloną, gładką ścieżką rowerową. Dalej spokojne, asfaltowe drogi przez Biskupice i Choroń.',
    pois: [
      { name: 'Ruiny Zamku w Olsztynie', at: [50.7497, 19.2756], note: 'Widoczne z płaskiej drogi.' },
      { name: 'Stawy w Złotym Potoku', at: [50.7110, 19.4330], note: 'Spacer asfaltową aleją wokół stawów młyńskich.' }
    ],
    via: [
      [50.8123, 19.0972, 'Jasna Góra'],
      [50.7497, 19.2756, 'Olsztyn'],
      [50.7310, 19.3110, 'Biskupice'],
      [50.7050, 19.3590, 'Choroń'],
      [50.7105, 19.4350, 'Złoty Potok']
    ],
    sleep: 'Złoty Potok.',
    intention: 'Za wszystkich, którzy opiekują się chorymi i niepełnosprawnymi.'
  },
  {
    n: 6, date: '06-19', stage: 2, km: 18, level: 2,
    from: 'Złoty Potok', to: 'Zamek Mirów / Bobolice',
    route: 'Zjazd w kierunku Żarek, finał dnia pod odrestaurowanym Zamkiem w Bobolicach.',
    warn: 'Zjazd w stronę Żarek – kontrola hamulców przed startem.',
    pois: [
      { name: 'Stodoły w Żarkach', at: [50.6260, 19.3700], note: 'Utwardzony teren targowy.' },
      { name: 'Zamek Mirów', at: [50.6130, 19.4740] },
      { name: 'Zamek Bobolice', at: [50.6060, 19.4940], note: 'Wybrukowana droga i asfalt pozwalają podjechać pod same mury.' }
    ],
    via: [
      [50.7105, 19.4350, 'Złoty Potok'],
      [50.6260, 19.3700, 'Żarki'],
      [50.6130, 19.4740, 'Mirów'],
      [50.6060, 19.4940, 'Bobolice']
    ],
    sleep: 'Okolice Mirowa lub Bobolic.',
    intention: 'Za tych, których życie legło w gruzach – by odbudowali je na Skale.'
  },
  {
    n: 7, date: '06-20', stage: 2, km: 15, level: 1,
    from: 'Bobolice', to: 'Podlesice',
    route: 'Bardzo spokojny odcinek relaksacyjny poprowadzony po równym, nowym asfalcie przez Hucisko i Kotowice.',
    pois: [
      { name: 'Skały Kroczyckie – Góra Zborów', at: [50.5710, 19.5290], note: 'Widok z poziomu jezdni.' }
    ],
    via: [
      [50.6060, 19.4940, 'Bobolice'],
      [50.5960, 19.5150, 'Hucisko'],
      [50.5830, 19.5100, 'Kotowice'],
      [50.5745, 19.5280, 'Podlesice']
    ],
    sleep: 'Podlesice.',
    intention: 'Dzień odpoczynku i wdzięczności – za asystentów i całą ekipę.'
  },
  {
    n: 8, date: '06-21', stage: 2, km: 19, level: 3,
    from: 'Podlesice', to: 'Ogrodzieniec (Podzamcze)',
    route: 'Droga powiatowa z Kroczyc przez Morsko. Dojazd pod zamek ułatwia chodnik u podnóża góry w Podzamczu.',
    warn: 'Droga powiatowa – wymagana szczególna ostrożność, samochód techniczny z tyłu.',
    pois: [
      { name: 'Zamek Ogrodzieniec', at: [50.4530, 19.5530], note: 'Można obejść z zewnątrz wybrukowanymi/asfaltowymi ścieżkami u podstawy skał.' }
    ],
    via: [
      [50.5745, 19.5280, 'Podlesice'],
      [50.5600, 19.5100, 'Kroczyce'],
      [50.5250, 19.5300, 'Morsko'],
      [50.4530, 19.5530, 'Podzamcze']
    ],
    sleep: 'Podzamcze / Ogrodzieniec.',
    intention: 'O pokorę wobec kruchości ludzkich dzieł – mury kruszeją, duch idzie dalej.'
  },
  {
    n: 9, date: '06-22', stage: 2, km: 24, level: 2,
    from: 'Ogrodzieniec', to: 'Wolbrom',
    route: 'Zjazd ze wzniesień Ogrodzieńca, dalej drogą asfaltową w stronę Pilicy, przejście przez południową część Jury do Wolbromia.',
    warn: 'Zjazd z Ogrodzieńca – asystent z tyłu, kontrola prędkości.',
    pois: [
      { name: 'Zamek w Pilicy i rynek', at: [50.4660, 19.6560] }
    ],
    via: [
      [50.4530, 19.5530, 'Podzamcze'],
      [50.4660, 19.6560, 'Pilica'],
      [50.3800, 19.7600, 'Wolbrom']
    ],
    sleep: 'Wolbrom.',
    intention: 'Za rodziny osób z niepełnosprawnościami – o siły na codzienność.'
  },
  {
    n: 10, date: '06-23', stage: 2, km: 27, level: 2,
    from: 'Wolbrom', to: 'Ojców',
    route: 'Szosą przez Trzyciąż i Skałę. Finałem jest zjazd do Doliny Prądnika.',
    warn: 'Zjazd do Doliny Prądnika jest stromy. Droga w dolinie bywa uczęszczana przez auta – sprawdźcie aktualną organizację ruchu na miejscu.',
    pois: [
      { name: 'Zamek w Pieskowej Skale', at: [50.2435, 19.7790] },
      { name: 'Maczuga Herkulesa', at: [50.2450, 19.7800] },
      { name: 'Ojcowski Park Narodowy', at: [50.2110, 19.8290], note: 'Utwardzona droga przez dolinę – jeden z najprzyjemniejszych dni dla wózka.' }
    ],
    via: [
      [50.3800, 19.7600, 'Wolbrom'],
      [50.3120, 19.8340, 'Trzyciąż'],
      [50.2340, 19.8530, 'Skała'],
      [50.2110, 19.8290, 'Ojców']
    ],
    sleep: 'Ojców.',
    intention: 'O zachwyt nad pięknem stworzenia i umiejętność zatrzymania się.'
  },
  {
    n: 11, date: '06-24', stage: 2, km: 25, level: 2,
    from: 'Ojców', to: 'Kraków (Łagiewniki)', special: 'Rozesłanie',
    route: 'Wyjazd z Doliny Prądnika asfaltem przez Prądnik Korzkiewski i wjazd do północnego Krakowa. W mieście płaska infrastruktura (np. Bulwary Wiślane).',
    pois: [
      { name: 'Błonia Krakowskie', at: [50.0600, 19.9120] },
      { name: 'Wawel', at: [50.0540, 19.9355] },
      { name: 'Sanktuarium Bożego Miłosierdzia', at: [50.0197, 19.9330], note: 'Uroczysta Msza Święta z grupami z innych ścieżek.' }
    ],
    via: [
      [50.2110, 19.8290, 'Ojców'],
      [50.1580, 19.8840, 'Prądnik Korzkiewski'],
      [50.1200, 19.9200, 'Zielonki'],
      [50.0600, 19.9120, 'Błonia'],
      [50.0540, 19.9355, 'Wawel / Bulwary'],
      [50.0197, 19.9330, 'Łagiewniki']
    ],
    sleep: 'Domy duszpasterskie w Łagiewnikach.',
    intention: '„Jezu, ufam Tobie” – złożenie całego trudu drogi w oceanie Miłosierdzia.'
  },
  {
    n: 12, date: '06-25', stage: 3, km: 26, level: 2,
    from: 'Łagiewniki', to: 'Krzeszowice',
    route: 'Przez krakowski Salwator na zachód w stronę Zabierzowa, trzymając się bocznych, utwardzonych dróg równoległych do ruchliwej DK79.',
    warn: 'Unikać jazdy samą DK79 – trzymać się dróg równoległych.',
    pois: [
      { name: 'Salwator', at: [50.0530, 19.9070] },
      { name: 'Pałac Potockich w Krzeszowicach', at: [50.1340, 19.6330], note: 'Dostępny park ze żwirowymi/asfaltowymi alejkami.' }
    ],
    via: [
      [50.0197, 19.9330, 'Łagiewniki'],
      [50.0530, 19.9070, 'Salwator'],
      [50.1140, 19.7980, 'Zabierzów'],
      [50.1340, 19.6330, 'Krzeszowice']
    ],
    sleep: 'Krzeszowice.',
    intention: 'O wierność łasce przyniesionej z sanktuariów do codzienności.'
  },
  {
    n: 13, date: '06-26', stage: 3, km: 25, level: 2,
    from: 'Krzeszowice', to: 'Jaworzno',
    route: 'Przejazd przez Dulową i Trzebinię.',
    pois: [
      { name: 'Park Gródek w Jaworznie', at: [50.2150, 19.2950], note: 'Twarde, spacerowe ścieżki dostępne dla wózków – modlitwa w naturze.' }
    ],
    via: [
      [50.1340, 19.6330, 'Krzeszowice'],
      [50.1370, 19.5300, 'Dulowa'],
      [50.1600, 19.4710, 'Trzebinia'],
      [50.2150, 19.2950, 'Jaworzno – Park Gródek']
    ],
    sleep: 'Jaworzno.',
    intention: 'Za Kościół – by był otwarty i bez barier w sercach i umysłach.'
  },
  {
    n: 14, date: '06-27', stage: 3, km: 24, level: 1,
    from: 'Jaworzno', to: 'Katowice',
    route: 'Trasa przez Mysłowice, wkraczająca z powrotem w tkankę śląskiej metropolii.',
    pois: [
      { name: 'Dolina Trzech Stawów', at: [50.2410, 19.0450], note: 'Równe, wydzielone od aut asfaltowe ścieżki rekreacyjne.' }
    ],
    via: [
      [50.2150, 19.2950, 'Jaworzno'],
      [50.2420, 19.1410, 'Mysłowice'],
      [50.2410, 19.0450, 'Katowice – Dolina Trzech Stawów']
    ],
    sleep: 'Katowice (południowe dzielnice).',
    intention: 'Za mieszkańców Śląska – ludzi pracy i ich rodziny.'
  },
  {
    n: 15, date: '06-28', stage: 3, km: 25, level: 1,
    from: 'Katowice', to: 'Ruda Śląska (Kochłowice)', special: 'Zakończenie',
    route: 'Finałowy marsz w pełni po infrastrukturze miejskiej (Katowice Załęże, Chorzów, aż po Rudę Śląską).',
    pois: [
      { name: 'Sanktuarium MB z Lourdes, Kochłowice', at: [50.2550, 18.8985], note: 'Uroczysty powrót – zakończenie pętli i Te Deum.' }
    ],
    via: [
      [50.2410, 19.0450, 'Dolina Trzech Stawów'],
      [50.2660, 18.9800, 'Katowice Załęże'],
      [50.2810, 18.9160, 'Chorzów'],
      [50.2550, 18.8985, 'Kochłowice – Sanktuarium']
    ],
    sleep: 'Dom.',
    intention: 'Dziękczynienie – wracamy jako inni ludzie, przemienieni przez Drogę.'
  }
];

const CHAPTERS = [
  {
    id: 'intro',
    title: '1. Wprowadzenie i założenia pielgrzymki',
    group: 'Wprowadzenie & Duchowość',
    text: `Szczęść Boże! Witamy na szlaku Wielkiej Pętli Trzech Sanktuariów: z Kochłowic przez Jasną Górę i Łagiewniki z powrotem do Kochłowic.
To piętnastodniowa droga pokonywana pieszo oraz na wózkach inwalidzkich, od czternastego do dwudziestego ósmego czerwca dwa tysiące dwudziestego siódmego roku, licząca około trzysta dwadzieścia dziewięć kilometrów.
Trasa tworzy pełną geometryczną pętlę i wpisuje się w tajemnicę Trójcy Przenajświętszej.
Wykorzystujemy równe drogi asfaltowe, wydzielone ścieżki rowerowe i utwardzone chodniki, omijając leśne piaski i kamieniste bezdroża.
Przez całą drogę pielgrzymom towarzyszy dedykowany samochód techniczny, zorganizowana pomoc asystentów oraz przygotowane bazy postojowe i noclegowe.`
  },
  {
    id: 'theology',
    title: '2. Teologia: Ad Iesum per Mariam i Moc w Słabości',
    group: 'Wprowadzenie & Duchowość',
    text: `Teologia tej drogi prowadzi od Maryi do Chrystusa.
Początek i koniec w Kochłowicach u Matki Bożej z Lourdes to akt oddania swojej fizyczności i słabości w ręce Maryi, która pochyla się nad chorymi i cierpiącymi.
Sercem pielgrzymki jest Jasna Góra – miejsce duchowej siły, wstawiennictwa i wspólnoty, gdzie pielgrzym nabiera mocy na jurajski etap szlaku.
Kulminacją są krakowskie Łagiewniki: spotkanie z Chrystusem i wezwaniem „Jezu, ufam Tobie”, gdzie cały trud i pot drogi składamy w oceanie Bożego Miłosierdzia.
Obecność wózka na szlaku to żywa realizacja słów świętego Pawła: „Moc w słabości się doskonali” z Drugiego Listu do Koryntian. Wózek nie jest znakiem braku, lecz narzędziem łaski – przypomina, że przed Bogiem nikt z nas nie staje o własnych siłach.`
  },
  {
    id: 'philosophy',
    title: '3. Filozofia: Homo Viator i Etyka Spotkania',
    group: 'Wprowadzenie & Duchowość',
    text: `Pielgrzymka to realizacja idei Homo viator – człowieka w drodze. Pielgrzym na wózku obnaża prawdę, o której współczesny świat zapomina: nikt z nas nie idzie przez życie sam.
Pielgrzym bezgranicznie ufa asystentowi, że ten nie puści wózka na zjeździe i bezpiecznie zahamuje. Asystent z miłością oddaje swoje siły drugiemu człowiekowi.
To czysta etyka spotkania w duchu Emmanuela Lévinasa i księdza Józefa Tischnera – radykalne zaprzeczenie samotnego indywidualizmu.
Wybór dróg asfaltowych uczy, że sacrum odnajdujemy w prozie codzienności: na szarym asfalcie, poboczu szosy i wśród pędzących aut.`
  },
  {
    id: 'symbols',
    title: '4. Symbolika: Wózek, Koło, Pętla i Zamki Jurajskie',
    group: 'Wprowadzenie & Duchowość',
    text: `Koła wózka obracające się przez piętnaście dni to symbol wytrwałości i cykliczności ludzkiego losu. Wózek ze szpitalnego rekwizytu staje się rydwanem wolności i zwycięstwa ducha nad ograniczeniami ciała.
Pętla wyjścia i powrotu do Kochłowic pokazuje, że wychodzimy z domu, doświadczamy łaski i trudu, a wracamy do codzienności przemienieni przez Drogę.
Ruiny jurajskich warowni – Mirów, Bobolice, Ogrodzieniec – przypominają o kruchości ludzkich dzieł. Potężne mury obracają się w ruinę, a kruchy człowiek na wózku jedzie dalej ku wieczności.`
  },
  {
    id: 'stage-1',
    title: '5. Etap I (Dni 1–4): Z Kochłowic do Matki Bożej Częstochowskiej',
    group: 'Opisy Dni i Postojów',
    text: `Etap pierwszy trwa cztery dni, od czternastego do siedemnastego czerwca, licząc łącznie siedemdziesiąt pięć kilometrów.
Dzień pierwszy to start z Sanktuarium Matki Bożej z Lourdes w Kochłowicach, przejazd przez Chorzów Batory, Rynek w Bytomiu i Radzionków do Tarnowskich Gór.
Dzień drugi liczy osiemnaście kilometrów z Tarnowskich Gór obok Zalewu Nakło-Chechło przez Tąpkowice do Ożarowic.
Dzień trzeci prowadzi dwadzieścia kilometrów drogami powiatowymi przez rynek w Koziegłowach i malowniczy Zalew Porajski do Poraja.
Dzień czwarty to siedemnastokilometrowy wjazd do Częstochowy Aleją Najświętszej Maryi Panny prosto na Jasną Górę, gdzie nocujemy w dostosowanych Domach Pielgrzyma.`
  },
  {
    id: 'stage-2',
    title: '6. Etap II (Dni 5–11): Główny Szlak Orlich Gniazd do Łagiewnik',
    group: 'Opisy Dni i Postojów',
    text: `Etap drugi to siedem dni jurajskiej wędrówki o długości stu pięćdziesięciu czterech kilometrów.
Dzień piąty: wyjście z Jasnej Góry przez Olsztyn ze słynnymi ruinami zamku do bukowych lasów i Stawów Młyńskich w Złotym Potoku.
Dzień szósty: zjazd przez Żarki do bliźniaczych zamków Mirów i Bobolice.
Dzień siódmy: płaski odcinek relaksacyjny u stóp Góry Zborów do Podlesic.
Dzień ósmy: podejście pod majestatyczny Zamek Ogrodzieniec w Podzamczu z asekuracją auta technicznego.
Dzień dziewiąty: zjazd ze wzniesień jury przez Pilicę do Wolbromia.
Dzień dziesiąty: dwadzieścia siedem kilometrów przez zamek Pieskowa Skała, Maczugę Herkulesa i zjazd do Ojcowskiego Parku Narodowego w Dolinie Prądnika.
Dzień jedenasty to wielki finał: wejście do Krakowa przez Zielonki, Błonia, Wawel i Wzgórze Miłosierdzia w Łagiewnikach na uroczystą Mszę Świętą.`
  },
  {
    id: 'stage-3',
    title: '7. Etap III (Dni 12–15): Powrót w stronę domu i domknięcie Pętli',
    group: 'Opisy Dni i Postojów',
    text: `Etap trzeci to sto kilometrów powrotu na Górny Śląsk.
Dzień dwunasty prowadzi z Łagiewnik przez Salwator i Zabierzów do Krzeszowic z parkiem Potockich.
Dzień trzynasty wiedzie przez Dulową i Trzebinię do Jaworzna z urokliwym Parkiem Gródek.
Dzień czternasty prowadzi przez Mysłowice do Doliny Trzech Stawów w Katowicach wydzielonymi, bezpiecznymi ścieżkami asfaltowymi.
Dzień piętnasty to dwadzieścia pięć kilometrów przez Katowice-Załęże i Chorzów prosto do Sanktuarium w Kochłowicach. Uroczyste Te Deum, błogosławieństwo i domknięcie pielgrzymiej pętli.`
  },
  {
    id: 'safety',
    title: '8. Bezpieczeństwo, Prawo Drogowe i Rytm Dnia',
    group: 'Logistyka & Zdrowie',
    text: `Bezpieczeństwo jest fundamentem tej pielgrzymki.
W polskim prawie osoba na wózku jest pieszym: porusza się chodnikiem, poboczem lub lewą krawędzią jezdni. Wózek musi posiadać silne lampy LED przód i tył oraz wysoką chorągiewkę odblaskową.
Za grupą na drogach lokalnych bezwzględnie jedzie oznakowany samochód techniczny na światłach awaryjnych.
W upale wychodzimy o ósmej rano, pijemy dużo wody, a w godzinach największego słońca odpoczywamy w cieniu.
Stosujemy certyfikowane poduszki przeciwodleżynowe, a asystenci pchający zmieniają się co trzydzieści do czterdziestu pięciu minut.
Rytm dnia wyznaczają modlitwy: poranna Msza Święta, Anioł Pański w południe, Godzina Miłosierdzia o piętnastej oraz Apel Jasnogórski o dwudziestej pierwszej.`
  }
];

export const PetlaTrzechSanktuariowSubsection: React.FC<Props> = ({ theme = 'light' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'pdf' | 'lector' | 'days' | 'spirit' | 'safety'>('overview');
  const [selectedDay, setSelectedDay] = useState<number | null>(1);
  const [stageFilter, setStageFilter] = useState<number | null>(null);
  const [completedDays, setCompletedDays] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('petla_completed_days');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isLectorActive, setIsLectorActive] = useState(false);
  const [lectorRate, setLectorRate] = useState<number>(1.0);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [showPdfEmbed, setShowPdfEmbed] = useState(true);

  // Checkbox list persistence
  const [checkedList, setCheckedList] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('petla_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCheck = (id: string) => {
    setCheckedList(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem('petla_checklist', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const toggleDayCompleted = (dayNum: number) => {
    setCompletedDays(prev => {
      const updated = prev.includes(dayNum) ? prev.filter(n => n !== dayNum) : [...prev, dayNum];
      try { localStorage.setItem('petla_completed_days', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Sync lector state listener
  useEffect(() => {
    const handleLectorStateChange = () => {
      const state = getLectorPlaybackState();
      if (state === 'idle') {
        setIsLectorActive(false);
      }
    };
    window.addEventListener('drogowskazy_lector_state_changed', handleLectorStateChange);
    return () => {
      window.removeEventListener('drogowskazy_lector_state_changed', handleLectorStateChange);
    };
  }, []);

  const handlePlayChapter = async (index: number) => {
    unlockMobileAudio();
    stopLectorSpeech();
    setCurrentChapterIndex(index);
    setIsLectorActive(true);

    const chapter = CHAPTERS[index];
    const config = { ...getLectorConfig(), rate: lectorRate, mode: 'online' as const };

    await playLectorSpeech({
      text: `${chapter.title}. \n\n ${chapter.text}`,
      config,
      overrideLang: 'pl',
      title: `Pętla Trzech Sanktuariów • ${chapter.title}`,
      sectionName: 'Wielka Pętla (Kochłowice – Jasna Góra – Łagiewniki)',
      onStart: () => setIsLectorActive(true),
      onEnd: () => {
        setIsLectorActive(false);
        // Automatically progress to next chapter if available
        if (index < CHAPTERS.length - 1) {
          setCurrentChapterIndex(index + 1);
        }
      },
      onError: () => setIsLectorActive(false)
    });
  };

  const handleStopLector = () => {
    stopLectorSpeech();
    setIsLectorActive(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(id);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const filteredDays = useMemo(() => {
    if (stageFilter === null) return DAYS_DATA;
    return DAYS_DATA.filter(d => d.stage === stageFilter);
  }, [stageFilter]);

  const totalKm = DAYS_DATA.reduce((acc, d) => acc + d.km, 0);
  const completedKm = DAYS_DATA.filter(d => completedDays.includes(d.n)).reduce((acc, d) => acc + d.km, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Hero Banner for Pętla Trzech Sanktuariów */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#172554] to-[#0f172a] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-blue-900/60">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dedykowana Podsekcja Pielgrzymkowa</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>15 dni • 14–28 czerwca</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              <Compass className="w-3.5 h-3.5 text-emerald-300" />
              <span>Trasa dla wózków inwalidzkich i asystentów • {totalKm} km</span>
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif-book tracking-tight text-white leading-tight">
            Wielka Pętla Trzech Sanktuariów
          </h2>
          <p className="text-base sm:text-lg text-blue-200 font-sans-ui max-w-3xl leading-relaxed">
            Kochłowice (MB z Lourdes) ➔ Jasna Góra (Częstochowa) ➔ Łagiewniki (Boże Miłosierdzie) ➔ Kochłowice. 
            Szlak zorganizowany po równym asfalcie, drogach utwardzonych i trasach rowerowych, z asystą samochodu technicznego i kompletnym audioprzewodnikiem lektora.
          </p>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="/pdf/Petla_Trzech_Sanktuariow.pdf"
              download="Petla_Trzech_Sanktuariow.pdf"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm shadow-lg transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Pobierz Plik PDF (7 stron A4)</span>
            </a>

            <button
              onClick={() => handlePlayChapter(0)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-transform active:scale-95 ${
                isLectorActive
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              }`}
            >
              {isLectorActive ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>Zatrzymaj Lektora</span>
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4 text-amber-300" />
                  <span>Odsłuchaj Lektora od Początku</span>
                </>
              )}
            </button>

            <a
              href="/mapa/petla.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-blue-200 text-xs sm:text-sm font-semibold border border-white/15 transition"
            >
              <span>Schemat w nowej karcie</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Progress Bar */}
          <div className="pt-3 border-t border-blue-800/60 max-w-2xl">
            <div className="flex justify-between text-xs text-blue-200 mb-1">
              <span>Postęp trasy: <strong>{completedDays.length} z 15 dni</strong> ukończone</span>
              <span><strong>{completedKm} z ok. {totalKm} km</strong></span>
            </div>
            <div className="w-full h-2.5 bg-blue-950/80 rounded-full overflow-hidden border border-blue-700/50">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${(completedKm / totalKm) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-[#e2d6c7] dark:border-[#202d42]">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Przegląd Pętli & Założenia</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pdf')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeSubTab === 'pdf'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
          }`}
        >
          <FileText className="w-4 h-4 text-rose-500" />
          <span>Plik PDF (Przewodnik)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lector')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeSubTab === 'lector'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
          }`}
        >
          <Headphones className="w-4 h-4 text-amber-500" />
          <span>Lektor Audio ({CHAPTERS.length} rozdziałów)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('days')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeSubTab === 'days'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
          }`}
        >
          <Route className="w-4 h-4 text-emerald-500" />
          <span>Dni 1–15 ze Szczegółami</span>
        </button>

        <button
          onClick={() => setActiveSubTab('spirit')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeSubTab === 'spirit'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>Filozofia i Teologia</span>
        </button>

        <button
          onClick={() => setActiveSubTab('safety')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeSubTab === 'safety'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white/70 dark:bg-[#131a26] text-[#614e3e] dark:text-[#94a3b8] hover:bg-white dark:hover:bg-[#1a2333]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-500" />
          <span>Logistyka & Sprzęt</span>
        </button>
      </div>

      {/* 3. Lector Mini Player Bar if Active */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/50 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-3 rounded-xl shrink-0 ${isLectorActive ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'}`}>
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
              Lektor Audioprzewodnika • Rozdział {currentChapterIndex + 1} z {CHAPTERS.length}
            </span>
            <strong className="text-sm sm:text-base font-serif-book text-white truncate block">
              {CHAPTERS[currentChapterIndex].title}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => handlePlayChapter(Math.max(0, currentChapterIndex - 1))}
            disabled={currentChapterIndex === 0}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition cursor-pointer"
            title="Poprzedni rozdział"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (isLectorActive) handleStopLector();
              else handlePlayChapter(currentChapterIndex);
            }}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer ${
              isLectorActive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
            }`}
          >
            {isLectorActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Zatrzymaj</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Odtwórz</span>
              </>
            )}
          </button>

          <button
            onClick={() => handlePlayChapter(Math.min(CHAPTERS.length - 1, currentChapterIndex + 1))}
            disabled={currentChapterIndex === CHAPTERS.length - 1}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white transition cursor-pointer"
            title="Następny rozdział"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Rate selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/20">
            {[0.9, 1.0, 1.1, 1.2].map(r => (
              <button
                key={r}
                onClick={() => setLectorRate(r)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                  lectorRate === r ? 'bg-amber-400 text-stone-900' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {r}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. TAB CONTENT: Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Three Pillars Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STAGES.map(s => (
              <div 
                key={s.id} 
                className="p-5 rounded-2xl bg-white dark:bg-[#141b28] border border-[#e2d6c7] dark:border-[#202d42] shadow-xs space-y-2"
                style={{ borderTop: `4px solid ${s.color}` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: s.color }}>
                    Etap {s.id}
                  </span>
                  <span className="text-xs text-muted-foreground">{s.days}</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-[#1f1712] dark:text-white">
                  {s.short}
                </h3>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8] leading-relaxed">
                  {s.about}
                </p>
                <button
                  onClick={() => {
                    setStageFilter(s.id);
                    setActiveSubTab('days');
                  }}
                  className="pt-2 text-xs font-bold underline cursor-pointer"
                  style={{ color: s.color }}
                >
                  Zobacz dni tego etapu ➔
                </button>
              </div>
            ))}
          </div>

          {/* Quick PDF & Lector Promo Box */}
          <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-900/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <FileText className="w-5 h-5 text-amber-600" />
                <span>Oficjalny Przewodnik PDF i Głosowy Audioprzewodnik</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4a392b] dark:text-[#cbd5e1] leading-relaxed">
                Pobierz pełne, 7-stronicowe opracowanie w pliku PDF zawierające kompletny opis teologii i filozofii, założeń szlaku, harmonogram 15 dni z punktami orientacyjnymi, wytyczne bezpieczeństwa oraz listę kontrolną wyposażenia.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href="/pdf/Petla_Trzech_Sanktuariow.pdf"
                download="Petla_Trzech_Sanktuariow.pdf"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz PDF</span>
              </a>
              <button
                onClick={() => setActiveSubTab('pdf')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1a2333] border border-amber-400/40 text-amber-900 dark:text-amber-200 font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Podgląd na Stronie</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: PDF Document */}
      {activeSubTab === 'pdf' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#141b28] border border-[#e2d6c7] dark:border-[#202d42] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <FileText className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-base sm:text-lg text-[#1f1712] dark:text-white">
                  Plik PDF: Wielka Pętla Trzech Sanktuariów
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Oficjalne wydanie pielgrzymkowe: 7 stron A4 • Polskie czcionki PT Serif • Schematy, opisy 15 dni, teologia, logistyka i lista kontrolna.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href="/pdf/Petla_Trzech_Sanktuariow.pdf"
                download="Petla_Trzech_Sanktuariow.pdf"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz PDF</span>
              </a>
              <a
                href="/pdf/Petla_Trzech_Sanktuariow.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs hover:bg-stone-200 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Otwórz w Nowym Oknie</span>
              </a>
              <button
                onClick={() => setShowPdfEmbed(!showPdfEmbed)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
              >
                <span>{showPdfEmbed ? 'Ukryj Podgląd' : 'Pokaż Podgląd'}</span>
              </button>
            </div>
          </div>

          {showPdfEmbed && (
            <div className="rounded-3xl border border-[#e2d6c7] dark:border-[#202d42] overflow-hidden shadow-md bg-stone-100 dark:bg-stone-900 h-[700px] sm:h-[850px]">
              <iframe
                src="/pdf/Petla_Trzech_Sanktuariow.pdf#toolbar=1&navpanes=1"
                title="Przewodnik Pielgrzymki PDF"
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT: Lector Chapters List */}
      {activeSubTab === 'lector' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs sm:text-sm text-blue-950 dark:text-blue-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Lektor odczytuje pełen przewodnik: teologię, filozofię, założenia, każdy dzień z punktami orientacyjnymi i postojami oraz logistykę i modlitwę.
              </span>
            </div>
            <button
              onClick={() => handlePlayChapter(0)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              ▶ Czytaj od początku
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CHAPTERS.map((ch, idx) => (
              <div
                key={ch.id}
                className={`p-4 rounded-2xl border transition-all ${
                  currentChapterIndex === idx && isLectorActive
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-[#141b28] border-[#ebe0d4] dark:border-[#202c40] hover:bg-stone-50 dark:hover:bg-[#1a2333]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {ch.group}
                    </span>
                    <h4 className="font-bold text-sm text-[#1f1712] dark:text-white">
                      {ch.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => handlePlayChapter(idx)}
                    className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                      currentChapterIndex === idx && isLectorActive
                        ? 'bg-rose-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    title="Odsłuchaj ten rozdział"
                  >
                    {currentChapterIndex === idx && isLectorActive ? (
                      <Square className="w-4 h-4 fill-white" />
                    ) : (
                      <Play className="w-4 h-4 fill-white" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-[#614e3e] dark:text-[#94a3b8] mt-2 line-clamp-2 leading-relaxed">
                  {ch.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: 15 Days Detailed Plan */}
      {activeSubTab === 'days' && (
        <div className="space-y-6">
          {/* Stage Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground mr-1">Filtruj etap:</span>
              <button
                onClick={() => setStageFilter(null)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  stageFilter === null ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                Wszystkie (15 dni)
              </button>
              {STAGES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStageFilter(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    stageFilter === s.id ? 'bg-blue-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {s.short}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Ukończono: <strong className="text-emerald-600">{completedDays.length} z 15 dni</strong>
            </div>
          </div>

          {/* Day Cards Accordion / List */}
          <div className="space-y-3">
            {filteredDays.map(d => {
              const isSelected = selectedDay === d.n;
              const isCompleted = completedDays.includes(d.n);
              const stageInfo = STAGES.find(s => s.id === d.stage);

              return (
                <div
                  key={d.n}
                  className={`rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
                      : isSelected
                      ? 'bg-white dark:bg-[#141b28] border-blue-500 shadow-md ring-1 ring-blue-500/20'
                      : 'bg-white dark:bg-[#141b28] border-[#ebe0d4] dark:border-[#202c40]'
                  }`}
                >
                  {/* Day Header Bar */}
                  <div 
                    onClick={() => setSelectedDay(isSelected ? null : d.n)}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: isCompleted ? '#059669' : stageInfo?.color || '#2563eb' }}
                      >
                        {isCompleted ? '✓' : d.n}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-[#1f1712] dark:text-white">
                            {d.from} ➔ {d.to}
                          </h4>
                          {d.special && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                              {d.special}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dzień {d.n} • {d.date} • Dystans: <strong>ok. {d.km} km</strong> • Poziom: {d.level === 1 ? 'łatwy' : d.level === 2 ? 'umiarkowany' : 'wymagający'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDayCompleted(d.n);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Ukończony' : 'Zaznacz'}</span>
                      </button>

                      <span className="p-1 text-stone-400">
                        {isSelected ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </span>
                    </div>
                  </div>

                  {/* Day Details Body */}
                  {isSelected && (
                    <div className="p-4 pt-0 border-t border-black/5 dark:border-white/5 space-y-3 text-xs sm:text-sm">
                      {d.start && (
                        <p className="text-stone-700 dark:text-stone-300">
                          <strong>Początek:</strong> {d.start}
                        </p>
                      )}

                      <p className="text-stone-700 dark:text-stone-300">
                        <strong>Przebieg trasy:</strong> {d.route}
                      </p>

                      {d.warn && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800/40 text-rose-800 dark:text-rose-200 flex items-center gap-2 font-medium">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{d.warn}</span>
                        </div>
                      )}

                      <div>
                        <strong>Punkty orientacyjne i postoje:</strong>
                        <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-700 dark:text-stone-300">
                          {d.pois.map((poi, pi) => (
                            <li key={pi}>
                              <span className="font-semibold">{poi.name}</span>
                              {poi.note && <span> – {poi.note}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-stone-700 dark:text-stone-300">
                        <strong>Punkty trasy (via):</strong> {d.via.map(v => v[2]).join(' ➔ ')}
                      </p>

                      <p className="text-stone-700 dark:text-stone-300">
                        <strong>Baza noclegowa:</strong> {d.sleep}
                      </p>

                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300/50 dark:border-amber-900/30 text-amber-900 dark:text-amber-200 font-serif-book italic">
                        Intencja dnia: „{d.intention}”
                      </div>

                      {/* Day Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            const chIdx = d.stage === 1 ? 4 : d.stage === 2 ? 5 : 6;
                            handlePlayChapter(chIdx);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>Odsłuchaj Etap</span>
                        </button>

                        <a
                          href={`https://mapy.com/fnc/v1/search?query=${encodeURIComponent(d.to)}&center=${d.via[d.via.length - 1][1]},${d.via[d.via.length - 1][0]}&zoom=14`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-xs transition"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Mapa i Nocleg w Mapy.com</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. TAB CONTENT: Spiritual Foundations & Philosophy */}
      {activeSubTab === 'spirit' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Motto Duchowe Pielgrzymki
            </span>
            <blockquote className="font-serif-book italic text-xl sm:text-2xl text-amber-900 dark:text-amber-200 leading-relaxed border-l-4 border-amber-500 pl-4">
              „Moc w słabości się doskonali” <span className="text-sm not-italic font-sans-ui text-muted-foreground block mt-1">(2 Kor 12,9)</span>
            </blockquote>
            <p className="text-xs sm:text-sm text-[#4a392b] dark:text-[#cbd5e1] leading-relaxed">
              Trasa Pętli Trzech Sanktuariów rysuje klasyczny szlak teologii katolickiej: od Maryi do Chrystusa (Ad Iesum per Mariam). Obecność wózka na szlaku jest żywym świadectwem, że przed Bogiem nikt z nas nie staje o własnych siłach, lecz zależny od łaski i miłości drugiego człowieka.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#141b28] border border-[#e2d6c7] dark:border-[#202d42] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                <Compass className="w-4 h-4" />
                <span>Homo Viator i Etyka Spotkania</span>
              </div>
              <p className="text-xs text-[#524133] dark:text-[#cbd5e1] leading-relaxed">
                Pielgrzym ufa swojemu asystentowi, że go nie puści na stromym zjeździe i bezpiecznie zahamuje. Asystent ofiarowuje pielgrzymowi swoje mięśnie i czas. To czysta etyka spotkania w duchu Emmanuela Lévinasa i ks. Józefa Tischnera – zaprzeczenie samotnego egoizmu.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#141b28] border border-[#e2d6c7] dark:border-[#202d42] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <Route className="w-4 h-4" />
                <span>Oswajanie Przestrzeni i Twardy Asfalt</span>
              </div>
              <p className="text-xs text-[#524133] dark:text-[#cbd5e1] leading-relaxed">
                Wybór dróg asfaltowych zamiast leśnych duktów uczy, że sacrum można odnaleźć w prozie codziennego życia – na twardym asfalcie, poboczu szosy, wśród szumu samochodów i codziennych trudów.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#141b28] border border-[#e2d6c7] dark:border-[#202d42] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <Flame className="w-4 h-4" />
                <span>Wózek jako Rydwan Wolności</span>
              </div>
              <p className="text-xs text-[#524133] dark:text-[#cbd5e1] leading-relaxed">
                Koła wózka obracające się przez 15 dni są symbolem wytrwałości. Wózek, kojarzony w szpitalu z ograniczeniem, na szlaku staje się rydwanem wolności i triumfu ludzkiego ducha nad materią.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#141b28] border border-[#e2d6c7] dark:border-[#202d42] shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Zrujnowane Zamki Jury</span>
              </div>
              <p className="text-xs text-[#524133] dark:text-[#cbd5e1] leading-relaxed">
                Potężne średniowieczne warownie (Bobolice, Ogrodzieniec) kruszeją i stają się ruiną. Kruchy człowiek na wózku – dzięki sile wiary i wsparciu bliźnich – jedzie dalej ku wieczności.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB CONTENT: Safety, Law & Checklist */}
      {activeSubTab === 'safety' && (
        <div className="space-y-6">
          {/* Emergency Phones Card */}
          <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/50 space-y-3">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-300 font-bold text-sm">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Numery Alarmowe i Bezpieczeństwo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white dark:bg-[#111723] border border-rose-200 dark:border-rose-900/40">
                <span className="text-xl font-black text-rose-600">112</span>
                <span className="text-[11px] text-muted-foreground block">Ogólny alarmowy</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#111723] border border-rose-200 dark:border-rose-900/40">
                <span className="text-xl font-black text-rose-600">999</span>
                <span className="text-[11px] text-muted-foreground block">Pogotowie ratunkowe</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#111723] border border-rose-200 dark:border-rose-900/40">
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Auto techniczne</span>
                <span className="text-[11px] text-muted-foreground block">Na końcu kolumny</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#111723] border border-rose-200 dark:border-rose-900/40">
                <span className="text-sm font-bold text-stone-800 dark:text-stone-200">Apteczka</span>
                <span className="text-[11px] text-muted-foreground block">Rozszerzona w aucie</span>
              </div>
            </div>
          </div>

          {/* Interactive Checklist */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141b28] border border-[#e2d6c7] dark:border-[#202d42] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#1f1712] dark:text-white font-bold text-base">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              <span>Lista Kontrolna Sprzętu Pielgrzymkowego</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Zaznacz przygotowane elementy – stan listy jest automatycznie zapisywany w Twojej przeglądarce.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { id: 'c1', label: 'Wózek: Sprawdzenie klocków hamulcowych i linek' },
                { id: 'c2', label: 'Wózek: Zapasowe dętki, łatki i pompka z manometrem' },
                { id: 'c3', label: 'Wózek: Oświetlenie LED przód/tył i chorągiewka odblaskowa' },
                { id: 'c4', label: 'Wózek: Dostawka elektryczna i ładowarka' },
                { id: 'c5', label: 'Asystenci: Grube rękawice skórzane do trzymania ciągów' },
                { id: 'c6', label: 'Asystenci: Kamizelki odblaskowe i grafik zmian co 40 min' },
                { id: 'c7', label: 'Samochód techniczny: Światła awaryjne i tablica „Pielgrzymka”' },
                { id: 'c8', label: 'Samochód techniczny: Zapas wody pitnej (min. 40 litrów)' },
                { id: 'c9', label: 'Osobiste: Certyfikowana poduszka przeciwodleżynowa' },
                { id: 'c10', label: 'Osobiste: Powerbank min. 20000 mAh i peleryna deszczowa' }
              ].map(item => (
                <label 
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    checkedList[item.id]
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-stone-500 line-through'
                      : 'bg-stone-50 dark:bg-stone-850 border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedList[item.id]}
                    onChange={() => toggleCheck(item.id)}
                    className="w-4 h-4 rounded-md accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
