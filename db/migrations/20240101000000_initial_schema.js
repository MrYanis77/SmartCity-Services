/**
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  await knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.enu('role', ['citoyen', 'agent', 'responsable', 'admin']).notNullable();
      table.string('full_name').notNullable();
      table.string('phone').nullable();
      table.boolean('is_active').notNullable().defaultTo(true);
      table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
      table.datetime('anonymized_at').nullable();
    })

    .createTable('incidents', (table) => {
      table.increments('id').primary();
      table.string('ref_code').unique().nullable();
      table.enu('category', ['voirie', 'proprete', 'securite', 'autre']).notNullable();
      table.string('subcategory').nullable();
      table.enu('priority', ['faible', 'moyen', 'urgent', 'critique']).notNullable();
      table.text('description').nullable();
      table.string('photo_path').nullable();
      table.float('latitude').notNullable().defaultTo(0);
      table.float('longitude').notNullable().defaultTo(0);
      table.string('address').nullable();
      table
        .enu('status', ['nouveau', 'en_attente', 'en_cours', 'resolu', 'ferme', 'rejete'])
        .notNullable()
        .defaultTo('nouveau');
      table.integer('citizen_id').notNullable().references('id').inTable('users');
      table.integer('agent_id').nullable().references('id').inTable('users');
      table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
      table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
      table.datetime('closed_at').nullable();
    })

    .createTable('interventions', (table) => {
      table.increments('id').primary();
      table.integer('incident_id').notNullable().references('id').inTable('incidents');
      table.integer('agent_id').notNullable().references('id').inTable('users');
      table.date('scheduled_date').notNullable();
      table.text('comment').nullable();
      table.string('photo_result_path').nullable();
      table.datetime('resolved_at').nullable();
    })

    .createTable('audit_log', (table) => {
      table.increments('id').primary();
      table.integer('incident_id').nullable().references('id').inTable('incidents');
      table.integer('actor_id').nullable().references('id').inTable('users');
      table.string('old_status').nullable();
      table.string('new_status').notNullable();
      table.text('comment').nullable();
      table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    });
}

/**
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema
    .dropTableIfExists('audit_log')
    .dropTableIfExists('interventions')
    .dropTableIfExists('incidents')
    .dropTableIfExists('users');
}
