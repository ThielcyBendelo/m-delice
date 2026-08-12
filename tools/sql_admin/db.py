"""Connexion SQL Server (local / Tailscale) pour outils admin Python."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
# Charge d'abord l'env outil, puis server/.env projet
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parents[1] / "server" / ".env")
load_dotenv(ROOT.parents[1] / ".env")


def _env(name: str, default: str | None = None) -> str | None:
    v = os.getenv(name, default)
    return v if v is not None and str(v).strip() != "" else default


def build_connection_string() -> str:
    server = _env("DB_SERVER", "localhost") or "localhost"
    instance = _env("DB_INSTANCE") or _env("DB_INSTANCE_NAME") or ""
    port = _env("DB_PORT")
    database = _env("DB_NAME", "DrcAssurancesDB") or "DrcAssurancesDB"
    user = _env("DB_USER")
    password = _env("DB_PASSWORD", "")
    driver = _env("ODBC_DRIVER", "ODBC Driver 17 for SQL Server") or "ODBC Driver 17 for SQL Server"
    encrypt = (_env("DB_ENCRYPT", "no") or "no").lower()
    trust = (_env("DB_TRUST_CERT", "yes") or "yes").lower()
    trusted = (_env("DB_TRUSTED_CONNECTION", "false") or "false").lower() == "true"

    # host\instance or host,port
    if "\\" in server:
        server_part = server
    elif instance and not port:
        server_part = f"{server}\\{instance}"
    elif port:
        server_part = f"{server},{port}"
    else:
        server_part = server

    parts = [
        f"DRIVER={{{driver}}}",
        f"SERVER={server_part}",
        f"DATABASE={database}",
        f"Encrypt={'yes' if encrypt in ('1', 'true', 'yes') else 'no'}",
        f"TrustServerCertificate={'yes' if trust in ('1', 'true', 'yes') else 'no'}",
    ]
    if trusted:
        parts.append("Trusted_Connection=yes")
    else:
        if not user:
            raise RuntimeError("DB_USER requis (ou DB_TRUSTED_CONNECTION=true)")
        parts.append(f"UID={user}")
        parts.append(f"PWD={password or ''}")
    return ";".join(parts)


def connect():
    import pyodbc

    conn_str = build_connection_string()
    # Ne jamais logger le mot de passe
    safe = conn_str
    if "PWD=" in safe:
        import re

        safe = re.sub(r"PWD=[^;]*", "PWD=***", safe)
    print(f"[sql_admin] connect -> {safe}")
    return pyodbc.connect(conn_str, timeout=int(_env("DB_CONNECT_TIMEOUT", "30") or "30"))


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with connect() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        cols = [c[0] for c in cur.description] if cur.description else []
        return [dict(zip(cols, row)) for row in cur.fetchall()]


def execute(sql: str, params: tuple[Any, ...] = ()) -> int:
    with connect() as conn:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        return cur.rowcount
