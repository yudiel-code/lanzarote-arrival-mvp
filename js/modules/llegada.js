import { appState } from '../state.js';
import { t, getLang } from '../i18n/i18n.js';

function renderFlightLookupResult() {
  const { loading, result, error } = appState.flightLookup;
  const lang = getLang();

  if (loading) {
    return `<div class="flight-lookup-status flight-lookup-status--loading"><p>${t('llegada.flightLookupLoading')}</p></div>`;
  }

  if (error === 'not_found') {
    return `
      <div class="flight-lookup-status flight-lookup-status--error">
        <p>${t('llegada.flightNotFound')}</p>
        <p class="field-help">Sin API externa de horarios, la búsqueda libre intenta detectar vuelos en vivo cerca de Canarias o aterrizajes recientes. No es un sistema oficial de horarios.</p>
      </div>
    `;
  }

  if (!result) return '';

  const statusLabel = result.statusLabel?.[lang] || result.statusLabel?.es || result.status;
  return `
    <div class="flight-lookup-status flight-lookup-status--found">
      <p><strong>${t('llegada.flightFound')}:</strong> ${result.flightNumber} · ${statusLabel}</p>
      ${result.matchedCallsign && result.matchedCallsign !== result.flightNumber ? `<p><strong>Callsign detectado:</strong> ${result.matchedCallsign}</p>` : ''}
      ${result.originLabel ? `<p><strong>${t('llegada.flightOrigin')}</strong> ${result.originLabel}</p>` : ''}
      ${result.actualArrival ? `<p><strong>${t('llegada.flightArrivalReal')}</strong> ${result.actualArrival}</p>` : ''}
      ${result.estimatedArrival ? `<p><strong>${t('llegada.flightEstimatedArrival')}</strong> ${result.estimatedArrival}</p>` : ''}
      ${(typeof result.distanceToAceKm === 'number' || typeof result.speedKmh === 'number') ? `<p><strong>Seguimiento:</strong> ${typeof result.distanceToAceKm === 'number' ? `${result.distanceToAceKm} km de ACE` : ''}${typeof result.distanceToAceKm === 'number' && typeof result.speedKmh === 'number' ? ' · ' : ''}${typeof result.speedKmh === 'number' ? `${result.speedKmh} km/h` : ''}</p>` : ''}
      ${result.delayMinutes ? `<p class="flight-delay-warning"><strong>${t('llegada.flightDelay')}</strong> ${result.delayMinutes} ${t('general.minutes')}</p>` : ''}
      ${result.note ? `<p class="field-help">${result.note}</p>` : ''}
      ${result.sourceLabel ? `<p class="field-help">Fuente usada: ${result.sourceLabel}</p>` : ''}
    </div>
  `;
}

function renderPassengersSelect(id, value) {
  return `
    <select id="${id}">
      <option value="">${t('llegada.selectPassengers')}</option>
      <option value="1" ${value === '1' ? 'selected' : ''}>1 ${t('general.people')}</option>
      <option value="2" ${value === '2' ? 'selected' : ''}>2 ${t('general.people_plural')}</option>
      <option value="3" ${value === '3' ? 'selected' : ''}>3 ${t('general.people_plural')}</option>
      <option value="4" ${value === '4' ? 'selected' : ''}>4 ${t('general.people_plural')}</option>
      <option value="5+" ${value === '5+' ? 'selected' : ''}>5+ ${t('general.people_plural')}</option>
    </select>
  `;
}

function renderFlightForm() {
  return `
    <div class="arrival-form-grid">
      <label class="field">
        <span>${t('llegada.labelAirport')}</span>
        <select id="flight-airport">
          <option value="">${t('llegada.selectAirport')}</option>
          <option value="ace" ${appState.arrivalData.flight.airport === 'ace' ? 'selected' : ''}>ACE · César Manrique Lanzarote</option>
        </select>
      </label>

      <label class="field">
        <span>${t('llegada.labelTime')}</span>
        <input id="flight-time" type="time" value="${appState.arrivalData.flight.time || ''}" />
      </label>

      <label class="field field--full">
        <span>${t('llegada.labelPassengers')}</span>
        ${renderPassengersSelect('flight-passengers', appState.arrivalData.flight.passengers)}
      </label>

      <label class="field field--full">
        <span>${t('llegada.labelFlightNumber')}</span>
        <div class="flight-lookup-row">
          <input id="flight-number" type="text" placeholder="${t('llegada.placeholderFlightNumber')}" value="${appState.arrivalData.flight.flightNumber || ''}" autocomplete="off" />
          <button type="button" data-flight-lookup>${appState.flightLookup.loading ? t('llegada.flightLookupLoading') : t('llegada.flightLookup')}</button>
        </div>
        <span class="field-help">Útil para completar la hora real si el vuelo ya está en el aire o aterrizó.</span>
      </label>
      ${renderFlightLookupResult()}
    </div>
  `;
}

function renderCruiseForm() {
  return `
    <div class="arrival-form-grid">
      <label class="field">
        <span>${t('llegada.labelPort')}</span>
        <select id="cruise-port">
          <option value="">${t('llegada.selectPort')}</option>
          <option value="arrecife" ${appState.arrivalData.cruise.port === 'arrecife' ? 'selected' : ''}>Arrecife</option>
          <option value="playa-blanca" ${appState.arrivalData.cruise.port === 'playa-blanca' ? 'selected' : ''}>Playa Blanca</option>
          <option value="puerto-calero" ${appState.arrivalData.cruise.port === 'puerto-calero' ? 'selected' : ''}>Puerto Calero</option>
        </select>
      </label>

      <label class="field">
        <span>${t('llegada.labelTime')}</span>
        <input id="cruise-time" type="time" value="${appState.arrivalData.cruise.time || ''}" />
      </label>

      <label class="field field--full">
        <span>${t('llegada.labelPassengers')}</span>
        ${renderPassengersSelect('cruise-passengers', appState.arrivalData.cruise.passengers)}
      </label>

      <label class="field field--full">
        <span>${t('llegada.labelDisembark')}</span>
        <select id="cruise-disembark-context">
          <option value="">${t('llegada.selectDisembark')}</option>
          <option value="rapido" ${appState.arrivalData.cruise.disembarkContext === 'rapido' ? 'selected' : ''}>${t('llegada.disembarkFast')}</option>
          <option value="normal" ${appState.arrivalData.cruise.disembarkContext === 'normal' ? 'selected' : ''}>${t('llegada.disembarkNormal')}</option>
          <option value="lento" ${appState.arrivalData.cruise.disembarkContext === 'lento' ? 'selected' : ''}>${t('llegada.disembarkSlow')}</option>
        </select>
      </label>
    </div>
  `;
}

function renderManualForm() {
  return `
    <div class="arrival-form-grid">
      <label class="field field--full">
        <span>${t('llegada.labelLocation')}</span>
        <input id="manual-location" type="text" placeholder="${t('llegada.placeholderLocation')}" value="${appState.arrivalData.manual.location || ''}" />
      </label>

      <label class="field">
        <span>${t('llegada.labelArea')}</span>
        <select id="manual-area">
          <option value="">${t('llegada.selectArea')}</option>
          <option value="arrecife" ${appState.arrivalData.manual.area === 'arrecife' ? 'selected' : ''}>Arrecife</option>
          <option value="playa-honda" ${appState.arrivalData.manual.area === 'playa-honda' ? 'selected' : ''}>Playa Honda</option>
          <option value="puerto-del-carmen" ${appState.arrivalData.manual.area === 'puerto-del-carmen' ? 'selected' : ''}>Puerto del Carmen</option>
          <option value="costa-teguise" ${appState.arrivalData.manual.area === 'costa-teguise' ? 'selected' : ''}>Costa Teguise</option>
          <option value="playa-blanca" ${appState.arrivalData.manual.area === 'playa-blanca' ? 'selected' : ''}>Playa Blanca</option>
          <option value="otra" ${appState.arrivalData.manual.area === 'otra' ? 'selected' : ''}>Otra</option>
        </select>
      </label>

      <label class="field">
        <span>${t('llegada.labelTime')}</span>
        <input id="manual-time" type="time" value="${appState.arrivalData.manual.time || ''}" />
      </label>

      <label class="field field--full">
        <span>${t('llegada.labelPassengers')}</span>
        ${renderPassengersSelect('manual-passengers', appState.arrivalData.manual.passengers)}
      </label>
    </div>
  `;
}

function renderArrivalDetails() {
  if (appState.arrivalType === 'vuelo') return `<div class="arrival-details">${renderFlightForm()}</div>`;
  if (appState.arrivalType === 'crucero') return `<div class="arrival-details">${renderCruiseForm()}</div>`;
  if (appState.arrivalType === 'manual') return `<div class="arrival-details">${renderManualForm()}</div>`;
  return '';
}

function getValidationState() {
  if (!appState.arrivalType) return false;
  if (appState.arrivalType === 'vuelo') {
    return Boolean(appState.arrivalData.flight.airport && appState.arrivalData.flight.time && appState.arrivalData.flight.passengers);
  }
  if (appState.arrivalType === 'crucero') {
    return Boolean(appState.arrivalData.cruise.port && appState.arrivalData.cruise.time && appState.arrivalData.cruise.passengers);
  }
  return Boolean(
    appState.arrivalData.manual.location.trim() &&
    appState.arrivalData.manual.area &&
    appState.arrivalData.manual.time &&
    appState.arrivalData.manual.passengers
  );
}

function renderArrivalHints() {
  return `
    <div class="arrival-helper-grid">
      <article class="helper-card">
        <p class="helper-card__eyebrow">1 · Llega</p>
        <p>Solo necesitamos <strong>tipo</strong>, <strong>hora</strong> y <strong>personas</strong>.</p>
      </article>
      <article class="helper-card">
        <p class="helper-card__eyebrow">2 · Leemos contexto</p>
        <p>Clima y tiempos reales para no decidir a ciegas.</p>
      </article>
      <article class="helper-card">
        <p class="helper-card__eyebrow">3 · Ejecuta</p>
        <p>Te llevamos de la sugerencia a Maps, Booking o la siguiente acción útil.</p>
      </article>
    </div>
  `;
}

export function renderLlegada() {
  const isValid = getValidationState();

  return `
    <section class="screen screen--base screen--arrival">
      <div class="module-intro">
        <span class="module-kicker">Llegada</span>
        <h2>${t('llegada.title')}</h2>
        <p>Cuanto más limpio quede este paso, mejor saldrá Radar → Decisión → Acción.</p>
      </div>

      ${renderArrivalHints()}

      <div class="arrival-options" role="tablist" aria-label="Tipo de llegada">
        <button type="button" data-arrival="vuelo" class="${appState.arrivalType === 'vuelo' ? 'is-active' : ''}" aria-pressed="${appState.arrivalType === 'vuelo'}">✈️ ${t('llegada.btnVuelo')}</button>
        <button type="button" data-arrival="crucero" class="${appState.arrivalType === 'crucero' ? 'is-active' : ''}" aria-pressed="${appState.arrivalType === 'crucero'}">🚢 ${t('llegada.btnCrucero')}</button>
        <button type="button" data-arrival="manual" class="${appState.arrivalType === 'manual' ? 'is-active' : ''}" aria-pressed="${appState.arrivalType === 'manual'}">📍 ${t('llegada.btnManual')}</button>
      </div>

      ${renderArrivalDetails()}

      ${appState.arrivalType ? `
        <div class="arrival-validation ${isValid ? 'is-valid' : 'is-pending'}">
          <p>${isValid ? t('llegada.validOk') : t('llegada.validMissing')}</p>
        </div>
      ` : ''}

      ${appState.arrivalType ? `
        <div class="arrival-actions">
          <button type="button" data-arrival-continue ${isValid ? '' : 'disabled'}>
            ${t('llegada.btnContinue')} · Abrir Radar
          </button>
          <p class="field-help">No reinicia nada. La app guarda este contexto durante la sesión.</p>
        </div>
      ` : ''}
    </section>
  `;
}
