import { appState } from '../state.js';
import { formatAirport, formatCruisePort, formatManualArea, formatDisembarkContext, formatWindDirection } from '../utils/formatters.js';

function renderArrivalSummary() {
  if (appState.arrivalType === 'vuelo') {
    return `
      <div class="summary-card">
        <p class="summary-card__title">Llegada detectada</p>
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
        <p class="summary-card__title">Llegada detectada</p>
        <ul>
          <li><strong>Entrada:</strong> ${formatCruisePort(appState.arrivalData.cruise.port)}</li>
          <li><strong>Hora:</strong> ${appState.arrivalData.cruise.time || '—'}</li>
          <li><strong>Personas:</strong> ${appState.arrivalData.cruise.passengers || '—'}</li>
          <li><strong>Desembarque:</strong> ${formatDisembarkContext(appState.arrivalData.cruise.disembarkContext)}</li>
        </ul>
      </div>
    `;
  }

  if (appState.arrivalType === 'manual') {
    return `
      <div class="summary-card">
        <p class="summary-card__title">Llegada detectada</p>
        <ul>
          <li><strong>Punto:</strong> ${appState.arrivalData.manual.location || '—'}</li>
          <li><strong>Zona:</strong> ${formatManualArea(appState.arrivalData.manual.area)}</li>
          <li><strong>Hora:</strong> ${appState.arrivalData.manual.time || '—'}</li>
          <li><strong>Personas:</strong> ${appState.arrivalData.manual.passengers || '—'}</li>
        </ul>
      </div>
    `;
  }

  return '';
}

function renderWeatherBlock() {
  const ctx = appState.operationalContext;

  if (appState.operationalContextLoading) {
    return `
      <div class="status-card status-card--loading">
        <p><strong>Consultando contexto real…</strong></p>
        <p>Clima y tiempos de traslado en Lanzarote.</p>
      </div>
    `;
  }

  if (!ctx?.weather) {
    return `
      <div class="status-card status-card--warning">
        <p><strong>Clima no disponible ahora mismo</strong></p>
        <p>${appState.operationalContextError || 'Seguimos con el resto del flujo usando fallback razonable.'}</p>
      </div>
    `;
  }

  const weather = ctx.weather;
  return `
    <div class="weather-card weather-card--${weather.severity}">
      <div>
        <p class="weather-card__eyebrow">Ahora en Lanzarote</p>
        <h3>${weather.label}</h3>
      </div>
      <div class="weather-grid">
        <div><span>${weather.tempC}°C</span><small>sensación ${weather.feelsLikeC}°C</small></div>
        <div><span>${weather.windKmh} km/h</span><small>viento ${formatWindDirection(weather.windDirectionDeg)}</small></div>
        <div><span>${weather.humidityPct}%</span><small>humedad</small></div>
        <div><span>${weather.precipMm || 0} mm</span><small>precipitación</small></div>
      </div>
      ${weather.operationalNote ? `<p class="weather-card__note">${weather.operationalNote}</p>` : ''}
    </div>
  `;
}

function getOperationalReading() {
  const weather = appState.operationalContext?.weather;

  if (weather?.severity === 'storm' || weather?.windKmh > 60) {
    return {
      level: 'high',
      title: 'Llegada sensible',
      detail: weather.operationalNote || 'Hoy conviene reducir pasos y no improvisar demasiado.'
    };
  }

  if (weather?.severity === 'rain' || weather?.windKmh > 35) {
    return {
      level: 'medium',
      title: 'Llegada con algo de fricción',
      detail: weather.operationalNote || 'No es dramático, pero sí castiga esperar o dar vueltas innecesarias.'
    };
  }

  const passengers = appState.arrivalType === 'vuelo'
    ? appState.arrivalData.flight.passengers
    : appState.arrivalType === 'crucero'
      ? appState.arrivalData.cruise.passengers
      : appState.arrivalData.manual.passengers;

  if (passengers === '5+' || Number(passengers || 0) >= 5) {
    return {
      level: 'medium',
      title: 'Grupo que pide claridad',
      detail: 'Con varias personas conviene elegir rápido y evitar cambios de criterio sobre la marcha.'
    };
  }

  return {
    level: 'low',
    title: 'Ventana favorable',
    detail: 'El contexto deja margen para decidir con calma relativa, pero sin dormirte.'
  };
}

function renderOperationalSignals() {
  const signals = [];
  const weather = appState.operationalContext?.weather;
  const routes = appState.operationalContext?.routes;

  if (weather?.windKmh > 35) signals.push('Viento que ya influye en la comodidad de la salida.');
  if (weather?.precipMm > 0) signals.push('Lluvia activa: las esperas valen menos.');

  if (routes) {
    const quick = Object.values(routes).filter((route) => route?.durationMin && route.durationMin <= 18).length;
    const long = Object.values(routes).filter((route) => route?.durationMin && route.durationMin >= 30).length;
    if (quick > 0) signals.push(`Hay ${quick} zonas con entrada rápida desde tu punto de llegada.`);
    if (long > 0) signals.push(`Hay ${long} zonas que ya nacen penalizadas por trayecto largo.`);
  }

  if (appState.arrivalType === 'crucero') signals.push('En crucero suele ganar valor una base que no obligue a rebotar demasiado por la isla al entrar.');
  if (appState.arrivalType === 'manual') signals.push('Como ya estás en la isla, la ventaja está en no reiniciar la decisión desde cero.');
  if (!signals.length) signals.push('Contexto limpio: toca decidir sin adornos, pero con criterio.');

  return `
    <div class="signals-card">
      <p class="signals-card__title">Lo importante ahora</p>
      <ul>${signals.slice(0, 4).map((item) => `<li>${item}</li>`).join('')}</ul>
    </div>
  `;
}

function renderRouteSnapshot() {
  const routes = appState.operationalContext?.routes;
  if (!routes || appState.operationalContextLoading) return '';

  const sorted = Object.entries(routes)
    .filter(([, route]) => route?.durationMin)
    .sort((a, b) => a[1].durationMin - b[1].durationMin)
    .slice(0, 3);

  if (!sorted.length) return '';

  return `
    <div class="route-snapshot">
      <p class="route-snapshot__title">Primer vistazo de zonas</p>
      <div class="route-snapshot__grid">
        ${sorted.map(([zone, route]) => `
          <article class="mini-zone-card">
            <p class="mini-zone-card__title">${route.destLabel || zone}</p>
            <p><strong>${route.durationLabel}</strong> en coche · ${route.distanceKm} km</p>
            <p>Taxi orientativo ${route.taxi.minEur}–${route.taxi.maxEur} €</p>
            <p>${route.busAvailable ? 'Guagua viable como plan B.' : 'Guagua poco limpia para esta zona.'}</p>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderRadar() {
  const reading = getOperationalReading();
  const loading = appState.operationalContextLoading;

  return `
    <section class="screen screen--base">
      <div class="module-intro">
        <span class="module-kicker">Radar</span>
        <h2>Qué pinta tiene esta llegada</h2>
        <p>Antes de recomendar, limpiamos el contexto real.</p>
      </div>

      ${renderArrivalSummary()}
      ${renderWeatherBlock()}
      ${!loading ? `<div class="status-card status-card--${reading.level}"><p><strong>${reading.title}</strong></p><p>${reading.detail}</p></div>` : ''}
      ${!loading ? renderRouteSnapshot() : ''}
      ${!loading ? renderOperationalSignals() : ''}

      ${!loading ? `
        <div class="module-actions">
          <button type="button" data-radar-continue>Pasar a Decisión</button>
        </div>
      ` : ''}
    </section>
  `;
}
