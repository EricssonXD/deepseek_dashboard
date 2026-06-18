#!/usr/bin/env python3


"""Static file server + DeepSeek API proxy. Zero dependencies beyond stdlib.

Fetches the export ZIP from DeepSeek which contains two CSVs:
  - amount-YYYY-M.csv  — per-key, per-model, per-type token usage (price + amount)
  - cost-YYYY-M.csv    — per-key, per-model daily cost totals

The amount CSV has api_key + api_key_name columns — perfect match for the
frontend's per-key dashboard views (bar chart, line chart, key table).
"""
import csv
import http.server
import io
import json
import urllib.request
import urllib.parse
import zipfile
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent
EXPORT_URL = "https://platform.deepseek.com/api/v0/usage/export"
SUMMARY_URL = "https://platform.deepseek.com/api/v0/users/get_user_summary"
TOKEN_FILE = ROOT / ".token"

CSV_COLS = ["utc_date", "model", "api_key", "api_key_name", "type", "price", "amount", "cost"]


def _log(msg):
    print(f"[server] {msg}", file=sys.stderr, flush=True)


def _api_fetch(url: str, token: str) -> bytes:
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def _parse_summary(raw: str) -> dict:
    try:
        data = json.loads(raw)
        biz = data.get("data", {}).get("biz_data", {})
        wallets = biz.get("normal_wallets", [])
        balance = float(wallets[0].get("balance", 0)) if wallets else 0
        costs = biz.get("monthly_costs", [])
        month_cost = float(costs[0].get("amount", 0)) if costs else 0
        return {"balance": balance, "monthly_cost": month_cost}
    except Exception:
        return {}


def _normalize_cost_csv(raw: str, key_lookup: dict) -> str:
    """Transform the export cost CSV to match frontend's expected columns.

    Export cost CSV: user_id,utc_date,model,wallet_type,cost,currency
    Expected:        utc_date,model,api_key,api_key_name,type,price,amount,cost

    We add api_key/api_key_name by looking up user_id in key_lookup,
    and fill type/price/amount with defaults.
    """
    reader = csv.DictReader(io.StringIO(raw))
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_COLS)
    writer.writeheader()

    for row in reader:
        uid = row.get("user_id", "")
        masked, name = key_lookup.get(uid, ("N/A", "N/A"))
        writer.writerow({
            "utc_date": row.get("utc_date", ""),
            "model": row.get("model", ""),
            "api_key": masked,
            "api_key_name": name,
            "type": "cost",
            "price": "0",
            "amount": "0",
            "cost": row.get("cost", "0"),
        })
    return buf.getvalue()


def _process_export(zip_bytes: bytes) -> tuple:
    """Extract amount + cost CSVs from the export ZIP.

    Returns (cost_csv, amount_csv) strings matching frontend CSV_COLS format.
    """
    cost_raw = ""
    amount_raw = ""
    key_lookup = {}  # user_id -> (api_key_masked, api_key_name)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            content = zf.read(name).decode("utf-8-sig")  # handle BOM
            if "amount" in name.lower():
                amount_raw = content
                # Build key lookup from amount CSV
                reader = csv.DictReader(io.StringIO(content))
                for row in reader:
                    uid = row.get("user_id", "")
                    if uid and uid not in key_lookup:
                        key_lookup[uid] = (
                            row.get("api_key", uid),
                            row.get("api_key_name", uid),
                        )
            elif "cost" in name.lower():
                cost_raw = content

    if not amount_raw:
        return "", ""

    # Amount CSV from export has columns:
    #   user_id,utc_date,model,api_key_name,api_key,type,price,amount
    # Drop user_id column, everything else matches CSV_COLS (cost is computed).
    reader = csv.DictReader(io.StringIO(amount_raw))
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=CSV_COLS)
    writer.writeheader()
    for row in reader:
        writer.writerow({
            "utc_date": row.get("utc_date", ""),
            "model": row.get("model", ""),
            "api_key": row.get("api_key", ""),
            "api_key_name": row.get("api_key_name", ""),
            "type": row.get("type", ""),
            "price": row.get("price", "0"),
            "amount": row.get("amount", "0"),
            "cost": "0",  # computed by frontend: price * amount
        })
    amount_csv = buf.getvalue()

    # Normalize cost CSV
    cost_csv = _normalize_cost_csv(cost_raw, key_lookup) if cost_raw else ""

    return cost_csv, amount_csv


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    _stored_token = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path == "/api/fetch":
            self._handle_fetch()
        elif self.path == "/api/set-token":
            self._handle_set_token()
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path == "/api/get-token":
            self._handle_get_token()
        else:
            super().do_GET()

    def _handle_set_token(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            token = body.get("token", "").strip()
        except Exception:
            self._json({"error": "Invalid request"}, 400)
            return
        if not token:
            self._json({"error": "Token required"}, 400)
            return
        if token.lower().startswith("bearer "):
            token = token[7:].strip()
        ProxyHandler._stored_token = token
        try:
            TOKEN_FILE.write_text(token)
        except Exception as e:
            _log(f"failed to persist token: {e}")
        _log(f"token set (prefix: {token[:10]}..., len={len(token)})")
        self._json({"ok": True, "prefix": token[:20] + "..."})

    def _handle_get_token(self):
        if ProxyHandler._stored_token:
            self._json({"token": ProxyHandler._stored_token,
                        "prefix": ProxyHandler._stored_token[:20] + "..."})
        else:
            self._json({"token": None})

    def _handle_fetch(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            month = str(body.get("month", 1))
            year = str(body.get("year", 2026))
        except Exception:
            self._json({"error": "Invalid request body"}, 400)
            return

        token = ProxyHandler._stored_token
        if not token:
            self._json({"error": "No token stored. Use bookmarklet or paste token first."}, 400)
            return

        _log(f"fetching export {year}-{month}...")

        # Fetch export ZIP + summary
        try:
            zip_bytes = _api_fetch(f"{EXPORT_URL}?month={month}&year={year}", token)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            self._json({"error": f"DeepSeek export {e.code}: {body[:300]}"}, 502)
            return
        except Exception as e:
            self._json({"error": f"Export fetch failed: {str(e)}"}, 502)
            return

        cost_csv, amount_csv = _process_export(zip_bytes)

        # Fetch summary for wallet balance
        summary = {}
        try:
            raw = _api_fetch(SUMMARY_URL, token).decode("utf-8")
            summary = _parse_summary(raw)
        except Exception as e:
            _log(f"summary fetch failed (non-fatal): {e}")

        amt_lines = len(amount_csv.splitlines()) if amount_csv else 0
        cost_lines = len(cost_csv.splitlines()) if cost_csv else 0
        keys_found = len(set(
            r["api_key_name"] for r in csv.DictReader(io.StringIO(amount_csv))
        )) if amount_csv else 0

        _log(f"export: {keys_found} keys, {amt_lines} amount rows, {cost_lines} cost rows  "
             f"balance=${summary.get('balance', 0):.2f}")

        self._json({
            "cost": cost_csv,
            "amount": amount_csv,
            "balance": summary.get("balance", 0),
            "monthly_cost": summary.get("monthly_cost", 0),
        })

    def _json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765

    if TOKEN_FILE.exists():
        try:
            persisted = TOKEN_FILE.read_text().strip()
            if persisted:
                ProxyHandler._stored_token = persisted
                _log(f"restored token from .token (prefix: {persisted[:10]}...)")
        except Exception as e:
            _log(f"failed to restore token: {e}")

    server = http.server.HTTPServer(("0.0.0.0", port), ProxyHandler)
    print(f"Server running at http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()
