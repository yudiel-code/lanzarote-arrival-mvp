export function buildShareUrl(appState, lang = 'es') {
  const params = new URLSearchParams();
  params.set('t', appState.arrivalType || '');
  params.set('lang', lang);
  params.set('r', appState.currentRoute || 'llegada');

  if (appState.arrivalType === 'vuelo') {
    if (appState.arrivalData.flight.airport) params.set('ap', appState.arrivalData.flight.airport);
    if (appState.arrivalData.flight.time) params.set('hr', appState.arrivalData.flight.time);
    if (appState.arrivalData.flight.passengers) params.set('px', appState.arrivalData.flight.passengers);
    if (appState.arrivalData.flight.flightNumber) params.set('fn', appState.arrivalData.flight.flightNumber);
  }

  if (appState.arrivalType === 'crucero') {
    if (appState.arrivalData.cruise.port) params.set('pt', appState.arrivalData.cruise.port);
    if (appState.arrivalData.cruise.time) params.set('hr', appState.arrivalData.cruise.time);
    if (appState.arrivalData.cruise.passengers) params.set('px', appState.arrivalData.cruise.passengers);
    if (appState.arrivalData.cruise.disembarkContext) params.set('dk', appState.arrivalData.cruise.disembarkContext);
  }

  if (appState.arrivalType === 'manual') {
    if (appState.arrivalData.manual.location) params.set('lo', appState.arrivalData.manual.location);
    if (appState.arrivalData.manual.area) params.set('ar', appState.arrivalData.manual.area);
    if (appState.arrivalData.manual.time) params.set('hr', appState.arrivalData.manual.time);
    if (appState.arrivalData.manual.passengers) params.set('px', appState.arrivalData.manual.passengers);
  }

  if (appState.selectedLodgingId) params.set('lz', appState.selectedLodgingId);

  const base = window.location.origin + window.location.pathname;
  return `${base}?${params.toString()}`;
}

export function restoreFromUrl(appState) {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('t');
  if (!type || !['vuelo', 'crucero', 'manual'].includes(type)) {
    return { restored: false, lang: null };
  }

  appState.arrivalType = type;

  if (type === 'vuelo') {
    if (params.get('ap')) appState.arrivalData.flight.airport = params.get('ap');
    if (params.get('hr')) appState.arrivalData.flight.time = params.get('hr');
    if (params.get('px')) appState.arrivalData.flight.passengers = params.get('px');
    if (params.get('fn')) appState.arrivalData.flight.flightNumber = params.get('fn');
  }

  if (type === 'crucero') {
    if (params.get('pt')) appState.arrivalData.cruise.port = params.get('pt');
    if (params.get('hr')) appState.arrivalData.cruise.time = params.get('hr');
    if (params.get('px')) appState.arrivalData.cruise.passengers = params.get('px');
    if (params.get('dk')) appState.arrivalData.cruise.disembarkContext = params.get('dk');
  }

  if (type === 'manual') {
    if (params.get('lo')) appState.arrivalData.manual.location = params.get('lo');
    if (params.get('ar')) appState.arrivalData.manual.area = params.get('ar');
    if (params.get('hr')) appState.arrivalData.manual.time = params.get('hr');
    if (params.get('px')) appState.arrivalData.manual.passengers = params.get('px');
  }

  if (params.get('lz')) appState.selectedLodgingId = params.get('lz');

  const route = params.get('r');
  appState.currentRoute = route || 'llegada';

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, '', cleanUrl);

  return {
    restored: true,
    lang: params.get('lang') || null
  };
}

export async function copyShareUrl(url) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Plan de llegada Lanzarote', url });
      return true;
    } catch {
      // sigue con portapapeles
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
