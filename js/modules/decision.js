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
        title: "Llegada con fricción probable",
        detail: "Grupo grande al salir del aeropuerto. Conviene decidir rápido y evitar improvisar."
      };
    }

    if (load === "medium") {
      return {
        title: "Llegada media",
        detail: "Hay margen, pero la decisión de salida debería estar bastante clara antes de moverse."
      };
    }

    return {
      title: "Llegada tranquila",
      detail: "Contexto simple de llegada. La salida debería resolverse con poca fricción."
    };
  }

  if (appState.arrivalType === "crucero") {
    const load = getPassengerLoad(appState.arrivalData.cruise.passengers);
    const disembarkContext = appState.arrivalData.cruise.disembarkContext;

    if (disembarkContext === "lento" || load === "high") {
      return {
        title: "Llegada con fricción probable",
        detail: "El desembarque puede penalizar tiempos y coordinación. Conviene asumir más espera."
      };
    }

    if (disembarkContext === "normal" || load === "medium") {
      return {
        title: "Llegada media",
        detail: "No parece crítica, pero puede haber algo de fricción al salir del puerto."
      };
    }

    return {
      title: "Llegada tranquila",
      detail: "Desembarque bastante limpio. El margen operativo es bueno para decidir la salida."
    };
  }

  if (appState.arrivalType === "manual") {
    const load = getPassengerLoad(appState.arrivalData.manual.passengers);
    const area = appState.arrivalData.manual.area;

    if (area === "otra" || load === "high") {
      return {
        title: "Llegada con fricción probable",
        detail: "La referencia es menos estándar o el grupo es grande. Conviene afinar mejor la siguiente decisión."
      };
    }

    if (load === "medium") {
      return {
        title: "Llegada media",
        detail: "La situación es manejable, pero no tan limpia como para decidir sin contraste."
      };
    }

    return {
      title: "Llegada tranquila",
      detail: "Punto de partida bastante claro para pasar a la comparativa de opciones."
    };
  }

  return {
    title: "Sin contexto suficiente",
    detail: "Todavía no hay información útil para construir una decisión."
  };
}

function getComparisonOptions() {
  const reading = getOperationalReading();
  const load =
    appState.arrivalType === "vuelo"
      ? getPassengerLoad(appState.arrivalData.flight.passengers)
      : appState.arrivalType === "crucero"
        ? getPassengerLoad(appState.arrivalData.cruise.passengers)
        : getPassengerLoad(appState.arrivalData.manual.passengers);

  const options = [
    {
      key: "taxi",
      title: "Taxi",
      strength: "Rápido y directo",
      caution: "Menos eficiente si el contexto es muy simple y el presupuesto pesa."
    },
    {
      key: "bus",
      title: "Bus",
      strength: "Más económico",
      caution: "Pierde fuerza si hay prisa, fricción o grupo grande."
    },
    {
      key: "transfer",
      title: "Transfer",
      strength: "Más ordenado si ya vienes con trayecto claro",
      caution: "No siempre compensa para escenarios muy simples o improvisados."
    },
    {
      key: "alquiler",
      title: "Alquiler",
      strength: "Da autonomía total",
      caution: "Mete más pasos justo al llegar."
    }
  ];

  if (reading.title === "Llegada con fricción probable") {
    return options.map((option) => {
      if (option.key === "taxi") {
        return {
          ...option,
          fit: "alto",
          note: "Encaja bien cuando hace falta resolver la salida rápido."
        };
      }

      if (option.key === "transfer") {
        return {
          ...option,
          fit: "medio",
          note: "Puede encajar si el trayecto ya está bastante definido."
        };
      }

      if (option.key === "bus") {
        return {
          ...option,
          fit: "bajo",
          note: "Pierde fuerza en escenarios con más fricción o presión al llegar."
        };
      }

      return {
        ...option,
        fit: "medio",
        note: "Puede servir, pero añade más carga operativa al momento de llegada."
      };
    });
  }

  if (reading.title === "Llegada media") {
    return options.map((option) => {
      if (option.key === "taxi" || option.key === "transfer") {
        return {
          ...option,
          fit: "alto",
          note: "Opción sólida para mantener control sin complicar demasiado la llegada."
        };
      }

      if (option.key === "bus") {
        return {
          ...option,
          fit: "medio",
          note: "Puede compensar si el precio pesa más que la rapidez."
        };
      }

      return {
        ...option,
        fit: "medio",
        note: "Tiene sentido si se prioriza libertad posterior más que simplicidad inmediata."
      };
    });
  }

  return options.map((option) => {
    if (option.key === "bus") {
      return {
        ...option,
        fit: "alto",
        note: "Gana sentido cuando la llegada es simple y no hay demasiada presión."
      };
    }

    if (option.key === "taxi") {
      return {
        ...option,
        fit: "alto",
        note: "Sigue siendo una salida cómoda y directa."
      };
    }

    if (option.key === "transfer") {
      return {
        ...option,
        fit: "medio",
        note: "Puede cuadrar, aunque no siempre aporta ventaja clara en una llegada tranquila."
      };
    }

    return {
      ...option,
      fit: load === "low" ? "medio" : "alto",
      note: load === "low"
        ? "Puede ser más de lo necesario si solo buscas salir rápido."
        : "Gana valor si el grupo o el plan posterior pesa más."
    };
  });
}

function getProvisionalRecommendation() {
  const reading = getOperationalReading();

  if (reading.title === "Llegada con fricción probable") {
    return {
      key: "taxi",
      title: "Taxi",
      reason: "Ahora mismo lidera porque reduce pasos, baja fricción y resuelve la salida más rápido.",
      status: "Recomendación provisional"
    };
  }

  if (reading.title === "Llegada media") {
    return {
      key: "taxi",
      title: "Taxi",
      reason: "Ahora mismo lidera por equilibrio entre rapidez, simplicidad y control al llegar.",
      status: "Recomendación provisional"
    };
  }

  return {
    key: "bus",
    title: "Bus",
    reason: "Ahora mismo lidera porque el contexto es simple y puede dar buena salida con menor coste.",
    status: "Recomendación provisional"
  };
}

function renderArrivalContext() {
  if (appState.arrivalType === "vuelo") {
    return `
      <div class="decision-context">
        <p><strong>Contexto de llegada</strong></p>
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
      <div class="decision-context">
        <p><strong>Contexto de llegada</strong></p>
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
      <div class="decision-context">
        <p><strong>Contexto de llegada</strong></p>
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
    <div class="decision-context">
      <p>No hay datos de llegada todavía.</p>
    </div>
  `;
}

function renderDecisionBase() {
  const reading = getOperationalReading();

  return `
    <div class="decision-base">
      <p><strong>Lectura clave:</strong> ${reading.title}</p>
      <p>${reading.detail}</p>
    </div>
  `;
}

function renderComparison() {
  const options = getComparisonOptions();

  return `
    <div class="decision-comparison">
      <p><strong>Comparativa inicial</strong></p>
      <div class="decision-options">
        ${options
          .map(
            (option) => `
              <article class="decision-option decision-option--${option.fit}">
                <p><strong>${option.title}</strong> · Encaje ${option.fit}</p>
                <p><strong>Ventaja:</strong> ${option.strength}</p>
                <p><strong>Ojo:</strong> ${option.caution}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderProvisionalRecommendation() {
  const recommendation = getProvisionalRecommendation();

  return `
    <div class="decision-recommendation decision-recommendation--${recommendation.key}">
      <p><strong>${recommendation.status}:</strong> ${recommendation.title}</p>
      <p>${recommendation.reason}</p>
    </div>
  `;
}

export function renderDecision() {
  return `
    <section class="screen screen--base">
      <h2>Decisión</h2>
      <p>Comparativa rápida para elegir la mejor salida.</p>
      ${renderArrivalContext()}
      ${renderDecisionBase()}
      ${renderComparison()}
      ${renderProvisionalRecommendation()}
      <div class="decision-actions">
        <button id="decision-continue-btn" type="button">
          Pasar a Acción
        </button>
      </div>
    </section>
  `;
}