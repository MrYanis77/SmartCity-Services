/**
 * Vue de gestion des signalements pour les responsables et administrateurs.
 *
 * Charge tous les incidents depuis l'API avec filtres dynamiques.
 * Permet de changer le statut depuis le détail (échanges inter-utilisateurs).
 */
import { useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { SignalementCard } from '@/components/SignalementCard';
import { SignalementDetail } from '@/components/SignalementDetail';
import { Signalement, STATUS_LABELS, CATEGORY_LABELS } from '@/types/signalement';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const SignalementsPage = () => {
  const [selected, setSelected]           = useState<Signalement | null>(null);
  const [statusFilter, setStatusFilter]   = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch]               = useState('');

  const { incidents, loading, error, refresh } = useIncidents();

  // Filtrage côté client sur les données chargées
  const filtered = incidents.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchDesc = s.description?.toLowerCase().includes(q);
      const matchRef  = s.ref_code?.toLowerCase().includes(q);
      if (!matchDesc && !matchRef) return false;
    }
    return true;
  });

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
        <h1 className="text-2xl font-bold text-foreground">Signalements</h1>
        <p className="text-muted-foreground">Gérez et modérez les signalements entrants.</p>
      </div>

      <div className="flex flex-wrap gap-3" role="search" aria-label="Filtres de recherche">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="pl-9"
            aria-label="Rechercher dans les signalements"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" aria-label="Filtrer par statut">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]" aria-label="Filtrer par catégorie">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}
      {error   && <p className="text-destructive text-sm">{error}</p>}

      <div className="space-y-3">
        {!loading && filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Aucun signalement trouvé.</p>
        ) : (
          filtered.map(s => (
            <SignalementCard key={s.id} signalement={s} onClick={() => setSelected(s)} />
          ))
        )}
      </div>
    </div>
  );
};

export default SignalementsPage;
