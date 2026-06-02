const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

/** Géocodage adresse → coordonnées via l'API (proxy Nominatim). */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  const q = address.trim();
  if (q.length < 5) return null;

  try {
    const res = await fetch(`${API_URL}/api/geocode?q=${encodeURIComponent(q)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.latitude == null || data.longitude == null) return null;
    return { latitude: data.latitude, longitude: data.longitude };
  } catch {
    return null;
  }
}
