export const mockData = {
  arrivals: [],
  transport: [],
  lodging: [
    {
      id: "arrecife-compact-base",
      label: "Arrecife",
      zone: "arrecife",
      type: "hotel urbano / apartamento",
      baseNightEur: 78,
      idealFor: ["crucero", "manual"],
      goodForLoads: ["low", "medium"],
      transportFit: ["taxi", "bus"],
      proximity: ["puerto", "arrecife", "centro"],
      lateArrivalFriendly: true,
      groupFriendly: false,
      shortStayFriendly: true,
      caution: "Encaja mejor para base práctica que para estancia de playa.",
      strengths: [
        "Reduce desplazamientos cuando llegas por puerto o zona centro.",
        "Buena base para una primera noche simple y operativa."
      ]
    },
    {
      id: "playa-honda-practical-stay",
      label: "Playa Honda",
      zone: "playa-honda",
      type: "apartamento práctico",
      baseNightEur: 84,
      idealFor: ["vuelo", "manual"],
      goodForLoads: ["low", "medium"],
      transportFit: ["taxi", "bus"],
      proximity: ["aeropuerto", "playa-honda"],
      lateArrivalFriendly: true,
      groupFriendly: false,
      shortStayFriendly: true,
      caution: "No es la zona con más ambiente si buscas ocio al salir.",
      strengths: [
        "Muy práctica para entrar y dormir sin meter desvíos largos.",
        "Suele encajar bien en llegadas cortas o tardías."
      ]
    },
    {
      id: "puerto-del-carmen-balanced-base",
      label: "Puerto del Carmen",
      zone: "puerto-del-carmen",
      type: "hotel / apartamento turístico",
      baseNightEur: 96,
      idealFor: ["vuelo", "manual"],
      goodForLoads: ["low", "medium", "high"],
      transportFit: ["taxi", "bus"],
      proximity: ["aeropuerto", "puerto-del-carmen", "sur"],
      lateArrivalFriendly: true,
      groupFriendly: true,
      shortStayFriendly: true,
      caution: "Puede tener más movimiento y precio que una base puramente funcional.",
      strengths: [
        "Equilibra llegada fácil, servicios y sensación de vacaciones.",
        "Encaja bien cuando no quieres pensar demasiado al aterrizar."
      ]
    },
    {
      id: "costa-teguise-relaxed-family",
      label: "Costa Teguise",
      zone: "costa-teguise",
      type: "resort / apartamento",
      baseNightEur: 104,
      idealFor: ["vuelo", "crucero", "manual"],
      goodForLoads: ["medium", "high"],
      transportFit: ["taxi", "bus"],
      proximity: ["puerto", "costa-teguise", "norte", "arrecife"],
      lateArrivalFriendly: false,
      groupFriendly: true,
      shortStayFriendly: false,
      caution: "Para una llegada muy tardía puede añadir algo más de desplazamiento.",
      strengths: [
        "Buena zona para grupos y estancias algo más cómodas.",
        "Suele encajar cuando quieres base más limpia y menos apretada."
      ]
    },
    {
      id: "playa-blanca-south-stay",
      label: "Playa Blanca",
      zone: "playa-blanca",
      type: "resort / apartamento amplio",
      baseNightEur: 118,
      idealFor: ["manual", "vuelo"],
      goodForLoads: ["medium", "high"],
      transportFit: ["taxi"],
      proximity: ["sur", "playa-blanca"],
      lateArrivalFriendly: false,
      groupFriendly: true,
      shortStayFriendly: false,
      caution: "No conviene tanto si buscas resolver la llegada con el menor recorrido posible.",
      strengths: [
        "Encaja mejor cuando ya sabes que tu base final debe estar en el sur.",
        "Más lógica para grupos o estancia más reposada que para entrada rápida."
      ]
    }
  ]
};