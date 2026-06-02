/**
 * Vue détaillée d'un signalement.
 *
 * Affiche toutes les informations d'un incident et, pour les agents /
 * responsables / admins, permet de changer le statut avec un commentaire d'audit.
 * La mise à jour appelle PATCH /api/incidents/:id et déclenche `onUpdate` pour
 * rafraîchir la liste parente — c'est ainsi que les changements d'un agent
 * deviennent visibles pour le citoyen.
 *
 * @param signalement - L'objet incident complet.
 * @param onClose     - Callback pour revenir à la liste.
 * @param onUpdate    - Callback optionnel appelé après une mise à jour réussie.
 */
import { useState } from 'react';
import {
  Signalement,
  STATUS_LABELS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_TRANSITIONS,
  SignalementStatus,
} from '@/types/signalement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Tag, Hash, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LocationMap } from '@/components/LocationMap';
import { getPhotoUrl } from '@/lib/media';

const API_URL = (window as any).electronAPI?.apiUrl ?? 'http://localhost:3000';

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

interface SignalementDetailProps {
  signalement: Signalement;
  onClose: () => void;
  onUpdate?: () => void;
}

export function SignalementDetail({ signalement: s, onClose, onUpdate }: SignalementDetailProps) {
  const { user, authFetch } = useAuth();
  const { toast } = useToast();

  // État du formulaire de mise à jour de statut
  const [newStatus, setNewStatus]   = useState<SignalementStatus | ''>('');
  const [comment, setComment]       = useState('');
  const [updating, setUpdating]     = useState(false);

  /** Statuts disponibles depuis le statut courant (vide si aucune transition possible) */
  const availableStatuses = STATUS_TRANSITIONS[s.status] ?? [];

  /** Peut-on mettre à jour le statut ? Oui si agent / responsable / admin */
  const canUpdate = user && user.role !== 'citoyen' && availableStatuses.length > 0;
  const photoUrl = getPhotoUrl(s.photo_path);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const res = await authFetch(`${API_URL}/api/incidents/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, audit_comment: comment || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Erreur lors de la mise à jour');
      }
      toast({ title: 'Statut mis à jour', description: `L'incident est maintenant « ${STATUS_LABELS[newStatus]} ».` });
      setNewStatus('');
      setComment('');
      onUpdate?.();  // Rafraîchit la liste parente (visible pour le citoyen au rechargement)
      onClose();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="-ml-2"
        aria-label="Retour à la liste des signalements"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour à la liste
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              {s.ref_code && (
                <p className="text-xs text-muted-foreground font-mono mb-1">{s.ref_code}</p>
              )}
              <CardTitle className="text-lg">
                {CATEGORY_LABELS[s.category]}{s.subcategory ? ` — ${s.subcategory}` : ''}
              </CardTitle>
            </div>
            <span
              className={cn(
                'shrink-0 text-sm px-3 py-1 rounded-full font-medium',
                STATUS_STYLES[s.status] ?? 'bg-gray-100 text-gray-600'
              )}
            >
              {STATUS_LABELS[s.status]}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Description
            </p>
            <p className="text-sm text-foreground leading-relaxed">{s.description ?? '—'}</p>
          </div>

          {/* Photo si disponible — servie via /api/images pour éviter le blocage file:// */}
          {photoUrl && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Image className="h-3.5 w-3.5" aria-hidden="true" /> Photo
              </p>
              <img
                src={photoUrl}
                alt="Photo du signalement"
                className="max-h-64 rounded-lg object-cover border border-border w-full max-w-md"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  img.insertAdjacentHTML('afterend', '<p class="text-sm text-muted-foreground">Photo indisponible</p>');
                }}
              />
            </div>
          )}

          {/* Grille d'informations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {s.address && <InfoItem icon={MapPin} label="Adresse" value={s.address} />}
            <InfoItem
              icon={AlertTriangle}
              label="Priorité"
              value={PRIORITY_LABELS[s.priority]}
              valueClass={PRIORITY_STYLES[s.priority]}
            />
            <InfoItem
              icon={Calendar}
              label="Créé le"
              value={new Date(s.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            />
            <InfoItem
              icon={Calendar}
              label="Mis à jour"
              value={new Date(s.updated_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            />
            <InfoItem icon={Tag} label="Catégorie" value={`${CATEGORY_LABELS[s.category]}${s.subcategory ? ` · ${s.subcategory}` : ''}`} />
            {s.agent_id && (
              <InfoItem icon={Hash} label="Agent assigné" value={`Agent #${s.agent_id}`} />
            )}
          </div>

          {/* Carte OpenStreetMap — visible si lat/lng disponibles ou si une adresse est renseignée */}
          {(s.address || (s.latitude !== 0 && s.longitude !== 0)) && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Carte
              </p>
              <LocationMap
                address={s.address ?? ''}
                latitude={s.latitude}
                longitude={s.longitude}
                height={240}
              />
            </div>
          )}

          {/* Mise à jour du statut — visible uniquement pour agent / responsable / admin */}
          {canUpdate && (
            <div className="pt-4 border-t border-border space-y-3">
              <p className="text-sm font-semibold text-foreground">Mettre à jour le statut</p>
              <div>
                <Label htmlFor="new-status">Nouveau statut</Label>
                <Select value={newStatus} onValueChange={v => setNewStatus(v as SignalementStatus)}>
                  <SelectTrigger id="new-status" className="mt-1.5">
                    <SelectValue placeholder="Choisir un statut…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map(st => (
                      <SelectItem key={st} value={st}>{STATUS_LABELS[st]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="audit-comment">Commentaire (facultatif)</Label>
                <Textarea
                  id="audit-comment"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Ex : Intervention planifiée pour le 12/06…"
                  className="mt-1.5 min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updating}
                className="w-full"
              >
                {updating ? 'Mise à jour…' : 'Confirmer la mise à jour'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Composant interne — ligne label + valeur avec icône */
function InfoItem({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium text-foreground', valueClass)}>{value}</p>
      </div>
    </div>
  );
}
