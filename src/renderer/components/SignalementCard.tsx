/**
 * Carte de résumé d'un signalement.
 *
 * Affiche : badge de statut coloré, référence technique, description (tronquée),
 * catégorie + sous-catégorie, adresse, priorité et date de création.
 *
 * @param signalement - L'objet signalement à afficher.
 * @param onClick     - Callback appelé au clic pour ouvrir le détail.
 */
import { Signalement, STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from '@/types/signalement';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  nouveau:    'bg-blue-100 text-blue-700',
  en_attente: 'bg-yellow-100 text-yellow-700',
  en_cours:   'bg-orange-100 text-orange-700',
  resolu:     'bg-green-100 text-green-700',
  ferme:      'bg-gray-100 text-gray-600',
  rejete:     'bg-red-100 text-red-700',
};

const PRIORITY_STYLES: Record<string, string> = {
  faible:   'text-gray-500',
  moyen:    'text-blue-500',
  urgent:   'text-orange-500',
  critique: 'text-red-700 font-bold',
};

interface SignalementCardProps {
  signalement: Signalement;
  onClick: () => void;
}

export function SignalementCard({ signalement: s, onClick }: SignalementCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-border"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      role="button"
      tabIndex={0}
      aria-label={`Voir le signalement ${s.ref_code ?? s.id} — ${STATUS_LABELS[s.status]}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  STATUS_STYLES[s.status] ?? 'bg-gray-100 text-gray-600'
                )}
              >
                {STATUS_LABELS[s.status]}
              </span>
              {s.ref_code && (
                <span className="text-xs text-muted-foreground font-mono">{s.ref_code}</span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
              {s.description ?? '—'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" aria-hidden="true" />
                {CATEGORY_LABELS[s.category]} {s.subcategory ? `· ${s.subcategory}` : ''}
              </span>
              {s.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {s.address}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={cn('text-xs font-medium', PRIORITY_STYLES[s.priority])}>
              {PRIORITY_LABELS[s.priority]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(s.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
