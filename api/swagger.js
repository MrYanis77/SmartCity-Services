/**
 * Configuration Swagger UI — charge openapi.yaml et monte l'interface.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';
import swaggerUi from 'swagger-ui-express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const specPath = path.join(__dirname, 'openapi.yaml');
const openapiDocument = yaml.parse(fs.readFileSync(specPath, 'utf8'));

export const swaggerSpec = openapiDocument;

export const swaggerUiOptions = {
  customSiteTitle: 'Smart City API — Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
};

export { swaggerUi };
