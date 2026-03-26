import { appState } from '../state.js';
import { buildRecommendation } from '../services/decision-engine.js';
import { getBusAdvisory } from '../services/bus-service.js';
import { getArrivalActionLinks, buildLodgingActionSet, buildLodgingNarrative } from '../services/external-actions.js';

let actionMap = null;

function getRecommendation() {
  if (!appState.operationalContext) return null;
  return buildRecommendation(appState.operationalContext, appState.arrivalType, appState.arrivalData);
}

function getSelectedLodging(recommendation) {
  const shortlist = recommendation?.shortlist || [];
  if (!shortlist.length) return null;
  return shortlist.find((item) => item.id === appState.selectedLodgingId) || shortlist[0];
}

function markerIcon(isActive, isPrimary) {
  return window.L.divIcon({
    className: 'map-marker-shell',
    html: `<span class="map-marker ${isPrimary ? 'map-marker--primary' : ''} ${isActive ? 'is-active' : ''}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
}

function dispatchLodgingSelection(id) {
  window.dispatchEvent(new CustomEvent('lz:select-lodging', {
    detail: { id, source: 'action' }
  }));
}

export function destroyAccionMap() {
  if (actionMap) {
    actionMap.remove();
    actionMap = null;
  }
}

export function initAccionMap() {
  destroyAccionMap();
  const container = document.getElementById('action-map');
  if (!container || !window.L) return;

  const recommendation = getRecommendation();
  const shortlist = recommendation?.shortlist || [];
  if (!shortlist.length) return;

  const selected = getSelectedLodging(recommendation);

  actionMap = window.L.map(container, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false
  });

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(actionMap);

  const bounds = [];
  shortlist.forEach((item, index) => {
    if (!item.coordinates?.lat || !item.coordinates?.lng) return;
    const latlng = [item.coordinates.lat, item.coordinates.lng];
    bounds.push(latlng);

    const marker = window.L.marker(latlng, {
      icon: markerIcon(item.id === selected?.id, index === 0)
    }).addTo(actionMap);

    marker.on('click', () => dispatchLodgingSelection(item.id));
    marker.bindTooltip(`${item.label} · ${item.priceText}`, { direction: 'top', offset: [0, -10] });
  });

  if (bounds.length === 1) {
    actionMap.setView(bounds[0], 12);
  } else {
    actionMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
  }

  requestAnimationFrame(() => actionMap?.invalidateSize());
}

function renderSelectedStay(recommendation, selected) {
  if (!selected) return '';

  const travelActions = buildLodgingActionSet({
    lodging: selected,
    arrivalKey: recommendation?.meta?.arrivalKey,
    hasDirectBus: selected.transport?.busAvailable
  });
  const narrative = buildLodgingNarrative(selected, recommendation?.transferRecommendation);

  return `
    <div class="selected-stay-card">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Opción activa</span>
          <h3>${selected.label}</h3>
        </div>
        <span class="score-badge">${selected.scoreLabel}</span>
      </div>
      <p>${narrative?.intro || selected.areaSummary}</p>
      <div class="stay-facts-grid">
        <div><strong>Precio</strong><span>${selected.priceText}/noche</span></div>
        <div><strong>Tipo</strong><span>${selected.type}</span></div>
        <div><strong>Traslado</strong><span>${selected.transport ? selected.transport.durationLabel : '—'} en coche</span></div>
        <div><strong>Taxi</strong><span>${selected.transport ? `${selected.transport.taxiMin}–${selected.transport.taxiMax} €` : '—'}</span></div>
      </div>
      <ul class="detail-bullets">
        ${(narrative?.bullets || [selected.reasonLine]).map((item) => `<li>${item}</li>`).join('')}
      </ul>
      ${selected.caution ? `<p class="field-help"><strong>Ojo:</strong> ${selected.caution}</p>` : ''}
      <div class="action-link-grid">
        ${travelActions.map((action) => `<a class="link-chip ${action.kind === 'primary' ? 'link-chip--primary' : ''}" href="${action.url}" target="_blank" rel="noopener noreferrer">${action.label}</a>`).join('')}
      </div>
    </div>
  `;
}

function renderStayShortlist(recommendation, selected) {
  if (!recommendation?.shortlist?.length) return '';

  return `
    <div class="stay-selector-grid">
      ${recommendation.shortlist.map((item) => `
        <button type="button" class="stay-option ${item.id === selected?.id ? 'is-active' : ''}" data-select-lodging="${item.id}">
          <strong>${item.label}</strong>
          <span>${item.priceText}/noche</span>
          <small>${item.transport ? item.transport.durationLabel : '—'} · ${item.scoreLabel}</small>
        </button>
      `).join('')}
    </div>
  `;
}

function renderTransportExecution(recommendation, selected) {
  const transfer = recommendation?.transferRecommendation;
  if (!transfer || !selected) return '';

  const arrivalLinks = getArrivalActionLinks(recommendation.meta.arrivalKey);
  const busPlan = getBusAdvisory({
    arrivalKey: recommendation.meta.arrivalKey,
    zone: selected.zone,
    destinationCoords: selected.coordinates
  });

  return `
    <div class="execution-card execution-card--${transfer.mode}">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Ejecución</span>
          <h3>${transfer.mode === 'taxi' ? 'Salir en taxi' : 'Intentar guagua primero'}</h3>
        </div>
        <span class="score-badge">${transfer.confidence}</span>
      </div>
      <p>${transfer.summary}</p>
      <ul class="detail-bullets">
        ${transfer.mode === 'taxi'
          ? transfer.taxi.reasons.map((item) => `<li>${item}</li>`).join('')
          : transfer.bus.reasons.map((item) => `<li>${item}</li>`).join('')}
      </ul>

      <div class="action-link-grid">
        ${arrivalLinks.map((item) => `<a class="link-chip" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('')}
        ${busPlan?.transitUrl ? `<a class="link-chip" href="${busPlan.transitUrl}" target="_blank" rel="noopener noreferrer">Abrir trayecto en Maps</a>` : ''}
        ${busPlan?.officialUrl ? `<a class="link-chip" href="${busPlan.officialUrl}" target="_blank" rel="noopener noreferrer">Bus oficial</a>` : ''}
      </div>

      ${busPlan ? `
        <div class="secondary-note ${busPlan.direct ? 'is-positive' : 'is-warning'}">
          <p><strong>${busPlan.title}:</strong> ${busPlan.summary}</p>
          <p>${busPlan.details}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function renderActivatedPlan(recommendation) {
  if (!appState.actionExecution.active || !appState.actionExecution.mode) return '';

  const mode = appState.actionExecution.mode;
  const selected = getSelectedLodging(recommendation);
  return `
    <div class="plan-card plan-card--active">
      <p class="plan-card__eyebrow">Plan marcado</p>
      <h3>${mode === 'taxi' ? 'Plan taxi activado' : 'Plan guagua activado'}</h3>
      <ul class="detail-bullets">
        <li>No abras más comparativas: ejecuta con ${mode === 'taxi' ? 'salida directa' : 'salida de ahorro controlado'}.</li>
        <li>Tu base activa es <strong>${selected?.label || 'la zona sugerida'}</strong>.</li>
        <li>Si el terreno cambia, usa los enlaces externos y corrige rápido.</li>
      </ul>
    </div>
  `;
}

function renderShareButton() {
  return `
    <div class="module-actions module-actions--secondary">
      <button id="share-btn" type="button" class="button button--ghost">Compartir este plan</button>
    </div>
  `;
}

export function renderAccion() {
  const recommendation = getRecommendation();
  const selected = getSelectedLodging(recommendation);
  const transfer = recommendation?.transferRecommendation;

  return `
    <section class="screen screen--base">
      <div class="module-intro">
        <span class="module-kicker">Acción</span>
        <h2>Pasa del consejo a la ejecución</h2>
        <p>Mapa real, base seleccionable y salidas directas a herramientas útiles.</p>
      </div>

      ${transfer ? `
        <div class="status-card status-card--${transfer.mode === 'taxi' ? 'high' : 'low'}">
          <p><strong>${transfer.headline}</strong></p>
          <p>${transfer.summary}</p>
        </div>
      ` : ''}

      ${recommendation?.shortlist?.length ? `
        <div class="map-card">
          <div class="section-heading">
            <div>
              <span class="module-kicker">Mapa real</span>
              <h3>Alojamientos y base sugerida</h3>
            </div>
            <span class="field-help">Toca una opción o un marcador</span>
          </div>
          <div id="action-map" class="map-canvas" aria-label="Mapa real con zonas sugeridas"></div>
        </div>
      ` : ''}

      ${renderStayShortlist(recommendation, selected)}
      ${renderSelectedStay(recommendation, selected)}
      ${renderTransportExecution(recommendation, selected)}

      <div class="module-actions">
        <button id="action-primary-cta-btn" type="button" data-action-mode="${transfer?.mode || 'taxi'}">
          ${appState.actionExecution.active ? 'Plan marcado' : `Marcar plan ${transfer?.mode || 'taxi'}`}
        </button>
      </div>

      ${renderActivatedPlan(recommendation)}
      ${renderShareButton()}
    </section>
  `;
}
