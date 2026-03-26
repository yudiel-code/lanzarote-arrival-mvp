/**
 * lodging-realtime.js
 *
 * Integración con APIs reales de alojamiento.
 * Lee el comentario de cada opción para saber qué requiere.
 */

// ─── OPCIÓN A: Amadeus for Developers ─────────────────────────────────────────
// Registro gratuito en https://developers.amadeus.com
// Sandbox disponible de inmediato. Producción: aprobación en 1-5 días.
// Código de ciudad para Lanzarote: ACE

export async function getAmadeusToken(clientId, clientSecret) {
  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  const data = await res.json();
  return data.access_token; // Válido 30 min
}

export async function searchAmadeusHotels(token, checkIn, checkOut, adults) {
  const listRes = await fetch(
    "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=ACE&radius=50&radiusUnit=KM",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const hotels = await listRes.json();
  const hotelIds = hotels.data.slice(0, 20).map(h => h.hotelId).join(",");

  const offersRes = await fetch(
    `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds}&adults=${adults}&checkInDate=${checkIn}&checkOutDate=${checkOut}&currency=EUR`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const offers = await offersRes.json();
  return offers.data;
}

// ─── OPCIÓN B: Booking.com Affiliate (deeplink, funciona desde el día 1) ──────
// Registro gratuito en https://www.booking.com/affiliate-program
// No necesita API: genera un enlace directo por zona ya filtrado.

const ZONE_QUERIES = {
  arrecife: "Arrecife,Lanzarote",
  "playa-honda": "Playa Honda,Lanzarote",
  "puerto-del-carmen": "Puerto del Carmen,Lanzarote",
  "costa-teguise": "Costa Teguise,Lanzarote",
  "playa-blanca": "Playa Blanca,Lanzarote"
};

export function buildBookingDeeplink(zone, arrivalDate, nights, passengers, affiliateId) {
  const checkoutDate = new Date(arrivalDate);
  checkoutDate.setDate(checkoutDate.getDate() + nights);

  const params = new URLSearchParams({
    aid: affiliateId,
    ss: ZONE_QUERIES[zone] || "Lanzarote",
    checkin: arrivalDate,
    checkout: checkoutDate.toISOString().split("T")[0],
    group_adults: passengers,
    no_rooms: 1
  });

  return `https://www.booking.com/searchresults.html?${params}`;
}

/**
 * Genera la fecha de check-in a partir de la hora de llegada del usuario.
 * Si llega antes de medianoche, check-in ese mismo día. Si llega a las 00:XX, el día siguiente.
 */
export function resolveCheckinDate(arrivalTime) {
  const today = new Date();
  const [h] = (arrivalTime || "12:00").split(":").map(Number);

  // Llegada de madrugada (00:00–05:00): probablemente check-in al día siguiente
  if (h >= 0 && h < 5) {
    today.setDate(today.getDate() + 1);
  }

  return today.toISOString().split("T")[0];
}
