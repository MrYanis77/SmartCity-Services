/**
 * Carte embarquée (Google Maps) + géocodage automatique de l'adresse.
 */
import { useEffect, useState } from 'react';
import { geocodeAddress } from '@/lib/geocode';
import { MapPin, Loader2 } from 'lucide-react';

interface LocationMapProps {
  address: string;
  latitude?: number;
  longitude?: number;
  onCoordinatesChange?: (coords: { latitude: number; longitude: number } | null) => void;
  height?: number;
  className?: string;
}

export function LocationMap({
  address,
  latitude,
  longitude,
  onCoordinatesChange,
  height = 220,
  className = '',
}: LocationMapProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    latitude != null && longitude != null && (latitude !== 0 || longitude !== 0)
      ? { latitude, longitude }
      : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (latitude != null && longitude != null && (latitude !== 0 || longitude !== 0)) {
      const next = { latitude, longitude };
      setCoords(next);
      return;
    }

    const q = address.trim();
    if (q.length < 5) {
      setCoords(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await geocodeAddress(q);
      setCoords(result);
      if (result) onCoordinatesChange?.(result);
      setLoading(false);
    }, 700);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, latitude, longitude]);

  const mapQuery = coords
    ? `${coords.latitude},${coords.longitude}`
    : address.trim();

  if (!mapQuery) {
    return (
      <div
        className={`rounded-lg border border-border bg-muted flex items-center justify-center text-sm text-muted-foreground ${className}`}
        style={{ height }}
      >
        Saisissez une adresse pour afficher la carte
      </div>
    );
  }

  const embedSrc = coords
    ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&z=16&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative rounded-lg border border-border overflow-hidden" style={{ height }}>
        {loading && (
          <div className="absolute inset-0 z-10 bg-background/70 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          title="Carte de localisation"
          src={embedSrc}
          width="100%"
          height={height}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="border-0"
        />
      </div>
      {coords && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
        </p>
      )}
      {!coords && !loading && address.trim().length >= 5 && (
        <p className="text-xs text-muted-foreground">
          Carte approximative — précisez l&apos;adresse pour un marqueur exact.
        </p>
      )}
    </div>
  );
}
