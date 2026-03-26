/**
 * transport-service.js
 * Rutas sobre OSRM + estimación local de taxi.
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export const ARRIVAL_POINTS = {
  ace: {
    lat: 28.9453,
    lng: -13.6025,
    label: 'Aeropuerto César Manrique Lanzarote',
    shortLabel: 'Aeropuerto ACE',
    supplement: 1.1,
    supplementLabel: 'Suplemento aeropuerto'
  },
  'arrecife-port': {
    lat: 28.9635,
    lng: -13.5467,
    label: 'Puerto de Arrecife',
    shortLabel: 'Puerto de Arrecife',
    supplement: 0.8,
    supplementLabel: 'Suplemento puerto'
  },
  'playa-blanca-port': {
    lat: 28.8622,
    lng: -13.8283,
    label: 'Puerto de Playa Blanca',
    shortLabel: 'Puerto de Playa Blanca',
    supplement: 0.8,
    supplementLabel: 'Suplemento puerto'
  },
  'puerto-calero': {
    lat: 28.9148,
    lng: -13.6969,
    label: 'Puerto Calero',
    shortLabel: 'Puerto Calero',
    supplement: 0.8,
    supplementLabel: 'Suplemento puerto'
  }
};

export const LODGING_ZONES = {
  arrecife: { lat: 28.9635, lng: -13.5467, label: 'Arrecife' },
  'playa-honda': { lat: 28.9559, lng: -13.5585, label: 'Playa Honda' },
  'puerto-del-carmen': { lat: 28.9231, lng: -13.6528, label: 'Puerto del Carmen' },
  'costa-teguise': { lat: 29.0135, lng: -13.5015, label: 'Costa Teguise' },
  'playa-blanca': { lat: 28.8622, lng: -13.8283, label: 'Playa Blanca' }
};

export const BUS_ROUTES = {
  ace: {
    arrecife: true,
    'playa-honda': true,
    'puerto-del-carmen': true,
    'costa-teguise': false,
    'playa-blanca': true
  },
  'arrecife-port': {
    arrecife: true,
    'playa-honda': true,
    'puerto-del-carmen': true,
    'costa-teguise': true,
    'playa-blanca': true
  },
  'playa-blanca-port': {
    arrecife: true,
    'playa-honda': false,
    'puerto-del-carmen': true,
    'costa-teguise': false,
    'playa-blanca': true
  },
  'puerto-calero': {
    arrecife: false,
    'playa-honda': false,
    'puerto-del-carmen': true,
    'costa-teguise': false,
    'playa-blanca': false
  }
};

export async function fetchRoute(arrivalKey, lodgingZone, arrivalTime = null) {
  const origin = ARRIVAL_POINTS[arrivalKey];
  const dest = LODGING_ZONES[lodgingZone];
  if (!origin || !dest) throw new Error(`Punto no reconocido: ${arrivalKey} → ${lodgingZone}`);

  const coords = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
  const res = await fetch(`${OSRM_BASE}/${coords}?overview=false&steps=false&alternatives=false`, {
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`);

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Sin ruta disponible');

  const route = data.routes[0];
  const durationMin = Math.max(1, Math.round(route.duration / 60));
  const distanceKm = Number((route.distance / 1000).toFixed(1));
  const nightRate = isNightRate(arrivalTime);

  return {
    originKey: arrivalKey,
    originLabel: origin.shortLabel,
    destZone: lodgingZone,
    destLabel: dest.label,
    durationMin,
    durationLabel: formatDuration(durationMin),
    distanceKm,
    taxi: estimateTaxi(distanceKm, nightRate, origin.supplement),
    busAvailable: BUS_ROUTES[arrivalKey]?.[lodgingZone] ?? false,
    straightLineKm: estimateStraightLine(origin, dest)
  };
}

export async function fetchAllRoutes(arrivalKey, zones = null, arrivalTime = null) {
  const targetZones = zones || Object.keys(LODGING_ZONES);
  const settled = await Promise.allSettled(targetZones.map((zone) => fetchRoute(arrivalKey, zone, arrivalTime)));
  const output = {};

  targetZones.forEach((zone, index) => {
    output[zone] = settled[index].status === 'fulfilled' ? settled[index].value : null;
  });

  return output;
}

export function resolveArrivalKey(arrivalType, arrivalData) {
  if (arrivalType === 'vuelo') return 'ace';
  if (arrivalType === 'crucero') {
    const port = arrivalData?.cruise?.port;
    if (port === 'playa-blanca') return 'playa-blanca-port';
    if (port === 'puerto-calero') return 'puerto-calero';
    return 'arrecife-port';
  }
  if (arrivalType === 'manual') {
    if (arrivalData?.manual?.area === 'playa-blanca') return 'playa-blanca-port';
    if (arrivalData?.manual?.area === 'arrecife') return 'arrecife-port';
    return 'ace';
  }
  return null;
}

export function estimateTaxi(distanceKm, isNight = false, supplement = 0) {
  const BASE = 3.25;
  const PER_KM = isNight ? 1.15 : 0.95;
  const MINIMUM = isNight ? 5.5 : 4;
  const raw = BASE + (distanceKm * PER_KM) + supplement;
  const reference = Math.max(raw, MINIMUM);

  return {
    minEur: Number((reference * 0.92).toFixed(2)),
    maxEur: Number((reference * 1.08).toFixed(2)),
    referenceEur: Number(reference.toFixed(2)),
    isNightRate: isNight,
    supplementLabel: supplement > 0 ? `Incluye suplemento de ${supplement.toFixed(2)} €` : null,
    note: 'Estimación orientativa con tarifa regulada.'
  };
}

export function formatDuration(min) {
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

function isNightRate(timeStr) {
  if (!timeStr) return false;
  const [hour] = String(timeStr).split(':').map(Number);
  return hour >= 22 || hour < 7;
}

function estimateStraightLine(origin, destination) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(destination.lat);

  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadius * c).toFixed(1));
}
