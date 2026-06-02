/**
 * Audit rapide des endpoints par profil — npm run audit:api
 */
import 'dotenv/config';
import express from 'express';
import authRoutes from '../../api/routes/auth.js';
import incidentRoutes from '../../api/routes/incidents.js';
import interventionRoutes from '../../api/routes/interventions.js';
import userRoutes from '../../api/routes/users.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/users', userRoutes);

const ACCOUNTS = [
  ['marie@example.com', 'citoyen'],
  ['luc@mairie.fr', 'agent'],
  ['jean@mairie.fr', 'responsable'],
  ['admin@mairie.fr', 'admin'],
];

async function login(email) {
  const r = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo' }),
  });
  if (!r.ok) throw new Error(`Login ${email}: ${r.status}`);
  return r.json();
}

async function call(token, method, path, body) {
  const r = await fetch(`http://127.0.0.1:${PORT}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}

let PORT;

const server = app.listen(0, async () => {
  PORT = server.address().port;
  const tokens = {};
  for (const [email] of ACCOUNTS) {
    tokens[email] = (await login(email)).accessToken;
  }

  const marie = tokens['marie@example.com'];
  const luc = tokens['luc@mairie.fr'];
  const jean = tokens['jean@mairie.fr'];
  const admin = tokens['admin@mairie.fr'];

  const checks = [
    ['marie POST incident', () => call(marie, 'POST', '/api/incidents', {
      category: 'voirie', subcategory: 'Nid-de-poule', priority: 'moyen', description: 'audit', address: 'Paris',
    })],
    ['marie GET incidents', () => call(marie, 'GET', '/api/incidents')],
    ['marie GET interventions', () => call(marie, 'GET', '/api/interventions')],
    ['luc GET incidents', () => call(luc, 'GET', '/api/incidents')],
    ['luc GET interventions', () => call(luc, 'GET', '/api/interventions')],
    ['jean POST intervention', () => call(jean, 'POST', '/api/interventions', {
      incident_id: 7, agent_id: 10, scheduled_date: '2026-06-05', comment: 'audit',
    })],
    ['admin POST intervention', () => call(admin, 'POST', '/api/interventions', {
      incident_id: 7, agent_id: 10, scheduled_date: '2026-06-05',
    })],
    ['admin GET users', () => call(admin, 'GET', '/api/users')],
    ['luc POST incident', () => call(luc, 'POST', '/api/incidents', { category: 'voirie' })],
  ];

  console.log('=== Audit API (port', PORT, ') ===');
  for (const [label, fn] of checks) {
    const { status, data } = await fn();
    const extra = Array.isArray(data) ? `[${data.length} items]` : (data?.citizen_id ?? data?.error ?? '');
    console.log(`${label}: ${status}`, extra);
  }

  server.close();
});
