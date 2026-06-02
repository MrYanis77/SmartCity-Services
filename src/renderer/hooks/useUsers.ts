/**
 * Hook useUsers — charge la liste des utilisateurs depuis l'API.
 *
 * @param role - Filtre optionnel par rôle ('agent', 'citoyen', 'responsable', 'admin').
 *               Vide = tous les utilisateurs.
 *
 * @example
 * const { users, refresh } = useUsers('agent');
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/user';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

export function useUsers(role = '') {
  const { authFetch } = useAuth();
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_URL}/api/users${role ? '?role=' + role : ''}`;
      const res = await authFetch(url);
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      setUsers(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Erreur inconnue');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [authFetch, role]);

  useEffect(() => { load(); }, [load]);

  return { users, loading, error, refresh: load };
}
