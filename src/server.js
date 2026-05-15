require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const session = require('express-session');
const path    = require('path');
const fs      = require('fs');

const app = express();

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_PATH      = process.env.BASE_PATH      || '/teachAdvisor';
const PORT           = process.env.PORT           || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const SESSION_SECRET = process.env.SESSION_SECRET || 'changeme_secret';

// Données persistantes dans data/ (à la racine du projet)
const DATA_DIR      = path.join(__dirname, '..', 'data');
const CODES_FILE    = path.join(DATA_DIR, 'codes.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');

// Créer le dossier data/ et les fichiers s'ils n'existent pas
if (!fs.existsSync(DATA_DIR))      fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CODES_FILE))    fs.writeFileSync(CODES_FILE,    JSON.stringify([], null, 2));
if (!fs.existsSync(FEEDBACK_FILE)) fs.writeFileSync(FEEDBACK_FILE, JSON.stringify([], null, 2));

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 8 * 60 * 60 * 1000 }, // 8 heures
}));

// Fichiers statiques : public/
app.use(`${BASE_PATH}`, express.static(path.join(__dirname, '..', 'public')));

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function requireAuth(req, res, next) {
  if (req.session && req.session.adminAuth) return next();
  res.status(401).json({ error: 'Non authentifié' });
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post(`${BASE_PATH}/api/login`, (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' });
  if (password === ADMIN_PASSWORD) {
    req.session.adminAuth = true;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
});

app.post(`${BASE_PATH}/api/logout`, (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get(`${BASE_PATH}/api/auth-check`, (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.adminAuth) });
});

// ─── FEEDBACK — ÉLÈVE ────────────────────────────────────────────────────────
app.post(`${BASE_PATH}/api/feedback`, (req, res) => {
  const data = req.body;
  if (!data || !data.studentCode) {
    return res.status(400).json({ error: 'Données incomplètes.' });
  }

  const inputCode = data.studentCode.trim().toUpperCase();
  const codes = readJSON(CODES_FILE);
  const foundIndex = codes.findIndex(c => c.code.toUpperCase() === inputCode);

  if (foundIndex === -1) return res.status(401).json({ error: 'Code invalide.' });
  if (codes[foundIndex].used) return res.status(403).json({ error: 'Ce code a déjà été utilisé.' });

  // Marquer le code comme utilisé
  codes[foundIndex].used = true;
  writeJSON(CODES_FILE, codes);

  // Enregistrer l'avis sans le code (anonymat)
  const { studentCode, ...feedbackData } = data;
  feedbackData.timestamp = new Date().toISOString();
  const feedbacks = readJSON(FEEDBACK_FILE);
  feedbacks.push(feedbackData);
  writeJSON(FEEDBACK_FILE, feedbacks);

  res.json({ success: true });
});

// ─── ADMIN — FEEDBACK ────────────────────────────────────────────────────────
app.get(`${BASE_PATH}/api/admin/feedback`, requireAuth, (req, res) => {
  res.json(readJSON(FEEDBACK_FILE));
});

app.delete(`${BASE_PATH}/api/admin/feedback`, requireAuth, (req, res) => {
  writeJSON(FEEDBACK_FILE, []);
  res.json({ success: true });
});

// ─── ADMIN — CODES ───────────────────────────────────────────────────────────
app.get(`${BASE_PATH}/api/admin/codes`, requireAuth, (req, res) => {
  res.json(readJSON(CODES_FILE));
});

app.post(`${BASE_PATH}/api/admin/codes/reset`, requireAuth, (req, res) => {
  const codes = readJSON(CODES_FILE).map(c => ({ ...c, used: false }));
  writeJSON(CODES_FILE, codes);
  res.json({ success: true, codes });
});

// ─── CATCH-ALL (SPA) ─────────────────────────────────────────────────────────
app.get(`${BASE_PATH}`, (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
);
app.get(`${BASE_PATH}/*path`, (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
);

// ─── DÉMARRAGE ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎓 TeachAdvisor disponible sur http://localhost:${PORT}${BASE_PATH}`);
  console.log(`   Admin : http://localhost:${PORT}${BASE_PATH}/admin.html`);
});

module.exports = app;