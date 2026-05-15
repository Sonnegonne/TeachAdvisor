# TeachAdvisor v2.0 — Node.js/Express

Système de retours anonymes pour enseignants.
Converti de PHP vers **Node.js + Express**, même technologie que `botDiscord-Lock`.

---

## Structure du projet

```
teachAdvisor/
├── index.js                  # Point d'entrée
├── package.json
├── ecosystem.config.js       # Config PM2
├── nginx.conf.example        # Bloc nginx à intégrer
├── .env.example              # Variables d'environnement (copier → .env)
├── .gitignore
├── src/
│   └── server.js             # Serveur Express + toutes les routes API
├── data/
│   ├── codes.json            # Codes d'accès élèves (30 codes)
│   └── feedback.json         # Avis enregistrés (vide au départ)
└── public/                   # Frontend statique servi par Express
    ├── index.html            # Page élève (formulaire)
    ├── admin.html            # Dashboard administrateur
    ├── css/
    │   └── style.css         # Styles complets
    ├── js/
    │   ├── script.js         # Logique page élève
    │   └── admin.js          # Logique dashboard admin
    └── asset/
        └── fav.png           # ← À FOURNIR (favicon)
```

---

## Routes API

| Méthode  | Route                               | Description                      |
|----------|-------------------------------------|----------------------------------|
| POST     | `/teachAdvisor/api/login`           | Connexion admin                  |
| POST     | `/teachAdvisor/api/logout`          | Déconnexion                      |
| GET      | `/teachAdvisor/api/auth-check`      | Vérifier la session              |
| POST     | `/teachAdvisor/api/feedback`        | Soumettre un avis (élève)        |
| GET      | `/teachAdvisor/api/admin/feedback`  | Lire tous les avis (admin)       |
| DELETE   | `/teachAdvisor/api/admin/feedback`  | Supprimer tous les avis (admin)  |
| GET      | `/teachAdvisor/api/admin/codes`     | Voir les codes (admin)           |
| POST     | `/teachAdvisor/api/admin/codes/reset` | Réinitialiser les codes (admin) |

---

## Installation sur le serveur

```bash
# 1. Copier le dossier sur le serveur
scp -r ./teachAdvisor user@studio-dach.site:/var/www/

# 2. Sur le serveur
cd /var/www/teachAdvisor
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
nano .env
# → Définir ADMIN_PASSWORD et SESSION_SECRET

# 4. Lancer avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # démarrage automatique au reboot

# 5. Ajouter le bloc nginx
sudo nano /etc/nginx/sites-available/studio-dach.site
# → Copier le contenu de nginx.conf.example dans le server{}

sudo nginx -t && sudo systemctl reload nginx
```

---

## Accès

- **Page élève** : `https://studio-dach.site/teachAdvisor`
- **Admin**       : `https://studio-dach.site/teachAdvisor/admin.html`

---

## PM2 — commandes utiles

```bash
pm2 status                   # État
pm2 logs teach-advisor       # Logs en temps réel
pm2 restart teach-advisor    # Redémarrer
pm2 stop teach-advisor       # Arrêter
```