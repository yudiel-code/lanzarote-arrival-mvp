import { appState } from '../state.js';
import { buildRecommendation } from '../services/decision-engine.js';
import { formatAirport, formatCruisePort, formatManualArea, formatDisembarkContext, formatConfidence } from '../utils/formatters.js';

function getRecommendation() {
  if (!appState.operationalContext) return null;
  return buildRecommendation(appState.operationalContext, appState.arrivalType, appState.arrivalData);
}

function renderArrivalContext() {
  if (appState.arrivalType === 'vuelo') {
    return `
      <div class="summary-card">
        <p class="summary-card__title">Tu llegada</p>
        <ul>
          <li><strong>Entrada:</strong> ${formatAirport(appState.arrivalData.flight.airport)}</li>
          <li><strong>Hora:</strong> ${appState.arrivalData.flight.time || '—'}</li>
          <li><strong>Personas:</strong> ${appState.arrivalData.flight.passengers || '—'}</li>
        </ul>
      </div>
    `;
  }

  if (appState.arrivalType === 'crucero') {
    return `
      <div class="summary-card">
        <p class="summary-card__title">Tu llegada</p>
        <ul>
          <li><strong>Entrada:</strong> ${formatCruisePort(appState.arrivalData.cruise.port)}</li>
          <li><strong>Hora:</strong> ${appState.arrivalData.cruise.time || '—'}</li>
          <li><strong>Personas:</strong> ${appState.arrivalData.cruise.passengers || '—'}</li>
          <li><strong>Desembarque:</strong> ${formatDisembarkContext(appState.arrivalData.cruise.disembarkContext)}</li>
        </ul>
      </div>
    `;
  }

  return `
    <div class="summary-card">
      <p class="summary-card__title">Tu llegada</p>
      <ul>
        <li><strong>Punto:</strong> ${appState.arrivalData.manual.location || '—'}</li>
        <li><strong>Zona:</strong> ${formatManualArea(appState.arrivalData.manual.area)}</li>
        <li><strong>Hora:</strong> ${appState.arrivalData.manual.time || '—'}</li>
        <li><strong>Personas:</strong> ${appState.arrivalData.manual.passengers || '—'}</li>
      </ul>
    </div>
  `;
}

function renderTransferRecommendation(recommendation) {
  const transfer = recommendation?.transferRecommendation;
  if (!transfer) return '';

  return `
    <div class="recommendation-card recommendation-card--${transfer.mode}">
      <div>
        <p class="recommendation-card__eyebrow">Decisión de movilidad</p>
        <h3>${transfer.headline}</h3>
      </div>
      <p>${transfer.summary}</p>
      <div class="comparison-grid comparison-grid--transport">
        <article class="compare-card ${transfer.mode === 'taxi' ? 'is-winner' : ''}">
          <p class="compare-card__title">Taxi · ${transfer.taxi.score}/100</p>
          <ul>${transfer.taxi.reasons.map((item) => `<li>${item}</li>`).join('')}</ul>
        </article>
        <article class="compare-card ${transfer.mode === 'bus' ? 'is-winner' : ''}">
          <p class="compare-card__title">Guagua · ${transfer.bus.score}/100</p>
          <ul>${transfer.bus.reasons.length ? transfer.bus.reasons.map((item) => `<li>${item}</li>`).join('') : '<li>No gana peso suficiente en este caso.</li>'}</ul>
        </article>
      </div>
      <p class="field-help">Confianza ${formatConfidence(transfer.confidence)} · diferencia ${transfer.scoreDelta} puntos.</p>
    </div>
  `;
}

function renderLodgingRecommendation(recommendation) {
  if (!recommendation?.primary) return '';
  const primary = recommendation.primary;

  return `
    <div class="decision-primary-stay">
      <div class="section-heading">
        <div>
          <span class="module-kicker">Base sugerida</span>
          <h3>${primary.label}</h3>
        </div>
        <span class="score-badge">${primary.scoreLabel}</span>
      </div>
      <p>${primary.areaSummary}</p>
      <div class="stay-facts-grid">
        <div><strong>Tipo</strong><span>${primary.type}</span></div>
        <div><strong>Precio</strong><span>desde ${primary.priceText}/noche</span></div>
        <div><strong>Entrada</strong><span>${primary.transport ? primary.transport.durationLabel : '—'} en coche</span></div>
        <div><strong>Taxi</strong><span>${primary.transport ? `${primary.transport.taxiMin}–${primary.transport.taxiMax} €` : '—'}</span></div>
      </div>
      <p><strong>Por qué sí:</strong> ${primary.reasonLine}</p>
      ${primary.caution ? `<p><strong>Ojo:</strong> ${primary.caution}</p>` : ''}
      ${primary.bestFor?.length ? `<p><strong>Encaja sobre todo para:</strong> ${primary.bestFor.join(' · ')}</p>` : ''}
    </div>
  `;
}

function renderAlternatives(recommendation) {
  if (!recommendation?.alternatives?.length) return '';

  return `
    <div class="comparison-grid">
      ${recommendation.alternatives.map((alt) => `
        <article class="compare-card compare-card--stay">
          <p class="compare-card__title">${alt.label}</p>
          <p>${alt.priceText}/noche · ${alt.type}</p>
          <p>${alt.reasonLine}</p>
          ${alt.transport ? `<p class="field-help">${alt.transport.durationLabel} en coche · Taxi ${alt.transport.taxiMin}–${alt.transport.taxiMax} €</p>` : ''}
        </article>
      `).join('')}
    </div>
  `;
}

function renderDecisionNarrative(recommendation) {
  const primary = recommendation?.primary;
  if (!primary) return '';

  return `
    <div class="narrative-card">
      <p class="narrative-card__eyebrow">Síntesis</p>
      <p>
        No gana porque sea la zona más bonita, sino porque ahora mismo combina mejor
        <strong>entrada</strong>, <strong>fricción</strong> y <strong>capacidad de ejecutar ya</strong>.
        ${primary.transport?.busAvailable ? 'Todavía deja una salida razonable en guagua si la quieres intentar.' : 'Además, evita venderte una guagua que en esta zona nacería torcida.'}
      </p>
    </div>
  `;
}

export function renderDecision() {
  const recommendation = getRecommendation();

  return `
    <section class="screen screen--base">
      <div class="module-intro">
        <span class="module-kicker">Decisión</span>
        <h2>Qué conviene hacer y dónde compensa base</h2>
        <p>No solo una recomendación bonita: una decisión conectada con el contexto.</p>
      </div>

      ${renderArrivalContext()}
      ${recommendation ? renderTransferRecommendation(recommendation) : ''}
      ${recommendation ? renderLodgingRecommendation(recommendation) : ''}
      ${recommendation ? renderDecisionNarrative(recommendation) : ''}
      ${recommendation ? renderAlternatives(recommendation) : ''}

      <div class="module-actions">
        <button id="decision-continue-btn" type="button">Pasar a Acción</button>
      </div>
    </section>
  `;
}
