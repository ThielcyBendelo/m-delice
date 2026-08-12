#!/usr/bin/env python3
"""
Outil admin CLI — vérification SQL ESNAS / DrcAssurancesDB
Usage:
  python verify_admin.py ping
  python verify_admin.py schema
  python verify_admin.py policy DRC-2026-12345
  python verify_admin.py beneficiary --q +243
  python verify_admin.py stats
  python verify_admin.py tables
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone

from db import connect, fetch_all


def cmd_ping(_: argparse.Namespace) -> int:
    rows = fetch_all(
        "SELECT @@SERVERNAME AS ServerName, DB_NAME() AS DbName, SYSUTCDATETIME() AS UtcNow"
    )
    print(json.dumps(rows[0], default=str, indent=2, ensure_ascii=False))
    return 0


def cmd_tables(_: argparse.Namespace) -> int:
    rows = fetch_all(
        """
        SELECT t.name AS TableName, SUM(p.rows) AS ApproxRows
        FROM sys.tables t
        JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0,1)
        WHERE t.is_ms_shipped = 0
        GROUP BY t.name
        ORDER BY t.name
        """
    )
    for r in rows:
        print(f"{r['TableName']:30} {r['ApproxRows']}")
    return 0


EXPECTED = {
    "Users": [
        "UserID",
        "Email",
        "PasswordHash",
        "UserRole",
        "AuthProvider",
        "GoogleSub",
        "AvatarUrl",
        "IsActive",
    ],
    "Beneficiaries": [
        "BeneficiaryID",
        "LastName",
        "FirstName",
        "WhatsAppPhone",
        "City",
        "NationalID",
    ],
    "InsurancePolicies": [
        "PolicyID",
        "PolicyNumber",
        "BuyerID",
        "BeneficiaryID",
        "Status",
        "IsActive",
        "RemainingLimitUSD",
    ],
    "Payments": ["PaymentID", "TransactionReference", "PolicyID", "Status", "TotalPaidUSD"],
    "Claims": ["ClaimID", "ClaimNumber", "PolicyID", "ClaimStatus", "EstimatedCostUSD"],
}


def cmd_schema(_: argparse.Namespace) -> int:
    cols = fetch_all(
        """
        SELECT TABLE_NAME, COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'dbo'
        """
    )
    present: dict[str, set[str]] = {}
    for r in cols:
        present.setdefault(r["TABLE_NAME"], set()).add(r["COLUMN_NAME"])

    ok = True
    for table, need in EXPECTED.items():
        have = present.get(table, set())
        missing = [c for c in need if c not in have]
        status = "OK" if have and not missing else "MISSING"
        if status != "OK":
            ok = False
        print(f"[{status}] {table}: missing={missing or '-'}")
        if "GoogleId" in have and "GoogleSub" not in have:
            print("  WARN: colonne legacy GoogleId sans GoogleSub")
            ok = False
    return 0 if ok else 2


def cmd_policy(args: argparse.Namespace) -> int:
    rows = fetch_all(
        """
        SELECT TOP 1
          p.PolicyNumber, p.Status, p.IsActive, p.StartDate, p.EndDate,
          p.AnnualLimitUSD, p.RemainingLimitUSD, p.InsuranceBranch, p.CoverageLevel,
          b.FirstName, b.LastName, b.City, b.WhatsAppPhone, b.NationalID,
          u.Email AS BuyerEmail, u.CountryOfResidence
        FROM InsurancePolicies p
        JOIN Beneficiaries b ON b.BeneficiaryID = p.BeneficiaryID
        JOIN Users u ON u.UserID = p.BuyerID
        WHERE p.PolicyNumber = ?
        """,
        (args.policy_number,),
    )
    if not rows:
        print(json.dumps({"valid": False, "message": "introuvable"}, ensure_ascii=False))
        return 1
    r = rows[0]
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    end = r["EndDate"]
    start = r["StartDate"]
    valid = bool(r["IsActive"]) and str(r["Status"]).lower() == "active" and end >= now and start <= now
    reasons = []
    if not r["IsActive"]:
        reasons.append("is_active_false")
    if str(r["Status"]).lower() != "active":
        reasons.append("status_not_active")
    if end < now:
        reasons.append("expired")
    if start > now:
        reasons.append("not_started")
    out = {
        "valid": valid,
        "reasons": reasons,
        "policy": {
            "number": r["PolicyNumber"],
            "status": r["Status"],
            "remainingUSD": float(r["RemainingLimitUSD"] or 0),
            "branch": r["InsuranceBranch"],
            "level": r["CoverageLevel"],
            "endDate": str(r["EndDate"]),
        },
        "beneficiary": {
            "name": f"{r['LastName']} {r['FirstName']}",
            "city": r["City"],
            "phone": r["WhatsAppPhone"],
        },
        "buyerEmail": r["BuyerEmail"],
    }
    print(json.dumps(out, default=str, indent=2, ensure_ascii=False))
    return 0 if valid else 3


def cmd_beneficiary(args: argparse.Namespace) -> int:
    q = f"%{args.q}%"
    rows = fetch_all(
        """
        SELECT TOP 25
          b.BeneficiaryID, b.LastName, b.FirstName, b.WhatsAppPhone, b.City, b.NationalID,
          p.PolicyNumber, p.Status, p.IsActive, p.RemainingLimitUSD, p.EndDate
        FROM Beneficiaries b
        LEFT JOIN InsurancePolicies p ON p.BeneficiaryID = b.BeneficiaryID
        WHERE b.WhatsAppPhone LIKE ?
           OR b.NationalID LIKE ?
           OR b.LastName LIKE ?
           OR b.FirstName LIKE ?
           OR p.PolicyNumber = ?
        ORDER BY p.IsActive DESC, p.EndDate DESC
        """,
        (q, q, q, q, args.q),
    )
    print(json.dumps({"count": len(rows), "matches": rows}, default=str, indent=2, ensure_ascii=False))
    return 0


def cmd_stats(_: argparse.Namespace) -> int:
    rows = fetch_all(
        """
        SELECT
          (SELECT COUNT(*) FROM Users) AS Users,
          (SELECT COUNT(*) FROM Beneficiaries) AS Beneficiaries,
          (SELECT COUNT(*) FROM InsurancePolicies) AS Policies,
          (SELECT COUNT(*) FROM InsurancePolicies WHERE IsActive = 1 AND Status = 'active') AS ActivePolicies,
          (SELECT COUNT(*) FROM Payments WHERE Status = 'completed') AS CompletedPayments,
          (SELECT ISNULL(SUM(TotalPaidUSD),0) FROM Payments WHERE Status = 'completed') AS TotalPaidUSD,
          (SELECT COUNT(*) FROM Claims) AS Claims,
          (SELECT COUNT(*) FROM Claims WHERE ClaimStatus IN ('submitted','under_review')) AS OpenClaims
        """
    )
    print(json.dumps(rows[0], default=str, indent=2, ensure_ascii=False))
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="ESNAS SQL admin verification")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("ping", help="Test connexion SQL")
    sub.add_parser("tables", help="Liste tables + rows approx")
    sub.add_parser("schema", help="Verifie colonnes attendues")
    sub.add_parser("stats", help="KPIs globaux")

    p_pol = sub.add_parser("policy", help="Verifie une police")
    p_pol.add_argument("policy_number")

    p_ben = sub.add_parser("beneficiary", help="Recherche beneficiaire")
    p_ben.add_argument("--q", required=True, help="telephone, nom, nationalId, policy")

    args = parser.parse_args(argv)
    try:
        if args.cmd == "ping":
            return cmd_ping(args)
        if args.cmd == "tables":
            return cmd_tables(args)
        if args.cmd == "schema":
            return cmd_schema(args)
        if args.cmd == "stats":
            return cmd_stats(args)
        if args.cmd == "policy":
            return cmd_policy(args)
        if args.cmd == "beneficiary":
            return cmd_beneficiary(args)
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
