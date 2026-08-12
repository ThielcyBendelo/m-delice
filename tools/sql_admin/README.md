# SQL Admin (Python) — ESNAS / DrcAssurancesDB

Outil de **vérification administrative** hors navigateur, compatible **local** et **Tailscale** (`100.x` / `*.ts.net`).

## Installation

```bash
cd tools/sql_admin
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Éditer DB_SERVER / DB_USER / DB_PASSWORD
```

Prérequis Windows : **ODBC Driver 17 or 18 for SQL Server**.

## Commandes

```bash
python verify_admin.py ping
python verify_admin.py schema
python verify_admin.py tables
python verify_admin.py stats
python verify_admin.py policy DRC-2026-12345
python verify_admin.py beneficiary --q +24381
```

## Tailscale

Dans `.env` :

```env
DB_SERVER=100.x.y.z
# ou
DB_SERVER=mon-pc.tailxxxx.ts.net
DB_INSTANCE=SQLEXPRESS
# si port TCP fixe :
# DB_PORT=1433
# DB_INSTANCE=
```

SQL Server doit écouter sur TCP et le firewall / Tailscale ACL doit autoriser le port.

## Sécurité

- **Ne jamais** committer `tools/sql_admin/.env`
- Ne pas coller de mots de passe dans le code source
- Préférer un login SQL dédié (`esnas_app`) avec droits limités sur `DrcAssurancesDB`
