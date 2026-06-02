/**
 * Hook useInterventions — charge les interventions (enrichies avec l'incident lié).
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InterventionWithIncident } from '@/types/user';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

export function useInterventions(queryString = '') {
  const { authFetch } = useAuth();
  const [interventions, setInterventions] = useState<InterventionWithIncident[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/interventions${queryString ? '?' + queryString : ''}`;
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      setInterventions(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue');
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, queryString]);

  useEffect(() => { load(); }, [load]);

  return { interventions, loading, error, refresh: load };
}
