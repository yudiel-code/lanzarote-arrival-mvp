import { appState } from './state.js';
import { routes } from './routes.js';
import { renderLlegada } from './modules/llegada.js';
import { renderRadar } from './modules/radar.js';
import { renderDecision } from './modules/decision.js';
import { renderAccion, initAccionMap, destroyAccionMap } from './modules/accion.js';
import { renderPro, initProMap, destroyProMap } from './modules/pro.js';
import { fetchOperationalContext } from './services/decision-engine.js';
import { lookupFlight } from './services/flight-lookup-service.js';
import { t, setLang, getLang, getSupportedLangs } from './i18n/i18n.js';
import { saveState, restoreState, clearState } from './utils/persistence.js';
import { restoreFromUrl, buildShareUrl, copyShareUrl } from './utils/share.js';

const app = document.getElementById('app');
const routeSteps = [routes.llegada, routes.radar, routes.decision, routes.accion, routes.pro];
let installPromptEvent = null;

const urlResult = restoreFromUrl(appState);
if (urlResult.lang) setLang(urlResult.lang);
if (!urlResult.restored) restoreState(appState);

const moduleViews = {
  [routes.llegada]: renderLlegada,
  [routes.radar]: renderRadar,
  [routes.decision]: renderDecision,
  [routes.accion]: renderAccion,
  [routes.pro]: renderPro
};

function renderHeader() {
  return `
    <header class="app-topbar">
      <div>
        <p class="app-topbar__eyebrow">Lanzarote Arrival Guide</p>
        <h1>Decide tu entrada en la isla sin perder tiempo</h1>
        <p class="app-topbar__subtitle">Clima, traslado, base sugerida y salida real a herramientas útiles.</p>
      </div>
      <div class="app-topbar__actions">
        <button type="button" class="button button--ghost" data-reset-plan>Nueva llegada</button>
      </div>
    </header>
  `;
}

function renderProgress() {
  const currentIndex = routeSteps.indexOf(appState.currentRoute);
  if (currentIndex === -1) return '';

  return `
    <section class="progress-strip" aria-label="Progreso del flujo">
      ${routeSteps.map((route, index) => `
        <button
          type="button"
          class="progress-pill ${appState.currentRoute === route ? 'is-active' : ''} ${index < currentIndex ? 'is-done' : ''}"
          data-route="${route}"
          ${!canAccessRoute(route) ? 'disabled' : ''}
        >
          <span>${index + 1}</span>
          <strong>${route === routes.llegada ? 'Llegada' : route === routes.radar ? 'Radar' : route === routes.decision ? 'Decisión' : route === routes.accion ? 'Acción' : 'Pro'}</strong>
        </button>
      `).join('')}
    </section>
  `;
}

function renderNav() {
  const langs = getSupportedLangs();
  const currentLang = getLang();

  return `
    <nav class="app-nav" aria-label="Secciones de la app">
      <div class="app-nav__routes">
        ${Object.entries({ home: routes.home, llegada: routes.llegada, radar: routes.radar, decision: routes.decision, accion: routes.accion, pro: routes.pro })
          .map(([key, route]) => `
            <button type="button" data-route="${route}" class="${appState.currentRoute === route ? 'is-active' : ''}" ${appState.currentRoute === route ? 'aria-current="page"' : ''}>
              ${t(`nav.${key}`)}
            </button>
          `).join('')}
      </div>
      <div class="lang-switcher">
        ${langs.map((lang) => `
          <button type="button" data-lang="${lang}" class="lang-btn ${currentLang === lang ? 'is-active' : ''}">${lang.toUpperCase()}</button>
        `).join('')}
      </div>
    </nav>
  `;
}

function renderHome() {
  return `
    <section class="screen screen--base screen--home">
      <div class="hero-card">
        <span class="module-kicker">Producto</span>
        <h2>Llegas. Leemos contexto. Te llevamos a actuar.</h2>
        <p>Esta web no intenta reemplazar Booking, Google Maps ni el transporte real. Los usa a tu favor para que tomes una decisión rápida y útil.</p>
        <div class="hero-card__actions">
          <button type="button" class="button" data-route="${routes.llegada}">Empezar ahora</button>
          ${appState.ui.installPromptAvailable && !appState.ui.dismissedInstall ? '<button type="button" class="button button--ghost" id="install-btn">Instalar app</button>' : ''}
        </div>
      </div>

      <div class="home-grid">
        <article class="feature-card">
          <p class="feature-card__eyebrow">1 · Llegada</p>
          <h3>Tipo, hora y personas</h3>
          <p>El mínimo justo para no obligarte a rellenar humo.</p>
        </article>
        <article class="feature-card">
          <p class="feature-card__eyebrow">2 · Radar</p>
          <h3>Clima y traslado</h3>
          <p>Contexto real antes de recomendar una salida o una base.</p>
        </article>
        <article class="feature-card">
          <p class="feature-card__eyebrow">3 · Acción</p>
          <h3>Mapa + salida útil</h3>
          <p>Maps, Booking y enlaces accionables. No tarjetas muertas.</p>
        </article>
      </div>
    </section>
  `;
}

function renderShellStatus() {
  const messages = [];
  if (appState.ui.offline) messages.push('Sin conexión: verás lo último guardado y menos contexto en vivo.');
  if (appState.operationalContextError && appState.currentRoute !== routes.llegada) messages.push('Algún dato en vivo falló. El flujo sigue con fallback honesto.');
  if (!messages.length) return '';

  return `
    <section class="shell-status">
      ${messages.map((message) => `<p>${message}</p>`).join('')}
    </section>
  `;
}

function getCurrentView() {
  if (appState.currentRoute === routes.home) return renderHome();
  const renderModule = moduleViews[appState.currentRoute];
  return renderModule ? renderModule() : renderHome();
}

function renderApp() {
  if (!app) return;
  destroyAccionMap();
  destroyProMap();
  app.innerHTML = `
    <main class="app-shell">
      ${renderHeader()}
      ${renderNav()}
      ${appState.currentRoute !== routes.home ? renderProgress() : ''}
      ${renderShellStatus()}
      ${getCurrentView()}
    </main>
  `;
  runViewEffects();
  saveState(appState);
}

function routeNeedsContext(route) {
  return [routes.radar, routes.decision, routes.accion, routes.pro].includes(route);
}

function runViewEffects() {
  if (routeNeedsContext(appState.currentRoute) && isArrivalValid() && !appState.operationalContext && !appState.operationalContextLoading) {
    loadOperationalContext();
    return;
  }

  if (appState.currentRoute === routes.accion) requestAnimationFrame(initAccionMap);
  if (appState.currentRoute === routes.pro) requestAnimationFrame(initProMap);
}

function isArrivalValid() {
  if (appState.arrivalType === 'vuelo') {
    return Boolean(appState.arrivalData.flight.airport && appState.arrivalData.flight.time && appState.arrivalData.flight.passengers);
  }
  if (appState.arrivalType === 'crucero') {
    return Boolean(appState.arrivalData.cruise.port && appState.arrivalData.cruise.time && appState.arrivalData.cruise.passengers);
  }
  if (appState.arrivalType === 'manual') {
    return Boolean(
      appState.arrivalData.manual.location.trim() &&
      appState.arrivalData.manual.area &&
      appState.arrivalData.manual.time &&
      appState.arrivalData.manual.passengers
    );
  }
  return false;
}

function canAccessRoute(route) {
  if (route === routes.home || route === routes.llegada) return true;
  return isArrivalValid();
}

if (!canAccessRoute(appState.currentRoute)) {
  appState.currentRoute = routes.llegada;
}

function invalidateOperationalContext() {
  appState.operationalContext = null;
  appState.operationalContextError = null;
  appState.recommendation = null;
  appState.selectedLodgingId = null;
  appState.actionExecution.active = false;
  appState.actionExecution.mode = null;
}

async function loadOperationalContext() {
  if (appState.operationalContextLoading || !isArrivalValid()) return;
  appState.operationalContextLoading = true;
  appState.operationalContextError = null;
  renderApp();

  try {
    appState.operationalContext = await fetchOperationalContext(appState.arrivalType, appState.arrivalData);
  } catch (error) {
    appState.operationalContextError = error?.message || 'No se pudo cargar el contexto operativo.';
  } finally {
    appState.operationalContextLoading = false;
    renderApp();
  }
}

async function handleFlightLookup() {
  const flightNumber = appState.arrivalData.flight.flightNumber;
  if (!flightNumber?.trim()) return;

  appState.flightLookup = { loading: true, result: null, error: null };
  renderApp();

  try {
    const result = await lookupFlight(flightNumber);
    if (result) {
      appState.flightLookup = { loading: false, result, error: null };
      if (result.actualArrival) appState.arrivalData.flight.time = result.actualArrival;
    } else {
      appState.flightLookup = { loading: false, result: null, error: 'not_found' };
    }
  } catch {
    appState.flightLookup = { loading: false, result: null, error: 'not_found' };
  }

  renderApp();
}

async function handleShare() {
  const url = buildShareUrl(appState, getLang());
  const success = await copyShareUrl(url);
  const btn = document.getElementById('share-btn');
  if (!btn) return;

  const original = 'Compartir este plan';
  btn.textContent = success ? 'Enlace listo' : url;
  setTimeout(() => {
    if (btn) btn.textContent = original;
  }, 2400);
}

async function handleInstall() {
  if (!installPromptEvent) return;
  try {
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
  } catch {
    // ignore
  } finally {
    installPromptEvent = null;
    appState.ui.installPromptAvailable = false;
    appState.ui.dismissedInstall = true;
    renderApp();
  }
}

function resetPlan() {
  clearState();
  appState.currentRoute = routes.llegada;
  appState.arrivalType = null;
  appState.arrivalData = {
    flight: { airport: '', time: '', passengers: '', flightNumber: '' },
    cruise: { port: '', time: '', passengers: '', disembarkContext: '' },
    manual: { location: '', area: '', time: '', passengers: '' }
  };
  appState.operationalContext = null;
  appState.operationalContextLoading = false;
  appState.operationalContextError = null;
  appState.flightLookup = { loading: false, result: null, error: null };
  appState.recommendation = null;
  appState.selectedLodgingId = null;
  appState.selectedLodgingSource = 'action';
  appState.actionExecution = { active: false, mode: null };
  appState.proFilters = { zone: 'all', type: 'all', maxPrice: '', sort: 'recommended' };
}

function handleRouteChange(nextRoute) {
  if (!canAccessRoute(nextRoute)) {
    appState.currentRoute = routes.llegada;
    renderApp();
    return;
  }

  appState.currentRoute = nextRoute;
  renderApp();
}

function updateField(target) {
  const { id, value } = target;
  let touchedArrivalField = false;

  if (id === 'flight-time') { appState.arrivalData.flight.time = value; touchedArrivalField = true; }
  if (id === 'flight-number') appState.arrivalData.flight.flightNumber = value.toUpperCase();
  if (id === 'flight-airport') { appState.arrivalData.flight.airport = value; touchedArrivalField = true; }
  if (id === 'flight-passengers') { appState.arrivalData.flight.passengers = value; touchedArrivalField = true; }

  if (id === 'cruise-port') { appState.arrivalData.cruise.port = value; touchedArrivalField = true; }
  if (id === 'cruise-time') { appState.arrivalData.cruise.time = value; touchedArrivalField = true; }
  if (id === 'cruise-passengers') { appState.arrivalData.cruise.passengers = value; touchedArrivalField = true; }
  if (id === 'cruise-disembark-context') { appState.arrivalData.cruise.disembarkContext = value; touchedArrivalField = true; }

  if (id === 'manual-location') { appState.arrivalData.manual.location = value; touchedArrivalField = true; }
  if (id === 'manual-area') { appState.arrivalData.manual.area = value; touchedArrivalField = true; }
  if (id === 'manual-time') { appState.arrivalData.manual.time = value; touchedArrivalField = true; }
  if (id === 'manual-passengers') { appState.arrivalData.manual.passengers = value; touchedArrivalField = true; }

  if (id === 'pro-filter-zone') appState.proFilters.zone = value || 'all';
  if (id === 'pro-filter-type') appState.proFilters.type = value || 'all';
  if (id === 'pro-filter-max-price') appState.proFilters.maxPrice = value;
  if (id === 'pro-filter-sort') appState.proFilters.sort = value || 'recommended';

  if (touchedArrivalField) invalidateOperationalContext();
  renderApp();
}

document.addEventListener('click', async (event) => {
  const langBtn = event.target.closest('[data-lang]');
  if (langBtn) {
    setLang(langBtn.dataset.lang);
    renderApp();
    return;
  }

  const resetPlanButton = event.target.closest('[data-reset-plan]');
  if (resetPlanButton) {
    resetPlan();
    renderApp();
    return;
  }

  const routeButton = event.target.closest('[data-route]');
  if (routeButton) {
    handleRouteChange(routeButton.dataset.route);
    return;
  }

  const installBtn = event.target.closest('#install-btn');
  if (installBtn) {
    await handleInstall();
    return;
  }

  const arrivalButton = event.target.closest('[data-arrival]');
  if (arrivalButton) {
    if (appState.arrivalType !== arrivalButton.dataset.arrival) {
      appState.arrivalType = arrivalButton.dataset.arrival;
      invalidateOperationalContext();
      appState.flightLookup = { loading: false, result: null, error: null };
    }
    renderApp();
    return;
  }

  const continueButton = event.target.closest('[data-arrival-continue]');
  if (continueButton) {
    if (!isArrivalValid()) return;
    appState.currentRoute = routes.radar;
    invalidateOperationalContext();
    loadOperationalContext();
    return;
  }

  const radarContinueButton = event.target.closest('[data-radar-continue]');
  if (radarContinueButton) {
    appState.currentRoute = routes.decision;
    renderApp();
    return;
  }

  const decisionContinueButton = event.target.closest('#decision-continue-btn');
  if (decisionContinueButton) {
    appState.currentRoute = routes.accion;
    renderApp();
    return;
  }

  const actionPrimaryButton = event.target.closest('#action-primary-cta-btn');
  if (actionPrimaryButton) {
    appState.actionExecution.active = true;
    appState.actionExecution.mode = actionPrimaryButton.dataset.actionMode || null;
    renderApp();
    return;
  }

  const flightLookupBtn = event.target.closest('[data-flight-lookup]');
  if (flightLookupBtn) {
    await handleFlightLookup();
    return;
  }

  const shareBtn = event.target.closest('#share-btn');
  if (shareBtn) {
    await handleShare();
    return;
  }

  const proZoneBtn = event.target.closest('[data-pro-zone]');
  if (proZoneBtn) {
    appState.proFilters.zone = proZoneBtn.dataset.proZone || 'all';
    renderApp();
    return;
  }

  const lodgingBtn = event.target.closest('[data-select-lodging]');
  if (lodgingBtn) {
    appState.selectedLodgingId = lodgingBtn.dataset.selectLodging;
    renderApp();
    return;
  }

  const proPlanBtn = event.target.closest('[data-activate-pro-plan]');
  if (proPlanBtn) {
    appState.selectedLodgingId = proPlanBtn.dataset.planLodging || null;
    appState.actionExecution.active = true;
    appState.actionExecution.mode = proPlanBtn.dataset.planMode || 'taxi';
    appState.currentRoute = routes.accion;
    renderApp();
    return;
  }
});

document.addEventListener('input', (event) => {
  if (!event.target?.id) return;
  updateField(event.target);
});

document.addEventListener('change', (event) => {
  if (!event.target?.id) return;
  updateField(event.target);
});

window.addEventListener('online', () => {
  appState.ui.offline = false;
  renderApp();
});
window.addEventListener('offline', () => {
  appState.ui.offline = true;
  renderApp();
});
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPromptEvent = event;
  appState.ui.installPromptAvailable = true;
  renderApp();
});
window.addEventListener('lz:select-lodging', (event) => {
  appState.selectedLodgingId = event.detail?.id || null;
  appState.selectedLodgingSource = event.detail?.source || 'action';
  renderApp();
});

renderApp();
