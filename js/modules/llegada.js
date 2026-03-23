import { appState } from "../state.js";

function renderFlightForm() {
  return `
    <div class="arrival-form">
      <label for="flight-airport">Aeropuerto</label>
      <select id="flight-airport">
        <option value="">Selecciona aeropuerto</option>
        <option value="ace" ${appState.arrivalData.flight.airport === "ace" ? "selected" : ""}>
          ACE - César Manrique Lanzarote
        </option>
      </select>

      <label for="flight-time">Hora estimada de llegada</label>
      <input
        id="flight-time"
        type="time"
        value="${appState.arrivalData.flight.time}"
      />

      <label for="flight-passengers">Personas</label>
      <select id="flight-passengers">
        <option value="">Selecciona</option>
        <option value="1" ${appState.arrivalData.flight.passengers === "1" ? "selected" : ""}>1 persona</option>
        <option value="2" ${appState.arrivalData.flight.passengers === "2" ? "selected" : ""}>2 personas</option>
        <option value="3" ${appState.arrivalData.flight.passengers === "3" ? "selected" : ""}>3 personas</option>
        <option value="4" ${appState.arrivalData.flight.passengers === "4" ? "selected" : ""}>4 personas</option>
        <option value="5+" ${appState.arrivalData.flight.passengers === "5+" ? "selected" : ""}>5 o más</option>
      </select>
    </div>
  `;
}

function renderArrivalValidation() {
  if (appState.arrivalType === "vuelo") {
    const isValid =
      appState.arrivalData.flight.airport &&
      appState.arrivalData.flight.time &&
      appState.arrivalData.flight.passengers;

    return `
      <div class="arrival-validation">
        <p>${isValid ? "Datos mínimos completos." : "Faltan datos mínimos por completar."}</p>
      </div>
    `;
  }

  if (appState.arrivalType === "crucero") {
    const isValid =
      appState.arrivalData.cruise.port &&
      appState.arrivalData.cruise.time &&
      appState.arrivalData.cruise.passengers;

    return `
      <div class="arrival-validation">
        <p>${isValid ? "Datos mínimos completos." : "Faltan datos mínimos por completar."}</p>
      </div>
    `;
  }

  if (appState.arrivalType === "manual") {
    const isValid =
      appState.arrivalData.manual.location.trim() &&
      appState.arrivalData.manual.area &&
      appState.arrivalData.manual.time &&
      appState.arrivalData.manual.passengers;

    return `
      <div class="arrival-validation">
        <p>${isValid ? "Datos mínimos completos." : "Faltan datos mínimos por completar."}</p>
      </div>
    `;
  }

  return "";
}

function renderContinueAction() {
  if (!appState.arrivalType) {
    return "";
  }

  let isValid = false;

  if (appState.arrivalType === "vuelo") {
    isValid =
      appState.arrivalData.flight.airport &&
      appState.arrivalData.flight.time &&
      appState.arrivalData.flight.passengers;
  }

  if (appState.arrivalType === "crucero") {
    isValid =
      appState.arrivalData.cruise.port &&
      appState.arrivalData.cruise.time &&
      appState.arrivalData.cruise.passengers;
  }

  if (appState.arrivalType === "manual") {
    isValid =
      appState.arrivalData.manual.location.trim() &&
      appState.arrivalData.manual.area &&
      appState.arrivalData.manual.time &&
      appState.arrivalData.manual.passengers;
  }

  return `
    <div class="arrival-actions">
      <button type="button" data-arrival-continue ${isValid ? "" : "disabled"}>
        Continuar
      </button>
    </div>
  `;
}

function renderArrivalDetails() {
  if (appState.arrivalType === "vuelo") {
    return `
      <div class="arrival-details">
        <p>Tipo elegido: Vuelo</p>
        ${renderFlightForm()}
      </div>
    `;
  }

  if (appState.arrivalType === "crucero") {
    return `
      <div class="arrival-details">
        <p>Tipo elegido: Crucero</p>

        <div class="arrival-form">
          <label for="cruise-port">Puerto</label>
          <select id="cruise-port">
            <option value="">Selecciona puerto</option>
            <option value="arrecife" ${appState.arrivalData.cruise.port === "arrecife" ? "selected" : ""}>
              Arrecife
            </option>
            <option value="playa-blanca" ${appState.arrivalData.cruise.port === "playa-blanca" ? "selected" : ""}>
              Playa Blanca
            </option>
            <option value="puerto-calero" ${appState.arrivalData.cruise.port === "puerto-calero" ? "selected" : ""}>
              Puerto Calero
            </option>
          </select>

          <label for="cruise-time">Hora estimada de desembarque</label>
          <input
            id="cruise-time"
            type="time"
            value="${appState.arrivalData.cruise.time || ""}"
          />

          <label for="cruise-passengers">Personas</label>
          <select id="cruise-passengers">
            <option value="">Selecciona</option>
            <option value="1" ${appState.arrivalData.cruise.passengers === "1" ? "selected" : ""}>1 persona</option>
            <option value="2" ${appState.arrivalData.cruise.passengers === "2" ? "selected" : ""}>2 personas</option>
            <option value="3" ${appState.arrivalData.cruise.passengers === "3" ? "selected" : ""}>3 personas</option>
            <option value="4" ${appState.arrivalData.cruise.passengers === "4" ? "selected" : ""}>4 personas</option>
            <option value="5+" ${appState.arrivalData.cruise.passengers === "5+" ? "selected" : ""}>5 o más</option>
          </select>

          <label for="cruise-disembark-context">Contexto de desembarque</label>
          <select id="cruise-disembark-context">
            <option value="">Selecciona contexto</option>
            <option value="rapido" ${appState.arrivalData.cruise.disembarkContext === "rapido" ? "selected" : ""}>
              Rápido
            </option>
            <option value="normal" ${appState.arrivalData.cruise.disembarkContext === "normal" ? "selected" : ""}>
              Normal
            </option>
            <option value="lento" ${appState.arrivalData.cruise.disembarkContext === "lento" ? "selected" : ""}>
              Lento / mucha espera
            </option>
          </select>
        </div>
      </div>
    `;
  }

  if (appState.arrivalType === "manual") {
    return `
      <div class="arrival-details">
        <p>Tipo elegido: Manual</p>

        <div class="arrival-form">
          <label for="manual-location">Punto de llegada</label>
          <input
            id="manual-location"
            type="text"
            placeholder="Ej. aeropuerto, hotel, puerto, calle o zona"
            value="${appState.arrivalData.manual.location || ""}"
          />

          <label for="manual-area">Zona aproximada</label>
          <select id="manual-area">
            <option value="">Selecciona zona</option>
            <option value="arrecife" ${appState.arrivalData.manual.area === "arrecife" ? "selected" : ""}>Arrecife</option>
            <option value="playa-honda" ${appState.arrivalData.manual.area === "playa-honda" ? "selected" : ""}>Playa Honda</option>
            <option value="puerto-del-carmen" ${appState.arrivalData.manual.area === "puerto-del-carmen" ? "selected" : ""}>Puerto del Carmen</option>
            <option value="costa-teguise" ${appState.arrivalData.manual.area === "costa-teguise" ? "selected" : ""}>Costa Teguise</option>
            <option value="playa-blanca" ${appState.arrivalData.manual.area === "playa-blanca" ? "selected" : ""}>Playa Blanca</option>
            <option value="otra" ${appState.arrivalData.manual.area === "otra" ? "selected" : ""}>Otra</option>
          </select>

          <label for="manual-time">Hora estimada</label>
          <input
            id="manual-time"
            type="time"
            value="${appState.arrivalData.manual.time || ""}"
          />

          <label for="manual-passengers">Personas</label>
          <select id="manual-passengers">
            <option value="">Selecciona</option>
            <option value="1" ${appState.arrivalData.manual.passengers === "1" ? "selected" : ""}>1 persona</option>
            <option value="2" ${appState.arrivalData.manual.passengers === "2" ? "selected" : ""}>2 personas</option>
            <option value="3" ${appState.arrivalData.manual.passengers === "3" ? "selected" : ""}>3 personas</option>
            <option value="4" ${appState.arrivalData.manual.passengers === "4" ? "selected" : ""}>4 personas</option>
            <option value="5+" ${appState.arrivalData.manual.passengers === "5+" ? "selected" : ""}>5 o más</option>
          </select>
        </div>
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
      ${renderArrivalValidation()}
      ${renderContinueAction()}
    </section>
  `;
}