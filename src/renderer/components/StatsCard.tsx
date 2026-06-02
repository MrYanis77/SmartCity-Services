/**
 * Carte d'indicateur clé (KPI).
 *
 * Affiche un titre, une valeur numérique ou textuelle, une icône Lucide
 * et une description optionnelle. Utilisée dans les tableaux de bord
 * pour synthétiser des métriques (total, en cours, résolus…).
 *
 * @param title       - Libellé de l'indicateur.
 * @param value       - Valeur à mettre en avant.
 * @param icon        - Composant icône Lucide.
 * @param description - Texte secondaire optionnel.
 */
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
}

export function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ml-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
