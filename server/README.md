# ESNAS DRC — Backend API

API Express unifiée (SQL Server) pour polices, sinistres, devis, paiements et auth JWT.

## Démarrage rapide

```bash
# 1. Config
cp server/.env.example server/.env
# Éditer DB_* , JWT_SECRET, CORS_ORIGINS

# 2. Migrations schéma
npm run db:migrate

# 3. Test connexion SQL
npm run db:ping

# 4. Lancer l'API (écoute 0.0.0.0 = Tailscale OK)
npm run server
```

Healthcheck : `http://localhost:5000/api/health`

## Tailscale

L'API écoute sur `0.0.0.0` pour être joignable via IP Tailscale (`100.x.y.z`) ou MagicDNS (`*.ts.net`).

### SQL Server distant via Tailscale

Dans `server/.env` :

```env
DB_SERVER=100.x.y.z
# ou
DB_SERVER=mon-pc.tailxxxx.ts.net
DB_INSTANCE=SQLEXPRESS
# si port fixe TCP :
# DB_PORT=1433
# DB_INSTANCE=
```

### Front vers API Tailscale

Dans `src/.env` :

```env
VITE_API_URL=http://100.x.y.z:5000/api
# ou http://mon-pc.tailxxxx.ts.net:5000/api
```

CORS autorise automatiquement les origines `*.ts.net` et `100.x.y.z`.

## Endpoints principaux

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/auth/config` | non | Config publique (Google client id) |
| POST | `/api/auth/register` | non | Inscription |
| POST | `/api/auth/login` | non | Login JWT |
| POST | `/api/auth/google` | non | Login/inscription Google (ID token GIS) |
| GET | `/api/auth/me` | oui | Profil |
| GET | `/api/admin/stats` | oui | KPIs dashboard |
| GET | `/api/admin/recent-policies` | oui | Polices récentes |
| GET | `/api/admin/beneficiaries` | oui | Bénéficiaires |
| GET | `/api/admin/subscribers` | oui | Souscripteurs |
| POST | `/api/quotes` | optionnel | Créer devis |
| GET | `/api/quotes` | oui | Lister devis |
| POST | `/api/payment/intent` | oui | Intention paiement + police pending |
| POST | `/api/payment/confirm` | oui | Confirme paiement → active police |
| POST | `/api/payment/webhook/stripe` | signature | Webhook Stripe |
| POST | `/api/policy/checkout` | oui | Legacy émission immédiate |
| GET | `/api/policies` | oui | Liste polices |
| GET | `/api/policy/verify/:n` | non | Vérif hôpital |
| POST | `/api/claim/file-claim` | oui | Déposer sinistre |
| GET | `/api/claims` | oui | Liste sinistres |
| PATCH | `/api/claims/:n/status` | staff | Workflow sinistre |

## Flux paiement recommandé (phase 4)

1. `POST /api/payment/intent` → `transactionReference` + police `pending_payment`
2. Paiement gateway (ou simulation)
3. `POST /api/payment/confirm` **ou** webhook Stripe
4. Police passée `active` + notification en file SQL

`PAYMENT_SIMULATION=true` permet de confirmer sans Stripe.

## Google Identity (login social)

1. Créez un **OAuth 2.0 Client ID (Web)** dans Google Cloud Console.
2. Origines JS autorisées : `http://localhost:5173` (+ domaine prod).
3. Renseignez le **même** client id dans :
   - `server/.env` → `GOOGLE_CLIENT_ID=...`
   - `src/.env` → `VITE_GOOGLE_CLIENT_ID=...`
4. Redémarrez API + Vite. Le bouton Google apparaît sur `/login` et `/register`.
5. Apple et GitHub ont été retirés des formulaires.

## Automation (in-process)

Au démarrage de l'API (`AUTOMATION_ENABLED=true`) :
- expiration des polices dépassées
- file de rappels renouvellement J-30 / J-7 / J-1 dans `Notifications`

Variables : `AUTOMATION_ENABLED`, `AUTOMATION_INTERVAL_MINUTES` (défaut 60).

## Admin / vérification

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/admin/health-db` | staff | Diagnostic SQL + schéma |
| GET | `/api/admin/overview` | staff | Agrégats ops |
| GET | `/api/admin/verify/policy/:n` | JWT | Vérif police (masquage PII si non-staff) |
| GET | `/api/admin/verify/beneficiary?q=` | staff | Recherche bénéficiaire |
| GET | `/api/admin/audit` | staff | Journal audit |
| PATCH | `/api/admin/users/:id/role` | admin | Changer rôle |
| PATCH | `/api/admin/users/:id/active` | admin | Activer/désactiver |

UI dashboard : `/dashboard/verification`

### Outil Python (Tailscale / SQL direct)

```bash
cd tools/sql_admin
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# DB_SERVER=100.x.y.z  DB_NAME=DrcAssurancesDB  DB_USER=...  DB_PASSWORD=...
python verify_admin.py ping
python verify_admin.py schema
python verify_admin.py policy DRC-2026-xxxxx
```

Depuis la racine : `npm run db:admin:ping` / `npm run db:admin:schema`.

**Sécurité** : ne jamais committer les mots de passe ; utiliser `.env` local uniquement.
Le schéma métier ESNAS est `DrcAssurancesDB` (pas `ERP_Administration`).
