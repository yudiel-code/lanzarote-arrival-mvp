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
    iconSize: [92, 42],
    iconAnchor: [46, 42]
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

  if (bounds.length === 1) proMap.setView(bounds[0], 12);
  else proMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });

  requestAnimationFrame(() => proMap?.invalidateSize());
}

function renderProFilters(items) {
  const { zones, types } = getFilterOptions(items);

  return `
    <div class="pro-filters-card">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Control real</span>
          <h3>Filtra el alojamiento a tu manera</h3>
        </div>
        <span class="field-help">Mapa y lista sincronizados</span>
      </div>
      <div class="pro-filters-grid">
        <label class="field">
          <span>Zona</span>
          <select id="pro-filter-zone">
            <option value="all" ${appState.proFilters.zone === 'all' ? 'selected' : ''}>Todas</option>
            ${zones.map((zone) => `<option value="${zone}" ${appState.proFilters.zone === zone ? 'selected' : ''}>${zone}</option>`).join('')}
          </select>
        </label>
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
        <label class="field">
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
          <span class="module-kicker">Gancho Pro</span>
          <h3>Explora el mercado sin salirte del contexto</h3>
        </div>
      </div>
      <ul class="detail-bullets">
        <li>Ahora ves <strong>${filtered.length}</strong> opciones visibles de un total de <strong>${total}</strong>.</li>
        <li>Puedes filtrar por <strong>zona</strong>, <strong>tipo</strong> y <strong>precio</strong> sin perder la lógica de llegada.</li>
        <li>Cuando tocas una opción, te llevamos a <strong>Booking</strong> para cerrar la reserva.</li>
      </ul>
    </div>
  `;
}

function renderMapCard(filtered) {
  return filtered.length ? `
    <div class="map-card map-card--pro">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Mapa con precios</span>
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
      <p>Relaja precio máximo o cambia zona/tipo. Ahora mismo te has pasado de estrecho.</p>
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
        <h2>Explora alojamientos con mapa, filtros y precios</h2>
        <p>Aquí sí hay gancho real: tú controlas zona, tipo y precio antes de salir a Booking.</p>
      </div>

      ${renderProFilters(allOptions)}
      ${renderMarketSummary(filtered, allOptions.length)}
      ${renderMapCard(filtered)}
      ${renderResultList(filtered, selected)}
      ${renderSelectedPanel(selected)}
    </section>
  `;
}
