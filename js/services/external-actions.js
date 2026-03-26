import { ARRIVAL_POINTS, LODGING_ZONES } from './transport-service.js';

const BUS_INFO_URL = 'https://arrecifebus.com/a-donde-vamos/';
const BUS_ALERTS_URL = 'https://arrecifebus.com/avisos/';

function encodeQuery(value) {
  return encodeURIComponent(String(value || '').trim());
}

export function buildMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeQuery(query)}`;
}

export function buildMapsDirectionsUrl({ destinationCoords, destinationLabel = '', travelmode = 'driving', originCoords = null } = {}) {
  if (!destinationCoords?.lat || !destinationCoords?.lng) return null;

  const params = new URLSearchParams({
    api: '1',
    destination: `${destinationCoords.lat},${destinationCoords.lng}`,
    travelmode
  });

  if (originCoords?.lat && originCoords?.lng) {
    params.set('origin', `${originCoords.lat},${originCoords.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildBookingSearchUrl({ label, zoneLabel }) {
  const search = [label, zoneLabel, 'Lanzarote'].filter(Boolean).join(', ');
  return `https://www.booking.com/searchresults.html?ss=${encodeQuery(search)}`;
}

export function buildGoogleTravelLinks({ lodging, arrivalKey, travelmode = 'driving' }) {
  if (!lodging?.coordinates) return null;
  const origin = arrivalKey ? ARRIVAL_POINTS[arrivalKey] : null;

  return {
    directions: buildMapsDirectionsUrl({
      destinationCoords: lodging.coordinates,
      destinationLabel: `${lodging.label}, Lanzarote`,
      travelmode,
      originCoords: origin ? { lat: origin.lat, lng: origin.lng } : null
    }),
    areaSearch: buildMapsSearchUrl(`${lodging.label}, Lanzarote`),
    booking: buildBookingSearchUrl({ label: lodging.label, zoneLabel: lodging.zoneLabel }),
    walkingArea: buildMapsDirectionsUrl({
      destinationCoords: lodging.coordinates,
      travelmode: 'walking',
      originCoords: origin ? { lat: origin.lat, lng: origin.lng } : null
    })
  };
}

export function getArrivalActionLinks(arrivalKey) {
  const point = ARRIVAL_POINTS[arrivalKey];
  if (!point) return [];

  const query = point.label.includes('Aeropuerto')
    ? `${point.label} taxi rank Lanzarote`
    : `${point.label} taxi Lanzarote`;

  return [
    {
      key: 'taxi-rank',
      label: 'Ver punto de taxi',
      url: buildMapsSearchUrl(query),
      kind: 'maps'
    },
    {
      key: 'bus-info',
      label: 'Ver guaguas oficiales',
      url: BUS_INFO_URL,
      kind: 'bus'
    }
  ];
}

export function getBusPlan({ arrivalKey, zone, lodging, hasDirectBus }) {
  if (!lodging?.coordinates) return null;
  const origin = ARRIVAL_POINTS[arrivalKey];
  if (!origin) return null;

  const transitUrl = buildMapsDirectionsUrl({
    destinationCoords: lodging.coordinates,
    destinationLabel: `${lodging.label}, Lanzarote`,
    travelmode: 'transit',
    originCoords: { lat: origin.lat, lng: origin.lng }
  });

  return {
    direct: Boolean(hasDirectBus),
    summary: hasDirectBus
      ? `Hay combinación razonable por guagua hacia ${zone || lodging.zoneLabel}.`
      : `No conviene venderte una guagua directa: toca revisar combinación o cambiar a taxi.`,
    officialUrl: BUS_INFO_URL,
    alertsUrl: BUS_ALERTS_URL,
    transitUrl,
    linesHint: resolveBusHint(arrivalKey, lodging.zone)
  };
}

function resolveBusHint(arrivalKey, zone) {
  const hints = {
    ace: {
      arrecife: 'Suele resolverse mejor hacia Arrecife con líneas del eje aeropuerto–Arrecife.',
      'playa-honda': 'Playa Honda queda en el eje aeropuerto–Arrecife; revisa la parada exacta.',
      'puerto-del-carmen': 'Revisa las líneas aeropuerto–Puerto del Carmen / Playa Blanca.',
      'costa-teguise': 'Normalmente exige paso previo por Arrecife.',
      'playa-blanca': 'La salida útil suele pasar por líneas aeropuerto–Playa Blanca.'
    },
    'arrecife-port': {
      arrecife: 'Desde el puerto, Arrecife suele resolverse a pie o con trayecto muy corto.',
      'playa-honda': 'Revisa combinación vía Arrecife.',
      'puerto-del-carmen': 'Revisa líneas sur desde Arrecife.',
      'costa-teguise': 'Costa Teguise suele salir mejor desde Arrecife.',
      'playa-blanca': 'Playa Blanca requiere trayecto largo; compara con taxi.'
    }
  };

  return hints[arrivalKey]?.[zone] || 'Confirma la combinación exacta antes de moverte.';
}

export function buildLodgingActionSet({ lodging, arrivalKey, hasDirectBus }) {
  const mapLinks = buildGoogleTravelLinks({ lodging, arrivalKey });
  const transitLinks = buildGoogleTravelLinks({ lodging, arrivalKey, travelmode: 'transit' });

  return [
    {
      key: 'drive',
      label: 'Abrir ruta en Maps',
      url: mapLinks?.directions,
      kind: 'primary'
    },
    {
      key: 'booking',
      label: 'Buscar en Booking',
      url: mapLinks?.booking,
      kind: 'secondary'
    },
    {
      key: 'area',
      label: 'Ver zona en Maps',
      url: mapLinks?.areaSearch,
      kind: 'secondary'
    },
    {
      key: 'transit',
      label: hasDirectBus ? 'Probar ruta en guagua' : 'Mirar alternativa en transporte',
      url: transitLinks?.directions,
      kind: 'secondary'
    }
  ].filter((item) => item.url);
}

export function buildLodgingNarrative(lodging, transportRecommendation) {
  if (!lodging) return null;

  const bulletBase = [
    lodging.reasonLine,
    lodging.publicNote,
    lodging.transport?.durationLabel ? `La entrada en coche ronda ${lodging.transport.durationLabel}.` : null,
    transportRecommendation?.mode === 'taxi'
      ? 'Ahora mismo gana valor que puedas ejecutar la llegada sin más desvíos.'
      : 'Ahora mismo gana valor una base que no te obligue a regalar tiempo por ahorrar poco.'
  ].filter(Boolean);

  return {
    intro: lodging.areaSummary || 'Zona útil para resolver la llegada con criterio.',
    bullets: bulletBase.slice(0, 4)
  };
}

export function getZoneCenter(zone) {
  return LODGING_ZONES[zone] || null;
}
