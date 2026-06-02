/**
 * Système de notifications toast (pub-sub module-level).
 *
 * `toast()` est une fonction standalone utilisable sans hook React.
 * Elle publie un toast à tous les composants abonnés via `useToast()`.
 * Les toasts disparaissent automatiquement après 4,5 secondes.
 *
 * @example
 * toast({ title: 'Succès', description: 'Enregistrement réussi.' });
 * toast({ title: 'Erreur', variant: 'destructive' });
 */
import { useState, useEffect } from 'react';

export type ToastVariant = 'default' | 'destructive';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

// Module-level pub-sub: permet d'appeler toast() en dehors du cycle React
const subscribers = new Set<(toasts: ToastData[]) => void>();
let currentToasts: ToastData[] = [];

function notify() {
  subscribers.forEach((fn) => fn([...currentToasts]));
}

export function toast(input: ToastInput) {
  const id = Math.random().toString(36).slice(2, 9);
  currentToasts = [...currentToasts, { ...input, id }];
  notify();
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    notify();
  }, 4500);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([...currentToasts]);

  useEffect(() => {
    subscribers.add(setToasts);
    return () => {
      subscribers.delete(setToasts);
    };
  }, []);

  return { toast, toasts };
}
