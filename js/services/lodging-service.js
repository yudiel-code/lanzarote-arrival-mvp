import { mockData } from "../data/mock-data.js";

function normalizeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "-");
}

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

function mapAreaToZone(value) {
  const normalized = normalizeValue(value);

  if (!normalized) return null;

  if (normalized.includes("arrecife") || normalized === "centro") return "arrecife";
  if (normalized.includes("playa-honda")) return "playa-honda";
  if (normalized.includes("puerto-del-carmen")) return "puerto-del-carmen";
  if (normalized.includes("costa-teguise") || normalized === "norte") return "costa-teguise";
  if (normalized.includes("playa-blanca") || normalized === "sur") return "playa-blanca";
  if (normalized.includes("puerto")) return "arrecife";

  return null;
}

function getArrivalContext({ arrivalType, arrivalData }) {
  if (arrivalType === "vuelo") {
    return {
      reference: "aeropuerto",
      load: getPassengerLoad(arrivalData.flight?.passengers),
      hour: parseHour(arrivalData.flight?.time),
      zoneHint: null
    };
  }

  if (arrivalType === "crucero") {
    return {
      reference: "puerto",
      load: getPassengerLoad(arrivalData.cruise?.passengers),
      hour: parseHour(arrivalData.cruise?.time),
      zoneHint: "arrecife"
    };
  }

  if (arrivalType === "manual") {
    const area = arrivalData.manual?.area;
    const location = arrivalData.manual?.location;

    return {
      reference: "punto de llegada",
      load: getPassengerLoad(arrivalData.manual?.passengers),
      hour: parseHour(arrivalData.manual?.time),
      zoneHint: mapAreaToZone(area) || mapAreaToZone(location)
    };
  }

  return {
    reference: "llegada",
    load: "unknown",
    hour: null,
    zoneHint: null
  };
}

function formatPrice(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

function pushReason(reasons, text) {
  if (text && !reasons.includes(text)) {
    reasons.push(text);
  }
}

function scoreLodgingOption(option, context, arrivalType, transportMode) {
  let score = 0;
  const reasons = [];

  if (option.idealFor.includes(arrivalType)) {
    score += 3;
    pushReason(reasons, "encaja bien con este tipo de llegada");
  }

  if (option.transportFit.includes(transportMode)) {
    score += 2;
    pushReason(reasons, `funciona bien si sales en ${transportMode}`);
  }

  if (option.goodForLoads.includes(context.load)) {
    score += 2;
  }

  if (context.zoneHint && option.zone === context.zoneHint) {
    score += 5;
    pushReason(reasons, "te evita desvíos innecesarios desde tu zona actual");
  }

  if (arrivalType === "vuelo" && option.proximity.includes("aeropuerto")) {
    score += 3;
    pushReason(reasons, "te resuelve mejor una entrada por aeropuerto");
  }

  if (arrivalType === "crucero" && (option.proximity.includes("puerto") || option.zone === "arrecife")) {
    score += 4;
    pushReason(reasons, "reduce fricción al salir del puerto");
  }

  if (isLateArrival(context.hour) && option.lateArrivalFriendly) {
    score += 2;
    pushReason(reasons, "encaja mejor si llegas tarde");
  }

  if (context.load === "high" && option.groupFriendly) {
    score += 2;
    pushReason(reasons, "absorbe mejor un grupo grande");
  }

  if (context.load === "high" && !option.groupFriendly) {
    score -= 1;
  }

  if (context.load === "low" && option.shortStayFriendly) {
    score += 1;
  }

  return {
    ...option,
    score,
    reasons
  };
}

function getReasonLine(primary) {
  const reasons = primary.reasons.slice(0, 2);

  if (reasons.length === 0) {
    return "Es la zona que mejor equilibra practicidad y contexto de llegada.";
  }

  return reasons.join(" y ") + ".";
}

export function getContextualLodgingRecommendation({ arrivalType, arrivalData, transportMode }) {
  const lodgingOptions = Array.isArray(mockData.lodging) ? mockData.lodging : [];

  if (!arrivalType || lodgingOptions.length === 0) {
    return null;
  }

  const context = getArrivalContext({ arrivalType, arrivalData });

  const ranked = lodgingOptions
    .map((option) => scoreLodgingOption(option, context, arrivalType, transportMode))
    .sort((a, b) => b.score - a.score);

  const primary = ranked[0];

  if (!primary) {
    return null;
  }

  const alternatives = ranked.slice(1, 3);

  return {
    title: "Alojamiento sugerido",
    intro: isLateArrival(context.hour)
      ? "Si todavía no has cerrado base, aquí conviene priorizar una zona que te quite fricción desde esta llegada."
      : "Si todavía no has cerrado base, esta zona encaja mejor con el contexto actual.",
    primary: {
      label: primary.label,
      type: primary.type,
      priceText: formatPrice(primary.baseNightEur),
      reasonLine: getReasonLine(primary),
      caution: primary.caution
    },
    alternativesText:
      alternatives.length > 0
        ? alternatives.map((option) => `${option.label} desde ${formatPrice(option.baseNightEur)}/noche`).join(" · ")
        : ""
  };
}