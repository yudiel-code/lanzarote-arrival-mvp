# Lanzarote Arrival Guide

Web app mobile-first para ayudar a una persona que llega a Lanzarote a decidir rápido:

- cómo salir del punto de llegada
- qué base/alojamiento tiene más sentido
- qué acción real ejecutar después

## Qué incluye

- Flujo completo: **Llegada → Radar → Decisión → Acción → Pro**
- Clima en vivo con **Open-Meteo**
- Rutas y tiempos con **OSRM / OpenStreetMap**
- Mapa real con **Leaflet**
- Enlaces accionables a **Google Maps**, **Booking** y bus oficial
- PWA básica con caché útil para señal irregular
- Lookup de vuelos con fallback libre y opción de mejorar con clave/proxy

## Ejecución local

Basta con servir la carpeta como sitio estático.

Ejemplo rápido:

```bash
python -m http.server 8080
```

Luego abre:

```text
http://localhost:8080
```

## Configuración opcional de vuelos

La app funciona sin claves.

Si quieres mejorar la consulta de vuelos:

1. copia `js/config.example.js`
2. guárdalo como `js/config.js`
3. rellena una de estas opciones:
   - `aviationstackKey`
   - `aviationstackProxyUrl`

## Notas de criterio

- El clima y las rutas sí intentan ser reales.
- La capa de alojamiento usa **scoring honesto**, no scraping agresivo ni fake live data.
- Donde no hay integración 100% directa, la app usa salida útil y estable.
