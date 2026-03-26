import { ARRIVAL_POINTS, BUS_ROUTES } from './transport-service.js';
import { buildMapsDirectionsUrl } from './external-actions.js';

const OFFICIAL_URL = 'https://arrecifebus.com/a-donde-vamos/';
const ALERTS_URL = 'https://arrecifebus.com/avisos/';

const DIRECT_HINTS = {
  ace: {
    arrecife: 'El eje aeropuerto–Arrecife suele ser la referencia más estable.',
    'playa-honda': 'Playa Honda se mueve en el mismo eje aeropuerto–Arrecife.',
    'puerto-del-carmen': 'El aeropuerto sí tiene salida razonable hacia Puerto del Carmen.',
    'playa-blanca': 'Playa Blanca tiene trayecto largo; comprueba si el ahorro te compensa.',
    'costa-teguise': 'Costa Teguise normalmente exige cambio o desvío.'
  },
  'arrecife-port': {
    arrecife: 'En Arrecife muchas veces la mejor jugada es caminar o hacer tramo muy corto.',
    'playa-honda': 'Revisa combinación saliendo desde Arrecife.',
    'puerto-del-carmen': 'Puerto del Carmen sale mejor desde la estación o intercambiador.',
    'costa-teguise': 'Costa Teguise suele resolverse mejor desde Arrecife.',
    'playa-blanca': 'Playa Blanca ya es trayecto largo; compara con taxi si vienes cansado.'
  }
};

export function getBusAdvisory({ arrivalKey, zone, destinationCoords } = {}) {
  if (!arrivalKey || !zone) return null;

  const direct = BUS_ROUTES[arrivalKey]?.[zone] ?? false;
  const origin = ARRIVAL_POINTS[arrivalKey];

  return {
    direct,
    title: direct ? 'Guagua posible' : 'Guagua poco clara',
    summary: direct
      ? 'Hay una salida razonable por guagua. Antes de moverte, confirma la combinación actual.'
      : 'Aquí no conviene prometerte una guagua directa. Tómatelo como plan B o revisa transbordos.',
    details: DIRECT_HINTS[arrivalKey]?.[zone] || 'Revisa la combinación actual antes de moverte.',
    officialUrl: OFFICIAL_URL,
    alertsUrl: ALERTS_URL,
    transitUrl: destinationCoords && origin
      ? buildMapsDirectionsUrl({
          destinationCoords,
          originCoords: { lat: origin.lat, lng: origin.lng },
          travelmode: 'transit'
        })
      : null
  };
}
