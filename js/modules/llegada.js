import { appState } from "../state.js";

function renderArrivalDetails() {
  if (appState.arrivalType === "vuelo") {
    return `
      <div class="arrival-details">
        <p>Tipo elegido: Vuelo</p>
        <p>Aquí irá luego la entrada de aeropuerto, hora y contexto de aterrizaje.</p>
      </div>
    `;
  }

  if (appState.arrivalType === "crucero") {
    return `
      <div class="arrival-details">
        <p>Tipo elegido: Crucero</p>
        <p>Aquí irá luego la entrada de puerto, hora y contexto de desembarque.</p>
      </div>
    `;
  }

  if (appState.arrivalType === "manual") {
    return `
      <div class="arrival-details">
        <p>Tipo elegido: Manual</p>
        <p>Aquí irá luego la entrada manual del punto de llegada.</p>
      </div>
    `;
  }

  return `
    <div class="arrival-details">
      <p>Selección actual: Sin seleccionar</p>
    </div>
  `;
}

export function renderLlegada() {
  return `
    <section class="screen screen--base">
      <h2>Llegada</h2>
      <p>Selecciona cómo llega el usuario para iniciar la decisión.</p>

      <div class="arrival-options">
        <button type="button" data-arrival="vuelo">Vuelo</button>
        <button type="button" data-arrival="crucero">Crucero</button>
        <button type="button" data-arrival="manual">Manual</button>
      </div>

      ${renderArrivalDetails()}
    </section>
  `;
}