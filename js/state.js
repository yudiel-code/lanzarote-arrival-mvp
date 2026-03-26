export const appState = {
  currentRoute: 'home',
  arrivalType: null,
  arrivalData: {
    flight: { airport: '', time: '', passengers: '', flightNumber: '' },
    cruise: { port: '', time: '', passengers: '', disembarkContext: '' },
    manual: { location: '', area: '', time: '', passengers: '' }
  },
  operationalContext: null,
  operationalContextLoading: false,
  operationalContextError: null,
  flightLookup: { loading: false, result: null, error: null },
  recommendation: null,
  selectedLodgingId: null,
  selectedLodgingSource: 'action',
  actionExecution: { active: false, mode: null },
  ui: {
    offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    installPromptAvailable: false,
    dismissedInstall: false,
    toast: null
  }
};
