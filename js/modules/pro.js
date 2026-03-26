import { appState } from '../state.js';
import { buildScoredLodgingCatalog } from '../services/decision-engine.js';
import { buildLodgingActionSet, buildLodgingNarrative } from '../services/external-actions.js';

let proMap = null;

function getAllOptions() {
  if (!appState.operationalContext) return [];
  return buildScoredLodgingCatalog(appState.operationalContext, appState.arrivalType, appState.arrivalData);
}

function getFilterOptions(items) {
  const zones = [...new Set(items.map((item) => item.zone).filter(Boolean))];
  const types = [...new Set(items.map((item) => item.type).filter(Boolean))];
  return { zones, types };
}

function formatZoneLabel(zone) {
  const sample = getAllOptions().find((item) => item.zone === zone);
  return sample?.zoneLabel || zone;
}

function applyFilters(items) {
  const { zone, type, maxPrice, sort } = appState.proFilters;
  let filtered = [...items];

  if (zone !== 'all') filtered = filtered.filter((item) => item.zone === zone);
  if (type !== 'all') filtered = filtered.filter((item) => item.type === type);
  if (maxPrice) filtered = filtered.filter((item) => Number(item.priceValue) <= Number(maxPrice));

  if (sort === 'price-asc') filtered.sort((a, b) => a.priceValue - b.priceValue);
  if (sort === 'price-desc') filtered.sort((a, b) => b.priceValue - a.priceValue);
  if (sort === 'duration') filtered.sort((a, b) => (a.transport?.durationMin || 999) - (b.transport?.durationMin || 999));
  if (sort === 'recommended') filtered.sort((a, b) => b.score - a.score);

  return filtered;
}

function getSelectedLodging(items) {
  if (!items.length) return null;
  return items.find((item) => item.id === appState.selectedLodgingId) || items[0];
}

function markerIcon(item, isActive) {
  return window.L.divIcon({
    className: 'map-price-marker-shell',
    html: `<span class="map-price-marker ${isActive ? 'is-active' : ''}"><strong>${item.priceText}</strong><small>${item.label}</small></span>`,
    iconSize: [88, 40],
    iconAnchor: [44, 40]
  });
}

function dispatchLodgingSelection(id) {
  window.dispatchEvent(new CustomEvent('lz:select-lodging', {
    detail: { id, source: 'pro' }
  }));
}

export function destroyProMap() {
  if (proMap) {
    proMap.remove();
    proMap = null;
  }
}

export function initProMap() {
  destroyProMap();
  const container = document.getElementById('pro-map');
  if (!container || !window.L) return;

  const filtered = applyFilters(getAllOptions());
  if (!filtered.length) return;

  const selected = getSelectedLodging(filtered);

  proMap = window.L.map(container, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false
  });

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(proMap);

  const bounds = [];
  filtered.forEach((item) => {
    if (!item.coordinates?.lat || !item.coordinates?.lng) return;
    const latlng = [item.coordinates.lat, item.coordinates.lng];
    bounds.push(latlng);

    const marker = window.L.marker(latlng, {
      icon: markerIcon(item, item.id === selected?.id)
    }).addTo(proMap);

    marker.on('click', () => dispatchLodgingSelection(item.id));
    marker.bindTooltip(`${item.label} · ${item.priceText} · ${item.score}/100`, { direction: 'top', offset: [0, -12] });
  });

  if (bounds.length === 1) {
    proMap.setView(bounds[0], 11);
  } else {
    proMap.fitBounds(bounds, {
      paddingTopLeft: [84, 84],
      paddingBottomRight: [84, 84],
      maxZoom: 11
    });
  }

  requestAnimationFrame(() => proMap?.invalidateSize());
}

function renderZoneChips(zones) {
  return `
    <div class="pro-zone-chips" aria-label="Filtrar por zona">
      <button type="button" class="pro-zone-chip ${appState.proFilters.zone === 'all' ? 'is-active' : ''}" data-pro-zone="all">Todas</button>
      ${zones.map((zone) => `
        <button type="button" class="pro-zone-chip ${appState.proFilters.zone === zone ? 'is-active' : ''}" data-pro-zone="${zone}">${formatZoneLabel(zone)}</button>
      `).join('')}
    </div>
  `;
}

function renderProFilters(items) {
  const { zones, types } = getFilterOptions(items);

  return `
    <div class="pro-filters-card">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Filtro por zonas</span>
          <h3>Elige la zona que prefiera el cliente</h3>
        </div>
        <span class="field-help">Mostrando todo el catálogo actual</span>
      </div>
      ${renderZoneChips(zones)}
      <div class="pro-filters-grid">
        <label class="field">
          <span>Tipo</span>
          <select id="pro-filter-type">
            <option value="all" ${appState.proFilters.type === 'all' ? 'selected' : ''}>Todos</option>
            ${types.map((type) => `<option value="${type}" ${appState.proFilters.type === type ? 'selected' : ''}>${type}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>Precio máximo</span>
          <input id="pro-filter-max-price" type="number" min="0" step="1" placeholder="Ej. 110" value="${appState.proFilters.maxPrice || ''}" />
        </label>
        <label class="field field--full">
          <span>Ordenar</span>
          <select id="pro-filter-sort">
            <option value="recommended" ${appState.proFilters.sort === 'recommended' ? 'selected' : ''}>Mejor encaje</option>
            <option value="price-asc" ${appState.proFilters.sort === 'price-asc' ? 'selected' : ''}>Precio más bajo</option>
            <option value="price-desc" ${appState.proFilters.sort === 'price-desc' ? 'selected' : ''}>Precio más alto</option>
            <option value="duration" ${appState.proFilters.sort === 'duration' ? 'selected' : ''}>Traslado más corto</option>
          </select>
        </label>
      </div>
    </div>
  `;
}

function renderMarketSummary(filtered, total) {
  return `
    <div class="strategy-card strategy-card--insights">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Mercado visible</span>
          <h3>Precios del catálogo actual en el mapa</h3>
        </div>
      </div>
      <ul class="detail-bullets">
        <li>Ahora mismo se muestran <strong>${filtered.length}</strong> precios visibles de un total de <strong>${total}</strong> alojamientos cargados.</li>
        <li>Si eliges una zona, el mapa y la lista se reducen a esa preferencia.</li>
        <li>Al tocar una opción, la salida final sigue siendo en <strong>Booking</strong>.</li>
      </ul>
    </div>
  `;
}

function renderMapCard(filtered) {
  return filtered.length ? `
    <div class="map-card map-card--pro">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Mapa con todos los precios</span>
          <h3>Alojamientos visibles ahora</h3>
        </div>
        <span class="field-help">Toca un precio para seleccionar</span>
      </div>
      <div id="pro-map" class="map-canvas map-canvas--large" aria-label="Mapa pro con alojamientos filtrados"></div>
    </div>
  ` : `
    <div class="strategy-card strategy-card--fallback">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Sin resultados</span>
          <h3>No hay alojamientos con esos filtros</h3>
        </div>
      </div>
      <p>Relaja el precio máximo o cambia la zona/tipo. Ahora mismo te quedaste demasiado estrecho.</p>
    </div>
  `;
}

function renderResultList(filtered, selected) {
  return `
    <div class="pro-results-grid">
      ${filtered.map((item, index) => `
        <button type="button" class="pro-result-card ${item.id === selected?.id ? 'is-active' : ''}" data-select-lodging="${item.id}">
          <div class="section-heading">
            <div>
              <span class="module-kicker">#${index + 1} · ${item.zoneLabel}</span>
              <h3>${item.label}</h3>
            </div>
            <span class="score-badge">${item.priceText}</span>
          </div>
          <p>${item.type}</p>
          <p>${item.reasonLine}</p>
          <div class="pro-result-meta">
            <span>${item.score}/100</span>
            <span>${item.transport ? item.transport.durationLabel : '—'} en coche</span>
            <span>${item.transport ? `${item.transport.taxiMin}–${item.transport.taxiMax} € taxi` : 'Taxi —'}</span>
          </div>
        </button>
      `).join('')}
    </div>
  `;
}

function renderSelectedPanel(selected) {
  if (!selected) return '';
  const actions = buildLodgingActionSet({
    lodging: selected,
    arrivalKey: appState.operationalContext?.arrivalKey,
    hasDirectBus: selected.transport?.busAvailable
  });
  const narrative = buildLodgingNarrative(selected, null);

  return `
    <div class="selected-stay-card selected-stay-card--pro">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Opción elegida</span>
          <h3>${selected.label}</h3>
        </div>
        <span class="score-badge">${selected.score}/100</span>
      </div>
      <p>${selected.areaSummary}</p>
      <div class="stay-facts-grid">
        <div><strong>Precio</strong><span>${selected.priceText}/noche</span></div>
        <div><strong>Tipo</strong><span>${selected.type}</span></div>
        <div><strong>Traslado</strong><span>${selected.transport ? `${selected.transport.durationLabel} · ${selected.transport.distanceKm} km` : '—'}</span></div>
        <div><strong>Taxi</strong><span>${selected.transport ? `${selected.transport.taxiMin}–${selected.transport.taxiMax} €` : '—'}</span></div>
      </div>
      <ul class="detail-bullets">
        ${(narrative?.bullets || [selected.reasonLine]).map((item) => `<li>${item}</li>`).join('')}
      </ul>
      <div class="action-link-grid">
        ${actions.map((item) => `<a class="link-chip ${item.kind === 'primary' ? 'link-chip--primary' : ''}" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('')}
      </div>
      <p class="field-help">Ahora mismo la salida a Booking abre la búsqueda del alojamiento concreto. Para redirección exacta por hotel harían falta IDs/property links reales.</p>
    </div>
  `;
}

export function renderPro() {
  const allOptions = getAllOptions();
  const filtered = applyFilters(allOptions);
  const selected = getSelectedLodging(filtered);

  return `
    <section class="screen screen--base">
      <div class="module-intro">
        <span class="module-kicker">Pro</span>
        <h2>Explora alojamientos con mapa, zonas y precios</h2>
        <p>Aquí manda el cliente: eliges zona, ves precios y luego sales a Booking.</p>
      </div>

      ${renderProFilters(allOptions)}
      ${renderMarketSummary(filtered, allOptions.length)}
      ${renderMapCard(filtered)}
      ${renderResultList(filtered, selected)}
      ${renderSelectedPanel(selected)}
    </section>
  `;
}
