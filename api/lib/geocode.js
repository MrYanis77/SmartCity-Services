/**
 * Géocodage adresse via Nominatim (côté serveur).
 */
export async function geocodeAddress(address) {
  const q = String(address ?? '').trim();
  if (q.length < 5) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'fr', 'User-Agent': 'SmartCityApp/1.0 (dev)' },
  });
  if (!response.ok) return null;

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon),
  };
}
