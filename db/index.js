// db/index.js - Connexion Knex centralisée
import knex from 'knex';
import knexfile from '../knexfile.js';

const config = knexfile[process.env.NODE_ENV || 'development'];
const db = knex(config);

export default db;
