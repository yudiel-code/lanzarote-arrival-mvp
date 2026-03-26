/**
 * weather-service.js
 * API: Open-Meteo — https://open-meteo.com
 * Gratuita · Sin API key · Sin registro
 * Actualización cada hora. Modelos ECMWF + DWD.
 */

const LANZAROTE = {
  lat: 28.9453,
  lng: -13.6025,
  timezone: "Atlantic/Canary"
};

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

export async function fetchCurrentWeather() {
  const params = new URLSearchParams({
    latitude: LANZAROTE.lat,
    longitude: LANZAROTE.lng,
    current: [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "relative_humidity_2m",
      "precipitation"
    ].join(","),
    wind_speed_unit: "kmh",
    timezone: LANZAROTE.timezone
  });

  const res = await fetch(`${ENDPOINT}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

  const data = await res.json();
  return normalizeWeather(data.current);
}

function normalizeWeather(raw) {
  const code = raw.weather_code;
  return {
    tempC: raw.temperature_2m,
    feelsLikeC: raw.apparent_temperature,
    windKmh: raw.wind_speed_10m,
    windDirectionDeg: raw.wind_direction_10m,
    humidityPct: raw.relative_humidity_2m,
    precipMm: raw.precipitation,
    code,
    label: resolveWeatherLabel(code),
    severity: resolveWeatherSeverity(code),
    timestamp: raw.time,
    operationalNote: resolveOperationalNote(raw)
  };
}

// Códigos WMO estándar usados por Open-Meteo
function resolveWeatherLabel(code) {
  if (code === 0) return "Despejado";
  if (code === 1) return "Principalmente despejado";
  if (code === 2) return "Parcialmente nublado";
  if (code === 3) return "Cubierto";
  if (code <= 49) return "Niebla";
  if (code <= 59) return "Llovizna";
  if (code <= 69) return "Lluvia";
  if (code <= 79) return "Nieve";
  if (code <= 82) return "Chubascos";
  if (code <= 86) return "Chubascos fuertes";
  if (code <= 99) return "Tormenta eléctrica";
  return "Desconocido";
}

function resolveWeatherSeverity(code) {
  if (code === 0 || code === 1 || code === 2) return "clear";
  if (code === 3 || code <= 49) return "cloudy";
  if (code >= 51 && code <= 82) return "rain";
  if (code >= 83) return "storm";
  return "neutral";
}

function resolveOperationalNote(raw) {
  const wind = raw.wind_speed_10m;
  const code = raw.weather_code;
  const temp = raw.temperature_2m;

  if (wind > 60) return "Viento fuerte activo. Posibles afectaciones en terminales y desplazamientos.";
  if (wind > 40 && code >= 51) return "Viento moderado con lluvia. Conviene asumir algo más de fricción en la llegada.";
  if (code >= 95) return "Tormenta activa. Verifica el estado del aeropuerto antes de moverte.";
  if (code >= 51 && code <= 67) return "Lluvia activa. Pequeño impacto en tiempos de salida y espera.";
  if (temp > 30) return "Temperatura elevada. Si hay grupo, hidratación y sombra al salir.";
  return null;
}
