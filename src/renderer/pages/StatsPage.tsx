/**
 * Page de statistiques globales sur les signalements.
 *
 * Charge tous les incidents depuis l'API et calcule :
 * - Total, taux de résolution, urgences actives
 * - Répartition par catégorie et par statut (barres de progression)
 */
import { useIncidents } from '@/hooks/useIncidents';
import { StatsCard } from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORY_LABELS, STATUS_LABELS } from '@/types/signalement';
import { BarChart3, TrendingUp, MapPin, AlertTriangle } from 'lucide-react';

const StatsPage = () => {
  const { incidents, loading } = useIncidents();

  const total = incidents.length;

  const resolved = incidents.filter(s => s.status === 'resolu' || s.status === 'ferme').length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) + '%' : '—';

  const activeUrgencies = incidents.filter(
    s => (s.priority === 'urgent' || s.priority === 'critique') &&
         !['resolu', 'ferme', 'rejete'].includes(s.status)
  ).length;

  // Nombre de villes / zones uniques (approximé sur l'adresse)
  const uniqueZones = new Set(
    incidents.map(s => s.address?.split(',').pop()?.trim()).filter(Boolean)
  ).size;

  const byCategory = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    label,
    count: incidents.filter(s => s.category === key).length,
  })).filter(c => c.count > 0);

  const byStatus = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    label,
    count: incidents.filter(s => s.status === key).length,
  })).filter(s => s.count > 0);

  const maxCategory = Math.max(...byCategory.map(c => c.count), 1);
  const maxStatus   = Math.max(...byStatus.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
        <p className="text-muted-foreground">Vue d'ensemble des signalements et interventions.</p>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="Total signalements" value={total}           icon={BarChart3} />
        <StatsCard title="Taux de résolution" value={resolutionRate}  icon={TrendingUp} />
        <StatsCard title="Zones actives"      value={uniqueZones}     icon={MapPin} />
        <StatsCard title="Urgences actives"   value={activeUrgencies} icon={AlertTriangle} />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {byCategory.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée.</p>}
              {byCategory.map(c => (
                <div key={c.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{c.label}</span>
                    <span className="text-muted-foreground font-medium">{c.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(c.count / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Par statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {byStatus.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée.</p>}
              {byStatus.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{s.label}</span>
                    <span className="text-muted-foreground font-medium">{s.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${(s.count / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
