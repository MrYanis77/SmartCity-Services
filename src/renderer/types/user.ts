/**
 * Types partagés pour les utilisateurs et les interventions.
 */
import { UserRole } from '@/contexts/AuthContext';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  anonymized_at: string | null;
  consent_at: string | null;
}

export interface Intervention {
  id: number;
  incident_id: number;
  agent_id: number;
  scheduled_date: string;
  comment: string | null;
  photo_result_path: string | null;
  resolved_at: string | null;
}

/** Intervention avec champs incident joints par l'API (GET /api/interventions). */
export interface InterventionWithIncident extends Intervention {
  incident_ref_code?: string | null;
  incident_description?: string | null;
  incident_status?: string | null;
  incident_address?: string | null;
  incident_category?: string | null;
  incident_priority?: string | null;
}
