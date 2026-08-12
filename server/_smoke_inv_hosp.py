# -*- coding: utf-8 -*-
import json, random, subprocess, time, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "server"
NODE = r"C:\Program Files\nodejs\node.exe"
if not Path(NODE).exists():
    NODE = "node"
BASE = "http://127.0.0.1:5000/api"


def http(method, url, data=None, token=None, headers=None, timeout=25):
    h = {"Content-Type": "application/json", "Accept": "application/json"}
    if headers:
        h.update(headers)
    if token:
        h["Authorization"] = f"Bearer {token}"
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            ct = resp.headers.get("Content-Type", "")
            if "html" in ct or (headers or {}).get("Accept") == "text/html":
                return resp.status, raw.decode("utf-8", "replace")
            return resp.status, json.loads(raw.decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(raw) if raw.startswith("{") else raw
        except Exception:
            return e.code, raw


def kill5000():
    try:
        out = subprocess.check_output(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-NetTCPConnection -LocalPort 5000 -State Listen -EA 0 | Select -Expand OwningProcess -Unique",
            ],
            text=True,
            stderr=subprocess.DEVNULL,
            encoding="utf-8",
            errors="replace",
        )
        for line in out.splitlines():
            if line.strip().isdigit():
                subprocess.run(["taskkill", "/PID", line.strip(), "/F"], capture_output=True)
                print("killed", line.strip())
    except Exception as ex:
        print("kill skip", ex)


kill5000()
time.sleep(1)
out_log, err_log = SERVER / "_out.log", SERVER / "_err.log"
for p in (out_log, err_log):
    if p.exists():
        p.unlink()
proc = subprocess.Popen(
    [NODE, "server/index.js"],
    cwd=str(ROOT),
    stdout=open(out_log, "w", encoding="utf-8"),
    stderr=open(err_log, "w", encoding="utf-8"),
)
print("pid", proc.pid)

health = None
for _ in range(40):
    time.sleep(0.4)
    try:
        st, health = http("GET", f"{BASE}/health")
        if st == 200:
            break
    except Exception:
        pass
print("HEALTH", health)

email = f"inv{random.randint(10000,99999)}@esnas.local"
pwd = "Test1234!"
st, reg = http(
    "POST",
    f"{BASE}/auth/register",
    {"firstName": "Inv", "lastName": "User", "email": email, "password": pwd, "country": "France"},
)
print("REG", st, reg.get("success") if isinstance(reg, dict) else reg)
st, login = http("POST", f"{BASE}/auth/login", {"email": email, "password": pwd})
tok = login.get("token") if isinstance(login, dict) else None
print("LOGIN", st, bool(tok))

# promote admin for full invoice list
pr = subprocess.run(
    [NODE, "server/scripts/promoteAdmin.js", email, "admin"],
    cwd=str(ROOT),
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
)
print("PROMOTE", pr.returncode, (pr.stdout or "")[-200:])
st, login = http("POST", f"{BASE}/auth/login", {"email": email, "password": pwd})
tok = login.get("token")
print("ADMIN_ROLE", login.get("user", {}).get("role"))

# payment flow for invoice
ben = {
    "lastName": "Kabila",
    "firstName": "Marie",
    "phone": f"+24382{random.randint(1000000,9999999)}",
    "city": "Goma",
    "address": "Av Hope 2",
    "nationalID": f"ID{random.randint(10000,99999)}",
}
prod = {"branch": "Sante", "coverageLevel": "Confort", "price": 50, "name": "Pack Inv"}
st, intent = http(
    "POST",
    f"{BASE}/payment/intent",
    {"beneficiary": ben, "productDetails": prod, "gateway": "simulation", "currency": "USD"},
    token=tok,
)
print("INTENT", st, intent.get("policyNumber") if isinstance(intent, dict) else intent, intent.get("transactionReference") if isinstance(intent, dict) else "")
tx = intent.get("transactionReference")
pol = intent.get("policyNumber")
st, conf = http(
    "POST",
    f"{BASE}/payment/confirm",
    {"transactionReference": tx, "providerPayload": {"source": "smoke"}},
    token=tok,
)
print("CONFIRM", st, conf.get("success") if isinstance(conf, dict) else conf)

st, inv = http("GET", f"{BASE}/invoices?status=completed", token=tok)
print("INVOICES", st, inv.get("count") if isinstance(inv, dict) else inv, (inv.get("invoices") or [{}])[0].get("invoiceNo") if isinstance(inv, dict) and inv.get("invoices") else None)

st, one = http("GET", f"{BASE}/invoices/{tx}", token=tok)
print("INVOICE_ONE", st, one.get("invoice", {}).get("invoiceNo") if isinstance(one, dict) else one, one.get("invoice", {}).get("taxArcaUSD") if isinstance(one, dict) else None)

st, html = http("GET", f"{BASE}/invoices/{tx}/print", token=tok, headers={"Accept": "text/html"})
print("PRINT_HTML", st, isinstance(html, str), len(html) if isinstance(html, str) else 0, ("Quittance" in html) if isinstance(html, str) else False)

# hospital public
st, cfg = http("GET", f"{BASE}/hospital/config")
print("HOSP_CFG", st, cfg)

st, hv = http("GET", f"{BASE}/hospital/verify/{pol}")
print("HOSP_VERIFY", st, hv.get("valid") if isinstance(hv, dict) else hv, hv.get("policy", {}).get("careAuthorized") if isinstance(hv, dict) else None, hv.get("beneficiary", {}).get("displayName") if isinstance(hv, dict) else None)

st, bad = http("GET", f"{BASE}/hospital/verify/DRC-NOPE-00000")
print("HOSP_MISSING", st, bad.get("valid") if isinstance(bad, dict) else bad)

if err_log.exists():
    err = err_log.read_text(encoding="utf-8", errors="replace")
    if err.strip():
        print("ERR", err[-500:])
print("DONE")
