import { appState } from "../state.js";

function formatAirport(value) {
  if (value === "ace") return "ACE - César Manrique Lanzarote";
  return value || "-";
}

function formatCruisePort(value) {
  if (value === "arrecife") return "Arrecife";
  if (value === "playa-blanca") return "Playa Blanca";
  if (value === "puerto-calero") return "Puerto Calero";
  return value || "-";
}

function formatManualArea(value) {
  if (value === "arrecife") return "Arrecife";
  if (value === "playa-honda") return "Playa Honda";
  if (value === "puerto-del-carmen") return "Puerto del Carmen";
  if (value === "costa-teguise") return "Costa Teguise";
  if (value === "playa-blanca") return "Playa Blanca";
  if (value === "otra") return "Otra";
  return value || "-";
}

function formatDisembarkContext(value) {
  if (value === "rapido") return "Rápido";
  if (value === "normal") return "Normal";
  if (value === "lento") return "Lento / mucha espera";
  return value || "-";
}

function getPassengerLoad(value) {
  if (value === "5+") return "high";

  const numericValue = Number(value || 0);

  if (numericValue >= 5) return "high";
  if (numericValue >= 3) return "medium";
  if (numericValue >= 1) return "low";

  return "unknown";
}

function getOperationalReading() {
  if (appState.arrivalType === "vuelo") {
    const load = getPassengerLoad(appState.arrivalData.flight.passengers);

    if (load === "high") {
      return {
        level: "friction",
        title: "Llegada con fricción probable",
        detail: "Grupo grande al salir del aeropuerto. Conviene decidir rápido y evitar improvisar."
      };
    }

    if (load === "medium") {
      return {
        level: "medium",
        title: "Llegada media",
        detail: "Hay margen, pero la decisión de salida debería estar bastante clara antes de moverse."
      };
    }

    return {
      level: "easy",
      title: "Llegada tranquila",
      detail: "Contexto simple de llegada. La salida debería resolverse con poca fricción."
    };
  }

  if (appState.arrivalType === "crucero") {
    const load = getPassengerLoad(appState.arrivalData.cruise.passengers);
    const disembarkContext = appState.arrivalData.cruise.disembarkContext;

    if (disembarkContext === "lento" || load === "high") {
      return {
        level: "friction",
        title: "Llegada con fricción probable",
        detail: "El desembarque puede penalizar tiempos y coordinación. Conviene asumir más espera."
      };
    }

    if (disembarkContext === "normal" || load === "medium") {
      return {
        level: "medium",
        title: "Llegada media",
        detail: "No parece crítica, pero puede haber algo de fricción al salir del puerto."
      };
    }

    return {
      level: "easy",
      title: "Llegada tranquila",
      detail: "Desembarque bastante limpio. El margen operativo es bueno para decidir la salida."
    };
  }

  if (appState.arrivalType === "manual") {
    const load = getPassengerLoad(appState.arrivalData.manual.passengers);
    const area = appState.arrivalData.manual.area;

    if (area === "otra" || load === "high") {
      return {
        level: "friction",
        title: "Llegada con fricción probable",
        detail: "La referencia es menos estándar o el grupo es grande. Conviene afinar mejor la siguiente decisión."
      };
    }

    if (load === "medium") {
      return {
        level: "medium",
        title: "Llegada media",
        detail: "La situación es manejable, pero no tan limpia como para decidir sin contraste."
      };
    }

    return {
      level: "easy",
      title: "Llegada tranquila",
      detail: "Punto de partida bastante claro para pasar a la comparativa de opciones."
    };
  }

  return {
    level: "unknown",
    title: "Sin lectura operativa",
    detail: "Todavía no hay contexto suficiente para interpretar la llegada."
  };
}

function getOperationalSignals() {
  const signals = [];

  if (appState.arrivalType === "vuelo") {
    const load = getPassengerLoad(appState.arrivalData.flight.passengers);

    if (load === "high") {
      signals.push("Grupo grande");
      signals.push("Necesidad de decidir rápido");
    } else if (load === "medium") {
      signals.push("Decisión con poco margen");
    } else if (load === "low") {
      signals.push("Salida simple");
    }

    if (appState.arrivalData.flight.airport === "ace") {
      signals.push("Llegada estándar por aeropuerto");
    }
  }

  if (appState.arrivalType === "crucero") {
    const load = getPassengerLoad(appState.arrivalData.cruise.passengers);
    const disembarkContext = appState.arrivalData.cruise.disembarkContext;

    if (disembarkContext === "lento") {
      signals.push("Desembarque lento");
      signals.push("Necesidad de decidir rápido");
    } else if (disembarkContext === "normal") {
      signals.push("Desembarque normal");
    } else if (disembarkContext === "rapido") {
      signals.push("Salida relativamente fluida");
    }

    if (load === "high") {
      signals.push("Grupo grande");
    } else if (load === "medium") {
      signals.push("Grupo medio");
    } else if (load === "low") {
      signals.push("Salida simple");
    }
  }

  if (appState.arrivalType === "manual") {
    const load = getPassengerLoad(appState.arrivalData.manual.passengers);
    const area = appState.arrivalData.manual.area;

    if (area === "otra") {
      signals.push("Zona menos clara");
    } else if (area) {
      signals.push("Zona identificada");
    }

    if (load === "high") {
      signals.push("Grupo grande");
      signals.push("Necesidad de decidir rápido");
    } else if (load === "medium") {
      signals.push("Grupo medio");
    } else if (load === "low") {
      signals.push("Salida simple");
    }
  }

  if (!signals.length) {
    signals.push("Sin señales operativas todavía");
  }

  return signals;
}

function renderArrivalSummary() {
  if (appState.arrivalType === "vuelo") {
    return `
      <div class="radar-summary">
        <p><strong>Resumen de llegada</strong></p>
        <ul>
          <li><strong>Vuelo:</strong> ${formatAirport(appState.arrivalData.flight.airport)}</li>
          <li><strong>Hora:</strong> ${appState.arrivalData.flight.time || "-"}</li>
          <li><strong>Personas:</strong> ${appState.arrivalData.flight.passengers || "-"}</li>
        </ul>
      </div>
    `;
  }

  if (appState.arrivalType === "crucero") {
    return `
      <div class="radar-summary">
        <p><strong>Resumen de llegada</strong></p>
        <ul>
          <li><strong>Crucero:</strong> ${formatCruisePort(appState.arrivalData.cruise.port)}</li>
          <li><strong>Hora:</strong> ${appState.arrivalData.cruise.time || "-"}</li>
          <li><strong>Personas:</strong> ${appState.arrivalData.cruise.passengers || "-"}</li>
          <li><strong>Desembarque:</strong> ${formatDisembarkContext(appState.arrivalData.cruise.disembarkContext)}</li>
        </ul>
      </div>
    `;
  }

  if (appState.arrivalType === "manual") {
    return `
      <div class="radar-summary">
        <p><strong>Resumen de llegada</strong></p>
        <ul>
          <li><strong>Punto:</strong> ${appState.arrivalData.manual.location || "-"}</li>
          <li><strong>Zona:</strong> ${formatManualArea(appState.arrivalData.manual.area)}</li>
          <li><strong>Hora:</strong> ${appState.arrivalData.manual.time || "-"}</li>
          <li><strong>Personas:</strong> ${appState.arrivalData.manual.passengers || "-"}</li>
        </ul>
      </div>
    `;
  }

  return `
    <div class="radar-summary">
      <p>No hay contexto de llegada disponible todavía.</p>
    </div>
  `;
}

function renderOperationalBlock() {
  const reading = getOperationalReading();

  return `
    <div class="radar-operational radar-operational--${reading.level}">
      <p><strong>Radar:</strong> ${reading.title}</p>
      <p>${reading.detail}</p>
    </div>
  `;
}

function renderOperationalSignals() {
  const signals = getOperationalSignals();

  return `
    <div class="radar-signals">
      <p><strong>Claves rápidas:</strong></p>
      <ul>
        ${signals.map((signal) => `<li>${signal}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderRadarAction() {
  return `
    <div class="radar-actions">
      <button type="button" data-radar-continue>
        Pasar a Decisión
      </button>
    </div>
  `;
}

export function renderRadar() {
  return `
    <section class="screen screen--base">
      <h2>Radar</h2>
      <p>Lectura rápida del contexto de llegada.</p>
      ${renderArrivalSummary()}
      ${renderOperationalBlock()}
      ${renderOperationalSignals()}
      ${renderRadarAction()}
    </section>
  `;
}