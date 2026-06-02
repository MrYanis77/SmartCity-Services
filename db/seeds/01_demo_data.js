import bcrypt from 'bcryptjs';
import * as interventionService from '../../api/services/interventionService.js';

/**
 * Seed de démonstration — Smart City
 *
 * Comptes alignés sur LoginPage.tsx (mot de passe : demo).
 * Inclut un cas union agent : intervention sans agent_id direct sur incident.
 *
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  await knex('audit_log').del();
  await knex('interventions').del();
  await knex('incidents').del();
  await knex('users').del();

  const demoHash = bcrypt.hashSync('demo', 12);
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  await knex('users').insert([
    {
      email: 'marie@example.com',
      full_name: 'Marie Dupont',
      password_hash: demoHash,
      role: 'citoyen',
      phone: '+33612345678',
      is_active: true,
      consent_at: now,
    },
    {
      email: 'luc@mairie.fr',
      full_name: 'Luc Martin',
      password_hash: demoHash,
      role: 'agent',
      phone: '+33623456789',
      is_active: true,
      consent_at: now,
    },
    {
      email: 'jean@mairie.fr',
      full_name: 'Jean Bernard',
      password_hash: demoHash,
      role: 'responsable',
      phone: '+33634567890',
      is_active: true,
      consent_at: now,
    },
    {
      email: 'admin@mairie.fr',
      full_name: 'Admin Système',
      password_hash: demoHash,
      role: 'admin',
      phone: '+33645678901',
      is_active: true,
      consent_at: now,
    },
  ]);

  const marie = await knex('users').where('email', 'marie@example.com').first();
  const luc = await knex('users').where('email', 'luc@mairie.fr').first();

  const [incident1Id] = await knex('incidents').insert({
    ref_code: 'REF-2024-00001',
    category: 'voirie',
    subcategory: 'Nid-de-poule',
    priority: 'moyen',
    description: 'Nid de poule rue de la Paix',
    latitude: 48.8566,
    longitude: 2.3522,
    address: 'Rue de la Paix, Paris',
    status: 'nouveau',
    citizen_id: marie.id,
    agent_id: luc.id,
    created_at: now,
    updated_at: now,
  });

  const [incident2Id] = await knex('incidents').insert({
    ref_code: 'REF-2024-00002',
    category: 'proprete',
    subcategory: 'Encombrants',
    priority: 'urgent',
    description: 'Encombrants devant le bâtiment',
    latitude: 48.858,
    longitude: 2.359,
    address: 'Boulevard Saint-Germain, Paris',
    status: 'en_cours',
    citizen_id: marie.id,
    agent_id: luc.id,
    created_at: now,
    updated_at: now,
  });

  // Incident assigné à Luc uniquement via intervention (agent_id null au départ)
  const [incident3Id] = await knex('incidents').insert({
    ref_code: 'REF-2024-00003',
    category: 'securite',
    subcategory: 'Mobilier urbain dégradé',
    priority: 'moyen',
    description: 'Banc public cassé au parc',
    latitude: 48.86,
    longitude: 2.35,
    address: 'Parc Central, Paris',
    status: 'en_attente',
    citizen_id: marie.id,
    agent_id: null,
    created_at: now,
    updated_at: now,
  });

  await knex('interventions').insert([
    {
      incident_id: incident2Id,
      agent_id: luc.id,
      scheduled_date: today,
      comment: 'Intervention prévue pour enlever les encombrants',
    },
    {
      incident_id: incident1Id,
      agent_id: luc.id,
      scheduled_date: today,
      comment: 'Réparation nid de poule — matériel prêt',
    },
    {
      incident_id: incident3Id,
      agent_id: luc.id,
      scheduled_date: today,
      comment: 'Remplacement du banc — pièce commandée',
    },
  ]);

  await interventionService.syncAllAgentAssignments();

  console.log('[Seed] Données de démonstration créées avec succès');
}
