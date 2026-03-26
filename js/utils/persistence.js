const STORAGE_KEY = 'lz_app_state';

export function saveState(appState) {
  try {
    const partial = {
      currentRoute: appState.currentRoute,
      arrivalType: appState.arrivalType,
      arrivalData: appState.arrivalData,
      actionExecution: appState.actionExecution,
      selectedLodgingId: appState.selectedLodgingId,
      selectedLodgingSource: appState.selectedLodgingSource,
      ui: {
        dismissedInstall: appState.ui?.dismissedInstall || false
      }
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(partial));
  } catch {
    // storage opcional
  }
}

export function restoreState(appState) {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const saved = JSON.parse(raw);
    if (saved.currentRoute) appState.currentRoute = saved.currentRoute;
    if (saved.arrivalType) appState.arrivalType = saved.arrivalType;

    if (saved.arrivalData?.flight) Object.assign(appState.arrivalData.flight, saved.arrivalData.flight);
    if (saved.arrivalData?.cruise) Object.assign(appState.arrivalData.cruise, saved.arrivalData.cruise);
    if (saved.arrivalData?.manual) Object.assign(appState.arrivalData.manual, saved.arrivalData.manual);
    if (saved.actionExecution) Object.assign(appState.actionExecution, saved.actionExecution);

    if (saved.selectedLodgingId) appState.selectedLodgingId = saved.selectedLodgingId;
    if (saved.selectedLodgingSource) appState.selectedLodgingSource = saved.selectedLodgingSource;
    if (saved.ui) Object.assign(appState.ui, saved.ui);

    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
