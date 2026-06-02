/**
 * Tableau de bord principal adapté au rôle de l'utilisateur connecté.
 *
 * Charge les incidents depuis l'API en filtrant par rôle :
 * - Citoyen     : uniquement ses propres signalements (citizen_id)
 * - Agent       : uniquement les incidents qui lui sont assignés (agent_id)
 * - Responsable / Admin : tous les signalements
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIncidents } from '@/hooks/useIncidents';
import { SignalementCard } from '@/components/SignalementCard';
import { SignalementDetail } from '@/components/SignalementDetail';
import { StatsCard } from '@/components/StatsCard';
import { Signalement } from '@/types/signalement';
import { AlertTriangle, CheckCircle, Clock, ClipboardList } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Signalement | null>(null);

  // Filtre API : le serveur applique le scope par rôle (citoyen / agent / responsable / admin)
  const queryString =
    user?.role === 'citoyen' ? '' :
    user?.role === 'agent' ? `agent_id=${user.id}` : '';

  const { incidents, loading, error, refresh } = useIncidents(queryString);

  if (!user) return null;

  const pending    = incidents.filter(s => s.status === 'nouveau' || s.status === 'en_attente').length;
  const inProgress = incidents.filter(s => s.status === 'en_cours').length;
  const resolved   = incidents.filter(s => s.status === 'resolu' || s.status === 'ferme').length;

  const greetings: Record<string, string> = {
    citoyen:     'Vos signalements',
    agent:       'Vos interventions',
    responsable: 'Vue d\'ensemble',
    admin:       'Administration',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greetings[user.role]}</h1>
        <p className="text-muted-foreground">Bonjour {user.full_name.split(' ')[0]}, voici votre tableau de bord.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total"      value={incidents.length} icon={ClipboardList} />
        <StatsCard title="En attente" value={pending}          icon={AlertTriangle} />
        <StatsCard title="En cours"   value={inProgress}       icon={Clock} />
        <StatsCard title="Résolus"    value={resolved}         icon={CheckCircle} />
      </div>

      {selected ? (
        <SignalementDetail
          signalement={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => { setSelected(null); refresh(); }}
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Signalements récents</h2>
          {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}
          {error   && <p className="text-destructive text-sm">{error}</p>}
          {!loading && !error && incidents.length === 0 && (
            <p className="text-muted-foreground text-sm">Aucun signalement pour le moment.</p>
          )}
          {incidents.map(s => (
            <SignalementCard key={s.id} signalement={s} onClick={() => setSelected(s)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
