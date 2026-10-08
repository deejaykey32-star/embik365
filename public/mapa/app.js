// Główna logika aplikacji Pielgrzymki Gwiaździstej i Szlaku Orlich Gniazd 2026
import {
  PILGRIMAGE_STAGES,
  STAR_RAYS,
  STAGE_2_DAYS,
  ORLE_GNIAZDA_FULL_PATH,
  ACCOMMODATIONS,
  POI_POINTS,
  LIVE_STREAMS,
  SAMPLE_PRAYER_INTENTIONS
} from './data.js';

class PilgrimageApp {
  constructor() {
    let initialStage = 'stage-1';
    try {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('stage') || sp.get('etap');
      if (s === 'stage-2' || s === '2' || s === 'orle-gniazda') initialStage = 'stage-2';
      else if (s === 'stage-3' || s === '3' || s === 'rozeslanie') initialStage = 'stage-3';
      else if (s === 'stage-1' || s === '1') initialStage = 'stage-1';
    } catch {}
    this.currentStage = initialStage;
    this.activeRayFilter = 'all';
    this.activeLodgingFilter = 'all';
    this.activeLiveStream = LIVE_STREAMS[0];
    this.map = null;
    this.baseLayers = {};
    this.currentBaseLayer = null;
    this.drawnLayers = {
      routes: L.layerGroup(),
      markers: L.layerGroup(),
      accommodations: L.layerGroup(),
      poi: L.layerGroup(),
      simMarker: null
    };

    // Digital Simulation State
    this.simulating = false;
    this.simIndex = 0;
    this.simInterval = null;

    // Intentions State
    this.intentions = [...SAMPLE_PRAYER_INTENTIONS];

    // Lektor AI State
    this.isLectorSpeaking = false;

    this.init();
  }

  init() {
    this.initMap();
    this.bindDomEvents();
    this.renderStage(this.currentStage);
    this.renderAccommodations();
    this.renderPoi();
    this.renderIntentions();
    this.renderStreamsList();
  }

  /* -------------------------------------------------------------------------
     MAP INITIALIZATION & TILE LAYERS
     ------------------------------------------------------------------------- */
  initMap() {
    // Inicjalizacja Leaflet
    this.map = L.map('pilgrimage-map', {
      zoomControl: false,
      attributionControl: true
    }).setView([51.5, 19.1], 6);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Kafelki mapowe: Topo, Satelita, Ulice, Nocny
    this.baseLayers = {
      topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
        attribution: 'Map data: &copy; OpenTopoMap (CC-BY-SA)'
      }),
      sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }),
      street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      })
    };

    // Domyślna warstwa: Topograficzna (jak prosił użytkownik w poleceniu)
    this.currentBaseLayer = this.baseLayers.topo;
    this.currentBaseLayer.addTo(this.map);

    // Dodanie grup warstw
    this.drawnLayers.routes.addTo(this.map);
    this.drawnLayers.markers.addTo(this.map);
    this.drawnLayers.accommodations.addTo(this.map);
    this.drawnLayers.poi.addTo(this.map);
  }

  switchTileLayer(layerKey) {
    if (!this.baseLayers[layerKey]) return;
    if (this.currentBaseLayer) {
      this.map.removeLayer(this.currentBaseLayer);
    }
    this.currentBaseLayer = this.baseLayers[layerKey];
    this.currentBaseLayer.addTo(this.map);

    // Update active pill
    document.querySelectorAll('.layer-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layer === layerKey);
    });
  }

  /* -------------------------------------------------------------------------
     STAGE RENDERING
     ------------------------------------------------------------------------- */
  renderStage(stageId) {
    this.currentStage = stageId;
    this.clearMapDrawings();

    // Update stage switcher buttons
    document.querySelectorAll('.stage-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.stage === stageId);
    });

    const bannerBadge = document.getElementById('banner-badge');
    const bannerTitle = document.getElementById('banner-title');
    const bannerDesc = document.getElementById('banner-desc');
    const hudFocus = document.getElementById('hud-current-focus');
    const hudLength = document.getElementById('hud-route-length');
    const modeFiltersContainer = document.getElementById('mode-filters-container');

    if (stageId === 'stage-1') {
      bannerBadge.innerText = 'ETAP I: ZBIEŻNOŚĆ KU CZĘSTOCHOWIE';
      bannerTitle.innerText = PILGRIMAGE_STAGES.STAGE_1.name;
      bannerDesc.innerText = PILGRIMAGE_STAGES.STAGE_1.description;
      hudFocus.innerText = 'Cel: Częstochowa (Jasna Góra)';
      hudLength.innerText = '8 Promieni z całego świata';
      modeFiltersContainer.style.display = 'flex';

      this.map.flyTo(PILGRIMAGE_STAGES.STAGE_1.center, PILGRIMAGE_STAGES.STAGE_1.zoom, { duration: 1.5 });
      this.renderStage1Routes();

    } else if (stageId === 'stage-2') {
      bannerBadge.innerText = 'ETAP II: SZLAK ORLICH GNIAZD (18–24.06)';
      bannerTitle.innerText = PILGRIMAGE_STAGES.STAGE_2.name;
      bannerDesc.innerText = PILGRIMAGE_STAGES.STAGE_2.description + ' ' + PILGRIMAGE_STAGES.STAGE_2.highlight;
      hudFocus.innerText = 'Częstochowa ➔ Ojców ➔ Łagiewniki';
      hudLength.innerText = '164 km (7 Dni wędrówki)';
      modeFiltersContainer.style.display = 'none';

      this.map.flyTo(PILGRIMAGE_STAGES.STAGE_2.center, PILGRIMAGE_STAGES.STAGE_2.zoom, { duration: 1.5 });
      this.renderStage2Routes();
      this.renderStage2AccommodationsOnMap();

    } else if (stageId === 'stage-3') {
      bannerBadge.innerText = 'ETAP III: ROZESŁANIE (MISSIO)';
      bannerTitle.innerText = PILGRIMAGE_STAGES.STAGE_3.name;
      bannerDesc.innerText = PILGRIMAGE_STAGES.STAGE_3.description;
      hudFocus.innerText = 'Łagiewniki ➔ Błogosławieństwo na cały świat';
      hudLength.innerText = 'Powrót do domów i wspólnot';
      modeFiltersContainer.style.display = 'none';

      this.map.flyTo(PILGRIMAGE_STAGES.STAGE_3.center, PILGRIMAGE_STAGES.STAGE_3.zoom, { duration: 1.5 });
      this.renderStage3Routes();
    }
  }

  clearMapDrawings() {
    this.drawnLayers.routes.clearLayers();
    this.drawnLayers.markers.clearLayers();
    this.drawnLayers.accommodations.clearLayers();
    this.drawnLayers.poi.clearLayers();
    if (this.drawnLayers.simMarker) {
      this.map.removeLayer(this.drawnLayers.simMarker);
      this.drawnLayers.simMarker = null;
    }
    this.stopDigitalSim();
  }

  /* -------------------------------------------------------------------------
     ETAP 1: PROMIENIE GWIAZDY
     ------------------------------------------------------------------------- */
  renderStage1Routes() {
    const container = document.getElementById('routes-container');
    container.innerHTML = '';

    // Filtr promieni
    const filteredRays = this.activeRayFilter === 'all'
      ? STAR_RAYS
      : STAR_RAYS.filter(r => r.mode.toLowerCase().includes(this.activeRayFilter.toLowerCase()));

    // Punkt centralny gwiazdy: Jasna Góra
    const jasnaGoraIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div class="pin-icon" style="--pin-bg: #d97706; width: 44px; height: 44px;">
          <i class="fa-solid fa-star" style="color: #fff; font-size: 20px;"></i>
          <div class="pin-pulse" style="--pin-bg: #f59e0b;"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const jasnaGoraMarker = L.marker([50.8122, 19.0975], { icon: jasnaGoraIcon })
      .bindPopup(`
        <div style="font-family: var(--font-main); padding: 6px;">
          <h3 style="font-size: 15px; color: #b45309; margin-bottom: 4px;">Jasna Góra – Punkt Zbiegu Gwiazdy</h3>
          <p style="font-size: 12px; color: #334155;">Tu łączą się wszystkie promienie pielgrzymek z całego świata przed wspólnym wyruszeniem na Szlak Orlich Gniazd (18.06.2026).</p>
        </div>
      `);
    this.drawnLayers.markers.addLayer(jasnaGoraMarker);

    // Rysowanie poszczególnych promieni
    filteredRays.forEach(ray => {
      // Polilinia na mapie
      const polyline = L.polyline(ray.coordinates, {
        color: ray.color,
        weight: 4,
        opacity: 0.85,
        dashArray: ray.mode === 'Pociąg & Smartfon (Kolejowa)' ? '8, 8' : null
      });

      polyline.bindTooltip(`<b>${ray.name}</b><br>${ray.mode} • ${ray.distance}`, {
        sticky: true
      });

      polyline.on('click', () => {
        this.selectRay(ray);
      });

      this.drawnLayers.routes.addLayer(polyline);

      // Marker początkowy
      const startCoord = ray.coordinates[0];
      const startIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div class="pin-icon" style="--pin-bg: ${ray.color}">
            <i class="fa-solid ${ray.modeIcon}"></i>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const startMarker = L.marker(startCoord, { icon: startIcon })
        .bindPopup(`
          <div style="font-family: var(--font-main);">
            <strong style="color: ${ray.color}; font-size: 14px;">${ray.name}</strong>
            <p style="font-size: 12px; margin: 4px 0;">Start: ${ray.startLocation}</p>
            <p style="font-size: 11px; color: #64748b;">Dystans: ${ray.distance} | Czas: ${ray.durationDays} dni</p>
            <button class="btn-micro" style="margin-top: 6px;" onclick="window.app.openLiveStreamById('${ray.id}')">
              <i class="fa-brands fa-youtube"></i> Oglądaj Live
            </button>
          </div>
        `);
      this.drawnLayers.markers.addLayer(startMarker);

      // Karta w sidebarze
      const card = document.createElement('div');
      card.className = 'route-card';
      card.style.setProperty('--card-color', ray.color);
      card.innerHTML = `
        <div class="card-top">
          <span class="card-mode-badge"><i class="fa-solid ${ray.modeIcon}"></i> ${ray.mode}</span>
          <span class="card-distance">${ray.distance}</span>
        </div>
        <h4 class="card-title">${ray.name}</h4>
        <div class="card-meta">
          <span><i class="fa-regular fa-calendar-check"></i> ${ray.startDate} ➔ ${ray.arrivalDate} (${ray.durationDays} dni)</span>
          <span><i class="fa-solid fa-users"></i> ${ray.pilgrimsCount.toLocaleString()} na trasie | <strong>${ray.digitalPilgrims.toLocaleString()}</strong> cyfrowo</span>
          <span><i class="fa-solid fa-user-tie"></i> Przewodnik: ${ray.leader}</span>
        </div>
        <div class="card-actions-row">
          <button class="btn-card-action btn-show-ray" data-ray-id="${ray.id}">
            <i class="fa-solid fa-magnifying-glass-location"></i> Pokaż trasę i dni
          </button>
          <button class="btn-card-live" data-ray-id="${ray.id}">
            <i class="fa-brands fa-youtube"></i> LIVE
          </button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-card-live')) {
          this.selectRay(ray);
        }
      });

      card.querySelector('.btn-card-live').addEventListener('click', (e) => {
        e.stopPropagation();
        this.openLiveStreamByRay(ray);
      });

      container.appendChild(card);
    });
  }

  selectRay(ray) {
    // Zoom na dany promień
    const bounds = L.latLngBounds(ray.coordinates);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });

    // Pokaż modal ze szczegółowym harmonogramem dnia po dniu
    const modal = document.getElementById('detail-modal');
    const modalTitle = document.getElementById('detail-modal-title');
    const modalBody = document.getElementById('detail-modal-body');

    modalTitle.innerHTML = `<i class="fa-solid ${ray.modeIcon}"></i> ${ray.name}`;

    let scheduleHtml = `
      <div style="margin-bottom: 16px;">
        <p><strong>Forma pielgrzymki:</strong> ${ray.mode} | <strong>Dystans całkowity:</strong> ${ray.distance}</p>
        <p><strong>Termin etapu I:</strong> ${ray.startDate} – ${ray.arrivalDate} (Jasna Góra)</p>
        <p><strong>Przewodnik:</strong> ${ray.leader}</p>
        <p><strong>Pielgrzymi:</strong> ${ray.pilgrimsCount} fizycznych, ${ray.digitalPilgrims} uczestników na smartfonach i YouTube.</p>
      </div>
      <h4 style="margin-bottom: 8px; color: var(--gold-light);">Harmonogram Dzień po Dniu:</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    ray.schedule.forEach(s => {
      scheduleHtml += `
        <div style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; border-left: 3px solid ${ray.color};">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>Dzień ${s.day} (${s.date}): ${s.from} ➔ ${s.to}</span>
            <span style="color: var(--gold-light);">${s.km} km</span>
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${s.note}</div>
        </div>
      `;
    });

    scheduleHtml += `
      </div>
      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="btn-card-live" style="padding: 8px 16px; font-size: 12px;" onclick="window.app.openLiveStreamByRayId('${ray.id}')">
          <i class="fa-brands fa-youtube"></i> Otwórz Transmisję na Żywo Grupy
        </button>
      </div>
    `;

    modalBody.innerHTML = scheduleHtml;
    modal.classList.add('open');
  }

  /* -------------------------------------------------------------------------
     ETAP 2: SZLAK ORLICH GNIAZD (18 - 24 CZERWCA 2026)
     ------------------------------------------------------------------------- */
  renderStage2Routes() {
    const container = document.getElementById('routes-container');
    container.innerHTML = `
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--border-gold); padding: 12px; border-radius: 12px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--gold-light); font-size: 13px;">
          <i class="fa-solid fa-shield-halved"></i> Szlak Orlich Gniazd: 18 – 24 Czerwca
        </div>
        <p style="font-size: 11px; color: #cbd5e1; margin-top: 4px; line-height: 1.4;">
          Połączone wszystkie promienie gwiazdy zmierzają wspólnie przez jurajskie zamki i ostańce aż do Sanktuarium Bożego Miłosierdzia w Łagiewnikach.
        </p>
      </div>
    `;

    // Rysowanie pełnej magistrali Orlich Gniazd (złoto-purpurowa linia)
    const orleGniazdaPolyline = L.polyline(ORLE_GNIAZDA_FULL_PATH, {
      color: '#f59e0b',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    });
    orleGniazdaPolyline.bindTooltip('<b>Główny Szlak Orlich Gniazd (164 km)</b><br>18 – 24 Czerwca', { sticky: true });
    this.drawnLayers.routes.addLayer(orleGniazdaPolyline);

    // Karta dla każdego z 7 dni
    STAGE_2_DAYS.forEach(day => {
      // Polilinia dla pojedynczego dnia (podświetlona)
      const dayPolyline = L.polyline(day.coords, {
        color: day.dayNumber === 6 ? '#ef4444' : '#3b82f6',
        weight: 5,
        opacity: 0.8
      });
      dayPolyline.bindTooltip(`<b>Dzień ${day.dayNumber}</b>: ${day.route}`, { sticky: true });
      this.drawnLayers.routes.addLayer(dayPolyline);

      // Marker końcowy dnia (baza noclegowa)
      const endCoord = day.coords[day.coords.length - 1];
      const isOjcow = day.dayNumber === 6;

      const dayEndIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div class="pin-icon" style="--pin-bg: ${isOjcow ? '#ef4444' : '#f59e0b'}; width: ${isOjcow ? '42px' : '32px'}; height: ${isOjcow ? '42px' : '32px'};">
            <span style="font-weight: 800; font-size: ${isOjcow ? '14px' : '11px'};">${day.dayNumber}</span>
            ${isOjcow ? '<div class="pin-pulse" style="--pin-bg: #ef4444;"></div>' : ''}
          </div>
        `,
        iconSize: [isOjcow ? 42 : 32, isOjcow ? 42 : 32],
        iconAnchor: [isOjcow ? 21 : 16, isOjcow ? 21 : 16]
      });

      const dayMarker = L.marker(endCoord, { icon: dayEndIcon })
        .bindPopup(`
          <div style="font-family: var(--font-main);">
            <span style="font-size: 10px; font-weight: 800; color: ${isOjcow ? '#ef4444' : '#b45309'}; text-transform: uppercase;">Dzień ${day.dayNumber} • ${day.date}</span>
            <h4 style="font-size: 14px; margin: 2px 0 6px 0;">${day.name}</h4>
            <p style="font-size: 12px; color: #475569;">Trasa: ${day.route}</p>
            <p style="font-size: 11px; color: #1e293b; margin: 4px 0;"><strong>Dystans:</strong> ${day.distanceKm} km | Przewyższenie: ${day.elevationGain}</p>
            <p style="font-size: 11px; font-style: italic; color: #64748b;">${day.spiritualTheme}</p>
            ${isOjcow ? '<div style="background: #fee2e2; color: #991b1b; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-top: 6px;"><i class=\"fa-solid fa-heart\"></i> NOCLEG W OJCOWIE W DZIEŃ OJCA! Czuwanie pod Bramą Krakowską</div>' : ''}
            <button class="btn-micro" style="margin-top: 8px; width: 100%;" onclick="window.app.startDigitalSimForDay(${day.dayNumber})">
              <i class="fa-solid fa-person-walking"></i> Wirtualny spacer tym etapem
            </button>
          </div>
        `);
      this.drawnLayers.markers.addLayer(dayMarker);

      // Karta w sidebarze
      const dayCard = document.createElement('div');
      dayCard.className = `day-card ${isOjcow ? 'highlight-fathers-day' : ''}`;
      dayCard.innerHTML = `
        <div class="day-header">
          <span class="day-num-tag">Dzień ${day.dayNumber}</span>
          <span class="day-date-tag">${day.date}</span>
        </div>
        <h4 class="day-title">${day.name}</h4>
        <div class="day-route"><i class="fa-solid fa-arrow-right-long"></i> ${day.route}</div>
        <div style="font-size: 11px; color: var(--gold-light); margin-bottom: 6px;">
          <i class="fa-solid fa-shoe-prints"></i> ${day.distanceKm} km | <i class="fa-solid fa-mountain"></i> ${day.elevationGain}
        </div>
        <ul class="day-highlights-list">
          ${day.highlights.map(h => `<li><i class="fa-solid fa-check"></i> ${h}</li>`).join('')}
        </ul>
        <div style="font-size: 11px; font-style: italic; color: var(--text-muted); margin: 6px 0;">
          "${day.spiritualTheme}"
        </div>
        <div class="card-actions-row">
          <button class="btn-card-action" onclick="window.app.focusDayOnMap(${day.dayNumber})">
            <i class="fa-solid fa-map-location-dot"></i> Przybliż trasę
          </button>
          <button class="btn-card-live" onclick="window.app.openLiveStreamByDay(${day.dayNumber})">
            <i class="fa-brands fa-youtube"></i> Transmisja Live
          </button>
        </div>
      `;

      container.appendChild(dayCard);
    });

    // Pokaż wirtualny panel symulatora
    document.getElementById('digital-sim-bar').style.display = 'flex';
  }

  focusDayOnMap(dayNumber) {
    const day = STAGE_2_DAYS.find(d => d.dayNumber === dayNumber);
    if (!day) return;
    const bounds = L.latLngBounds(day.coords);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }

  renderStage2AccommodationsOnMap() {
    this.drawnLayers.accommodations.clearLayers();

    const filtered = this.activeLodgingFilter === 'all'
      ? ACCOMMODATIONS
      : ACCOMMODATIONS.filter(a => a.type === this.activeLodgingFilter);

    filtered.forEach(acc => {
      const isOjcow = acc.id.includes('ojcow');
      const iconClass = this.getLodgingIcon(acc.type);

      const accIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div class="pin-icon" style="--pin-bg: ${isOjcow ? '#ef4444' : '#10b981'}; width: 30px; height: 30px;">
            <i class="fa-solid ${iconClass}" style="font-size: 12px;"></i>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([acc.lat, acc.lng], { icon: accIcon })
        .bindPopup(`
          <div style="font-family: var(--font-main); max-width: 260px;">
            <span class="lodging-type-tag" style="background: rgba(16, 185, 129, 0.2); color: #047857; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${acc.typeLabel}</span>
            <h4 style="font-size: 13px; font-weight: 700; margin: 4px 0;">${acc.name}</h4>
            <p style="font-size: 11px; color: #475569; margin-bottom: 4px;">${acc.description}</p>
            <div style="font-size: 11px; color: #0f172a; margin-bottom: 6px;">
              <div><strong>Pojemność:</strong> ${acc.capacity}</div>
              <div><strong>Koszt / Ofiara:</strong> ${acc.priceRange}</div>
              <div><strong>Kontakt:</strong> ${acc.contact}</div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 3px; margin-bottom: 6px;">
              ${acc.amenities.map(am => `<span style="font-size: 9px; background: #e2e8f0; color: #334155; padding: 1px 5px; border-radius: 4px;">${am}</span>`).join('')}
            </div>
            <button class="btn-micro" style="width: 100%;" onclick="window.app.bookLodgingPrompt('${acc.name}')">
              <i class="fa-regular fa-calendar-plus"></i> Zgłoś nocleg pielgrzyma
            </button>
          </div>
        `);
      this.drawnLayers.accommodations.addLayer(marker);
    });
  }

  /* -------------------------------------------------------------------------
     ETAP 3: ROZESŁANIE (MISSIO)
     ------------------------------------------------------------------------- */
  renderStage3Routes() {
    const container = document.getElementById('routes-container');
    container.innerHTML = `
      <div style="background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.4); padding: 14px; border-radius: 12px; margin-bottom: 14px;">
        <div style="font-weight: 800; color: #c4b5fd; font-size: 14px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-dove"></i> Etap III: Missio – Idźcie na cały świat!
        </div>
        <p style="font-size: 12px; color: #e2e8f0; margin-top: 6px; line-height: 1.5;">
          Uroczyste zakończenie wędrówki w Sanktuarium Bożego Miłosierdzia w Krakowie-Łagiewnikach. Błogosławieństwo rozesłania i powrót promieni do ich rodzimych miast i krajów na całym świecie.
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div class="route-card" style="--card-color: #8b5cf6;">
          <h4 class="card-title">Błogosławieństwo Rozesłania (24–25 Czerwca 2026)</h4>
          <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
            Msza Święta Posłania przy Ołtarzu Polowym w Łagiewnikach. Pielgrzymi fizyczni i cyfrowi otrzymują Krzyż Pielgrzyma oraz Certyfikat Świadectwa.
          </p>
          <button class="btn-card-action" onclick="document.getElementById('btn-open-digital-modal').click()">
            <i class="fa-solid fa-award"></i> Odbierz swój Certyfikat Pielgrzyma
          </button>
        </div>

        <div class="route-card" style="--card-color: #3b82f6;">
          <h4 class="card-title">Drogi Powrotne & Świadectwa</h4>
          <p style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">
            Autokary, pociągi pielgrzymkowe PKP oraz loty powrotne dla grup zagranicznych (Rzym, Wilno, Fatima, USA). Trwające transmisje podsumowujące.
          </p>
          <button class="btn-card-live" onclick="window.app.openLiveModal()">
            <i class="fa-brands fa-youtube"></i> Oglądaj Transmisję Rozesłania
          </button>
        </div>
      </div>
    `;

    // Sanktuarium w Łagiewnikach jako centrum rozesłania
    const lagiewnikiIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div class="pin-icon" style="--pin-bg: #8b5cf6; width: 44px; height: 44px;">
          <i class="fa-solid fa-dove" style="color: #fff; font-size: 20px;"></i>
          <div class="pin-pulse" style="--pin-bg: #8b5cf6;"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const lagiewnikiMarker = L.marker([50.0197, 19.9377], { icon: lagiewnikiIcon })
      .bindPopup(`
        <div style="font-family: var(--font-main);">
          <h3 style="font-size: 15px; color: #8b5cf6;">Sanktuarium Bożego Miłosierdzia w Łagiewnikach</h3>
          <p style="font-size: 12px; color: #334155;">Punkt Kulminacyjny Pielgrzymki i Źródło Rozesłania Pielgrzymów na cały świat.</p>
        </div>
      `);
    this.drawnLayers.markers.addLayer(lagiewnikiMarker);

    // Promienie powrotne (odwrócone wektory)
    STAR_RAYS.forEach(ray => {
      const returnCoords = [[50.0197, 19.9377], ray.coordinates[0]];
      const poly = L.polyline(returnCoords, {
        color: '#8b5cf6',
        weight: 3,
        opacity: 0.7,
        dashArray: '6, 8'
      });
      poly.bindTooltip(`Rozesłanie ku: ${ray.startLocation}`, { sticky: true });
      this.drawnLayers.routes.addLayer(poly);
    });
  }

  /* -------------------------------------------------------------------------
     NOCLEGI (ACCOMMODATIONS)
     ------------------------------------------------------------------------- */
  renderAccommodations(searchQuery = '') {
    const listContainer = document.getElementById('lodging-list-container');
    listContainer.innerHTML = '';

    let filtered = this.activeLodgingFilter === 'all'
      ? ACCOMMODATIONS
      : ACCOMMODATIONS.filter(a => a.type === this.activeLodgingFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.typeLabel.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); padding: 12px; text-align: center;">Nie znaleziono noclegów pasujących do wyszukiwania.</div>';
      return;
    }

    filtered.forEach(acc => {
      const card = document.createElement('div');
      card.className = 'lodging-card';
      card.innerHTML = `
        <span class="lodging-type-tag">${acc.typeLabel}</span>
        <h4 class="lodging-name">${acc.name}</h4>
        <div class="lodging-details">
          <span><i class="fa-solid fa-location-dot"></i> ${acc.location}</span>
          <span><i class="fa-solid fa-users"></i> ${acc.capacity} | <i class="fa-solid fa-coins"></i> ${acc.priceRange}</span>
          <span><i class="fa-solid fa-phone"></i> ${acc.contact}</span>
        </div>
        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">${acc.description}</p>
        <div class="lodging-amenities">
          ${acc.amenities.map(am => `<span class="amenity-pill">${am}</span>`).join('')}
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
          <button class="btn-micro" onclick="window.app.focusLocation(${acc.lat}, ${acc.lng}, '${acc.name}')">
            <i class="fa-solid fa-location-crosshairs"></i> Pokaż na mapie
          </button>
          <button class="btn-micro primary-gold" onclick="window.app.bookLodgingPrompt('${acc.name}')">
            <i class="fa-solid fa-check"></i> Rezerwuj
          </button>
        </div>
      `;
      listContainer.appendChild(card);
    });

    if (this.currentStage === 'stage-2') {
      this.renderStage2AccommodationsOnMap();
    }
  }

  focusLocation(lat, lng, label) {
    this.map.flyTo([lat, lng], 14, { duration: 1.2 });
    L.popup()
      .setLatLng([lat, lng])
      .setContent(`<strong style="font-family: var(--font-main); font-size: 13px;">${label}</strong>`)
      .openOn(this.map);
  }

  bookLodgingPrompt(name) {
    alert(`Dziękujemy! Otrzymano zgłoszenie zapotrzebowania na nocleg w: "${name}". Koordynator kwatermistrzowski pielgrzymki skontaktuje się w celu potwierdzenia.`);
  }

  getLodgingIcon(type) {
    switch (type) {
      case 'pole_namiotowe': return 'fa-campground';
      case 'szkola': return 'fa-school';
      case 'agroturystyka': return 'fa-wheat-awn';
      case 'dom_parafialny': return 'fa-church';
      case 'hotel': return 'fa-hotel';
      case 'schronisko': return 'fa-mountain-sun';
      default: return 'fa-bed';
    }
  }

  /* -------------------------------------------------------------------------
     MULTIMEDIA & POI
     ------------------------------------------------------------------------- */
  renderPoi() {
    const poiContainer = document.getElementById('poi-grid-container');
    poiContainer.innerHTML = '';

    POI_POINTS.forEach(poi => {
      // Marker na mapie
      const poiIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div class="pin-icon" style="--pin-bg: #8b5cf6; width: 32px; height: 32px;">
            <i class="fa-solid fa-camera"></i>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: poiIcon })
        .bindPopup(`
          <div style="font-family: var(--font-main); max-width: 250px;">
            <img src="${poi.img}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" alt="${poi.name}"/>
            <span style="font-size: 10px; font-weight: 700; color: #8b5cf6;">${poi.category}</span>
            <h4 style="font-size: 13px; font-weight: 700; margin: 2px 0 4px 0;">${poi.name}</h4>
            <p style="font-size: 11px; color: #475569;">${poi.description}</p>
          </div>
        `);
      this.drawnLayers.poi.addLayer(marker);

      // Karta w galerii
      const card = document.createElement('div');
      card.className = 'poi-card';
      card.innerHTML = `
        <div class="poi-img-wrap">
          <img src="${poi.img}" alt="${poi.name}" loading="lazy"/>
          <span class="poi-category">${poi.category}</span>
        </div>
        <div class="poi-content">
          <h4 class="poi-title">${poi.name}</h4>
          <p class="poi-desc">${poi.description}</p>
          <div style="margin-top: 8px; display: flex; justify-content: space-between;">
            <button class="btn-micro" onclick="window.app.focusLocation(${poi.lat}, ${poi.lng}, '${poi.name}')">
              <i class="fa-solid fa-location-dot"></i> Pokaż na mapie
            </button>
            ${poi.liveCamera ? `<button class="btn-micro" style="color: #ef4444;" onclick="window.app.openLiveModal()"><i class="fa-brands fa-youtube"></i> Kamera Live</button>` : ''}
          </div>
        </div>
      `;
      poiContainer.appendChild(card);
    });
  }

  /* -------------------------------------------------------------------------
     WIRTUALNY MARSZ (GPS SIMULATOR)
     ------------------------------------------------------------------------- */
  startDigitalSimForDay(dayNumber) {
    const day = STAGE_2_DAYS.find(d => d.dayNumber === dayNumber);
    if (!day) return;

    this.stopDigitalSim();
    this.simulating = true;
    this.simIndex = 0;

    const coords = day.coords;
    document.getElementById('sim-step-title').innerText = `${day.name} (${day.distanceKm} km)`;

    const simIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <div class="pin-icon" style="--pin-bg: #ef4444; width: 36px; height: 36px;">
          <i class="fa-solid fa-person-walking"></i>
          <div class="pin-pulse" style="--pin-bg: #ef4444;"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.drawnLayers.simMarker = L.marker(coords[0], { icon: simIcon }).addTo(this.map);
    this.map.flyTo(coords[0], 13);

    const playBtn = document.getElementById('sim-play-btn');
    playBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pauza`;

    this.simInterval = setInterval(() => {
      if (!this.simulating) return;
      this.simIndex = (this.simIndex + 1) % coords.length;
      const targetPos = coords[this.simIndex];
      this.drawnLayers.simMarker.setLatLng(targetPos);
      this.map.panTo(targetPos);
    }, 2500);
  }

  toggleDigitalSim() {
    if (this.simulating) {
      this.simulating = false;
      clearInterval(this.simInterval);
      document.getElementById('sim-play-btn').innerHTML = `<i class="fa-solid fa-play"></i> Wirtualny Marsz`;
    } else {
      this.startDigitalSimForDay(6); // Domyślnie startuje Dzień Ojca w Ojcowie
    }
  }

  stopDigitalSim() {
    this.simulating = false;
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    if (this.drawnLayers.simMarker) {
      this.map.removeLayer(this.drawnLayers.simMarker);
      this.drawnLayers.simMarker = null;
    }
    const playBtn = document.getElementById('sim-play-btn');
    if (playBtn) playBtn.innerHTML = `<i class="fa-solid fa-play"></i> Wirtualny Marsz`;
  }

  /* -------------------------------------------------------------------------
     LIVE STREAMS & YOUTUBE PLAYER
     ------------------------------------------------------------------------- */
  renderStreamsList() {
    const list = document.getElementById('streams-list-container');
    list.innerHTML = '';

    LIVE_STREAMS.forEach((st, idx) => {
      const item = document.createElement('div');
      item.className = `stream-item ${idx === 0 ? 'active' : ''}`;
      item.innerHTML = `
        <div class="stream-group-name">${st.group}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${st.channel}</div>
        <div class="stream-viewers"><i class="fa-solid fa-circle text-red" style="font-size: 6px;"></i> ${st.viewersCount}</div>
      `;
      item.addEventListener('click', () => {
        document.querySelectorAll('.stream-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        this.switchActiveStream(st);
      });
      list.appendChild(item);
    });
  }

  switchActiveStream(stream) {
    this.activeLiveStream = stream;
    const iframe = document.getElementById('youtube-iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${stream.youtubeId}?autoplay=1&mute=1&enablejsapi=1`;
    document.getElementById('live-modal-title').innerText = stream.group;
    document.getElementById('video-stream-channel').innerText = stream.channel;
    document.getElementById('video-stream-desc').innerText = stream.description;
    document.getElementById('video-viewers-count').innerText = stream.viewersCount.split(' ')[0];
  }

  openLiveModal() {
    document.getElementById('live-modal').classList.add('open');
  }

  closeLiveModal() {
    document.getElementById('live-modal').classList.remove('open');
  }

  openLiveStreamByRay(ray) {
    const match = LIVE_STREAMS.find(s => s.group.toLowerCase().includes(ray.mode.toLowerCase()) || s.group.toLowerCase().includes(ray.name.toLowerCase()));
    if (match) {
      this.switchActiveStream(match);
    } else {
      this.switchActiveStream({
        group: ray.name,
        channel: ray.leader + " TV Live",
        youtubeId: ray.liveStreamId,
        viewersCount: `${ray.digitalPilgrims} oglądających`,
        description: ray.liveTitle
      });
    }
    this.openLiveModal();
  }

  openLiveStreamByRayId(rayId) {
    const ray = STAR_RAYS.find(r => r.id === rayId);
    if (ray) this.openLiveStreamByRay(ray);
  }

  openLiveStreamByDay(dayNumber) {
    const day = STAGE_2_DAYS.find(d => d.dayNumber === dayNumber);
    if (day && day.liveStream) {
      this.switchActiveStream({
        group: day.name,
        channel: `Orle Gniazda Dzień ${day.dayNumber} Live`,
        youtubeId: day.liveStream.id,
        viewersCount: `${day.liveStream.viewers} oglądających`,
        description: day.liveStream.title
      });
    }
    this.openLiveModal();
  }

  /* -------------------------------------------------------------------------
     MODLITEWNIK & INTENCJE CYFROWE
     ------------------------------------------------------------------------- */
  renderIntentions() {
    const feed = document.getElementById('intentions-feed');
    feed.innerHTML = '';

    this.intentions.forEach(item => {
      const card = document.createElement('div');
      card.className = 'intention-card';
      card.innerHTML = `
        <div class="intention-top">
          <span class="intention-author"><i class="fa-solid fa-user"></i> ${item.author}</span>
          <span class="intention-time">${item.date}</span>
        </div>
        <p class="intention-body">"${item.text}"</p>
        <div class="intention-bottom">
          <span><i class="fa-solid fa-cross"></i> ${item.group}</span>
          <button class="btn-amen" onclick="window.app.likeIntention(${item.id})">
            <i class="fa-solid fa-heart"></i> Amen (${item.likes})
          </button>
        </div>
      `;
      feed.appendChild(card);
    });
  }

  addIntention(author, text, group) {
    const newIntention = {
      id: Date.now(),
      author: author || 'Anonimowy Pielgrzym',
      text: text,
      date: 'Przed chwilą',
      likes: 1,
      group: group || 'Wszystkie Grupy'
    };
    this.intentions.unshift(newIntention);
    this.renderIntentions();
  }

  likeIntention(id) {
    const item = this.intentions.find(i => i.id === id);
    if (item) {
      item.likes += 1;
      this.renderIntentions();
    }
  }

  /* -------------------------------------------------------------------------
     DOM EVENTS BINDINGS
     ------------------------------------------------------------------------- */
  bindDomEvents() {
    // Mobile View Switcher (Both / Map / Panel)
    const appLayout = document.getElementById('app-layout') || document.querySelector('.app-layout');
    document.querySelectorAll('.mobile-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mobile-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.dataset.view;
        if (appLayout) {
          appLayout.classList.remove('mobile-view-both', 'mobile-view-map', 'mobile-view-panel');
          if (view === 'map') appLayout.classList.add('mobile-view-map');
          else if (view === 'panel') appLayout.classList.add('mobile-view-panel');
          else appLayout.classList.add('mobile-view-both');
        }
        setTimeout(() => {
          if (this.map) this.map.invalidateSize();
        }, 150);
      });
    });

    // Window Resize / Orientation Change handlers for Leaflet redraw
    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 200);
    });

    // Stage Switcher
    document.querySelectorAll('.stage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.renderStage(btn.dataset.stage);
      });
    });

    // Map Tile Switcher
    document.querySelectorAll('.layer-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTileLayer(btn.dataset.layer);
      });
    });

    // Sidebar Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(btn.dataset.tab);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Ray Mode Filter Chips (Etap 1)
    document.querySelectorAll('#mode-filters-container .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#mode-filters-container .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeRayFilter = chip.dataset.mode;
        this.clearMapDrawings();
        this.renderStage1Routes();
      });
    });

    // Lodging Filter Chips (Etap 2)
    document.querySelectorAll('#lodging-filter-chips .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#lodging-filter-chips .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeLodgingFilter = chip.dataset.lodgingType;
        this.renderAccommodations();
      });
    });

    // Focus Ojcow button in alert
    document.getElementById('btn-focus-ojcow').addEventListener('click', () => {
      this.focusLocation(50.2106, 19.8294, 'Ojców – Nocleg w Dzień Ojca (23.06)');
    });

    // Info Modal Open / Close
    const infoModal = document.getElementById('info-modal');
    const openInfoBtn = document.getElementById('btn-open-info');
    if (openInfoBtn && infoModal) {
      openInfoBtn.addEventListener('click', () => {
        infoModal.classList.add('open');
      });
      const closeInfoBtn = document.getElementById('btn-close-info-modal');
      if (closeInfoBtn) closeInfoBtn.addEventListener('click', () => {
        infoModal.classList.remove('open');
        this.stopAiLector();
      });
      const closeInfoFooterBtn = document.getElementById('btn-close-info-modal-footer');
      if (closeInfoFooterBtn) closeInfoFooterBtn.addEventListener('click', () => {
        infoModal.classList.remove('open');
        this.stopAiLector();
      });
      infoModal.addEventListener('click', (e) => {
        if (e.target.id === 'info-modal') {
          infoModal.classList.remove('open');
          this.stopAiLector();
        }
      });
    }

    // Lektor AI in Info Modal
    const lectorBtn = document.getElementById('btn-toggle-ai-lector');
    if (lectorBtn) {
      lectorBtn.addEventListener('click', () => this.toggleAiLector());
    }

    // Live Modal Open / Close
    document.getElementById('btn-toggle-live').addEventListener('click', () => this.openLiveModal());
    document.getElementById('hud-live-stream-btn').addEventListener('click', () => this.openLiveModal());
    document.getElementById('btn-close-live-modal').addEventListener('click', () => this.closeLiveModal());
    document.getElementById('live-modal').addEventListener('click', (e) => {
      if (e.target.id === 'live-modal') this.closeLiveModal();
    });

    // Digital Certificate Modal Open / Close
    const certModal = document.getElementById('digital-modal');
    document.getElementById('btn-open-digital-modal').addEventListener('click', () => {
      certModal.classList.add('open');
    });
    document.getElementById('btn-close-digital-modal').addEventListener('click', () => {
      certModal.classList.remove('open');
    });
    certModal.addEventListener('click', (e) => {
      if (e.target.id === 'digital-modal') certModal.classList.remove('open');
    });

    // Detail Modal Close
    const detailModal = document.getElementById('detail-modal');
    document.getElementById('btn-close-detail-modal').addEventListener('click', () => {
      detailModal.classList.remove('open');
    });
    detailModal.addEventListener('click', (e) => {
      if (e.target.id === 'detail-modal') detailModal.classList.remove('open');
    });

    // Certificate Generator Form
    document.getElementById('certificate-generator-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cert-name').value;
      const city = document.getElementById('cert-city').value;
      const type = document.getElementById('cert-type').value;

      document.getElementById('preview-pilgrim-name').innerText = name;
      document.getElementById('preview-city').innerText = city;
      document.getElementById('preview-type').innerText = type;
      document.getElementById('certificate-preview').style.display = 'block';
    });

    // Intention Form Submit
    document.getElementById('prayer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const author = document.getElementById('prayer-author').value;
      const text = document.getElementById('prayer-text').value;
      const group = document.getElementById('prayer-group-select').value;
      this.addIntention(author, text, group);
      document.getElementById('prayer-text').value = '';
    });

    // Digital Sim Controls
    document.getElementById('sim-play-btn').addEventListener('click', () => this.toggleDigitalSim());
    document.getElementById('sim-close-btn').addEventListener('click', () => {
      document.getElementById('digital-sim-bar').style.display = 'none';
      this.stopDigitalSim();
    });

    // Live Chat Send input
    const chatInput = document.getElementById('live-chat-input');
    const sendChat = () => {
      const val = chatInput.value.trim();
      if (!val) return;
      const chatContainer = document.getElementById('live-chat-messages');
      const msg = document.createElement('div');
      msg.className = 'chat-msg';
      msg.innerHTML = `<span class="chat-user">Ty:</span> <span class="chat-txt">${val}</span>`;
      chatContainer.appendChild(msg);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      chatInput.value = '';
    };

    // Lodging Live Search
    const searchInput = document.getElementById('lodging-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderAccommodations(e.target.value);
      });
    }

    // Geolocation FAB
    const geoBtn = document.getElementById('btn-geolocation');
    if (geoBtn) {
      geoBtn.addEventListener('click', () => {
        this.locateUser();
      });
    }

    // Jasna Góra Bells Audio FAB
    const bellsBtn = document.getElementById('btn-audio-bells');
    if (bellsBtn) {
      bellsBtn.addEventListener('click', () => {
        this.playPilgrimBells();
      });
    }

    // Fullscreen FAB
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  /* -------------------------------------------------------------------------
     GEOLOCATION & AUDIO SYNTHESIS
     ------------------------------------------------------------------------- */
  locateUser() {
    if (!navigator.geolocation) {
      alert('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (this.userGpsMarker) {
          this.map.removeLayer(this.userGpsMarker);
        }

        const gpsIcon = L.divIcon({
          className: 'user-gps-marker',
          html: `
            <div class="gps-dot"></div>
            <div class="gps-ring"></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        this.userGpsMarker = L.marker([latitude, longitude], { icon: gpsIcon }).addTo(this.map);
        this.map.flyTo([latitude, longitude], 14, { duration: 1.2 });
        this.userGpsMarker.bindPopup(`
          <div style="font-family: var(--font-main);">
            <strong style="color: #3b82f6;"><i class="fa-solid fa-person-walking"></i> Twoja Pozycja na Szlaku</strong>
            <p style="font-size: 11px; color: #475569; margin-top: 4px;">Dokładność: ok. ${Math.round(accuracy)} metrów</p>
          </div>
        `).openPopup();
      },
      () => {
        // Symulacja pozycji pielgrzyma na wypadek odmowy uprawnień (np. na Wałach Jasnej Góry)
        this.map.flyTo([50.8122, 19.0975], 14, { duration: 1.2 });
        L.popup()
          .setLatLng([50.8122, 19.0975])
          .setContent('<strong style="font-family: var(--font-main);">Jasna Góra – Start Szlaku Zjednoczonego</strong>')
          .openOn(this.map);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  playPilgrimBells() {
    // Generowanie uroczystego akordu dzwonów sakralnych za pomocą Web Audio API
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5 (Czysty akord C-dur)

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5 + idx * 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.4);
        osc.stop(ctx.currentTime + 4.5);
      });

      const bellsBtn = document.getElementById('btn-audio-bells');
      bellsBtn.classList.add('active');
      setTimeout(() => bellsBtn.classList.remove('active'), 4000);
    } catch {
      // audio fallback
    }
  }

  /* -------------------------------------------------------------------------
     LEKTOR AI SPEECH SYNTHESIS ENGINE
     ------------------------------------------------------------------------- */
  toggleAiLector() {
    if (this.isLectorSpeaking) {
      this.stopAiLector();
    } else {
      this.startAiLector();
    }
  }

  stopAiLector() {
    this.isLectorSpeaking = false;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    const icon = document.getElementById('btn-lector-icon');
    const text = document.getElementById('btn-lector-text');
    const btn = document.getElementById('btn-toggle-ai-lector');
    const box = document.getElementById('ai-lector-icon-box');
    if (icon) { icon.className = 'fa-solid fa-volume-high'; }
    if (text) { text.innerText = 'Odsłuchaj Przewodnik (Lektor AI)'; }
    if (btn) { btn.style.background = 'linear-gradient(135deg, #d97706, #b45309)'; }
    if (box) { box.style.background = '#d97706'; }
  }

  startAiLector() {
    if (!('speechSynthesis' in window)) {
      alert('Twoja przeglądarka nie obsługuje syntezy mowy.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch {}

    this.isLectorSpeaking = true;

    const icon = document.getElementById('btn-lector-icon');
    const text = document.getElementById('btn-lector-text');
    const btn = document.getElementById('btn-toggle-ai-lector');
    const box = document.getElementById('ai-lector-icon-box');
    if (icon) { icon.className = 'fa-solid fa-stop'; }
    if (text) { text.innerText = 'Zatrzymaj Lektora AI'; }
    if (btn) { btn.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)'; }
    if (box) { box.style.background = '#dc2626'; }

    const lectorScript = `
Witaj na szlaku Wielkiej Pielgrzymki Gwiaździstej i Szlaku Orlich Gniazd. 

Oto przewodnik po niezwykłej drodze serca, braterstwa i duchowej odnowy.

O co w niej chodzi i na czym polega ta pielgrzymka?
Pielgrzymka opiera się na idei dwóch wielkich gwiazd, łączących najważniejsze sanktuaria Polski. 
Jako promienie pierwszej gwiazdy, pielgrzymi wyruszają z różnych zakątków Polski i świata – pieszo, rowerami, pociągami czy autokarami – by zjednoczyć się u stóp Matki Bożej na Jasnej Górze w Częstochowie. 
Następnie, tworząc jedną wielką rodzinę, wyruszają we wspólną, 7-dniową wędrówkę pieszą liczącą 174 kilometry przez malowniczy Szlak Orlich Gniazd na Wyżynie Krakowsko-Częstochowskiej, aż do Sanktuarium Bożego Miłosierdzia w krakowskich Łagiewnikach.
Tam, u źródła orędzia Bożego Miłosierdzia, stają się promieniami drugiej gwiazdy – rozchodzącymi się z powrotem na cały świat z przesłaniem pokoju, nadziei, przebaczenia i braterskiej miłości. To żywe doświadczenie, że wszyscy jesteśmy dziećmi jednego Ojca.

Pielgrzymka nie jest jedynie sprawdzianem kondycyjnym. Jest szkołą patrzenia na naszą codzienność z perspektywy wieczności – tak jak uczy nas blog Widoki na Raj.

Posłuchaj, jak wygląda każdy z siedmiu dni tego szlaku:

Dzień pierwszy, 18 czerwca. Dystans: 28 kilometrów. Trasa: Jasna Góra do Złotego Potoku.
O godzinie siódmej rano na Wałach Jasnogórskich odbywa się uroczysta Msza Święta inaugurująca zjednoczenie wszystkich promieni. Pielgrzymi ruszają ku jurajskim ostępom, mijając ruiny Zamku w Olsztynie i zabytkowe Zrębice, docierając na nocleg do bukowych lasów Złotego Potoku.

Dzień drugi, 19 czerwca. Dystans: 24 kilometry. Trasa: Złoty Potok do Bobolic i Mirowa.
Dzień rozpoczyna się przejściem przez rezerwat Ostrężnik, a punktem kulminacyjnym jest wędrówka malowniczą Grzędą Mirowską między bliźniaczymi zamkami Mirów i Bobolice. Wieczór to czas wspólnego ogniska i odpoczynku pod jurajskim niebem.

Dzień trzeci, 20 czerwca. Dystans: 26 kilometrów. Trasa: Bobolice do Zamku Ogrodzieniec.
Szlak prowadzi przez skaliste wzniesienia Góry Zborów w Podlesicach, z której roztacza się zapierająca dech panorama Jury. Następnie przez Zamek Morsko i Skarżyce pielgrzymi docierają do Podzamcza u stóp monumentalnego Zamku Ogrodzieniec, gdzie wieczorem odbywa się modlitewne nabożeństwo światła.

Dzień czwarty, 21 czerwca. Dystans: 27 kilometrów. Trasa: Ogrodzieniec przez Zamek Smoleń i Bydlin do Klucz i Pustyni Błędowskiej.
To dzień szczególny i duchowy punkt kulminacyjny całej drogi – Dzień Przesilenia Letniego, najdłuższy dzień w roku, tryumf światła nad ciemnością oraz moment duchowego oświecenia.
Dzień 21 czerwca to także wyjątkowe osobiste święto autora – moje urodziny – i bezpośrednie serce mojego bloga oraz dzieła Widoki na Raj.
Stając na punkcie widokowym Czubatka i spoglądając na bezkres Pustyni Błędowskiej, doświadczamy prawdy, że nawet pośród najtrudniejszych pustyń naszego życia, w chorobie, cierpieniu, zranieniach czy samotności, Bóg rozlewa Swoje światło. Blog Widoki na Raj uczy nas patrzeć na każdy trud doczesnej wędrówki z perspektywy wieczności i Bożej logiki miłości. Na wzgórzu Czubatka modlimy się o wewnętrzne oświecenie, odrodzenie nadziei i pokój serca dla każdego z nas.

Dzień piąty, 22 czerwca. Dystans: 25 kilometrów. Trasa: Klucze do Zamku Pieskowa Skała.
Wkraczamy w granice Ojcowskiego Parku Narodowego. Szlak wiedzie przez zamek Rabsztyn i Sułoszową, otwierając przed pielgrzymami widok na słynną Maczugę Herkulesa oraz renesansowy zamek Pieskowa Skała. Wieczorna kontemplacja w Dolinie Prądnika przywraca siły przed kolejnym etapem.

Dzień szósty, 23 czerwca. Dystans: 18 kilometrów. Trasa: Pieskowa Skała do Ojcowa.
Ten dzień ma wyjątkowy charakter, ponieważ przypada w Dzień Ojca. Pielgrzymi schodzą w głąb wapiennego wąwozu Doliny Prądnika, mijając Grodzisko i Kaplicę na Wodzie. Wieczorem pod majestatyczną Bramą Krakowską w Ojcowie odbywa się wielkie czuwanie modlitewne w intencji wszystkich ojców, rodzin, przebaczenia w relacjach i odwagi w wierze.

Dzień siódmy, 24 czerwca. Wielki Finał. Dystans: 26 kilometrów. Trasa: Ojców do Krakowa-Łagiewnik.
Ostatni odcinek prowadzi przez Zamek Korzkiew i Zielonki w stronę Krakowa. Pielgrzymi wkraczają na Wzgórze Miłosierdzia w Łagiewnikach. O godzinie piętnastej, w Godzinie Miłosierdzia, sprawowana jest dziękczynna Msza Święta i odmawiana jest uroczysta Koronka do Bożego Miłosierdzia.
Tu, u celu drogi, pielgrzymka się nie kończy. Stąd każdy wyrusza z powrotem do swojego domu, do rodziny i pracy, stając się promieniem drugiej gwiazdy niosącym światu orędzie Bożego Miłosierdzia, pokoju i nadziei.

Dziękujemy, że jesteś na tej drodze. Niech każdy krok otwiera Twoje serce na prawdziwe Widoki na Raj.
    `;

    // Podział na zdania dla płynnej syntezy bez limitu czasu
    const sentences = lectorScript
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let currentIndex = 0;

    const playNext = () => {
      if (!this.isLectorSpeaking || currentIndex >= sentences.length) {
        this.stopAiLector();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
      utterance.lang = 'pl-PL';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const plVoice = voices.find(v => v.lang.startsWith('pl'));
      if (plVoice) utterance.voice = plVoice;

      utterance.onend = () => {
        currentIndex++;
        playNext();
      };

      utterance.onerror = () => {
        this.stopAiLector();
      };

      window.speechSynthesis.speak(utterance);
    };

    playNext();
  }
}

// Global initialization & Service Worker
window.addEventListener('DOMContentLoaded', () => {
  window.app = new PilgrimageApp();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
});
