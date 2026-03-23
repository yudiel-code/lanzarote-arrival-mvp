import { appState } from "../state.js";
import { getContextualLodgingRecommendation } from "../services/lodging-service.js";

function getPassengerLoad(value) {
  if (value === "5+") return "high";

  const numericValue = Number(value || 0);

  if (numericValue >= 5) return "high";
  if (numericValue >= 3) return "medium";
  if (numericValue >= 1) return "low";

  return "unknown";
}

function parseHour(value) {
  const match = String(value || "").match(/^(\d{1,2}):/);
  if (!match) return null;

  const hour = Number(match[1]);
  return Number.isNaN(hour) ? null : hour;
}

function isLateArrival(hour) {
  if (hour === null) return false;
  return hour >= 21 || hour <= 6;
}

function formatAirport(value) {
  if (value === "ace") return "Aeropuerto César Manrique";
  return value || "-";
}

function formatCruisePort(value) {
  if (value === "arrecife") return "Puerto de Arrecife";
  if (value === "calero" || value === "puerto-calero") return "Puerto Calero";
  return value || "-";
}

function formatManualArea(value) {
  if (value === "arrecife") return "Arrecife";
  if (value === "playa-honda") return "Playa Honda";
  if (value === "puerto-del-carmen") return "Puerto del Carmen";
  if (value === "costa-teguise") return "Costa Teguise";
  if (value === "playa-blanca") return "Playa Blanca";
  if (value === "otra") return "Otra zona";
  return value || "-";
}

function getArrivalMeta() {
  if (appState.arrivalType === "vuelo") {
    return {
      typeLabel: "Vuelo",
      pointLabel: formatAirport(appState.arrivalData.flight.airport),
      time: appState.arrivalData.flight.time || "-",
      passengers: appState.arrivalData.flight.passengers || "-",
      load: getPassengerLoad(appState.arrivalData.flight.passengers),
      hour: parseHour(appState.arrivalData.flight.time),
      extraLabel: null
    };
  }

  if (appState.arrivalType === "crucero") {
    const disembark = appState.arrivalData.cruise.disembarkContext;

    return {
      typeLabel: "Crucero",
      pointLabel: formatCruisePort(appState.arrivalData.cruise.port),
      time: appState.arrivalData.cruise.time || "-",
      passengers: appState.arrivalData.cruise.passengers || "-",
      load: getPassengerLoad(appState.arrivalData.cruise.passengers),
      hour: parseHour(appState.arrivalData.cruise.time),
      extraLabel:
        disembark === "rapido"
          ? "Desembarque rápido"
          : disembark === "normal"
            ? "Desembarque normal"
            : disembark === "lento"
              ? "Desembarque lento"
              : "-"
    };
  }

  if (appState.arrivalType === "manual") {
    return {
      typeLabel: "Manual",
      pointLabel: appState.arrivalData.manual.location || "-",
      time: appState.arrivalData.manual.time || "-",
      passengers: appState.arrivalData.manual.passengers || "-",
      load: getPassengerLoad(appState.arrivalData.manual.passengers),
      hour: parseHour(appState.arrivalData.manual.time),
      extraLabel: formatManualArea(appState.arrivalData.manual.area)
    };
  }

  return null;
}

function getProReading(meta) {
  if (!meta) {
    return {
      title: "Sin contexto suficiente",
      detail: "Todavía no hay base útil para detectar oportunidades."
    };
  }

  if (appState.arrivalType === "crucero" && meta.extraLabel === "Desembarque lento") {
    return {
      title: "Ventana sensible",
      detail: "Aquí la ventaja no está en correr, sino en evitar fricción y dejar cerrado lo importante antes."
    };
  }

  if (meta.load === "high") {
    return {
      title: "Ventana sensible",
      detail: "Con grupo grande, la oportunidad real está en reducir improvisación y pasos innecesarios."
    };
  }

  if (isLateArrival(meta.hour)) {
    return {
      title: "Ventana útil corta",
      detail: "Llegada tardía: conviene asegurar primero lo cercano y lo resolutivo."
    };
  }

  return {
    title: "Ventana favorable",
    detail: "Hay margen para decidir con algo más de cabeza y sacar ventaja del contexto."
  };
}

function getOpportunitySignals(meta) {
  const signals = [];

  if (!meta) return signals;

  if (appState.arrivalType === "vuelo") {
    signals.push("Puedes orientar mejor la primera base según rapidez de salida desde aeropuerto.");
  }

  if (appState.arrivalType === "crucero") {
    signals.push("La clave no es solo salir del puerto, sino evitar una base que añada desvíos inútiles.");
  }

  if (appState.arrivalType === "manual") {
    signals.push("Tu ventaja está en adaptar la decisión a la zona real en la que ya caíste.");
  }

  if (isLateArrival(meta.hour)) {
    signals.push("Conviene priorizar alojamiento práctico antes que una zona bonita pero peor conectada.");
  } else {
    signals.push("Con esta hora, todavía puedes balancear practicidad y zona sin ir tan forzado.");
  }

  if (meta.load === "high") {
    signals.push("Grupo grande: vale más una decisión simple y ejecutable que una opción teóricamente perfecta.");
  } else if (meta.load === "medium") {
    signals.push("Grupo medio: todavía puedes corregir rápido si ves fricción al salir.");
  } else {
    signals.push("Grupo pequeño: tienes más margen para aprovechar ahorro o mejor zona.");
  }

  return signals.slice(0, 3);
}

function getPreparationChecklist(meta) {
  const items = [];

  if (!meta) return items;

  items.push("Define una base inicial antes de moverte, aunque luego la mejores.");

  if (appState.arrivalType === "crucero") {
    items.push("No des por hecho que salir del puerto rápido significa que cualquier zona encaja igual.");
  }

  if (appState.arrivalType === "vuelo") {
    items.push("Si aterrizas cansado o con equipaje, prioriza menos desvíos y menos decisiones.");
  }

  if (appState.arrivalType === "manual") {
    items.push("Usa tu zona actual como ventaja; no reinicies la decisión como si acabaras de aterrizar.");
  }

  if (isLateArrival(meta.hour)) {
    items.push("A esa hora, lo cercano y resolutivo suele ganar a lo aspiracional.");
  } else {
    items.push("Con esta hora todavía puedes comparar sin bloquear la ejecución.");
  }

  return items.slice(0, 3);
}

function getProRecommendation(meta) {
  if (!meta) {
    return {
      title: "Sin recomendación pro todavía",
      detail: "Completa una llegada válida para activar oportunidades."
    };
  }

  if (isLateArrival(meta.hour) || meta.load === "high") {
    return {
      title: "Modo pro recomendado: asegurar primero",
      detail: "Cierra una salida limpia y una base práctica. Optimizar fino viene después."
    };
  }

  return {
    title: "Modo pro recomendado: aprovechar margen",
    detail: "Puedes usar el contexto para mejorar zona, coste o comodidad sin perder control."
  };
}

function getSuggestedTransportMode(meta) {
  if (!meta) return "taxi";

  if (appState.arrivalType === "crucero" && meta.extraLabel === "Desembarque lento") {
    return "taxi";
  }

  if (isLateArrival(meta.hour) || meta.load === "high") {
    return "taxi";
  }

  return "bus";
}

function getProValuePitch(meta, recommendation, lodgingSuggestion) {
  if (!meta || !lodgingSuggestion) {
    return {
      title: "Pro te ayuda a decidir mejor antes de moverte o reservar",
      detail: "Aquí ya no se trata de ver una pista visual, sino de reducir una mala decisión.",
      bullets: [
        "Mapa completo en vez de vista parcial.",
        "Detalles reales del alojamiento sugerido.",
        "Alternativas útiles en lugar de decidir a ciegas."
      ]
    };
  }

  if (isLateArrival(meta.hour) || meta.load === "high") {
    return {
      title: "Aquí Pro evita un error justo cuando menos margen tienes",
      detail: `Con este contexto, elegir mal la zona puede complicarte la llegada, el descanso y el coste de moverte. ${lodgingSuggestion.primary.label} deja de ser solo una opción visible y pasa a ser una decisión que debes validar bien.`,
      bullets: [
        "Ver el mapa completo antes de comprometerte con una zona.",
        "Entender la cautela real del alojamiento principal.",
        `Cruzar la base sugerida con tu salida recomendada en ${recommendation.title.toLowerCase()}.`
      ]
    };
  }

  return {
    title: "Aquí Pro deja de orientar y empieza a optimizar",
    detail: `Ya no estás viendo solo un preview: aquí puedes validar si ${lodgingSuggestion.primary.label} encaja de verdad con tu llegada, tu zona y tu forma de moverte.`,
    bullets: [
      "Mapa completo y lectura más útil de la zona.",
      "Comparativa real con alternativas visibles.",
      "Más contexto para no pagar por una base que luego no compensa."
    ]
  };
}

export function renderPro() {
  const meta = getArrivalMeta();
  const reading = getProReading(meta);
  const signals = getOpportunitySignals(meta);
  const checklist = getPreparationChecklist(meta);
  const recommendation = getProRecommendation(meta);
  const transportMode = getSuggestedTransportMode(meta);
  const lodgingSuggestion = getContextualLodgingRecommendation({
    arrivalType: appState.arrivalType,
    arrivalData: appState.arrivalData,
    transportMode
  });
  const valuePitch = getProValuePitch(meta, recommendation, lodgingSuggestion);

  return `
    <section class="screen screen--base">
      <h2>Pro</h2>
      <p>Oportunidades para anticiparte mejor según la llegada.</p>

      <div class="decision-base">
        <p><strong>${valuePitch.title}</strong></p>
        <p>${valuePitch.detail}</p>
      </div>

      <div class="action-next-steps">
        <p><strong>Lo que desbloqueas aquí</strong></p>
        <ul>
          ${valuePitch.bullets.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>

      <div class="decision-context">
        <p><strong>Contexto actual</strong></p>
        ${
          meta
            ? `
        <ul>
          <li><strong>Tipo:</strong> ${meta.typeLabel}</li>
          <li><strong>Punto:</strong> ${meta.pointLabel}</li>
          <li><strong>Hora:</strong> ${meta.time}</li>
          <li><strong>Personas:</strong> ${meta.passengers}</li>
          ${meta.extraLabel ? `<li><strong>Extra:</strong> ${meta.extraLabel}</li>` : ""}
        </ul>
        `
            : `<p>No hay contexto disponible todavía.</p>`
        }
      </div>

      <div class="decision-base">
        <p><strong>Lectura Pro:</strong> ${reading.title}</p>
        <p>${reading.detail}</p>
      </div>

      <div class="decision-comparison">
        <p><strong>Oportunidades detectadas</strong></p>
        <div class="decision-options">
          ${signals
            .map(
              (signal) => `
            <article class="decision-option decision-option--medio">
              <p>${signal}</p>
            </article>
          `
            )
            .join("")}
        </div>
      </div>

      <div class="action-next-steps">
        <p><strong>Qué conviene dejar cerrado</strong></p>
        <ul>
          ${checklist.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </div>

      ${
        lodgingSuggestion
          ? `
      <div class="pro-lodging-unlocked">
        <p><strong>Desbloqueo Pro: mapa y alojamiento</strong></p>
        <p>${lodgingSuggestion.intro}</p>

        <div class="pro-lodging-unlocked-map">
          <div class="pro-lodging-unlocked-badge">Mapa completo desbloqueado</div>
          <div class="pro-lodging-unlocked-grid">
            <div class="pro-lodging-unlocked-spot pro-lodging-unlocked-spot--primary">
              <p><strong>${lodgingSuggestion.primary.label}</strong></p>
              <p>${lodgingSuggestion.primary.priceText}/noche</p>
            </div>
            ${
              lodgingSuggestion.alternativesText
                ? `
            <div class="pro-lodging-unlocked-spot">
              <p><strong>Alternativas</strong></p>
              <p>${lodgingSuggestion.alternativesText}</p>
            </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="pro-lodging-unlocked-card">
          <p><strong>${lodgingSuggestion.primary.label}</strong></p>
          <p>${lodgingSuggestion.primary.type}</p>
          <p><strong>Desde:</strong> ${lodgingSuggestion.primary.priceText}/noche</p>
          <p><strong>Encaje:</strong> ${lodgingSuggestion.primary.reasonLine}</p>
          <p><strong>Cautela:</strong> ${lodgingSuggestion.primary.caution}</p>
        </div>

        ${
          lodgingSuggestion.alternativesText
            ? `<p class="pro-lodging-unlocked-note"><strong>Alternativas reales:</strong> ${lodgingSuggestion.alternativesText}</p>`
            : ""
        }

        <p class="pro-lodging-unlocked-note">Aquí Pro deja de ser un extra bonito y pasa a ayudarte a no elegir una zona que luego te castigue en tiempo, coste o comodidad.</p>
      </div>
      `
          : ""
      }

      <div class="decision-recommendation decision-recommendation--taxi">
        <p><strong>${recommendation.title}</strong></p>
        <p>${recommendation.detail}</p>
      </div>
    </section>
  `;
}