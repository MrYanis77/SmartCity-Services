/**
 * Migration : ajout des champs d'authentification et de consentement RGPD sur la table `users`.
 *
 * Champs ajoutés :
 *   - refresh_token  TEXT nullable — token de renouvellement JWT (stocké haché en production).
 *   - consent_at     DATETIME nullable — date d'acceptation explicite des CGU / politique RGPD.
 *                    NULL = pas encore recueilli (comptes existants avant RGPD).
 */

/** @param { import("knex").Knex } knex */
export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    // Token de refresh JWT — doit être révoqué à la déconnexion et à l'expiration
    table.text('refresh_token').nullable();

    // Date de consentement explicite RGPD (obligatoire pour les nouveaux comptes)
    table.datetime('consent_at').nullable();
  });
}

/** @param { import("knex").Knex } knex */
export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('refresh_token');
    table.dropColumn('consent_at');
  });
}
