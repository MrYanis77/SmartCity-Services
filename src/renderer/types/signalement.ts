/**
 * Types et constantes des signalements — alignés sur le schéma de la base de données.
 *
 * Les valeurs correspondent exactement à celles stockées en SQLite
 * (colonnes ENUM du schéma Knex) pour éviter tout mapping superflu.
 */

/** Statuts possibles d'un incident — correspond à la colonne `status` en DB */
export type SignalementStatus =
  | 'nouveau'
  | 'en_attente'
  | 'en_cours'
  | 'resolu'
  | 'ferme'
  | 'rejete';

/** Catégories d'incident — correspond à la colonne `category` en DB */
export type SignalementCategory = 'voirie' | 'proprete' | 'securite' | 'autre';

/** Niveaux de priorité — correspond à la colonne `priority` en DB */
export type SignalementPriority = 'faible' | 'moyen' | 'urgent' | 'critique';

/** Structure complète d'un incident renvoyé par l'API */
export interface Signalement {
  id: number;
  ref_code: string | null;
  citizen_id: number | null;
  agent_id?: number | null;
  category: SignalementCategory;
  subcategory: string | null;
  priority: SignalementPriority;
  description: string | null;
  photo_path?: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  status: SignalementStatus;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

export const STATUS_LABELS: Record<SignalementStatus, string> = {
  nouveau:    'Nouveau',
  en_attente: 'En attente',
  en_cours:   'En cours',
  resolu:     'Résolu',
  ferme:      'Fermé',
  rejete:     'Rejeté',
};

export const CATEGORY_LABELS: Record<SignalementCategory, string> = {
  voirie:   'Voirie',
  proprete: 'Propreté',
  securite: 'Sécurité',
  autre:    'Autre',
};

export const CATEGORY_SUBCATEGORIES: Record<SignalementCategory, string[]> = {
  voirie:   ['Nid-de-poule', 'Trottoir endommagé', 'Signalisation défectueuse', 'Éclairage défaillant'],
  proprete: ['Dépôt sauvage', 'Graffiti', 'Poubelle pleine', 'Encombrants'],
  securite: ['Mobilier urbain dégradé', 'Bâtiment dangereux', 'Végétation envahissante', 'Autre danger'],
  autre:    ['Bruit excessif', 'Problème de voisinage', 'Autre'],
};

export const PRIORITY_LABELS: Record<SignalementPriority, string> = {
  faible:   'Faible',
  moyen:    'Normal',
  urgent:   'Urgent',
  critique: 'Critique',
};

/**
 * Statuts vers lesquels un agent/responsable peut faire évoluer un incident.
 * Clé = statut courant, Valeur = statuts accessibles depuis ce statut.
 */
export const STATUS_TRANSITIONS: Partial<Record<SignalementStatus, SignalementStatus[]>> = {
  nouveau:    ['en_attente', 'en_cours', 'rejete'],
  en_attente: ['en_cours', 'rejete'],
  en_cours:   ['resolu', 'rejete'],
  resolu:     ['ferme'],
};
