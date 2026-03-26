import { appState } from '../state.js';
import { buildRecommendation } from '../services/decision-engine.js';
import { buildLodgingActionSet, buildLodgingNarrative } from '../services/external-actions.js';

let proMap = null;

function getRecommendation(preferredMode = null) {
  if (!appState.operationalContext) return null;
  return buildRecommendation(appState.operationalContext, appState.arrivalType, appState.arrivalData, preferredMode);
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
    detail: { id, source: 'pro' }
  }));
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function pickSaverCandidate(items) {
  return [...items].sort((a, b) => saverScore(b) - saverScore(a))[0] || null;
}

function pickComfortCandidate(items) {
  return [...items].sort((a, b) => comfortScore(b) - comfortScore(a))[0] || null;
}

function saverScore(item) {
  let score = item.score || 0;
  if (item.transport?.busAvailable) score += 18;
  if (typeof item.priceValue === 'number') score -= item.priceValue * 0.52;
  if (typeof item.transport?.durationMin === 'number') score -= item.transport.durationMin * 0.35;
  return score;
}

function comfortScore(item) {
  let score = item.score || 0;
  const bestFor = (item.bestFor || []).join(' ').toLowerCase();
  const typeBlob = `${item.type || ''} ${item.vibe || ''}`.toLowerCase();
  if (/familia|grupo|tranquila|primera base/.test(bestFor)) score += 12;
  if (/resort|relajado|turístico/.test(typeBlob)) score += 9;
  if (typeof item.transport?.durationMin === 'number' && item.transport.durationMin <= 24) score += 6;
  if (typeof item.priceValue === 'number') score -= item.priceValue * 0.14;
  return score;
}

function buildProStrategies() {
  const base = getRecommendation();
  if (!base) return null;

  const taxi = getRecommendation('taxi');
  const bus = getRecommendation('bus');
  const pool = dedupeById([
    base.primary,
    ...(base.alternatives || []),
    ...(taxi?.shortlist || []),
    ...(bus?.shortlist || [])
  ].filter(Boolean));

  const balancedLodging = base.primary || pool[0] || null;
  const saverLodging = pickSaverCandidate(pool) || balancedLodging;
  const comfortLodging = pickComfortCandidate(pool.filter((item) => item.id !== saverLodging?.id)) || pool[1] || balancedLodging;

  const strategies = [
    balancedLodging ? {
      key: 'balanced',
      eyebrow: 'Plan redondo',
      title: 'Resolver hoy sin liarte',
      summary: 'La opción más limpia entre llegada, fricción, tiempo y salida real.',
      mode: base.transferRecommendation?.mode || 'taxi',
      lodging: balancedLodging,
      bullets: [
        balancedLodging.reasonLine,
        balancedLodging.transport ? `${balancedLodging.transport.durationLabel} desde tu llegada` : 'Sin rodeos innecesarios',
        'Es la opción que menos probabilidades tiene de hacerte perder tiempo por una mala primera decisión.'
      ]
    } : null,
    saverLodging ? {
      key: 'saver',
      eyebrow: 'Plan ahorro',
      title: 'Gastar menos sin hacer una chapuza',
      summary: 'Prioriza coste y bus razonable, pero sin mandar al usuario a una base mala por ahorrar migas.',
      mode: saverLodging.transport?.busAvailable ? 'bus' : 'taxi',
      lodging: saverLodging,
      bullets: [
        saverLodging.transport?.busAvailable ? 'Mantiene una salida por guagua que todavía se defiende.' : 'Sigue siendo barato, pero no te promete una guagua que no existe.',
        typeof saverLodging.priceValue === 'number' ? `Se mueve sobre ${saverLodging.priceText}/noche.` : saverLodging.reasonLine,
        saverLodging.reasonLine
      ]
    } : null,
    comfortLodging ? {
      key: 'comfort',
      eyebrow: 'Plan confort',
      title: 'Dormir mejor aunque no sea lo más barato',
      summary: 'Pensado para quien valora más sensación de estancia, grupo o descanso que el euro más bajo.',
      mode: 'taxi',
      lodging: comfortLodging,
      bullets: [
        comfortLodging.reasonLine,
        comfortLodging.bestFor?.length ? `Encaja especialmente para ${comfortLodging.bestFor.slice(0, 2).join(' y ')}.` : 'Sube el nivel de estancia respecto a la pura base funcional.',
        comfortLodging.transport ? `Asume ${comfortLodging.transport.durationLabel} de traslado para comprar mejor estancia.` : 'Compra más calidad de estancia.'
      ]
    } : null
  ].filter(Boolean);

  const usedIds = new Set(strategies.map((item) => item.lodging?.id).filter(Boolean));
  const fallback = dedupeById([...(base.alternatives || []), ...pool]).find((item) => item.id && !usedIds.has(item.id)) || base.alternatives?.[0] || null;

  return { base, taxi, bus, strategies, fallback };
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

  const recommendation = getRecommendation();
  const shortlist = recommendation?.shortlist || [];
  if (!shortlist.length) return;

  const selected = getSelectedLodging(recommendation);

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
  shortlist.forEach((item, index) => {
    if (!item.coordinates?.lat || !item.coordinates?.lng) return;
    const latlng = [item.coordinates.lat, item.coordinates.lng];
    bounds.push(latlng);

    const marker = window.L.marker(latlng, {
      icon: markerIcon(item.id === selected?.id, index === 0)
    }).addTo(proMap);

    marker.on('click', () => dispatchLodgingSelection(item.id));
    marker.bindTooltip(`${item.label} · ${item.score}/100`, { direction: 'top', offset: [0, -10] });
  });

  if (bounds.length === 1) proMap.setView(bounds[0], 12);
  else proMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });

  requestAnimationFrame(() => proMap?.invalidateSize());
}

function renderStrategicRead(recommendation) {
  const transfer = recommendation?.transferRecommendation;
  const meta = recommendation?.meta;
  if (!transfer) return '';

  return `
    <div class="strategy-card">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Lectura Pro</span>
          <h3>${transfer.headline}</h3>
        </div>
        <span class="score-badge">confianza ${transfer.confidence}</span>
      </div>
      <p>${transfer.summary}</p>
      <div class="stay-facts-grid">
        <div><strong>Modo recomendado</strong><span>${transfer.mode === 'taxi' ? 'Taxi' : 'Guagua'}</span></div>
        <div><strong>Diferencia</strong><span>${transfer.scoreDelta} puntos</span></div>
        <div><strong>Clima</strong><span>${meta?.weather ? `${meta.weather.label} · ${meta.weather.tempC}°C` : 'Fallback'}</span></div>
        <div><strong>Carga</strong><span>${meta?.passengerLoad || '—'}</span></div>
      </div>
    </div>
  `;
}

function renderStrategyCards(payload) {
  if (!payload?.strategies?.length) return '';

  return `
    <div class="pro-plan-grid">
      ${payload.strategies.map((plan) => {
        const lodging = plan.lodging;
        const actions = buildLodgingActionSet({
          lodging,
          arrivalKey: payload.base?.meta?.arrivalKey,
          hasDirectBus: lodging.transport?.busAvailable
        }).slice(0, 3);

        return `
          <article class="pro-plan-card ${appState.selectedLodgingId === lodging.id ? 'is-active' : ''}">
            <div class="section-heading">
              <div>
                <span class="module-kicker">${plan.eyebrow}</span>
                <h3>${plan.title}</h3>
              </div>
              <span class="score-badge">${lodging.score}/100</span>
            </div>
            <p>${plan.summary}</p>
            <p><strong>${lodging.label}</strong> · ${lodging.type}</p>
            <div class="stay-facts-grid">
              <div><strong>Precio</strong><span>${lodging.priceText}/noche</span></div>
              <div><strong>Traslado</strong><span>${lodging.transport ? lodging.transport.durationLabel : '—'}</span></div>
              <div><strong>Modo</strong><span>${plan.mode === 'taxi' ? 'Taxi' : 'Guagua / mixto'}</span></div>
              <div><strong>Taxi</strong><span>${lodging.transport ? `${lodging.transport.taxiMin}–${lodging.transport.taxiMax} €` : '—'}</span></div>
            </div>
            <ul class="detail-bullets">${plan.bullets.map((item) => `<li>${item}</li>`).join('')}</ul>
            <div class="action-link-grid">
              ${actions.map((item) => `<a class="link-chip ${item.kind === 'primary' ? 'link-chip--primary' : ''}" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('')}
              <button type="button" class="button button--ghost pro-plan-apply" data-activate-pro-plan="${plan.key}" data-plan-mode="${plan.mode}" data-plan-lodging="${lodging.id}">Aplicar y pasar a Acción</button>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderFallbackPlan(payload) {
  const fallback = payload?.fallback;
  if (!fallback) return '';
  const actions = buildLodgingActionSet({
    lodging: fallback,
    arrivalKey: payload.base?.meta?.arrivalKey,
    hasDirectBus: fallback.transport?.busAvailable
  }).slice(0, 2);

  return `
    <div class="strategy-card strategy-card--fallback">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Plan B real</span>
          <h3>${fallback.label} como respaldo rápido</h3>
        </div>
        <span class="score-badge">alternativa útil</span>
      </div>
      <p>Esto sí diferencia un plan serio de una recomendación bonita: ya tienes la siguiente jugada preparada si la primera se te cae.</p>
      <ul class="detail-bullets">
        <li>Úsalo si la cola de taxi se pone fea o el precio real del primer alojamiento no te cuadra.</li>
        <li>${fallback.reasonLine}</li>
        <li>${fallback.transport ? `Te mete ${fallback.transport.durationLabel} de traslado y mantiene una salida ${fallback.transport.busAvailable ? 'con bus razonable' : 'más dependiente del taxi'}.` : 'Mantiene una segunda salida coherente.'}</li>
      </ul>
      <div class="action-link-grid">
        ${actions.map((item) => `<a class="link-chip" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('')}
        <button type="button" class="button button--ghost pro-plan-apply" data-activate-pro-plan="fallback" data-plan-mode="${fallback.transport?.busAvailable ? 'bus' : 'taxi'}" data-plan-lodging="${fallback.id}">Usar este respaldo</button>
      </div>
    </div>
  `;
}

function renderComparisonTable(recommendation, selected) {
  if (!recommendation?.shortlist?.length) return '';

  return `
    <div class="comparison-table-card">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Comparativa rápida</span>
          <h3>Qué zona gana y por qué</h3>
        </div>
      </div>
      <div class="pro-compare-list">
        ${recommendation.shortlist.map((item, index) => `
          <button type="button" class="pro-compare-row ${item.id === selected?.id ? 'is-active' : ''}" data-select-lodging="${item.id}">
            <span class="pro-rank">#${index + 1}</span>
            <span class="pro-zone">
              <strong>${item.label}</strong>
              <small>${item.type}</small>
            </span>
            <span class="pro-metrics">
              <strong>${item.score}/100</strong>
              <small>${item.transport ? item.transport.durationLabel : '—'} · ${item.priceText}</small>
            </span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSelectedPanel(recommendation, selected) {
  if (!selected) return '';
  const actionSet = buildLodgingActionSet({
    lodging: selected,
    arrivalKey: recommendation?.meta?.arrivalKey,
    hasDirectBus: selected.transport?.busAvailable
  });
  const narrative = buildLodgingNarrative(selected, recommendation.transferRecommendation);

  return `
    <div class="selected-stay-card selected-stay-card--pro">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Detalle útil</span>
          <h3>${selected.label}</h3>
        </div>
        <span class="score-badge">${selected.score}/100</span>
      </div>
      <p>${selected.areaSummary}</p>
      <div class="stay-facts-grid">
        <div><strong>Precio</strong><span>${selected.priceText}/noche</span></div>
        <div><strong>Traslado</strong><span>${selected.transport ? `${selected.transport.durationLabel} · ${selected.transport.distanceKm} km` : '—'}</span></div>
        <div><strong>Taxi</strong><span>${selected.transport ? `${selected.transport.taxiMin}–${selected.transport.taxiMax} €` : '—'}</span></div>
        <div><strong>Guagua</strong><span>${selected.transport?.busAvailable ? 'Sí, como plan razonable' : 'Floja o poco directa'}</span></div>
      </div>
      <ul class="detail-bullets">
        ${(narrative?.bullets || [selected.reasonLine]).map((item) => `<li>${item}</li>`).join('')}
        ${(selected.downsides || []).slice(0, 2).map((item) => `<li>${item}</li>`).join('')}
      </ul>
      ${selected.bestFor?.length ? `<p><strong>Encaja sobre todo para:</strong> ${selected.bestFor.join(' · ')}</p>` : ''}
      ${selected.caution ? `<p class="field-help"><strong>Ojo:</strong> ${selected.caution}</p>` : ''}
      <div class="action-link-grid">
        ${actionSet.map((item) => `<a class="link-chip ${item.kind === 'primary' ? 'link-chip--primary' : ''}" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('')}
      </div>
    </div>
  `;
}

function renderProInsights(recommendation) {
  const items = [];
  const primary = recommendation?.primary;
  if (!primary) return '';

  items.push(`La base líder es <strong>${primary.label}</strong> porque entra mejor en este momento, no porque sea la más aspiracional.`);
  if (primary.transport?.busAvailable) items.push('Todavía conserva salida decente por guagua, así que no te obliga a un plan único.');
  else items.push('Evita prometerte una guagua limpia donde realmente no la hay.');
  if (recommendation.meta?.isLateArrival) items.push('Con esta hora, la inmediatez pesa más que una zona más bonita pero peor conectada.');
  if (recommendation.meta?.weather?.operationalNote) items.push(recommendation.meta.weather.operationalNote);

  return `
    <div class="strategy-card strategy-card--insights">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Alertas y lectura</span>
          <h3>Qué estás evitando si sigues esta propuesta</h3>
        </div>
      </div>
      <ul class="detail-bullets">${items.map((item) => `<li>${item}</li>`).join('')}</ul>
    </div>
  `;
}

export function renderPro() {
  const payload = buildProStrategies();
  const recommendation = payload?.base || null;
  const selected = getSelectedLodging(recommendation);

  return `
    <section class="screen screen--base">
      <div class="module-intro">
        <span class="module-kicker">Pro</span>
        <h2>Tres planes reales y un respaldo listo</h2>
        <p>Aquí sí hay una diferencia práctica: no solo ves la mejor zona, también sales con plan redondo, plan ahorro, plan confort y plan B activable.</p>
      </div>

      ${recommendation ? renderStrategicRead(recommendation) : ''}
      ${renderStrategyCards(payload)}
      ${renderFallbackPlan(payload)}
      ${recommendation?.shortlist?.length ? `
        <div class="map-card map-card--pro">
          <div class="section-heading">
            <div>
              <span class="module-kicker">Mapa conectado</span>
              <h3>Top zonas sugeridas</h3>
            </div>
            <span class="field-help">Marcadores interactivos</span>
          </div>
          <div id="pro-map" class="map-canvas map-canvas--large" aria-label="Mapa pro con alojamientos sugeridos"></div>
        </div>
      ` : ''}

      ${renderComparisonTable(recommendation, selected)}
      ${renderSelectedPanel(recommendation, selected)}
      ${renderProInsights(recommendation)}
    </section>
  `;
}
