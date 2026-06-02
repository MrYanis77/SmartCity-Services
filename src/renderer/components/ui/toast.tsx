import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg bg-card transition-all animate-scale-in',
            t.variant === 'destructive'
              ? 'border-destructive/50 bg-destructive/10'
              : 'border-border'
          )}
        >
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-sm font-semibold',
                t.variant === 'destructive' ? 'text-destructive' : 'text-foreground'
              )}
            >
              {t.title}
            </p>
            {t.description && (
              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
