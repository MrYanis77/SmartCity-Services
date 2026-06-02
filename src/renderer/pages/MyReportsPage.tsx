/**
 * Page de liste des signalements du citoyen connecté.
 *
 * Charge depuis l'API uniquement les incidents créés par l'utilisateur courant.
 * Permet d'ouvrir le détail et de voir les mises à jour effectuées par les agents.
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIncidents } from '@/hooks/useIncidents';
import { SignalementCard } from '@/components/SignalementCard';
import { SignalementDetail } from '@/components/SignalementDetail';
import { Signalement } from '@/types/signalement';

const MyReportsPage = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Signalement | null>(null);

  const { incidents, loading, error, refresh } = useIncidents('');

  if (!user) return null;

  if (selected) {
    return (
      <SignalementDetail
        signalement={selected}
        onClose={() => setSelected(null)}
        onUpdate={() => { setSelected(null); refresh(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes signalements</h1>
        <p className="text-muted-foreground">Suivez l'avancement de vos signalements.</p>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}
      {error   && <p className="text-destructive text-sm">{error}</p>}
      {!loading && !error && incidents.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Vous n'avez pas encore créé de signalement.
        </p>
      )}
      {!loading && (
        <div className="space-y-3">
          {incidents.map(s => (
            <SignalementCard key={s.id} signalement={s} onClick={() => setSelected(s)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
