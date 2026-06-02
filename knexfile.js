/**
 * Configuration Knex — gestion de la base de données SQLite.
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'smartcity.sqlite');

export default {
  development: {
    client: 'sqlite3',
    connection: { filename: DB_PATH },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
  },

  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
  },

  production: {
    client: 'sqlite3',
    connection: { filename: DB_PATH },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
  },
};
