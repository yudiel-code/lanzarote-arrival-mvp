export function formatPrice(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

export function formatAirport(value) {
  if (value === 'ace') return 'ACE · Aeropuerto César Manrique Lanzarote';
  return value || '—';
}

export function formatCruisePort(value) {
  if (value === 'arrecife') return 'Puerto de Arrecife';
  if (value === 'playa-blanca') return 'Puerto de Playa Blanca';
  if (value === 'puerto-calero') return 'Puerto Calero';
  return value || '—';
}

export function formatManualArea(value) {
  if (value === 'arrecife') return 'Arrecife';
  if (value === 'playa-honda') return 'Playa Honda';
  if (value === 'puerto-del-carmen') return 'Puerto del Carmen';
  if (value === 'costa-teguise') return 'Costa Teguise';
  if (value === 'playa-blanca') return 'Playa Blanca';
  if (value === 'otra') return 'Otra zona';
  return value || '—';
}

export function formatDisembarkContext(value) {
  if (value === 'rapido') return 'Rápido';
  if (value === 'normal') return 'Normal';
  if (value === 'lento') return 'Lento / mucha espera';
  return value || '—';
}

export function formatDuration(min) {
  if (min === null || min === undefined) return '—';
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

export function formatWindDirection(deg) {
  if (deg === null || deg === undefined) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8];
}

export function formatConfidence(value) {
  if (value === 'alta') return 'Alta';
  if (value === 'media') return 'Media';
  if (value === 'baja') return 'Baja';
  return value || '—';
}
