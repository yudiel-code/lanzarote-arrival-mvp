import { appState } from "../state.js";

function renderArrivalDetails() {
  if (appState.arrivalType === "vuelo") {
    return `
      <div class="arrival-details">
        <p>Tipo elegido: Vuelo</p>

        <div class="arrival-form">
          <label for="flight-airport">Aeropuerto</label>
          <select id="flight-airport">
            <option value="">Selecciona aeropuerto</option>
            <option value="ace">ACE - César Manrique Lanzarote</option>
          </select>

          <label for="flight-time">Hora estimada de llegada</label>
          <input id="flight-time" type="time" />

          <label for="flight-passengers">Personas</label>
          <select id="flight-passengers">
            <option value="">Selecciona</option>
            <option value="1">1 persona</option>
            <option value="2">2 personas</option>
            <option value="3">3 personas</option>
            <option value="4">4 personas</option>
            <option value="5+">5 o más</option>
          </select>
        </div>
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