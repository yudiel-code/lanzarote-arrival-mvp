import { appState } from "./state.js";
import { routes } from "./routes.js";
import { renderLlegada } from "./modules/llegada.js";
import { renderRadar } from "./modules/radar.js";
import { renderDecision } from "./modules/decision.js";
import { renderAccion } from "./modules/accion.js";
import { renderPro } from "./modules/pro.js";

const app = document.getElementById("app");

const moduleViews = {
  [routes.llegada]: renderLlegada,
  [routes.radar]: renderRadar,
  [routes.decision]: renderDecision,
  [routes.accion]: renderAccion,
  [routes.pro]: renderPro
};

function renderHome() {
  return `
    <section class="screen screen--base">
      <h1>Base lista</h1>
      <p>Estructura inicial conectada.</p>
    </section>
  `;
}

function renderApp(route = routes.home) {
  if (!app) return;

  const view = route === routes.home
    ? renderHome
    : moduleViews[route] || renderHome;

  app.innerHTML = `
    <main class="app-shell">
      ${view()}
    </main>
  `;
}

appState.currentRoute = appState.currentRoute || routes.home;
renderApp(appState.currentRoute);