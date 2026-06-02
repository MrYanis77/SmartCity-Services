/**
 * Tableau de bord agent — planning + incidents assignés (API scope agent).
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIncidents } from '@/hooks/useIncidents';
import { useInterventions } from '@/hooks/useInterventions';
import { InterventionWithIncident } from '@/types/user';
import { SignalementCard } from '@/components/SignalementCard';
import { SignalementDetail } from '@/components/SignalementDetail';
import { Signalement } from '@/types/signalement';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Clock, CheckCircle, AlertTriangle, Calendar, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

const AgentTasksPage = () => {
  const { user, authFetch } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Signalement | null>(null);

  const { incidents, loading: incLoading, error: incError, refresh: refreshInc } = useIncidents(
    user ? `agent_id=${user.id}` : ''
  );

  const { interventions, loading: intervLoading, refresh: refreshInterv } = useInterventions(
    user ? `agent_id=${user.id}` : ''
  );

  const [editingInterv, setEditingInterv] = useState<InterventionWithIncident | null>(null);
  const [modifComment, setModifComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  if (!user) return null;

  const toStart = incidents.filter(s => s.status === 'en_attente' || s.status === 'nouveau');
  const inProgress = incidents.filter(s => s.status === 'en_cours');
  const done = incidents.filter(s => s.status === 'resolu' || s.status === 'ferme');

  const today = new Date().toISOString().split('T')[0];
  const upcoming = interventions
    .filter(i => !i.resolved_at && i.scheduled_date >= today)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  const past = interventions
    .filter(i => i.resolved_at || i.scheduled_date < today)
    .sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date));
  const activePlanning = interventions.filter(i => !i.resolved_at).length;

  const openIncident = async (incidentId: number) => {
    const local = incidents.find(s => s.id === incidentId);
    if (local) {
      setSelected(local);
      return;
    }
    try {
      const res = await authFetch(`${API_URL}/api/incidents/${incidentId}`);
      if (!res.ok) throw new Error();
      setSelected(await res.json());
    } catch {
      toast({ title: 'Impossible de charger l\'incident', variant: 'destructive' });
    }
  };

  const handleSendModifRequest = async () => {
    if (!editingInterv || !modifComment.trim()) return;
    setSendingComment(true);
    try {
      const res = await authFetch(`${API_URL}/api/interventions/${editingInterv.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: `[Demande de modification – ${new Date().toLocaleDateString('fr-FR')}] ${modifComment.trim()}`,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Demande envoyée', description: 'Votre commentaire est visible par le responsable.' });
      setEditingInterv(null);
      setModifComment('');
      refreshInterv();
    } catch {
      toast({ title: 'Erreur lors de l\'envoi', variant: 'destructive' });
    } finally {
      setSendingComment(false);
    }
  };

  if (selected) {
    return (
      <SignalementDetail
        signalement={selected}
        onClose={() => setSelected(null)}
        onUpdate={() => { setSelected(null); refreshInc(); refreshInterv(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mon planning</h1>
        <p className="text-muted-foreground">Vos interventions planifiées et incidents assignés.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Incidents" value={incidents.length} icon={ClipboardList} />
        <StatsCard title="Planning actif" value={activePlanning} icon={Calendar} />
        <StatsCard title="À démarrer" value={toStart.length} icon={AlertTriangle} />
        <StatsCard title="En cours" value={inProgress.length} icon={Clock} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" aria-hidden="true" /> Planning officiel
        </h2>

        {intervLoading && <p className="text-muted-foreground text-sm">Chargement…</p>}

        {!intervLoading && upcoming.length === 0 && past.length === 0 && (
          <p className="text-muted-foreground text-sm py-4 text-center">Aucune intervention planifiée.</p>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">À venir</p>
            {upcoming.map(i => (
              <IntervRow
                key={i.id}
                interv={i}
                onOpen={() => openIncident(i.incident_id)}
                onRequestModif={() => { setEditingInterv(i); setModifComment(i.comment ?? ''); }}
              />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passées / Résolues</p>
            {past.map(i => (
              <IntervRow key={i.id} interv={i} onOpen={() => openIncident(i.incident_id)} />
            ))}
          </div>
        )}

        {editingInterv && (
          <Card className="mt-3 border-orange-300">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" aria-hidden="true" />
                  Demande de modification du planning
                </p>
                <button onClick={() => setEditingInterv(null)} aria-label="Fermer">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <Textarea
                value={modifComment}
                onChange={e => setModifComment(e.target.value)}
                placeholder="Ex : Impossible d'intervenir ce jour-là…"
                className="min-h-[80px]"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setEditingInterv(null)}>Annuler</Button>
                <Button size="sm" onClick={handleSendModifRequest} disabled={sendingComment || !modifComment.trim()}>
                  {sendingComment ? 'Envoi…' : 'Envoyer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Incidents assignés</h2>
        {incLoading && <p className="text-muted-foreground text-sm">Chargement…</p>}
        {incError && <p className="text-destructive text-sm">{incError}</p>}

        {toStart.length > 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">À démarrer</p>
            {toStart.map(s => <SignalementCard key={s.id} signalement={s} onClick={() => setSelected(s)} />)}
          </div>
        )}

        {inProgress.length > 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">En cours</p>
            {inProgress.map(s => <SignalementCard key={s.id} signalement={s} onClick={() => setSelected(s)} />)}
          </div>
        )}

        {done.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terminés</p>
            {done.map(s => <SignalementCard key={s.id} signalement={s} onClick={() => setSelected(s)} />)}
          </div>
        )}

        {!incLoading && incidents.length === 0 && (
          <p className="text-muted-foreground text-sm py-4 text-center">Aucun incident assigné.</p>
        )}
      </div>
    </div>
  );
};

function IntervRow({
  interv,
  onOpen,
  onRequestModif,
}: {
  interv: InterventionWithIncident;
  onOpen?: () => void;
  onRequestModif?: () => void;
}) {
  const isResolved = !!interv.resolved_at;
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = !isResolved && interv.scheduled_date < today;

  return (
    <Card
      className={cn('transition-shadow cursor-pointer hover:shadow-md', isResolved && 'opacity-60')}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.()}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn(
          'w-2 h-2 rounded-full shrink-0',
          isResolved ? 'bg-green-400' : isOverdue ? 'bg-red-400' : 'bg-orange-400'
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">
              {new Date(interv.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {interv.incident_ref_code && (
              <span className="text-xs text-muted-foreground">{interv.incident_ref_code}</span>
            )}
            {isResolved && <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded-full">Résolu</span>}
            {isOverdue && <span className="text-xs bg-red-100 text-red-700 px-1.5 rounded-full">En retard</span>}
          </div>
          {interv.incident_description && (
            <p className="text-xs text-foreground mt-0.5 truncate">{interv.incident_description}</p>
          )}
          {interv.comment && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">« {interv.comment} »</p>
          )}
        </div>
        {onRequestModif && !isResolved && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onRequestModif(); }}
            aria-label="Demander une modification de planning"
          >
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default AgentTasksPage;
