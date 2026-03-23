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
    detail: "Todavía no hay información útil para construir una acción."
  };
}

function getFinalRecommendation() {
  const reading = getOperationalReading();

  if (reading.title === "Llegada con fricción probable") {
    return {
      key: "taxi",
      title: "Taxi",
      reason: "Es la mejor salida ahora mismo porque reduce pasos, baja fricción y resuelve el movimiento más rápido.",
      status: "Recomendación final"
    };
  }

  if (reading.title === "Llegada media") {
    return {
      key: "taxi",
      title: "Taxi",
      reason: "Es la mejor salida ahora mismo por equilibrio entre rapidez, simplicidad y control al llegar.",
      status: "Recomendación final"
    };
  }

  return {
    key: "bus",
    title: "Bus",
    reason: "Es la mejor salida ahora mismo porque el contexto es simple y permite moverse con menor coste.",
    status: "Recomendación final"
  };
}

function getArrivalReference() {
  if (appState.arrivalType === "vuelo") return "aeropuerto";
  if (appState.arrivalType === "crucero") return "salida del puerto";
  return "punto de llegada";
}

function getImmediateAction(recommendation) {
  const arrivalReference = getArrivalReference();

  if (recommendation.key === "taxi") {
    return {
      title: "Qué hacer ahora",
      steps: [
        `Ve directo a la zona oficial de ${arrivalReference}.`,
        "Ten claro el destino antes de avanzar."
      ],
      note: "Prioridad: salir con la menor fricción posible."
    };
  }

  return {
    title: "Qué hacer ahora",
    steps: [
      `Ubica primero la parada útil desde ${arrivalReference}.`,
      "Si la espera deja de compensar, cambia rápido a taxi."
    ],
    note: "Prioridad: ahorrar sin regalar demasiado tiempo."
  };
}

function getPrimaryCta(recommendation) {
  if (recommendation.key === "taxi") {
    return {
      title: "Acción principal",
      label: "Ir a salida en taxi",
      hint: "Salida directa y rápida.",
      support: "No retrases la decisión en esta fase.",
      fallbackTitle: "Si ves cola",
      fallbackText: "Decide rápido si esperas o cambias."
    };
  }

  return {
    title: "Acción principal",
    label: "Ir a parada de bus",
    hint: "Ahorro mientras el contexto siga simple.",
    support: "Muévete solo si la espera compensa.",
    fallbackTitle: "Si ves demasiada espera",
    fallbackText: "Cambia a taxi y corta la fricción."
  };
}

function getActivatedPlan() {
  if (!appState.actionExecution.active || !appState.actionExecution.mode) {
    return null;
  }

  const arrivalReference = getArrivalReference();

  if (appState.actionExecution.mode === "taxi") {
    return {
      key: "taxi",
      title: "Plan activado",
      headline: "Salida taxi preparada",
      steps: [
        `Ve ya a la zona oficial de ${arrivalReference}.`,
        "Ten el destino claro antes de parar o hablar con nadie.",
        "No abras más comparativas: ejecuta la salida rápida."
      ],
      note: "Aquí el objetivo ya no es analizar más, sino salir sin perder tiempo."
    };
  }

  return {
    key: "bus",
    title: "Plan activado",
    headline: "Salida bus preparada",
    steps: [
      `Ve a la parada útil desde ${arrivalReference}.`,
      "Confirma rápido si la dirección y la espera te compensan.",
      "Si la espera se rompe o se complica, cambia a taxi sin dudar."
    ],
    note: "Aquí el objetivo es ahorrar sin dejar que la espera te penalice."
  };
}

function getProUnlockCopy(reading, recommendation) {
  if (reading.title === "Llegada con fricción probable") {
    return {
      title: "Aquí es donde Pro sí tiene sentido",
      detail: "Ya tienes una salida clara, pero todavía no sabes qué zona te evita más fricción al dormir.",
      bullets: [
        "Ver el mapa completo antes de elegir base.",
        "Detectar una zona que parece cómoda pero luego te penaliza.",
        `Cruzar el alojamiento con tu salida recomendada en ${recommendation.title}.`
      ],
      closing: "Gratis te orienta. Pro te ayuda a no elegir mal justo cuando menos margen tienes."
    };
  }

  if (reading.title === "Llegada media") {
    return {
      title: "Aquí Pro empieza a ahorrarte errores",
      detail: "Tienes margen para decidir, pero todavía no suficiente visibilidad para saber qué zona compensa de verdad.",
      bullets: [
        "Ver detalles completos del alojamiento y su zona.",
        "Comparar alternativa principal sin decidir a ciegas.",
        "Entender la cautela real antes de reservar o moverte."
      ],
      closing: "Gratis te enseña por dónde empezar. Pro te dice qué base encaja mejor."
    };
  }

  return {
    title: "Aquí Pro sirve para afinar bien",
    detail: "La llegada viene limpia, pero eso no significa que cualquier zona o alojamiento te convenga igual.",
    bullets: [
      "Ver el mapa completo y no solo una vista parcial.",
      "Comparar opciones sin perder el contexto de movilidad.",
      "Elegir una base más lógica antes de pagar de más o desplazarte peor."
    ],
    closing: "Gratis resuelve la salida. Pro optimiza la zona y la estancia."
  };
}

export function renderAccion() {
  const reading = getOperationalReading();
  const recommendation = getFinalRecommendation();
  const immediateAction = getImmediateAction(recommendation);
  const primaryCta = getPrimaryCta(recommendation);
  const activatedPlan = getActivatedPlan();
  const lodgingSuggestion = getContextualLodgingRecommendation({
    arrivalType: appState.arrivalType,
    arrivalData: appState.arrivalData,
    transportMode: recommendation.key
  });
  const proUnlock = getProUnlockCopy(reading, recommendation);

  const ctaLabel = activatedPlan
    ? recommendation.key === "taxi"
      ? "Plan taxi activado"
      : "Plan bus activado"
    : primaryCta.label;

  return `
    <section class="screen screen--base">
      <h2>Acción</h2>
      <p>Salida sugerida según el contexto actual.</p>

      <div class="action-reading">
        <p><strong>Lectura actual:</strong> ${reading.title}</p>
        <p>${reading.detail}</p>
      </div>

      <div class="action-recommendation action-recommendation--${recommendation.key}">
        <p><strong>${recommendation.status}:</strong> ${recommendation.title}</p>
        <p>${recommendation.reason}</p>
      </div>

      <div class="action-next-steps">
        <p><strong>${immediateAction.title}:</strong></p>
        <ul>
          ${immediateAction.steps.map((step) => `<li>${step}</li>`).join("")}
        </ul>
        <p>${immediateAction.note}</p>
      </div>

      ${
        lodgingSuggestion
          ? `
      <div class="action-lodging-preview">
        <p><strong>Mapa y alojamiento</strong></p>
        <p>${lodgingSuggestion.intro}</p>

        <div class="action-lodging-preview-map" aria-hidden="true">
          <div class="action-lodging-preview-pin action-lodging-preview-pin--primary"></div>
          <div class="action-lodging-preview-pin action-lodging-preview-pin--secondary"></div>
          <div class="action-lodging-preview-pin action-lodging-preview-pin--secondary action-lodging-preview-pin--bottom"></div>

          <div class="action-lodging-preview-overlay">
            <p><strong>Vista pública</strong></p>
            <p>Ves la zona y el precio base, pero no el mapa completo.</p>
          </div>
        </div>

        <div class="action-lodging-preview-card">
          <p><strong>${lodgingSuggestion.primary.label}</strong></p>
          <p>${lodgingSuggestion.primary.type}</p>
          <p><strong>Desde:</strong> ${lodgingSuggestion.primary.priceText}/noche</p>
          <p>${lodgingSuggestion.primary.reasonLine}</p>
        </div>

        <div class="action-lodging-preview-lock">
          <p><strong>${proUnlock.title}</strong></p>
          <p>${proUnlock.detail}</p>
          <ul>
            ${proUnlock.bullets.map((item) => `<li>${item}</li>`).join("")}
          </ul>
          <p><strong>Paso natural:</strong> entra en Pro si necesitas decidir bien la zona antes de moverte o reservar.</p>
          <p>${proUnlock.closing}</p>
        </div>
      </div>
      `
          : ""
      }

      <div class="action-primary-cta">
        <p><strong>${primaryCta.title}:</strong></p>
        <button id="action-primary-cta-btn" type="button" data-action-mode="${recommendation.key}">
          ${ctaLabel}
        </button>
        <p>${primaryCta.hint}</p>
        <p>${primaryCta.support}</p>
        <p><strong>${primaryCta.fallbackTitle}:</strong> ${primaryCta.fallbackText}</p>
      </div>

      ${
        activatedPlan
          ? `
      <div class="action-activated-plan action-activated-plan--${activatedPlan.key}">
        <p><strong>${activatedPlan.title}:</strong> ${activatedPlan.headline}</p>
        <ul>
          ${activatedPlan.steps.map((step) => `<li>${step}</li>`).join("")}
        </ul>
        <p>${activatedPlan.note}</p>
      </div>
      `
          : ""
      }
    </section>
  `;
}