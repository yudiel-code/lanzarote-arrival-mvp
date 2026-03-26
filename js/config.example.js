// Copia este archivo como js/config.js y rellena solo si quieres mejorar la
// consulta de vuelos. La app sigue funcionando sin estas claves.
export const appConfig = {
  flightLookup: {
    // API key opcional de Aviationstack.
    aviationstackKey: "",
    // Proxy HTTPS opcional propio (Cloudflare Worker / Vercel / Netlify Function).
    // Debe aceptar ?flight=VY1234 y devolver un JSON compatible con el endpoint de flights.
    aviationstackProxyUrl: ""
  }
};
