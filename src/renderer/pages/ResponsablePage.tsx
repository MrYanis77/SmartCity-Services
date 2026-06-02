/**
 * Page Responsable — gestion des agents et du planning des interventions.
 *
 * Deux onglets :
 *   1. Agents      — liste des agents, ajout et suppression de compte agent.
 *   2. Planning    — calendrier des interventions, création, modification, suppression.
 *                    Un responsable peut associer un agent à un incident et fixer une date.
 *
 * Accessible au rôle `responsable` uniquement.
 */
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useInterventions } from '@/hooks/useInterventions';
import { useIncidents } from '@/hooks/useIncidents';
import { User, Intervention } from '@/types/user';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types/signalement';
import { getPhotoUrl } from '@/lib/media';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Calendar, Plus, X, Pencil, CheckCircle, Clock, Bell, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

/** Formulaire d'intervention vide */
const emptyIntervForm = () => ({ incident_id: '', agent_id: '', scheduled_date: '', comment: '' });

/** Formulaire d'agent vide */
const emptyAgentForm = () => ({ full_name: '', email: '', password: '', phone: '' });

const ResponsablePage = () => {
  const { authFetch } = useAuth();
  const { toast }     = useToast();

  const [tab, setTab] = useState<'agents' | 'planning'>('agents');

  // ── Onglet Agents ─────────────────────────────────────────────────────────
  const { users: agents, loading: agentsLoading, refresh: refreshAgents } = useUsers('agent');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentForm, setAgentForm]         = useState(emptyAgentForm());
  const [savingAgent, setSavingAgent]     = useState(false);

  const handleCreateAgent = async () => {
    if (!agentForm.full_name || !agentForm.email || !agentForm.password) {
      toast({ title: 'Champs requis', description: 'Nom, email et mot de passe sont obligatoires.', variant: 'destructive' });
      return;
    }
    setSavingAgent(true);
    try {
      const res = await authFetch(`${API_URL}/api/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...agentForm, role: 'agent', consent: true }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Erreur'); }
      toast({ title: 'Agent créé avec succès' });
      setAgentForm(emptyAgentForm());
      setShowAgentForm(false);
      refreshAgents();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setSavingAgent(false);
    }
  };

  const handleDeleteAgent = async (u: User) => {
    if (!confirm(`Supprimer l'agent ${u.full_name} ? Cette action est irréversible.`)) return;
    try {
      const res = await authFetch(`${API_URL}/api/users/${u.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Agent supprimé' });
      refreshAgents();
    } catch { toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }); }
  };

  // ── Onglet Planning ────────────────────────────────────────────────────────
  const { interventions, loading: intervLoading, refresh: refreshInterv } = useInterventions();
  const { incidents, loading: incLoading, refresh: refreshIncidents } = useIncidents();
  const [showIntervForm, setShowIntervForm]                                 = useState(false);
  const [editingInterv, setEditingInterv]                                   = useState<Intervention | null>(null);
  const [intervForm, setIntervForm]                                         = useState(emptyIntervForm());
  const [savingInterv, setSavingInterv]                                     = useState(false);
  const [expandedAssignId, setExpandedAssignId]                             = useState<number | null>(null);
  const [quickAgentId, setQuickAgentId]                                     = useState('');
  const [quickDate, setQuickDate]                                           = useState(() => new Date().toISOString().split('T')[0]);
  const [quickSaving, setQuickSaving]                                       = useState(false);

  // Filtre planning par agent
  const [agentFilter, setAgentFilter] = useState('');
  const filteredInterv = agentFilter
    ? interventions.filter(i => String(i.agent_id) === agentFilter)
    : interventions;

  /** Signalements ouverts sans intervention active — à assigner aux agents */
  const incidentsToAssign = useMemo(() => {
    const closed = new Set(['resolu', 'ferme', 'rejete']);
    return incidents
      .filter((inc) => !closed.has(inc.status))
      .filter((inc) => !interventions.some((i) => i.incident_id === inc.id && !i.resolved_at))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [incidents, interventions]);

  useEffect(() => {
    if (tab === 'planning') {
      refreshIncidents();
      refreshInterv();
    }
  }, [tab, refreshIncidents, refreshInterv]);

  const openAssignForIncident = (incidentId: number) => {
    setExpandedAssignId(incidentId);
    setQuickAgentId('');
    setQuickDate(new Date().toISOString().split('T')[0]);
  };

  const handleQuickAssign = async (incidentId: number) => {
    if (!quickAgentId || !quickDate) {
      toast({ title: 'Champs requis', description: 'Choisissez un agent et une date.', variant: 'destructive' });
      return;
    }
    setQuickSaving(true);
    try {
      const res = await authFetch(`${API_URL}/api/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          agent_id: Number(quickAgentId),
          scheduled_date: quickDate,
          comment: null,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'Erreur lors de l\'assignation');
      }
      toast({ title: 'Agent assigné', description: 'L\'intervention a été planifiée.' });
      setExpandedAssignId(null);
      setQuickAgentId('');
      refreshInterv();
      refreshIncidents();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setQuickSaving(false);
    }
  };

  const openCreateInterv = () => {
    setEditingInterv(null);
    setIntervForm(emptyIntervForm());
    setShowIntervForm(true);
  };

  const openEditInterv = (interv: Intervention) => {
    setEditingInterv(interv);
    setIntervForm({
      incident_id: String(interv.incident_id),
      agent_id: String(interv.agent_id),
      scheduled_date: interv.scheduled_date,
      comment: interv.comment ?? '',
    });
    setShowIntervForm(true);
  };

  const closeIntervForm = () => { setShowIntervForm(false); setEditingInterv(null); setIntervForm(emptyIntervForm()); };

  const handleSaveInterv = async () => {
    if (!intervForm.incident_id || !intervForm.agent_id || !intervForm.scheduled_date) {
      toast({ title: 'Champs requis', description: 'Incident, agent et date sont obligatoires.', variant: 'destructive' });
      return;
    }
    setSavingInterv(true);
    try {
      const url    = editingInterv ? `${API_URL}/api/interventions/${editingInterv.id}` : `${API_URL}/api/interventions`;
      const method = editingInterv ? 'PATCH' : 'POST';
      const body   = {
        incident_id: Number(intervForm.incident_id),
        agent_id:    Number(intervForm.agent_id),
        scheduled_date: intervForm.scheduled_date,
        comment: intervForm.comment || null,
      };
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Erreur'); }
      toast({ title: editingInterv ? 'Intervention mise à jour' : 'Intervention planifiée' });
      closeIntervForm();
      refreshInterv();
      refreshIncidents();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setSavingInterv(false);
    }
  };

  const handleDeleteInterv = async (id: number) => {
    if (!confirm('Supprimer cette intervention du planning ?')) return;
    try {
      const res = await authFetch(`${API_URL}/api/interventions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast({ title: 'Intervention supprimée' });
      refreshInterv();
      refreshIncidents();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  const handleResolve = async (interv: Intervention) => {
    try {
      const res = await authFetch(`${API_URL}/api/interventions/${interv.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Intervention marquée comme résolue' });
      refreshInterv();
      refreshIncidents();
    } catch { toast({ title: 'Erreur', variant: 'destructive' }); }
  };

  // Helpers pour affichage
  const agentName = (id: number) => agents.find(a => a.id === id)?.full_name ?? `Agent #${id}`;
  const incidentRef = (id: number) => {
    const inc = incidents.find(i => i.id === id);
    return inc ? (inc.ref_code ?? `#${id}`) + ' — ' + (inc.description?.slice(0, 40) ?? '') : `Incident #${id}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Agents & Planning</h1>
        <p className="text-muted-foreground">Gérez les agents terrain et planifiez leurs interventions.</p>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-border">
        {(['agents', 'planning'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'agents' ? 'Agents' : 'Planning'}
          </button>
        ))}
      </div>

      {/* ── Onglet Agents ── */}
      {tab === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{agents.length} agent{agents.length > 1 ? 's' : ''} enregistré{agents.length > 1 ? 's' : ''}</p>
            <Button onClick={() => setShowAgentForm(v => !v)} size="sm">
              {showAgentForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {showAgentForm ? 'Fermer' : 'Ajouter un agent'}
            </Button>
          </div>

          {/* Formulaire création agent */}
          {showAgentForm && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nouvel agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ag-name">Nom complet *</Label>
                    <Input id="ag-name" value={agentForm.full_name} onChange={e => setAgentForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="ag-email">Email *</Label>
                    <Input id="ag-email" type="email" value={agentForm.email} onChange={e => setAgentForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="ag-pwd">Mot de passe *</Label>
                    <Input id="ag-pwd" type="password" value={agentForm.password} onChange={e => setAgentForm(f => ({ ...f, password: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="ag-phone">Téléphone</Label>
                    <Input id="ag-phone" value={agentForm.phone} onChange={e => setAgentForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="+33 6 …" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAgentForm(false)}>Annuler</Button>
                  <Button onClick={handleCreateAgent} disabled={savingAgent}>{savingAgent ? 'Création…' : 'Créer l\'agent'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste agents */}
          {agentsLoading && <p className="text-muted-foreground text-sm">Chargement…</p>}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {!agentsLoading && agents.length === 0 && (
                  <p className="p-6 text-center text-sm text-muted-foreground">Aucun agent enregistré.</p>
                )}
                {agents.map(a => (
                  <div key={a.id} className={cn('flex items-center gap-3 p-4', !a.is_active && 'opacity-50')}>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs shrink-0">
                      {a.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {interventions.filter(i => i.agent_id === a.id && !i.resolved_at).length} intervention(s)
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(a)} aria-label={`Supprimer ${a.full_name}`}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Onglet Planning ── */}
      {tab === 'planning' && (
        <div className="space-y-6">
          {/* Signalements en attente d'assignation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">
                Signalements à assigner
                {!incLoading && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({incidentsToAssign.length})
                  </span>
                )}
              </h2>
            </div>
            {incLoading && <p className="text-muted-foreground text-sm">Chargement des signalements…</p>}
            {!incLoading && incidentsToAssign.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                Aucun signalement en attente d&apos;assignation.
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {incidentsToAssign.map((inc) => {
                const photoUrl = getPhotoUrl(inc.photo_path);
                return (
                  <Card key={inc.id} className="border-orange-200/60">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex gap-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt=""
                            className="w-16 h-16 rounded-md object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Image className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-muted-foreground">{inc.ref_code ?? `#${inc.id}`}</p>
                          <p className="text-sm font-medium truncate">
                            {CATEGORY_LABELS[inc.category]}{inc.subcategory ? ` — ${inc.subcategory}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{inc.description}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                              {STATUS_LABELS[inc.status]}
                            </span>
                            {inc.address && (
                              <span className="text-xs text-muted-foreground truncate max-w-[180px]">{inc.address}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        variant={expandedAssignId === inc.id ? 'outline' : 'default'}
                        onClick={() => expandedAssignId === inc.id ? setExpandedAssignId(null) : openAssignForIncident(inc.id)}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        {expandedAssignId === inc.id ? 'Annuler' : 'Assigner à un agent'}
                      </Button>
                      {expandedAssignId === inc.id && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border">
                          <Select value={quickAgentId} onValueChange={setQuickAgentId}>
                            <SelectTrigger aria-label="Agent"><SelectValue placeholder="Agent" /></SelectTrigger>
                            <SelectContent>
                              {agents.map(a => (
                                <SelectItem key={a.id} value={String(a.id)}>{a.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="date"
                            value={quickDate}
                            onChange={e => setQuickDate(e.target.value)}
                            aria-label="Date planifiée"
                          />
                          <Button
                            onClick={() => handleQuickAssign(inc.id)}
                            disabled={quickSaving || !quickAgentId || !quickDate}
                          >
                            {quickSaving ? 'Assignation…' : 'Confirmer'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={agentFilter || 'all'} onValueChange={v => setAgentFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[200px]" aria-label="Filtrer par agent">
                <SelectValue placeholder="Tous les agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les agents</SelectItem>
                {agents.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="ml-auto">
              <Button size="sm" onClick={openCreateInterv}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Planifier une intervention
              </Button>
            </div>
          </div>

          {/* Formulaire création/édition intervention */}
          {showIntervForm && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{editingInterv ? 'Modifier l\'intervention' : 'Nouvelle intervention'}</CardTitle>
                  <button onClick={closeIntervForm} aria-label="Fermer"><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="iv-inc">Incident *</Label>
                    <Select value={intervForm.incident_id} onValueChange={v => setIntervForm(f => ({ ...f, incident_id: v }))}>
                      <SelectTrigger id="iv-inc" className="mt-1"><SelectValue placeholder="Sélectionner un incident" /></SelectTrigger>
                      <SelectContent>
                        {incidents.filter(i => !['resolu', 'ferme', 'rejete'].includes(i.status)).map(i => (
                          <SelectItem key={i.id} value={String(i.id)}>
                            {i.ref_code ?? `#${i.id}`} — {i.description?.slice(0, 35) ?? ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="iv-ag">Agent *</Label>
                    <Select value={intervForm.agent_id} onValueChange={v => setIntervForm(f => ({ ...f, agent_id: v }))}>
                      <SelectTrigger id="iv-ag" className="mt-1"><SelectValue placeholder="Sélectionner un agent" /></SelectTrigger>
                      <SelectContent>
                        {agents.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="iv-date">Date planifiée *</Label>
                    <Input id="iv-date" type="date" value={intervForm.scheduled_date} onChange={e => setIntervForm(f => ({ ...f, scheduled_date: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="iv-comment">Instructions / commentaire</Label>
                    <Textarea id="iv-comment" value={intervForm.comment} onChange={e => setIntervForm(f => ({ ...f, comment: e.target.value }))} className="mt-1 min-h-[80px]" placeholder="Instructions pour l'agent…" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeIntervForm}>Annuler</Button>
                  <Button onClick={handleSaveInterv} disabled={savingInterv}>{savingInterv ? 'Enregistrement…' : (editingInterv ? 'Mettre à jour' : 'Planifier')}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des interventions planifiées */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-3">Interventions planifiées</h2>
          {intervLoading && <p className="text-muted-foreground text-sm">Chargement…</p>}
          <div className="space-y-3">
            {!intervLoading && filteredInterv.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-8">Aucune intervention planifiée.</p>
            )}
            {filteredInterv.map(interv => (
              <Card key={interv.id} className={cn(interv.resolved_at && 'opacity-60')}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                      interv.resolved_at ? 'bg-green-100' : 'bg-orange-100')}>
                      {interv.resolved_at
                        ? <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                        : <Clock className="h-4 w-4 text-orange-500" aria-hidden="true" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-medium text-foreground">{agentName(interv.agent_id)}</p>
                        <span className="text-xs text-muted-foreground">·</span>
                        <p className="text-xs text-muted-foreground">{new Date(interv.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}</p>
                        {interv.resolved_at && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Résolu</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{incidentRef(interv.incident_id)}</p>
                      {interv.comment && <p className="text-xs text-muted-foreground italic">« {interv.comment} »</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!interv.resolved_at && (
                        <Button variant="ghost" size="sm" onClick={() => handleResolve(interv)} aria-label="Marquer comme résolu">
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditInterv(interv)} aria-label="Modifier">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteInterv(interv.id)} aria-label="Supprimer">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsablePage;
