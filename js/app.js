import { appState } from "./state.js";
import { routes } from "./routes.js";
import { renderLlegada } from "./modules/llegada.js";
import { renderRadar } from "./modules/radar.js";
import { renderDecision } from "./modules/decision.js";
import { renderAccion, initAccionMap, destroyAccionMap } from "./modules/accion.js";
import { renderPro } from "./modules/pro.js";

const app = document.getElementById("app");

const moduleViews = {
  [routes.llegada]: renderLlegada,
  [routes.radar]: renderRadar,
  [routes.decision]: renderDecision,
  [routes.accion]: renderAccion,
  [routes.pro]: renderPro
};

const navItems = [
  { key: routes.home, label: "Inicio" },
  { key: routes.llegada, label: "Llegada" },
  { key: routes.radar, label: "Radar" },
  { key: routes.decision, label: "Decisión" },
  { key: routes.accion, label: "Acción" },
  { key: routes.pro, label: "Pro" }
];

function renderHome() {
  return `
    <section class="screen screen--base">
      <h1>Base lista</h1>
      <p>Estructura inicial conectada.</p>
    </section>
  `;
}

function getCurrentView() {
  if (appState.currentRoute === routes.home) {
    return renderHome();
  }

  const renderModule = moduleViews[appState.currentRoute];
  return renderModule ? renderModule() : renderHome();
}

function renderNav() {
  return `
    <nav class="screen screen--base">
      ${navItems
        .map(
          (item) => `
            <button
              type="button"
              data-route="${item.key}"
              class="${appState.currentRoute === item.key ? "is-active" : ""}"
              ${appState.currentRoute === item.key ? 'aria-current="page"' : ""}
            >
              ${item.label}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function isArrivalValid() {
  if (appState.arrivalType === "vuelo") {
    return Boolean(
      appState.arrivalData.flight.airport &&
      appState.arrivalData.flight.time &&
      appState.arrivalData.flight.passengers
    );
  }

  if (appState.arrivalType === "crucero") {
    return Boolean(
      appState.arrivalData.cruise.port &&
      appState.arrivalData.cruise.time &&
      appState.arrivalData.cruise.passengers
    );
  }

  if (appState.arrivalType === "manual") {
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
  if (route === routes.home || route === routes.llegada) {
    return true;
  }

  return isArrivalValid();
}

function syncArrivalUi() {
  if (appState.currentRoute !== routes.llegada) {
    return;
  }

  const validationText = document.querySelector(".arrival-validation p");
  const continueButton = document.querySelector("[data-arrival-continue]");
  const isValid = isArrivalValid();

  if (validationText) {
    validationText.textContent = isValid
      ? "Datos mínimos completos."
      : "Faltan datos mínimos por completar.";
  }

  if (continueButton) {
    continueButton.disabled = !isValid;
  }
}

function runViewEffects() {
  if (appState.currentRoute === routes.llegada) {
    requestAnimationFrame(() => {
      syncArrivalUi();
    });
  }

  if (appState.currentRoute === routes.accion) {
    requestAnimationFrame(() => {
      initAccionMap();
    });
  }
}

function renderApp() {
  if (!app) return;

  destroyAccionMap();

  app.innerHTML = `
    <main class="app-shell">
      ${renderNav()}
      ${getCurrentView()}
    </main>
  `;

  runViewEffects();
}

function isArrivalValid() {
  if (appState.arrivalType === "vuelo") {
    return Boolean(
      appState.arrivalData.flight.airport &&
      appState.arrivalData.flight.time &&
      appState.arrivalData.flight.passengers
    );
  }

  if (appState.arrivalType === "crucero") {
    return Boolean(
      appState.arrivalData.cruise.port &&
      appState.arrivalData.cruise.time &&
      appState.arrivalData.cruise.passengers
    );
  }

  if (appState.arrivalType === "manual") {
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
  if (route === routes.home || route === routes.llegada) {
    return true;
  }

  return isArrivalValid();
}

function syncArrivalUi() {
  if (appState.currentRoute !== routes.llegada) {
    return;
  }

  const validationText = document.querySelector(".arrival-validation p");
  const continueButton = document.querySelector("[data-arrival-continue]");
  const isValid = isArrivalValid();

  if (validationText) {
    validationText.textContent = isValid
      ? "Datos mínimos completos."
      : "Faltan datos mínimos por completar.";
  }

  if (continueButton) {
    continueButton.disabled = !isValid;
  }
}

function isArrivalValid() {
  if (appState.arrivalType === "vuelo") {
    return Boolean(
      appState.arrivalData.flight.airport &&
      appState.arrivalData.flight.time &&
      appState.arrivalData.flight.passengers
    );
  }

  if (appState.arrivalType === "crucero") {
    return Boolean(
      appState.arrivalData.cruise.port &&
      appState.arrivalData.cruise.time &&
      appState.arrivalData.cruise.passengers
    );
  }

  if (appState.arrivalType === "manual") {
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
  if (route === routes.home || route === routes.llegada) {
    return true;
  }

  return isArrivalValid();
}

function syncArrivalUi() {
  if (appState.currentRoute !== routes.llegada) {
    return;
  }

  const validationText = document.querySelector(".arrival-validation p");
  const continueButton = document.querySelector("[data-arrival-continue]");
  const isValid = isArrivalValid();

  if (validationText) {
    validationText.textContent = isValid
      ? "Datos mínimos completos."
      : "Faltan datos mínimos por completar.";
  }

  if (continueButton) {
    continueButton.disabled = !isValid;
  }
}

document.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    const nextRoute = routeButton.dataset.route;

    if (!canAccessRoute(nextRoute)) {
      appState.currentRoute = routes.llegada;
      renderApp();
      return;
    }

    appState.currentRoute = nextRoute;
    renderApp();
    return;
  }

  const arrivalButton = event.target.closest("[data-arrival]");
  if (arrivalButton) {
    appState.arrivalType = arrivalButton.dataset.arrival;
    renderApp();
    return;
  }

  const continueButton = event.target.closest("[data-arrival-continue]");
  if (continueButton) {
    if (!isArrivalValid()) {
      return;
    }

    appState.currentRoute = routes.radar;
    renderApp();
    return;
  }

  const radarContinueButton = event.target.closest("[data-radar-continue]");
  if (radarContinueButton) {
    appState.currentRoute = routes.decision;
    renderApp();
    return;
  }

  const decisionContinueButton = event.target.closest("#decision-continue-btn");
  if (decisionContinueButton) {
    appState.actionExecution.active = false;
    appState.actionExecution.mode = null;
    appState.currentRoute = routes.accion;
    renderApp();
    return;
  }

  const actionPrimaryCtaButton = event.target.closest("#action-primary-cta-btn");
  if (actionPrimaryCtaButton) {
    appState.actionExecution.active = true;
    appState.actionExecution.mode = actionPrimaryCtaButton.dataset.actionMode || null;
    renderApp();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "flight-time") {
    appState.arrivalData.flight.time = event.target.value;
  }

  if (event.target.id === "cruise-time") {
    appState.arrivalData.cruise.time = event.target.value;
  }

  if (event.target.id === "manual-location") {
    appState.arrivalData.manual.location = event.target.value;
  }

  if (event.target.id === "manual-time") {
    appState.arrivalData.manual.time = event.target.value;
  }

  syncArrivalUi();
});

document.addEventListener("change", (event) => {
  if (event.target.id === "flight-airport") {
    appState.arrivalData.flight.airport = event.target.value;
  }

  if (event.target.id === "flight-passengers") {
    appState.arrivalData.flight.passengers = event.target.value;
  }

  if (event.target.id === "cruise-port") {
    appState.arrivalData.cruise.port = event.target.value;
  }

  if (event.target.id === "cruise-passengers") {
    appState.arrivalData.cruise.passengers = event.target.value;
  }

  if (event.target.id === "cruise-disembark-context") {
    appState.arrivalData.cruise.disembarkContext = event.target.value;
  }

  if (event.target.id === "manual-area") {
    appState.arrivalData.manual.area = event.target.value;
  }

  if (event.target.id === "manual-passengers") {
    appState.arrivalData.manual.passengers = event.target.value;
  }

  syncArrivalUi();
});

renderApp();