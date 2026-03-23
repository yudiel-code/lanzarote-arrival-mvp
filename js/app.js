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
            <button type="button" data-route="${item.key}">
              ${item.label}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function renderApp() {
  if (!app) return;

  app.innerHTML = `
    <main class="app-shell">
      ${renderNav()}
      ${getCurrentView()}
    </main>
  `;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-route]");
  if (!button) return;

  appState.currentRoute = button.dataset.route;
  renderApp();
});

renderApp();