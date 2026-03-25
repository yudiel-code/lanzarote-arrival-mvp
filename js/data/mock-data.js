export const mockData = {
  arrivals: [],
  transport: [],
  lodging: [
    {
      id: "arrecife-compact-base",
      label: "Arrecife",
      zone: "arrecife",
<<<<<<< HEAD
      type: "hotel urbano / apartamento",
      baseNightEur: 78,
=======
<<<<<<< HEAD
      zoneLabel: "Arrecife",
      type: "hotel urbano / apartamento",
      baseNightEur: 78,
      coordinates: { lat: 28.963, lng: -13.547 },
      mapPosition: { x: 32, y: 38 },
=======
      type: "hotel urbano / apartamento",
      baseNightEur: 78,
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
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
<<<<<<< HEAD
      ]
=======
<<<<<<< HEAD
      ],
      publicNote: "Base urbana rápida si tu prioridad es resolver la entrada sin desviarte demasiado.",
      areaHint: "centro / puerto"
=======
      ]
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
    },
    {
      id: "playa-honda-practical-stay",
      label: "Playa Honda",
      zone: "playa-honda",
<<<<<<< HEAD
      type: "apartamento práctico",
      baseNightEur: 84,
=======
<<<<<<< HEAD
      zoneLabel: "Playa Honda",
      type: "apartamento práctico",
      baseNightEur: 84,
      coordinates: { lat: 28.956, lng: -13.559 },
      mapPosition: { x: 39, y: 34 },
=======
      type: "apartamento práctico",
      baseNightEur: 84,
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
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
<<<<<<< HEAD
      ]
=======
<<<<<<< HEAD
      ],
      publicNote: "Muy lógica cuando aterrizas y solo quieres entrar, dormir y recolocarte al día siguiente.",
      areaHint: "aeropuerto / costa cercana"
=======
      ]
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
    },
    {
      id: "puerto-del-carmen-balanced-base",
      label: "Puerto del Carmen",
      zone: "puerto-del-carmen",
<<<<<<< HEAD
      type: "hotel / apartamento turístico",
      baseNightEur: 96,
=======
<<<<<<< HEAD
      zoneLabel: "Puerto del Carmen",
      type: "hotel / apartamento turístico",
      baseNightEur: 96,
      coordinates: { lat: 28.923, lng: -13.653 },
      mapPosition: { x: 24, y: 58 },
=======
      type: "hotel / apartamento turístico",
      baseNightEur: 96,
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
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
<<<<<<< HEAD
      ]
=======
<<<<<<< HEAD
      ],
      publicNote: "Punto bastante equilibrado entre facilidad de llegada y sensación de estancia más completa.",
      areaHint: "sur próximo / zona turística"
=======
      ]
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
    },
    {
      id: "costa-teguise-relaxed-family",
      label: "Costa Teguise",
      zone: "costa-teguise",
<<<<<<< HEAD
      type: "resort / apartamento",
      baseNightEur: 104,
=======
<<<<<<< HEAD
      zoneLabel: "Costa Teguise",
      type: "resort / apartamento",
      baseNightEur: 104,
      coordinates: { lat: 28.998, lng: -13.492 },
      mapPosition: { x: 55, y: 25 },
=======
      type: "resort / apartamento",
      baseNightEur: 104,
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
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
<<<<<<< HEAD
      ]
=======
<<<<<<< HEAD
      ],
      publicNote: "Se vuelve más interesante cuando el grupo pesa más que la pura inmediatez.",
      areaHint: "norte cercano / resort"
=======
      ]
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
    },
    {
      id: "playa-blanca-south-stay",
      label: "Playa Blanca",
      zone: "playa-blanca",
<<<<<<< HEAD
      type: "resort / apartamento amplio",
      baseNightEur: 118,
=======
<<<<<<< HEAD
      zoneLabel: "Playa Blanca",
      type: "resort / apartamento amplio",
      baseNightEur: 118,
      coordinates: { lat: 28.862, lng: -13.829 },
      mapPosition: { x: 8, y: 83 },
=======
      type: "resort / apartamento amplio",
      baseNightEur: 118,
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
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
<<<<<<< HEAD
      ]
    }
  ]
};
=======
<<<<<<< HEAD
      ],
      publicNote: "Tiene sentido cuando el destino sur ya está decidido, no tanto para improvisar al llegar.",
      areaHint: "sur largo / estancia más asentada"
    }
  ]
};
=======
      ]
    }
  ]
};
>>>>>>> fd02cb93628d129706c6bd63aeb4f106e52980a7
>>>>>>> 7444d22 (fase 4-5: actualiza llegada, decision, accion, radar y servicios)
