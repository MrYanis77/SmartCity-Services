/**
 * Contexte d'authentification de l'application.
 *
 * Fournit l'utilisateur courant, les fonctions `login`, `logout` et `authFetch`.
 *
 * Flux JWT :
 *   1. `login(email, password)` → POST /api/auth/login → stocke accessToken + refreshToken.
 *   2. `authFetch(url, options)` → injecte le Bearer token dans chaque requête API.
 *   3. Si l'API retourne 401 avec code TOKEN_EXPIRED → appelle POST /api/auth/refresh
 *      pour obtenir un nouveau accessToken, puis relance la requête originale.
 *   4. `logout()` → POST /api/auth/logout, efface les tokens en mémoire.
 *
 * Les tokens sont volontairement conservés en mémoire (pas dans localStorage)
 * pour éviter les attaques XSS.
 */
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

export type UserRole = 'citoyen' | 'agent' | 'responsable' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

interface AuthContextValue {
  user: User | null;
  /** Tente une connexion. Retourne true si succès, false sinon. */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  /**
   * Wrapper autour de `fetch` qui injecte le Bearer token et gère
   * le renouvellement automatique via le refresh token.
   */
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => ({ ok: false }),
  logout: async () => {},
  authFetch: (url) => fetch(url),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Tokens conservés en mémoire (refs) pour éviter les re-renders inutiles
  const accessTokenRef  = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  /**
   * Tente de se connecter avec email + mot de passe.
   * Stocke les tokens en mémoire et l'utilisateur dans le state.
   */
  const login = useCallback(async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) {
          return { ok: false, error: body.error ?? 'Trop de tentatives. Réessayez dans quelques minutes.' };
        }
        return { ok: false, error: body.error ?? 'Email ou mot de passe incorrect.' };
      }

      const data = await res.json();
      accessTokenRef.current  = data.accessToken;
      refreshTokenRef.current = data.refreshToken;
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Impossible de joindre le serveur. Vérifiez que l\'application est bien lancée.' };
    }
  }, []);

  /**
   * Renouvelle l'access token en utilisant le refresh token stocké.
   * @returns {Promise<string|null>} Nouveau accessToken ou null si échec.
   */
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!refreshTokenRef.current) return null;

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenRef.current }),
      });

      if (!res.ok) return null;

      const { accessToken } = await res.json();
      accessTokenRef.current = accessToken;
      return accessToken;
    } catch {
      return null;
    }
  }, []);

  /**
   * Wrapper fetch authentifié avec renouvellement automatique du token.
   * Injecte le Bearer token et relance la requête si le token est expiré (401 TOKEN_EXPIRED).
   */
  const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});

    if (accessTokenRef.current) {
      headers.set('Authorization', `Bearer ${accessTokenRef.current}`);
    }

    let response = await fetch(url, { ...options, headers });

    // Si le token est expiré, on tente de le renouveler et on relance la requête
    if (response.status === 401) {
      const body = await response.clone().json().catch(() => ({}));
      if (body.code === 'TOKEN_EXPIRED') {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, { ...options, headers });
        } else {
          // Refresh expiré aussi → déconnexion forcée
          setUser(null);
          accessTokenRef.current  = null;
          refreshTokenRef.current = null;
        }
      }
    }

    return response;
  }, [refreshAccessToken]);

  /** Déconnecte l'utilisateur et révoque le refresh token en base. */
  const logout = useCallback(async () => {
    const token = accessTokenRef.current;
    if (token) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }

    accessTokenRef.current  = null;
    refreshTokenRef.current = null;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook pour accéder au contexte d'authentification dans n'importe quel composant. */
export function useAuth() {
  return useContext(AuthContext);
}
