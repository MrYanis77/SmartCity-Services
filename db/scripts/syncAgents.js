/**
 * Répare incidents.agent_id à partir des interventions existantes.
 * Usage : npm run sync:agents
 */
import 'dotenv/config';
import knex from 'knex';
import knexConfig from '../../knexfile.js';
import * as interventionService from '../../api/services/interventionService.js';

const db = knex(knexConfig.development);

try {
  await interventionService.syncAllAgentAssignments();
  console.log('[sync:agents] incidents.agent_id synchronisés avec succès');
} catch (err) {
  console.error('[sync:agents] Erreur :', err.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
