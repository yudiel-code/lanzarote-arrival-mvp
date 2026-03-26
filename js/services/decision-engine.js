import { fetchCurrentWeather } from './weather-service.js';
import { fetchAllRoutes, resolveArrivalKey } from './transport-service.js';
import { mockData } from '../data/mock-data.js';
import { getPassengerLoad, parseHour, isLateArrival, extractArrivalTime } from '../utils/helpers.js';
import { formatPrice } from '../utils/formatters.js';

export async function fetchOperationalContext(arrivalType, arrivalData) {
  const arrivalKey = resolveArrivalKey(arrivalType, arrivalData);
  const arrivalTime = extractArrivalTime(arrivalType, arrivalData);

  const [weatherResult, routesResult] = await Promise.allSettled([
    fetchCurrentWeather(),
    arrivalKey ? fetchAllRoutes(arrivalKey, null, arrivalTime) : Promise.resolve(null)
  ]);

  const errors = [];
  if (weatherResult.status === 'rejected') errors.push('weather');
  if (routesResult.status === 'rejected') errors.push('routes');

  return {
    weather: weatherResult.status === 'fulfilled' ? weatherResult.value : null,
    routes: routesResult.status === 'fulfilled' ? routesResult.value : null,
    arrivalKey,
    arrivalTime,
    errors,
    fetchedAt: new Date().toISOString()
  };
}

export function recommendTransferMode(context, arrivalType, arrivalData, shortlist = null) {
  const passengerLoad = getPassengerLoad(resolvePassengers(arrivalType, arrivalData));
  const arrivalHour = parseHour(extractArrivalTime(arrivalType, arrivalData));
  const late = isLateArrival(arrivalHour);
  const weather = context?.weather;
  const primary = shortlist?.[0] || null;

  let taxiScore = 50;
  let busScore = 50;
  const taxiReasons = [];
  const busReasons = [];

  if (weather?.severity === 'storm' || weather?.windKmh >= 55) {
    taxiScore += 18;
    busScore -= 14;
    taxiReasons.push('el tiempo castiga más cualquier espera o cambio');
  } else if (weather?.severity === 'rain' || weather?.windKmh >= 35) {
    taxiScore += 10;
    busScore -= 6;
    taxiReasons.push('con viento o lluvia el trayecto directo pesa más');
  } else {
    busScore += 4;
    busReasons.push('el contexto meteorológico no penaliza tanto el ahorro');
  }

  if (late) {
    taxiScore += 12;
    busScore -= 8;
    taxiReasons.push('llegas tarde y conviene cortar pasos');
  } else {
    busScore += 3;
  }

  if (passengerLoad === 'high') {
    taxiScore += 16;
    busScore -= 12;
    taxiReasons.push('con grupo grande la fricción sube rápido');
  } else if (passengerLoad === 'medium') {
    taxiScore += 7;
    busScore -= 3;
    taxiReasons.push('con varias personas el ahorro del bus pesa menos');
  } else if (passengerLoad === 'low') {
    busScore += 7;
    busReasons.push('si vais pocos, el ahorro del bus gana valor');
  }

  if (arrivalType === 'crucero') {
    taxiScore += 8;
    taxiReasons.push('salir del puerto suele penalizar más los rodeos');
  }

  const directBus = Boolean(primary?.transport?.busAvailable);
  if (directBus) {
    busScore += 12;
    busReasons.push('la zona principal sí tiene salida razonable en guagua');
  } else {
    taxiScore += 8;
    busScore -= 10;
    taxiReasons.push('la zona fuerte no tiene una guagua tan limpia');
  }

  if (primary?.transport?.durationMin >= 28) {
    taxiScore += 6;
    taxiReasons.push('el trayecto ya es lo bastante largo como para no complicarlo más');
  }

  const mode = taxiScore >= busScore ? 'taxi' : 'bus';
  const delta = Math.abs(taxiScore - busScore);

  return {
    mode,
    scoreDelta: delta,
    confidence: delta >= 18 ? 'alta' : delta >= 10 ? 'media' : 'baja',
    headline: mode === 'taxi'
      ? 'Ahora mismo gana taxi'
      : 'Ahora mismo gana guagua',
    summary: mode === 'taxi'
      ? 'La prioridad aquí es entrar bien sin añadir más fricción de la que ya trae la llegada.'
      : 'El contexto permite ahorrar sin deteriorar demasiado la entrada.',
    taxi: {
      score: Math.round(taxiScore),
      reasons: taxiReasons.slice(0, 3)
    },
    bus: {
      score: Math.round(busScore),
      reasons: busReasons.slice(0, 3)
    }
  };
}

export function buildRecommendation(context, arrivalType, arrivalData, preferredMode = null) {
  const lodging = Array.isArray(mockData.lodging) ? mockData.lodging : [];
  if (!lodging.length || !context) return null;

  const transportSeed = preferredMode || 'taxi';
  const initialScored = lodging
    .map((option) => scoreOption(option, context, arrivalType, arrivalData, transportSeed))
    .sort((a, b) => b.score - a.score);

  const transferRecommendation = preferredMode
    ? recommendTransferMode(context, arrivalType, arrivalData, initialScored)
    : recommendTransferMode(context, arrivalType, arrivalData, initialScored);

  const finalMode = preferredMode || transferRecommendation.mode;
  const rescored = lodging
    .map((option) => scoreOption(option, context, arrivalType, arrivalData, finalMode))
    .sort((a, b) => b.score - a.score);

  const shortlist = rescored.slice(0, 4);
  const primary = shortlist[0];
  const alternatives = shortlist.slice(1, 4);

  return {
    transferRecommendation,
    primary: formatOption(primary, context),
    alternatives: alternatives.map((option) => formatOption(option, context)),
    shortlist: shortlist.map((option) => formatOption(option, context)),
    meta: {
      arrivalKey: context.arrivalKey,
      weather: context.weather
        ? {
            label: context.weather.label,
            tempC: context.weather.tempC,
            windKmh: context.weather.windKmh,
            severity: context.weather.severity,
            operationalNote: context.weather.operationalNote
          }
        : null,
      passengerLoad: getPassengerLoad(resolvePassengers(arrivalType, arrivalData)),
      isLateArrival: isLateArrival(parseHour(extractArrivalTime(arrivalType, arrivalData))),
      fetchedAt: context.fetchedAt,
      errors: context.errors || []
    }
  };
}

function scoreOption(option, context, arrivalType, arrivalData, transportMode) {
  const passengerLoad = getPassengerLoad(resolvePassengers(arrivalType, arrivalData));
  const arrivalHour = parseHour(extractArrivalTime(arrivalType, arrivalData));
  const late = isLateArrival(arrivalHour);
  const weather = context?.weather;
  const route = context?.routes?.[option.zone];

  let score = 35;
  const reasons = [];
  const downsides = [];

  if (route) {
    if (route.durationMin <= 10) {
      score += 24;
      reasons.push(`${route.durationMin} min desde la llegada`);
    } else if (route.durationMin <= 18) {
      score += 18;
      reasons.push(`${route.durationMin} min desde la llegada`);
    } else if (route.durationMin <= 28) {
      score += 10;
      reasons.push(`traslado asumible de ${route.durationLabel}`);
    } else {
      score -= 4;
      downsides.push(`te mete ${route.durationLabel} de trayecto`);
    }

    if (transportMode === 'bus') {
      if (route.busAvailable) {
        score += 10;
        reasons.push('no te obliga a renunciar del todo a la guagua');
      } else {
        score -= 12;
        downsides.push('la guagua aquí no queda limpia');
      }
    }

    if (transportMode === 'taxi' && route.durationMin <= 20) {
      score += 5;
    }
  }

  if (option.idealFor?.includes(arrivalType)) {
    score += 9;
    reasons.push('encaja con este tipo de llegada');
  }

  if (option.transportFit?.includes(transportMode)) {
    score += 6;
  }

  if (option.goodForLoads?.includes(passengerLoad)) {
    score += 7;
  }

  if (passengerLoad === 'high' && option.groupFriendly) {
    score += 8;
    reasons.push('absorbe mejor un grupo grande');
  } else if (passengerLoad === 'high' && !option.groupFriendly) {
    score -= 6;
    downsides.push('se queda corta para grupo grande');
  }

  if (late && option.lateArrivalFriendly) {
    score += 7;
    reasons.push('aguanta mejor una llegada tardía');
  } else if (late && !option.lateArrivalFriendly) {
    score -= 4;
    downsides.push('de noche pierde sentido');
  }

  if (!late && option.shortStayFriendly) {
    score += 3;
  }

  if (weather?.severity === 'storm' || weather?.windKmh >= 50) {
    if (option.shortStayFriendly || option.lateArrivalFriendly) {
      score += 6;
      reasons.push('te protege mejor del tiempo actual');
    }
  } else if (weather?.severity === 'clear' && option.bestFor?.includes('estancia tranquila')) {
    score += 3;
  }

  if (arrivalType === 'crucero' && option.zone === 'arrecife') {
    score += 8;
    reasons.push('reduce mucho la salida desde puerto');
  }

  if (arrivalType === 'manual' && arrivalData?.manual?.area && option.zone === arrivalData.manual.area) {
    score += 10;
    reasons.push('ya estás cerca de esa lógica de base');
  }

  if (option.baseNightEur <= 90 && (late || transportMode === 'taxi')) {
    score += 3;
  }

  return {
    ...option,
    score,
    reasons,
    downsides,
    transportMode
  };
}

function formatOption(option, context) {
  const route = context?.routes?.[option.zone];
  const reasonLine = option.reasons?.slice(0, 2).join(' y ') || option.publicNote;

  return {
    id: option.id,
    label: option.label,
    zone: option.zone,
    zoneLabel: option.zoneLabel,
    type: option.type,
    vibe: option.vibe,
    bestFor: option.bestFor || [],
    areaSummary: option.areaSummary,
    searchTerm: option.searchTerm,
    score: Math.round(option.score),
    scoreLabel: resolveScoreLabel(option.score),
    priceText: formatPrice(option.baseNightEur),
    priceValue: option.baseNightEur,
    reasonLine,
    caution: option.caution,
    downsides: option.downsides || [],
    strengths: option.strengths || [],
    publicNote: option.publicNote,
    areaHint: option.areaHint,
    coordinates: option.coordinates,
    mapPosition: option.mapPosition,
    transport: route
      ? {
          durationMin: route.durationMin,
          durationLabel: route.durationLabel,
          distanceKm: route.distanceKm,
          straightLineKm: route.straightLineKm,
          taxiMin: route.taxi.minEur,
          taxiMax: route.taxi.maxEur,
          taxiReference: route.taxi.referenceEur,
          isNightRate: route.taxi.isNightRate,
          supplementLabel: route.taxi.supplementLabel,
          busAvailable: route.busAvailable
        }
      : null
  };
}

function resolvePassengers(arrivalType, arrivalData) {
  if (arrivalType === 'vuelo') return arrivalData?.flight?.passengers;
  if (arrivalType === 'crucero') return arrivalData?.cruise?.passengers;
  return arrivalData?.manual?.passengers;
}

function resolveScoreLabel(score) {
  if (score >= 78) return 'muy sólido';
  if (score >= 64) return 'sólido';
  if (score >= 52) return 'válido';
  return 'más débil';
}
