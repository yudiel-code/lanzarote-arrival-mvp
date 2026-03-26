export function getPassengerLoad(value) {
  if (value === '5+') return 'high';
  const numeric = Number(value || 0);
  if (numeric >= 5) return 'high';
  if (numeric >= 3) return 'medium';
  if (numeric >= 1) return 'low';
  return 'unknown';
}

export function parseHour(value) {
  const match = String(value || '').match(/^(\d{1,2}):/);
  if (!match) return null;
  const hour = Number(match[1]);
  return Number.isNaN(hour) ? null : hour;
}

export function isLateArrival(hour) {
  if (hour === null || hour === undefined) return false;
  return hour >= 21 || hour <= 6;
}

export function extractArrivalTime(arrivalType, arrivalData) {
  if (arrivalType === 'vuelo') return arrivalData?.flight?.time || null;
  if (arrivalType === 'crucero') return arrivalData?.cruise?.time || null;
  if (arrivalType === 'manual') return arrivalData?.manual?.time || null;
  return null;
}

export function extractPassengers(arrivalType, arrivalData) {
  if (arrivalType === 'vuelo') return arrivalData?.flight?.passengers || '';
  if (arrivalType === 'crucero') return arrivalData?.cruise?.passengers || '';
  if (arrivalType === 'manual') return arrivalData?.manual?.passengers || '';
  return '';
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}
