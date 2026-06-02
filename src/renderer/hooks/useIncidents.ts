/**
 * Hook useIncidents — chargement des incidents depuis l'API REST.
 *
 * Utilise `authFetch` du contexte d'authentification pour injecter
 * automatiquement le Bearer token JWT et gérer le refresh.
 *
 * @param queryString - Paramètres de filtre optionnels (ex: "citizen_id=3" ou "agent_id=2")
 *
 * @example
 * // Tous les incidents
 * const { incidents, loading, refresh } = useIncidents();
 *
 * // Incidents d'un citoyen
 * const { incidents } = useIncidents(`citizen_id=${user.id}`);
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Signalement } from '@/types/signalement';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

export function useIncidents(queryString = '') {
  const { authFetch } = useAuth();
  const [incidents, setIncidents]   = useState<Signalement[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/incidents${queryString ? '?' + queryString : ''}`;
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      setIncidents(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, queryString]);

  useEffect(() => { load(); }, [load]);

  return { incidents, loading, error, refresh: load };
}
