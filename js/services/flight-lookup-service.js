import { appConfig } from '../config.js';

const AVIATIONSTACK_BASE = 'https://api.aviationstack.com/v1';
const LANZAROTE_IATA = 'ACE';
const ACE_COORDS = { lat: 28.9453, lng: -13.6025 };
const CANARY_BBOX = {
  lamin: '24.8',
  lomin: '-19.8',
  lamax: '31.8',
  lomax: '-11.0'
};

const AIRLINE_CODE_ALIASES = {
  PM: 'CNF', // Canaryfly
  NT: 'IBB', // Binter Canarias
  VY: 'VLG',
  FR: 'RYR',
  U2: 'EZY',
  LS: 'EXS',
  BY: 'TOM',
  BA: 'BAW',
  IB: 'IBE',
  UX: 'AEA',
  EC: 'EJU',
  EW: 'EWG',
  LX: 'SWR',
  KL: 'KLM',
  LH: 'DLH',
  AF: 'AFR',
  TP: 'TAP',
  FI: 'ICE',
  HV: 'TRA',
  DY: 'NOZ',
  OE: 'LDM'
};

export async function lookupFlight(flightNumber) {
  if (!flightNumber || !flightNumber.trim()) return null;

  const normalized = normalizeFlightNumber(flightNumber);
  const candidates = expandFlightCandidates(normalized);

  try {
    if (appConfig.flightLookup?.aviationstackProxyUrl) {
      const byProxy = await lookupViaProxy(normalized, appConfig.flightLookup.aviationstackProxyUrl);
      if (byProxy) return byProxy;
    }

    if (appConfig.flightLookup?.aviationstackKey) {
      const byAviationstack = await lookupViaAviationstack(normalized, appConfig.flightLookup.aviationstackKey);
      if (byAviationstack) return byAviationstack;
    }
  } catch {
    // sigue con los fallbacks libres
  }

  const liveMatch = await lookupFlightOpenSkyLive(normalized, candidates);
  if (liveMatch) return liveMatch;

  return lookupFlightOpenSkyArrival(normalized, candidates);
}

async function lookupViaProxy(flightNumber, proxyUrl) {
  const separator = proxyUrl.includes('?') ? '&' : '?';
  const res = await fetch(`${proxyUrl}${separator}flight=${encodeURIComponent(flightNumber)}`);
  if (!res.ok) throw new Error(`Flight proxy error: ${res.status}`);
  const data = await res.json();
  if (!data?.data?.length) return null;
  return normalizeFlight(data.data[0], flightNumber);
}

async function lookupViaAviationstack(flightNumber, apiKey) {
  const params = new URLSearchParams({
    access_key: apiKey,
    flight_iata: flightNumber,
    arr_iata: LANZAROTE_IATA,
    limit: '1'
  });

  const res = await fetch(`${AVIATIONSTACK_BASE}/flights?${params.toString()}`);
  if (!res.ok) throw new Error(`Aviationstack error: ${res.status}`);

  const data = await res.json();
  if (!data?.data?.length) return null;
  return normalizeFlight(data.data[0], flightNumber);
}

async function lookupFlightOpenSkyLive(preferredNumber, candidates) {
  try {
    const params = new URLSearchParams(CANARY_BBOX);
    const res = await fetch(`https://opensky-network.org/api/states/all?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data?.states)) return null;

    const candidateSet = new Set(candidates);
    const matches = data.states
      .map(normalizeStateVector)
      .filter((item) => item.callsign && candidateSet.has(item.callsign));

    if (!matches.length) return null;

    const best = matches.sort((a, b) => scoreLiveMatch(b) - scoreLiveMatch(a))[0];
    return normalizeLiveState(best, preferredNumber);
  } catch {
    return null;
  }
}

async function lookupFlightOpenSkyArrival(preferredNumber, candidates) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const begin = now - (36 * 3600);

    const res = await fetch(
      `https://opensky-network.org/api/flights/arrival?airport=GCRR&begin=${begin}&end=${now}`,
      { headers: { Accept: 'application/json' } }
    );

    if (!res.ok) return null;

    const flights = await res.json();
    if (!Array.isArray(flights)) return null;
    const candidateSet = new Set(candidates);

    const match = flights
      .map((item) => ({
        ...item,
        normalizedCallsign: item.callsign?.trim().toUpperCase() || null,
        lastSeen: item.lastSeen || item.firstSeen || null
      }))
      .filter((item) => item.normalizedCallsign && candidateSet.has(item.normalizedCallsign))
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))[0];

    if (!match) return null;

    return {
      flightNumber: preferredNumber,
      matchedCallsign: match.normalizedCallsign,
      status: 'landed',
      statusLabel: resolveStatusLabel('landed'),
      origin: match.estDepartureAirport || null,
      originLabel: resolveAirportLabel(match.estDepartureAirport),
      scheduledArrival: null,
      actualArrival: formatLocalTime(match.lastSeen || match.firstSeen),
      estimatedArrival: null,
      delayMinutes: null,
      terminal: null,
      gate: null,
      source: 'opensky-arrival',
      sourceLabel: 'OpenSky · histórico reciente',
      live: false,
      note: 'Este fallback libre solo ayuda con aterrizajes ya cerrados, no con horarios oficiales futuros.'
    };
  } catch {
    return null;
  }
}

function normalizeFlight(raw, preferredNumber = null) {
  const arrival = raw.arrival || {};
  const departure = raw.departure || {};
  const scheduled = arrival.scheduled ? new Date(arrival.scheduled) : null;
  const actual = arrival.actual ? new Date(arrival.actual) : null;
  const estimated = arrival.estimated ? new Date(arrival.estimated) : null;
  const displayArrival = actual || estimated || scheduled;

  return {
    flightNumber: preferredNumber || raw.flight?.iata || raw.flight?.icao || null,
    matchedCallsign: raw.flight?.icao || null,
    status: raw.flight_status,
    statusLabel: resolveStatusLabel(raw.flight_status),
    origin: departure.iata || null,
    originLabel: resolveAirportLabel(departure.iata),
    scheduledArrival: scheduled ? formatLocalTime(scheduled.getTime()) : null,
    actualArrival: actual ? formatLocalTime(actual.getTime()) : null,
    estimatedArrival: !actual && displayArrival ? formatLocalTime(displayArrival.getTime()) : null,
    delayMinutes: arrival.delay ? Number(arrival.delay) : null,
    terminal: arrival.terminal || null,
    gate: arrival.gate || null,
    source: 'aviationstack',
    sourceLabel: 'Aviationstack',
    live: raw.flight_status === 'active'
  };
}

function normalizeStateVector(row) {
  return {
    icao24: row[0] || null,
    callsign: row[1]?.trim().toUpperCase() || null,
    originCountry: row[2] || null,
    timePosition: row[3] || null,
    lastContact: row[4] || null,
    longitude: row[5] || null,
    latitude: row[6] || null,
    onGround: Boolean(row[8]),
    velocity: row[9] || null,
    trueTrack: row[10] || null,
    verticalRate: row[11] || null,
    geoAltitude: row[13] || null
  };
}

function normalizeLiveState(state, preferredNumber) {
  const distanceToAceKm = hasCoords(state)
    ? haversineKm(state.latitude, state.longitude, ACE_COORDS.lat, ACE_COORDS.lng)
    : null;
  const etaMinutes = estimateEtaMinutes(distanceToAceKm, state.velocity, state.onGround);
  const estimatedArrival = etaMinutes ? formatLocalTime(Date.now() + (etaMinutes * 60 * 1000)) : null;
  const speedKmh = state.velocity ? Math.round(state.velocity * 3.6) : null;
  const descending = typeof state.verticalRate === 'number' && state.verticalRate < -1;

  const status = state.onGround
    ? 'landed'
    : descending && distanceToAceKm !== null && distanceToAceKm <= 90
      ? 'approach'
      : 'active';

  return {
    flightNumber: preferredNumber,
    matchedCallsign: state.callsign,
    status,
    statusLabel: resolveStatusLabel(status),
    origin: null,
    originLabel: state.originCountry || null,
    scheduledArrival: null,
    actualArrival: state.onGround ? formatLocalTime(state.lastContact) : null,
    estimatedArrival,
    delayMinutes: null,
    terminal: null,
    gate: null,
    source: 'opensky-live',
    sourceLabel: 'OpenSky · detección en vivo',
    live: !state.onGround,
    speedKmh,
    distanceToAceKm,
    note: state.callsign !== preferredNumber
      ? `Detectado por callsign operativo ${state.callsign}.`
      : 'Detectado por señal ADS-B en vivo.'
  };
}

function normalizeFlightNumber(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function expandFlightCandidates(flightNumber) {
  const output = new Set([flightNumber]);
  const match = flightNumber.match(/^([A-Z0-9]{2,3})(\d{1,4}[A-Z]?)$/);
  if (!match) return [...output];

  const [, prefix, numberPart] = match;
  const alias = AIRLINE_CODE_ALIASES[prefix];
  if (alias) output.add(`${alias}${numberPart}`);

  if (prefix.length === 3) {
    const iataPrefix = Object.entries(AIRLINE_CODE_ALIASES)
      .find(([, value]) => value === prefix)?.[0];
    if (iataPrefix) output.add(`${iataPrefix}${numberPart}`);
  }

  return [...output];
}

function scoreLiveMatch(item) {
  let score = 0;
  if (item.onGround) score += 120;
  if (hasCoords(item)) score += 30;
  if (typeof item.lastContact === 'number') score += Math.max(0, 60 - Math.min(60, Math.floor((Date.now() / 1000) - item.lastContact)));
  if (typeof item.distanceToAceKm === 'number') score += Math.max(0, 120 - item.distanceToAceKm);
  return score;
}

function estimateEtaMinutes(distanceKm, velocityMs, onGround = false) {
  if (onGround || typeof distanceKm !== 'number' || typeof velocityMs !== 'number' || velocityMs <= 40) return null;
  const speedKmh = velocityMs * 3.6;
  const effectiveSpeed = Math.max(220, Math.min(650, speedKmh * 0.72));
  const minutes = Math.round((distanceKm / effectiveSpeed) * 60);
  return Math.max(6, Math.min(95, minutes));
}

function hasCoords(item) {
  return typeof item.latitude === 'number' && typeof item.longitude === 'number';
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadius * c).toFixed(1));
}

function resolveStatusLabel(status) {
  const map = {
    scheduled: { es: 'Programado', en: 'Scheduled', de: 'Geplant' },
    active: { es: 'En vuelo', en: 'In flight', de: 'Im Flug' },
    approach: { es: 'Aproximando a Lanzarote', en: 'Approaching Lanzarote', de: 'Im Anflug auf Lanzarote' },
    landed: { es: 'Aterrizado', en: 'Landed', de: 'Gelandet' },
    cancelled: { es: 'Cancelado', en: 'Cancelled', de: 'Annulliert' },
    diverted: { es: 'Desviado', en: 'Diverted', de: 'Umgeleitet' },
    delayed: { es: 'Con retraso', en: 'Delayed', de: 'Verspätet' },
    incident: { es: 'Incidencia', en: 'Incident', de: 'Vorfall' }
  };

  return map[status] || { es: status || '—', en: status || '—', de: status || '—' };
}

function formatLocalTime(value) {
  if (!value) return null;
  const timestamp = typeof value === 'number' && value < 10_000_000_000 ? value * 1000 : value;
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Atlantic/Canary'
  });
}

function resolveAirportLabel(iata) {
  if (!iata) return null;
  const table = {
    MAD: 'Madrid Barajas',
    BCN: 'Barcelona El Prat',
    LHR: 'Londres Heathrow',
    LGW: 'Londres Gatwick',
    LTN: 'Londres Luton',
    STN: 'Londres Stansted',
    MUC: 'Múnich',
    FRA: 'Frankfurt',
    BER: 'Berlín',
    CDG: 'París CDG',
    ORY: 'París Orly',
    AMS: 'Ámsterdam Schiphol',
    DUB: 'Dublín',
    MAN: 'Manchester',
    EDI: 'Edimburgo',
    BHX: 'Birmingham',
    ZRH: 'Zúrich',
    VIE: 'Viena',
    CPH: 'Copenhague',
    OSL: 'Oslo',
    ARN: 'Estocolmo Arlanda',
    HEL: 'Helsinki',
    WAW: 'Varsovia',
    FUE: 'Fuerteventura',
    LPA: 'Las Palmas Gran Canaria',
    TFS: 'Tenerife Sur',
    TFN: 'Tenerife Norte',
    PMI: 'Mallorca',
    IBZ: 'Ibiza',
    AGP: 'Málaga'
  };
  return table[iata] || iata;
}
