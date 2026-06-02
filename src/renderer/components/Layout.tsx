/**
 * Composant de mise en page principal (après connexion).
 *
 * Sidebar fixe + zone de contenu. La navigation est filtrée par rôle
 * en utilisant les valeurs exactes retournées par l'API (`citoyen`, `agent`,
 * `responsable`, `admin`) pour éviter le décalage clé/valeur qui brisait
 * l'affichage du menu.
 */
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  LayoutDashboard,
  FileText,
  ClipboardList,
  BarChart3,
  Bell,
  LogOut,
  Users,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

/**
 * Éléments de navigation par rôle.
 * Les clés correspondent EXACTEMENT aux valeurs `role` de l'API et de la DB
 * (`citoyen`, `agent`, `responsable`, `admin`).
 */
const NAV_ITEMS: Record<string, NavItem[]> = {
  citoyen: [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/report',      icon: FileText,        label: 'Nouveau signalement' },
    { to: '/my-reports',  icon: ClipboardList,   label: 'Mes signalements' },
  ],
  agent: [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/agent-tasks', icon: Calendar,        label: 'Mon planning' },
  ],
  responsable: [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/signalements',icon: Bell,            label: 'Signalements' },
    { to: '/responsable', icon: Users,           label: 'Agents & Planning' },
    { to: '/stats',       icon: BarChart3,       label: 'Statistiques' },
  ],
  admin: [
    { to: '/dashboard',   icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/signalements',icon: Bell,            label: 'Signalements' },
    { to: '/admin',       icon: ShieldCheck,     label: 'Administration' },
    { to: '/stats',       icon: BarChart3,       label: 'Statistiques' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  citoyen:     'Citoyen',
  agent:       'Agent',
  responsable: 'Responsable',
  admin:       'Administrateur',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Fallback sécurisé : citoyen si le rôle est inconnu
  const items = NAV_ITEMS[user.role] ?? NAV_ITEMS.citoyen;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      {/* Barre latérale de navigation */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0" aria-label="Navigation principale">
        {/* Logo et identité */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl civic-gradient flex items-center justify-center shrink-0" aria-hidden="true">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-tight">Smart City</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation par rôle */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menu de l'application">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Profil utilisateur et déconnexion */}
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-1" aria-label="Profil utilisateur">
            <p className="text-xs font-medium text-foreground truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Se déconnecter de l'application"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Zone de contenu principal */}
      <main className="flex-1 overflow-auto p-6" id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
