export const appState = {
  currentRoute: "home",
  arrivalType: null,
  arrivalData: {
    flight: {
      airport: "",
      time: "",
      passengers: ""
    },
    cruise: {
      port: "",
      time: "",
      passengers: "",
      disembarkContext: ""
    },
    manual: {
      location: "",
      area: "",
      time: "",
      passengers: ""
    }
  },
  userContext: null,
  operationalContext: null,
  lodgingContext: null,
  recommendation: null,
  actionExecution: {
    active: false,
    mode: null
  }
};